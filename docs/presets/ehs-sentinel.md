# Samsung EHS (EHS Sentinel)

Preset `ehs_sentinel`. Back to the [README](../../README.md#supported-heat-pumps).

## Setup

```yaml
type: custom:heatpump-hydraulic-card
preset: ehs_sentinel
```
For Samsung EHS heat pumps read over the F1/F2 (NASA) bus with an RS485 bridge and the HACS integration [EHS Sentinel](https://github.com/echoDaveD/ehs_sentinel_hacs_integration) (domain `ehs_sentinel`). For the ESPHome component esphome-samsung-nasa use the preset [`samsung`](samsung.md).

EHS Sentinel names every entity after its NASA message: the prefix (`ENUM_`, `LVAR_`, `NASA_`, `VAR_`) is dropped and the rest written in camel case, so `NASA_INDOOR_WATER_OUT_TEMP` becomes `indoorWaterOutTemp`. The entity id adds the device, which is the instance name of the integration (`Samsung EHSSentinel` by default): `sensor.samsung_ehssentinel_indoorwaterouttemp`. The names stay English in every Home Assistant language. The preset finds the prefix from the water outlet temperature together with the compressor status on platform `ehs_sentinel`, so another instance name works as well. With write mode on, writable messages (DHW target, water outlet target, outing mode) become number or switch entities; the preset takes either.

The preset is built from the integration's NASA repository (v2.2.2) and the entity list and cross-match of an installation (#403). It is not marked as tested until that installation confirms it.

What you get:
- water outlet and return (0x4238, 0x4236), flow rate (0x42E9, l/min), outdoor temperature (0x8204)
- compressor status (0x8010) and frequency (0x8238), defrost (0x402E), outdoor fan speed (0x823D)
- 3-way valve (0x4067): `ROOM` is heating, `TANK` is hot water
- the primary water pump (0x4089) on the flow next to the heat pump: it runs for hot water, too (`primary_pump: false` draws it in the circuit again)
- electrical power (0x8413, kW) and the integration's heat output (W), giving a live COP
- backup heater (0x406C: `OFF`, `STEP 1`, `STEP 2`) and booster heater in the tank (0x4087)
- DHW tank temperature and target (0x4237, 0x4235)
- circuit 1: the integration's current target flow, else the water outlet target (0x4247); the room sensor of the controller (0x4203) where one is fitted (-50 °C means none)
- outing mode (0x406D) as the holiday chip
- error code (0x8235): 0 is fine, any other code shows the error chip
- energy today and in total, heat in total, compressor starts, COP of today for heating and hot water
- tiles: electricity, heat and COP today and in total, each also for heating and hot water, starts and defrosts from the integration's counters
- details: discharge and suction temperature, evaporation and condensation as the saturation temperatures at low and high pressure (0x82A0, 0x829F), both pressures (bar), expansion valve

There is no operating mode: as with the `samsung` preset, the card shows heating while the compressor runs, hot water while the valve is on the tank, and defrost from the defrost status.

**Standby:** the outdoor unit draws about 250 W while the compressor is off (#403). The preset therefore counts the heat pump as running only above 300 W of power, or while the compressor status is on. Set `power_threshold` to change it.

## Not mapped

- **Operating mode:** indoor real operation mode (0x4002) names the demand and may stay on it while the compressor pauses; compressor and valve are more direct.
- **Room target:** the zone 1 target (0x4201) keeps the controller setting and does not follow a schedule of the house. Map your own `room_target` if you have one.
- **Compressor hours:** the integration counts active minutes of the indoor unit (0x4424), not compressor hours.
- **Circuit flow and return:** the bus reports the indoor unit's outlet and return. Zone 2 and a mixing kit need manual `hc2_*` entities.
