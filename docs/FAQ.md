# Frequently asked questions

Answers to the questions about settings and configuration that come up most. Something drawn wrong is in [Troubleshooting](../README.md#troubleshooting), sorted by symptom. A question that is not answered here: ask in the [Q&A discussions](https://github.com/Sturmi77/heatpump-hydraulic-card/discussions/categories/q-a), where the answer stays with the question and helps the next person.

## Where do I ask what?

- **A question about settings, entities or YAML:** [Q&A discussions](https://github.com/Sturmi77/heatpump-hydraulic-card/discussions/categories/q-a).
- **Something is drawn wrong, missing, or the card does not load:** a [bug report](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/new?template=bug_report.yml) with the diagnostic report.
- **A preset does not fit your heat pump, or your brand has none:** the [preset feedback form](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/new?template=preset_feedback.yml).
- **Showing your setup, ideas and general talk:** the [Home Assistant Community thread](https://community.home-assistant.io/t/card-heatpump-flow-card-animated-hydraulic-schematic-for-heat-pumps-lambda-viessmann-vaillant-bosch-buderus-panasonic/1029598).

## Can a part be moved, for example the boiler further to the right?

No. The card draws every installation from the same fixed slots, so each part has one place and the layout stays tested for all of them in every language and width. The drawing shows what role a part plays in the water circuit, not where it stands in the boiler room. What the card does change:

- a **layout bug**, such as a text that is covered or cut off: please report it with a screenshot and the diagnostic report;
- a **new hydraulic variant** that the card cannot draw yet: open an issue with a sketch; variants are built by how common they are.

Colours (`--hfc-*`), layouts, names and which values are shown are configurable ([Layout, actions and colours](../README.md#layout-actions-and-colours)). The rule is in [CONTRIBUTING](../CONTRIBUTING.md#scope-of-the-drawing).

## My integration has no entity for the diverter valve. Does the valve still work?

Yes. Without `valve` the card takes the hot-water side from the operating mode (`dhw` in `mode_map`), and presets whose integration has no valve entity, such as Lambda, do that without any setting. Map `valve` only if your integration reports the valve itself; a valve that reports texts other than on/off needs `valve_map` (or the valve states in the editor under *Advanced*).

## The editor asks whether there is a buffer, or about the pump

Some things the integration cannot tell, and the drawing depends on them. Then the editor asks above the fields, from the most common question to the rarer ones:

- **Buffer:** no buffer sensor is reported. "Yes" draws a parallel buffer (`buffer: true`), "No" keeps the circuits on the heat pump (`buffer: false`).
- **Pump:** without a buffer and with one circuit, ViCare reports one pump that can be the heat pump's own pump in front of the diverter valve (it then runs for hot water too) or the circuit's pump (`primary_pump: true` or `false`).
- **Circuits:** the integration reports circuits from number 2 on, but no circuit 1 (Open3E). "Yes" starts the card at the first circuit it found (`index: { hc: 2 }` and the count).

The preview shows your answer at once; nothing is saved until you press *Save*, and *Cancel* keeps the saved card. "I don't know" leaves the card as the preset draws it. An answered question is not asked again; the same options are under *Advanced*.

## A stat tile stays empty or shows "–"

Tiles for today, the week, the month or the year read the period from the long-term statistics of a total counter. Home Assistant keeps those statistics only for sensors with a `state_class`; check the attributes of the counter under *Developer tools → States*. Energy counters need `total` or `total_increasing`. Start and hour counters also work with `measurement` (myPyllant reports them that way): since they only count up, the card takes the period from their highest and lowest value. Without a `state_class`, map a counter of the period itself, or a total counter that has one, with `tile_sources` ([Stat tiles](../README.md#stat-tiles)). A newly mapped counter fills its periods as Home Assistant collects statistics.

## Which sensor does the hot-water standby-loss tile need? Watts?

No watts and no loss sensor: the tile shows the cool-down of the tank in K/h and computes it itself from the recorder history. It needs a plain temperature sensor in the tank (`dhw_top`, or `dhw_loss_sensor` when `dhw_top` is an estimated value) and an operating-mode or compressor entity, so it can tell standby from charging. Over the last 48 hours it fits the standby windows of at least 3 hours and leaves out charging, draw-off and the heater rod. A sensor that already reports °C/h cannot be fed into the tile. It is a temperature measure, not an energy: kWh would need the tank volume ([Stat tiles](../README.md#stat-tiles)).

## How do I put switches or selects on the card, for example one per heating circuit?

With `controls`, a list of entity ids or `{entity, name}` ([Configuration](../README.md#configuration)):

```yaml
controls:
  - entity: select.hc1_operating_mode
    name: Circuit 1
  - entity: select.hc2_operating_mode
    name: Circuit 2
```

Switches, buttons, scripts, selects, numbers, climate and water heater entities work. The ids above are examples; use the entities of your installation.

## The card always shows "ready", although the heat pump runs

`mode` maps a select with the chosen operating mode ("Heat only", "Auto"), not what the heat pump does now. Clear `mode` where the preset needs none, or map a sensor of the current operation; the editor flags a select there ([Troubleshooting](../README.md#troubleshooting)).

## The card looks like an old version, or options are missing

An old copy of the card is still loaded, usually the resource from before the rename. Delete the old resource and its folder ([Upgrading an installation from before the rename](../README.md#upgrading-an-installation-from-before-the-rename)); the card shows a notification when it notices this.

## Which entities does the card use, and where do they come from?

The diagnostic report (document button in the card header) lists every mapped entity with its source: `[preset]` found by the preset, `[own]` set in your configuration, and `[own · <integration>]` for an entity of another integration ([Diagnostic report](../README.md#diagnostic-report)). It stays local until you paste it; review it for private names first.
