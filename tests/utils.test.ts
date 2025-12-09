import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  maskSecret,
  generateEnvExample,
  testOnly,
  devOnly,
  groupByPrefix,
  flattenEnv,
  isProduction,
  isDevelopment,
  isTest,
} from '../src/utils.js';
import { str, num, bool, email } from '../src/validators.js';

describe('maskSecret', () => {
  it('should mask long secrets', () => {
    expect(maskSecret('supersecretpassword123')).toBe('supe**********d123');
  });

  it('should fully mask short secrets', () => {
    expect(maskSecret('short')).toBe('*****');
  });

  it('should handle undefined', () => {
    expect(maskSecret(undefined)).toBe('[undefined]');
  });

  it('should handle null', () => {
    expect(maskSecret(null)).toBe('[undefined]');
  });

  it('should respect visibleChars parameter', () => {
    expect(maskSecret('supersecretpassword123', 2)).toBe('su**********23');
  });
});

describe('generateEnvExample', () => {
  it('should generate basic .env.example content', () => {
    const spec = {
      PORT: num({ default: 3000, desc: 'Server port' }),
      HOST: str({ desc: 'Server host', example: 'localhost' }),
      DEBUG: bool({ default: false }),
    };

    const result = generateEnvExample(spec);

    expect(result).toContain('PORT=3000');
    expect(result).toContain('HOST=localhost');
    expect(result).toContain('DEBUG=false');
    expect(result).toContain('# Server port');
    expect(result).toContain('# Server host');
  });

  it('should mark required variables', () => {
    const spec = {
      REQUIRED_VAR: str(),
      OPTIONAL_VAR: str({ default: 'default' }),
    };

    const result = generateEnvExample(spec);

    expect(result).toContain('REQUIRED_VAR= # Required');
    expect(result).not.toContain('OPTIONAL_VAR= # Required');
  });

  it('should include deprecated warnings', () => {
    const spec = {
      OLD_VAR: str({ deprecated: 'Use NEW_VAR instead', default: '' }),
    };

    const result = generateEnvExample(spec);

    expect(result).toContain('# DEPRECATED: Use NEW_VAR instead');
  });

  it('should group by prefix when option is set', () => {
    const spec = {
      DB_HOST: str({ default: 'localhost' }),
      DB_PORT: num({ default: 5432 }),
      CACHE_HOST: str({ default: 'localhost' }),
    };

    const result = generateEnvExample(spec, { groupByPrefix: true });

    expect(result).toContain('# DB Configuration');
    expect(result).toContain('# CACHE Configuration');
  });

  it('should include docs when option is set', () => {
    const spec = {
      API_KEY: str({ docs: 'https://example.com/docs', default: '' }),
    };

    const result = generateEnvExample(spec, { includeDocs: true });

    expect(result).toContain('# Docs: https://example.com/docs');
  });
});

describe('testOnly', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should return value in test environment', () => {
    process.env.NODE_ENV = 'test';
    expect(testOnly('test-value')).toBe('test-value');
  });

  it('should return undefined in non-test environment', () => {
    process.env.NODE_ENV = 'development';
    expect(testOnly('test-value')).toBeUndefined();
  });
});

describe('devOnly', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should return value in development environment', () => {
    process.env.NODE_ENV = 'development';
    expect(devOnly('dev-value')).toBe('dev-value');
  });

  it('should return value in test environment', () => {
    process.env.NODE_ENV = 'test';
    expect(devOnly('dev-value')).toBe('dev-value');
  });

  it('should return undefined in production environment', () => {
    process.env.NODE_ENV = 'production';
    expect(devOnly('dev-value')).toBeUndefined();
  });
});

describe('groupByPrefix', () => {
  it('should group environment variables by prefix', () => {
    const env = {
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_NAME: 'mydb',
      CACHE_HOST: 'redis',
    };

    const dbConfig = groupByPrefix(env, 'DB');

    expect(dbConfig).toEqual({
      host: 'localhost',
      port: 5432,
      name: 'mydb',
    });
  });

  it('should keep prefix when removePrefix is false', () => {
    const env = {
      DB_HOST: 'localhost',
      DB_PORT: 5432,
    };

    const dbConfig = groupByPrefix(env, 'DB', { removePrefix: false });

    expect(dbConfig).toEqual({
      db_host: 'localhost',
      db_port: 5432,
    });
  });

  it('should keep original case when lowercase is false', () => {
    const env = {
      DB_HOST: 'localhost',
      DB_PORT: 5432,
    };

    const dbConfig = groupByPrefix(env, 'DB', { lowercase: false });

    expect(dbConfig).toEqual({
      HOST: 'localhost',
      PORT: 5432,
    });
  });
});

describe('flattenEnv', () => {
  it('should flatten nested objects', () => {
    const nested = {
      db: {
        host: 'localhost',
        port: 5432,
      },
      cache: {
        host: 'redis',
      },
    };

    const flat = flattenEnv(nested);

    expect(flat).toEqual({
      db_host: 'localhost',
      db_port: '5432',
      cache_host: 'redis',
    });
  });

  it('should use custom separator', () => {
    const nested = {
      db: {
        host: 'localhost',
      },
    };

    const flat = flattenEnv(nested, '', '__');

    expect(flat).toEqual({
      db__host: 'localhost',
    });
  });

  it('should use prefix', () => {
    const nested = {
      host: 'localhost',
      port: 5432,
    };

    const flat = flattenEnv(nested, 'DB');

    expect(flat).toEqual({
      DB_host: 'localhost',
      DB_port: '5432',
    });
  });
});

describe('environment helpers', () => {
  it('isProduction should return true for production', () => {
    expect(isProduction({ NODE_ENV: 'production' })).toBe(true);
    expect(isProduction({ NODE_ENV: 'development' })).toBe(false);
  });

  it('isDevelopment should return true for development', () => {
    expect(isDevelopment({ NODE_ENV: 'development' })).toBe(true);
    expect(isDevelopment({ NODE_ENV: 'production' })).toBe(false);
  });

  it('isTest should return true for test', () => {
    expect(isTest({ NODE_ENV: 'test' })).toBe(true);
    expect(isTest({ NODE_ENV: 'development' })).toBe(false);
  });

  it('should default to development when NODE_ENV is not set', () => {
    expect(isDevelopment({})).toBe(true);
    expect(isProduction({})).toBe(false);
    expect(isTest({})).toBe(false);
  });
});
