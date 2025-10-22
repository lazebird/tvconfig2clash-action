"use strict";

const fs = require("fs");
const path = require("path");
const { URL } = require("url");

function readJSON(filePath) {
  if (typeof filePath !== "string" || !filePath.trim()) {
    throw new Error("Invalid input path");
  }
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function isValidUrl(u) {
  if (typeof u !== "string" || !u.trim()) return false;
  try {
    const parsed = new URL(u);
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function extractHostname(u) {
  try {
    const host = new URL(u).hostname.toLowerCase();
    // Filter out pure IPv4 addresses
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
      return null;
    }
    return host;
  } catch {
    return null;
  }
}

const psl = require('psl');

function baseDomain(host) {
  if (!host || typeof host !== "string") return null;

  // Handle IP addresses
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return host;
  }

  // Handle localhost
  if (host === 'localhost') {
    return host;
  }

  const parsed = psl.parse(host);
  if (parsed.error) return null; // Handle parsing errors

  if (parsed.domain) {
    return parsed.domain;
  } else {
    return host;
  }
}

function addProcessedDomain(host, domains) {
  if (!host) return;

  domains.add(host);

  const base = baseDomain(host);
  if (base && base !== host) {
    domains.add(base);
  }

  const prefixes = ["api.", "collect.", "m3u8.", "cj.", "caiji."];
  for (const prefix of prefixes) {
    if (host.startsWith(prefix)) {
      const stripped = host.replace(prefix, "");
      if (stripped && stripped !== host) {
        domains.add(stripped);
        const strippedBase = baseDomain(stripped);
        if (strippedBase && strippedBase !== stripped && strippedBase !== base) {
          domains.add(strippedBase);
        }
      }
    }
  }
}

function collectDomains(config) {
  const set = new Set();
  const sites = config && typeof config.api_site === "object" && config.api_site ? config.api_site : {};
  const entries = Object.values(sites);

  for (const item of entries) {
    if (!item || typeof item !== "object") continue;

    if (isValidUrl(item.api)) {
      const h = extractHostname(item.api);
      addProcessedDomain(h, set);
    }

    if (isValidUrl(item.detail)) {
      const h2 = extractHostname(item.detail);
      addProcessedDomain(h2, set);
    }
  }

  const domains = Array.from(set);
  domains.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
  return domains;
}

function toYaml(domains) {
  const lines = [];
  lines.push("behavior: domain");
  lines.push("payload:");
  const sortedDomains = [...domains].sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
  for (const d of sortedDomains) {
    const safe = String(d).replace(/\s+/g, "").toLowerCase();
    if (!safe) continue;
    const labels = safe.split(".").filter(Boolean).length;
    const out = labels <= 2 && !safe.startsWith("+.") ? `+.${safe}` : safe;
    lines.push(`  - ${out}`);
  }
  return lines.join("\n") + "\n";
}

function generate(configPath, outPath) {
  const config = readJSON(configPath);
  const domains = collectDomains(config);
  if (!domains.length) {
    throw new Error("No domains collected; generation aborted.");
  }
  const yaml = toYaml(domains);
  const dir = path.dirname(outPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outPath, yaml, { encoding: "utf8" });
  return { count: domains.length, outPath };
}

module.exports = {
  readJSON,
  isValidUrl,
  extractHostname,
  collectDomains,
  toYaml,
  generate,
  baseDomain,
};
