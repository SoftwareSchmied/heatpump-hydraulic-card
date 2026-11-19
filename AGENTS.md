# AGENTS.md

Guidance for coding agents (Codex, Claude Code, Copilot and others) and the people driving them. [CONTRIBUTING.md](CONTRIBUTING.md) is the full contract; this file is the short version plus what a review should look for.

## Project

- A Home Assistant Lovelace card. The whole card is one hand-written ES module, `dist/heatpump-hydraulic-card.js`. There is no bundler, no build step and no runtime dependency: edit that file directly.
- `demo/setups.js` holds the demo setups, `demo/index.html` the live demo.
- `test/selftest.html` is the main regression suite; `test/topology.html` guards the drawing (snapshot in `test/topology-snapshot.js`) and the flow logic.
- `docs/presets/<preset>.md` documents each preset, `upstream/<preset>.json` lists the upstream files it depends on, `changelog.d/` takes changelog fragments.

## Commands

```bash
npm ci && npm run browsers:install   # Node 22 or newer
npm run check                        # full gate: syntax, i18n, coverage, upstream, release check, Chromium + Firefox
npm run syntax                       # fast static checks only
npm run test:chromium                # one browser
npm run topology:update              # only when the drawing changes on purpose, in the same pull request
npm run dev                          # demo at http://127.0.0.1:4173/demo/
```

Run `npm run check` before opening a pull request. CI requires `HACS validation`, `Quality`, `Browser / chromium` and `Browser / firefox`.

## Rules for every pull request

- Do not edit `README.md`, `CHANGELOG.md`, `docs/COVERAGE.md` or the preset list in `.github/ISSUE_TEMPLATE/bug_report.yml`. A user-visible change adds one fragment `changelog.d/<number or topic>.md`.
- Never guess entity ids or state texts. Preset mappings come from the integration's source or from diagnostic data of a real installation; document the evidence in `docs/presets/<preset>.md` and in the pull request. A field that cannot be mapped goes into `unmapped` of `upstream/<preset>.json` with a reason.
- A bug fix comes with a regression test. Tests are deterministic and independent of Home Assistant, the internet and real installations; add them as one block with its own heading in `test/selftest.html` and refer to demo setups by name.
- Flow and operating-state decisions belong in `_flowModel()`; `_update()` only draws.
- New UI texts go through the language blocks (see [docs/TRANSLATING.md](docs/TRANSLATING.md)); missing languages fall back to English. `npm run i18n:check` lists gaps.
- If `test/topology-snapshot.js` conflicts after merging `main`, do not resolve it by hand: take either side and run `npm run topology:update`.
- Changes to `.github/workflows/`, `package.json` or `package-lock.json` need the maintainer's explicit agreement first.
- English only, no emojis – in code, docs, commits and pull requests.
- A pull request opened by a contributor stays theirs. Follow-up work builds on it instead of replacing it.

## What a review should check

- Does the change affect presets other than the one it targets? Preset lookups share helpers.
- Units and states: W/kW, Wh/kWh, °C/°F, and `unknown`/`unavailable` must not turn into zeros or crashes.
- Is there a test that would have failed before the fix?
- Did the drawing change without a matching topology baseline update, or the baseline change without a reason in the pull request?
- Does a new or moved label whose text depends on the language, a name or a value have a width budget (`data-fit`) up to the next pipe or part? Do not loosen the collision checks to make a test pass. `KNOWN` in `test/topology.html` only takes conflicts that a new check finds in the drawing as it already was, each narrowed to the cases it hits and naming the issue that will fix it; a change never adds an entry for a conflict it causes itself.
- Does a label that competes with a neighbour for room get alternatives (`data-avoid`, `data-alt`, see "Layout step" in docs/TOPOLOGY.md) rather than a coordinate moved by hand?
- Does a layout fix come with the field case of its report (`scripts/report-fixture.mjs`, `test/field-cases.js`)? Does a new option that puts a label into a circuit row or the heat source extend that zone matrix in `test/topology.html`?
- For a baseline change, look at the pictures in the `drawing-changes` artifact, not only at the fingerprints.
- Are entity ids backed by evidence, or guessed?
