# Changelog

## Unreleased
- Up to six heating circuits (#33): `hc_count` accepts 1 to 6, with `hc4_` to `hc6_` entity keys, `hc4_type` to `hc6_type`, `hc4_name` to `hc6_name`, their editor fields and groups, English and German labels and the diagnostic report. Presets fill circuits 4 to 6 with the next circuit numbers, and the automatic circuit detection of the editor stub counts up to six. The schematic stacks the circuits as before and grows by one row per circuit. Existing configurations with one to three circuits are unchanged.
- Room temperature per heating circuit: optional entity keys `hc2_room` to `hc6_room` and `hc2_room_target` to `hc6_room_target`, for houses with one circuit per floor and a room sensor of its own on each floor. The value appears in the status line under the emitter of its circuit, "Heating · Room 21.4 °C · Target 22.0", as a part of its own (tap and actions open the room sensor, screen readers read its name and value). Mode and room are centred together and never overlap each other, the emitter, its heat waves or the risers of further circuits; without a room sensor the target stands alone, and where both do not fit (long mode texts, narrow cards) the target is left out. `room` and `room_target` stay with circuit 1 and the house. Editor fields in the groups of circuits 2 to 6 with the labels of the room keys, the diagnostic report, new text keys `room` and `room_target` ("Room", "Room target"; German "Raum", "Raum-Soll"), the ground source demo (upstairs with its own room sensor) and self-tests. Presets do not fill the new keys yet.
- HeishaMon preset: entity ids that differ with the current heishamon-homeassistant (#56). Heat, hot water and cooling power are found with both the Power and the Energy spelling of the id (the integration reads either topic, depending on firmware). Power and heat in the schematic prefer the total sensors `sensor.aquarea_energy_consumption` and `_production`, which include hot water. The heating setpoint comes from the zone target temperature (`z1_water_target_temp`, `z2_water_target_temp`) instead of the outlet target, which follows the hot-water target while the valve is on the tank. The holiday program also works with the on/off switch when the sensor is unavailable. README notes on the zone temperature (room) and the low-pressure value of some models.
- Diagnostic report: new line "Loaded from" with the address of the card file, so an outdated dashboard resource is visible at once. The bug report template now names the browser console or the diagnostic report as the source of the card version instead of HACS, which can list a newer version than the one the browser runs (#47).
- Logo: a small schematic of the card (PV, heat pump, diverter valve, hot water tank, radiator) as SVG and PNG in `docs/logo/`, used in the README (light and dark variant) and as favicon, touch icon and header of the live demo. The demo title now uses the current name.
- HeishaMon preset: marked as confirmed on a real installation after feedback that the default MQTT mapping is detected correctly. The combined/layered store in that installation remains outside the supported topology and was mapped manually.
- README: the preset table now puts confirmed presets first and names each automatic outdoor-unit schematic. The animated demo keeps one Lambda unit while showing heating, hot water, defrost, standby, the timeline, quick controls and statistics at the card's real animation speed.
- README: explicit steps for installations made before the rename. HACS keeps the old folder and the old dashboard resource, so the update was not loaded; the new section lists remove, resource cleanup, download and check.

## 0.11.0 – 2026-10-25
- Cut-out counters (#35): optional entities `cutout_high_pressure`, `cutout_low_pressure` and `cutout_temperature` in the details drawer, in their own section "Cut-outs (number of events)". They show event counts as whole numbers with a times sign, never with a pressure or temperature unit. Also in the editor, the diagnostic report and the demo. No preset mappings until the entity meaning is verified.
- Timeline marks (`timeline_marks`): a thin lane under the timeline for every badge, for example a Boost switch, with the periods in which it was on, listed in the legend and selectable by tap. A list of entities or `{ entity, label }` entries works as well. Also in the editor.
- Updated installation guidance for the HACS default listing: search and download through HACS first, with the custom-repository flow retained only as a fallback.
- Added an optional environmental-energy total counter with details and calendar-period tiles. When delivered heat is unavailable, total COP can be derived as `(environmental energy + electricity) / electricity`; all counters must cover the same time range (#26).
- Added a simplified, logo-free Panasonic Aquarea outdoor-unit drawing. The HeishaMon preset selects it automatically; `unit_style: panasonic` makes it available to custom configurations.
- Added logo-free Viessmann Vitocal, Bosch/Buderus, Saunier Duval GeniaAir and Samsung EHS Mono outdoor-unit drawings plus a documented brand-to-style overview. ViCare and EMS-ESP select their drawings automatically; Saunier Duval and Samsung remain explicit choices where the preset cannot identify the brand yet.
- Refreshed the README, development plan and tester guidance after the 0.10.0 release; completed release issues are now tracked under the 0.10.0 milestone.
- Self-test: 524 checks.

## 0.10.0 – 2026-10-24
- Added optional brine and heating-circuit pressure entities, unit conversion to bar, configurable low/critical/high thresholds, accessible warning symbols, live tiles and details rows (#22).
- Added optional middle temperature sensors for DHW and buffer tanks, producing a three-point gradient without changing existing two-sensor tanks (#29).
- Added restrained vapour during air-source defrost for every unit drawing, respecting the animation and reduced-motion settings (#30).
- Added an original, theme-aware column-radiator emitter available for every heating circuit (#37).
- Updated the editor, live demo, custom-text reference and README for the new entities and options.
- Added a locked Node.js/Playwright developer flow: one local HTTP entry point, Chromium and Firefox regression runs, failure artifacts and a small release-contract check in CI.
- Pinned the GitHub Actions runner to Ubuntu 24.04 and protected `main` with required HACS, quality, Chromium and Firefox checks.
- Self-test: 480 checks.

## 0.9.6 – 2026-10-24
- Added a local, clipboard-only diagnostic report with resolved preset and entity mappings, current states/units, errors and quick controls. The report warns that entity ids may contain private names (#7).
- Added an accessible full-screen overlay using the same card instance, with focus trapping, Escape/backdrop/close-button handling, focus restoration and `fullscreen: false` (#9).
- Added recursive custom text/language maps through YAML `texts`, strict key/type validation, English fallback and a stable key reference in `docs/TEXTS.md` (#11).
- Added fixed per-card `auto`, `night` and high-contrast themes in the editor and live demo (#13).
- Replaced the repository social preview with the feature-led Heat Pump Hydraulic Card artwork (proposal C).
- Updated README, roadmap and issue templates for the renamed repository and a diagnostic-report-based real-installation test campaign. PR #16 remains contributor-owned and outside this work.
- Self-test: 460 checks.

## 0.9.5 – 2026-10-24
- The repository is now called `heatpump-hydraulic-card`, the file `dist/heatpump-hydraulic-card.js` and the HACS name "Heat Pump Hydraulic Card". The element names are unchanged: `custom:heatpump-flow-card` keeps working, `custom:heatpump-hydraulic-card` is the unique name.
- Direct systems without buffer or circuit-specific sensors now draw a closed heating circuit and use the heat pump's flow and return temperatures (#18).
- The visual editor accepts object-form quick controls without showing `[object Object]` and preserves their `name` and `icon` while the entity remains selected (#17).
- Energy-dashboard sources without a live power sensor are named in the card and editor. With exactly one missing source, its displayed share is the unexplained remainder of the heat-pump power; manual source sign conventions are documented (#19).
- Text error sensors can use `error_ok` (for example `["No Error", "OK"]`); any other known text then shows the error chip. Numeric and binary behaviour is unchanged, and the editor explains the rules (#21).
- Total COP documentation and editor help now warn that heat and electricity counters need the same start time and that environmental energy is not delivered heat (#20).
- Ground and groundwater loops show `source_in − source_out` while the compressor runs; `source_spread: false` hides the label (#25).
- `animations: auto | always | off` controls reduced-motion behaviour, and `flow_speed` from 0.2 to 3 scales all movement. Both are available in the editor and the live-demo hint points to the override (#6).
- Added a utility-lock badge example to the README (#28).
- Added `docs/ROADMAP.md` with the bug-first release plan, quick wins and impact/effort ordering of feature requests.
- Self-test: 435 checks.

## 0.9.3 – 2026-10-24
Timeline of the operating mode, a fading heating surface, and no more clash with other cards of the same name.
- Timeline (`timeline: true`, `timeline_hours`): a strip under the schematic shows heating, hot water, defrost, blocked and standby over the last 24 hours (3 to 72), from the history of the `mode` entity; without it from the `compressor` and the `valve`. Tap or arrow keys show start, end and duration. One history query per card, kept for five minutes. Also in the editor.
- The heating surface (underfloor loop and radiator) fades from the flow colour to the return colour; one colour when flow and return do not differ.
- The card is also registered as `heatpump-hydraulic-card` (editor `heatpump-hydraulic-card-editor`), the same card under its own name. `type: custom:heatpump-flow-card` keeps working.
- Other cards use the generic element names too, and a browser keeps only the first definition. When another card already owns `heatpump-flow-card`, this card now says so in the console, tells which type to use, and the card picker lists it as "Heatpump Hydraulic Card". Before, it skipped its registration without a word.
- Self-test: 405 checks, including a page where another card registered the generic names first (`test/collision.html`).

## 0.9.2 – 2026-10-23
Small refinements of the heat pump block.
- The frame of the heat pump block follows the mode while running: orange for heating, red for hot water, blue for defrost and cooling; standby stays grey. It was always orange.
- Air sources: the outdoor temperature is shown under the unit next to the air inlet instead of in the house. Ground and groundwater sources keep it in the house.
- A status line that is too long for the block (for example "Hot water · starting compressor" or the German "Warmwasser · Verdichter startet") wraps into mode and status on two lines; a single long word is squeezed to fit.
- Self-test: 378 checks.

## 0.9.1 – 2026-10-23
Keyboard and screen readers.
- Every clickable part is a button: header chips, the parts of the schematic, tiles and details rows. Tab reaches them; the schematic, the tiles and the details are one tab stop each, with arrow keys, Home and End moving inside.
- Enter or Space runs the tap action (default: more-info), Shift+Enter the hold action, Alt+Enter the double-tap action.
- A focus frame in the primary colour marks the focused part (a rectangle inside the schematic, an outline elsewhere).
- Parts of the schematic carry a label with the entity name and value for screen readers; the schematic is a group instead of an image so its parts are announced. Hidden or empty parts are skipped.
- A tile keeps the keyboard focus when its value is redrawn.
- Self-test: 365 checks.

## 0.9.0 – 2026-10-23
Outdoor unit drawings.
- The heat pump block draws the outdoor unit: the anthracite Lambda EU-L (tall, laser-cut pattern over the fan, solid lower panel) and the Vaillant aroTHERM plus in three sizes (one fan low, one fan, two fans). Drawn from photos and published sizes; simplified original drawings, no logos.
- `unit_style: auto | generic | lambda | vaillant` (default `auto`: the style of the preset) and `unit_size: small | medium | large` for Vaillant. Also in the editor.
- **What changes on existing cards:** Lambda and Vaillant cards now show their unit instead of the generic fan. Keep the old look with `unit_style: generic`.
- The anthracite stays the same in every theme; a thin rim in the theme text colour keeps it visible on dark cards. New variables `--hfc-anthracite` and `--hfc-casing`.
- Several fans spin and defrost independently (one snowflake per fan). Ground and groundwater sources keep their loop symbol.
- Self-test: 342 checks.

## 0.8.1 – 2026-10-23
Looks.
- Narrow cards: the type size follows the width of the schematic. Below about 640 px labels grow, below about 500 px they grow further and secondary labels (flow rates, tank bottom temperature, VL / RL prefixes, valve, circulation and hot water target line) are hidden, so the main numbers stay readable on phones.
- Chips: text colour is mixed with the theme text colour, so the mode, program, error and badge chips read in dark themes too (they were hard to see before).
- Power sources: name and value on two lines with a halo, so the labels no longer run into each other and the lines do not cut through the text.
- Tanks: a four-step scale (blue, cyan, orange, red) mixed in oklch instead of a blue-red mix that turned muddy violet. New variables `--hfc-tank-cool` and `--hfc-tank-warm`.
- DHW coil: calmer, so it no longer clutters the temperature.
- Idle pipes are solid pale tints instead of transparent, which removes the dark dots where pipes meet.
- Multiple circuits: the riser bridges the return line of circuit 1 where they cross.
- Self-test: 326 checks.

## 0.8.0 – 2026-10-22
Wall display.
- `layout: wall` for wall tablets: the wide layout with about 30 % larger type. The quick controls and the details toggle are hidden and not clickable until a touch or mouse move wakes the card, and fade out again after `wall_timeout` seconds (default 10, `0` = always visible); an open details drawer closes with them. Also in the editor.
- Self-test: 314 checks.

## 0.7.0 – 2026-10-22
Layouts, colours you can change, actions on every element, heating program, solar thermal.
- Colours: all colours are CSS variables (`--hfc-heat`, `--hfc-pv`, `--hfc-tank-cold` …) with the previous colours as defaults. A theme or card-mod can restyle the card; the temperature scales of pipes and tanks follow the variables too. Without a theme nothing changes, apart from slightly different tints of chip text and the grid line.
- Layout: `layout: compact` (tighter spacing for narrow columns) and `layout: wide` (schematic left, controls, tiles and details right, from 760 px card width; for wall tablets). Also in the editor.
- Actions: `actions` gives every element of the schematic its own `tap_action`, `hold_action` and `double_tap_action`, keyed by entity key; badges can carry them directly. A tap without a configured action still opens more-info.
- Heating program chip (eco, night, party, holiday) from the new `program` entity or, without one, from the heating circuit mode (Lambda `ECO`). `program_map` maps raw states; common words in English and German are recognised. Presets: EMS-ESP `modetype`, HeishaMon holiday mode, myPyllant special function (the last two and the solar preset below not yet tested on a real installation).
- Solar thermal: `solar_collector` and `solar_pump` draw a collector on the roof edge of the house with a loop into the DHW tank, animated while the pump runs. ViCare preset. Needs the DHW tank.
- Animation speed: fan, pumps and flow lines follow the compressor modulation (`compressor_speed`; Hz and rpm against `compressor_speed_max`). Without a modulation value the fan keeps following the power.
- Self-test: 302 checks.

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
