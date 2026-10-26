# Changelog fragments

Every change that users should read about gets its own fragment file here instead of a line in `CHANGELOG.md`. Separate files never conflict, so open pull requests do not block each other.

- File name: `<pull request number or short topic>.md`, for example `61.md` or `heishamon-room-temperature.md`.
- Content: one or more bullet lines in the style of `CHANGELOG.md` (`- Text …`), written in English, without emojis.
- `README.md` in this folder is ignored.

At release time the maintainer runs `npm run changelog:compile`. It adds all fragments to the top of the `## Unreleased` section of `CHANGELOG.md` and deletes them. Then the heading is renamed to the version and date.
