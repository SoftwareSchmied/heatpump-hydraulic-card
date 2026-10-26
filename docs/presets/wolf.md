# Wolf preset (CHA and other Wolf heat pumps with a compressor status)

One preset, `wolf`, serves two integrations:

- the core [Wolf SmartSet Service](https://www.home-assistant.io/integrations/wolflink/) integration (`wolflink`), read-only, built on [wolf-comm](https://github.com/janrothkegel/wolf-comm);
- the custom [Wolf SmartSet (read/write)](https://github.com/tibuntu/homeassistant-wolf-smartset) integration (`wolf_smartset`, HACS).

Both talk to the Wolf SmartSet cloud through the WOLF Link home gateway and both also serve gas and oil boilers, so the preset only detects a system that reports a compressor status (Verdichterstatus). `wolf_smartset` is checked first; when both integrations are installed, its entities are used. The integration README recommends disabling `wolflink` for the same account anyway, because two logins from one address make Wolf block the address.

The mapping comes from the integration sources, the wolf-comm heat pump example and the live states of the reference installation (see Evidence). The preset's own detection and drawing with this build are not confirmed on hardware yet, so `tested` stays unset.

## wolflink (core)

Entity ids are `sensor.<device slug>_<parameter name>` with the names in the language of the SmartSet account (English expected). The preset finds the device slug from `sensor.<slug>_compressor_status` and returns it as the prefix; the `device:` option limits the search to one device. List states are the slugs or texts the integration reports (`heizbetrieb`, `at_abschaltung`, `Abtaubetrieb`). Parameter names that repeat get `_2`, `_3` in no fixed order and are never used.

## wolf_smartset (custom)

Since release 0.3.0 (2026-10-26) the integration sets a fixed `translation_key` on curated entities ([ADR-Model-016](https://github.com/tibuntu/homeassistant-wolf-smartset/blob/main/docs/adr/ADR-Model-016-stable-translation-keys.md)). The preset finds entities through the entity registry (`platform: wolf_smartset`), so entity ids, device names and the Home Assistant language do not matter; the prefix is `''`. Leave the `device:` option unset: the entities sit on several Home Assistant devices (Heizgerät, Bedienmodul BM-2, Mischermodul MM1 and the system itself), and the option limits every lookup to one device, so it either loses the circuit keys and the DHW setting or finds no compressor status at all. The keys follow the `wolflink` entity-id suffixes where the same value exists there. The source of truth is the [translation keys table in the integration README](https://github.com/tibuntu/homeassistant-wolf-smartset#translation-keys); the table below lists the keys the card uses.

| Card key | Platform | Translation key | Wolf parameter (German label) |
|---|---|---|---|
| `mode` | sensor | `operating_mode_heater` | Betriebsart Heizgerät |
| `status` | sensor | `compressor_status` | Verdichterstatus |
| `compressor` | sensor | `compressor_frequency` | Verdichterfrequenz |
| `compressor_speed` | sensor | `current_capacity_specification_compressor` | Aktuelle Leistungsvorgabe Verdichter |
| `power` | sensor | `power_consumption_wp_ehz` | Leistungsaufnahme (WP + EHZ) |
| `heat` | sensor | `current_secondary_power` | Aktuelle Sekundärleistung |
| `flow` | sensor | `boiler_water_temperature` | Kesseltemperatur |
| `return` | sensor | `return_temperature` | Rücklauftemperatur |
| `volume` | sensor | `hc_flow_rate` | Heizkreisdurchfluss |
| `outdoor` | sensor | `outside_temperature` | Außentemperatur (Heizung) |
| `valve` | sensor | `3_way_diverter_valve_htg_dhw` | 3-Wege-Umschaltventil HZ/WW |
| `heater` | sensor | `electric_booster_heater` | E-Heizung |
| `dhw_top` | sensor | `dhw_temperature` | Warmwassertemperatur |
| `dhw_target` | number, else sensor | `set_dhw_temperature`, else `set_dhw_temperature_adjusted` | Warmwassersolltemperatur eingestellt, else Warmwassersolltemperatur |
| `hc_flow` | sensor | `flow_temperature` | Vorlauftemperatur (Bedienmodul BM-2) |
| `hc_pump` | sensor | `mixer_circuit_pump`, else `mkp_mixer_circuit_pump` | Mischerkreispumpe, else Ausgang MKP |
| `hc_mode` | sensor | `mixer_circuit_status` | Mischerkreis Status |
| `hc_pressure` | sensor | `system_pressure` | Anlagendruck |
| `room` | sensor | `room_temperature` | Raumtemperatur |
| `room_target` | number | `day_temperature_mixer_circuit_1` | Tagtemperatur (Heizung) (Mischerkreis 1) |
| `hours` | sensor | `compressor_operating_hours` | Betriebsstunden Verdichter |
| `aux_hours` | sensor | `e_heating_operating_hours` | Betriebsstunden E-Heizung |

Tiles, the same as with `wolflink`: `heat` yesterday, month and year from `heat_generated_previous_day`, `heat_generated_current_month` and `heat_generated_current_year`; the `heat_heating`, `heat_dhw` and `heat_cooling` totals from `energy_amount_htg`, `energy_amount_dhw` and `clg_energy_amount`; the `hours` and `aux_hours` totals from the two hours counters.

Differences from the `wolflink` branch, following the integration source:

- `hc_pump`: `wolflink` uses `mkp_mixer_circuit_pump` (Ausgang MKP). In `wolf_smartset` that entity duplicates `mixer_circuit_pump` (Mischerkreispumpe) and starts disabled, so `mixer_circuit_pump` comes first and the MKP output is the fallback.
- `dhw_target`: the number `set_dhw_temperature` ("Warmwassersolltemperatur eingestellt", 35000900000, 25 to 65 °C), with the sensor `set_dhw_temperature_adjusted` as the fallback when there is no number (no write access). The integration binds these two keys the other way round from the `wolflink` suffixes: its sensor `set_dhw_temperature_adjusted` is the read-only "Warmwassersolltemperatur" (27000800001), which reads 10 °C on the reference installation while the tank is held at 42 °C. The `wolflink` branch keeps `set_dhw_temperature_adjusted`, which is the setting there.
- `room_target`: the number `day_temperature_mixer_circuit_1` instead of the `wolflink` sensor `day_temperature`.
- `program`: empty. `wolflink` maps the holiday mode; `wolf_smartset` has no party or holiday parameter yet (listed under its known limitations). The selects it does have are the weekly time program (`time_program_heating`, `time_program_dhw`: 1, 2 or 3, added after 0.3.0 in [PR 10](https://github.com/tibuntu/homeassistant-wolf-smartset/pull/10)) and "Programmwahl" (`program_heating`: Standby, Auto, Permanent, Sparen). The latter could become `program` (Sparen as eco) once an installation confirms it.
- `errors`: empty. The translation key table has no fault code, and the wolf-comm heat pump example description has no fault code parameter either (`Störung` is a state of the compressor status, not a parameter). `wolflink` keeps `sub_fault_code`. Configure `errors:` by hand if your installation has one.
- `room_temperature` starts disabled in `wolf_smartset` (no value without a room sensor at the control unit). Enable it there if you have one; the card then picks it up.

### State texts

`wolf_smartset` reports list states as Wolf delivers them, capitalised German texts (`Heizbetrieb`, `Warmwasser`, `Betrieb`, `Ein`, `Aus`); `wolflink` reports slugs for some of them (`heizbetrieb`, `ein`). The card's maps are case-insensitive, so one entry covers both for most states. Four mixer-circuit states contain a space that `wolflink` turns into an underscore (`AT Abschaltung` becomes `at_abschaltung`); the `hc_mode_map` lists both spellings. The compressor status labels for `Vorspülen` and `Nachspülen` exist for both spellings as well.

## Deliberately not mapped

The same gaps as with `wolflink`:

- Buffer: `header_temperature` (Sammlertemperatur) is the header of the heat pump, not a buffer tank sensor. If your system has a buffer on the header, add `entities: { buffer_top: <the header sensor> }` yourself (the demo does this).
- Electricity counters (`consumption_*`, `jaz_*`, `maz_*`, `taz_*`): they stay 0 without an S0 electricity meter (WP110) and start disabled in `wolf_smartset`, which would give empty COP tiles. `power_consumption_wp_ehz` is used as the live power only.
- `program`: see above.
- `heating_circuit_pump` and `feed_heating_circuit_pump`: the heat generator's own pumps; the card draws the mixer circuit pump.
- `dhw_status`, `mixer_circuit_demand`, `set_boiler_temperature`, `average_outside_temperature`, `3_way_diverter_valve_htg_clg`, `mixer_motor`, `mixer_flow_sensor_vf`: no matching card key. `mixer_circuit_demand` reports `Partymodus`, `Urlaubsmodus` and `Sparbetrieb`; it could serve as `program` once an installation confirms it.
- `set_dhw_temperature`, `day_temperature_heating`, `setpoint_correction`, `program_heating`, `program_dhw`, `time_program_heating`, `time_program_dhw`, `one_time_dhw_charge`: settings; add them to `controls` if you want them on the card.

## Evidence

- `wolf_smartset`: `custom_components/wolf_smartset/translation_keys.py` (the ParameterId to key table), `model.py` (`Parameter.translation_key`, the platform a parameter maps to), `entity.py` (keyed entities drop the name attribute), `sensor.py` (enum sensors return the Wolf display text), `translations/en.json` and `strings.json`, the README sections "Translation keys" and "Entities disabled by default", ADR-Model-016. Checked at release 0.3.0 and on `main` at commit e0b859a (2026-10-26, PR 10, which adds the two time program keys; none of the keys the card uses changed).
- `wolflink`: `homeassistant/components/wolflink/const.py` (the `STATES` slug table), see `upstream/wolf.json`.
- State texts: `parameters-examples/heatpumpparameter.json` of wolf-comm, the list items of Betriebsart Heizgerät (27005000001), Verdichterstatus (27005100001), Mischerkreis Status (36000500001), the diverter valve (27001300001) and the Ein/Aus outputs.
- Reference installation (Wolf CHA with BM-2 and one mixer circuit, `wolf_smartset` 0.3.0, Home Assistant 2026.10.4, card 0.12.0 with a manual mapping, 2026-10-26): the live states `Heizbetrieb`, `Standby`, `Heizen`, `Ein` and `Aus`, the units, the German entity ids (`sensor.heizgerat_*`, `sensor.bedienmodul_bm_2_0_*`, `sensor.zuhause_*` on the system device) and the read-only "Warmwassersolltemperatur" at 10 °C against a 42 °C tank. Detection by this preset build is not confirmed there yet.

## Known limits

- The preset's detection and drawing are not confirmed on hardware for either integration (`tested` unset).
- One mixer circuit. Neither the `wolflink` names nor the `wolf_smartset` keys carry a circuit number, so with `hc_count: 2` the second circuit stays empty instead of repeating circuit 1. The integration will add `_mixer_circuit_2` keys once an installation provides the IDs; the preset then needs a mapping for them.
- `device:` must stay unset for `wolf_smartset` (see above). With `wolflink`, whose entities share one device, it works as usual.
- `wolf_smartset` 0.3.0 or newer is required. With 0.2.1 or older the entities have no translation key and the preset does not detect the integration.
- The SmartSet cloud is polled every 120 s by default with `wolf_smartset` (`wolflink`: 60 s).
