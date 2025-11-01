#!/usr/bin/env node
'use strict';

const path = require('path');
const { generate } = require('./clash.js');
const { convertToOmnibox } = require('./omnibox.js');

function parseArgs(argv) {
  let configPathArg = null;
  let outPathArg = null;
  let formatArg = 'clash';
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '-h' || t === '--help') {
      return { help: true };
    }
    if (t === '-o' && i + 1 < argv.length) {
      outPathArg = argv[i + 1];
      i++;
    } else if (t === '-f' && i + 1 < argv.length) {
      formatArg = argv[i + 1];
      i++;
    } else if (!t.startsWith('-') && !configPathArg) {
      configPathArg = t;
    }
  }
  return { configPathArg, outPathArg, formatArg };
}

function main() {
  try {
    const argv = process.argv.slice(2);
    const parsed = parseArgs(argv);
    if (parsed.help) {
      console.log('Usage: node src/main.js <input_json> -o <output_path> [-f <format>]');
      console.log('Example (clash mode): node src/main.js config.json -o dist/site.yaml -f clash');
      console.log('Example (omnibox mode): node src/main.js config.json -o dist/omnibox.json -f omnibox');
      process.exit(0);
    }

    const defaultConfigPath = path.resolve(__dirname, 'config.json');
    const defaultOutPath = path.resolve(__dirname, '../dist/site.yaml');

    const envInput = process.env.CONFIG_PATH || process.env.INPUT_CONFIG_PATH; // Compatible with GitHub Action environment
    const envOutputPath = process.env.OUTPUT_PATH || process.env.INPUT_OUTPUT_PATH;

    const configPath = parsed.configPathArg
      ? path.resolve(process.cwd(), parsed.configPathArg)
      : envInput
      ? path.resolve(process.cwd(), envInput)
      : defaultConfigPath;

    const outPath = parsed.outPathArg
      ? path.resolve(process.cwd(), parsed.outPathArg)
      : envOutputPath
      ? path.resolve(process.cwd(), envOutputPath)
      : defaultOutPath;

    const format = parsed.formatArg || 'clash';

    if (format === 'omnibox') {
      convertToOmnibox(configPath, outPath);
      console.log(`[OK] Generated (omnibox mode): ${outPath}`);
    } else if (format === 'clash') {
      const res = generate(configPath, outPath);
      console.log(`[OK] Generated (clash mode): ${res.outPath}`);
      console.log(`[INFO] Domain count: ${res.count}`);
    } else {
      throw new Error(`Invalid format: ${format}. Supported formats: clash, omnibox`);
    }
  } catch (err) {
    console.error(`[ERROR] Generation failed: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}