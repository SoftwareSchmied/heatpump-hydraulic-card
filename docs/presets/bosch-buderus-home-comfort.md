# Bosch/Buderus Home Comfort

This preset is for the [Bosch/Buderus Home Comfort integration](https://github.com/SoftwareSchmied/ha-bosch-buderus-heating), domain `bosch_buderus_heating`. It covers the PointT cloud, the local access that integration 0.9.0 added (K40/K40RF gateways, read-only), and both together. It is separate from the EMS-ESP MQTT preset.

```yaml
type: custom:heatpump-hydraulic-card
preset: bosch_buderus_heating
```

With integration 0.9.1 the preset selects the outdoor-unit drawing, the buffer cylinder and the primary pump from the heat generator the gateway reports (see [Outdoor-unit drawing and hydraulic defaults](#outdoor-unit-drawing-and-hydraulic-defaults)). Without that sensor it draws the Buderus unit for a gateway of the brand Buderus and the Bosch unit otherwise. Choose another `unit_style` by hand if it fits your unit better, and adjust the emitter type to match the installation. With a later integration version the preset also reads the heat source (air, brine or water) from that sensor, see [Ground-source heat pumps](#ground-source-heat-pumps).

## Setup

```yaml
type: custom:heatpump-hydraulic-card
preset: bosch_buderus_heating
source_type: air        # air (default), brine or water; the preset reads it from the heat generator sensor where that reports it
# Only needed before integration 0.9.1, or where the reported indoor unit does not tell it:
# an indoor unit with a parallel buffer cylinder and a primary pump PC0 next to the circuit pump PC1 (for example TP70 units)
buffer: true
primary_pump: true
```

The preset finds the entities through the stable resource identities of the integration in the local entity registry (the card reads the registry once, and only for this preset), so entity names, entity ids and the Home Assistant language do not matter. It only uses enabled entities. With several gateways select the gateway's device with `device`.

The buffer cylinder and the primary pump depend on the indoor unit. There are indoor units without a buffer. Where there is one, it is a parallel buffer: it is connected to the flow and return through a tee, not in series, and it has no temperature sensor of its own. With integration 0.9.1 the preset turns `buffer` on for a TP70 indoor unit and `primary_pump` on for the WLW176i and WLW186i indoor units; for any other unit, and before 0.9.1, set them by hand. Turning the primary pump on for every installation would move the circuit pump of installations without one, so the preset never does that without the indoor unit. With the local access the primary flow rate PC0 drives the primary pump when the primary pump is drawn.

## Ground-source heat pumps

Integration 0.9.2 adds the attribute `heat_source_type` (`air`, `brine` or `water`) to the heat generator sensor. It comes from the heat pump type the gateway reports or, without it, from readings that exist on one kind of heat pump only (see the integration's calculated values). The preset uses it as follows:

- `source_type` of the card configuration always wins. Without it the card draws the source the heat generator sensor reports (`brine` the ground loop, `water` the two wells, `air` the outdoor unit). A new card written by the card editor gets `source_type: brine` or `water` in its configuration; `air` stays the default and is not written.
- Where the sensor reports no kind (the integration before 0.9.2, or no evidence yet), the brine circuit readings below decide: a brine outlet reading means a ground source. An air unit has none of them, so it stays air.
- A ground source has no outdoor unit and no outdoor fan: the card draws the ground loop instead of a `unit_style` drawing.
- The source fields are mapped from the brine circuit of the first heat source: brine inlet (`heatSources:hs1:brineCircuit:collectorOutflowTemp`, the collector outflow) as `source_in` and brine outlet (`…:collectorInflowTemp`, the collector inflow) as `source_out`. An air unit keeps the air intake TL2 as `source_in`. The names follow the integration's heating-system perspective, as in the integration's documentation. The brine spread of the card is the difference of the two.
- The brine pump speed (`…:brineCircuit:pumpSpeed`, a reading of the local access, disabled by default in the integration) is an additional value in the details once you enable it; the card has no input for the brine pump itself. The integration reports its unit as it comes from the gateway.
- The integration has no entity for the brine flow rate or the collector pressure, so the card maps neither (`source_volume` and `brine_pressure` stay free for your own entities).

I took these paths and the meaning of the attribute from the integration source (0.9.2). I tested them only with the card's self-test and synthetic data; I have not seen them on a ground-source installation with this card.

## Outdoor-unit drawing and hydraulic defaults

Since 0.9.1 the integration has a diagnostic sensor **Heat generator** (unique ID `<gateway>:heat_generator`, enabled by default). Its state is the product name of the main heat generator; its attributes list every module (`heat_generators` with `role`, `product_name`, `family`, `construction`, `power_kw`), the main one (`primary` with `family` and `outdoor_power_kw`) and the product name of the outdoor unit (`outdoor_unit`). The families and powers come from the integration's model table, so the preset only reads what that table or the gateway reports; it never derives a model from the position of a module.

The rules, in this order. "Name" is the product name of the outdoor unit or of the main heat generator; a family counts in any module.

| Reported | Drawing | Size (`unit_size`) |
|---|---|---|
| name contains `WLW196i` and `S+` | `buderus_tall_silent` (Logatherm WLW196i AR S+) | – |
| name contains `WLW196i` and `IR` | `buderus_tall_indoor` (WLW196i IR, indoor installation) | – |
| name contains `WLW196i` | `buderus_tall` (WLW196i AR) | – |
| name contains `CS7400i` | `bosch_tall_silent` (Compress 7400i AW) | – |
| name contains `CS7001i` | `bosch_tall` (Compress 7001i AW) | – |
| name contains `CS5001` or `Compress 5000 AW` | `bosch_square` (Compress 5000 AW) | – |
| name contains `WLW166i` | `buderus_compact` (Logatherm WLW166i) | `large` (two fans) for 13 kW: `13` in the name or an outdoor power of 13 kW or more; otherwise `medium` |
| name contains `CS3800i`, or family `cs3800i_aw` | `bosch_compact` (Compress 3800i AW) | `large` (two fans) for the outdoor units `O-T` (10 and 13 kW); `medium` for `O-S` (4 and 7 kW) |
| family `wlw_mb_ar`, `wlw176i` or `wlw186i` | `buderus` (Logatherm WLW MB AR) | `large` for WLW-10 and WLW-12 MB AR (name or an outdoor power of 10 kW or more); `medium` up to 7 kW |
| family `cs8800i_aw` | `bosch_cs8800i` (Compress 8800i AW) | – |
| family `cs5800i_aw`, `cs6800i_aw` or `aw_or` | `bosch` (Compress 5800i/6800i AW) | `large` for the AW OR-T outdoor units (10 and 12 kW, or an outdoor power of 10 kW or more without `OR-S`); `medium` for AW OR-S |
| anything else, or no heat generator sensor | `buderus` when the gateway's devices have the manufacturer Buderus, otherwise `bosch` | – |

Hydraulic defaults from the indoor unit: `TP70` in its product name (the indoor units with a 70 l parallel buffer cylinder) sets `buffer: true`; the families `wlw176i` and `wlw186i` (indoor units with the primary pump PC0) set `primary_pump: true`.

Everything in the card configuration wins: `unit_style`, `unit_size`, `buffer` and `primary_pump` (also `buffer: false` and `primary_pump: false`). A size the preset reads only goes with the drawing it selected; with another `unit_style` by hand the size is `medium` unless `unit_size` is set. A series buffer (`series_buffer: true`) or a combined storage replaces the parallel buffer of the heat generator. The diagnostic report shows such a buffer as `parallel buffer: yes, from the heat generator`. An unknown, unavailable or disabled heat generator sensor behaves like no sensor.

The drawings are simplified original drawings in the card's style, without logos or lettering, from the shapes of the manufacturer's product photos:

- `bosch` (revised; also the drawing of the EMS-ESP preset): a white casing with rounded top corners, a round grille left of the centre with four wide rings, short ribs and dark gaps around a large closed white disc, a plain right side and two small round feet. `medium` (AW 4/5/7 OR-S) about 1.38 : 1 with the grille over 85 % of the height; `large` (AW 10/12 OR-T) about 1.25 : 1, the grille over 65 % of the height and nearer the middle.
- `bosch_cs8800i`: a white, squarer casing (about 1.24 : 1) with a large grille of many fine rings around a small closed disc and a plain grey strip on the right.
- `bosch_compact` and `buderus_compact`: one sheet-metal casing, light for Bosch and metallic grey for Buderus, with square corners, a flat lid, a vertical seam at about 64 % of the width, a round grille of fine rings and ribs on the left, screws along the lower edge and two mounting brackets; `medium` about 1.45 : 1 with one fan, `large` about 0.9 : 1 with two fans one above the other.
- `bosch_square`: a nearly square white front (about 1.15 : 1) in a grey frame, a square black grille of fine mesh with the fan faintly behind it, a plain right panel and a grey plinth with bolts.
- `buderus`: uniformly anthracite, a grille of concentric rings in a slightly lighter anthracite around a dark open centre, no visible blades and no light outline; `medium` (WLW-4/5/7 MB AR) about 1.42 : 1 with chunky matte rings over 80 % of the height, `large` (WLW-10/12 MB AR) about 1.23 : 1 with thin rings over 70 % of the height and a wide plain right side.
- `buderus_tall` and `bosch_tall`: a tall casing (about 0.68 : 1) with a round fan opening in the upper half; Buderus with a champagne frame and lower panel around a dark upper panel and a grey hub, Bosch white under a silver cap with a broad silver ring and a dark fan.
- `buderus_tall_indoor`: a tall black casing with narrow silver edges and a square framed opening with a large five-blade fan behind a grille.
- `buderus_tall_silent` and `bosch_tall_silent`: a tall casing with a large closed disc in the upper half; Buderus dark anthracite with silver side strips, Bosch white under a silver cap with a silver ring.

The fan follows the compressor like every drawing (and the fan speed PL3 where the local access reports it, so it stands still in a defrost), the snowflake and the vapour show a defrost, the auxiliary heater keeps its symbol on the right, and the dark theme keeps an edge around the dark casings. Where the front is closed or finely meshed (`bosch`, `bosch_cs8800i`, `buderus`, the compact casings and the two silent ones) no blades are visible; a dashed ring of the grille turns instead.

The rules for the WLW176i/WLW186i systems, the WLW MB AR, the AW OR, the CS3800i AW and the CS8800i AW follow the integration's model table and the names it lists. The WLW196i, WLW166i, CS7001i, CS7400i and Compress 5000 AW have no entry in that table yet: their rules match the product name only, as the gateway reports it, and I have not seen these names in a real module list.

What you get with the cloud:
- the operating mode from the compressor status, flow, return and outdoor temperature, heating pressure and compressor modulation
- DHW temperature and target; flow, room temperature and target of the selected heating circuit (`index: {hc: 2, dhw: 2}` selects another one, `hc_count` shows further circuits)
- compressor starts and runtime, electricity, heat and environmental energy totals as tiles (calendar periods from the long-term statistics), the holiday indicator and the fault chip
- quick controls: operating mode of the heating and the DHW circuit and the one-time DHW charge; further controls are opt-in

What the local access adds (integration 0.9.0, entities enabled by default):
- the heat pump's own flow TC1; the supply temperature behind the buffer cylinder then becomes the flow of the first circuit
- the refrigerant circuit status, which also shows a defrost and a passive defrost
- the electric power of the compressor and the auxiliary heater as one sum, so the live power and the running state come from a measurement; the auxiliary heater from its electric power
- the primary flow rate PC0, the circuit pump PC1 and the current supply setpoint
- the outdoor unit's fan (PL3), the air intake temperature TL2 and in the details the refrigerant circuit temperatures TR6, TR5, TR3, JR0 and JR1 and the speed of the primary pump
- from the controller signals: the compressor, the hot water 3-way valve VW1, the heat output of the compressor where the unit's software provides it (then a live COP), the flow rate of circuit 1 (PC1), the expansion valve VR1, and in the details the relay of the primary pump PC0 and the 4-way valve VR4

With the local access alone, without the cloud, the same readings are mapped; the operating mode then comes from the refrigerant circuit status. The local access never writes, so there are no quick controls, and the fault and holiday state of the cloud are not available.

## Evidence and test status

I maintain the Home Comfort integration.

- Cloud mapping: I checked a manual configuration of card version 0.11.0 against live data on a real installation with Home Comfort 0.8.2-beta.7. That check covered the saved mappings and their display. It did not exercise the controls or every operating mode through the card. I also ran the original preset resolver against that installation's entity registry without using current states or making writes; all 15 schematic/detail mappings matched the manual configuration.
- Local access (this revision): I took the keys and their meaning from the [0.9.0 source](https://github.com/SoftwareSchmied/ha-bosch-buderus-heating/tree/9b1e2e05f49e3b5776e54c4675d59a4d8d96e7f2/custom_components/bosch_buderus_heating): the unique ID of a local-only reading in [`local_only_sensor.py`](https://github.com/SoftwareSchmied/ha-bosch-buderus-heating/blob/9b1e2e05f49e3b5776e54c4675d59a4d8d96e7f2/custom_components/bosch_buderus_heating/local_only_sensor.py), the reviewed readings and their default activation in [`local_only.py`](https://github.com/SoftwareSchmied/ha-bosch-buderus-heating/blob/9b1e2e05f49e3b5776e54c4675d59a4d8d96e7f2/custom_components/bosch_buderus_heating/local_only.py), the pairs of cloud and local readings in [`observations.py`](https://github.com/SoftwareSchmied/ha-bosch-buderus-heating/blob/9b1e2e05f49e3b5776e54c4675d59a4d8d96e7f2/custom_components/bosch_buderus_heating/observations.py) and the entities of an installation without the cloud in [`local_plant_view.py`](https://github.com/SoftwareSchmied/ha-bosch-buderus-heating/blob/9b1e2e05f49e3b5776e54c4675d59a4d8d96e7f2/custom_components/bosch_buderus_heating/local_plant_view.py).
- On a real installation (a heat pump with a parallel buffer, cloud and local access, integration 0.9.0) I compared these keys with the entity registry without writing anything: every local-access key in the table below is registered and enabled there, except the room temperature (that installation has no room sensor). From its recorded history: the refrigerant circuit status and the cloud's compressor status both reported `defrost` in all eight defrosts between 6 and 10 November; during a hot-water charge the supply temperature behind the buffer read 20.9 °C while TC1 read 51.8 °C; the primary flow rate reports `unknown` below about 1000 l/h.
- This preset revision with the card on that installation: I loaded the build in Home Assistant and compared the preset alone with the previous manual configuration during heating; all mapped entities and the drawing were identical. Defrost (both stages: first the heating side, then a short hot-water stage), hot water, standby and the phase with the primary flow rate `unknown` I replayed from recorded states of that installation into the card; the preset and the manual configuration gave the same result.
- Not tested yet: an installation with the local access alone. The integration's documentation and tests describe that case; I have no such installation. The demo setups "Bosch/Buderus Home Comfort (cloud and local)" and "(local only)" and the automated tests use invented identifiers and values.
- The local-only setup therefore stays untested on a real installation; the test status in the README is left to the maintainer.
- Heat generator and the three further signals (this revision): I took the sensor, its attributes and the families, names and powers of the model table from the [0.9.1 source](https://github.com/SoftwareSchmied/ha-bosch-buderus-heating/tree/7c7348f8e2c4fceb1f530b1d1fd9e0efa7f1904d/custom_components/bosch_buderus_heating) ([`heat_generator.py`](https://github.com/SoftwareSchmied/ha-bosch-buderus-heating/blob/7c7348f8e2c4fceb1f530b1d1fd9e0efa7f1904d/custom_components/bosch_buderus_heating/heat_generator.py), [`heat_generator_sensor.py`](https://github.com/SoftwareSchmied/ha-bosch-buderus-heating/blob/7c7348f8e2c4fceb1f530b1d1fd9e0efa7f1904d/custom_components/bosch_buderus_heating/heat_generator_sensor.py), [`heat_generator_models.json`](https://github.com/SoftwareSchmied/ha-bosch-buderus-heating/blob/7c7348f8e2c4fceb1f530b1d1fd9e0efa7f1904d/custom_components/bosch_buderus_heating/heat_generator_models.json)), the states of the operation modes (not mapped yet) from [`strings.json`](https://github.com/SoftwareSchmied/ha-bosch-buderus-heating/blob/7c7348f8e2c4fceb1f530b1d1fd9e0efa7f1904d/custom_components/bosch_buderus_heating/strings.json) and [`enum_translation.py`](https://github.com/SoftwareSchmied/ha-bosch-buderus-heating/blob/7c7348f8e2c4fceb1f530b1d1fd9e0efa7f1904d/custom_components/bosch_buderus_heating/enum_translation.py), and the forms of the signals from [`local_only.py`](https://github.com/SoftwareSchmied/ha-bosch-buderus-heating/blob/7c7348f8e2c4fceb1f530b1d1fd9e0efa7f1904d/custom_components/bosch_buderus_heating/local_only.py): the SG Ready state is a reviewed signal with the states blocked, normal, preferred, forced and not_used; the DHW heater and the circulation pump are generic signals, disabled by default, that become on/off states when the gateway answers true/false.
- On the same real installation I read the entity registry and the device registry without writing anything: the heat generator sensor is registered; the operation mode sensors declare `off`, `manual`, `auto` (heating circuit 1) and `off`, `low`, `high`, `ownprogram`, `eco`, `follow_heating_program` (DHW); the three signals, enabled there by hand, declare `on`/`off` and the five SG Ready states; the devices have the manufacturer `Buderus`. That installation has a WLW176i-12 TP70 with a WLW-10 MB AR, the combination the integration's model table lists as observed.
- Not tested yet: this revision in Home Assistant. The drawings, the selection rules, the defaults and the new mappings are checked with the demo setups "Home Comfort heat generator: …" and the automated tests, with synthetic data.

## Detection and several gateways

Entity names and entity ids can change with language, device renaming or manual edits. The preset resolves the integration's stable `unique_id` resource keys through Home Assistant's local entity registry. It supports the retained `gateway:` identities, current resource-path identities and, since integration 0.9.0, the readings only the local access provides, `<gateway>:local_only:<resource path>` (the path with `:` instead of `/`). The preset tries every resource path in both forms, the cloud's first: when the cloud starts to offer a path, the integration hands the local-only entity over to the cloud's key, so only one of them is registered. The comparison copies of paired readings (`…:source_local`, `…:source_cloud`) are never used.

A gateway is a heat pump when it reports the cloud's compressor status. A gateway with the local access alone has no compressor status; it is recognised by the heat pump type or the refrigerant circuit status of its heat source. This second rule applies only when no gateway reports a compressor status, so cloud installations resolve exactly as before.

Only this preset requests `config/entity_registry/list`. The card and editor share the request within the same Home Assistant connection. The result is refreshed when the frontend entity registry changes; ordinary state updates do not repeat it. This adds no requests to the cloud or the gateway. Gateway identifiers stay in the local resolver and are not written into the card configuration or its diagnostic report.

For state updates, the card and editor share a cache of this integration's enabled entity ids. They check whether those states are present without enumerating every state in Home Assistant. Added or removed entities, renamed entities and changed registry metadata refresh the mappings, including when the number of available entities stays the same.

In the [Home Assistant 2026.10.3 source](https://github.com/home-assistant/core/blob/2026.10.3/homeassistant/components/config/entity_registry.py#L39-L64), the read-only registry list command has no administrator requirement. I have not yet verified this preset in a real non-admin session. If registry access fails, the manual mappings described below remain usable.

When several gateways expose a heat pump, select the gateway's device in the card editor or provide its Home Assistant device id:

```yaml
type: custom:heatpump-hydraulic-card
preset: bosch_buderus_heating
device: YOUR_HOME_ASSISTANT_DEVICE_ID
```

The device selection scopes measurements, counters and controls to one gateway. Without an unambiguous selection the preset leaves automatic mappings empty; a gateway with the local access alone next to a cloud gateway is only used when its device is selected. If the registry request fails, manual `entities`, `controls` and `details` still work. Reload the page to retry after restoring registry access.

The preset covers one heat pump per gateway. Cascades with several reported heat sources and `index.hp` values other than 1 require manual mappings because the available compressor status and energy totals describe the gateway as a whole.

## Mapped values

Keys after `<gateway>:`. "Local" is the form of a reading only the local access provides; the preset also accepts the same path in the cloud's form.

| Card value | Cloud | Local access |
|---|---|---|
| Operating mode | `heatSources:compressor:status` | without the cloud: `local_only:heatSources:hs1:refrigerant:status` |
| Status (defrost, passive defrost) | – | `local_only:heatSources:hs1:refrigerant:status` |
| Running compressor | – | signal `local_only:signals:SRC.CUHP.HMI.CompressorActive`; otherwise `local_only:heatSources:hs1:refrigerant:compressorActualSpeed` (above 0; disabled by default) |
| Diverter valve (VW1) | – | signal `local_only:signals:SRC.CUHP.HP1.DHWValve` (`on` = hot water; it is also `on` during the hot-water stage of a defrost, which the refrigerant circuit status reports as defrost) |
| Heat output | – | signal `local_only:signals:SRC.CUHP.HP1.CompressorPower` (kW; the compressor's heat output despite its name; only with newer software of the unit) |
| Power | – | sum of `local_only:heatSources:compressor:powerElecActual` and `local_only:heatSources:eHeater:powerElecActual` |
| Auxiliary heater | – | `local_only:heatSources:eHeater:powerElecActual` (above 0 W) |
| Flow | `gateway:supply_temperature` when there is no TC1 | TC1: `local_only:heatSources:additionalHeater:flowTemp`; otherwise its signal `local_only:signals:SRC.IntFlowTemp` (disabled by default) |
| Return | `gateway:return_temperature` (TC0; with a parallel buffer the circuit's return only while PC1 moves at least as much water as PC0) | the same (paired reading) |
| Circuit flow | `heatingCircuits:hcN:actualSupplyTemperature`, if available | first circuit with TC1 and no own sensor: `gateway:supply_temperature` |
| Flow rate (primary, PC0) | – | `local_only:heatSources:hs1:pumpVolumeFlow`; otherwise the signal `local_only:signals:SRC.SystemPumpVolumeFlow` (disabled by default) |
| Circuit flow rate (PC1) | – | first circuit: signal `local_only:signals:SRC.HC1.FlowCtrl.PumpVolumeFlow` |
| Circuit pump (PC1) | – | `local_only:heatingCircuits:hcN:pumpStatus` |
| Circuit setpoint | – | first circuit: `local_only:heatSources:currentSupplySetpoint`; otherwise the signal `local_only:signals:SC.HC1.FlowTempSetp` |
| Fan | – | `local_only:heatSources:hs1:oduFanSpeed` (PL3, %) |
| Air intake | – | `local_only:heatSources:sensors:evaporatorTemp_tl2` (TL2) |
| Outdoor temperature | `gateway:outdoor_temperature` | the same (paired reading) |
| DHW temperature and target | selected `dhwCircuits:dhwN:actualTemp` and `currentSetpoint`; retained DHW1 temperature identity | the same (paired readings) |
| Room temperature and target | selected `heatingCircuits:hcN:roomtemperature` and `currentRoomSetpoint`, if available | room temperature as a local-only reading |
| Heating pressure and modulation | `gateway:system_pressure` and `gateway:modulation`, with resource-path equivalents | the same; modulation falls back to the compressor speed |
| Refrigerant circuit (details drawer) | – | hot gas TR6 `…:refrigerant:hotGasTemp`, suction line TR5 `…:suctionGasTemp`, liquid line TR3 `…:liquidPipeHeatingTemp` (the liquid refrigerant after the water-side heat exchanger), low pressure JR0 `…:lowPressureTemp` as evaporating and high pressure JR1 `…:highPressureTemp` as condensing temperature; expansion valve VR1, signal `local_only:signals:SRC.CUHP.HP1.ExpansionValveActual` |
| Additional values (Details) | – | speed of PC0 `…:refrigerant:heatCarrierPumpSpeed`, PC0 relay `local_only:signals:SRC.CUHP.HP1.CHPumpRelay`, 4-way valve VR4 `local_only:signals:SRC.CUHP.HP1.FourwayValve` |
| Compressor starts and runtime | `heatSources:hs1:numberOfStarts:total` and `heatSources:hs1:workingTime:total` | the same (paired counters) |
| Electricity, heat and environmental energy | retained gateway identities and `heatSources:emon:totalConsumption` component identities | the same (paired counters) |
| Holiday indicator and fault chip | `holiday_active` and `system_fault` binary sensors | – |
| DHW heater (`dhw_heater`) | – | first DHW circuit: signal `local_only:signals:SRC.CUHP.HP1.DHWHeater` (on/off; disabled by default) |
| Circulation pump (`circulation`) | – | first DHW circuit: signal `local_only:signals:SRC.IntDHW.CircPumpStatus` (on/off; disabled by default) |
| SG Ready (`sg_ready`) | – | signal `local_only:signals:SRC.CUHP.SmartGridMode` (`blocked`, `normal`, `preferred` as boost, `forced`; `not_used` as normal) |
| Outdoor-unit drawing, buffer, primary pump | heat generator `heat_generator` (integration 0.9.1) | the same |

The three signals are generic diagnostic entities of the integration, disabled by default: enable the DHW heater only where the cylinder has an electric heater and the circulation pump only where one is installed, otherwise the card draws a part that is not there. Additional values (Details) that report nothing, `unknown` or `unavailable` (for example the pool starts of an installation without a pool), are left out; the preset looks again every minute and adds such a value once it reports.

The operation modes of the heating circuit (`off`, `manual`, `auto`) and of the DHW circuit (`off`, `low`, `high`, `ownprogram`, `eco`, `follow_heating_program`) stay additional values. They are settings, not states, and the card reads every circuit mode other than heating or cooling as a stopped circuit; they follow as `hc_mode` and `dhw_mode` once the card treats `auto` and `manual` as settings.

JR0 and JR1 are the saturation temperatures of the low and the high pressure. Their values fit evaporating and condensing on a real installation; I take that assignment from these readings, not from a manufacturer document.

Use `index: {hc: 2, dhw: 2}` to select a different circuit. Set `hc_count` to show further hydraulic circuits; their individual flow readings and circuit pumps are mapped when the integration supplies them. A new card written by the card editor sets `hc_count` itself to the number of circuits that report a flow temperature, circuit mode or pump of their own; an existing card keeps its `hc_count`. The supply temperature behind the buffer and the current supply setpoint belong to the heat source and go to the first circuit only. The room display and quick controls refer to the circuit selected by `index.hc`; a missing circuit never falls back to HC1. The count is never inferred from temperature settings.

The statistics catalog receives total electricity and heat for heating/DHW, total auxiliary electricity, environmental energy, compressor starts by operating mode and total runtime. A complete cooling electricity total is used when available. A compressor-only cooling counter stays in Details: the integration itself derives a total only from the compressor and the auxiliary heater counters together. Calendar-period tiles need the corresponding Home Assistant long-term statistics; cumulative values are never substituted for a daily reading.

Energy counters describe the gateway's complete heating or DHW operation. Selecting `index.hc` or `index.dhw` changes the circuit temperatures and controls; it does not apportion gateway energy totals to that circuit.

General start counts, total system runtime, separate compressor/auxiliary electricity, per-mode runtime, TC3 condenser-outlet water temperature and the speed of the primary pump remain additional values in Details. TC3 is distinct from the refrigerant condensing temperature.

## How the local readings are used

- Running: the compressor signal `on`, the compressor speed above 0 or a power above `power_threshold` (100 W by default) means the heat pump runs. A running compressor wins over a cloud compressor status that still reports `off`: the cloud updates less often than the local access.
- Defrost: the refrigerant circuit status `defrost` or `passive_defrost` shows the defrost, also with the cloud's compressor status.
- Without the cloud the refrigerant circuit status is the operating mode: `idle`, `startup` and `shutoff` are standby, `passive_defrost` is a defrost; `test_mode`, `pool` and `pool_heat` remain raw labels.
- Flow rate: below about 1000 l/h the primary flow rate reports `unknown` (attribute `measuring_range: below`). This is how the unit behaves at low output, not a fault of the integration or the card. The card then shows no flow rate and lets the primary pump follow the heating or hot-water loop instead of showing it as stopped; the estimated heat output is not available in that phase.
- Controller signals depend on the gateway's signal list. I have seen some signals of the heat pump disappear from that list for hours and come back; their entities are then `unavailable`. The compressor, VW1 and VR4 were not among them. The preset therefore takes resource paths first wherever one exists, and the power keeps the running state when the compressor signal is unavailable. Without the heat output the live COP is not available, and without VW1 the hot-water side follows the operating mode.
- The integration documents the heat output signal as the compressor's heat output, which matches the heat meter. The signal exists only with newer software of the unit; the installation I tested provides it. Without it `heat` stays empty and the card estimates the heat output from the primary flow rate and the spread between flow and return, as long as PC0 reports a flow rate.
- Live COP is the heat output divided by the summed electric power. It is an instantaneous value and can differ from a COP calculated from the energy counters, for example because the counters may include further consumers of the unit and treat defrost periods differently.
- The power is the sum of the compressor and the auxiliary heater. Without the compressor's own power the preset maps no power, so the auxiliary heater alone is never taken for the heat pump.

## Controls

By default, the preset offers only three controls, when they are available and enabled: the selected heating circuit's operating mode, the selected DHW circuit's operating mode and one-time DHW charge. The duplicate climate/water-heater mode selectors are omitted. No temperature sliders, flow limits, silent mode, auxiliary-heater, season or away controls appear automatically. The local access is read-only and adds no controls.

The editor can change the selection. To add temperatures or other settings, explicitly select their existing entities or provide a `controls` list. Controls use the available `select`, `number` and `switch` entities, with options, bounds and steps supplied by those entities. A configured list replaces the entire preset list, so include any default controls you want to keep. Custom labels and order are preserved; `controls: []` hides all quick controls. Likewise, `details` replaces the preset's additional values and `details: []` hides them. Rendering or updating the card does not call control services.

## Upstream changes

I list the integration files that define resource identities, local-only readings, the heat generator and its model table, state values, control availability, units and labels in `upstream/bosch_buderus_heating.json`. The upstream watcher reports changes to those files for review. The recorded source version is Home Comfort 0.9.1; it does not claim an installation test of this preset.

## Deliberate gaps

- The integration reports no return temperature per heating circuit. The card's return is the heat pump's return TC0. With a parallel buffer TC0 is the circuit's return only while the circuit pump PC1 moves at least as much water as the primary pump PC0; otherwise flow water passes through the tee into the return and TC0 reads higher than the circuit's return. A circuit return needs your own sensor in `hc_return`.
- The fan speed is a percentage. The card reads a number as revolutions per minute, so the fan turns while the value is above 0 but its speed barely changes with the value.
- The primary pump PC0 has no input of its own in the card; it follows the primary flow rate. Its relay and speed are shown in Details.
- The 4-way valve VR4 has no input of its own either. The defrost comes from the refrigerant circuit status, not from VR4, because VR4 also switches over while cooling. VR4 is shown in Details.
- The circuit flow rate is a signal of circuit 1; further circuits get none.
- Without the local access: a cumulative kWh counter is not an instantaneous W measurement, so live COP, heat output and a PV/battery/grid split need your own power and flow sensors.
- An operating-mode setting does not prove a running circuit pump. The preset does not map those settings as pump signals or as circuit and DHW modes.
- `pool` and `pool_heat` remain raw status labels. They do not animate space heating on a schematic without a pool circuit.
- `alarm` stops compressor animation. The separate `system_fault` entity supplies the fault chip.
- A buffer cylinder of an indoor unit other than TP70, and the primary pump of indoor units other than WLW176i and WLW186i, have no automatic mapping. The model table of the integration may grow; until a rule here covers a unit, set `buffer` and `primary_pump` by hand.
- Gateway metadata, personal identifiers, event timestamps and holiday dates are not automatically added to the hydraulic display. The heat generator only selects the drawing and the hydraulic defaults; its product names are not shown.

## Suggested installation checks

After installing a build containing the preset, compare the resolved mappings with an existing manual card. Check heating, DHW, standby, defrost and any available cooling mode; with the local access also a phase in which the primary flow rate reports `unknown`, the live power and the auxiliary heater. Verify the timeline and fault/holiday indicators. Check renamed entities and device selection if several gateways are present. A control test should be a deliberate, reversible change to the intended circuit, followed by verification in Home Assistant and the manufacturer's app. Report which checks were actually performed.
