# Custom text reference

`texts` is a nested YAML map keyed by lowercase language codes. Select one with `language`; missing entries always fall back to English. Existing English or German labels can also be overridden by defining `texts.en` or `texts.de`.

```yaml
language: nl
texts:
  nl:
    title: Warmtepomp
    modes:
      heating: Verwarming
```

Only the keys below are accepted. Every leaf must be a string. Values are rendered as plain text. Keep the named placeholders in translated strings:

- `{sources}` in `energy_missing`
- `{h}` in `timeline_title` and `timeline_aria`

## Top-level keys

```text
not_found
title
heat_pump
dhw
buffer
heating_circuit
house
running
compressor_off
source_in
outdoor
energy_missing
brine_in
brine_out
well_in
well_out
details
sec_operation
sec_hydraulic
sec_refrigerant
sec_more
diagnostic_copy
diagnostic_copied
diagnostic_failed
fullscreen_open
fullscreen_close
source_flow
target
middle
bottom
brine_pressure
hc_pressure
pressure_normal
pressure_warning
pressure_critical
error
circulation
valve_dhw
solar
timeline_title
timeline_gap
timeline_aria
valve_heating
valve_cooling
pv
battery
grid
stat_cop_heating
stat_cop_dhw
stat_energy
stat_starts
stat_spread
stat_volume
stat_heat
pv_share
```

## `det`

```text
hours
starts_total
aux_hours
energy_total
heat_total
cop_total
compressor_speed
evap_temp
cond_temp
suction_temp
hot_gas
liquid_temp
low_pressure
high_pressure
eev
superheat
subcooling
```

## `programs`

```text
eco
night
party
holiday
```

## `tiles`

```text
cop_live
cop_heating
cop_dhw
cop_cooling
cop_total
spf
energy
energy_heating
energy_dhw
energy_cooling
energy_defrost
energy_standby
energy_aux
heat
heat_heating
heat_dhw
heat_cooling
heat_defrost
starts
cycles_heating
cycles_dhw
cycles_cooling
defrosts
hours
hours_per_start
load_classes
aux_hours
aux_starts
spread
volume
heat_estimated
power
heat_live
compressor_speed
source_spread
outdoor
dhw_top
room
brine_pressure
hc_pressure
pv_share
pv_production
solar_thermal
cost
```

## `periods`

```text
now
today
yesterday
week
month
year
total
```

## `modes`

```text
idle
heating
dhw
cooling
defrost
blocked
frost
circulate
off
legionella
trailing
```
