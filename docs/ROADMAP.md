# Development plan

This plan keeps correctness and supportability ahead of new surface area. Impact is the expected benefit across installations; effort is relative (`S` local, `M` several code paths, `L` public API or data logic, `XL` architecture or a second layout).

## Current status after 0.10.0

Version 0.10.0 is released and its HACS, quality, Chromium and Firefox checks pass. There are no known open bug issues. Issues [#22](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/22), [#29](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/29), [#30](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/30) and [#37](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/37) shipped in that release and are closed under the 0.10.0 milestone.

The immediate work is evidence gathering rather than another broad feature release:

1. Recruit real-installation testers through [#1](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/1) for Viessmann, Vaillant, EMS-ESP and HeishaMon. Treat findings as bug fixes before feature work.
2. Leave Samsung [PR #16](https://github.com/Sturmi77/heatpump-hydraulic-card/pull/16) with its contributor until the requested cooling-mode and demo changes arrive and all required checks pass.
3. Use diagnostic reports and verified integration data to unblock the ebusd preset ([#24](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/24)) and pump/runtime mappings ([#31](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/31), [#34](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/34)).

## Active implementation sprint

Environmental energy ([#26](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/26), impact medium-high, effort M) is implemented for the next release: an optional total counter feeds details and calendar-period tiles, and provides an explicit total-COP fallback through environmental energy plus electricity when delivered heat is unavailable. No preset mappings are guessed; they follow only after integration data is verified. Compressor cut-out counters ([#35](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/35), effort S-M) remain a possible later addition where entity meanings and units can be verified. Multiple entities per key ([#23](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/23), impact high, effort L-XL) should remain a separate later sprint because it changes entity resolution, calculations and the editor contract.

## 0.10.0 – hydraulic clarity and small visual additions

The compact follow-up sprint is released in 0.10.0:

| Order | Issue | Scope | State |
| --- | --- | --- | --- |
| 1 | [#22](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/22) | Brine and heating pressure with unit conversion, thresholds, tiles, details and accessible status. | Released in 0.10.0 and closed; automated tests added. |
| 2 | [#29](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/29) | Optional middle sensors for three-point DHW and buffer gradients. | Released in 0.10.0 and closed; two-sensor behaviour retained. |
| 3 | [#30](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/30) | Restrained defrost vapour for all air-source unit styles. | Released in 0.10.0 and closed with animation and reduced-motion controls. |
| 4 | [#37](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/37) | Theme-aware column-radiator emitter. | Released in 0.10.0 and closed as the sprint stretch item. |

The HACS, quality, Chromium and Firefox checks passed before release, including 480 browser self-tests. Real-installation testing remains a follow-up as soon as suitable testers respond. [PR #16](https://github.com/Sturmi77/heatpump-hydraulic-card/pull/16) remains contributor-owned and untouched.

## 0.9.6 – support and presentation

This minor adds the support and presentation features that make broader real-installation testing practical:

| Order | Issue | Scope | State |
| --- | --- | --- | --- |
| 1 | [#7](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/7) | Local diagnostic report for preset/entity/state feedback. | Included in 0.9.6; browser self-test passed. |
| 2 | [#9](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/9) | Accessible full-screen overlay without a second card instance. | Included in 0.9.6; browser self-test passed. |
| 3 | [#11](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/11) | Stable custom text/language map with English fallback. | Included in 0.9.6; self-test and reference documentation complete. |
| 4 | [#13](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/13) | Fixed night and high-contrast card themes. | Included in 0.9.6; self-test and visual review passed. |

JavaScript syntax, browser self-test and visual checks across the three card themes passed before release. Real-installation tests follow when suitable Viessmann, Vaillant, EMS-ESP and HeishaMon testers are available. The diagnostic report is the preferred, privacy-reviewed input for that outreach and for preset issues.

[PR #16](https://github.com/Sturmi77/heatpump-hydraulic-card/pull/16) remains with its contributor and is not modified or absorbed here. It can be reassessed after the requested contributor changes arrive.

## 0.9.5 – stabilization and quick wins

Ship the first feedback fixes after 0.9.3 together with the small, self-contained improvements below. The planned 0.9.4 work is included in 0.9.5; there is no separate 0.9.4 release.

| Order | Issue | Scope | Impact | Effort |
| --- | --- | --- | --- | --- |
| 1 | [#18](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/18) | Close the hydraulic path of a direct system and fall back from circuit temperatures to heat-pump flow/return. | High | S–M |
| 2 | [#17](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/17) | Give object-form quick controls to the editor as entity ids and preserve their name/icon metadata. | Medium–high | S–M |
| 3 | [#19](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/19) | Explain missing Energy-dashboard power sensors, document signs and assign one missing source the unexplained remainder. | High | M |
| 4 | [#21](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/21) | Support text error sensors through a configurable list of no-error states while preserving numeric/binary behaviour. | High | M |
| 5 | [#20](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/20) | Explain that total counters need the same start time and that environmental energy is not delivered heat. | Medium–high | S |

Release gate:

- JavaScript syntax check, HACS validation and browser self-test pass.
- Every fix above has a regression test and English/German editor or README guidance where applicable.
- [PR #16](https://github.com/Sturmi77/heatpump-hydraulic-card/pull/16) stays outside this release. It must be rebased after the repository/file rename, resolve the requested cooling-mode change and report green checks before merge.
- No counter-offset option in 0.9.5: silently offsetting unrelated totals could hide a wrong measurement window. Home Assistant helpers remain the explicit remedy.

## Quick wins in 0.9.5

1. Close [#8](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/8) and [#10](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/10), shipped in 0.9.3.
2. Add the utility-lock badge example from [#28](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/28).
3. Show the already computed source spread on the source loop ([#25](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/25)).
4. Add animation mode and speed controls ([#6](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/6)).
5. Split the independent requests in [#14](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/14) into [#29](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/29), [#30](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/30), [#33](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/33), [#36](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/36) and [#37](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/37), and [#28](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/28) into [#31](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/31), [#32](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/32), [#34](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/34) and [#35](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/35).

Pump counters remain follow-up work in [#31](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/31): the open presets do not currently provide verified, unambiguous entity semantics and units for heating-circuit or source-pump hours/starts. No guessed mappings are shipped. The tester and preset meta issues will be updated after the separate Samsung contribution is ready to merge.

## Feature priority

| Rank | Issue | Impact | Effort | Reason / dependency |
| ---: | --- | --- | --- | --- |
| 1 | [#24 ebusd preset](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/24) | High | M | Blocked on a real entity/state sample; the 0.9.6 diagnostic report provides the preferred input. |
| 2 | [#23 Multiple entities per key](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/23) | High | L–XL | Broad value but changes resolution, editor and calculation contracts. |
| 3 | [#26 Environmental energy](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/26) | Medium–high | M | Useful after the counter semantics from #20 are explicit. |
| 4 | [#27 Seasonal brine minimum](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/27) | Medium | M–L | Valuable for ground sources; needs recorder, season and date logic. |
| 5 | [#4 Phone layouts](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/4) | High | XL | Use feedback from the 0.9.6 full-screen view before maintaining a second schematic geometry. |

## Deferred or demand-driven

- [#3 History replay](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/3): benefit is unproven and implementation is XL.
- Remaining brand drawings in [#5](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/5): one brand per issue when original references are available.
- [#33 More heating circuits](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/33) and [#36 wood-stove topology](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/36): separate large layout/integration work.
- [#32 DHW standby-loss analysis](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/32) and [#34 circulation time windows](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/34): require robust time-window semantics and real entity samples.
- [#15 Video promotion](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/15): operational work after a stable patch release and HACS default listing.
