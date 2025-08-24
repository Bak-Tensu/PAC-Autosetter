# Changelog



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
