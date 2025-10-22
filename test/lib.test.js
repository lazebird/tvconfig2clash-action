const { baseDomain, isValidUrl, extractHostname, collectDomains, toYaml } = require('../src/lib');

describe('isValidUrl', () => {
  test('should return true for valid URLs', () => {
    expect(isValidUrl('https://www.example.com')).toBe(true);
    expect(isValidUrl('http://sub.domain.co.uk/path')).toBe(true);
  });

  test('should return false for invalid URLs', () => {
    expect(isValidUrl('invalid-url')).toBe(false);
    expect(isValidUrl(null)).toBe(false);
    expect(isValidUrl(undefined)).toBe(false);
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl('192.168.1.1')).toBe(false); // Not a full URL
  });
});

describe('extractHostname', () => {
  test('should extract and lowercase hostname from a valid URL', () => {
    expect(extractHostname('https://www.example.com/path')).toBe('www.example.com');
    expect(extractHostname('http://SUB.DOMAIN.co.uk')).toBe('sub.domain.co.uk');
  });

  test('should return null for invalid URLs or IPv4 addresses', () => {
    expect(extractHostname('invalid-url')).toBeNull();
    expect(extractHostname(null)).toBeNull();
    expect(extractHostname('http://192.168.1.1/path')).toBeNull();
    expect(extractHostname('192.168.1.1')).toBeNull();
  });
});

describe('baseDomain', () => {
  test('should return the base domain for a given host', () => {
    expect(baseDomain('www.example.com')).toBe('example.com');
    expect(baseDomain('sub.example.co.uk')).toBe('example.co.uk');
    expect(baseDomain('example.com')).toBe('example.com');
    expect(baseDomain('localhost')).toBe('localhost');
    expect(baseDomain('192.168.1.1')).toBe('192.168.1.1');
    expect(baseDomain('github.io')).toBe('github.io');
    expect(baseDomain('sub.github.io')).toBe('sub.github.io');
  });

  test('should return null for invalid input', () => {
    expect(baseDomain(null)).toBeNull();
    expect(baseDomain(undefined)).toBeNull();
    expect(baseDomain('')).toBeNull();
    expect(baseDomain(123)).toBeNull();
  });
});

describe('collectDomains', () => {
  test('should collect and process domains from tvconfig', () => {
    const tvconfig = {
      api_site: {
        siteKey1: { api: 'https://api.example.com/xxx', detail: 'https://www.example.com/yyy' },
        siteKey2: { api: 'http://collect.foo.bar/api', detail: 'http://foo.bar' },
        siteKey3: { api: 'http://m3u8.test.co.uk', detail: 'http://cj.test.co.uk' },
        siteKey4: { api: 'http://192.168.1.1/api', detail: 'invalid-url' },
        siteKey5: { api: 'https://caiji.another.com', detail: 'https://another.com' },
        siteKey6: { api: 'https://localhost:8080', detail: 'https://localhost' },
      },
    };
    const expectedDomains = [
      'another.com',
      'api.example.com',
      'caiji.another.com',
      'cj.test.co.uk',
      'collect.foo.bar',
      'example.com',
      'foo.bar',
      'localhost',
      'm3u8.test.co.uk',
      'test.co.uk',
      'www.example.com',
    ].sort(); // Sort to match the collectDomains output

    const result = collectDomains(tvconfig);
    expect(result.sort()).toEqual(expectedDomains);
  });

  test('should handle empty or invalid tvconfig', () => {
    expect(collectDomains(null)).toEqual([]);
    expect(collectDomains({})).toEqual([]);
    expect(collectDomains({ api_site: null })).toEqual([]);
    expect(collectDomains({ api_site: { siteKey1: { api: 'invalid' } } })).toEqual([]);
  });
});

describe('toYaml', () => {
  test('should generate correct YAML output', () => {
    const domains = [
      'example.com',
      'sub.example.com',
      'foo.bar',
      'localhost',
      '192.168.1.1',
      'test.co.uk',
      'github.io',
    ];
    const expectedYaml = `behavior: domain
payload:
  - 192.168.1.1
  - +.example.com
  - +.foo.bar
  - +.github.io
  - +.localhost
  - sub.example.com
  - test.co.uk
`;
    expect(toYaml(domains)).toBe(expectedYaml);
  });

  test('should handle empty domains array', () => {
    expect(toYaml([])).toBe(`behavior: domain
payload:
`);
  });
});
