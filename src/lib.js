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
    return new URL(u).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function baseDomain(host) {
  if (!host || typeof host !== "string") return null;
  const parts = host.split(".");
  if (parts.length <= 2) return host;
  return parts.slice(-2).join(".");
}

function collectDomains(config) {
  const set = new Set();
  const sites = config && typeof config.api_site === "object" && config.api_site ? config.api_site : {};
  const entries = Object.values(sites);

  for (const item of entries) {
    if (!item || typeof item !== "object") continue;

    if (isValidUrl(item.api)) {
      const h = extractHostname(item.api);
      if (h) {
        set.add(h);
        const base = baseDomain(h);
        if (base) set.add(base);
        for (const prefix of ["api.", "collect.", "m3u8.", "cj.", "caiji."]) {
          if (h.startsWith(prefix)) {
            const stripped = h.replace(prefix, "");
            if (stripped && stripped !== h) set.add(stripped);
          }
        }
      }
    }

    if (isValidUrl(item.detail)) {
      const h2 = extractHostname(item.detail);
      if (h2) {
        set.add(h2);
        const base2 = baseDomain(h2);
        if (base2) set.add(base2);
        for (const prefix of ["api.", "collect.", "m3u8.", "cj.", "caiji."]) {
          if (h2.startsWith(prefix)) {
            const stripped2 = h2.replace(prefix, "");
            if (stripped2 && stripped2 !== h2) set.add(stripped2);
          }
        }
      }
    }
  }

  const domains = Array.from(set).filter((d) => !/^\d+\.\d+\.\d+\.\d+$/.test(d));
  domains.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
  return domains;
}

function toYaml(domains) {
  const lines = [];
  lines.push("behavior: domain");
  lines.push("payload:");
  for (const d of domains) {
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
  collectDomains,
  toYaml,
  generate,
};
