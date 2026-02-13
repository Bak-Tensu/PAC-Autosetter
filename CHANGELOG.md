# Changelog

## [2.1.1] - 2026-02-14
### Added
- Domains counter.
- Checks whether a valid config exists before trying to initialize extension.

### Changed
- Minor UX Cosmetic enhancements
- Chore : Reorganize code a bit for easier readability.

### Notes
- Extension essentially stable as of now. Further changes should be tweaks.

## [2.0.1] - 2026-01-25
### Added
- Minor UI cosmetic enhancements

### Notes
- Maybe reorganize code a bit for easier readability later.

## [2.0.0] - 2026-01-23
### Added
- Core extension functionality: Second Mode (Mode 2) : Direct Proxy by Host:Port.
- New fields & buttons in Options for this mode.

### Changed
- Reorganized some code to target Mode 1 or Mode 2 use.

### Notes
- Cosmetic improvements needed, but use OK.


## [1.0.0] - 2025-08-23
### Added
- Core extension functionality: fetch list, select name, generate PAC file, inject into Firefox config as data stream.
- Options page with fields for name, List URL, domain list, and auto/manual mode.
- Field for a custom URL List.
- Export configuration to JSON file.
- Import configuration from JSON file.

### Notes
- First stable release. Main intended use ok.


## [0.8] - 2025-08-06
### Added
- Options page : Choose server to select (by Name) ; Choose domains to include in the URI
- Toggle Automatic or Manual mode
- Basic configuration persistence with `browser.storage.local`.

## [0.7] - 2025-08-05
- First working draft.
- All automated and hardcoded.
- No options page.
