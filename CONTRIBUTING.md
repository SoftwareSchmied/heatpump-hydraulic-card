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
