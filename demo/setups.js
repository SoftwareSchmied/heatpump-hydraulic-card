// Simulated installations shared by the live demo (demo/index.html) and the self-test (test/selftest.html).
const lambdaStates = (x, s) => {
  const v = {
    [`${x}hp1_operating_state`]: 'CH', [`${x}hp1_state`]: 'REGULATION',
    [`${x}hp1_inverter_power_consumption`]: '1240', [`${x}hp1_actual_heating_capacity`]: '6.3',
    [`${x}hp1_flow_line_temperature`]: '32.4', [`${x}hp1_return_line_temperature`]: '27.9',
    [`${x}hp1_volume_flow_heat_sink`]: '2281', [`${x}hp1_energy_source_inlet_temperature`]: '9.8',
    [`${x}ambient_temperature_calculated`]: '10.4',
    [`${x}boil1_actual_high_temperature`]: '46.0', [`${x}boil1_actual_low_temperature`]: '38.5',
    [`${x}boil1_target_high_temperature`]: '50.0', [`${x}boil1_operating_state`]: 'STBY',
    [`${x}boil1_actual_circulation_pump_state`]: 'Off',
    [`${x}buff1_actual_high_temperature`]: '31.2', [`${x}buff1_actual_low_temperature`]: '27.4', [`${x}buff1_operating_state`]: 'HEATING',
    [`${x}hc1_flow_line_temperature`]: '30.1', [`${x}hc1_flow_line_temperature_setpoint`]: '30.2', [`${x}hc1_operating_state`]: 'HEATING',
    [`${x}hc1_room_device_temperature`]: 'unknown', [`${x}hc1_target_room_temperature`]: '23.0',
    [`${x}hp1_heating_cop_daily`]: '5.05', [`${x}hp1_hot_water_cop_daily`]: '4.15', [`${x}hp1_compressor_start_cycling_daily`]: '3',
    [`${x}hp1_relais_state_2nd_heating_stage`]: 'Off',
    [`${x}hp1_heating_cop_monthly`]: '4.62', [`${x}hp1_heating_cop_yearly`]: '4.48', [`${x}hp1_heating_cop_total`]: '4.51',
    [`${x}hp1_hot_water_cop_monthly`]: '3.95',
    [`${x}hp1_heating_energy_daily`]: ['4.2', 'kWh'], [`${x}hp1_heating_thermal_energy_daily`]: ['20.4', 'kWh'],
    [`${x}hp1_hot_water_energy_daily`]: ['0.9', 'kWh'], [`${x}hp1_hot_water_thermal_energy_daily`]: ['3.7', 'kWh'],
    [`${x}hp1_heating_energy_total`]: { state: '2410.2', attributes: { unit_of_measurement: 'kWh', state_class: 'total_increasing' } },
    [`${x}hp1_compressor_start_cycling_yesterday`]: '5', [`${x}hp1_defrost_cycling_daily`]: '2', [`${x}hp1_defrost_cycling_yesterday`]: '4',
    [`${x}hp1_stby_energy_daily`]: ['0.12', 'kWh'],
    [`${x}hp1_compressor_start_cycling_total`]: ['1843', 'cycles'],
    [`${x}hp1_compressor_power_consumption_accumulated`]: ['3120.4', 'kWh'],
    [`${x}hp1_compressor_thermal_energy_output_accumulated`]: ['14210.8', 'kWh'],
    [`${x}hp1_compressor_unit_rating`]: ['46', '%'],
    [`${x}hp1_evaporation_temperature`]: ['3.6', '°C'], [`${x}hp1_condensation_temperature`]: ['36.9', '°C'],
    [`${x}hp1_suction_gas_temperature`]: ['8.4', '°C'], [`${x}hp1_hot_gas_temperature`]: ['61.5', '°C'],
    [`${x}hp1_subcooling_temperature`]: ['3.1', '°C'], [`${x}hp1_expansion_valve_opening_angle`]: ['38', '%'],
    [`${x}hp1_error_number`]: '0', [`${x}boil1_error_number`]: '0', [`${x}buff1_error_number`]: '0', [`${x}hc1_error_number`]: '0', [`${x}ambient_error_number`]: '0',
  };
  const S = {
    heat: {},
    dhw: { [`${x}hp1_compressor_unit_rating`]: ['62', '%'], [`${x}hp1_condensation_temperature`]: ['52.4', '°C'], [`${x}hp1_hot_gas_temperature`]: ['78.0', '°C'],
      [`${x}hp1_operating_state`]: 'DHW', [`${x}boil1_operating_state`]: 'DHW', [`${x}buff1_operating_state`]: 'STBY',
      [`${x}hp1_flow_line_temperature`]: '48.6', [`${x}hp1_return_line_temperature`]: '43.1', [`${x}hp1_inverter_power_consumption`]: '1650',
      [`${x}hp1_actual_heating_capacity`]: '6.9', [`${x}boil1_actual_circulation_pump_state`]: 'On' },
    defrost: { [`${x}hp1_operating_state`]: 'DEFROST', [`${x}hp1_flow_line_temperature`]: '24.0', [`${x}hp1_actual_heating_capacity`]: '0',
      [`${x}hp1_relais_state_2nd_heating_stage`]: 'On' },
    idle: { ...Object.fromEntries(['compressor_unit_rating', 'evaporation_temperature', 'condensation_temperature', 'suction_gas_temperature',
        'hot_gas_temperature', 'subcooling_temperature', 'expansion_valve_opening_angle'].map((k) => [`${x}hp1_${k}`, 'unknown'])),
      [`${x}hp1_operating_state`]: 'STBY', [`${x}hp1_state`]: 'READY', [`${x}hp1_inverter_power_consumption`]: '0',
      [`${x}hp1_actual_heating_capacity`]: '0', [`${x}buff1_operating_state`]: 'STBY', [`${x}hp1_error_number`]: '7' },
  }[s];
  const out = {};
  for (const [k, val] of Object.entries({ ...v, ...S })) out[`sensor.${k}`] = val;
  return out;
};
const extras = (s) => ({
  'sensor.living_room_temperature': '22.8', 'sensor.heatpump_energy_today': '5.1', 'sensor.heatpump_pv_share_today': '24',
  'sensor.heatpump_power_from_pv': s === 'heat' ? '820' : '0', 'sensor.heatpump_power_from_battery': s === 'dhw' ? '1650' : '0',
  'sensor.heatpump_power_from_grid': s === 'heat' ? '420' : (s === 'defrost' ? '900' : '0'),
  'input_boolean.heatpump_boost': { state: s === 'dhw' ? 'on' : 'off', attributes: { friendly_name: 'Boost' } },
  'select.heatpump_operating_mode': { state: 'Automatic', attributes: { friendly_name: 'Operating mode', options: ['Automatic', 'Manual', 'Summer', 'Off'] } },
  'number.heatpump_dhw_target': { state: '50', attributes: { friendly_name: 'DHW target', min: 40, max: 60, step: 1, unit_of_measurement: '°C' } },
  'button.heatpump_dhw_boost': { state: 'unknown', attributes: { friendly_name: 'DHW boost once' } },
  'sensor.heating_curve_flow': ['33.5', '°C'],
  // Cut-out counters: events since the counter started, no unit.
  'sensor.heatpump_cutouts_high_pressure': { state: '3', attributes: { state_class: 'total_increasing' } },
  'sensor.heatpump_cutouts_low_pressure': { state: '0', attributes: { state_class: 'total_increasing' } },
  'sensor.heatpump_cutouts_temperature': { state: '12', attributes: { state_class: 'total_increasing' } },
  'sensor.heatpump_dhw_middle': ['42.3', '°C'], 'sensor.heatpump_buffer_middle': ['29.4', '°C'],
  // Heating program and a solar thermal collector (pump runs while the collector is hotter than the tank).
  'select.heatpump_heating_program': { state: { heat: 'Eco', dhw: 'Party', defrost: 'Night', idle: 'Holiday' }[s], attributes: { friendly_name: 'Heating program' } },
  'sensor.heatpump_solar_collector': [{ heat: '58.4', dhw: '71.0', defrost: '12.5', idle: '44.0' }[s], '°C'],
  'binary_sensor.heatpump_solar_pump': s === 'heat' || s === 'dhw' ? 'on' : 'off',
});
const otherStates = (s) => ({
  'sensor.wp_betriebsart': { heat: 'Heating', dhw: 'Hot water', defrost: 'Defrost', idle: 'Standby' }[s],
  'sensor.wp_vorlauf': { heat: '35.2', dhw: '52.0', defrost: '22', idle: '29' }[s],
  'sensor.wp_ruecklauf': { heat: '30.4', dhw: '46.5', defrost: '24', idle: '28.5' }[s],
  'sensor.wp_leistung': { heat: '1800', dhw: '2100', defrost: '900', idle: '3' }[s],
  'sensor.ww_temperatur': '47.5', 'sensor.aussen': '-2.4',
});

// ViCare: German entity ids, resolved via translation_key in the entity registry. Values may carry units.
const vicareReg = {
  'sensor.vitocal_verdichterphase': 'compressor_phase', 'binary_sensor.vitocal_verdichter': 'compressor',
  'binary_sensor.vitocal_warmwasser_laden': 'domestic_hot_water_charging', 'sensor.vitocal_vorlauf_sekundar': 'secondary_circuit_supply_temperature',
  'sensor.vitocal_rucklauf_sekundar': 'secondary_circuit_return_temperature', 'sensor.vitocal_volumenstrom': 'volumetric_flow',
  'sensor.vitocal_vorlauf_primar': 'primary_circuit_supply_temperature', 'sensor.vitocal_aussentemperatur': 'outside_temperature',
  'sensor.vitocal_speicher_oben': 'dhw_storage_top_temperature', 'sensor.vitocal_speicher_unten': 'dhw_storage_bottom_temperature',
  'binary_sensor.vitocal_heizkreispumpe': 'circulation_pump', 'sensor.vitocal_cop_heizen': 'cop_heating', 'sensor.vitocal_cop_ww': 'cop_dhw',
  'sensor.vitocal_stromverbrauch_heute': 'power_consumption_today', 'sensor.vitocal_verdichterstarts': 'compressor_starts',
};
const vicareStates = (s) => ({
  'sensor.vitocal_verdichterphase': { heat: 'heating', dhw: 'heating', defrost: 'defrost', idle: 'pause' }[s],
  'binary_sensor.vitocal_verdichter': s === 'idle' ? 'off' : 'on', 'binary_sensor.vitocal_warmwasser_laden': s === 'dhw' ? 'on' : 'off',
  'sensor.vitocal_vorlauf_sekundar': [{ heat: '42.5', dhw: '51.0', defrost: '25', idle: '30' }[s], '°C'],
  'sensor.vitocal_rucklauf_sekundar': [{ heat: '36.0', dhw: '45.5', defrost: '27', idle: '29.5' }[s], '°C'],
  'sensor.vitocal_volumenstrom': [s === 'idle' ? '0' : '0.95', 'm³/h'], 'sensor.vitocal_vorlauf_primar': ['2.1', '°C'],
  'sensor.vitocal_aussentemperatur': ['1.4', '°C'], 'sensor.vitocal_speicher_oben': ['49.0', '°C'], 'sensor.vitocal_speicher_unten': ['41.0', '°C'],
  'binary_sensor.vitocal_heizkreispumpe': s === 'idle' ? 'off' : 'on', 'sensor.vitocal_cop_heizen': '3.9', 'sensor.vitocal_cop_ww': '3.1',
  'sensor.vitocal_stromverbrauch_heute': ['8.4', 'kWh'], 'sensor.vitocal_verdichterstarts': '4123',
});
const vaillantStates = (s) => ({
  'sensor.zuhause_energy_manager_state': { heat: 'HEATING', dhw: 'DHW', defrost: 'HEATING', idle: 'STANDBY' }[s],
  'sensor.zuhause_system_flow_temperature': [{ heat: '34.0', dhw: '52.5', defrost: '30', idle: '28' }[s], '°C'],
  'sensor.zuhause_outdoor_temperature': ['3.5', '°C'], 'sensor.zuhause_domestic_hot_water_0_tank_temperature': ['47.0', '°C'],
  'sensor.zuhause_domestic_hot_water_0_setpoint': ['50', '°C'], 'sensor.zuhause_circuit_0_current_flow_temperature': ['32.8', '°C'],
  'sensor.zuhause_circuit_0_flow_temperature_setpoint': ['33.5', '°C'], 'sensor.zuhause_circuit_0_state': s === 'idle' ? 'STANDBY' : 'HEATING',
  'sensor.zuhause_device_1_arotherm_plus_current_power': [s === 'idle' ? '0.01' : '1.35', 'kW'],
  'sensor.zuhause_zone_wohnen_current_temperature': ['21.6', '°C'], 'sensor.zuhause_zone_wohnen_desired_temperature': ['21.5', '°C'],
  'binary_sensor.zuhause_trouble_codes': s === 'idle' ? 'on' : 'off',
});

// EMS-ESP (Bosch/Buderus …), German enum texts, entity format with instance prefix.
const emsStates = (s) => ({
  'sensor.ems_esp_boiler_hpactivity': { heat: 'Heizen', dhw: 'Warmwasser', defrost: 'Abtauen', idle: 'aus' }[s],
  'binary_sensor.ems_esp_boiler_hpcompon': s === 'idle' ? 'off' : 'on', 'binary_sensor.ems_esp_boiler_hp3way': s === 'dhw' ? 'on' : 'off',
  'sensor.ems_esp_boiler_hpcurrpower': [{ heat: '1450', dhw: '1900', defrost: '700', idle: '0' }[s], 'W'],
  'sensor.ems_esp_boiler_hptc1': [{ heat: '38.5', dhw: '52.0', defrost: '24', idle: '29' }[s], '°C'],
  'sensor.ems_esp_boiler_hptc0': [{ heat: '33.0', dhw: '46.5', defrost: '27', idle: '28.5' }[s], '°C'],
  'sensor.ems_esp_boiler_pc0flow': [s === 'idle' ? '0' : '1080', 'l/h'], 'sensor.ems_esp_boiler_hptl2': ['3.4', '°C'],
  'sensor.ems_esp_boiler_outdoortemp': ['2.8', '°C'], 'sensor.ems_esp_boiler_dhw_curtemp': ['47.5', '°C'], 'sensor.ems_esp_boiler_dhw_seltemp': ['52', '°C'],
  'sensor.ems_esp_thermostat_hc1_currtemp': ['21.4', '°C'], 'sensor.ems_esp_thermostat_hc1_seltemp': ['21.5', '°C'],
  'sensor.ems_esp_mixer_hc1_flowtemphc': ['34.0', '°C'],
  // Totals only; today and month come from the simulated long-term statistics (emsStatistics).
  'sensor.ems_esp_boiler_nrgconscompheating': { state: '4210.5', attributes: { unit_of_measurement: 'kWh', state_class: 'total_increasing' } },
  'sensor.ems_esp_boiler_nrgsuppheating': { state: '17890.2', attributes: { unit_of_measurement: 'kWh', state_class: 'total_increasing' } },
  'sensor.ems_esp_boiler_totalcompstarts': { state: '5123', attributes: { state_class: 'total_increasing' } },
  'sensor.ems_esp_boiler_uptimetotal': { state: '312450', attributes: { unit_of_measurement: 'min', state_class: 'total_increasing' } },
});
const emsStatistics = {
  'sensor.ems_esp_boiler_nrgconscompheating': { today: 9.6, yesterday: 12.1, week: 58.3, month: 210.4, year: 1890.7 },
  'sensor.ems_esp_boiler_nrgsuppheating': { today: 38.9, yesterday: 47.2, week: 231.0, month: 812.0, year: 7610.3 },
  'sensor.ems_esp_boiler_totalcompstarts': { today: 4, yesterday: 6, week: 31, month: 118, year: 1102 },
  'sensor.ems_esp_boiler_uptimetotal': { today: 610, yesterday: 790, week: 3950, month: 14200, year: 131000 },
};
// Simulated long-term statistics: change of a total counter per calendar period (recorder/statistic_during_period).
const statChange = (setup, msg) => {
  const c = msg.calendar || {};
  const v = setup.statistics?.[msg.statistic_id]?.[c.period === 'day' ? (c.offset ? 'yesterday' : 'today') : c.period];
  return v === undefined ? Promise.reject(new Error('no statistics')) : Promise.resolve({ change: v });
};
// Simulated history (compact format of the history API, seconds): one day of operating modes, ending in heating.
const historySim = (setup, msg) => {
  const now = Date.now(); const out = {};
  const plan = [[24, 'idle'], [22.5, 'heat'], [20, 'defrost'], [19.6, 'heat'], [17, 'dhw'], [16.3, 'idle'], [12, 'heat'], [8.5, 'defrost'], [8.1, 'heat'], [7, 'dhw'], [6.2, 'heat'], [3, 'defrost'], [2.9, 'heat']];
  for (const id of msg.entity_ids) {
    // A setup can bring its own history for switches and helpers: [hours ago, state].
    if (setup.history?.[id]) { out[id] = setup.history[id].map(([h, st]) => ({ s: st, lu: (now - h * 3600000) / 1000 })); continue; }
    out[id] = plan.map(([h, k]) => { const v = setup.states(k)[id]; const st = Array.isArray(v) ? v[0] : (v && typeof v === 'object' ? v.state : v); return { s: String(st), lu: (now - h * 3600000) / 1000 }; });
  }
  return Promise.resolve(out);
};
// HeishaMon (Panasonic Aquarea): no operating-mode entity, valve as Room/Tank, flow in L/min, power in W.
const hmStates = (s) => ({
  'sensor.panasonic_heat_pump_main_main_outlet_temp': [{ heat: '36.0', dhw: '50.5', defrost: '23', idle: '30' }[s], '°C'],
  'sensor.panasonic_heat_pump_main_main_inlet_temp': [{ heat: '31.0', dhw: '45.0', defrost: '26', idle: '29.5' }[s], '°C'],
  'sensor.panasonic_heat_pump_main_pump_flow': [s === 'idle' ? '0' : '18.5', 'L/min'],
  'sensor.panasonic_heat_pump_main_compressor_freq': [s === 'idle' ? '0' : '42', 'Hz'],
  'sensor.panasonic_heat_pump_main_threeway_valve_state': s === 'dhw' ? 'Tank' : 'Room',
  'binary_sensor.panasonic_heat_pump_main_defrosting_state': s === 'defrost' ? 'on' : 'off',
  'sensor.panasonic_heat_pump_main_heat_power_consumption': [s === 'idle' ? '0' : '1250', 'W'],
  'sensor.panasonic_heat_pump_main_heat_power_production': [{ heat: '5400', dhw: '4900', defrost: '0', idle: '0' }[s], 'W'],
  'sensor.panasonic_heat_pump_main_outside_temp': ['4.0', '°C'], 'sensor.panasonic_heat_pump_main_dhw_temp': ['48.0', '°C'],
  'number.panasonic_heat_pump_main_dhw_target_temp': ['50', '°C'], 'sensor.panasonic_heat_pump_main_z1_water_temp': ['35.5', '°C'],
  'sensor.panasonic_heat_pump_main_main_target_temp': ['36', '°C'], 'sensor.panasonic_heat_pump_main_z1_temp': ['21.0', '°C'],
});
// Ground source heat pump (EMS-ESP, no instance prefix): brine loop, two circuits, DHW heater rod and backup heater.
const brineStates = (s) => ({
  'sensor.boiler_hpactivity': { heat: 'Heizen', dhw: 'Warmwasser', defrost: 'Heizen', idle: 'aus' }[s],
  'binary_sensor.boiler_hpcompon': s === 'idle' ? 'off' : 'on', 'binary_sensor.boiler_hp3way': s === 'dhw' ? 'on' : 'off',
  'sensor.boiler_hpcurrpower': [{ heat: '1650', dhw: '2100', defrost: '1700', idle: '0' }[s], 'W'],
  'sensor.boiler_hptc1': [{ heat: '36.5', dhw: '53.0', defrost: '38.0', idle: '29' }[s], '°C'],
  'sensor.boiler_hptc0': [{ heat: '31.5', dhw: '47.0', defrost: '33.0', idle: '28.5' }[s], '°C'],
  'sensor.boiler_pc0flow': [s === 'idle' ? '0' : '1250', 'l/h'],
  'sensor.boiler_hpbrinein': [s === 'idle' ? '9.8' : '8.4', '°C'], 'sensor.boiler_hpbrineout': [s === 'idle' ? '9.6' : '5.1', '°C'],
  'sensor.boiler_brine_pressure': [{ heat: '145', dhw: '118', defrost: '82', idle: '54' }[s], 'kPa'],
  'sensor.boiler_heating_pressure': [{ heat: '1.8', dhw: '1.6', defrost: '0.9', idle: '0.6' }[s], 'bar'],
  'sensor.boiler_nrgconstotal': { state: '2600', attributes: { unit_of_measurement: 'kWh', state_class: 'total_increasing' } },
  'sensor.boiler_environmental_energy_total': { state: '8200', attributes: { unit_of_measurement: 'kWh', state_class: 'total_increasing' } },
  'sensor.boiler_outdoortemp': ['-6.5', '°C'], 'sensor.boiler_dhw_curtemp': ['49.5', '°C'], 'sensor.boiler_dhw_seltemp': ['55', '°C'],
  'binary_sensor.boiler_auxheaterstatus': s === 'defrost' ? 'on' : 'off',
  'binary_sensor.dhw_heater_rod': s === 'dhw' ? 'on' : 'off',
  'sensor.mixer_hc1_flowtemphc': ['33.0', '°C'], 'binary_sensor.mixer_hc1_pumpstatus': ['heat', 'defrost'].includes(s) ? 'on' : 'off',
  'sensor.mixer_hc2_flowtemphc': ['45.5', '°C'], 'binary_sensor.mixer_hc2_pumpstatus': s === 'heat' || s === 'defrost' ? 'on' : 'off',
  'sensor.thermostat_hc1_currtemp': ['21.2', '°C'], 'sensor.thermostat_hc1_seltemp': ['21.5', '°C'],
});
// Wolf CHA via wolflink: English parameter names, German list states, ein/aus switches, kW, L/min, repeated names with _2/_3.
const wolfStates = (s) => {
  const x = 'sensor.zuhause_';
  const on = s !== 'idle';
  const v = {
    operating_mode_heater: { heat: 'heizbetrieb', dhw: 'warmwasser', defrost: 'Abtaubetrieb', idle: 'standby' }[s],
    compressor_status: on ? 'Betrieb' : 'standby',
    compressor_frequency: [{ heat: '38', dhw: '50', defrost: '45', idle: '0' }[s], 'Hz'],
    current_capacity_specification_compressor: [{ heat: '46', dhw: '70', defrost: '60', idle: '0' }[s], '%'],
    power_consumption_wp_ehz: [{ heat: '1.2', dhw: '1.7', defrost: '0.9', idle: '0' }[s], 'kW'],
    current_secondary_power: [{ heat: '4.1', dhw: '4.9', defrost: '0', idle: '0' }[s], 'kW'],
    boiler_water_temperature: [{ heat: '31.4', dhw: '49.0', defrost: '22.0', idle: '28.8' }[s], '°C'],
    return_temperature: [{ heat: '26.9', dhw: '44.2', defrost: '25.0', idle: '24.6' }[s], '°C'],
    header_temperature: [{ heat: '30.8', dhw: '29.6', defrost: '29.8', idle: '29.4' }[s], '°C'],
    set_boiler_temperature: ['31.0', '°C'],
    hc_flow_rate: [on ? '17.6' : '0', 'L/min'],
    outside_temperature: ['4.5', '°C'], average_outside_temperature: ['5.2', '°C'],
    '3_way_diverter_valve_htg_dhw': s === 'dhw' ? 'warmwasser' : 'Heizen', '3_way_diverter_valve_htg_clg': 'Heizen',
    electric_booster_heater: 'aus',
    dhw_temperature: [s === 'dhw' ? '44' : '47', '°C'], set_dhw_temperature_adjusted: ['48', '°C'], set_dhw_temperature_adjusted_2: ['10', '°C'],
    set_dhw_temperature: ['10', '°C'], dhw_status: s === 'dhw' ? 'ein' : 'bereit_keine_ladung', '1x_dhw': 'aus',
    flow_temperature: ['30.1', '°C'], vf_mixer_circuit_flow_sensor: '30',
    mixer_circuit_status: 'heizbetrieb', mixer_circuit_demand: 'automatik_ein', mixer_circuit_pump: 'ein', mkp_mixer_circuit_pump: '1',
    heating_circuit_pump: 'aus', feed_heating_circuit_pump: 'aus', mixer_motor_mm: '0',
    room_temperature: { state: 'unknown', attributes: { unit_of_measurement: '°C' } },
    day_temperature: ['20', '°C'], day_temperature_2: ['21', '°C'], day_temperature_3: ['22', '°C'],
    prog_select: 'auto', prog_select_2: 'auto',
    party_mode: 'deaktiviert', holiday_mode: 'deaktiviert',
    system_pressure: ['1.65', 'bar'], sub_fault_code: '0',
    compressor_operating_hours: { state: '7500', attributes: { unit_of_measurement: 'h', state_class: 'total_increasing' } },
    e_heating_operating_hours: { state: '3', attributes: { unit_of_measurement: 'h', state_class: 'total_increasing' } },
    energy_amount_htg: { state: '28534', attributes: { unit_of_measurement: 'kWh', state_class: 'total_increasing' } },
    energy_amount_dhw: { state: '11218', attributes: { unit_of_measurement: 'kWh', state_class: 'total_increasing' } },
    clg_energy_amount: { state: '0', attributes: { unit_of_measurement: 'kWh', state_class: 'total_increasing' } },
    heat_generated_previous_day: ['51', 'kWh'], heat_generated_current_month: ['732', 'kWh'],
    heat_generated_current_year: ['11865', 'kWh'], heat_generated_previous_year: ['19258', 'kWh'],
    consumption_previous_day: ['0', 'kWh'], consumption_current_month: ['0', 'kWh'], consumption_current_year: ['0', 'kWh'], consumption_previous_year: ['0', 'kWh'],
    dpf_previous_day: '0', mpf_current_month: '0', spf_current_year: '0', spf_previous_year: '0',
  };
  return Object.fromEntries(Object.entries(v).map(([k, val]) => [`${x}${k}`, val]));
};
// Vaillant aroTHERM plus via ebusd (HMU + VWZ hydraulic station + sensoCOMFORT), entity ids from a real installation:
// most carry the topic prefix, newer ones also the device name (sensor.heating_ebusd_…). Underfloor + radiator circuit.
const ebusdStates = (s) => ({
  'sensor.ebusd_hmu_rundatastatuscode': { heat: 'heat_compressor_active', dhw: 'hwc_compressor_active', defrost: 'deicing_active', idle: 'standby' }[s],
  'sensor.ebusd_hmu_rundatacompressorspeed': [{ heat: '70.8', dhw: '88.0', defrost: '60.0', idle: '0' }[s], 'rps'],
  'sensor.ebusd_vwzio_statusdhw_dhwactive': s === 'dhw' ? 'on' : 'off',
  'sensor.ebusd_hmu_currentconsumedpower': [{ heat: '0.9', dhw: '1.6', defrost: '0.7', idle: '0' }[s], 'kW'],
  'sensor.ebusd_hmu_currentyieldpower': [{ heat: '2.3', dhw: '3.4', defrost: '0', idle: '0' }[s], 'kW'],
  'sensor.ebusd_hmu_rundataflowtemp': [{ heat: '45.3', dhw: '55.1', defrost: '24.0', idle: '30.2' }[s], '°C'],
  'sensor.ebusd_hmu_rundatareturntemp': [{ heat: '42.4', dhw: '50.2', defrost: '27.5', idle: '29.8' }[s], '°C'],
  'sensor.ebusd_hmu_buildingcircuitflow': [s === 'idle' ? '0' : '1201', 'l/h'],
  'sensor.ebusd_hmu_rundataairinlettemp': ['7.2', '°C'], 'sensor.ebusd_broadcast_outsidetemp': ['9.0', '°C'],
  'sensor.ebusd_hmu_flowpressure': [s === 'idle' ? '1.2' : '1.41', 'bar'],
  'sensor.ebusd_ctlv2_hwcstoragetemp': ['45.5', '°C'], 'sensor.ebusd_ctlv2_hwctempdesired': ['48', '°C'],
  'sensor.ebusd_ctlv2_hc1flowtemp': ['33.9', '°C'], 'sensor.ebusd_ctlv2_hc1actualflowtempdesired': ['33.8', '°C'],
  'sensor.ebusd_ctlv2_hc1pumpstatus': s === 'idle' ? '0' : '1',
  'sensor.ebusd_ctlv2_hc2flowtemp': ['43.8', '°C'], 'sensor.ebusd_ctlv2_hc2actualflowtempdesired': ['43.8', '°C'],
  'sensor.ebusd_ctlv2_hc2pumpstatus': s === 'heat' ? '1' : '0',
  'sensor.ebusd_ctlv2_hc3flowtemp': 'unknown', 'sensor.ebusd_ctlv2_hc3pumpstatus': '0',
  'sensor.ebusd_ctlv2_z1roomtemp': ['21.4', '°C'], 'sensor.ebusd_ctlv2_z1actualroomtempdesired': ['21.5', '°C'],
  'sensor.ebusd_hmu_runstatscompressorhours': { state: '7927', attributes: { unit_of_measurement: 'h', state_class: 'total_increasing' } },
  'sensor.ebusd_hmu_runstatscompressorstarts': { state: '9309', attributes: { state_class: 'total_increasing' } },
  'sensor.ebusd_vwzio_immersionheaterhours': ['116', 'h'],
  'sensor.ebusd_hmu_statelectricenergysum': { state: '20612.3', attributes: { unit_of_measurement: 'kWh', state_class: 'total_increasing' } },
  'sensor.ebusd_hmu_statelectricenergysumhc': { state: '13515.2', attributes: { unit_of_measurement: 'kWh', state_class: 'total_increasing' } },
  'sensor.ebusd_hmu_statelectricenergysumhwc': { state: '7081.8', attributes: { unit_of_measurement: 'kWh', state_class: 'total_increasing' } },
  'sensor.ebusd_hmu_statenvironmentenergysum': { state: '31922.9', attributes: { unit_of_measurement: 'kWh', state_class: 'total_increasing' } },
  'sensor.heating_ebusd_hmu_rundataevaporationtemp': ['3.2', '°C'],
  'sensor.ebusd_hmu_rundatacompressorinlettemp': ['1.7', '°C'], 'sensor.ebusd_hmu_rundatacompressoroutlettemp': ['55.5', '°C'],
  'sensor.ebusd_hmu_rundatahighpressure': ['15.2', 'bar'], 'sensor.ebusd_hmu_rundataeevpositionabs': '143',
  'sensor.heating_ebusd_hmu_rundataoverheatingactualvalue': ['0.2', 'K'],
  'sensor.ebusd_hmu_currenterror_error': s === 'idle' ? '1100' : 'unknown',
});
const regOf = (fn, platform) => Object.fromEntries(Object.keys(fn('heat')).map((id) => [id, { platform }]));

// Kronoterm via the Kronoterm integration (Cloud API), resolved via translation_key. Entity ids and values as on a real
// Hydro S + ADAPT installation: the hot water tank exists only as the DHW thermostat (climate), loop 1 has a room thermostat.
const kronotermReg = {
  'sensor.kronoterm_working_function_2': 'working_function', 'sensor.kronoterm_operation_regime_2': 'operation_regime',
  'sensor.kronoterm_error_warning_2': 'error_warning', 'sensor.kronoterm_heat_pump_hp_load': 'hp_load',
  'binary_sensor.kronoterm_heat_pump_defrost_status': 'defrost_status', 'binary_sensor.kronoterm_heat_pump_dhw_circulation_pump': 'dhw_circulation_pump',
  'binary_sensor.kronoterm_heat_pump_circulation_pump': 'circulation_pump', 'binary_sensor.kronoterm_heat_pump_main_circulation_pump': 'main_pump_status',
  'binary_sensor.kronoterm_heat_pump_reserve_source_status': 'reserve_source_status',
  'sensor.kronoterm_heat_pump_current_heating_cooling_power': 'current_heating_cooling_power',
  'sensor.kronoterm_heat_pump_current_heating_cooling_capacity': 'current_heating_cooling_capacity', 'sensor.kronoterm_heat_pump_cop_value': 'cop_value',
  'sensor.kronoterm_heat_pump_temperature_hp_outlet': 'hp_outlet_temperature', 'sensor.kronoterm_heat_pump_temperature_hp_inlet': 'hp_inlet_temperature',
  'sensor.kronoterm_heat_pump_temperature_outside': 'temperature_outside', 'climate.kronoterm_dhw_temperature': 'dhw_temperature',
  'climate.kronoterm_loop_1_temperature': 'loop_1_temperature', 'climate.kronoterm_loop_2_temperature': 'loop_2_temperature',
  'climate.kronoterm_reservoir_temperature': 'reservoir_temperature', 'sensor.kronoterm_loop_1_temperature': 'loop_1_temperature',
  'sensor.kronoterm_loop_2_temperature': 'loop_2_temperature', 'sensor.kronoterm_loop_1_inlet_temperature': 'loop_1_inlet_temperature',
  'sensor.kronoterm_heat_pump_loop_1_thermostat_temperature': 'loop_1_thermostat_temperature',
  'binary_sensor.kronoterm_heat_pump_circulation_loop_1': 'circulation_loop_1', 'binary_sensor.kronoterm_heat_pump_circulation_loop_2': 'circulation_loop_2',
  'sensor.kronoterm_heat_pump_heating_system_pressure': 'heating_system_pressure', 'select.kronoterm_operational_mode': 'operational_mode',
  'sensor.kronoterm_energy_combined': 'energy_combined', 'sensor.kronoterm_energy_heating': 'energy_heating', 'sensor.kronoterm_energy_dhw': 'energy_dhw',
  'sensor.kronoterm_energy_heater': 'energy_heater', 'sensor.kronoterm_heat_pump_electrical_energy_heating_dhw': 'electrical_energy_heating_dhw',
  'sensor.kronoterm_heat_pump_heating_energy_heating_dhw': 'heating_energy_heating_dhw', 'sensor.kronoterm_heat_pump_scop_value': 'scop_value',
  'sensor.kronoterm_heat_pump_compressor_activations_heating_24_h': 'compressor_activations_heating',
  'sensor.kronoterm_heat_pump_activations_boiler_24_h': 'activations_boiler', 'sensor.kronoterm_heat_pump_compressor_activations_cooling': 'compressor_activations_cooling',
  'sensor.kronoterm_heat_pump_operating_hours_compressor_heating': 'operating_hours_compressor_heating',
  'sensor.kronoterm_heat_pump_operating_hours_compressor_dhw': 'operating_hours_compressor_dhw',
  'sensor.kronoterm_heat_pump_operating_hours_additional_source_1': 'operating_hours_additional_source_1',
  'sensor.kronoterm_heat_pump_temperature_compressor_inlet': 'temperature_compressor_inlet',
  'sensor.kronoterm_heat_pump_temperature_compressor_outlet': 'temperature_compressor_outlet',
};
const kronotermStates = (s) => ({
  'sensor.kronoterm_working_function_2': { heat: 'heating', dhw: 'dhw', defrost: 'heating', idle: 'standby' }[s],
  'sensor.kronoterm_operation_regime_2': 'heating', 'sensor.kronoterm_error_warning_2': s === 'idle' ? 'warning' : 'no_error',
  'sensor.kronoterm_heat_pump_hp_load': [{ heat: '27', dhw: '100', defrost: '48', idle: '0' }[s], '%'],
  'binary_sensor.kronoterm_heat_pump_defrost_status': s === 'defrost' ? 'on' : 'off',
  'binary_sensor.kronoterm_heat_pump_dhw_circulation_pump': s === 'dhw' ? 'on' : 'off',
  'binary_sensor.kronoterm_heat_pump_circulation_pump': 'off', 'binary_sensor.kronoterm_heat_pump_main_circulation_pump': s === 'idle' ? 'off' : 'on',
  'binary_sensor.kronoterm_heat_pump_reserve_source_status': 'off',
  // The Cloud reports the electrical power as capacity ÷ COP; both read 0 while the unit defrosts.
  'sensor.kronoterm_heat_pump_current_heating_cooling_power': [{ heat: '1463.9', dhw: '2870.5', defrost: '0', idle: '0' }[s], 'W'],
  'sensor.kronoterm_heat_pump_current_heating_cooling_capacity': [{ heat: '5475', dhw: '8991', defrost: '0', idle: '0' }[s], 'W'],
  'sensor.kronoterm_heat_pump_cop_value': { heat: '3.74', dhw: '3.13', defrost: '0', idle: '0' }[s],
  'sensor.kronoterm_heat_pump_temperature_hp_outlet': [{ heat: '35.6', dhw: '52.4', defrost: '30.1', idle: '29.4' }[s], '°C'],
  'sensor.kronoterm_heat_pump_temperature_hp_inlet': [{ heat: '31.2', dhw: '47.0', defrost: '30.6', idle: '28.9' }[s], '°C'],
  'sensor.kronoterm_heat_pump_temperature_outside': ['6.2', '°C'],
  'climate.kronoterm_dhw_temperature': { state: 'heat', attributes: { current_temperature: { heat: 49.6, dhw: 46.8, defrost: 49.4, idle: 51.3 }[s], temperature: 50, friendly_name: 'DHW Thermostat' } },
  'climate.kronoterm_loop_1_temperature': { state: 'heat', attributes: { current_temperature: 22.4, temperature: 22.7, friendly_name: 'Loop 1 Thermostat' } },
  'climate.kronoterm_loop_2_temperature': { state: 'heat', attributes: { current_temperature: 30.5, temperature: 19.9, friendly_name: 'Loop 2 Thermostat' } },
  'climate.kronoterm_reservoir_temperature': { state: 'heat', attributes: { current_temperature: 35.6, temperature: 19.9, friendly_name: 'Reservoir Thermostat' } },
  'sensor.kronoterm_loop_1_temperature': ['22.4', '°C'], 'sensor.kronoterm_heat_pump_loop_1_thermostat_temperature': ['22.4', '°C'],
  'sensor.kronoterm_loop_1_inlet_temperature': [{ heat: '33.2', dhw: '28.7', defrost: '31.3', idle: '27.5' }[s], '°C'],
  'sensor.kronoterm_loop_2_temperature': [{ heat: '30.5', dhw: '24.9', defrost: '29.3', idle: '26.0' }[s], '°C'],
  'binary_sensor.kronoterm_heat_pump_circulation_loop_1': s === 'heat' || s === 'defrost' ? 'on' : 'off',
  'binary_sensor.kronoterm_heat_pump_circulation_loop_2': s === 'heat' || s === 'defrost' ? 'on' : 'off',
  'sensor.kronoterm_heat_pump_heating_system_pressure': ['1.3', 'bar'],
  'select.kronoterm_operational_mode': { state: s === 'idle' ? 'eco' : 'auto', attributes: { friendly_name: 'Operational Mode', options: ['auto', 'eco', 'comfort'] } },
  'sensor.kronoterm_energy_combined': { state: '27.42', attributes: { unit_of_measurement: 'kWh', state_class: 'total_increasing' } },
  'sensor.kronoterm_energy_heating': { state: '21.62', attributes: { unit_of_measurement: 'kWh', state_class: 'total_increasing' } },
  'sensor.kronoterm_energy_dhw': { state: '4.94', attributes: { unit_of_measurement: 'kWh', state_class: 'total_increasing' } },
  'sensor.kronoterm_energy_heater': { state: '0', attributes: { unit_of_measurement: 'kWh', state_class: 'total_increasing' } },
  'sensor.kronoterm_heat_pump_electrical_energy_heating_dhw': { state: '13762', attributes: { unit_of_measurement: 'kWh', state_class: 'total_increasing' } },
  // Not mapped by the preset: on the reference installation it reads a tenth of the heat that the SCOP implies.
  'sensor.kronoterm_heat_pump_heating_energy_heating_dhw': { state: '4728', attributes: { unit_of_measurement: 'kWh', state_class: 'total_increasing' } },
  'sensor.kronoterm_heat_pump_scop_value': '3.43',
  'sensor.kronoterm_heat_pump_compressor_activations_heating_24_h': '12245', 'sensor.kronoterm_heat_pump_activations_boiler_24_h': '641',
  'sensor.kronoterm_heat_pump_compressor_activations_cooling': '0',
  'sensor.kronoterm_heat_pump_operating_hours_compressor_heating': ['9692', 'h'], 'sensor.kronoterm_heat_pump_operating_hours_compressor_dhw': ['652', 'h'],
  'sensor.kronoterm_heat_pump_operating_hours_additional_source_1': ['0', 'h'],
  'sensor.kronoterm_heat_pump_temperature_compressor_inlet': [{ heat: '1.5', dhw: '-0.8', defrost: '-4.2', idle: '7.9' }[s], '°C'],
  'sensor.kronoterm_heat_pump_temperature_compressor_outlet': [{ heat: '71.4', dhw: '91.6', defrost: '58.0', idle: '35.2' }[s], '°C'],
});

// Energy dashboard of the simulated house: power sensors (stat_rate) for PV, battery (+ = discharging) and grid (+ = import).
const energyPrefs = { energy_sources: [
  { type: 'solar', stat_energy_from: 'sensor.pv_energy_today', stat_rate: 'sensor.pv_power' },
  { type: 'battery', stat_energy_from: 'sensor.battery_out_today', stat_energy_to: 'sensor.battery_in_today', stat_rate: 'sensor.battery_power' },
  { type: 'grid', stat_energy_from: 'sensor.grid_import_today', stat_energy_to: 'sensor.grid_export_today', stat_rate: 'sensor.grid_power' },
] };
const houseStates = (s) => ({
  'sensor.pv_power': [{ heat: '1800', dhw: '300', defrost: '0', idle: '900' }[s], 'W'],
  'sensor.battery_power': [{ heat: '-300', dhw: '1400', defrost: '0', idle: '-480' }[s], 'W'],
  'sensor.grid_power': [{ heat: '200', dhw: '100', defrost: '1500', idle: '-150' }[s], 'W'],
});

const setups = [
  {
    name: 'Lambda', sub: 'legacy naming, PV/battery split, quick controls, own tile selection, details with refrigerant circuit',
    states: (s) => ({ ...lambdaStates('eu08l_', s), ...extras(s) }),
    statistics: { 'sensor.eu08l_hp1_heating_energy_total': { yesterday: 12.9, week: 61.3 } },
    history: { 'input_boolean.heatpump_boost': [[24, 'off'], [14, 'on'], [10, 'off'], [5.5, 'on'], [3.2, 'off']] },
    config: {
      preset: 'lambda', title: 'Lambda', hc_type: 'radiator', timeline: true, timeline_marks: true,
      entities: {
        room: 'sensor.living_room_temperature', pv: 'sensor.heatpump_power_from_pv', battery: 'sensor.heatpump_power_from_battery',
        grid: 'sensor.heatpump_power_from_grid', energy_today: 'sensor.heatpump_energy_today', pv_share_today: 'sensor.heatpump_pv_share_today',
        program: 'select.heatpump_heating_program', solar_collector: 'sensor.heatpump_solar_collector', solar_pump: 'binary_sensor.heatpump_solar_pump',
        dhw_middle: 'sensor.heatpump_dhw_middle', buffer_middle: 'sensor.heatpump_buffer_middle',
        cutout_high_pressure: 'sensor.heatpump_cutouts_high_pressure', cutout_low_pressure: 'sensor.heatpump_cutouts_low_pressure', cutout_temperature: 'sensor.heatpump_cutouts_temperature',
      },
      badges: [{ entity: 'input_boolean.heatpump_boost', label: 'Boost' }],
      controls: ['input_boolean.heatpump_boost', 'button.heatpump_dhw_boost', 'select.heatpump_operating_mode', 'number.heatpump_dhw_target'],
      details: [{ entity: 'sensor.heating_curve_flow', name: 'Heating curve flow' }],
      details_open: true,
      tiles: ['cop_heating', 'cop_heating:month', 'cop_dhw', 'energy', 'starts', 'defrosts:yesterday', 'energy_heating:week'],
    },
  },
  {
    name: 'Lambda', sub: 'new naming, zero-config, PV/battery/grid from the Energy dashboard',
    states: (s) => ({ ...lambdaStates('', s), ...houseStates(s) }),
    energy: energyPrefs,
    config: { preset: 'lambda' },
  },
  {
    name: 'Viessmann Vitocal', sub: 'ViCare, German entity ids, radiators',
    states: vicareStates,
    registry: Object.fromEntries(Object.entries(vicareReg).map(([id, tk]) => [id, { platform: 'vicare', translation_key: tk }])),
    config: { preset: 'vicare', title: 'Vitocal', hc_type: 'radiator' },
  },
  {
    name: 'Vaillant aroTHERM plus', sub: 'myPyllant',
    states: vaillantStates,
    registry: { 'sensor.zuhause_energy_manager_state': { platform: 'mypyllant' } },
    config: { preset: 'vaillant', title: 'aroTHERM plus' },
  },
  {
    name: 'Buderus / Bosch', sub: 'EMS-ESP, German enum texts, tiles for today and month from long-term statistics',
    states: emsStates, registry: regOf(emsStates, 'mqtt'), statistics: emsStatistics,
    config: {
      preset: 'emsesp', title: 'Buderus WLW',
      tiles: ['cop_heating', 'energy_heating', 'cop_heating:month', 'starts', 'hours_per_start', 'spread', 'heat_estimated'],
    },
  },
  {
    name: 'Panasonic Aquarea', sub: 'HeishaMon, radiators',
    states: hmStates, registry: regOf(hmStates, 'aquarea'),
    config: { preset: 'heishamon', title: 'Aquarea', hc_type: 'radiator' },
  },
  {
    name: 'Ground source heat pump', sub: 'EMS-ESP, brine loop, environmental energy, two heating circuits and heaters',
    states: brineStates, registry: regOf(brineStates, 'mqtt'),
    statistics: {
      'sensor.boiler_nrgconstotal': { today: 6.1, month: 180, year: 1720 },
      'sensor.boiler_environmental_energy_total': { today: 24.3, month: 690, year: 6520 },
    },
    scenarioLabels: { defrost: 'Backup heater' },
    config: {
      preset: 'emsesp', title: 'Logatherm WLW', source_type: 'brine',
      hc_count: 2, hc_name: 'Ground floor', hc2_type: 'column', hc2_name: 'Upstairs',
      brine_pressure_min: 0.9, brine_pressure_crit: 0.6, brine_pressure_max: 2.5,
      hc_pressure_min: 1.0, hc_pressure_crit: 0.7, hc_pressure_max: 2.8,
      entities: { dhw_heater: 'binary_sensor.dhw_heater_rod', brine_pressure: 'sensor.boiler_brine_pressure', hc_pressure: 'sensor.boiler_heating_pressure',
        env_energy: 'sensor.boiler_environmental_energy_total' },
      tiles: ['energy', 'env_energy', 'cop_total', 'env_energy:month', 'spread', 'brine_pressure', 'hc_pressure'],
    },
  },
  {
    name: 'Any other heat pump', sub: 'no preset: manual mapping, no buffer, no power sources',
    states: otherStates,
    config: {
      title: 'Heat pump',
      entities: { mode: 'sensor.wp_betriebsart', flow: 'sensor.wp_vorlauf', return: 'sensor.wp_ruecklauf', power: 'sensor.wp_leistung',
        dhw_top: 'sensor.ww_temperatur', outdoor: 'sensor.aussen' },
      mode_map: { Heating: 'heating', 'Hot water': 'dhw', Defrost: 'defrost', Standby: 'idle' },
    },
  },
  {
    name: 'Wolf CHA', sub: 'wolflink, buffer from the header sensor, mixer circuit, heat counters',
    states: wolfStates, registry: regOf(wolfStates, 'wolflink'),
    statistics: { 'sensor.zuhause_energy_amount_htg': { today: 38.6, month: 612 }, 'sensor.zuhause_energy_amount_dhw': { today: 7.9, month: 120 } },
    config: {
      preset: 'wolf', title: 'Wolf CHA',
      entities: { buffer_top: 'sensor.zuhause_header_temperature' },
      tiles: ['heat_heating', 'heat_dhw', 'heat:yesterday', 'heat:month', 'hours:total', 'spread', 'hc_pressure'],
    },
  },
  {
    name: 'Kronoterm ADAPT', sub: 'Kronoterm integration (Cloud API), hot water tank from the DHW thermostat, two circuits',
    states: kronotermStates,
    registry: Object.fromEntries(Object.entries(kronotermReg).map(([id, tk]) => [id, { platform: 'kronoterm', translation_key: tk }])),
    statistics: { 'sensor.kronoterm_heat_pump_electrical_energy_heating_dhw': { yesterday: 24.9, week: 160.2, month: 512.6, year: 3871 } },
    config: {
      preset: 'kronoterm', title: 'Kronoterm ADAPT', hc_count: 2, hc2_type: 'radiator',
      tiles: ['energy', 'energy_heating', 'energy_dhw', 'energy:month', 'cop_live', 'cop_total', 'cycles_heating', 'spread'],
    },
  },
  {
    name: 'Vaillant aroTHERM plus', sub: 'ebusd, underfloor and radiator circuit, environmental energy',
    states: ebusdStates, registry: regOf(ebusdStates, 'mqtt'),
    statistics: {
      'sensor.ebusd_hmu_statelectricenergysum': { today: 21.8, month: 412, year: 4210 },
      'sensor.ebusd_hmu_statenvironmentenergysum': { today: 32.6, month: 690, year: 6830 },
      'sensor.ebusd_hmu_runstatscompressorstarts': { today: 6 }, 'sensor.ebusd_hmu_runstatscompressorhours': { today: 9 },
    },
    config: {
      preset: 'ebusd', title: 'aroTHERM plus', hc_count: 2, hc_name: 'Underfloor', hc2_type: 'radiator', hc2_name: 'Radiators',
      tiles: ['cop_live', 'cop_total', 'energy', 'env_energy', 'starts', 'hours_per_start', 'hc_pressure'],
    },
  },
];
// Synthetic PointT installation. Resource keys follow Home Comfort 0.8.2-beta.7;
// gateway identifiers, entity ids and values are invented, not a registry export.
function pointtSetup(scenario = 'heat', gateway = 'demo-pointt', suffix = '') {
  const rows = [
    ['sensor', 'heatSources:compressor:status', { heat: 'heating', dhw: 'dhw', defrost: 'defrost', idle: 'off', cool: 'cooling' }[scenario], '', { translation_key: 'compressor_status' }],
    ['sensor', 'gateway:supply_temperature', scenario === 'dhw' ? 49 : 33, '°C'],
    ['sensor', 'gateway:return_temperature', 28, '°C'],
    ['sensor', 'gateway:outdoor_temperature', 6, '°C'],
    ['sensor', 'gateway:modulation', scenario === 'idle' ? 0 : 42, '%'],
    ['sensor', 'gateway:system_pressure', 1.7, 'bar'],
    ['sensor', 'gateway:hot_water_temperature', 48, '°C'],
    ['sensor', 'dhwCircuits:dhw1:currentSetpoint', 50, '°C'],
    ['sensor', 'heatSources:hs1:heatPumpType', 'air_water'],
    ['sensor', 'heatSources:hs1:numberOfStarts:total', 120],
    ['sensor', 'heatSources:hs1:numberOfStarts:ch', 90],
    ['sensor', 'heatSources:hs1:numberOfStarts:dhw', 30],
    ['sensor', 'heatSources:hs1:numberOfStarts:cooling', 0],
    ['sensor', 'heatSources:hs1:workingTime:total', 240, 'h'],
    ['sensor', 'heatSources:hs1:workingTime:ch', 180, 'h'],
    ['sensor', 'heatSources:hs1:workingTime:dhw', 60, 'h'],
    ['sensor', 'heatSources:hs1:supplyFlowCondenserTemp', 32.5, '°C'],
    ['sensor', 'heatSources:numberOfStarts', 135],
    ['sensor', 'heatSources:workingTime:totalSystem', 500, 'h'],
    ['sensor', 'heatSources:Source:eHeater:status', 'off'],
    ['sensor', 'gateway:total_electricity', 400, 'kWh'],
    ['sensor', 'gateway:total_heat_produced', 1600, 'kWh'],
    ['sensor', 'gateway:environmental_energy', 1200, 'kWh'],
    ['sensor', 'gateway:heating_electricity', 300, 'kWh'],
    ['sensor', 'gateway:heating_heat_produced', 1200, 'kWh'],
    ['sensor', 'gateway:hot_water_electricity', 100, 'kWh'],
    ['sensor', 'gateway:hot_water_heat_produced', 400, 'kWh'],
    ['sensor', 'heatSources:emon:totalConsumption:eheater', 0, 'kWh'],
    ['sensor', 'heatSources:emon:coolingConsumption:compressor', 20, 'kWh'],
    ['sensor', 'heatSources:emon:coolingConsumption:outputProduced', 80, 'kWh'],
    ['binary_sensor', 'system_fault', scenario === 'idle' ? 'on' : 'off'],
    ['binary_sensor', 'holiday_active', scenario === 'idle' ? 'on' : 'off'],
    ...[1, 2].flatMap((n) => [
      ['sensor', `heatingCircuits:hc${n}:currentRoomSetpoint`, 20 + n, '°C'],
      ['sensor', `heatingCircuits:hc${n}:roomtemperature`, 19 + n, '°C'],
      ['sensor', `heatingCircuits:hc${n}:actualSupplyTemperature`, 31 + n, '°C'],
      ['select', `heatingCircuits:hc${n}:operationMode:control`, 'auto'],
      ...['manualRoomSetpoint', 'temperatureLevels:comfort2', 'temperatureLevels:eco', 'maxFlowTemp']
        .map((key) => ['number', `heatingCircuits:hc${n}:${key}:control`, 21, '°C']),
    ]),
    ['sensor', 'dhwCircuits:dhw2:actualTemp', 42, '°C'],
    ['sensor', 'dhwCircuits:dhw2:currentSetpoint', 45, '°C'],
    ['select', 'dhwCircuits:dhw1:operationMode:control', 'auto'],
    ...['temperatureLevels:high', 'temperatureLevels:low', 'temperatureLevels:eco', 'singleChargeSetpoint']
      .map((key) => ['number', `dhwCircuits:dhw1:${key}:control`, 50, '°C']),
    ['number', 'dhwCircuits:dhw1:chargeDuration:control', 60, 'min'],
    ['switch', 'dhwCircuits:dhw1:charge:control', 'off'],
    ['switch', 'dhwCircuits:dhw1:reduceTempOnAlarm:control', 'on'],
    ['select', 'system:silentMode:enabled:control', 'off'],
    ['select', 'heatSources:additionalHeater:operationMode:control', 'off'],
    ['select', 'system:seasonOptimizer:mode:control', 'auto'],
    ['switch', 'system:awayMode:enabled:control', 'off'],
  ];
  const states = {}; const registry = {};
  rows.forEach(([domain, key, value, unit, extra], n) => {
    // Deliberately unrelated to the resource names: test renamed entities and mixed languages.
    const id = `${domain}.pointt_${suffix}value_${n}`;
    const attributes = { friendly_name: key.replace(/:/g, ' / '), ...(unit ? { unit_of_measurement: unit } : {}) };
    if (domain === 'select') attributes.options = ['off', 'manual', 'auto'];
    if (domain === 'number') Object.assign(attributes, { min: 5, max: 80, step: 0.5 });
    if (unit === 'kWh' || unit === 'h' || key.includes(':numberOfStarts:')) attributes.state_class = 'total_increasing';
    if (key === 'gateway:environmental_energy') attributes.state_class = 'total';
    states[id] = { state: String(value), attributes };
    registry[id] = { platform: 'bosch_buderus_heating', unique_id: `${gateway}:${key}`, device_id: `device-${gateway}`, ...extra };
  });
  return { states, registry };
}
setups.push({
  name: 'Bosch/Buderus Home Comfort', sub: 'PointT cloud, synthetic data; preset awaiting installation testing',
  states: (s) => pointtSetup(s).states, registry: pointtSetup().registry,
  config: { preset: 'bosch_buderus_heating', title: 'Home Comfort', power_sources: 'manual',
    tiles: ['energy:total', 'heat:total', 'env_energy:total', 'cop_total:total', 'starts:total', 'hours:total'] },
});

const scenarios = [['heat', 'Heating'], ['dhw', 'Hot water'], ['defrost', 'Defrost'], ['idle', 'Standby + error']];
