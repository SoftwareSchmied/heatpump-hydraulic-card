/*
 * Heatpump Flow Card
 * Animated hydraulic schematic for air-to-water heat pumps in Home Assistant:
 * power sources (PV / battery / grid) → heat pump → diverter valve → DHW tank / buffer → heating circuit.
 * Vendor-neutral core with presets: Lambda, Viessmann (ViCare), Vaillant (myPyllant),
 * EMS-ESP (Bosch, Buderus, Junkers, Nefit, Worcester …) and Panasonic Aquarea (HeishaMon).
 *
 * https://github.com/Sturmi77/heatpump-flow-card · MIT License
 */
const HFC_VERSION = '0.4.3';

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
    tested: true,
    // Legacy naming: sensor.<prefix>_hp1_…; new naming (no prefix): sensor.hp1_…
    detect: (ctx) => {
      const re = new RegExp(`^sensor\\.(?:(.+)_)?hp${ctx.idx.hp}_operating_state$`);
      const id = ctx.match(re, 'lambda_heat_pumps');
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
        source_out: `${hp}_energy_source_outlet_temperature`,
        heater: `${hp}_relais_state_2nd_heating_stage`,
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
        starts_total: `${hp}_compressor_start_cycling_total`,
        energy_total: `${hp}_compressor_power_consumption_accumulated`,
        heat_total: `${hp}_compressor_thermal_energy_output_accumulated`,
        compressor_speed: `${hp}_compressor_unit_rating`,
        evap_temp: `${hp}_evaporation_temperature`,
        cond_temp: `${hp}_condensation_temperature`,
        suction_temp: `${hp}_suction_gas_temperature`,
        hot_gas: `${hp}_hot_gas_temperature`,
        subcooling: `${hp}_subcooling_temperature`,
        eev: `${hp}_expansion_valve_opening_angle`,
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
    // Gas boilers also report outside_temperature, so only compressor entities count as a heat pump.
    detect: (ctx) => (ctx.key('vicare', 'binary_sensor', 'compressor') || ctx.key('vicare', 'sensor', 'compressor_phase')
      || ctx.key('vicare', 'sensor', 'compressor_starts') ? '' : undefined),
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
        source_out: s('primary_circuit_return_temperature'),
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
        hours: s('compressor_hours'),
        aux_hours: s('heating_rod_hours'),
        compressor_speed: s('compressor_modulation'),
        suction_temp: s('compressor_inlet_temperature'),
        hot_gas: s('compressor_outlet_temperature'),
        low_pressure: s('compressor_inlet_pressure', 'suction_gas_pressure'),
        high_pressure: s('compressor_outlet_pressure', 'hot_gas_pressure'),
        liquid_temp: s('condenser_liquid_temperature'),
        subcooling: s('condenser_subcooling_temperature'),
        superheat: s('evaporator_overheat_temperature'),
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

  // Bosch, Buderus, Junkers, Nefit, Worcester and other EMS-bus heat pumps via the EMS-ESP gateway (MQTT discovery).
  // Entity ids come from EMS-ESP short names (boiler_hpactivity, …) and do not depend on the language;
  // the "multiple instances" entity format adds a prefix, which is detected. Enum texts follow the EMS-ESP language.
  emsesp: {
    name: 'EMS-ESP (Bosch, Buderus, Junkers, Nefit …)',
    source_type: (e, hass) => (/hpbrinein$/.test(e.source_in || '') && hass.states[e.source_in] ? 'brine' : 'air'),
    detect: (ctx) => {
      // Gas boilers have curflowtemp as well; only heat pump entities count.
      const id = ctx.match(/^sensor\.(?:(.+)_)?boiler_(hpactivity|hptc1)$/, 'mqtt');
      return id === undefined ? undefined : (id.match(/^sensor\.(?:(.+)_)?boiler_/)[1] || '');
    },
    entities: (p, i) => {
      const x = p ? `${p}_` : '';
      const b = (k) => [`binary_sensor.${x}boiler_${k}`, `sensor.${x}boiler_${k}`];
      const s = (...ks) => ks.map((k) => `sensor.${x}${k}`);
      const hc = `hc${i.hc}`;
      return {
        mode: s('boiler_hpactivity'),
        compressor: b('hpcompon'),
        valve: b('hp3way'),
        power: s('boiler_hpcurrpower'),
        flow: s('boiler_hptc1', 'boiler_curflowtemp'),
        return: s('boiler_hptc0', 'boiler_rettemp'),
        volume: s('boiler_pc0flow'),
        source_in: s('boiler_hptl2', 'boiler_hpbrinein'),
        source_out: s('boiler_hpbrineout'),
        heater: b('auxheaterstatus').concat(s('boiler_auxheaterlevel')),
        outdoor: s('boiler_outdoortemp', 'thermostat_outdoortemp'),
        dhw_top: s('boiler_dhw_curtemp', 'boiler_wwcurtemp', 'boiler_dhw_storagetemp1'),
        dhw_bottom: s('boiler_dhw_storagetemp2'),
        dhw_target: s('boiler_dhw_seltemp', 'boiler_wwseltemp'),
        circulation: b('dhw_circ').concat(b('wwcirc')),
        hc_pump: [`binary_sensor.${x}mixer_${hc}_pumpstatus`, `sensor.${x}mixer_${hc}_pumpstatus`],
        hc_flow: s(`mixer_${hc}_flowtemphc`, `thermostat_${hc}_targetflowtemp`),
        room: s(`thermostat_${hc}_currtemp`),
        room_target: s(`thermostat_${hc}_seltemp`),
        hours: s('boiler_uptimecomp', 'boiler_uptimetotal'),
        starts_total: s('boiler_totalcompstarts'),
        energy_total: s('boiler_nrgconstotal'),
        heat_total: s('boiler_nrgsupptotal'),
        compressor_speed: s('boiler_hpcompspd'),
        evap_temp: s('boiler_hppl1'),
        cond_temp: s('boiler_hpph1'),
        suction_temp: s('boiler_hptr5'),
        hot_gas: s('boiler_hptr6'),
        liquid_temp: s('boiler_hptr3'),
      };
    },
    mode_map: {
      off: 'idle', heating: 'heating', cooling: 'cooling', 'hot water': 'dhw', pool: 'heating', 'pool heating': 'heating',
      defrost: 'defrost', 'compressor alarm': 'off',
      aus: 'idle', heizen: 'heating', kühlen: 'cooling', warmwasser: 'dhw', 'pool beheizen': 'heating', abtauen: 'defrost',
      'alarm kompressor': 'off',
    },
  },

  // Panasonic Aquarea via HeishaMon and the "heishamon-homeassistant" integration (domain aquarea).
  // Entity ids are slugs of the MQTT topics: sensor.<prefix>_main_<topic>, prefix default panasonic_heat_pump.
  heishamon: {
    name: 'Panasonic Aquarea (HeishaMon)',
    auto_circuits: false,
    detect: (ctx) => {
      const id = ctx.match(/^sensor\.(.+)_main_main_outlet_temp$/, 'aquarea');
      return id === undefined ? undefined : id.replace(/^sensor\./, '').replace(/_main_main_outlet_temp$/, '');
    },
    entities: (p, i) => {
      const m = `${p}_main_`;
      const z = `z${i.hc}`;
      return {
        compressor: `sensor.${m}compressor_freq`,
        valve: `sensor.${m}threeway_valve_state`,
        defrost: [`binary_sensor.${m}defrosting_state`, `switch.${m}defrosting_state`],
        heater: [`binary_sensor.${m}internal_heater_state`, `sensor.${m}internal_heater_state`],
        power: `sensor.${m}heat_power_consumption`,
        heat: `sensor.${m}heat_power_production`,
        flow: `sensor.${m}main_outlet_temp`,
        return: `sensor.${m}main_inlet_temp`,
        volume: `sensor.${m}pump_flow`,
        outdoor: `sensor.${m}outside_temp`,
        dhw_top: `sensor.${m}dhw_temp`,
        dhw_target: [`number.${m}dhw_target_temp`, `sensor.${m}dhw_target_temp`],
        hc_flow: `sensor.${m}${z}_water_temp`,
        hc_setpoint: i.hc === 1 ? `sensor.${m}main_target_temp` : undefined,
        room: `sensor.${m}z1_temp`,
        hours: `sensor.${m}operations_hours`,
        starts_total: `sensor.${m}operations_counter`,
        aux_hours: `sensor.${m}room_heater_operations_hours`,
        compressor_speed: `sensor.${m}compressor_freq`,
        hot_gas: `sensor.${m}discharge_temp`,
        high_pressure: `sensor.${m}high_pressure`,
        low_pressure: `sensor.${m}low_pressure`,
        eev: `sensor.${m}expansion_valve`,
      };
    },
  },
};

/* ------------------------------------------------------------------ */
/* Translations                                                        */
/* ------------------------------------------------------------------ */
const HFC_I18N = {
  en: {
    not_found: 'No entities of this preset found. Check the integration and the prefix, or open the card editor.',
    title: 'Heat pump', heat_pump: 'Heat pump', dhw: 'Hot water', buffer: 'Buffer', heating_circuit: 'Heating circuit',
    house: 'Rooms', running: 'running', compressor_off: 'Compressor off', source_in: 'Air inlet', outdoor: 'Outdoor',
    brine_in: 'Brine in', brine_out: 'Brine out', well_in: 'Well in', well_out: 'Well out',
    details: 'Details', sec_operation: 'Operation', sec_refrigerant: 'Refrigerant circuit', sec_more: 'More',
    det: {
      hours: 'Compressor hours', starts_total: 'Compressor starts total', aux_hours: 'Heater hours', energy_total: 'Electricity total',
      heat_total: 'Heat total', cop_total: 'COP total', compressor_speed: 'Compressor', evap_temp: 'Evaporation', cond_temp: 'Condensation',
      suction_temp: 'Suction gas', hot_gas: 'Hot gas', liquid_temp: 'Liquid line', low_pressure: 'Low pressure', high_pressure: 'High pressure',
      eev: 'Expansion valve', superheat: 'Superheat', subcooling: 'Subcooling',
    },
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
    not_found: 'Keine Entitäten dieser Voreinstellung gefunden. Integration und Präfix prüfen oder den Karteneditor öffnen.',
    title: 'Wärmepumpe', heat_pump: 'Wärmepumpe', dhw: 'Warmwasser', buffer: 'Puffer', heating_circuit: 'Heizkreis',
    house: 'Wohnräume', running: 'läuft', compressor_off: 'Verdichter aus', source_in: 'Luft-Eintritt', outdoor: 'Außen',
    brine_in: 'Sole ein', brine_out: 'Sole aus', well_in: 'Brunnen ein', well_out: 'Brunnen aus',
    details: 'Details', sec_operation: 'Betrieb', sec_refrigerant: 'Kältekreis', sec_more: 'Weitere',
    det: {
      hours: 'Betriebsstunden Verdichter', starts_total: 'Verdichterstarts gesamt', aux_hours: 'Betriebsstunden Heizstab', energy_total: 'Strom gesamt',
      heat_total: 'Wärme gesamt', cop_total: 'COP gesamt', compressor_speed: 'Verdichter', evap_temp: 'Verdampfung', cond_temp: 'Kondensation',
      suction_temp: 'Sauggas', hot_gas: 'Heißgas', liquid_temp: 'Flüssigkeitsleitung', low_pressure: 'Niederdruck', high_pressure: 'Hochdruck',
      eev: 'Expansionsventil', superheat: 'Überhitzung', subcooling: 'Unterkühlung',
    },
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
    power_sources: 'PV / battery / grid', ps_auto: 'Energy dashboard, unless set below', ps_manual: 'Only the sensors below',
    source_type: 'Heat source', src_air: 'Air', src_brine: 'Ground (brine)', src_water: 'Groundwater',
    hc_count: 'Heating circuits', hc2_type: 'Circuit 2 emitter', hc3_type: 'Circuit 3 emitter',
    hc_name: 'Circuit 1 name', hc2_name: 'Circuit 2 name', hc3_name: 'Circuit 3 name',
    sec_hc2: 'Heating circuit 2', sec_hc3: 'Heating circuit 3', sec_details: 'Details: operation', sec_refrigerant: 'Details: refrigerant circuit',
    controls: 'Quick controls (switch, button, select, number …)', details_open: 'Details open by default',
    from_preset: 'Found by the preset',
    sec_advanced: 'Advanced',
    untested: 'untested',
    untested_help: 'Not yet tested on a real installation. Please report whether it works: github.com/Sturmi77/heatpump-flow-card/issues (Preset feedback).',
    warn_title: 'Missing in the card',
    warn_running: 'No operating mode, compressor, status or power: the card cannot tell whether the heat pump runs.',
    warn_power: 'No electrical power: no live COP, and no PV / battery / grid split from the Energy dashboard.',
    warn_temps: 'No flow or return temperature: no spread and no estimated heat output.',
    warn_heat: 'No heat output and no flow rate: no live COP.',
    preset_help: 'Found entities are filled in below. Pick another entity to override one, clear a field to hide it.',
    from_energy: 'Empty: taken from the Energy dashboard',
    detected: 'Detected', entities_found: 'entities', not_detected: 'Not found in this Home Assistant - check the integration, the prefix or choose another preset',
    source_out: 'Source outlet temperature', heater: 'Backup / inline heater active',
    dhw_heater: 'DHW heater rod active', buffer_heater: 'Buffer heater rod active',
    hc_underfloor: 'Underfloor heating', hc_radiator: 'Radiators',
    sec_hp: 'Heat pump', sec_storage: 'Storage', sec_hc: 'Heating circuit & house', sec_power: 'Power sources', sec_stats: 'Statistics',
    mode: 'Operating mode', status: 'Status / sub-state', compressor: 'Compressor running (binary or frequency)', defrost: 'Defrost active (binary)', power: 'Electrical power',
    heat: 'Heat output', flow: 'Flow temperature', return: 'Return temperature', volume: 'Flow rate heating side',
    source_volume: 'Flow rate source side', source_in: 'Source / air inlet temperature', outdoor: 'Outdoor temperature',
    valve: 'Diverter valve on DHW (binary or Tank/Room)',
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
    power_sources: 'PV / Akku / Netz', ps_auto: 'Energie-Dashboard, außer unten gesetzt', ps_manual: 'Nur die Sensoren unten',
    source_type: 'Wärmequelle', src_air: 'Luft', src_brine: 'Erdreich (Sole)', src_water: 'Grundwasser',
    hc_count: 'Heizkreise', hc2_type: 'Wärmeabgabe Heizkreis 2', hc3_type: 'Wärmeabgabe Heizkreis 3',
    hc_name: 'Name Heizkreis 1', hc2_name: 'Name Heizkreis 2', hc3_name: 'Name Heizkreis 3',
    sec_hc2: 'Heizkreis 2', sec_hc3: 'Heizkreis 3', sec_details: 'Details: Betrieb', sec_refrigerant: 'Details: Kältekreis',
    controls: 'Schnellbedienung (Schalter, Taste, Auswahl, Zahl …)', details_open: 'Details standardmäßig offen',
    from_preset: 'Von der Voreinstellung gefunden',
    sec_advanced: 'Erweitert',
    untested: 'ungetestet',
    untested_help: 'Noch nicht mit einer echten Anlage getestet. Bitte melden, ob es funktioniert: github.com/Sturmi77/heatpump-flow-card/issues (Preset feedback).',
    warn_title: 'Fehlt in der Karte',
    warn_running: 'Keine Betriebsart, kein Verdichter, kein Status und keine Leistung: Die Karte kann nicht erkennen, ob die Wärmepumpe läuft.',
    warn_power: 'Keine Leistungsaufnahme: kein Live-COP und keine Aufteilung PV / Akku / Netz aus dem Energie-Dashboard.',
    warn_temps: 'Kein Vor- oder Rücklauf: keine Spreizung und keine geschätzte Wärmeleistung.',
    warn_heat: 'Keine Wärmeleistung und kein Volumenstrom: kein Live-COP.',
    preset_help: 'Gefundene Entitäten sind unten eingetragen. Andere Entität wählen zum Überschreiben, Feld leeren zum Ausblenden.',
    from_energy: 'Leer: aus dem Energie-Dashboard',
    detected: 'Erkannt', entities_found: 'Entitäten', not_detected: 'In diesem Home Assistant nicht gefunden - Integration und Präfix prüfen oder andere Voreinstellung wählen',
    source_out: 'Quelle Austritt', heater: 'Heizstab / Zusatzheizer aktiv',
    dhw_heater: 'Heizstab Warmwasser aktiv', buffer_heater: 'Heizstab Puffer aktiv',
    hc_underfloor: 'Flächenheizung', hc_radiator: 'Heizkörper',
    sec_hp: 'Wärmepumpe', sec_storage: 'Speicher', sec_hc: 'Heizkreis & Haus', sec_power: 'Stromquellen', sec_stats: 'Kennzahlen',
    mode: 'Betriebsart', status: 'Status / Unterzustand', compressor: 'Verdichter läuft (binär oder Frequenz)', defrost: 'Abtauen aktiv (binär)', power: 'Leistungsaufnahme',
    heat: 'Wärmeleistung', flow: 'Vorlauftemperatur', return: 'Rücklauftemperatur', volume: 'Volumenstrom Heizseite',
    source_volume: 'Volumenstrom Quelle', source_in: 'Quelle / Luft-Eintritt', outdoor: 'Außentemperatur',
    valve: 'Umschaltventil auf WW (binär oder Tank/Room)',
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
  sec_hp: ['mode', 'status', 'compressor', 'defrost', 'power', 'heat', 'flow', 'return', 'volume', 'source_volume', 'source_in', 'source_out', 'outdoor', 'valve', 'heater'],
  sec_storage: ['dhw_top', 'dhw_bottom', 'dhw_target', 'dhw_mode', 'circulation', 'dhw_heater', 'buffer_top', 'buffer_bottom', 'buffer_mode', 'buffer_heater'],
  sec_hc: ['hc_flow', 'hc_return', 'hc_setpoint', 'hc_mode', 'hc_pump', 'hc_volume', 'room', 'room_target'],
  sec_hc2: ['hc2_flow', 'hc2_return', 'hc2_setpoint', 'hc2_mode', 'hc2_pump', 'hc2_volume'],
  sec_hc3: ['hc3_flow', 'hc3_return', 'hc3_setpoint', 'hc3_mode', 'hc3_pump', 'hc3_volume'],
  sec_power: ['pv', 'battery', 'grid'],
  sec_details: ['hours', 'starts_total', 'aux_hours', 'energy_total', 'heat_total'],
  sec_refrigerant: ['compressor_speed', 'evap_temp', 'cond_temp', 'suction_temp', 'hot_gas', 'liquid_temp', 'low_pressure', 'high_pressure', 'eev', 'superheat', 'subcooling'],
  sec_stats: ['cop_heating_today', 'cop_dhw_today', 'energy_today', 'pv_share_today', 'starts_today'],
};
// Entity domains usable as quick controls and the service each one calls.
const HFC_CONTROL_DOMAINS = ['switch', 'input_boolean', 'light', 'fan', 'automation', 'button', 'input_button', 'script', 'scene',
  'select', 'input_select', 'water_heater', 'climate', 'number', 'input_number'];
const HFC_BINARY_KEYS = ['compressor', 'valve', 'hc_pump', 'hc2_pump', 'hc3_pump', 'circulation', 'defrost', 'heater', 'dhw_heater', 'buffer_heater'];

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
      if (hass && preset.detect(ctx) !== undefined) {
        const stub = { preset: name };
        // Further circuits count when the preset finds a different, reporting flow or mode entity for them.
        const base = HeatpumpFlowCard._resolve({ preset: name, hc_count: 3 }, hass).fromPreset;
        const live = (id) => id && hass.states[id] && !['unknown', 'unavailable'].includes(hass.states[id].state);
        let n = 1;
        while (n < 3 && preset.auto_circuits !== false && ['flow', 'mode', 'pump'].some((k) => live(base[`hc${n + 1}_${k}`]) && base[`hc${n + 1}_${k}`] !== base[`hc_${k}`])) n++;
        if (n > 1) stub.hc_count = n;
        if (preset.source_type) { const st = preset.source_type(base, hass); if (st && st !== 'air') stub.source_type = st; }
        return stub;
      }
    }
    return { preset: 'lambda' };
  }

  static getConfigElement() { return document.createElement('heatpump-flow-card-editor'); }

  static getConfigForm() { return HeatpumpFlowCard._formSchema(); }

  // Form schema. With a config, circuit fields and groups are limited to hc_count.
  static _formSchema(config) {
    const lang = (document.querySelector('home-assistant')?.hass?.locale?.language || navigator.language || 'en').slice(0, 2);
    const L = HFC_EDITOR[lang] || HFC_EDITOR.en;
    const hcCount = config ? Math.min(Math.max(Math.round(+config.hc_count) || 1, 1), 3) : 3;
    const keep = (name) => !(/^hc2_/.test(name) && hcCount < 2) && !(/^hc3_/.test(name) && hcCount < 3);
    const groups = Object.entries(HFC_ENTITY_GROUPS).filter(([sec]) => keep(sec.replace('sec_', '') + '_'));
    const hcTypeSel = (name) => ({ name, selector: { select: { mode: 'dropdown', options: [{ value: 'underfloor', label: L.hc_underfloor }, { value: 'radiator', label: L.hc_radiator }] } } });
    const entitySchema = (key) => ({
      name: key,
      selector: { entity: HFC_BINARY_KEYS.includes(key) ? { domain: ['binary_sensor', 'switch', 'input_boolean', 'sensor'] } : {} },
    });
    return {
      schema: [
        {
          name: 'preset',
          selector: { select: { mode: 'dropdown', options: [{ value: 'none', label: '—' }, ...Object.entries(HFC_PRESETS).map(([k, p]) => ({ value: k, label: p.tested ? p.name : `${p.name} · ${L.untested}` }))] } },
        },
        {
          type: 'grid', name: '', schema: [
            { name: 'title', selector: { text: {} } },
            hcTypeSel('hc_type'),
            { name: 'hc_count', selector: { number: { min: 1, max: 3, step: 1, mode: 'box' } } },
            ...['hc2_type', 'hc3_type'].filter(keep).map(hcTypeSel),
          ],
        },
        {
          name: 'controls',
          selector: { entity: { multiple: true, domain: HFC_CONTROL_DOMAINS } },
        },
        ...groups.map(([sec, keys]) => ({
          type: 'expandable', name: 'entities', title: L[sec], schema: keys.map(entitySchema),
        })),
        {
          type: 'expandable', name: 'advanced', flatten: true, title: L.sec_advanced, schema: [{
            type: 'grid', name: '', schema: [
              { name: 'prefix', selector: { text: {} } },
              { name: 'device', selector: { device: {} } },
              { name: 'source_type', selector: { select: { mode: 'dropdown', options: ['air', 'brine', 'water'].map((v) => ({ value: v, label: L[`src_${v}`] })) } } },
              { name: 'power_sources', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: L.ps_auto }, { value: 'manual', label: L.ps_manual }] } } },
              { name: 'power_threshold', selector: { number: { min: 0, max: 2000, step: 10, mode: 'box', unit_of_measurement: 'W' } } },
              { name: 'language', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'Auto' }, { value: 'de', label: 'Deutsch' }, { value: 'en', label: 'English' }] } } },
              ...['hc_name', 'hc2_name', 'hc3_name'].filter(keep).map((name) => ({ name, selector: { text: {} } })),
              { name: 'details_open', selector: { boolean: {} } },
            ],
          }],
        },
      ],
      // Keys of circuits 2 and 3 reuse the labels of circuit 1 (hc2_flow → hc_flow).
      computeLabel: (s) => L[s.name] || L[String(s.name).replace(/^hc[23]_/, 'hc_')] || (HFC_I18N[lang] || HFC_I18N.en).det[s.name] || s.name,
      L,
    };
  }

  setConfig(config) {
    if (!config) throw new Error('Invalid configuration');
    if (config.preset && config.preset !== 'none' && !HFC_PRESETS[config.preset]) {
      throw new Error(`Unknown preset "${config.preset}". Available: ${Object.keys(HFC_PRESETS).join(', ')}`);
    }
    ['hc_type', 'hc2_type', 'hc3_type'].forEach((k) => {
      if (config[k] && !['underfloor', 'radiator'].includes(config[k])) throw new Error(`${k} must be "underfloor" or "radiator"`);
    });
    if (config.source_type && !['air', 'brine', 'water'].includes(config.source_type)) {
      throw new Error('source_type must be "air", "brine" or "water"');
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
    this._hcCount = Math.min(Math.max(Math.round(+config.hc_count) || 1, 1), 3);
    this._hcTypes = [this._hcType, config.hc2_type || 'underfloor', config.hc3_type || 'underfloor'];
    this._sourceType = config.source_type || 'air';
    this._threshold = Number.isFinite(+config.power_threshold) && config.power_threshold !== '' && config.power_threshold !== undefined ? +config.power_threshold : 100;
    this._needsBuild = true;
    this._lastTry = 0;
    this._rendered = false;
    this._e = this._e || {};
    this._errors = this._errors || [];
    if (this.shadowRoot && this._hass) { try { this._build(); this._render(); this._update(); } catch (err) { this._fail(err); } }
  }

  // Resolves preset + user entities. Needs hass for detection and registry lookups.
  // Resolves preset and user entities. Used by the card and by the editor (which shows what the preset found).
  static _resolve(config, hass) {
    const preset = HFC_PRESETS[config.preset];
    const idx = { hp: 1, dhw: 1, buffer: 1, hc: 1, ...(preset?.index || {}), ...(config.index || {}) };
    const hcCount = Math.min(Math.max(Math.round(+config.hc_count) || 1, 1), 3);
    const ctx = HeatpumpFlowCard._ctx(hass, config.device, idx);
    let prefix = config.prefix;
    let ready = true;
    if (preset && (prefix === undefined || prefix === null || prefix === '' || prefix === 'auto')) {
      prefix = preset.detect ? preset.detect(ctx) : '';
      if (prefix === undefined) { prefix = ''; ready = false; }
    }
    prefix = String(prefix || '').trim().toLowerCase();
    const fromPreset = {};
    const take = (k, v) => {
      const list = (Array.isArray(v) ? v : [v]).filter(Boolean);
      const hit = list.find((id) => hass.states[id]) || list[0];
      if (hit) fromPreset[k] = hit;
    };
    if (preset) Object.entries(preset.entities(prefix, idx, ctx)).forEach(([k, v]) => take(k, v));
    for (let n = 2; preset && n <= hcCount; n++) {
      const rawN = preset.entities(prefix, { ...idx, hc: idx.hc + n - 1 }, ctx);
      Object.entries(rawN).filter(([k]) => k.startsWith('hc_')).forEach(([k, v]) => take(`hc${n}_${k.slice(3)}`, v));
    }
    const e = { ...fromPreset };
    // User entities override the preset; null or "none" removes a preset entity.
    Object.entries(config.entities || {}).forEach(([k, v]) => {
      if (v === null || v === 'none') delete e[k];
      else if (v) e[k] = v;
    });
    const errors = config.errors || (preset && preset.errors ? preset.errors(prefix, idx, ctx) : []);
    return { preset, prefix, ready, idx, fromPreset, entities: e, errors };
  }

  _build() {
    const r = HeatpumpFlowCard._resolve(this._config, this._hass);
    this._e = r.entities;
    this._errors = r.errors;
    this._needsBuild = !r.ready;
    this._lastTry = Date.now();
  }

  // PV / battery / grid power from the Energy dashboard (its "stat_rate" power sensors), loaded once per page.
  // Conventions of the Energy dashboard: battery positive = discharging, grid positive = import.
  _loadEnergy() {
    if (this._energyReq || this._config.power_sources === 'manual' || typeof this._hass.callWS !== 'function') return;
    this._energyReq = true;
    HeatpumpFlowCard._energyPrefs = HeatpumpFlowCard._energyPrefs || this._hass.callWS({ type: 'energy/get_prefs' });
    HeatpumpFlowCard._energyPrefs.then((prefs) => {
      const rate = (src) => {
        const pc = src.power_config;
        if (pc && (pc.stat_rate_from || pc.stat_rate_to)) return { from: pc.stat_rate_from, to: pc.stat_rate_to };
        if (pc && pc.stat_rate) return { id: pc.stat_rate, inv: !!pc.stat_rate_inverted };
        return src.stat_rate ? { id: src.stat_rate } : null;
      };
      const of = (type) => (prefs?.energy_sources || []).filter((s) => s.type === type).map(rate).filter(Boolean);
      const energy = { solar: of('solar'), battery: of('battery'), grid: of('grid') };
      this._energy = energy.solar.length || energy.battery.length || energy.grid.length ? energy : null;
      if (this._energy && this._hass) { this._rendered = false; this.hass = this._hass; }
    }).catch(() => { this._energy = null; });
  }

  // Manual pv/battery/grid entities win; otherwise the Energy dashboard is used (needs the heat pump power).
  _powerMode() {
    if (['pv', 'battery', 'grid'].some((k) => this._has(k))) return 'manual';
    if (this._energy && this._config.power_sources !== 'manual' && this._has('power')) return 'energy';
    return '';
  }

  _rateW(r) {
    const w = (id) => {
      const st = id && this._hass.states[id]; const v = parseFloat(st?.state);
      if (!Number.isFinite(v)) return NaN;
      return String(st.attributes?.unit_of_measurement || '').toLowerCase() === 'kw' ? v * 1000 : v;
    };
    if (r.id) return w(r.id) * (r.inv ? -1 : 1);
    return (r.from ? w(r.from) : 0) - (r.to ? w(r.to) : 0);
  }

  // Splits the heat pump's power by the house's current supply mix: PV used in the house, battery discharge, grid import.
  // PV first covers battery charging and export. Returns W per source, or null while a sensor is unavailable.
  _energySplit() {
    const sum = (list) => list.reduce((a, r) => a + this._rateW(r), 0);
    const pv = sum(this._energy.solar); const bat = sum(this._energy.battery); const grid = sum(this._energy.grid);
    if (![pv, bat, grid].every(Number.isFinite)) return null;
    const charge = Math.max(-bat, 0); const discharge = Math.max(bat, 0);
    const imp = Math.max(grid, 0); const exp = Math.max(-grid, 0);
    const pvHome = Math.max(Math.max(pv, 0) - charge - exp, 0);
    const total = pvHome + discharge + imp;
    const hp = Math.max(this._w('power'), 0);
    if (!(total > 50) || !Number.isFinite(hp)) return { pv: 0, battery: 0, grid: 0 };
    return { pv: hp * pvHome / total, battery: hp * discharge / total, grid: hp * imp / total };
  }

  getCardSize() { return 9 + (this._hcCount || 1) * 3 - 3; }
  getGridOptions() { return { columns: 'full', min_columns: 6, rows: 'auto' }; }

  set hass(hass) {
    this._hass = hass;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._config) return;
    try { this._apply(); } catch (err) { this._fail(err); }
  }

  _apply() {
    // Retry detection at most every 30 s while the integration's entities are not there yet.
    if (this._needsBuild && (!this._rendered || Date.now() - this._lastTry > 30000)) { this._build(); this._rendered = false; }
    this._loadEnergy();
    const sig = this._layoutSignature();
    if (!this._rendered || sig !== this._sig) this._render();
    this._update();
  }

  // Unexpected data must not leave an empty card: show a short message and log the details once.
  _fail(err) {
    if (!this._failed) console.error('heatpump-flow-card:', err);
    this._failed = true;
    this._rendered = false;
    const msg = this._esc(err && err.message ? err.message : String(err));
    this.shadowRoot.innerHTML = `<style>${HeatpumpFlowCard.styles}</style><ha-card><div class="hint">Heatpump Flow Card: ${msg}<br>Details in the browser console. Please report it: github.com/Sturmi77/heatpump-flow-card/issues</div></ha-card>`;
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
  // Heater level: 0 = off, 1 = on / stage 1, 2-3 = stage. Binary, on/off text, power (> 0) or a stage number.
  _level(key) {
    if (!this._has(key)) return 0;
    const s = String(this._s(key)).toLowerCase();
    if (['on', 'true', 'open'].includes(s)) return 1;
    const v = parseFloat(s);
    if (!Number.isFinite(v) || v <= 0) return 0;
    return ['w', 'kw', '%'].includes(this._unit(key)) ? 1 : Math.min(Math.round(v), 3);
  }
  _hk(n, key) { return n === 1 ? `hc_${key}` : `hc${n}_${key}`; }
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
      power: this._powerMode(),
      sources: this._powerMode() === 'energy' ? [this._energy.solar.length, this._energy.battery.length, this._energy.grid.length].join() : '',
      dhw: this._has('dhw_top') || this._has('dhw_mode'),
      buffer: this._has('buffer_top') || this._has('buffer_mode'),
      hc: this._has('hc_flow') || this._has('hc_mode') || this._has('hc_pump'),
      house: this._has('room') || this._has('room_target'),
      circ: this._has('circulation'),
      hcType: this._hcType,
      hcs: this._hcCount > 1 ? this._hcTypes.slice(0, this._hcCount).join() : '',
      src: this._sourceType,
      heaters: ['heater', 'dhw_heater', 'buffer_heater'].map((k) => (this._has(k) ? 1 : 0)).join(''),
      controls: this._controlList().map((c) => c.entity).join(),
      drawer: this._drawerRows().map(([s, r]) => s + r.map((x) => x[0]).join('.')).join('|'),
      lang: this._lang,
    };
    this._parts = parts;
    return JSON.stringify(parts);
  }

  /* ---------- render ---------- */
  _emitter(type, title) {
    if (type === 'radiator') {
      // Radiator: flow enters top left, return leaves bottom left, heat waves rise above.
      const ribs = Array.from({ length: 8 }, (_, n) => `<rect class="rib" x="${838 + n * 14}" y="352" width="9" height="116" rx="4" style="fill:url(#g-rad__S__)"/>`).join('');
      return {
        vl: 'M640 360 H826',
        body: 'M826 365 H940 M940 455 H826',
        rl: 'M826 455 H805 Q785 455 785 475 Q785 495 765 495 H640',
        title: `<text class="tank-title" x="888" y="296" text-anchor="middle">${title}</text>`,
        art: `<rect class="radiator" x="826" y="345" width="126" height="130" rx="10"/>${ribs}
          <g class="waves" id="waves__S__">${[855, 888, 921].map((x) => `<path class="wave" d="M${x} 336 q7 -7 0 -14 q-7 -7 0 -14"/>`).join('')}</g>`,
      };
    }
    return {
      vl: 'M640 360 H800',
      body: 'M800 360 H935 Q955 360 955 380 Q955 400 935 400 H825 Q805 400 805 420 Q805 440 825 440 H935 Q955 440 955 460 Q955 480 935 480 H800',
      rl: 'M800 480 Q785 480 785 490 Q785 495 775 495 H640',
      title: `<text class="tank-title" x="880" y="320" text-anchor="middle">${title}</text>`,
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
    const showHc = P.hc || this._hcCount > 1;
    const H = 560 + (showHc ? (this._hcCount - 1) * 250 : 0);

    this.shadowRoot.innerHTML = `
      <style>${HeatpumpFlowCard.styles}</style>
      <ha-card>
        <div class="head">
          ${T ? `<div class="title">${T}</div>` : '<div></div>'}
          <div class="chips">
            <span class="chip" id="chip-mode" ${de('mode')}></span>
            ${this._badges.map((b, n) => `<span class="chip badge" id="chip-b${n}" data-entity="${this._esc(b.entity)}">${this._esc(b.label || b.entity)}</span>`).join('')}
            <span class="chip err" id="chip-err"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 2.5 20.5h19z" stroke-linejoin="round"/><path d="M12 10v4.5M12 17.5v.01" stroke-linecap="round"/></svg>${i.error}</span>
          </div>
        </div>
        ${this._needsBuild && this._preset ? `<div class="hint">${this._esc(i.not_found)}</div>` : ''}
        <svg viewBox="0 0 1000 ${H}" id="svg" role="img" aria-label="${T}">
          <defs>
            <linearGradient id="g-dhw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" id="g-dhw-top"/><stop offset="100%" id="g-dhw-bottom"/></linearGradient>
            <linearGradient id="g-buf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" id="g-buf-top"/><stop offset="100%" id="g-buf-bottom"/></linearGradient>
            <linearGradient id="g-rad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" id="g-rad-top"/><stop offset="100%" id="g-rad-bottom"/></linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>

          ${P.power ? `
            ${this._source('pv', 70, i.pv, this._srcEntity('pv'))}${this._source('bat', 170, i.battery, this._srcEntity('battery'))}${this._source('grid', 270, i.grid, this._srcEntity('grid'))}
            <path class="eline pv" d="${P_SRC}"/><path class="eline bat" d="M170 70 V190"/><path class="eline grid" d="${G_SRC}"/>
            <path class="eflow pv" id="ef-pv" d="${P_SRC}"/><path class="eflow bat" id="ef-bat" d="M170 70 V190"/><path class="eflow grid" id="ef-grid" d="${G_SRC}"/>` : ''}

          ${pipePair('vl', P.dhw ? 'M290 250 H402' : 'M290 250 H400 Q420 250 420 270 V338 Q420 360 442 360 H520')}
          ${pipePair('vl-dhw', 'M420 232 V102 Q420 80 442 80 H520', P.dhw)}
          ${pipePair('vl-buf', 'M420 268 V338 Q420 360 442 360 H520', P.dhw)}
          ${pipePair('rl-dhw', 'M520 215 H400 Q380 215 380 235 V380', P.dhw)}
          ${pipePair('rl-buf', 'M520 495 H400 Q380 495 380 475 V380')}
          ${pipePair('rl', 'M380 380 H290')}
          ${P.buffer ? '' : `${pipePair('byp-vl', 'M520 360 H640')}${pipePair('byp-rl', 'M640 495 H520')}`}
          ${showHc ? Array.from({ length: this._hcCount }, (_, n) => this._circuitSvg(n + 1)).join('') : ''}
          ${this._sourceSvg()}

          <g class="tap" ${de('flow')}><text class="pipe-label" id="t-vl" x="346" y="236" text-anchor="middle"></text></g>
          <g class="tap" ${de('volume')}><text class="vol-label" id="t-vol" x="346" y="275" text-anchor="middle"></text></g>
          <g class="tap" ${de('return')}><text class="pipe-label" id="t-rl" x="335" y="406" text-anchor="middle"></text></g>

          <g class="tap" ${de('mode')}>
            <rect class="unit" id="hp-box" x="50" y="190" width="240" height="235" rx="20"/>
            <text class="unit-title" x="170" y="218" text-anchor="middle">${i.heat_pump}</text>
            <circle class="fan-ring" cx="170" cy="288" r="50"/>
            <g class="fan" id="fan">
              ${this._sourceType === 'air' ? [0, 120, 240].map((a) => `<path class="blade" d="M170 288 C160 262 168 246 182 244 C186 262 180 278 170 288Z" transform="rotate(${a} 170 288)"/>`).join('')
                : '<path class="blade" d="M170 254 L184 288 L156 288Z M170 322 L156 288 L184 288Z"/>'}
              <circle cx="170" cy="288" r="7" class="hub"/>
            </g>
            <g class="snow" id="snow" transform="translate(170 288)"><circle class="snow-bg" r="18"/><g class="snow-flake"><path d="M0-13V13M-4-11 0-7 4-11M-4 11 0 7 4 11"/><g transform="rotate(60)"><path d="M0-13V13M-4-11 0-7 4-11M-4 11 0 7 4 11"/></g><g transform="rotate(120)"><path d="M0-13V13M-4-11 0-7 4-11M-4 11 0 7 4 11"/></g></g></g>
            <text class="unit-status" id="t-hp-status" x="170" y="366" text-anchor="middle"></text>
            <text class="unit-val" id="t-hp-power" x="170" y="390" text-anchor="middle"></text>
            <text class="unit-val strong" id="t-hp-cop" x="170" y="412" text-anchor="middle"></text>
          </g>
          ${this._sourceType === 'air' ? `<g class="tap" ${de(e.source_in ? 'source_in' : 'source_volume')}><text class="small" id="t-src-in" x="170" y="450" text-anchor="middle"></text></g>` : ''}
          ${this._heaterSvg('heater', 'inline')}

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
            ${this._heaterSvg('dhw_heater', 'dhw', 186)}
            ${P.circ ? `<g class="tap" ${de('circulation')}><text class="small circ" id="t-circ" x="650" y="60">↻ ${i.circulation}</text></g>` : ''}` : ''}

          ${P.buffer ? `
            <g class="tap" ${de('buffer_top')}>
              <text class="tank-title" x="580" y="310" text-anchor="middle">${i.buffer}</text>
              <rect class="tank" x="520" y="320" width="120" height="200" rx="26" fill="url(#g-buf)"/>
              <text class="tank-temp" id="t-buf-top" x="580" y="392" text-anchor="middle"></text>
              <text class="tank-sub" id="t-buf-bottom" x="580" y="502" text-anchor="middle"></text>
              <text class="small" id="t-buf-mode" x="580" y="542" text-anchor="middle"></text>
            </g>
            ${this._heaterSvg('buffer_heater', 'buf', 455)}` : ''}


          ${P.house ? `
            <g class="tap" ${de(e.room ? 'room' : 'room_target')}>
              <path class="house" d="M720 130 L830 50 L940 130 V240 H720 Z"/>
              <text class="tank-title" x="830" y="118" text-anchor="middle">${i.house}</text>
              <text class="house-temp" id="t-room" x="830" y="172" text-anchor="middle"></text>
              <text class="house-sub" id="t-room-target" x="830" y="202" text-anchor="middle"></text>
              <text class="small" id="t-outdoor" x="830" y="226" text-anchor="middle"></text>
            </g>` : (this._has('outdoor') ? `<g class="tap" ${de('outdoor')}><text class="small" id="t-outdoor" x="880" y="120" text-anchor="middle"></text></g>` : '')}
        </svg>
        ${this._controlsHtml()}
        <div class="stats" id="stats"></div>
        ${this._drawerHtml()}
      </ha-card>`;

    const tap = (ev) => this._tap(ev);
    this._$('svg').addEventListener('click', tap);
    this.shadowRoot.querySelector('.head').addEventListener('click', tap);
    this._$('stats').addEventListener('click', tap);
    const drawer = this._$('drawer-body');
    if (drawer) {
      drawer.addEventListener('click', tap);
      this._$('drawer-toggle').addEventListener('click', () => {
        this._drawerOpen = !this._drawerOpen;
        drawer.hidden = !this._drawerOpen;
        this._$('drawer-toggle').setAttribute('aria-expanded', String(this._drawerOpen));
      });
    }
    const ctl = this._$('controls');
    if (ctl) {
      ctl.addEventListener('click', (ev) => { const b = ev.target.closest('button[data-ctl]'); if (b) this._control(+b.dataset.ctl); });
      ctl.addEventListener('change', (ev) => { const el = ev.target.closest('[data-ctl]'); if (el) this._control(+el.dataset.ctl, el.value); });
    }
    this._rendered = true;
  }

  /* ---------- quick controls ---------- */
  _controlList() {
    return (this._config.controls || []).map((c) => (typeof c === 'string' ? { entity: c } : c))
      .filter((c) => c && c.entity && this._hass.states[c.entity]);
  }

  _controlKind(id) {
    const d = id.split('.')[0];
    if (['button', 'input_button', 'script', 'scene'].includes(d)) return 'press';
    if (['select', 'input_select', 'water_heater', 'climate'].includes(d)) return 'select';
    if (['number', 'input_number'].includes(d)) return 'number';
    return 'toggle';
  }

  _controlOptions(st) {
    const d = st.entity_id.split('.')[0];
    if (d === 'water_heater') return st.attributes.operation_list || [];
    if (d === 'climate') return st.attributes.hvac_modes || [];
    return st.attributes.options || [];
  }

  _stateText(st, value) {
    try { if (this._hass.formatEntityState) return this._hass.formatEntityState(st, value); } catch (e) { /* older HA */ }
    return value;
  }

  _controlsHtml() {
    const list = this._controlList();
    if (!list.length) return '';
    return `<div class="controls" id="controls">${list.map((c, n) => {
      const st = this._hass.states[c.entity];
      const name = this._esc(c.name || st.attributes.friendly_name || c.entity);
      const kind = this._controlKind(c.entity);
      if (kind === 'select') {
        return `<label class="ctl sel"><span>${name}</span><select data-ctl="${n}" id="ctl-${n}">${this._controlOptions(st).map((o) => `<option value="${this._esc(o)}">${this._esc(this._stateText(st, o))}</option>`).join('')}</select></label>`;
      }
      if (kind === 'number') {
        const a = st.attributes;
        return `<label class="ctl num"><span>${name}</span><input type="number" data-ctl="${n}" id="ctl-${n}" min="${a.min ?? ''}" max="${a.max ?? ''}" step="${a.step ?? 'any'}"><em>${this._esc(a.unit_of_measurement || '')}</em></label>`;
      }
      return `<button class="ctl ${kind}" data-ctl="${n}" id="ctl-${n}">${name}</button>`;
    }).join('')}</div>`;
  }

  _control(n, value) {
    const c = this._controlList()[n]; if (!c) return;
    const id = c.entity; const d = id.split('.')[0]; const kind = this._controlKind(id);
    const call = (domain, service, data = {}) => this._hass.callService(domain, service, { entity_id: id, ...data });
    if (kind === 'press') {
      if (d === 'script' || d === 'scene') call(d, 'turn_on'); else call(d, 'press');
    } else if (kind === 'select') {
      if (d === 'water_heater') call(d, 'set_operation_mode', { operation_mode: value });
      else if (d === 'climate') call(d, 'set_hvac_mode', { hvac_mode: value });
      else call(d, 'select_option', { option: value });
    } else if (kind === 'number') {
      const v = parseFloat(value); if (Number.isFinite(v)) call(d, 'set_value', { value: v });
    } else {
      call(['switch', 'input_boolean', 'light', 'fan', 'automation'].includes(d) ? d : 'homeassistant', 'toggle');
    }
  }

  _updateControls() {
    this._controlList().forEach((c, n) => {
      const el = this._$(`ctl-${n}`); if (!el) return;
      const st = this._hass.states[c.entity];
      const kind = this._controlKind(c.entity);
      if (kind === 'toggle') el.classList.toggle('on', ['on', 'open', 'heat', 'auto'].includes(st.state));
      else if (kind === 'select') { if (el.value !== st.state && this.shadowRoot.activeElement !== el) el.value = st.state; }
      else if (kind === 'number') { if (this.shadowRoot.activeElement !== el) el.value = st.state; }
    });
  }

  /* ---------- details drawer ---------- */
  // Rows of the drawer: [section, [[id, label, entity, value()]]]. Only existing entities (or computable values) are shown.
  _drawerRows() {
    const i = this._i; const D = i.det;
    const kwh = (key) => {
      const v = this._n(key); const u = this._unit(key);
      return u === 'wh' ? v / 1000 : u === 'mwh' ? v * 1000 : v;
    };
    // Entities that are unknown or unavailable (not reported by this model) are left out.
    const ok = (key) => this._has(key) && !['unknown', 'unavailable'].includes(this._s(key));
    const row = (key) => (ok(key) ? [key, D[key], this._e[key], () => this._fmtState(key)] : null);
    const op = ['hours', 'starts_total', 'aux_hours', 'energy_total', 'heat_total'].map(row);
    if (ok('energy_total') && ok('heat_total')) {
      op.push(['cop_total', D.cop_total, this._e.heat_total, () => { const c = kwh('heat_total') / kwh('energy_total'); return Number.isFinite(c) && c > 0 ? `≈${this._fmt(c, 2)}` : '–'; }]);
    }
    const rf = ['compressor_speed', 'evap_temp', 'cond_temp', 'suction_temp', 'hot_gas', 'liquid_temp', 'low_pressure', 'high_pressure', 'eev'].map(row);
    // Superheat = suction gas − evaporation, subcooling = condensation − liquid line, unless the integration provides them.
    const diff = (a, b) => { const v = this._n(a) - this._n(b); return Number.isFinite(v) ? `${this._fmt(v, 1)} K` : '–'; };
    rf.push(row('superheat') || (ok('suction_temp') && ok('evap_temp') ? ['superheat', D.superheat, this._e.suction_temp, () => diff('suction_temp', 'evap_temp')] : null));
    rf.push(row('subcooling') || (ok('cond_temp') && ok('liquid_temp') ? ['subcooling', D.subcooling, this._e.liquid_temp, () => diff('cond_temp', 'liquid_temp')] : null));
    const more = (this._config.details || []).map((d, n) => (typeof d === 'string' ? { entity: d } : d)).filter((d) => d && this._hass.states[d.entity])
      .map((d, n) => [`x${n}`, d.name || this._hass.states[d.entity].attributes.friendly_name || d.entity, d.entity, () => this._fmtState(null, d)]);
    return [[i.sec_operation, op.filter(Boolean)], [i.sec_refrigerant, rf.filter(Boolean)], [i.sec_more, more]].filter(([, r]) => r.length);
  }

  // Formats an entity value with its unit: integers without decimals, large values with none, others with one.
  _fmtState(key, spec) {
    const id = spec ? spec.entity : this._e[key];
    const st = this._hass.states[id]; if (!st) return '–';
    let v = parseFloat(st.state);
    if (!Number.isFinite(v)) return ['unknown', 'unavailable'].includes(st.state) ? '–' : this._stateText(st, st.state);
    let unit = spec?.unit ?? st.attributes.unit_of_measurement ?? '';
    // Energy counters in Wh (e.g. Lambda) read better in kWh.
    if (!spec?.unit && unit === 'Wh' && Math.abs(v) >= 1000) { v /= 1000; unit = 'kWh'; }
    const d = spec?.decimals ?? (Number.isInteger(v) || Math.abs(v) >= 100 ? 0 : 1);
    return `${this._fmt(v, d)} ${unit}`.trim();
  }

  _drawerHtml() {
    const sections = this._drawerRows();
    if (!sections.length) return '';
    if (this._drawerOpen === undefined) this._drawerOpen = !!this._config.details_open;
    const chevron = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    return `<div class="drawer">
      <button class="drawer-toggle" id="drawer-toggle" aria-expanded="${this._drawerOpen}">${this._i.details}${chevron}</button>
      <div class="drawer-body" id="drawer-body" ${this._drawerOpen ? '' : 'hidden'}>${sections.map(([title, rows]) => `<div class="dsec"><div class="dsec-title">${this._esc(title)}</div>
        <div class="dgrid">${rows.map(([id, label, entity]) => `<div class="drow" data-entity="${this._esc(entity)}"><span>${this._esc(label)}</span><b id="d-${id}"></b></div>`).join('')}</div></div>`).join('')}</div>
    </div>`;
  }

  _updateDrawer() {
    if (!this._$('drawer-body')) return;
    this._drawerRows().forEach(([, rows]) => rows.forEach(([id, , , value]) => this._txt(`d-${id}`, value())));
  }

  // Heating circuit n (1-3). Circuits 2 and 3 sit below circuit 1, fed by risers from its flow and return.
  _circuitSvg(n) {
    const i = this._i; const e = this._e;
    const s = n === 1 ? '' : String(n);
    const dy = (n - 1) * 250;
    const k = (key) => this._hk(n, key);
    const de = (key) => (e[key] ? `data-entity="${this._esc(e[key])}"` : '');
    const name = this._config[n === 1 ? 'hc_name' : `hc${n}_name`];
    const title = this._esc(name || (this._hcCount > 1 ? `${i.heating_circuit} ${n}` : i.heating_circuit));
    const em = this._emitter(this._hcTypes[n - 1], title);
    let { vl, rl } = em;
    if (n > 1) { vl = vl.replace('M640 ', 'M660 '); rl = rl.replace(/H640$/, 'H676'); }
    const pp = (id, d) => `<path class="pipe" id="p-${id}" d="${d}"/><path class="flow" id="f-${id}" d="${d}"/>`;
    const risers = n > 1 ? pp(`hc-up${s}`, `M660 360 V${360 + dy}`) + pp(`hc-down${s}`, `M676 ${495 + dy} V495`) : '';
    return `${risers}<g transform="translate(0 ${dy})">
      <defs><linearGradient id="g-rad${s}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" id="g-rad${s}-top"/><stop offset="100%" id="g-rad${s}-bottom"/></linearGradient></defs>
      ${em.art.split('__S__').join(s)}${pp(`hc-vl${s}`, vl)}${pp(`hc-body${s}`, em.body)}${pp(`hc-rl${s}`, rl)}
      <g class="tap" ${de(k('flow'))}><text class="pipe-label" id="t-hc${s}" x="740" y="334" text-anchor="middle"></text></g>
      <g class="tap" ${de(k('volume'))}><text class="vol-label" id="t-hc-vol${s}" x="720" y="394" text-anchor="middle"></text></g>
      <g class="tap" ${de(e[k('pump')] ? k('pump') : k('mode'))}>
        <circle class="pump" cx="720" cy="360" r="16"/>
        <g class="impeller" id="impeller${s}"><path d="M720 348 L726 360 L714 360Z M720 372 L714 360 L726 360Z" class="imp"/></g>
        ${em.title}
        <text class="small" id="t-hc-mode${s}" x="880" y="524" text-anchor="middle"></text>
      </g>
    </g>`;
  }

  // Heater rod entering a tank from the right wall at height y; backup / inline heater as a box inside the heat pump.
  _heaterSvg(key, id, y) {
    if (!this._has(key)) return '';
    const de = `data-entity="${this._esc(this._e[key])}"`;
    if (id === 'inline') {
      return `<g class="tap heater" id="heater-${id}" ${de}><rect class="heater-box" x="230" y="266" width="46" height="30" rx="6"/>
        <path class="heater-el" d="M236 281 l4 -8 l6 16 l6 -16 l6 16 l6 -16 l6 16 l4 -8"/></g>`;
    }
    return `<g class="tap heater" id="heater-${id}" ${de}><rect class="heater-flange" x="638" y="${y - 9}" width="9" height="18" rx="2"/>
      <path class="heater-el" d="M640 ${y - 4} H${id === 'dhw' ? 610 : 584} Q${id === 'dhw' ? 604 : 578} ${y - 4} ${id === 'dhw' ? 604 : 578} ${y} Q${id === 'dhw' ? 604 : 578} ${y + 4} ${id === 'dhw' ? 610 : 584} ${y + 4} H640"/></g>`;
  }

  // Ground loop (brine) or two wells (groundwater) below the heat pump; air keeps the fan.
  _sourceSvg() {
    if (this._sourceType === 'air') return '';
    const pp = (id, d) => `<path class="pipe src" id="p-${id}" d="${d}"/><path class="flow" id="f-${id}" d="${d}"/>`;
    const ground = '<path class="ground" d="M60 478 H280"/>';
    const out = this._e.source_out ? `data-entity="${this._esc(this._e.source_out)}"` : '';
    const inn = this._e.source_in ? `data-entity="${this._esc(this._e.source_in)}"` : '';
    const labels = `<g class="tap" ${out}><text class="small" id="t-src-out" x="130" y="462" text-anchor="end"></text></g>
      <g class="tap" ${inn}><text class="small" id="t-src-in" x="210" y="462"></text></g>
      <g class="tap" ${this._e.source_volume ? `data-entity="${this._esc(this._e.source_volume)}"` : ''}><text class="vol-label" id="t-src-vol" x="212" y="512"></text></g>`;
    if (this._sourceType === 'brine') {
      return `${ground}${pp('src', 'M140 425 V528 Q140 548 170 548 Q200 548 200 528 V425')}${labels}`;
    }
    return `${ground}<rect class="well" x="126" y="486" width="28" height="66" rx="4"/><rect class="well" x="186" y="486" width="28" height="66" rx="4"/>
      <path class="water" d="M128 512 q6 -4 12 0 t12 0 M188 512 q6 -4 12 0 t12 0"/>
      ${pp('src-in', 'M200 540 V425')}${pp('src-out', 'M140 425 V540')}${labels}`;
  }

  // Entity behind a power source: the manual entity, or the Energy dashboard's power sensor.
  _srcEntity(key) {
    if (this._parts.power !== 'energy') return this._e[key];
    const r = this._energy[{ pv: 'solar', battery: 'battery', grid: 'grid' }[key]][0];
    return r && (r.id || r.from || r.to);
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
    let hp = this._norm(this._maps.mode, rawMode);
    const dhwMode = this._norm(this._maps.dhw, this._s('dhw_mode'));
    const bufMode = this._norm(this._maps.buffer, this._s('buffer_mode'));
    const power = this._w('power');
    const vol = this._lh('volume');
    const tFlow = this._n('flow'); const tRet = this._n('return');
    const spread = Number.isFinite(tFlow) && Number.isFinite(tRet) ? tFlow - tRet : NaN;
    // Compressor may be a binary sensor or a numeric one (frequency / speed > 0 means running).
    const compOn = this._has('compressor') && (this._on('compressor') || this._n('compressor') > 0);
    const running = compOn || power > this._threshold || this._runningStates.includes(status)
      || (!this._has('compressor') && !this._has('power') && !this._has('status') && ['heating', 'dhw', 'cooling', 'defrost'].includes(hp));
    const defrost = hp === 'defrost' || status.toUpperCase().includes('DEFROST') || (this._has('defrost') && this._on('defrost'));
    // Valve: binary (on = DHW) or a state such as "Tank" / "DHW".
    const valveDhw = this._has('valve') && (this._on('valve') || ['tank', 'dhw', 'hot water', 'warmwasser'].includes(String(this._s('valve')).toLowerCase()));
    // Integrations without an operating-mode entity: a running compressor means heating unless the valve says DHW.
    if (!this._has('mode')) hp = !running ? 'idle' : (defrost ? 'defrost' : (valveDhw ? 'dhw' : 'heating'));
    const cooling = hp === 'cooling' || bufMode === 'cooling';

    const dhwActive = P.dhw && (hp === 'dhw' || ['dhw', 'legionella'].includes(dhwMode) || valveDhw);
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

    if (P.hc || this._hcCount > 1) {
      const pick = (...v) => v.find((x) => Number.isFinite(x)) ?? NaN;
      for (let n = 1; n <= this._hcCount; n++) {
        const k = (key) => this._hk(n, key);
        const s = n === 1 ? '' : String(n);
        const cMode = this._norm(this._maps.hc, this._s(k('mode')));
        // Circuit pump, else circuit mode, else assume the circuit runs whenever the heat pump heats or cools.
        const hcOn = this._has(k('pump')) ? this._on(k('pump')) : (this._has(k('mode')) ? ['heating', 'cooling'].includes(cMode) : toHeat);
        // Without circuit sensors fall back to the buffer / main loop temperatures.
        const tHc = pick(this._n(k('flow')), this._n('buffer_top'), toHeat ? tFlow : tRet);
        const tHcR = pick(this._n(k('return')), this._n('buffer_bottom'), tRet);
        const cHc = cMode === 'cooling' ? '#7dd3fc' : this._vlColor(tHc);
        stroke(`hc-vl${s}`, cHc); stroke(`hc-body${s}`, cHc); stroke(`hc-rl${s}`, this._rlColor(tHcR));
        if (n > 1) { stroke(`hc-up${s}`, cHc); stroke(`hc-down${s}`, this._rlColor(tHcR)); pipe(`hc-up${s}`, hcOn); pipe(`hc-down${s}`, hcOn); }
        const rt = this._$(`g-rad${s}-top`); const rb = this._$(`g-rad${s}-bottom`);
        if (rt) { rt.setAttribute('stop-color', hcOn ? cHc : 'var(--disabled-text-color, #9e9e9e)'); rb.setAttribute('stop-color', hcOn ? this._rlColor(tHcR) : 'var(--disabled-text-color, #9e9e9e)'); }
        [`hc-vl${s}`, `hc-body${s}`, `hc-rl${s}`].forEach((id) => pipe(id, hcOn));
        this._cls(`impeller${s}`, hcOn);
        this._cls(`waves${s}`, hcOn && cMode !== 'cooling');
        const set = this._n(k('setpoint'));
        this._txt(`t-hc${s}`, this._has(k('flow')) ? `${this._t(tHc)}${Number.isFinite(set) ? ` · ${i.target} ${this._fmt(set)}` : ''}` : '');
        const hcVol = this._lh(k('volume'));
        this._txt(`t-hc-vol${s}`, this._has(k('volume')) && Number.isFinite(hcVol) ? `${this._fmt(hcVol, 0)} l/h` : '');
        this._txt(`t-hc-mode${s}`, this._has(k('mode')) ? this._modeLabel(cMode, this._s(k('mode'))) : (hcOn ? i.running : ''));
      }
    }

    // heaters
    [['heater', 'inline'], ['dhw_heater', 'dhw'], ['buffer_heater', 'buf']].forEach(([key, id]) => {
      const el = this._$(`heater-${id}`); if (!el) return;
      const lv = this._level(key);
      el.classList.toggle('on', lv > 0); el.classList.toggle('stage2', lv > 1);
    });

    this._txt('t-vl', this._has('flow') ? `VL ${this._t(tFlow)}` : '');
    this._txt('t-rl', this._has('return') ? `RL ${this._t(tRet)}` : '');
    this._txt('t-vol', this._has('volume') && loop && Number.isFinite(vol) ? `${this._fmt(vol, 0)} l/h` : '');

    // heat pump
    this._cls('fan', running); this._cls('snow', defrost && this._sourceType === 'air'); this._cls('hp-box', running);
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
    if (this._sourceType === 'air') this._txt('t-src-in', srcParts.join(' · '));
    else {
      const brine = this._sourceType === 'brine';
      this._txt('t-src-in', this._has('source_in') ? `${brine ? i.brine_in : i.well_in} ${this._t(this._n('source_in'))}` : '');
      this._txt('t-src-out', this._has('source_out') ? `${brine ? i.brine_out : i.well_out} ${this._t(this._n('source_out'))}` : '');
      this._txt('t-src-vol', this._has('source_volume') && srcVol > 0 ? `${this._fmt(srcVol, 0)} l/h` : '');
      ['src', 'src-in', 'src-out'].forEach((id) => pipe(id, running));
    }

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
      const split = P.power === 'energy' ? this._energySplit() : null;
      [['pv', 'pv', i.pv], ['bat', 'battery', i.battery], ['grid', 'grid', i.grid]].forEach(([id, key, label]) => {
        const w = P.power === 'energy' ? (split ? split[key] : NaN) : this._w(key); const on = w > 10;
        this._cls(`ef-${id}`, on); this._cls(`src-${id}`, on);
        this._txt(`t-src-${id}`, on ? `${label} ${P.power === 'energy' ? '≈' : ''}${this._fmt(w, 0)} W` : label);
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
    this._updateControls();
    this._updateDrawer();
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
  .chip .ico { display: inline-block; width: 1.1em; height: 1.1em; vertical-align: -.2em; margin-right: 4px; fill: none; stroke: currentColor; stroke-width: 2.2; }
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
  .snow { opacity: 0; }
  .snow-bg { fill: var(--card-background-color, #fff); opacity: .85; }
  .snow-flake { fill: none; stroke: #0ea5e9; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
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
  .heater-el { fill: none; stroke: var(--disabled-text-color, #9e9e9e); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
  .heater-flange, .heater-box { fill: var(--secondary-background-color, rgba(127,127,127,.15)); stroke: var(--divider-color, rgba(127,127,127,.5)); stroke-width: 1.5; }
  .heater.on .heater-el { stroke: #f97316; filter: url(#glow); }
  .heater.on.stage2 .heater-el { stroke: #dc2626; }
  .ground { fill: none; stroke: #a16207; stroke-width: 3; stroke-dasharray: 10 5; opacity: .7; }
  .well { fill: none; stroke: var(--divider-color, rgba(127,127,127,.5)); stroke-width: 2; }
  .water { fill: none; stroke: #38bdf8; stroke-width: 2; }
  .pipe.src { stroke: #60a5fa; }
  .radiator { fill: var(--secondary-background-color, rgba(127,127,127,.12)); stroke: var(--divider-color, rgba(127,127,127,.4)); stroke-width: 2; }
  .rib { fill: url(#g-rad); stroke: rgba(0,0,0,.08); stroke-width: 1; }
  #p-hc-body, #f-hc-body { display: var(--hfc-body, inline); }
  .wave { fill: none; stroke: #f97316; stroke-width: 3; stroke-linecap: round; opacity: 0; }
  .waves.on .wave { animation: hfc-rise 2.4s ease-in-out infinite; }
  .waves.on .wave:nth-child(2) { animation-delay: .8s; } .waves.on .wave:nth-child(3) { animation-delay: 1.6s; }
  .hint { margin: 4px 4px 8px; padding: 8px 12px; border-radius: 8px; background: rgba(249,115,22,.14); color: var(--primary-text-color); font-size: .9em; }
  .controls { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 4px 0; }
  .ctl { font: inherit; font-size: .88em; color: var(--primary-text-color); background: var(--secondary-background-color, rgba(127,127,127,.12));
    border: 1px solid var(--divider-color, rgba(127,127,127,.3)); border-radius: 999px; padding: 5px 12px; display: inline-flex; align-items: center; gap: 6px; }
  button.ctl { cursor: pointer; }
  button.ctl.toggle.on { background: rgba(249,115,22,.18); border-color: #f97316; color: #ea580c; }
  button.ctl.press:active { background: rgba(249,115,22,.25); }
  .ctl select, .ctl input { font: inherit; color: inherit; background: transparent; border: none; outline: none; max-width: 11em; }
  .ctl input { width: 3.5em; }
  .ctl em { font-style: normal; color: var(--hfc-muted); }
  .ctl select option { color: #000; }
  .drawer { margin: 6px 4px 0; }
  .drawer-toggle { font: inherit; font-size: .9em; color: var(--hfc-muted); background: none; border: none; cursor: pointer; padding: 4px 0; display: inline-flex; align-items: center; gap: 4px; }
  .drawer-toggle svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; transition: transform .2s; }
  .drawer-toggle[aria-expanded="true"] svg { transform: rotate(180deg); }
  .dsec { margin: 4px 0 10px; }
  .dsec-title { font-size: .78em; text-transform: uppercase; letter-spacing: .04em; color: var(--hfc-muted); margin-bottom: 4px; }
  .dgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 2px 16px; }
  .drow { cursor: pointer; display: flex; justify-content: space-between; gap: 8px; padding: 4px 0; border-bottom: 1px solid var(--divider-color, rgba(127,127,127,.18)); font-size: .9em; color: var(--primary-text-color); }
  .drow span { color: var(--hfc-muted); }
  .drow b { white-space: nowrap; }
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

// Card editor: the same form as getConfigForm, but entity pickers show what the preset found,
// only the configured number of circuits is offered, and the preset field reports the detection.
class HeatpumpFlowCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; this._resolved = null; this._render(); }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (this._form) this._form.hass = hass;
    if (first) this._render();
  }

  _render() {
    try { this._renderForm(); } catch (err) { console.error('heatpump-flow-card editor:', err); }
  }

  _renderForm() {
    if (!this._config || !this._hass) return;
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.addEventListener('value-changed', (ev) => { ev.stopPropagation(); this._changed(ev.detail.value); });
      this._warn = document.createElement('div');
      this.appendChild(this._warn);
      this.appendChild(this._form);
    }
    const r = HeatpumpFlowCard._resolve(this._config, this._hass);
    // Only entities that exist are shown as found by the preset.
    this._fromPreset = Object.fromEntries(Object.entries(r.fromPreset).filter(([, id]) => this._hass.states[id]));
    const { schema, computeLabel, L } = HeatpumpFlowCard._formSchema(this._config);
    const own = this._config.entities || {};
    const shown = { ...this._fromPreset };
    Object.entries(own).forEach(([k, v]) => { if (v === null || v === 'none') delete shown[k]; else if (v) shown[k] = v; });
    const found = Object.keys(this._fromPreset).length;
    // Core entities the card needs; warn about what is missing (not while a preset is not detected, its field says so).
    const has = (k) => { const id = r.entities[k]; return !!(id && this._hass.states[id]); };
    const warn = [];
    if (!(r.preset && !r.ready)) {
      if (!['mode', 'compressor', 'status', 'power'].some(has)) warn.push(L.warn_running);
      if (!has('power')) warn.push(L.warn_power);
      if (!has('flow') || !has('return')) warn.push(L.warn_temps);
      if (!has('heat') && !has('volume')) warn.push(L.warn_heat);
    }
    const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const html = warn.length ? `<ha-alert alert-type="info" title="${esc(L.warn_title)}"><ul style="margin:0;padding-left:18px">${warn.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></ha-alert>` : '';
    if (this._warn._html !== html) { this._warn.innerHTML = html; this._warn._html = html; this._warn.style.marginBottom = html ? '12px' : '0'; }
    this._form.hass = this._hass;
    this._form.schema = schema;
    this._form.computeLabel = computeLabel;
    this._form.computeHelper = (s) => {
      if (s.name === 'preset') {
        if (!r.preset) return '';
        const status = r.ready ? `${L.detected}${r.prefix ? ` · ${r.prefix}` : ''} · ${found} ${L.entities_found}. ${L.preset_help}` : L.not_detected;
        return r.preset.tested ? status : `${status} ${L.untested_help}`;
      }
      if (own[s.name] === undefined && this._fromPreset[s.name]) return L.from_preset;
      if (['pv', 'battery', 'grid'].includes(s.name) && !own[s.name] && this._config.power_sources !== 'manual') return L.from_energy;
      return '';
    };
    this._form.data = { ...this._config, entities: shown };
  }

  // Writes back only what differs from the preset: other entities as overrides, cleared preset entities as null.
  _changed(value) {
    const own = this._config.entities || {};
    const shownBefore = { ...this._fromPreset, ...Object.fromEntries(Object.entries(own).filter(([, v]) => v)) };
    const next = value.entities || {};
    const ents = {};
    new Set([...Object.keys(next), ...Object.keys(own), ...Object.keys(this._fromPreset)]).forEach((k) => {
      const v = next[k];
      if (v) {
        if (v !== this._fromPreset[k] || own[k] === v) ents[k] = v;
      } else if (this._fromPreset[k] || own[k] === null || own[k] === 'none') {
        // A preset entity that was shown and is now empty, or one that was already removed.
        if (shownBefore[k] || own[k] === null || own[k] === 'none') ents[k] = null;
      }
    });
    const config = { ...value };
    if (Object.keys(ents).length) config.entities = ents; else delete config.entities;
    this._config = config;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config }, bubbles: true, composed: true }));
    this._render();
  }
}
if (!customElements.get('heatpump-flow-card-editor')) customElements.define('heatpump-flow-card-editor', HeatpumpFlowCardEditor);
if (!customElements.get('heatpump-flow-card')) customElements.define('heatpump-flow-card', HeatpumpFlowCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === 'heatpump-flow-card')) {
  window.customCards.push({
    type: 'heatpump-flow-card',
    name: 'Heatpump Flow Card',
    description: 'Animated hydraulic schematic for heat pumps (power sources, valve, tanks, heating circuit). Presets: Lambda, Viessmann, Vaillant, EMS-ESP (Bosch/Buderus/Junkers/Nefit), Panasonic Aquarea (HeishaMon).',
    preview: true,
    documentationURL: 'https://github.com/Sturmi77/heatpump-flow-card',
  });
}
console.info(`%c HEATPUMP-FLOW-CARD %c ${HFC_VERSION} `, 'background:#f97316;color:#fff;border-radius:3px 0 0 3px', 'background:#334155;color:#fff;border-radius:0 3px 3px 0');
