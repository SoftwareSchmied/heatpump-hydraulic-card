# Changelog

## 0.5.0 – 2026-10-21
Your own stat tiles, with costs and actions.
- Customizable stat tiles (`tiles`): pick tiles, order and period (`now`, `today`, `yesterday`, `week`, `month`, `year`, `total`) from a catalog of more than 40 tiles – COP per mode, SPF, electricity and heat per mode (including defrost and standby), starts, cycles, defrosts, hours, runtime per start, load classes, heater hours and starts, live values, PV and solar thermal yield, cost. Free entities can be mixed in. Without `tiles` nothing changes; `tiles: []` hides the row.
- Presets map the tiles: Lambda (periods day/month/year/total, cycles, defrost and standby energy), ViCare (COP, SPF, consumption per period, hours, load classes, heater rod, PV, solar thermal), EMS-ESP (totals per mode), HeishaMon (heat and electricity as current power), Vaillant (daily energy per mode).
- Periods an integration does not provide come from the long-term statistics of its total counters (`recorder/statistic_during_period`); a COP for a period is computed as heat ÷ electricity (marked ≈).
- Card editor: "Own tile selection" with a sortable list of the tiles this installation can fill.
- Cost tile with a card-wide `price` (number or entity, also in the editor) and `currency`. With a dynamic tariff the card bills every hour at that hour's mean price from the long-term statistics, the current hour at the current price; year and total use daily and monthly values (≈). ct/kWh and per-MWh prices are converted.
- Tile actions: `tap_action`, `hold_action` and `double_tap_action` on every tile (also `stats`), handled by Home Assistant (navigate, url, toggle, perform-action, more-info, none, confirmation). The default stays more-info.
- Self-test: 248 checks.

## 0.4.3 – 2026-10-21
- Detection: Viessmann (ViCare) and EMS-ESP gas boilers are no longer taken for heat pumps; ViCare needs a compressor entity, EMS-ESP needs heat pump entities (`hpactivity` / `hptc1`). The Lambda preset only accepts entities of the lambda_heat_pumps integration.
- Error boundary: unexpected data shows a short message in the card instead of an empty card; the editor never breaks the dialog.
- Editor marks presets that are not yet tested on a real installation and asks for feedback.
- Self-test (`test/selftest.html`, 182 checks) runs in headless Chrome in CI; demo data moved to `demo/setups.js`.

## 0.4.2 – 2026-10-21
Easier setup in the card editor.
- Card editor shows the entities found by the preset (marked "Found by the preset"); only differences are saved: another entity overrides, a cleared field hides the entity (`null`).
- The preset field reports the detection (prefix, number of entities) or why nothing was found; the card shows a hint when the preset finds nothing.
- Editor offers circuit 2/3 fields only up to `hc_count`.
- Editor layout: preset, title, emitter and number of circuits on top; prefix, device, heat source, power sources, threshold, language, circuit names and details option under "Advanced".
- Editor warns about missing core entities and what the card cannot show without them (running state, live COP, spread, estimated heat output).
- New cards: `hc_count` and `source_type` are detected where reliable (circuits: Lambda, EMS-ESP, Vaillant; brine: EMS-ESP).

## 0.4.1 – 2026-10-21
- Details drawer: energy counters reported in Wh (e.g. Lambda) are shown in kWh.

## 0.4.0 – 2026-10-21

**What may change on existing cards after the update** (no configuration breaks):
- Without own `pv` / `battery` / `grid` sensors, PV / battery / grid now appear if your Energy dashboard has power sensors. Turn off with `power_sources: manual`.
- Presets now map a backup heater (Lambda: 2nd heating stage, EMS-ESP: auxiliary heater, HeishaMon: internal heater), shown as a small box in the heat pump. Hide with `entities: {heater: null}`.
- A collapsed **Details** section appears below the statistics when the integration provides counters or refrigerant values.

**New**
- Quick controls (`controls`): toggle, press, dropdown and number input for switch, button, script, select, water_heater, climate, number and their input_* helpers.
- Details drawer below the statistics: operating hours, total starts, total electricity and heat with total COP, refrigerant circuit (compressor speed, evaporation, condensation, suction gas, hot gas, liquid line, pressures, expansion valve, superheat, subcooling; superheat and subcooling computed when missing) and own rows (`details`, `details_open`). Presets: Lambda, ViCare, EMS-ESP, HeishaMon.
- Up to three heating circuits (`hc_count`, `hc2_type`, `hc3_type`, `hc_name`…, entity keys `hc2_*` / `hc3_*`). Presets fill circuits 2 and 3 with the next circuit numbers (Lambda, EMS-ESP, Vaillant, HeishaMon zone 2).
- Heat source `source_type: air | brine | water`: ground loop or groundwater wells below the heat pump, with source inlet and outlet (`source_out`).
- Heater rods in the DHW tank and buffer (`dhw_heater`, `buffer_heater`) and a backup / inline heater (`heater`), glowing while on, red at stage 2+. Presets: Lambda 2nd heating stage, EMS-ESP auxiliary heater, HeishaMon internal heater.
- PV / battery / grid from the Energy dashboard: without own `pv` / `battery` / `grid` sensors, the card reads the power sensors of the Energy dashboard and splits the heat pump's power by the current supply mix (marked ≈). New option `power_sources: auto | manual`.
- Live demo on GitHub Pages (`demo/`, formerly `test/index.html`): all presets and scenarios, light/dark, English/German, with the matching card configuration.
- README: "Where the numbers come from" section, link to the live demo and the community thread; emojis removed.
- Card: the error chip and the defrost indicator use drawn SVG symbols instead of the ⚠ and ❄ characters, which some devices render as colour emoji.

## 0.3.1 – 2026-10-19
- README: animated demo GIF, "Open in HACS" button, CI and release badges, feedback section.
- Issue templates: bug report and preset feedback / new brand.
- No functional changes to the card.

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
