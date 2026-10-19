# Changelog

## 0.3.0 – 2026-10-19
- **Preset `emsesp`** (not yet tested on real installations): Bosch, Buderus, Junkers, Nefit, Worcester, Sieger, elm.leblanc and iVT heat pumps via the EMS-ESP gateway; instance prefix detection, English and German activity texts.
- **Preset `heishamon`** (not yet tested on real installations): Panasonic Aquarea via HeishaMon + heishamon-homeassistant; MQTT prefix detection.
- New entity key `defrost` (binary). `compressor` may be numeric (frequency/speed > 0 = running). `valve` accepts states such as `Tank`/`DHW`.
- Without an operating-mode entity the card derives the mode (heating / hot water / defrost / standby) from compressor, valve and defrost.
- Without circuit pump or circuit mode, the heating circuit runs whenever the heat pump heats or cools.
- Preset entities that do not exist in Home Assistant no longer count as configured.
- README lists all supported brands per preset.

## 0.2.0 – 2026-10-19
- **Presets** (not yet tested on real installations) for Viessmann (core ViCare integration, language-independent via entity registry translation keys) and Vaillant aroTHERM (myPyllant, home prefix auto-detected).
- **Heat emitter:** `hc_type: radiator` draws radiators with rising heat waves; underfloor now shows a screed layer.
- **Flow rates:** shown on the heating-side loop; new optional `hc_volume` and `source_volume`.
- **Estimated heat output** from flow rate × spread when no heat sensor exists (marked ≈), including COP.
- **Units:** power in W or kW, heat in kW or W, flow rate in l/h, l/min or m³/h are converted.
- `device` option to restrict preset detection to one device; binary error sensors supported.
- Mode chip shows "Hot water" when the valve is on DHW even if the integration reports "heating".
- Pipes without a temperature sensor keep their base colour instead of turning grey.

## 0.1.0 – 2026-10-19
First public version.
- Animated schematic: power sources (PV / battery / grid) → heat pump → diverter valve → DHW tank / buffer → heating circuit, house.
- Vendor-neutral core with normalized modes and `mode_map` overrides.
- Preset `lambda` for lambda_heat_pumps, supporting legacy (`sensor.<prefix>_hp1_…`) and new (`sensor.hp1_…`) naming, with automatic prefix detection.
- Optional blocks are hidden when their entities are missing, with a bypass line when there is no buffer.
- UI editor (`getConfigForm`) with grouped entity pickers; English and German.
- Statistics row, custom stat tiles, badges, error chip, more-info on click, reduced-motion support.
