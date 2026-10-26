# Contributing

Heat Pump Hydraulic Card deliberately keeps its toolchain small. The browser-based self-test is the main regression suite; Playwright only starts the local server and runs that same suite in Chromium and Firefox.

## Setup

Use Node.js 22 or newer, then install the locked dependencies and browsers:

```bash
npm ci
npm run browsers:install
```

Start the live demo at <http://127.0.0.1:4173/demo/>:

```bash
npm run dev
```

## Checks

Run the complete local gate before opening a pull request:

```bash
npm run check
```

For a faster loop, use `npm run test:chromium`, `npm run test:firefox`, or the interactive `npm run test:ui`. A failed browser test keeps a trace, screenshot, video and text log in `test-results/`; open the HTML summary with `npx playwright show-report`.

New setups and scenarios belong in `demo/setups.js`; assertions belong in `test/selftest.html`. Keep tests deterministic and independent of Home Assistant, the internet and real installations.

## Release contract

`npm run release:check` verifies that `package.json`, `HFC_VERSION`, the HACS distribution filename and the changelog agree. On a tag build, the tag must be `v<version>`.

The recommended required checks for the default branch are `HACS validation`, `Quality`, `Browser / chromium` and `Browser / firefox`.

## Issue and release lifecycle

- Bugs take priority over enhancements. Reproduce them first and add a regression test with the fix.
- Do not guess preset entity mappings. Add them only from integration source evidence or reviewed diagnostic data from a real installation.
- A merged change that has not shipped stays open with the `ready for release` label. The merge comment should link the pull request and summarize its checks.
- When the containing version is published, assign its version milestone, remove `ready for release`, add a release comment and close the issue.
- Contributor-owned pull requests stay with their contributor unless they explicitly hand over the work. Follow-up work should not silently absorb or replace them.
- Umbrella issues remain open while only one sub-part is delivered; record the shipped part in a comment and keep the remaining scope explicit.

## Tracking upstream integrations

Presets depend on other projects' entity ids and state texts. `upstream/<preset>.json` lists the repositories and files a preset is built on, and the workflow `Upstream watch` opens one issue per preset when those files change (see `upstream/README.md`). A pull request for a new preset adds its own `upstream/<preset>.json`. After reviewing an upstream change, run `npm run upstream:ack -- <preset>` and close the issue.
