/*
 * Heatpump Flow Card
 * Animated hydraulic schematic for air-to-water heat pumps in Home Assistant:
 * power sources (PV / battery / grid) → heat pump → diverter valve → DHW tank / buffer → heating circuit.
 * Vendor-neutral core with presets: Lambda (lambda_heat_pumps), Viessmann (ViCare), Vaillant (myPyllant).
 *
 * https://github.com/Sturmi77/heatpump-flow-card · MIT License
 */
const HFC_VERSION = '0.2.0';

/* ------------------------------------------------------------------ */
/* Presets                                                             */
/* ------------------------------------------------------------------ */
// A preset maps a heat pump integration onto the card:
//   detect(ctx)                → prefix (string, may be '') or undefined when the integration is not present
//   entities(prefix, idx, ctx) → { key: entity_id | [candidates…] }  (first existing candidate wins)
//   errors(prefix, idx, ctx)   → error sensors (numeric ≠ 0 or binary "on" shows the error chip)
//   *_mode_map                 → raw state → normalized mode
// ctx.key(platform, domain, translation_key) finds entities via the entity registry (language-independent),
// ctx.match(regex, platform) finds the first entity id matching a pattern.
const HFC_PRESETS = {
  lambda: {
    name: 'Lambda (lambda_heat_pumps)',
    // Legacy naming: sensor.<prefix>_hp1_…; new naming (no prefix): sensor.hp1_…
    detect: (ctx) => {
      const re = new RegExp(`^sensor\\.(?:(.+)_)?hp${ctx.idx.hp}_operating_state$`);
      const id = ctx.ids.find((e) => re.test(e));
      return id === undefined ? undefined : (id.match(re)[1] || '');
    },
    entities: (p, i) => {
      const x = p ? `${p}_` : '';
      const hp = `sensor.${x}hp${i.hp}`;
      const boil = `sensor.${x}boil${i.dhw}`;
      const buff = `sensor.${x}buff${i.buffer}`;
      const hc = `sensor.${x}hc${i.hc}`;
      return {
        mode: `${hp}_operating_state`,
        status: `${hp}_state`,
        power: `${hp}_inverter_power_consumption`,
        heat: `${hp}_actual_heating_capacity`,
        flow: `${hp}_flow_line_temperature`,
        return: `${hp}_return_line_temperature`,
        volume: `${hp}_volume_flow_heat_sink`,
        source_volume: `${hp}_volume_flow_energy_source`,
        source_in: `${hp}_energy_source_inlet_temperature`,
        outdoor: `sensor.${x}ambient_temperature_calculated`,
        dhw_top: `${boil}_actual_high_temperature`,
        dhw_bottom: `${boil}_actual_low_temperature`,
        dhw_target: `${boil}_target_high_temperature`,
        dhw_mode: `${boil}_operating_state`,
        circulation: `${boil}_actual_circulation_pump_state`,
        buffer_top: `${buff}_actual_high_temperature`,
        buffer_bottom: `${buff}_actual_low_temperature`,
        buffer_mode: `${buff}_operating_state`,
        hc_flow: `${hc}_flow_line_temperature`,
        hc_return: `${hc}_return_line_temperature`,
        hc_setpoint: `${hc}_flow_line_temperature_setpoint`,
        hc_mode: `${hc}_operating_state`,
        room: `${hc}_room_device_temperature`,
        room_target: `${hc}_target_room_temperature`,
        cop_heating_today: `${hp}_heating_cop_daily`,
        cop_dhw_today: `${hp}_hot_water_cop_daily`,
        starts_today: `${hp}_compressor_start_cycling_daily`,
      };
    },
    errors: (p, i) => {
      const x = p ? `${p}_` : '';
      return [`sensor.${x}hp${i.hp}_error_number`, `sensor.${x}boil${i.dhw}_error_number`,
        `sensor.${x}buff${i.buffer}_error_number`, `sensor.${x}hc${i.hc}_error_number`, `sensor.${x}ambient_error_number`];
    },
    mode_map: {
      STBY: 'idle', CH: 'heating', DHW: 'dhw', CC: 'cooling', DEFROST: 'defrost',
      'TIME-BLOCK': 'blocked', 'RESTART-BLOCK': 'blocked', 'STBY-FROST': 'frost',
      CIRCULATE: 'circulate', OFF: 'off',
    },
    dhw_mode_map: { STBY: 'idle', DHW: 'dhw', LEGIO: 'legionella', 'TRAILING-STOP': 'trailing', OFF: 'off' },
    buffer_mode_map: { STBY: 'idle', HEATING: 'heating', COOLING: 'cooling', OFF: 'off' },
    hc_mode_map: { HEATING: 'heating', ECO: 'heating', COOLING: 'cooling', STBY: 'idle', OFF: 'off' },
    running_states: ['START COMPRESSOR', 'PRE-REGULATION', 'REGULATION', 'DEFROSTING'],
    status_labels: {
      de: {
        READY: 'bereit', 'START PUMPS': 'Pumpen starten', 'START COMPRESSOR': 'Verdichter startet',
        'PRE-REGULATION': 'Vorregelung', REGULATION: 'Regelung', STOPPING: 'stoppt',
        'RESTART-BLOCK': 'Wiederanlaufsperre', REFERENCE: 'Referenzfahrt', DEFROSTING: 'Abtauen',
      },
      en: {
        READY: 'ready', 'START PUMPS': 'starting pumps', 'START COMPRESSOR': 'starting compressor',
        'PRE-REGULATION': 'pre-regulation', REGULATION: 'regulating', STOPPING: 'stopping',
        'RESTART-BLOCK': 'restart block', REFERENCE: 'reference run', DEFROSTING: 'defrosting',
      },
    },
  },

  // Viessmann Vitocal via the core ViCare integration. Entities are found by translation_key,
  // so entity ids and the HA language do not matter. Restrict to one device with `device:`.
  vicare: {
    name: 'Viessmann (ViCare)',
    detect: (ctx) => (ctx.key('vicare', 'sensor', 'outside_temperature') || ctx.key('vicare', 'binary_sensor', 'compressor') ? '' : undefined),
    entities: (p, i, ctx) => {
      const s = (...tks) => tks.map((tk) => ctx.key('vicare', 'sensor', tk)).filter(Boolean);
      const b = (tk) => ctx.key('vicare', 'binary_sensor', tk);
      return {
        mode: s('compressor_phase'),
        compressor: b('compressor'),
        valve: b('domestic_hot_water_charging'),
        flow: s('secondary_circuit_supply_temperature', 'supply_temperature'),
        return: s('secondary_circuit_return_temperature', 'return_temperature'),
        volume: s('volumetric_flow'),
        source_in: s('primary_circuit_supply_temperature'),
        outdoor: s('outside_temperature'),
        dhw_top: s('dhw_storage_top_temperature', 'dhw_storage_temperature'),
        dhw_bottom: s('dhw_storage_bottom_temperature'),
        circulation: b('domestic_hot_water_circulation_pump'),
        buffer_top: s('buffer_top_temperature', 'buffer_main_temperature'),
        buffer_bottom: s('buffer_bottom_temperature'),
        hc_pump: b('circulation_pump'),
        cop_heating_today: s('cop_heating'),
        cop_dhw_today: s('cop_dhw'),
        energy_today: s('power_consumption_today'),
        starts_today: s('compressor_starts'),
      };
    },
    mode_map: {
      heating: 'heating', cooling: 'cooling', defrost: 'defrost', passive_defrost: 'defrost',
      pause: 'idle', ready: 'idle', preparing: 'idle', off: 'off',
    },
    stat_labels: {
      cop_heating_today: { de: 'COP Heizen', en: 'COP heating' },
      cop_dhw_today: { de: 'COP Warmwasser', en: 'COP DHW' },
      starts_today: { de: 'Verdichterstarts', en: 'Compressor starts' },
    },
  },

  // Vaillant aroTHERM via myPyllant (HACS). Names are fixed English strings prefixed with the
  // home name, so entity ids follow sensor.<home>_…; indices start at 0 (circuit_0, domestic_hot_water_0).
  vaillant: {
    name: 'Vaillant (myPyllant)',
    index: { hc: 0, dhw: 0 },
    detect: (ctx) => {
      const id = ctx.match(/^sensor\.(.+)_energy_manager_state$/, 'mypyllant')
        || ctx.match(/^sensor\.(.+)_system_flow_temperature$/, 'mypyllant');
      return id === undefined ? undefined : id.replace(/^sensor\./, '').replace(/_(energy_manager_state|system_flow_temperature)$/, '');
    },
    entities: (p, i, ctx) => {
      const s = `sensor.${p}`;
      const m = (re) => ctx.match(re, 'mypyllant');
      return {
        mode: `${s}_energy_manager_state`,
        flow: `${s}_system_flow_temperature`,
        outdoor: `${s}_outdoor_temperature`,
        power: m(new RegExp(`^sensor\\.${p}_device_\\d+.*_current_power$`)),
        dhw_top: [`${s}_domestic_hot_water_${i.dhw}_tank_temperature`, `${s}_top_dhw_cylinder_temperature`],
        dhw_bottom: `${s}_bottom_dhw_cylinder_temperature`,
        dhw_target: `${s}_domestic_hot_water_${i.dhw}_setpoint`,
        buffer_top: `${s}_top_central_heating_cylinder_temperature`,
        buffer_bottom: `${s}_bottom_central_heating_cylinder_temperature`,
        hc_flow: `${s}_circuit_${i.hc}_current_flow_temperature`,
        hc_setpoint: `${s}_circuit_${i.hc}_flow_temperature_setpoint`,
        hc_mode: `${s}_circuit_${i.hc}_state`,
        room: m(new RegExp(`^sensor\\.${p}_zone_.+_current_temperature$`)),
        room_target: m(new RegExp(`^sensor\\.${p}_zone_.+_desired_temperature$`)),
        cop_heating_today: m(new RegExp(`^sensor\\.${p}.*_heating_energy_efficiency$`)),
      };
    },
    errors: (p, i, ctx) => [ctx.match(new RegExp(`^binary_sensor\\.${p}.*_trouble_codes$`), 'mypyllant')].filter(Boolean),
    mode_map: { STANDBY: 'idle', DHW: 'dhw', HEATING: 'heating', COOLING: 'cooling' },
    hc_mode_map: { HEATING: 'heating', COOLING: 'cooling', STANDBY: 'idle' },
    stat_labels: { cop_heating_today: { de: 'Effizienz Heizen', en: 'Heating efficiency' } },
  },
};

/* ------------------------------------------------------------------ */
/* Translations                                                        */
/* ------------------------------------------------------------------ */
const HFC_I18N = {
  en: {
    title: 'Heat pump', heat_pump: 'Heat pump', dhw: 'Hot water', buffer: 'Buffer', heating_circuit: 'Heating circuit',
    house: 'Rooms', running: 'running', compressor_off: 'Compressor off', source_in: 'Air inlet', outdoor: 'Outdoor',
    source_flow: 'Source', target: 'Target', bottom: 'bottom', error: 'Error', circulation: 'Circ.', valve_dhw: 'DHW',
    valve_heating: 'Heating', valve_cooling: 'Cooling', pv: 'PV', battery: 'Battery', grid: 'Grid',
    stat_cop_heating: 'COP heating today', stat_cop_dhw: 'COP DHW today', stat_energy: 'Energy today',
    stat_starts: 'Starts today', stat_spread: 'Spread', stat_volume: 'Flow rate', stat_heat: 'Heat output', pv_share: 'PV',
    modes: {
      idle: 'Standby', heating: 'Heating', dhw: 'Hot water', cooling: 'Cooling', defrost: 'Defrost', blocked: 'Blocked',
      frost: 'Frost protection', circulate: 'Circulating', off: 'Off', legionella: 'Legionella', trailing: 'Run-on',
    },
  },
  de: {
    title: 'Wärmepumpe', heat_pump: 'Wärmepumpe', dhw: 'Warmwasser', buffer: 'Puffer', heating_circuit: 'Heizkreis',
    house: 'Wohnräume', running: 'läuft', compressor_off: 'Verdichter aus', source_in: 'Luft-Eintritt', outdoor: 'Außen',
    source_flow: 'Quelle', target: 'Soll', bottom: 'unten', error: 'Fehler', circulation: 'Zirk.', valve_dhw: 'WW',
    valve_heating: 'Heizen', valve_cooling: 'Kühlen', pv: 'PV', battery: 'Akku', grid: 'Netz',
    stat_cop_heating: 'COP Heizen heute', stat_cop_dhw: 'COP WW heute', stat_energy: 'Strom heute',
    stat_starts: 'Starts heute', stat_spread: 'Spreizung', stat_volume: 'Volumenstrom', stat_heat: 'Wärmeleistung', pv_share: 'PV',
    modes: {
      idle: 'Bereit', heating: 'Heizen', dhw: 'Warmwasser', cooling: 'Kühlen', defrost: 'Abtauen', blocked: 'Sperrzeit',
      frost: 'Frostschutz', circulate: 'Umwälzen', off: 'Aus', legionella: 'Legionellenschutz', trailing: 'Nachlauf',
    },
  },
};

const HFC_EDITOR = {
  en: {
    preset: 'Preset', prefix: 'Prefix (empty = auto-detect)', device: 'Device (optional, restricts the preset)',
    title: 'Title', language: 'Language', power_threshold: 'Running above (W)', hc_type: 'Heat emitter',
    hc_underfloor: 'Underfloor heating', hc_radiator: 'Radiators',
    sec_hp: 'Heat pump', sec_storage: 'Storage', sec_hc: 'Heating circuit & house', sec_power: 'Power sources', sec_stats: 'Statistics',
    mode: 'Operating mode', status: 'Status / sub-state', compressor: 'Compressor running (binary)', power: 'Electrical power',
    heat: 'Heat output', flow: 'Flow temperature', return: 'Return temperature', volume: 'Flow rate heating side',
    source_volume: 'Flow rate source side', source_in: 'Source / air inlet temperature', outdoor: 'Outdoor temperature',
    valve: 'Diverter valve on DHW (binary)',
    dhw_top: 'DHW tank top', dhw_bottom: 'DHW tank bottom', dhw_target: 'DHW target', dhw_mode: 'DHW mode',
    circulation: 'Circulation pump', buffer_top: 'Buffer top', buffer_bottom: 'Buffer bottom', buffer_mode: 'Buffer mode',
    hc_flow: 'Circuit flow temperature', hc_return: 'Circuit return temperature', hc_setpoint: 'Circuit flow target',
    hc_mode: 'Circuit mode', hc_pump: 'Circuit pump running (binary)', hc_volume: 'Circuit flow rate',
    room: 'Room temperature', room_target: 'Room target',
    pv: 'Power from PV (W)', battery: 'Power from battery (W)', grid: 'Power from grid (W)',
    cop_heating_today: 'COP heating today', cop_dhw_today: 'COP DHW today', energy_today: 'Energy today (kWh)',
    pv_share_today: 'PV share today (%)', starts_today: 'Compressor starts today',
  },
  de: {
    preset: 'Voreinstellung', prefix: 'Präfix (leer = automatisch erkennen)', device: 'Gerät (optional, schränkt die Voreinstellung ein)',
    title: 'Titel', language: 'Sprache', power_threshold: 'Läuft ab (W)', hc_type: 'Wärmeabgabe',
    hc_underfloor: 'Flächenheizung', hc_radiator: 'Heizkörper',
    sec_hp: 'Wärmepumpe', sec_storage: 'Speicher', sec_hc: 'Heizkreis & Haus', sec_power: 'Stromquellen', sec_stats: 'Kennzahlen',
    mode: 'Betriebsart', status: 'Status / Unterzustand', compressor: 'Verdichter läuft (binär)', power: 'Leistungsaufnahme',
    heat: 'Wärmeleistung', flow: 'Vorlauftemperatur', return: 'Rücklauftemperatur', volume: 'Volumenstrom Heizseite',
    source_volume: 'Volumenstrom Quelle', source_in: 'Quelle / Luft-Eintritt', outdoor: 'Außentemperatur',
    valve: 'Umschaltventil auf WW (binär)',
    dhw_top: 'WW-Speicher oben', dhw_bottom: 'WW-Speicher unten', dhw_target: 'WW-Soll', dhw_mode: 'WW-Betriebsart',
    circulation: 'Zirkulationspumpe', buffer_top: 'Puffer oben', buffer_bottom: 'Puffer unten', buffer_mode: 'Puffer-Betriebsart',
    hc_flow: 'Heizkreis-Vorlauf', hc_return: 'Heizkreis-Rücklauf', hc_setpoint: 'Heizkreis-Vorlauf-Soll',
    hc_mode: 'Heizkreis-Betriebsart', hc_pump: 'Heizkreispumpe läuft (binär)', hc_volume: 'Volumenstrom Heizkreis',
    room: 'Raumtemperatur', room_target: 'Raum-Soll',
    pv: 'Strom aus PV (W)', battery: 'Strom aus Akku (W)', grid: 'Strom aus Netz (W)',
    cop_heating_today: 'COP Heizen heute', cop_dhw_today: 'COP WW heute', energy_today: 'Strom heute (kWh)',
    pv_share_today: 'PV-Anteil heute (%)', starts_today: 'Verdichterstarts heute',
  },
};

const HFC_ENTITY_GROUPS = {
  sec_hp: ['mode', 'status', 'compressor', 'power', 'heat', 'flow', 'return', 'volume', 'source_volume', 'source_in', 'outdoor', 'valve'],
  sec_storage: ['dhw_top', 'dhw_bottom', 'dhw_target', 'dhw_mode', 'circulation', 'buffer_top', 'buffer_bottom', 'buffer_mode'],
  sec_hc: ['hc_flow', 'hc_return', 'hc_setpoint', 'hc_mode', 'hc_pump', 'hc_volume', 'room', 'room_target'],
  sec_power: ['pv', 'battery', 'grid'],
  sec_stats: ['cop_heating_today', 'cop_dhw_today', 'energy_today', 'pv_share_today', 'starts_today'],
};
const HFC_BINARY_KEYS = ['compressor', 'valve', 'hc_pump', 'circulation'];

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */
class HeatpumpFlowCard extends HTMLElement {
  static _ctx(hass, device, idx) {
    const states = hass?.states || {};
    const reg = hass?.entities || {};
    const ids = Object.keys(states);
    const onDevice = (e) => !device || reg[e]?.device_id === device;
    return {
      ids,
      idx,
      key: (platform, domain, tk) => ids.find((e) => e.startsWith(`${domain}.`) && reg[e]?.platform === platform
        && reg[e]?.translation_key === tk && onDevice(e)),
      // Without a registry entry (YAML entities) the platform cannot be checked; accept the pattern match.
      match: (re, platform) => ids.find((e) => re.test(e) && (!reg[e] || !platform || reg[e].platform === platform) && onDevice(e)),
    };
  }

  static getStubConfig(hass) {
    for (const [name, preset] of Object.entries(HFC_PRESETS)) {
      const ctx = HeatpumpFlowCard._ctx(hass, undefined, { hp: 1, dhw: 1, buffer: 1, hc: 1, ...(preset.index || {}) });
      if (hass && preset.detect(ctx) !== undefined) return { preset: name };
    }
    return { preset: 'lambda' };
  }

  static getConfigForm() {
    const lang = (document.querySelector('home-assistant')?.hass?.locale?.language || navigator.language || 'en').slice(0, 2);
    const L = HFC_EDITOR[lang] || HFC_EDITOR.en;
    const entitySchema = (key) => ({
      name: key,
      selector: { entity: HFC_BINARY_KEYS.includes(key) ? { domain: ['binary_sensor', 'switch', 'input_boolean', 'sensor'] } : {} },
    });
    return {
      schema: [
        {
          name: 'preset',
          selector: { select: { mode: 'dropdown', options: [{ value: 'none', label: '—' }, ...Object.entries(HFC_PRESETS).map(([k, p]) => ({ value: k, label: p.name }))] } },
        },
        {
          type: 'grid', name: '', schema: [
            { name: 'prefix', selector: { text: {} } },
            { name: 'device', selector: { device: {} } },
            { name: 'title', selector: { text: {} } },
            { name: 'language', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'Auto' }, { value: 'de', label: 'Deutsch' }, { value: 'en', label: 'English' }] } } },
            { name: 'hc_type', selector: { select: { mode: 'dropdown', options: [{ value: 'underfloor', label: L.hc_underfloor }, { value: 'radiator', label: L.hc_radiator }] } } },
            { name: 'power_threshold', selector: { number: { min: 0, max: 2000, step: 10, mode: 'box', unit_of_measurement: 'W' } } },
          ],
        },
        ...Object.entries(HFC_ENTITY_GROUPS).map(([sec, keys]) => ({
          type: 'expandable', name: 'entities', title: L[sec], schema: keys.map(entitySchema),
        })),
      ],
      computeLabel: (s) => L[s.name] || s.name,
    };
  }

  setConfig(config) {
    if (!config) throw new Error('Invalid configuration');
    if (config.preset && config.preset !== 'none' && !HFC_PRESETS[config.preset]) {
      throw new Error(`Unknown preset "${config.preset}". Available: ${Object.keys(HFC_PRESETS).join(', ')}`);
    }
    if (config.hc_type && !['underfloor', 'radiator'].includes(config.hc_type)) {
      throw new Error('hc_type must be "underfloor" or "radiator"');
    }
    this._config = config;
    const preset = HFC_PRESETS[config.preset];
    this._preset = preset;
    this._idx = { hp: 1, dhw: 1, buffer: 1, hc: 1, ...(preset?.index || {}), ...(config.index || {}) };
    this._maps = {
      mode: { ...(preset?.mode_map || {}), ...(config.mode_map || {}) },
      dhw: { ...(preset?.dhw_mode_map || {}), ...(config.dhw_mode_map || {}) },
      buffer: { ...(preset?.buffer_mode_map || {}), ...(config.buffer_mode_map || {}) },
      hc: { ...(preset?.hc_mode_map || {}), ...(config.hc_mode_map || {}) },
    };
    this._runningStates = config.running_states || preset?.running_states || [];
    this._statusLabels = preset?.status_labels || {};
    this._statLabels = preset?.stat_labels || {};
    this._badges = config.badges || [];
    this._hcType = config.hc_type || preset?.hc_type || 'underfloor';
    this._threshold = Number.isFinite(+config.power_threshold) && config.power_threshold !== '' && config.power_threshold !== undefined ? +config.power_threshold : 100;
    this._needsBuild = true;
    this._lastTry = 0;
    this._rendered = false;
    this._e = this._e || {};
    this._errors = this._errors || [];
    if (this.shadowRoot && this._hass) { this._build(); this._render(); this._update(); }
  }

  // Resolves preset + user entities. Needs hass for detection and registry lookups.
  _build() {
    const config = this._config;
    const preset = this._preset;
    const ctx = HeatpumpFlowCard._ctx(this._hass, config.device, this._idx);
    let prefix = config.prefix;
    let ready = true;
    if (preset && (prefix === undefined || prefix === null || prefix === '' || prefix === 'auto')) {
      prefix = preset.detect ? preset.detect(ctx) : '';
      if (prefix === undefined) { prefix = ''; ready = false; }
    }
    prefix = String(prefix || '').trim().toLowerCase();
    const raw = preset ? preset.entities(prefix, this._idx, ctx) : {};
    const e = {};
    Object.entries(raw).forEach(([k, v]) => {
      const list = (Array.isArray(v) ? v : [v]).filter(Boolean);
      const hit = list.find((id) => this._hass.states[id]) || list[0];
      if (hit) e[k] = hit;
    });
    // User entities override the preset; null or "none" removes a preset entity, an empty editor field keeps it.
    Object.entries(config.entities || {}).forEach(([k, v]) => {
      if (v === null || v === 'none') delete e[k];
      else if (v) e[k] = v;
    });
    this._e = e;
    this._errors = config.errors || (preset && preset.errors ? preset.errors(prefix, this._idx, ctx) : []);
    this._needsBuild = !ready;
    this._lastTry = Date.now();
  }

  getCardSize() { return 9; }
  getGridOptions() { return { columns: 'full', min_columns: 6, rows: 'auto' }; }

  set hass(hass) {
    this._hass = hass;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._config) return;
    // Retry detection at most every 30 s while the integration's entities are not there yet.
    if (this._needsBuild && (!this._rendered || Date.now() - this._lastTry > 30000)) { this._build(); this._rendered = false; }
    const sig = this._layoutSignature();
    if (!this._rendered || sig !== this._sig) this._render();
    this._update();
  }

  /* ---------- helpers ---------- */
  get _lang() {
    const l = this._config?.language && this._config.language !== 'auto'
      ? this._config.language : (this._hass?.locale?.language || this._hass?.language || 'en');
    return HFC_I18N[l.slice(0, 2)] ? l.slice(0, 2) : 'en';
  }
  get _i() { return HFC_I18N[this._lang]; }
  _st(key) { const id = this._e[key]; return id && this._hass ? this._hass.states[id] : undefined; }
  _has(key) { return !!this._st(key); }
  _s(key) { return this._st(key)?.state; }
  _n(key) { const v = parseFloat(this._s(key)); return Number.isFinite(v) ? v : NaN; }
  _unit(key) { return String(this._st(key)?.attributes?.unit_of_measurement || '').toLowerCase(); }
  // Unit-aware readings: power in W, heat in kW, flow rates in l/h.
  _w(key) { const v = this._n(key); return this._unit(key) === 'kw' ? v * 1000 : v; }
  _kw(key) { const v = this._n(key); return this._unit(key) === 'w' ? v / 1000 : v; }
  _lh(key) {
    const v = this._n(key); const u = this._unit(key).replace('³', '3');
    if (u === 'm3/h') return v * 1000;
    if (u === 'l/min') return v * 60;
    return v;
  }
  _on(key) { return ['on', 'true', 'open', '1'].includes(String(this._s(key)).toLowerCase()); }
  _norm(map, raw) { if (raw === undefined) return ''; return map[raw] || map[String(raw).toUpperCase()] || map[String(raw).toLowerCase()] || String(raw).toLowerCase(); }
  _fmt(v, d = 1) {
    const loc = this._hass?.locale?.language || this._lang;
    return Number.isFinite(v) ? v.toLocaleString(loc, { minimumFractionDigits: d, maximumFractionDigits: d }) : '–';
  }
  _t(v) { return Number.isFinite(v) ? `${this._fmt(v)} °C` : '– °C'; }
  _modeLabel(m, raw) { return this._i.modes[m] || raw || '–'; }
  _statLabel(key, fallback) { return this._statLabels[key]?.[this._lang] || fallback; }
  // Colour scales follow hydraulic convention: flow red/orange, return blue, tanks blue (cold) → red (hot).
  _mix(a, b, t, lo, hi) {
    if (!Number.isFinite(t)) return 'var(--disabled-text-color, #9e9e9e)';
    const f = Math.min(Math.max((t - lo) / (hi - lo), 0), 1);
    return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * f)).join(',')})`;
  }
  _tankColor(t) { return this._mix([59, 130, 246], [239, 68, 68], t, 20, 58); }
  // Pipes without a temperature sensor keep their conventional base colour instead of turning grey.
  _vlColor(t) { return Number.isFinite(t) ? this._mix([251, 146, 60], [220, 38, 38], t, 25, 55) : '#fdba74'; }
  _rlColor(t) { return Number.isFinite(t) ? this._mix([125, 211, 252], [37, 99, 235], t, 20, 45) : '#93c5fd'; }
  _$(id) { return this.shadowRoot.getElementById(id); }
  _txt(id, text) { const el = this._$(id); if (el && el.textContent !== text) el.textContent = text; }
  _cls(id, on) { const el = this._$(id); if (el) el.classList.toggle('on', !!on); }
  _esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  // Which optional blocks exist – the SVG is rebuilt only when this changes.
  _layoutSignature() {
    if (!this._hass || !this._e) return '';
    const parts = {
      power: ['pv', 'battery', 'grid'].some((k) => this._has(k)),
      dhw: this._has('dhw_top') || this._has('dhw_mode'),
      buffer: this._has('buffer_top') || this._has('buffer_mode'),
      hc: this._has('hc_flow') || this._has('hc_mode') || this._has('hc_pump'),
      house: this._has('room') || this._has('room_target'),
      circ: this._has('circulation'),
      hcType: this._hcType,
      lang: this._lang,
    };
    this._parts = parts;
    return JSON.stringify(parts);
  }

  /* ---------- render ---------- */
  _emitter() {
    const i = this._i;
    if (this._hcType === 'radiator') {
      // Radiator: flow enters top left, return leaves bottom left, heat waves rise above.
      const ribs = Array.from({ length: 8 }, (_, n) => `<rect class="rib" x="${838 + n * 14}" y="352" width="9" height="116" rx="4"/>`).join('');
      return {
        vl: 'M640 360 H826',
        body: 'M826 365 H940 M940 455 H826',
        rl: 'M826 455 H805 Q785 455 785 475 Q785 495 765 495 H640',
        title: `<text class="tank-title" x="888" y="296" text-anchor="middle">${i.heating_circuit}</text>`,
        art: `<rect class="radiator" x="826" y="345" width="126" height="130" rx="10"/>${ribs}
          <g class="waves" id="waves">${[855, 888, 921].map((x) => `<path class="wave" d="M${x} 336 q7 -7 0 -14 q-7 -7 0 -14"/>`).join('')}</g>`,
      };
    }
    return {
      vl: 'M640 360 H800',
      body: 'M800 360 H935 Q955 360 955 380 Q955 400 935 400 H825 Q805 400 805 420 Q805 440 825 440 H935 Q955 440 955 460 Q955 480 935 480 H800',
      rl: 'M800 480 Q785 480 785 490 Q785 495 775 495 H640',
      title: `<text class="tank-title" x="880" y="320" text-anchor="middle">${i.heating_circuit}</text>`,
      art: '<rect class="screed" x="795" y="490" width="170" height="10" rx="3"/>',
    };
  }

  _render() {
    if (!this._hass || !this._config) return;
    this._sig = this._layoutSignature();
    const P = this._parts;
    const e = this._e;
    const i = this._i;
    const T = this._esc(this._config.title ?? i.title);
    const de = (k) => (e[k] ? `data-entity="${this._esc(e[k])}"` : '');
    const pipePair = (id, d, show = true) => (show
      ? `<path class="pipe" id="p-${id}" d="${d}"/><path class="flow" id="f-${id}" d="${d}"/>` : '');
    const P_SRC = 'M70 70 V118 Q70 140 92 140 H148 Q170 140 170 162 V190';
    const G_SRC = 'M270 70 V118 Q270 140 248 140 H192 Q170 140 170 162 V190';
    const em = this._emitter();

    this.shadowRoot.innerHTML = `
      <style>${HeatpumpFlowCard.styles}</style>
      <ha-card>
        <div class="head">
          ${T ? `<div class="title">${T}</div>` : '<div></div>'}
          <div class="chips">
            <span class="chip" id="chip-mode" ${de('mode')}></span>
            ${this._badges.map((b, n) => `<span class="chip badge" id="chip-b${n}" data-entity="${this._esc(b.entity)}">${this._esc(b.label || b.entity)}</span>`).join('')}
            <span class="chip err" id="chip-err">⚠ ${i.error}</span>
          </div>
        </div>
        <svg viewBox="0 0 1000 560" id="svg" role="img" aria-label="${T}">
          <defs>
            <linearGradient id="g-dhw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" id="g-dhw-top"/><stop offset="100%" id="g-dhw-bottom"/></linearGradient>
            <linearGradient id="g-buf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" id="g-buf-top"/><stop offset="100%" id="g-buf-bottom"/></linearGradient>
            <linearGradient id="g-rad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" id="g-rad-top"/><stop offset="100%" id="g-rad-bottom"/></linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>

          ${P.power ? `
            ${this._source('pv', 70, i.pv, e.pv)}${this._source('bat', 170, i.battery, e.battery)}${this._source('grid', 270, i.grid, e.grid)}
            <path class="eline pv" d="${P_SRC}"/><path class="eline bat" d="M170 70 V190"/><path class="eline grid" d="${G_SRC}"/>
            <path class="eflow pv" id="ef-pv" d="${P_SRC}"/><path class="eflow bat" id="ef-bat" d="M170 70 V190"/><path class="eflow grid" id="ef-grid" d="${G_SRC}"/>` : ''}

          ${pipePair('vl', P.dhw ? 'M290 250 H402' : 'M290 250 H400 Q420 250 420 270 V338 Q420 360 442 360 H520')}
          ${pipePair('vl-dhw', 'M420 232 V102 Q420 80 442 80 H520', P.dhw)}
          ${pipePair('vl-buf', 'M420 268 V338 Q420 360 442 360 H520', P.dhw)}
          ${pipePair('rl-dhw', 'M520 215 H400 Q380 215 380 235 V380', P.dhw)}
          ${pipePair('rl-buf', 'M520 495 H400 Q380 495 380 475 V380')}
          ${pipePair('rl', 'M380 380 H290')}
          ${P.buffer ? '' : `${pipePair('byp-vl', 'M520 360 H640')}${pipePair('byp-rl', 'M640 495 H520')}`}
          ${P.hc ? `${em.art}${pipePair('hc-vl', em.vl)}${pipePair('hc-body', em.body)}${pipePair('hc-rl', em.rl)}` : ''}

          <g class="tap" ${de('flow')}><text class="pipe-label" id="t-vl" x="346" y="236" text-anchor="middle"></text></g>
          <g class="tap" ${de('volume')}><text class="vol-label" id="t-vol" x="346" y="275" text-anchor="middle"></text></g>
          <g class="tap" ${de('return')}><text class="pipe-label" id="t-rl" x="335" y="406" text-anchor="middle"></text></g>
          ${P.hc ? `<g class="tap" ${de('hc_flow')}><text class="pipe-label" id="t-hc" x="740" y="334" text-anchor="middle"></text></g>
            <g class="tap" ${de('hc_volume')}><text class="vol-label" id="t-hc-vol" x="720" y="394" text-anchor="middle"></text></g>` : ''}

          <g class="tap" ${de('mode')}>
            <rect class="unit" id="hp-box" x="50" y="190" width="240" height="235" rx="20"/>
            <text class="unit-title" x="170" y="218" text-anchor="middle">${i.heat_pump}</text>
            <circle class="fan-ring" cx="170" cy="288" r="50"/>
            <g class="fan" id="fan">
              ${[0, 120, 240].map((a) => `<path class="blade" d="M170 288 C160 262 168 246 182 244 C186 262 180 278 170 288Z" transform="rotate(${a} 170 288)"/>`).join('')}
              <circle cx="170" cy="288" r="7" class="hub"/>
            </g>
            <text class="snow" id="snow" x="170" y="300" text-anchor="middle">❄</text>
            <text class="unit-status" id="t-hp-status" x="170" y="366" text-anchor="middle"></text>
            <text class="unit-val" id="t-hp-power" x="170" y="390" text-anchor="middle"></text>
            <text class="unit-val strong" id="t-hp-cop" x="170" y="412" text-anchor="middle"></text>
          </g>
          <g class="tap" ${de(e.source_in ? 'source_in' : 'source_volume')}><text class="small" id="t-src-in" x="170" y="450" text-anchor="middle"></text></g>

          ${P.dhw ? `
            <g class="tap" ${de(e.valve ? 'valve' : 'dhw_mode')}>
              <circle class="valve" cx="420" cy="250" r="18"/>
              <path class="valve-arrow" id="valve-arrow" d="M420 262 V240 M412 248 L420 240 L428 248"/>
              <text class="small" id="t-valve" x="446" y="254"></text>
            </g>
            <g class="tap" ${de('dhw_top')}>
              <text class="tank-title" x="580" y="30" text-anchor="middle">${i.dhw}</text>
              <rect class="tank" x="520" y="40" width="120" height="200" rx="26" fill="url(#g-dhw)"/>
              <path class="coil" id="coil" d="M520 80 H600 L540 100 H600 L540 120 H600 L540 140 H600 L540 160 H600 L540 180 H600 L540 200 H520"/>
              <text class="tank-temp" id="t-dhw-top" x="580" y="112" text-anchor="middle"></text>
              <text class="tank-sub" id="t-dhw-bottom" x="580" y="222" text-anchor="middle"></text>
              <text class="small" id="t-dhw-mode" x="580" y="262" text-anchor="middle"></text>
            </g>
            ${P.circ ? `<g class="tap" ${de('circulation')}><text class="small circ" id="t-circ" x="650" y="60">↻ ${i.circulation}</text></g>` : ''}` : ''}

          ${P.buffer ? `
            <g class="tap" ${de('buffer_top')}>
              <text class="tank-title" x="580" y="310" text-anchor="middle">${i.buffer}</text>
              <rect class="tank" x="520" y="320" width="120" height="200" rx="26" fill="url(#g-buf)"/>
              <text class="tank-temp" id="t-buf-top" x="580" y="392" text-anchor="middle"></text>
              <text class="tank-sub" id="t-buf-bottom" x="580" y="502" text-anchor="middle"></text>
              <text class="small" id="t-buf-mode" x="580" y="542" text-anchor="middle"></text>
            </g>` : ''}

          ${P.hc ? `
            <g class="tap" ${de(e.hc_pump ? 'hc_pump' : 'hc_mode')}>
              <circle class="pump" cx="720" cy="360" r="16"/>
              <g class="impeller" id="impeller"><path d="M720 348 L726 360 L714 360Z M720 372 L714 360 L726 360Z" class="imp"/></g>
              ${em.title}
              <text class="small" id="t-hc-mode" x="880" y="524" text-anchor="middle"></text>
            </g>` : ''}

          ${P.house ? `
            <g class="tap" ${de(e.room ? 'room' : 'room_target')}>
              <path class="house" d="M720 130 L830 50 L940 130 V240 H720 Z"/>
              <text class="tank-title" x="830" y="118" text-anchor="middle">${i.house}</text>
              <text class="house-temp" id="t-room" x="830" y="172" text-anchor="middle"></text>
              <text class="house-sub" id="t-room-target" x="830" y="202" text-anchor="middle"></text>
              <text class="small" id="t-outdoor" x="830" y="226" text-anchor="middle"></text>
            </g>` : (this._has('outdoor') ? `<g class="tap" ${de('outdoor')}><text class="small" id="t-outdoor" x="880" y="120" text-anchor="middle"></text></g>` : '')}
        </svg>
        <div class="stats" id="stats"></div>
      </ha-card>`;

    const tap = (ev) => this._tap(ev);
    this._$('svg').addEventListener('click', tap);
    this.shadowRoot.querySelector('.head').addEventListener('click', tap);
    this._$('stats').addEventListener('click', tap);
    this._rendered = true;
  }

  _source(key, x, label, entity) {
    const icons = {
      pv: `<circle cx="${x}" cy="40" r="9" class="ico"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) =>
        `<line x1="${x}" y1="25" x2="${x}" y2="20" class="ico-l" transform="rotate(${a} ${x} 40)"/>`).join('')}`,
      bat: `<rect x="${x - 8}" y="30" width="16" height="22" rx="3" class="ico-o"/><rect x="${x - 4}" y="26" width="8" height="4" rx="1" class="ico"/><rect x="${x - 5}" y="40" width="10" height="9" rx="1" class="ico"/>`,
      grid: `<path d="M${x - 10} 54 L${x} 24 L${x + 10} 54 M${x - 7} 44 H${x + 7} M${x - 12} 32 H${x + 12}" class="ico-l"/>`,
    };
    const has = entity && this._hass.states[entity];
    return `<g class="tap src ${key}${has ? '' : ' absent'}" ${has ? `data-entity="${this._esc(entity)}"` : ''} id="src-${key}">
      <circle cx="${x}" cy="40" r="28" class="src-ring"/>${icons[key]}
      <text class="small" x="${x}" y="88" text-anchor="middle" id="t-src-${key}">${label}</text>
    </g>`;
  }

  _tap(ev) {
    const el = ev.composedPath().find((n) => n.dataset && n.dataset.entity);
    if (!el) return;
    const e = new Event('hass-more-info', { bubbles: true, composed: true });
    e.detail = { entityId: el.dataset.entity };
    this.dispatchEvent(e);
  }

  /* ---------- update ---------- */
  _update() {
    if (!this._rendered || !this._hass) return;
    const i = this._i;
    const P = this._parts;
    const rawMode = this._s('mode');
    const status = this._s('status') || '';
    const hp = this._norm(this._maps.mode, rawMode);
    const dhwMode = this._norm(this._maps.dhw, this._s('dhw_mode'));
    const bufMode = this._norm(this._maps.buffer, this._s('buffer_mode'));
    const hcMode = this._norm(this._maps.hc, this._s('hc_mode'));
    const power = this._w('power');
    const vol = this._lh('volume');
    const tFlow = this._n('flow'); const tRet = this._n('return');
    const spread = Number.isFinite(tFlow) && Number.isFinite(tRet) ? tFlow - tRet : NaN;
    const running = (this._e.compressor && this._on('compressor')) || power > this._threshold || this._runningStates.includes(status)
      || (!this._e.compressor && !this._e.power && !this._e.status && ['heating', 'dhw', 'cooling', 'defrost'].includes(hp));
    const defrost = hp === 'defrost' || status.toUpperCase().includes('DEFROST');
    const cooling = hp === 'cooling' || bufMode === 'cooling';

    const dhwActive = P.dhw && (hp === 'dhw' || ['dhw', 'legionella'].includes(dhwMode) || (this._e.valve && this._on('valve')));
    const toDhw = dhwActive && (running || dhwMode === 'trailing' || hp === 'dhw');
    const toHeat = !toDhw && (['heating', 'defrost', 'cooling'].includes(hp) || ['heating', 'cooling'].includes(bufMode));
    const loop = toDhw || toHeat;

    // Heat output: sensor, or estimated from flow rate × spread × 1.163 Wh/(l·K) for water.
    let heat = this._kw('heat');
    let heatEstimated = false;
    if (!this._has('heat') && loop && running && vol > 0 && spread > 0) { heat = (vol * spread * 1.163) / 1000; heatEstimated = true; }

    const dur = Number.isFinite(vol) && vol > 0 ? Math.min(Math.max(3.4 - vol / 1000, 0.8), 3) : 2;
    this.style.setProperty('--hfc-dur', `${dur.toFixed(2)}s`);
    const fanDur = running ? Math.min(Math.max(2.4 - (power || 0) / 1500, 0.5), 2.4) : 0;
    this.style.setProperty('--hfc-fan', `${fanDur.toFixed(2)}s`);

    // pipes
    const cFlow = defrost || cooling ? '#7dd3fc' : this._vlColor(tFlow);
    const cRet = this._rlColor(tRet);
    const stroke = (id, c) => { const el = this._$(`p-${id}`); if (el) el.style.stroke = c; };
    ['vl', 'vl-dhw', 'vl-buf', 'byp-vl'].forEach((id) => stroke(id, cFlow));
    ['rl', 'rl-dhw', 'rl-buf', 'byp-rl'].forEach((id) => stroke(id, cRet));
    const pipe = (id, on) => { this._cls(`p-${id}`, on); this._cls(`f-${id}`, on); };
    pipe('vl', loop); pipe('rl', loop);
    pipe('vl-dhw', toDhw); pipe('rl-dhw', toDhw);
    pipe('vl-buf', toHeat); pipe('rl-buf', toHeat);
    pipe('byp-vl', toHeat); pipe('byp-rl', toHeat);
    this._cls('coil', toDhw);

    if (P.hc) {
      const hcOn = this._e.hc_pump ? this._on('hc_pump') : ['heating', 'cooling'].includes(hcMode);
      // Without circuit sensors fall back to the buffer / main loop temperatures.
      const pick = (...v) => v.find((x) => Number.isFinite(x)) ?? NaN;
      const tHc = pick(this._n('hc_flow'), this._n('buffer_top'), toHeat ? tFlow : tRet);
      const tHcR = pick(this._n('hc_return'), this._n('buffer_bottom'), tRet);
      const cHc = hcMode === 'cooling' ? '#7dd3fc' : this._vlColor(tHc);
      stroke('hc-vl', cHc); stroke('hc-body', cHc); stroke('hc-rl', this._rlColor(tHcR));
      const rt = this._$('g-rad-top'); const rb = this._$('g-rad-bottom');
      if (rt) { rt.setAttribute('stop-color', hcOn ? cHc : 'var(--disabled-text-color, #9e9e9e)'); rb.setAttribute('stop-color', hcOn ? this._rlColor(tHcR) : 'var(--disabled-text-color, #9e9e9e)'); }
      ['hc-vl', 'hc-body', 'hc-rl'].forEach((id) => pipe(id, hcOn));
      this._cls('impeller', hcOn);
      this._cls('waves', hcOn && hcMode !== 'cooling');
      const set = this._n('hc_setpoint');
      this._txt('t-hc', this._has('hc_flow') ? `${this._t(tHc)}${Number.isFinite(set) ? ` · ${i.target} ${this._fmt(set)}` : ''}` : '');
      const hcVol = this._lh('hc_volume');
      this._txt('t-hc-vol', this._has('hc_volume') && Number.isFinite(hcVol) ? `${this._fmt(hcVol, 0)} l/h` : '');
      this._txt('t-hc-mode', this._has('hc_mode') ? this._modeLabel(hcMode, this._s('hc_mode')) : (hcOn ? i.running : ''));
    }

    this._txt('t-vl', this._has('flow') ? `VL ${this._t(tFlow)}` : '');
    this._txt('t-rl', this._has('return') ? `RL ${this._t(tRet)}` : '');
    this._txt('t-vol', this._has('volume') && loop && Number.isFinite(vol) ? `${this._fmt(vol, 0)} l/h` : '');

    // heat pump
    this._cls('fan', running); this._cls('snow', defrost); this._cls('hp-box', running);
    // Some integrations report "heating" while charging DHW (e.g. ViCare compressor phase); the valve decides.
    const shownMode = toDhw && ['heating', 'idle', ''].includes(hp) ? 'dhw' : hp;
    const modeTxt = this._modeLabel(shownMode, rawMode);
    const sl = (this._statusLabels[this._lang] || {})[status];
    this._txt('t-hp-status', `${modeTxt}${running && sl ? ` · ${sl}` : ''}`);
    const heatTxt = Number.isFinite(heat) ? `${heatEstimated ? '≈' : ''}${this._fmt(heat, 1)} kW` : '';
    this._txt('t-hp-power', running
      ? (Number.isFinite(power) ? `${this._fmt(power, 0)} W${heatTxt ? ` → ${heatTxt}` : ''}` : (heatTxt || i.running))
      : i.compressor_off);
    const cop = running && power > 50 && heat > 0 ? (heat * 1000) / power : NaN;
    this._txt('t-hp-cop', Number.isFinite(cop) ? `COP ${heatEstimated ? '≈' : ''}${this._fmt(cop, 1)}` : '');
    const srcVol = this._lh('source_volume');
    const srcParts = [];
    if (this._has('source_in')) srcParts.push(`${i.source_in} ${this._t(this._n('source_in'))}`);
    if (this._has('source_volume') && srcVol > 0) srcParts.push(`${i.source_flow} ${this._fmt(srcVol, 0)} l/h`);
    this._txt('t-src-in', srcParts.join(' · '));

    // valve + tanks
    if (P.dhw) {
      const arrow = this._$('valve-arrow');
      if (arrow) arrow.setAttribute('transform', toDhw ? '' : 'rotate(180 420 250)');
      this._txt('t-valve', loop ? (toDhw ? i.valve_dhw : (cooling ? i.valve_cooling : i.valve_heating)) : '');
      const top = this._n('dhw_top'); const bot = this._has('dhw_bottom') ? this._n('dhw_bottom') : top - 5;
      this._$('g-dhw-top').setAttribute('stop-color', this._tankColor(top));
      this._$('g-dhw-bottom').setAttribute('stop-color', this._tankColor(bot));
      this._txt('t-dhw-top', this._t(top));
      this._txt('t-dhw-bottom', this._has('dhw_bottom') ? `${i.bottom} ${this._t(this._n('dhw_bottom'))}` : '');
      const tgt = this._n('dhw_target');
      const parts = [];
      if (this._has('dhw_mode')) parts.push(this._modeLabel(dhwMode, this._s('dhw_mode')));
      if (Number.isFinite(tgt)) parts.push(`${i.target} ${this._fmt(tgt, 0)} °C`);
      this._txt('t-dhw-mode', parts.join(' · '));
      this._cls('t-circ', this._on('circulation'));
    }
    if (P.buffer) {
      const top = this._n('buffer_top'); const bot = this._has('buffer_bottom') ? this._n('buffer_bottom') : top - 5;
      this._$('g-buf-top').setAttribute('stop-color', this._tankColor(top));
      this._$('g-buf-bottom').setAttribute('stop-color', this._tankColor(bot));
      this._txt('t-buf-top', this._t(top));
      this._txt('t-buf-bottom', this._has('buffer_bottom') ? `${i.bottom} ${this._t(this._n('buffer_bottom'))}` : '');
      this._txt('t-buf-mode', this._has('buffer_mode') ? this._modeLabel(bufMode, this._s('buffer_mode')) : '');
    }

    // house
    if (P.house) {
      const rt = this._n('room_target'); const r = this._n('room');
      const tgt = Number.isFinite(rt) ? `${i.target} ${this._fmt(rt)} °C` : '';
      // Room sensor missing or unknown: promote the target to the big line.
      this._txt('t-room', Number.isFinite(r) ? this._t(r) : tgt);
      this._txt('t-room-target', Number.isFinite(r) ? tgt : '');
    }
    this._txt('t-outdoor', this._has('outdoor') ? `${i.outdoor} ${this._t(this._n('outdoor'))}` : '');

    // power sources
    if (P.power) {
      [['pv', 'pv', i.pv], ['bat', 'battery', i.battery], ['grid', 'grid', i.grid]].forEach(([id, key, label]) => {
        const w = this._w(key); const on = w > 10;
        this._cls(`ef-${id}`, on); this._cls(`src-${id}`, on);
        this._txt(`t-src-${id}`, on ? `${label} ${this._fmt(w, 0)} W` : label);
      });
    }

    // header chips
    const chip = this._$('chip-mode');
    chip.textContent = `${modeTxt}${running ? ` · ${i.running}` : ''}`;
    chip.className = `chip mode-${defrost ? 'defrost' : cooling ? 'cool' : toDhw ? 'dhw' : toHeat ? 'heat' : 'idle'}`;
    this._badges.forEach((b, n) => this._cls(`chip-b${n}`, ['on', 'true', 'home', 'open'].includes(String(this._hass.states[b.entity]?.state).toLowerCase())));
    const errs = this._errors.filter((id) => {
      const st = this._hass.states[id]?.state; const v = parseFloat(st);
      return (Number.isFinite(v) && v !== 0) || st === 'on';
    });
    const err = this._$('chip-err');
    err.classList.toggle('on', errs.length > 0);
    if (errs.length) err.dataset.entity = errs[0];

    // statistics
    const share = this._n('pv_share_today');
    const tiles = [];
    const add = (key, label, value) => { if (this._has(key)) tiles.push([this._statLabel(key, label), value, this._e[key]]); };
    add('cop_heating_today', i.stat_cop_heating, this._fmt(this._n('cop_heating_today'), 2));
    add('cop_dhw_today', i.stat_cop_dhw, this._fmt(this._n('cop_dhw_today'), 2));
    add('energy_today', i.stat_energy, `${this._fmt(this._n('energy_today'), 1)} kWh${Number.isFinite(share) ? ` · ${this._fmt(share, 0)} % ${i.pv_share}` : ''}`);
    add('starts_today', i.stat_starts, this._fmt(this._n('starts_today'), 0));
    if (this._has('flow') && this._has('return')) tiles.push([i.stat_spread, loop && Number.isFinite(spread) ? `${this._fmt(spread, 1)} K` : '–', this._e.flow]);
    add('volume', i.stat_volume, loop && Number.isFinite(vol) ? `${this._fmt(vol, 0)} l/h` : '–');
    if (heatEstimated) tiles.push([i.stat_heat, `≈${this._fmt(heat, 1)} kW`, this._e.volume]);
    (this._config.stats || []).forEach((s) => {
      const st = this._hass.states[s.entity]; if (!st) return;
      const v = parseFloat(st.state);
      const unit = s.unit ?? st.attributes.unit_of_measurement ?? '';
      tiles.push([s.name || st.attributes.friendly_name || s.entity, Number.isFinite(v) ? `${this._fmt(v, s.decimals ?? 1)} ${unit}`.trim() : st.state, s.entity]);
    });
    const html = tiles.map(([l, v, id]) => `<div class="stat" data-entity="${this._esc(id)}"><div class="sv">${this._esc(v)}</div><div class="sl">${this._esc(l)}</div></div>`).join('');
    const box = this._$('stats');
    if (box._html !== html) { box.innerHTML = html; box._html = html; box.style.display = tiles.length ? '' : 'none'; }
  }
}

HeatpumpFlowCard.styles = `
  :host { display: block; --hfc-muted: var(--secondary-text-color, #888); }
  ha-card { padding: 12px 12px 8px; overflow: hidden; }
  .head { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin: 0 4px 4px; }
  .title { font-size: 1.15em; font-weight: 600; color: var(--primary-text-color); }
  .chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .chip { cursor: pointer; font-size: .82em; padding: 3px 10px; border-radius: 999px; background: var(--secondary-background-color, rgba(127,127,127,.15)); color: var(--primary-text-color); white-space: nowrap; }
  .chip.mode-heat { background: rgba(249,115,22,.18); color: #ea580c; }
  .chip.mode-dhw { background: rgba(239,68,68,.16); color: #dc2626; }
  .chip.mode-defrost, .chip.mode-cool { background: rgba(56,189,248,.2); color: #0284c7; }
  .chip.badge, .chip.err { display: none; }
  .chip.badge.on { display: inline-block; background: rgba(168,85,247,.18); color: #9333ea; }
  .chip.err.on { display: inline-block; background: rgba(239,68,68,.2); color: #dc2626; }
  svg { width: 100%; height: auto; display: block; }
  text { fill: var(--primary-text-color); font-family: var(--ha-font-family-body, inherit); }
  .tap { cursor: pointer; }
  .small { font-size: 15px; fill: var(--hfc-muted); }
  .pipe-label { font-size: 15px; font-weight: 600; }
  .vol-label { font-size: 13px; fill: var(--hfc-muted); }
  .unit { fill: var(--secondary-background-color, rgba(127,127,127,.12)); stroke: var(--divider-color, rgba(127,127,127,.35)); stroke-width: 2; transition: stroke .4s; }
  .unit.on { stroke: #f97316; filter: url(#glow); }
  .unit-title, .tank-title { font-size: 17px; font-weight: 600; }
  .unit-status { font-size: 16px; font-weight: 600; }
  .unit-val { font-size: 15px; fill: var(--hfc-muted); }
  .unit-val.strong { font-size: 17px; font-weight: 700; fill: #16a34a; }
  .fan-ring { fill: none; stroke: var(--divider-color, rgba(127,127,127,.35)); stroke-width: 3; }
  .blade { fill: var(--hfc-muted); opacity: .55; }
  .hub { fill: var(--hfc-muted); }
  .fan { transform-box: view-box; transform-origin: 170px 288px; }
  .fan.on { animation: hfc-spin var(--hfc-fan, 1s) linear infinite; }
  .fan.on .blade { fill: #38bdf8; opacity: .9; }
  .snow { font-size: 34px; fill: #0ea5e9; opacity: 0; }
  .snow.on { opacity: 1; animation: hfc-pulse 1.6s ease-in-out infinite; }
  .pipe { fill: none; stroke-width: 9; stroke-linecap: round; stroke-linejoin: round; opacity: .22; stroke: var(--hfc-muted); transition: opacity .5s, stroke .5s; }
  .pipe.on { opacity: 1; }
  .flow { fill: none; stroke: rgba(255,255,255,.9); stroke-width: 3.5; stroke-linecap: round; stroke-dasharray: 3 17; opacity: 0; pointer-events: none; }
  .flow.on { opacity: 1; animation: hfc-dash var(--hfc-dur, 1.5s) linear infinite; }
  .eline { fill: none; stroke-width: 4; stroke-linecap: round; opacity: .18; }
  .eline.pv { stroke: #f59e0b; } .eline.bat { stroke: #10b981; } .eline.grid { stroke: #64748b; }
  .eflow { fill: none; stroke-width: 7; stroke-linecap: round; stroke-dasharray: 0.1 18; opacity: 0; pointer-events: none; }
  .eflow.pv { stroke: #f59e0b; } .eflow.bat { stroke: #10b981; } .eflow.grid { stroke: #94a3b8; }
  .eflow.on { opacity: 1; animation: hfc-dash 1.1s linear infinite; }
  .src.absent { opacity: .35; }
  .src-ring { fill: var(--secondary-background-color, rgba(127,127,127,.12)); stroke: var(--divider-color, rgba(127,127,127,.35)); stroke-width: 2; transition: stroke .4s; }
  .src.pv.on .src-ring { stroke: #f59e0b; } .src.bat.on .src-ring { stroke: #10b981; } .src.grid.on .src-ring { stroke: #94a3b8; }
  .ico { fill: var(--hfc-muted); } .ico-o { fill: none; stroke: var(--hfc-muted); stroke-width: 2.5; }
  .ico-l { stroke: var(--hfc-muted); stroke-width: 2.5; fill: none; stroke-linecap: round; }
  .src.pv.on .ico { fill: #f59e0b; } .src.pv.on .ico-l { stroke: #f59e0b; }
  .src.bat.on .ico { fill: #10b981; } .src.bat.on .ico-o { stroke: #10b981; }
  .src.grid.on .ico-l { stroke: #94a3b8; }
  .valve { fill: var(--card-background-color, #fff); stroke: var(--hfc-muted); stroke-width: 3; }
  .valve-arrow { fill: none; stroke: var(--primary-text-color); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .tank { stroke: var(--divider-color, rgba(127,127,127,.4)); stroke-width: 2; }
  .tank-temp { font-size: 26px; font-weight: 700; fill: #fff; paint-order: stroke; stroke: rgba(0,0,0,.35); stroke-width: 3px; }
  .tank-sub { font-size: 14px; fill: #fff; paint-order: stroke; stroke: rgba(0,0,0,.35); stroke-width: 3px; }
  .house-temp { font-size: 26px; font-weight: 700; }
  .house-sub { font-size: 14px; }
  .coil { fill: none; stroke: rgba(255,255,255,.55); stroke-width: 3; stroke-linejoin: round; opacity: .35; }
  .coil.on { opacity: 1; stroke-dasharray: 6 8; animation: hfc-dash 1.4s linear infinite; }
  .circ { opacity: .35; } .circ.on { opacity: 1; fill: #0ea5e9; }
  .pump { fill: var(--card-background-color, #fff); stroke: var(--hfc-muted); stroke-width: 3; }
  .imp { fill: var(--hfc-muted); }
  .impeller { transform-box: view-box; transform-origin: 720px 360px; }
  .impeller.on { animation: hfc-spin 1.2s linear infinite; }
  .impeller.on .imp { fill: #f97316; }
  .house { fill: var(--secondary-background-color, rgba(127,127,127,.1)); stroke: var(--divider-color, rgba(127,127,127,.35)); stroke-width: 2; stroke-linejoin: round; }
  .screed { fill: var(--divider-color, rgba(127,127,127,.35)); }
  .radiator { fill: var(--secondary-background-color, rgba(127,127,127,.12)); stroke: var(--divider-color, rgba(127,127,127,.4)); stroke-width: 2; }
  .rib { fill: url(#g-rad); stroke: rgba(0,0,0,.08); stroke-width: 1; }
  #p-hc-body, #f-hc-body { display: var(--hfc-body, inline); }
  .wave { fill: none; stroke: #f97316; stroke-width: 3; stroke-linecap: round; opacity: 0; }
  .waves.on .wave { animation: hfc-rise 2.4s ease-in-out infinite; }
  .waves.on .wave:nth-child(2) { animation-delay: .8s; } .waves.on .wave:nth-child(3) { animation-delay: 1.6s; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(118px, 1fr)); gap: 6px; margin-top: 6px; }
  .stat { cursor: pointer; background: var(--secondary-background-color, rgba(127,127,127,.1)); border-radius: 10px; padding: 6px 8px; text-align: center; }
  .sv { font-weight: 700; font-size: 1.05em; color: var(--primary-text-color); }
  .sl { font-size: .78em; color: var(--hfc-muted); }
  @keyframes hfc-dash { to { stroke-dashoffset: -40; } }
  @keyframes hfc-spin { to { transform: rotate(360deg); } }
  @keyframes hfc-pulse { 50% { opacity: .35; } }
  @keyframes hfc-rise { 0% { opacity: 0; transform: translateY(6px); } 40% { opacity: .9; } 100% { opacity: 0; transform: translateY(-10px); } }
  @media (prefers-reduced-motion: reduce) { .flow.on, .eflow.on, .fan.on, .impeller.on, .coil.on, .snow.on, .waves.on .wave { animation: none; } .waves.on .wave { opacity: .7; } }
`;

if (!customElements.get('heatpump-flow-card')) customElements.define('heatpump-flow-card', HeatpumpFlowCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === 'heatpump-flow-card')) {
  window.customCards.push({
    type: 'heatpump-flow-card',
    name: 'Heatpump Flow Card',
    description: 'Animated hydraulic schematic for heat pumps (power sources, valve, tanks, heating circuit). Presets: Lambda, Viessmann, Vaillant.',
    preview: true,
    documentationURL: 'https://github.com/Sturmi77/heatpump-flow-card',
  });
}
console.info(`%c HEATPUMP-FLOW-CARD %c ${HFC_VERSION} `, 'background:#f97316;color:#fff;border-radius:3px 0 0 3px', 'background:#334155;color:#fff;border-radius:0 3px 3px 0');
