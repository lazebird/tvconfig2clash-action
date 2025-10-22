[English](README.md) | [中文](README_zh.md)

# tvconfig2clash-action

A tool that extracts all domains from a tvconfig JSON and generates a YAML file conforming to Clash/OpenClash rule provider format (behavior: domain). Core logic is in src/main.js, runnable as a standalone script or via GitHub Actions (action.yml provided).

## GitHub Actions Usage
Use this Action from the Marketplace without accessing source files directly:
```yaml
name: Generate Clash Rule Provider
on:
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Generate rule provider
        uses: lazebird/tvconfig2clash-action@v1
        with:
          config_path: path/to/tvconfig.json
          output_path: path/to/output/site.yaml

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: clash-rule-provider
          path: path/to/output/site.yaml
```

## Features
- Read a tvconfig JSON (example field: `api_site`).
- Parse URLs from the `api` and `detail` fields of each site and extract hostnames.
- Normalization:
  - Lowercase and trim whitespaces.
  - Filter pure IPv4 addresses.
  - Derive base domain (e.g., `api.example.com` → `example.com`).
  - Strip common prefixes (`api.`, `collect.`, `m3u8.`, `cj.`, `caiji.`).
- Generate a Clash/OpenClash rule provider with behavior `domain`; output payload is sorted deterministically, and short domains automatically get a `+.` prefix to cover subdomains.

## Input/Output
- Input: tvconfig JSON file, key structure example:
  ```json
  {
    "api_site": {
      "siteKey1": { "api": "https://api.example.com/xxx", "detail": "https://www.example.com/yyy" },
      "siteKey2": { "api": "http://collect.foo.bar/api", "detail": "http://foo.bar" }
    }
  }
  ```
- Output: Clash/OpenClash rule provider YAML, e.g.:
  ```yaml
  behavior: domain
  payload:
    - +.example.com
    - api.example.com
    - foo.bar
  ```

## Requirements
- Node.js (LTS recommended)
- OS: Linux/macOS/Windows (script has no platform-specific dependencies)

## Installation & Usage
### Run as standalone script
1. Clone or download this project.
2. In project root, run:
   ```bash
   node src/main.js <input_json_path> -o <output_yaml_path>
   ```

### CLI arguments
- `-h, --help`: show help.
- `<input_json_path>`: path to tvconfig JSON (optional).
- `-o <output_yaml_path>`: output YAML path (optional).

When arguments are omitted:
- Default input: `config.json` relative to src directory.
- Default output: `dist/site.yaml`.

### Examples
```bash
# Specify input and output
node src/main.js ./test/config.json -o ./dist/site.yaml

# Use defaults (ensure default input exists)
node src/main.js
```

## Use in GitHub Actions
Use the published Action from the Marketplace:
```yaml
name: Generate Clash Rule Provider
on:
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Generate rule provider
        uses: lazebird/tvconfig2clash-action@v1
        with:
          config_path: path/to/tvconfig.json
          output_path: path/to/output/site.yaml

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: clash-rule-provider
          path: path/to/output/site.yaml
```
## Implementation Rules
- URL parsing uses Node.js native `URL` class; only valid URLs are accepted.
- Hostname extraction and normalization: lowercase, remove whitespaces.
- Domain canonicalization:
  - Base domain heuristic: keep the last two labels (e.g., `sub.example.com` → `example.com`).
  - Common prefix stripping: when encountering `api.`, `collect.`, `m3u8.`, `cj.`, `caiji.`, the stripped host is also added.
- Filtering: exclude pure IPv4 addresses (e.g., `1.2.3.4`).
- Stable output: sort lexicographically to avoid diffs flapping.
- YAML safety: normalize and add `+.` for short domains to match subdomains.

## Edge Cases & Notes
- Base domain rule is heuristic (not PSL-aware), so multi-part TLDs (e.g., `*.co.uk`) may not be fully accurate.
- Only parses `api` and `detail` fields under `api_site` objects; other fields are ignored.
- Input must be valid URL strings; non-URL or empty strings are ignored.
- Output may overwrite existing files; be cautious with the `-o` path.

## Project Structure
```
.
├── src/
│   ├── lib.js        # core library (domain extraction + YAML generation)
│   └── main.js       # CLI entry; reads input and writes output
├── LICENSE           # license
├── action.yml        # GitHub Action definition (composite)
├── .gitignore        # git ignore rules
└── docs/
    └── STRUCTURE.md  # English document (structure and rules)
```

## License
This project uses the open-source license included in the repository's LICENSE file.