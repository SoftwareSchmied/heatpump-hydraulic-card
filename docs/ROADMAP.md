# Development plan

This plan keeps correctness and supportability ahead of new surface area. Impact is the expected benefit across installations; effort is relative (`S` local, `M` several code paths, `L` public API or data logic, `XL` architecture or a second layout).

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
| 1 | [#7 Diagnostic report](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/7) | High | M | Multiplies the value of support, preset testing and future preset work. |
| 2 | [#9 Full-screen schematic](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/9) | High | M | Improves phones without committing to a second schematic geometry. |
| 3 | [#22 Circuit and brine pressure](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/22) | Medium–high | M–L | Strong diagnostic value; requires thresholds, accessibility and layout coverage. |
| 4 | [#24 ebusd preset](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/24) | High | M | Blocked on a real entity/state sample; #7 should land first. |
| 5 | [#23 Multiple entities per key](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/23) | High | L–XL | Broad value but changes resolution, editor and calculation contracts. |
| 6 | [#26 Environmental energy](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/26) | Medium–high | M | Useful after the counter semantics from #20 are explicit. |
| 7 | [#11 Custom texts/languages](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/11) | Medium–high | L | Text keys become a stable public interface. |
| 8 | [#27 Seasonal brine minimum](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/27) | Medium | M–L | Valuable for ground sources; needs recorder, season and date logic. |
| 9 | [#13 Night/high-contrast themes](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/13) | Medium | M | Start with fixed themes; defer time/entity switching. |
| 10 | [#4 Phone layouts](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/4) | High | XL | Validate full-screen first; a portrait schematic doubles layout maintenance. |

## Deferred or demand-driven

- [#3 History replay](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/3): benefit is unproven and implementation is XL.
- Remaining brand drawings in [#5](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/5): one brand per issue when original references are available.
- [#33 More heating circuits](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/33) and [#36 wood-stove topology](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/36): separate large layout/integration work.
- [#32 DHW standby-loss analysis](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/32) and [#34 circulation time windows](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/34): require robust time-window semantics and real entity samples.
- [#15 Video promotion](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/15): operational work after a stable patch release and HACS default listing.
