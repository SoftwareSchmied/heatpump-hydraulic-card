# Heatpump Flow Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://hacs.xyz/docs/faq/custom_repositories)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An **animated hydraulic schematic** for air-to-water heat pumps in Home Assistant.

It shows electricity flowing from **PV, battery and grid** into the heat pump, the **diverter valve** switching between hot water and heating, colour-coded **tanks**, the **heating circuit** and your rooms. Animation speed follows the real flow rate. The core is vendor-neutral: **presets** make it zero-config for a specific heat pump, starting with **Lambda** ([lambda_heat_pumps](https://github.com/GuidoJeuken-6512/lambda_heat_pumps)).

![Live view while heating](docs/live-heating.jpg)

## Features

- **Power sources:** PV / battery / grid → heat pump, animated whenever more than 10 W flow.
- **Heat pump:** the fan spins while the compressor runs, faster at higher power. Shows mode and sub-state, electrical power → heat output, and live COP. Defrost is shown with a snowflake and an icy flow line.
- **Diverter valve:** shows DHW or heating; the active circuit is animated.
- **Tanks:** DHW tank and buffer with a top/bottom temperature gradient (blue = cold, red = hot), target, mode, a heat-exchanger coil while charging, and the circulation pump.
- **Heating circuit:** pump and underfloor loop with flow and target, plus a house with room temperature, target and outdoor temperature.
- **Statistics row:** COP heating/DHW today, energy today with PV share, compressor starts, spread, flow rate, plus your own tiles.
- **Status chips:** mode, freely defined badges (e.g. "Boost"), error chip when any error code is ≠ 0.
- **Optional blocks:** whatever you don't have (buffer, DHW tank, power sources, house) is simply not drawn.
- **UI editor** with grouped entity pickers. **English and German**, following the HA language. Light/dark via your theme. Every element opens the more-info dialog. `prefers-reduced-motion` is respected.

| Zero-config (Lambda preset, DHW run) | Other brand, minimal setup | Dark theme |
|---|---|---|
| ![](docs/zero-config-dhw.jpg) | ![](docs/other-brand-minimal.jpg) | ![](docs/dark.jpg) |

## Installation

### HACS (custom repository)
1. HACS → ⋮ → **Custom repositories** → URL `https://github.com/Sturmi77/heatpump-flow-card`, type **Dashboard**.
2. Install **Heatpump Flow Card** and reload the browser.

### Manual
Copy `dist/heatpump-flow-card.js` to `/config/www/` and add `/local/heatpump-flow-card.js` as a JavaScript module under *Settings → Dashboards → Resources*.

## Quick start

### Lambda (lambda_heat_pumps)
```yaml
type: custom:heatpump-flow-card
preset: lambda
```
That's it. The card finds your entities itself (`sensor.<prefix>_hp1_…` with legacy naming, or `sensor.hp1_…` with the new naming). If you have several heat pumps or the detection picks the wrong one, set the prefix explicitly (`prefix: eu08l`) or the unit numbers (`index: {hp: 2, hc: 2}`).

The integration itself has no PV/battery/grid split or room average. Add your own sensors for those:
```yaml
type: custom:heatpump-flow-card
preset: lambda
title: Heat pump
entities:
  room: sensor.living_room_temperature
  pv: sensor.heatpump_power_from_pv          # W
  battery: sensor.heatpump_power_from_battery
  grid: sensor.heatpump_power_from_grid
  energy_today: sensor.heatpump_energy_today # kWh
badges:
  - entity: input_boolean.heatpump_boost
    label: 🚀 Boost
```

### Any other heat pump
Map your entities and translate your mode states to the card's normalized modes:
```yaml
type: custom:heatpump-flow-card
title: Heat pump
entities:
  mode: sensor.hp_operating_mode
  flow: sensor.hp_flow_temperature
  return: sensor.hp_return_temperature
  power: sensor.hp_power
  dhw_top: sensor.dhw_temperature
  outdoor: sensor.outdoor_temperature
  hc_pump: binary_sensor.heating_circuit_pump
mode_map:
  Heating: heating
  Hot water: dhw
  Defrost: defrost
  Standby: idle
```
Normalized modes: `heating`, `dhw`, `cooling`, `defrost`, `idle`, `blocked`, `frost`, `circulate`, `off` (plus `legionella`, `trailing` for the DHW tank). If your heat pump has a diverter-valve sensor, use `valve` (binary, on = DHW) instead of a DHW mode.

## Configuration

| Option | Description |
|---|---|
| `preset` | `lambda` or omit. Fills entities, mode maps and error sensors. |
| `prefix` | Preset device prefix. Omit for auto-detection, `""` for unprefixed entity ids. |
| `index` | Unit numbers for presets: `{hp, dhw, buffer, hc}` (default 1). |
| `title` | Card title (default: "Heat pump" / "Wärmepumpe"). |
| `language` | `auto` (default), `en`, `de`. |
| `power_threshold` | Counts as running above this electrical power in W (default 100). |
| `entities` | Entity overrides (see below). `null` removes a preset entity. |
| `mode_map`, `dhw_mode_map`, `buffer_mode_map`, `hc_mode_map` | Raw state → normalized mode, merged over the preset. |
| `running_states` | Raw `status` values that count as compressor running. |
| `errors` | List of error-code sensors. A value ≠ 0 shows the error chip. |
| `badges` | `[{entity, label}]` chips shown while the entity is on. |
| `stats` | Extra tiles `[{entity, name, unit, decimals}]`. |

**Entity keys:**
- **Heat pump:** `mode`, `status`, `compressor`, `power`, `heat`, `flow`, `return`, `volume`, `source_in`, `outdoor`, `valve`
- **Storage:** `dhw_top`, `dhw_bottom`, `dhw_target`, `dhw_mode`, `circulation`, `buffer_top`, `buffer_bottom`, `buffer_mode`
- **Heating circuit and house:** `hc_flow`, `hc_return`, `hc_setpoint`, `hc_mode`, `hc_pump`, `room`, `room_target`
- **Power sources (W):** `pv`, `battery`, `grid`
- **Statistics:** `cop_heating_today`, `cop_dhw_today`, `energy_today`, `pv_share_today`, `starts_today`

![UI editor](docs/editor.jpg)

## Topology
The layout is fixed on purpose: one heat pump, a diverter valve, an optional DHW tank, an optional buffer and one heating circuit. That covers most single-family installations. Multiple heating circuits, combined/layered storage, heater rods and solar thermal are not drawn (yet).

## Adding a preset
Presets live in `HFC_PRESETS` in `dist/heatpump-flow-card.js`. A preset consists of:
- `entities(prefix, index)`, which returns the entity map
- optional `errors(prefix, index)`
- the mode maps
- `running_states`, `status_labels` and `detect(states, index)`

Pull requests for other brands are very welcome.

## Development
`test/index.html` renders the card with simulated installations and scenarios (heating, DHW, defrost, standby with error, light/dark) without Home Assistant. Open it via a local web server.

## Deutsch (Kurzfassung)
Animiertes Hydraulikschema für Luft-Wasser-Wärmepumpen: Strom aus PV, Akku und Netz → Wärmepumpe → Umschaltventil → Warmwasser bzw. Puffer → Heizkreis. Für Lambda reicht `preset: lambda`, die Entitäten werden automatisch erkannt. Andere Hersteller werden über `entities` und `mode_map` angebunden. Grafischer Editor und Oberfläche auf Deutsch und Englisch.

## License
MIT © 2026 Sturmi77
