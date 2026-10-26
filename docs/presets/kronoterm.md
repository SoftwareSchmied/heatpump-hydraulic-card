# Kronoterm preset (ADAPT, ETERA, VERSI, WPLV …)

Source: the [Kronoterm integration](https://github.com/Favio25/Kronoterm-homeassistant) (HACS, domain `kronoterm`), connected through the Kronoterm Cloud API or locally through Modbus. The preset was built on version 1.7.2 and checked against 1.7.3 (`upstream/kronoterm.json`). The integration sets a translation key on every entity, so the preset finds entities through the entity registry (platform `kronoterm`); entity ids and the Home Assistant language do not matter. Where Cloud and Modbus name a value differently, both names are candidates. The Cloud API mapping is confirmed on a real installation (see Evidence); the Modbus names come from the integration's register map and are not yet confirmed on hardware.

## Integration versions

- **Heating pressure: use Kronoterm 1.7.3 or newer with the Cloud API.** Up to 1.7.2 the Cloud sensor `heating_system_pressure` read register 2325, "Nastavitev tlaka ogrevalnega sistema": the setting of the low-pressure alarm, not the pressure. On the reference installation it stayed at 0.8 bar for ten days. Since 1.7.3 the same sensor reads register 2326, "Tlak ogrevalnega sistema", the measured pressure. It keeps its entity id, because the integration builds unique ids from the name. The alarm setting becomes a separate diagnostic sensor, `system_pressure_setting`; its value is a good choice for `hc_pressure_crit`. The card finds the pressure by its translation key and needs no change. With Modbus the sensor of that name has always been register 2326 (1.7.2 created no sensors for writable registers such as 2325).
- The heat counter stays unmapped with 1.7.3: the integration now selects its multiplier automatically for Modbus only, and the Cloud scaling is unchanged (see below).

## Mapped

- `mode`: sensor `working_function`. Pool heating and start count as heating, thermal disinfection as hot water, remote deactivation and protection as blocked, standby as idle.
- `compressor` and `compressor_speed`: `hp_load` (%, register 2327). It stays above 0 during a defrost.
- `defrost`: binary sensor `defrost_status` (2011). It wins over the working function, which keeps reporting heating while the unit defrosts.
- `valve`: binary sensor `dhw_circulation_pump` (bit 1 of 2028), the circulator that charges the tank. It is on exactly during hot water runs.
- `power` / `heat`: `current_heating_cooling_power` (2129, electrical; the Cloud computes it as capacity ÷ COP) / `current_heating_cooling_capacity` (2329).
- `flow` / `return` / `outdoor`: `hp_outlet_temperature` (2104) / `hp_inlet_temperature` (2101) / `temperature_outside` (2103).
- `heater`: binary sensor `reserve_source_status` (2003), the internal backup heater. `aux_hours`: `operating_hours_additional_source_1` (2095).
- `dhw_top` / `dhw_target`: with Modbus the sensors `dhw_temperature` (2102) / `dhw_current_setpoint` (2024); with the Cloud API the climate entity `dhw_temperature`, read as `current_temperature` and `temperature`. `circulation`: binary sensor `circulation_pump` (bit 0 of 2028).
- Loops 1 to 4 as heating circuits (`hc_count`): `hc_flow` from `loop_N_inlet_temperature` (Cloud) or `loop_N_temp` (Modbus 2130, 2110 …), else `loop_N_temperature` (Cloud, only without a room thermostat, because with one it is the room temperature); `hc_pump` from the binary sensor `circulation_loop_N` (2045, 2055 …).
- `room` / `room_target` of circuit 1: `loop_1_thermostat_temperature` / `loop_1_room_current_setpoint` (Modbus), else the target `temperature` of the loop climate. Only with a room thermostat.
- `hc_pressure`: `heating_system_pressure`; see Integration versions.
- `program`: the select `operational_mode` (auto / eco / comfort), else the Modbus sensor `operation_program`. Eco shows the eco chip.
- `energy_today`: `energy_combined` (Cloud, electricity today). `energy_total`: `electrical_energy_heating_dhw` (total increasing; week, month and year come from its statistics).
- `evap_temp` / `hot_gas`: `temperature_compressor_inlet` (2105, evaporation) / `temperature_compressor_outlet` (2106).
- Errors: `error_warning`, with `no_error` and `notice` as no error (Cloud: no_error, warning, error; Modbus: no_error, warning, alarm, notice).
- Tiles: electricity today in total and per heating, hot water and heater (`energy_heating`, `energy_dhw`, `energy_heater`, Cloud); COP total from `scop_value`; compressor starts from `compressor_activations_heating`, `activations_boiler` and `compressor_activations_cooling`, which are lifetime totals although the integration labels them "24 h".

## Deliberately not mapped

- `heat_total`: `heating_energy_heating_dhw`. With the Cloud API it reads a tenth of the heat that the electricity counter and the SCOP imply (4,728 kWh against 13,762 kWh of electricity at an SCOP of 3.43 on the reference installation). The total COP therefore comes from the SCOP sensor.
- Buffer: the reservoir climate reports a calculated value (Cloud) or the heat pump return (Modbus), not a tank sensor.
- `hours`: compressor hours exist per heating and per hot water only (`operating_hours_compressor_heating`, `operating_hours_compressor_dhw`); add them to `details` if you want them.
- `activations_defrost`: went from 0 to 1 at the first defrost of the season, so it is unclear whether it is a total or a 24 h count.
- Finalized "yesterday" energy: these sensors read 0 until the Cloud finalizes the day in the evening; yesterday comes from the statistics of the electricity counter instead.
- Modbus `loop_N_inlet_temp` (2188 to 2190): the register map describes it as the desired temperature of the circuit.
- `system_pressure_setting` and the Cloud button `acknowledge_alarm` (both new in 1.7.3), `main_pump_status`, `additional_source`, `alternative_source_*`: no matching card key. The button can be added to `controls`.

## Evidence

- Reference installation: Kronoterm Hydro S 2 + ADAPT 0312-K3 HT / HK 3F (air/water, controller 3.7.0), integration 1.7.2 with the Cloud API, Home Assistant 2026.10.4. One hot water tank, two loops (loop 1 with a room thermostat), a reservoir without a tank sensor. The entity registry, live states, seven days of history and the long-term statistics were replayed into the card ([#66](https://github.com/Sturmi77/heatpump-hydraulic-card/pull/66)).
- Integration source: `const.py`, `sensor.py`, `binary_sensor.py`, `climate.py`, `select.py`, `energy.py`, `register_map.py`, `kronoterm.json` and `kronoterm_tt3000.json`.
- Pressure: the changelog of integration 1.7.3 ("Cloud heating system pressure now reads measured pressure from register 2326 instead of the pressure alarm setting at 2325"), the register map, and the history of the reference installation, where `heating_system_pressure` read 0.8 bar without a single change from 17 to 26 October 2026 (1.7.2, Cloud API). The value after the update has not been checked on the installation yet.

## Known limits

- The timeline follows the working function, so defrosts are not separate periods there.
- Power and heat output read 0 W during a defrost, so the heat pump block shows no COP then.
- The Cloud updates every 1 to 5 minutes.
- There is no Kronoterm drawing of the outdoor unit; the generic fan is used.
- The hot water heat pumps of the separate Kronoterm DHW cloud are not covered.
