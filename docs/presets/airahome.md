# Aira (ha-airahome)

Preset `airahome`. Back to the [README](../../README.md#supported-heat-pumps).

## Setup

```yaml
type: custom:heatpump-hydraulic-card
preset: airahome
```
For Aira heat pumps (6, 8 and 12 kW) with the HACS integration [ha-airahome](https://github.com/Invy55/ha-airahome) (domain `airahome`, Bluetooth). Every entity of the integration carries its key as translation key, so the preset finds the entities through the entity registry: the `ah_<id>_` part of the entity ids and the Home Assistant language do not matter. With two zones set in the integration options, set `hc_count: 2`.

The preset is built from the integration source and the entity list of a 6 kW installation (#417). It is not marked as tested until that installation confirms it.

What you get:
- the active state (`hp_active_state`) as the mode: `heating`, `cooling`, `dhw`, `defrosting`, `idle`; `anti_legionella` counts as hot water
- the compressor speed (Hz) as running and as the speed, defrost, the outdoor fan
- the outdoor unit's supply and return as the heat pump flow and return, the primary circuit flow rate (l/min)
- the outdoor unit's primary circulator as the primary pump next to the heat pump: it feeds the buffer and the hot-water coil
- electrical power and heat output (both in kW), giving a live COP; the heat is the integration's own value from the primary flow and the outdoor unit's spread
- the buffer: the integration's wiki names the indoor unit supply temperature as the buffer tank temperature, so it is `buffer_top`
- the inline heater, the hot-water tank and its target from the water heater entity, which follows the schedule of the Aira app (the target sensor holds only the default temperature and is the fallback, #417)
- per zone: supply temperature as the circuit flow, the calculated supply temperature as the target, the zone state, the circulator, room temperature, humidity and the target of the zone thermostat
- away mode as the holiday chip, alarms as the error chip
- totals of electricity and heat (tiles and details), evaporating and condensing temperature, discharge and suction gas, both pressures, expansion valve steps

The integration reports no diverter valve: hot water comes from the active state.

## Not mapped

- **Diverter valve, circulation pump:** no entities.
- **Zone return:** each zone reports a supply temperature only.
- **Zone valve position:** reported in %, but it is not documented whether it is a mixing valve or a zone valve, so it is not drawn as a mixer. Map it as `hc_mixer` if your zones have mixing valves.
- **Per-use energy:** the integration reports the power of hot water and of heating/cooling separately (`dhw_instant_power_kw`, `hc_instant_power_kw`) but no counters per use.
