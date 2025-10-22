[English](README.md) | [中文](README_zh.md)

[![Test tvconfig2clash-action](https://github.com/lazebird/tvconfig2clash-action/actions/workflows/test.yml/badge.svg)](https://github.com/lazebird/tvconfig2clash-action/actions/workflows/test.yml)

# tvconfig2clash-action

A tool that extracts all domains from a tvconfig JSON and generates a YAML file conforming to the Clash/OpenClash rule provider format.

## Features

- Extracts domains from `api` and `detail` fields within a tvconfig JSON.
- Normalizes domains by lowercasing, trimming whitespace, and filtering IPv4 addresses.
- Derives base domains (e.g., `api.example.com` → `example.com`).
- Strips common prefixes (`api.`, `collect.`, `m3u8.`, `cj.`, `caiji.`).
- Generates a Clash/OpenClash rule provider with `behavior: domain`.
- Automatically adds a `+.` prefix to short domains to cover subdomains.
- Ensures deterministic output by sorting domains alphabetically.

## Usage

### GitHub Actions

Use this Action from the Marketplace to generate a rule provider in your workflow:

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
        uses: lazebird/tvconfig2clash-action@main
        with:
          config_path: path/to/tvconfig.json
          output_path: path/to/output/site.yaml

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: clash-rule-provider
          path: path/to/output/site.yaml
```

### Standalone Script

1.  **Prerequisites**: Node.js (LTS recommended).
2.  **Clone the repository**: `git clone https://github.com/lazebird/tvconfig2clash-action.git`
3.  **Run the script**:
    ```bash
    node src/main.js [input_json_path] -o [output_yaml_path]
    ```
    - If paths are omitted, it defaults to `test/config.json` for input and `output/site.yml` for output.

## Input/Output Example

**Input (e.g., `tvconfig.json`)**:
```json
{
  "api_site": {
    "siteKey1": { "api": "https://api.example.com/xxx", "detail": "https://www.example.com/yyy" },
    "siteKey2": { "api": "http://collect.foo.bar/api", "detail": "http://foo.bar" }
  }
}
```

**Output (e.g., `site.yml`)**:
```yaml
behavior: domain
payload:
  - +.example.com
  - foo.bar
  - api.example.com
```

## Implementation Details

### Data Flow
```mermaid
flowchart TD
    A[Start] --> B[Parse CLI arguments]
    B --> C{Input path?}
    C -- Provided --> D[Read specified JSON]
    C -- Omitted --> E[Use default path]
    D & E --> F[Collect & Normalize Domains]
    F --> G[Generate YAML]
    G --> H[Write to Output File]
    H --> I[End]
```

### Key Rules
- **URL Parsing**: Uses the native Node.js `URL` class. Invalid URLs are ignored.
- **Domain Canonicalization**:
  - A base domain is derived by keeping the last two labels (e.g., `sub.example.com` → `example.com`). This is a heuristic and may not be perfect for multi-part TLDs like `.co.uk`.
  - Common prefixes (`api.`, `collect.`, `m3u8.`, `cj.`, `caiji.`) are stripped, and the resulting domain is also added.
- **Filtering**: Pure IPv4 addresses are excluded.
- **Output Stability**: Domains are sorted alphabetically to prevent diff noise.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## License

This project is open-source and licensed under the terms of the [LICENSE](LICENSE) file.
