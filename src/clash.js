'use strict';

const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { readJsonFile } = require('./utils.js');
const psl = require('psl');

function validateUrl(u) {
  if (typeof u !== 'string' || !u.trim()) return false;
  try {
    const parsed = new URL(u);
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function getHostnameFromUrl(u) {
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

function getBaseDomain(host) {
  if (!host || typeof host !== 'string') return null;

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

function addDomainToSet(host, domains) {
  if (!host) return;

  domains.add(host);

  const base = getBaseDomain(host);
  if (base && base !== host) {
    domains.add(base);
  }

  const prefixes = ['api.', 'collect.', 'm3u8.', 'cj.', 'caiji.'];
  for (const prefix of prefixes) {
    if (host.startsWith(prefix)) {
      const stripped = host.replace(prefix, '');
      if (stripped && stripped !== host) {
        domains.add(stripped);
        const strippedBase = getBaseDomain(stripped);
        if (strippedBase && strippedBase !== stripped && strippedBase !== base) {
          domains.add(strippedBase);
        }
      }
    }
  }
}

function extractDomainsFromConfig(config) {
  const set = new Set();
  const sites = config && typeof config.api_site === 'object' && config.api_site ? config.api_site : {};
  const entries = Object.values(sites);

  for (const item of entries) {
    if (!item || typeof item !== 'object') continue;

    if (validateUrl(item.api)) {
      const h = getHostnameFromUrl(item.api);
      addDomainToSet(h, set);
    }

    if (validateUrl(item.detail)) {
      const h2 = getHostnameFromUrl(item.detail);
      addDomainToSet(h2, set);
    }
  }

  const domains = Array.from(set);
  domains.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));
  return domains;
}

function convertDomainsToYaml(domains) {
  const lines = [];
  lines.push('behavior: domain');
  lines.push('payload:');
  for (const d of domains) {
    const safe = String(d).replace(/\s+/g, '').toLowerCase();
    if (!safe) continue;
    const labels = safe.split('.').filter(Boolean).length;
    const out = labels <= 2 && !safe.startsWith('+.') ? `+.${safe}` : safe;
    lines.push(`  - ${out}`);
  }
  return lines.join('\n') + '\n';
}

function generate(configPath, outPath) {
  const config = readJsonFile(configPath);
  const domains = extractDomainsFromConfig(config);
  if (!domains.length) {
    throw new Error('No domains collected; generation aborted.');
  }
  const yaml = convertDomainsToYaml(domains);
  const dir = path.dirname(outPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outPath, yaml, { encoding: 'utf8' });
  return { count: domains.length, outPath };
}

module.exports = {
  generate,
};