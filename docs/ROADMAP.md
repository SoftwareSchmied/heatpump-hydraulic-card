# Development plan

**State on 18 November 2026.** A household should be able to add the card, recognize its own installation, and see where heat is going. When something looks unusual, the same view should help the operator understand what happened. Presets do the routine setup; the operator supplies facts about the installation that Home Assistant cannot establish. [Issue assignments](ISSUE-PLAN.md) · [Changelog](../CHANGELOG.md) · [Releases](https://github.com/Sturmi77/heatpump-hydraulic-card/releases)

Correctness and supportability come ahead of new surface area. Effort is relative: `S` local, `M` several code paths, `L` public API or data logic, `XL` architecture or a second layout.

## Current status

[0.19.0](https://github.com/Sturmi77/heatpump-hydraulic-card/releases/tag/v0.19.0) is the current release (14 November 2026), after four pre-releases from 6 November. It adds the run details under the timeline with the values, electricity, heat and COP of a run ([#300](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/300)), cascades with `units` and `power_threshold` per unit ([#173](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/173)), `run_signal` for installations with hourly status signals ([#365](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/365)), averages and sums of entity lists ([#23](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/23)), the circuit spread tiles ([#290](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/290)), `flow_rate_unit` ([#289](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/289)), `narrow_focus` for phones ([#4](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/4)), the local access of the Bosch/Buderus Home Comfort integration ([#408](https://github.com/Sturmi77/heatpump-hydraulic-card/pull/408)) and Polish.

[0.20.0-beta.2](https://github.com/Sturmi77/heatpump-hydraulic-card/releases/tag/v0.20.0-beta.2) is the pre-release of 0.20.0 (milestone 3), with the first fixes from the beta.1 reports: the editor asks where the integration cannot tell how the installation is built ([#299](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/299): buffer, the shared ViCare pump, the first heating circuit), the presets for NIBE F series, Samsung EHS Sentinel and Aira, defrosts and starts counted from the history, default tiles per preset and the first part of the layout step ([#395](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/395)). The rest of stage 3 of the drawing tests (type sizes, priorities on narrow cards) and the second unit's own target ([#173](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/173)) moved to 0.21.0.

What each release contained is in the [changelog](../CHANGELOG.md). The 0.16 line was not published on its own: it is part of 0.17.0, and the `release/0.16` branch keeps its last state.

## Milestones

| Order | Milestone | What the operator or maintainer can do at the end | State |
| --- | --- | --- | --- |
| – | 0.18.0 · Hydraulic correctness | Follow the active water path on the reported reference installations. | released on 4 November |
| 1 | Field baseline on 0.18.x | Tell how often a fresh preset produces the correct schematic, how long it takes, and where people need help. | collecting reports |
| 2 | 0.19.0 · Understand a cycle | Select a heating or hot-water cycle and see its duration and the measurements that explain it. | released on 14 November |
| 3 | 0.20.0 · Confirm the installation | Resolve an ambiguous layout in the editor by answering a short question and seeing the result. | pre-release beta.2 on 19 November |

Understanding a cycle comes before confirming the installation (order changed on 4 November). The editor questions are chosen from the field baseline, which needs about ten reports; cycle details need recorder traces from two installations instead, which were available. Reports are collected with the [field-test form](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/new?template=field_test.yml) while the cycle work goes on. Editor and preset detection stay unchanged during the trial, so the cohort measures the same setup. Each milestone has a lead issue: [#298](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/298) (field measurement), [#300](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/300) (cycle details) and [#299](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/299) (installation confirmation).

| Gap | Consequence today | Decision the milestone enables |
| --- | --- | --- |
| 1 · Field reports rarely record setup effort or failed starts consistently. | A well-mapped preset may still require considerable manual setup. It is hard to choose the most useful editor improvement. | Compare untouched presets, editor-assisted setups and YAML-assisted setups. Choose prompts from frequent observed errors. |
| 2 · The timeline describes activity and the tiles summarize periods. Their boundaries can differ. | A user can see several starts and a daily energy total but cannot tell how much is attributable to one DHW run. | Offer each cycle metric only when its source covers the same equipment and interval. A reliable duration alone is useful. |
| 3 · A preset identifies integration entities more reliably than physical pipework. | A user who knows their system still has to translate that knowledge into settings such as circuit count and start index. | Keep a prompt only when it resolves a demonstrated ambiguity and the repeat trial shows less manual work. |

## 1. Measure the first successful setup

**Target.** A maintainer can answer “Of the last ten supported installations we tried, how many got the right picture within five minutes without YAML?” Anyone reviewing the result can see which hydraulic arrangements were tried and what prevented success.

**Current gap.** The card detects its presets, checks entity mappings, offers a device-based assistant and can generate a local diagnostic report. Preset coverage measures roles a preset *could* fill. The tester thread contains valuable examples, but offers no common starting point, denominator or time-to-success measure. [Preset coverage method](COVERAGE.md) · [Call for testers](https://github.com/Sturmi77/heatpump-hydraulic-card/discussions/453) (issue #1 until 18 November)

**Trial protocol.**

- Collect the reports with the [field-test form](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/new?template=field_test.yml) (label `field-test`), linked from the call for testers and the upstream posts.
- Recruit ten distinct installations with a supported integration. Aim to include direct and buffered systems, at least one multi-circuit system and several integrations. Report the mix. Record unsupported-device assistant trials separately.
- Start the clock when the user adds a fresh card with the integration already working in HA. Stop when they have a usable schematic. Record elapsed minutes, preset, card version, manual field assignments, whether YAML or outside help was needed, and the first point of friction.
- Ask the operator to verify the components, active circuit and, where fitted, hot-water path during ordinary operation. Subsequent waiting for a natural cycle is outside setup time. Keep unverified cases pending, abandoned attempts in the denominator, and wrong paths visible even if setup was fast. Use voluntary reports and user-reviewed diagnostic extracts.
- Publish the counts, median setup time for completed attempts, number of manual mappings and the most frequent failure. Distinguish an untouched preset from a setup completed through the editor. **Proposed success target** is 8 of 10 correct within five minutes without YAML. This is a pilot target for the tested cohort.

**Exit check.** Publish the baseline, including failures and pending confirmations, before choosing the prompts for milestone 3. If recruitment or mode confirmation is incomplete, publish the counts collected and keep the milestone open. Missing the 8/10 target is a valid finding and informs the next milestone.

## 2. Explain an individual operating cycle

**Target.** A user asking “What happened overnight?” can tap a run in the timeline. A DHW run shows its duration and, when available, the tank temperature at the start and end. A heating run shows its duration and, when measured, the circuit spread. Electricity consumed during the run can appear when the data supports that interval. These details open on demand and keep the main schematic legible on a phone.

**Deliverable.** Use compressor transitions for run boundaries where available and retain mode changes within a run. Where only mode history exists, label the selection as a phase; where status signals update only hourly, `run_signal` takes the bounds from the unit power. Show partial history as partial, and omit energy, spread or COP when sensors, timestamps or meter scope do not support the calculation. Keep recorder queries bounded to the displayed period and reuse cached results.

**State.** Released in 0.19.0. The maintainer's Lambda is checked against its counters; the cascade in [#173](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/173) matched its recorder and counters on beta.3 within a few percent, and beta.4 removed the extra runs from a unit's standby power. The acceptance in [#300](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/300) was confirmed on beta.4 on 13 November.

**Exit check.** Compare displayed details with recorder traces from heating and DHW on at least two installations. Test a mode change within one run, missing history, a window cut through a run, and a counter reset. The user should be able to identify the selected activity, its duration and which values are available using touch or keyboard. A partial period must never appear as a complete cycle total.

## 3. Confirm an ambiguous installation

**Target.** A supported installation with an unambiguous layout opens directly. Where the evidence permits more than one schematic, the editor asks only what distinguishes the plausible layouts. For example, an owner can confirm a parallel buffer without temperature sensors, or select the first of several numbered heating circuits. The preview shows the changed pipework or circuit labels before the user saves.

**Current gap.** The editor has validated entity fields and overrides, a mapping assistant for unsupported devices, buffer options and a circuit start index. A user still has to translate “my circuits start at 2” into the right combination of settings. Missing temperature sensors alone cannot establish the existence or position of a buffer. [Current editor behavior](../README.md#quick-start) · [Open3E circuit example](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/269) · [Buffer without sensors](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/266)

**Deliverable.** Use the baseline to choose the top one or two repeatable ambiguities. Offer a small picture and plain-language choices in the existing editor, including “I don't know”. Preview and save through the existing configuration keys. An explicit user mapping takes precedence. Reopening or canceling a draft preserves the saved configuration. Users of unsupported devices can still review individual mapping suggestions.

**State.** In 0.20.0-beta.1 ([#447](https://github.com/Sturmi77/heatpump-hydraulic-card/pull/447)). The field baseline has no reports yet, so the questions were chosen from the issues so far, from the common case to the rarer one: a buffer without sensors ([#266](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/266)), the ViCare pump without a buffer ([#344](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/344)) and heating circuits from number 2 on ([#269](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/269), Open3E and myPyllant). The answer goes to the preview at once through the existing keys and is saved with the card; "I don't know" takes it back. A question about the role of a sensor was left out: no preset has such a case today. The measurement against the baseline is still open.

**Exit check.** Replay the baseline cases and repeat the trial with fresh users on comparable configurations. Record the same measures beside the baseline. Aim for at least 8/10 correct in five minutes without YAML, fewer manual assignments in ambiguous cases, and no extra prompt on the unambiguous reference cases. Verify on a phone as well as a desktop. A misleading path or an overwritten manual mapping fails the relevant case even if setup was quick.

## Alongside the milestones

- **Regressions** from the field come first, in any milestone.
- **Presets** progress when a tester and a reproducible mapping exist. Daikin/ESPAltherma ([#254](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/254)) was the first pilot and is confirmed for heating and hot water. NIBE F series ([#253](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/253)), Samsung via EHS Sentinel ([#403](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/403)) and Aira ([#417](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/417)) are in 0.20.0-beta.1, each from the entity list of one installation; EHS Sentinel is confirmed by its reporter, NIBE and Aira got their first fixes in beta.2 and wait for confirmation. Next by reach: an exhaust air drawing for NIBE, Daikin Onecta ([#254](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/254)) and Mitsubishi MELCloud ([#255](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/255)), once a diagnostic report exists. The local Bosch/Buderus access ([#402](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/402)) ships in 0.19.0 with [#408](https://github.com/Sturmi77/heatpump-hydraulic-card/pull/408), checked on one installation with cloud and local access. The weekly upstream watch reports renamed entities in the integrations.
- **Drawing tests** ([#395](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/395)): stages 1 and 2 are in 0.19. Stage 3 started in 0.20 with the layout step ([#450](https://github.com/Sturmi77/heatpump-hydraulic-card/pull/450)), which solved the two known label conflicts; type sizes and priorities on narrow cards follow in 0.21.
- **Analytics:** the seasonal brine minimum ([#27](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/27)) comes first, then the DHW energy balance ([#114](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/114)).
- **Display options** from the forum: electrical power in kW, a gas input into the boiler.

## Deferred or demand-driven

- [#23 Multiple entities per key](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/23): sums and room averages ship in 0.19; minimum, maximum, `env_power` and a multi-entity picker remain demand-driven.
- [#4 Phone layouts](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/4): `narrow_focus` ships in 0.19; a second portrait geometry is XL and waits for observed phone use.
- [#5 Brand drawings](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/5): one brand per change when original references are available; every preset has its own drawing.
- [#31 Pump counters](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/31), [#35 cut-out counters](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/35), [#195 Home Comfort pumps](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/195) and [#260 second fan speed](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/260): mapped only from verified integration or installation data.
- New consumers and parts – [#248 pool](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/248), [#36 wood stove](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/36), [#250 ventilation](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/250), [#267 domestic-water side](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/267): after the three milestones, with a field diagram and sensors.
- [#3 History replay](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/3): benefit is unproven and implementation is XL.
- [#15 Video promotion](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/15): operational work after a stable release and HACS default listing.

## Storage topology

Combined and layered storage ([#50](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/50)), the wood stove ([#36](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/36)) and a second heat generator ([#51](https://github.com/Sturmi77/heatpump-hydraulic-card/issues/51)) share one plan: [TOPOLOGY.md](TOPOLOGY.md). The snapshot and combination test, the flow model, combined storage and `dhw_type` shipped with 0.14.0, the boiler in series with 0.17.0. An internal component model for the drawing is decided only before the rarer variants (wood stove, boiler in parallel), when further hydraulic requests justify it.
