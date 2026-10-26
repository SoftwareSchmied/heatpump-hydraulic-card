# Luxtronik preset (Alpha Innotec, Novelan, Roth, Siemens, Elco, Buderus, Nibe, Wolf)

Source: the [Luxtronik integration](https://github.com/BenPru/luxtronik) (HACS, domain `luxtronik2`, MIT), version 2026.10.18. It is built on [Bouni/luxtronik](https://github.com/Bouni/luxtronik), which can run side by side. The preset is **not tested on an installation**: it is derived from the integration source (`sensor_entities_predefined.py`, `binary_sensor_entities_predefined.py`, `number_entities_predefined.py`, `select_entities_predefined.py`, `const.py`, `translations/en.json`). Reports from real installations are tracked in [#75](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/75).

The integration sets the translation key of every entity to its `SensorKey` value, so the preset finds entities through the entity registry (platform `luxtronik2`). Entity ids (`sensor.luxtronik2_flow_in_temperature` with the default prefix) and the Home Assistant language do not matter.

## Mapped

- `mode`: `status` (values `heating`, `hot_water`, `swimming_pool_solar`, `evu`, `defrost`, `heating_external_source`, `cooling`, `no_request`). Pool and external heat source count as heating, `evu` (grid lock) as blocked, `no_request` as idle.
- `compressor`: `compressor` (output VD1).
- `flow` / `return`: `flow_in_temperature` (TVL, Vorlauf) / `flow_out_temperature` (TRL, Rücklauf). "In" and "out" are seen from the heating system.
- `volume`: `heat_amount_flow_rate` (l/h). With it the card computes the heat output from flow rate and spread when `heat` is missing.
- `power` / `heat`: `current_power_consumption` / `current_heat_output`. **Both are disabled in the integration by default.** The power value is a calculation without a documented name in the controller (`Unknown_Calculation_268`); compare it with a meter before trusting the COP.
- `outdoor`: `outdoor_temperature`. `source_in` / `source_out` / `source_volume`: `heat_source_input_temperature` / `heat_source_output_temperature` / `heat_source_flow_rate`.
- `dhw_top`: `dhw_temperature`. `dhw_target`: the number `dhw_target_temperature`.
- `heater`: binary sensor `additional_heat_generator`. `aux_hours`: `additional_heat_generator_operation_hours`.
- `solar_collector` / `solar_pump`: `solar_collector_temperature` / `solar_pump`, present only where the controller reports solar.
- `program`: the select `heating_mode` (`Automatic`, `Off`, `Second heatsource`, `Party`, `Holidays`); Party and Holidays show their chip.
- Heating circuit 1 to 3: the mixing circuits, `flow_in_circuitN_temperature` as `hc_flow` and `flow_in_circuitN_target_temperature` as `hc_setpoint`. A mixing circuit that is not installed still has both sensors, so a circuit counts only when the flow is a number and the target is 10 °C or more. Without a mixing circuit the card draws the heat pump flow as the circuit flow (direct circuit). `hc_pump` (circuit 1): `circulation_pump_heating`. `room` / `room_target` (circuit 1): `room_thermostat_temperature` and its target.
- Details: `compressor1_operation_hours` (else `operation_hours`), `compressor1_impulses`, `heat_amount_counter` as `heat_total`, refrigerant circuit (`hot_gas_temperature`, `suction_compressor_temperature`, `overheating_temperature`, `high_pressure`, `low_pressure`).
- Tiles (total counters, periods from long-term statistics): electricity per use `heat_energy_input`, `dhw_energy_input`, `cooling_energy_input`, `additional_heat_generator_energy`; heat `heat_amount_counter`, `heat_amount_heating`, `dhw_heat_amount`, `cooling_heat_amount`; compressor hours and impulses. The per-use counters exist on newer firmware only.

## Deliberately not mapped

- `errors`: `error_reason` holds the last error in the controller's memory. It stays after a reset, so it would show the error chip forever. `disturbance_output` is the fault output, which can also be configured as the second heat generator.
- `circulation`: the integration names the outputs BUP/ZIP `dhw_recirculation_pump`, `dhw_circulation_pump` and `dhw_charging_pump` (the last two share one register); which of them is the circulation pump depends on the installation.
- `valve`: no entity reports the diverter valve; hot water comes from the status.
- Buffer and multifunction storage (MFS): the integration exposes no buffer sensors except the solar buffer.
- `compressor_speed`: the controller has no compressor frequency (`pump_frequency` is the circulation pump). The animation runs at full speed while the compressor is on.
- `source_type`: the controller does not tell the heat source. Set `source_type: brine` or `water` for ground and water heat pumps.
- Circuits 4 to 6: the controller has three mixing circuits.

## Open questions for a real installation

- Do `flow_in_circuit1_temperature` and its target read sensible values on a system with only a direct circuit, or are they unavailable? (Rule above assumes a plain number and a target of 10 °C or more.)
- Is `current_power_consumption` the electrical input of the heat pump, and does `current_heat_output` match the heat meter?
- How is the multifunction storage connected (buffer for heating only, or also hot water)?
- Which of `compressor1_operation_hours` and `operation_hours` is the better compressor counter?
