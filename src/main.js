#!/usr/bin/env node
"use strict";

const path = require("path");
const { generate } = require("./lib.js");

function parseArgs(argv) {
  let configPathArg = null;
  let outPathArg = null;
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "-h" || t === "--help") {
      return { help: true };
    }
    if (t === "-o" && i + 1 < argv.length) {
      outPathArg = argv[i + 1];
      i++;
    } else if (!t.startsWith("-") && !configPathArg) {
      configPathArg = t;
    }
  }
  return { configPathArg, outPathArg };
}

function main() {
  const argv = process.argv.slice(2);
  const parsed = parseArgs(argv);
  if (parsed.help) {
    console.log("Usage: node src/main.js <input_json> -o <output_yaml>");
    console.log("Example: node src/main.js config.json -o dist/site.yaml");
    process.exit(0);
  }

  const defaultConfigPath = path.resolve(__dirname, "config.json");
  const defaultOutPath = path.resolve(__dirname, "../dist/site.yaml");

  const envConfig = process.env.CONFIG_PATH || process.env.INPUT_CONFIG_PATH; // Compatible with GitHub Action environment
  const envOutput = process.env.OUTPUT_PATH || process.env.INPUT_OUTPUT_PATH;

  const configPath = parsed.configPathArg
    ? path.resolve(process.cwd(), parsed.configPathArg)
    : envConfig
    ? path.resolve(process.cwd(), envConfig)
    : defaultConfigPath;

  const outPath = parsed.outPathArg
    ? path.resolve(process.cwd(), parsed.outPathArg)
    : envOutput
    ? path.resolve(process.cwd(), envOutput)
    : defaultOutPath;

  try {
    const res = generate(configPath, outPath);
    console.log(`[OK] Generated: ${res.outPath}`);
    console.log(`[INFO] Domain count: ${res.count}`);
  } catch (err) {
    console.error(`[ERROR] Generation failed: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
