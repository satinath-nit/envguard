import { describe, it, expect } from 'vitest';
import {
  str,
  num,
  bool,
  email,
  url,
  host,
  port,
  json,
  array,
  uuid,
  regex,
  enumValidator,
  duration,
  bytes,
  makeValidator,
} from '../src/validators.js';
import { EnvMissingError, EnvValidationError } from '../src/types.js';

describe('str validator', () => {
  it('should parse string values', () => {
    const validator = str();
    expect(validator.parse('hello', 'TEST', {})).toBe('hello');
  });

  it('should throw on missing required value', () => {
    const validator = str();
    expect(() => validator.parse(undefined, 'TEST', {})).toThrow(EnvMissingError);
  });

  it('should use default value when missing', () => {
    const validator = str({ default: 'default' });
    expect(validator.parse(undefined, 'TEST', {})).toBe('default');
  });

  it('should use devDefault in non-production', () => {
    const validator = str({ devDefault: 'dev' });
    expect(validator.parse(undefined, 'TEST', { NODE_ENV: 'development' })).toBe('dev');
  });

  it('should not use devDefault in production', () => {
    const validator = str({ devDefault: 'dev' });
    expect(() => validator.parse(undefined, 'TEST', { NODE_ENV: 'production' })).toThrow(EnvMissingError);
  });

  it('should use testDefault in test environment', () => {
    const validator = str({ testDefault: 'test-value' });
    expect(validator.parse(undefined, 'TEST', { NODE_ENV: 'test' })).toBe('test-value');
  });

  it('should trim strings when option is set', () => {
    const validator = str({ trim: true });
    expect(validator.parse('  hello  ', 'TEST', {})).toBe('hello');
  });

  it('should convert to lowercase when option is set', () => {
    const validator = str({ toLowerCase: true });
    expect(validator.parse('HELLO', 'TEST', {})).toBe('hello');
  });

  it('should convert to uppercase when option is set', () => {
    const validator = str({ toUpperCase: true });
    expect(validator.parse('hello', 'TEST', {})).toBe('HELLO');
  });

  it('should validate minLength', () => {
    const validator = str({ minLength: 5 });
    expect(() => validator.parse('hi', 'TEST', {})).toThrow(EnvValidationError);
    expect(validator.parse('hello', 'TEST', {})).toBe('hello');
  });

  it('should validate maxLength', () => {
    const validator = str({ maxLength: 5 });
    expect(() => validator.parse('hello world', 'TEST', {})).toThrow(EnvValidationError);
    expect(validator.parse('hello', 'TEST', {})).toBe('hello');
  });

  it('should validate pattern', () => {
    const validator = str({ pattern: /^[a-z]+$/ });
    expect(() => validator.parse('Hello123', 'TEST', {})).toThrow(EnvValidationError);
    expect(validator.parse('hello', 'TEST', {})).toBe('hello');
  });

  it('should validate choices', () => {
    const validator = str({ choices: ['a', 'b', 'c'] });
    expect(() => validator.parse('d', 'TEST', {})).toThrow(EnvValidationError);
    expect(validator.parse('a', 'TEST', {})).toBe('a');
  });
});

describe('num validator', () => {
  it('should parse number values', () => {
    const validator = num();
    expect(validator.parse('42', 'TEST', {})).toBe(42);
    expect(validator.parse('3.14', 'TEST', {})).toBe(3.14);
    expect(validator.parse('-10', 'TEST', {})).toBe(-10);
  });

  it('should throw on invalid number', () => {
    const validator = num();
    expect(() => validator.parse('not-a-number', 'TEST', {})).toThrow(EnvValidationError);
  });

  it('should validate integer option', () => {
    const validator = num({ integer: true });
    expect(() => validator.parse('3.14', 'TEST', {})).toThrow(EnvValidationError);
    expect(validator.parse('42', 'TEST', {})).toBe(42);
  });

  it('should validate min', () => {
    const validator = num({ min: 10 });
    expect(() => validator.parse('5', 'TEST', {})).toThrow(EnvValidationError);
    expect(validator.parse('15', 'TEST', {})).toBe(15);
  });

  it('should validate max', () => {
    const validator = num({ max: 100 });
    expect(() => validator.parse('150', 'TEST', {})).toThrow(EnvValidationError);
    expect(validator.parse('50', 'TEST', {})).toBe(50);
  });

  it('should validate choices', () => {
    const validator = num({ choices: [1, 2, 3] });
    expect(() => validator.parse('4', 'TEST', {})).toThrow(EnvValidationError);
    expect(validator.parse('2', 'TEST', {})).toBe(2);
  });
});

describe('bool validator', () => {
  it('should parse true values', () => {
    const validator = bool();
    expect(validator.parse('true', 'TEST', {})).toBe(true);
    expect(validator.parse('1', 'TEST', {})).toBe(true);
    expect(validator.parse('yes', 'TEST', {})).toBe(true);
    expect(validator.parse('on', 'TEST', {})).toBe(true);
    expect(validator.parse('t', 'TEST', {})).toBe(true);
    expect(validator.parse('y', 'TEST', {})).toBe(true);
  });

  it('should parse false values', () => {
    const validator = bool();
    expect(validator.parse('false', 'TEST', {})).toBe(false);
    expect(validator.parse('0', 'TEST', {})).toBe(false);
    expect(validator.parse('no', 'TEST', {})).toBe(false);
    expect(validator.parse('off', 'TEST', {})).toBe(false);
    expect(validator.parse('f', 'TEST', {})).toBe(false);
    expect(validator.parse('n', 'TEST', {})).toBe(false);
  });

  it('should be case insensitive', () => {
    const validator = bool();
    expect(validator.parse('TRUE', 'TEST', {})).toBe(true);
    expect(validator.parse('FALSE', 'TEST', {})).toBe(false);
  });

  it('should throw on invalid boolean', () => {
    const validator = bool();
    expect(() => validator.parse('maybe', 'TEST', {})).toThrow(EnvValidationError);
  });
});

describe('email validator', () => {
  it('should parse valid emails', () => {
    const validator = email();
    expect(validator.parse('test@example.com', 'TEST', {})).toBe('test@example.com');
    expect(validator.parse('user.name@domain.co.uk', 'TEST', {})).toBe('user.name@domain.co.uk');
  });

  it('should throw on invalid email', () => {
    const validator = email();
    expect(() => validator.parse('not-an-email', 'TEST', {})).toThrow(EnvValidationError);
    expect(() => validator.parse('missing@domain', 'TEST', {})).toThrow(EnvValidationError);
  });
});

describe('url validator', () => {
  it('should parse valid URLs', () => {
    const validator = url();
    expect(validator.parse('https://example.com', 'TEST', {})).toBe('https://example.com');
    expect(validator.parse('http://localhost:3000/path', 'TEST', {})).toBe('http://localhost:3000/path');
  });

  it('should throw on invalid URL', () => {
    const validator = url();
    expect(() => validator.parse('not-a-url', 'TEST', {})).toThrow(EnvValidationError);
    expect(() => validator.parse('ftp://example.com', 'TEST', {})).toThrow(EnvValidationError);
  });
});

describe('host validator', () => {
  it('should parse valid hostnames', () => {
    const validator = host();
    expect(validator.parse('example.com', 'TEST', {})).toBe('example.com');
    expect(validator.parse('sub.domain.example.com', 'TEST', {})).toBe('sub.domain.example.com');
  });

  it('should parse valid IPv4 addresses', () => {
    const validator = host();
    expect(validator.parse('192.168.1.1', 'TEST', {})).toBe('192.168.1.1');
    expect(validator.parse('127.0.0.1', 'TEST', {})).toBe('127.0.0.1');
  });

  it('should parse valid IPv6 addresses', () => {
    const validator = host();
    expect(validator.parse('::1', 'TEST', {})).toBe('::1');
    expect(validator.parse('2001:db8::1', 'TEST', {})).toBe('2001:db8::1');
  });

  it('should throw on invalid host', () => {
    const validator = host();
    expect(() => validator.parse('invalid..host', 'TEST', {})).toThrow(EnvValidationError);
  });
});

describe('port validator', () => {
  it('should parse valid ports', () => {
    const validator = port();
    expect(validator.parse('80', 'TEST', {})).toBe(80);
    expect(validator.parse('443', 'TEST', {})).toBe(443);
    expect(validator.parse('3000', 'TEST', {})).toBe(3000);
  });

  it('should throw on invalid port', () => {
    const validator = port();
    expect(() => validator.parse('0', 'TEST', {})).toThrow(EnvValidationError);
    expect(() => validator.parse('70000', 'TEST', {})).toThrow(EnvValidationError);
    expect(() => validator.parse('not-a-port', 'TEST', {})).toThrow(EnvValidationError);
  });

  it('should respect custom min/max', () => {
    const validator = port({ min: 1024, max: 49151 });
    expect(() => validator.parse('80', 'TEST', {})).toThrow(EnvValidationError);
    expect(validator.parse('8080', 'TEST', {})).toBe(8080);
  });
});

describe('json validator', () => {
  it('should parse valid JSON', () => {
    const validator = json();
    expect(validator.parse('{"key": "value"}', 'TEST', {})).toEqual({ key: 'value' });
    expect(validator.parse('[1, 2, 3]', 'TEST', {})).toEqual([1, 2, 3]);
    expect(validator.parse('"string"', 'TEST', {})).toBe('string');
  });

  it('should throw on invalid JSON', () => {
    const validator = json();
    expect(() => validator.parse('not-json', 'TEST', {})).toThrow(EnvValidationError);
    expect(() => validator.parse('{invalid}', 'TEST', {})).toThrow(EnvValidationError);
  });

  it('should validate with schema', () => {
    const validator = json<{ name: string }>({
      schema: (v): v is { name: string } => 
        typeof v === 'object' && v !== null && 'name' in v && typeof (v as Record<string, unknown>).name === 'string',
    });
    expect(validator.parse('{"name": "test"}', 'TEST', {})).toEqual({ name: 'test' });
    expect(() => validator.parse('{"other": "value"}', 'TEST', {})).toThrow(EnvValidationError);
  });
});

describe('array validator', () => {
  it('should parse comma-separated values', () => {
    const validator = array();
    expect(validator.parse('a,b,c', 'TEST', {})).toEqual(['a', 'b', 'c']);
  });

  it('should trim whitespace', () => {
    const validator = array();
    expect(validator.parse('a, b, c', 'TEST', {})).toEqual(['a', 'b', 'c']);
  });

  it('should use custom separator', () => {
    const validator = array({ separator: '|' });
    expect(validator.parse('a|b|c', 'TEST', {})).toEqual(['a', 'b', 'c']);
  });

  it('should validate minItems', () => {
    const validator = array({ minItems: 3 });
    expect(() => validator.parse('a,b', 'TEST', {})).toThrow(EnvValidationError);
    expect(validator.parse('a,b,c', 'TEST', {})).toEqual(['a', 'b', 'c']);
  });

  it('should validate maxItems', () => {
    const validator = array({ maxItems: 2 });
    expect(() => validator.parse('a,b,c', 'TEST', {})).toThrow(EnvValidationError);
    expect(validator.parse('a,b', 'TEST', {})).toEqual(['a', 'b']);
  });

  it('should validate unique items', () => {
    const validator = array({ unique: true });
    expect(() => validator.parse('a,b,a', 'TEST', {})).toThrow(EnvValidationError);
    expect(validator.parse('a,b,c', 'TEST', {})).toEqual(['a', 'b', 'c']);
  });

  it('should use item validator', () => {
    const validator = array({ itemValidator: num() });
    expect(validator.parse('1,2,3', 'TEST', {})).toEqual([1, 2, 3]);
    expect(() => validator.parse('1,two,3', 'TEST', {})).toThrow(EnvValidationError);
  });
});

describe('uuid validator', () => {
  it('should parse valid UUIDs', () => {
    const validator = uuid();
    expect(validator.parse('550e8400-e29b-41d4-a716-446655440000', 'TEST', {})).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(validator.parse('550E8400-E29B-41D4-A716-446655440000', 'TEST', {})).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('should throw on invalid UUID', () => {
    const validator = uuid();
    expect(() => validator.parse('not-a-uuid', 'TEST', {})).toThrow(EnvValidationError);
    expect(() => validator.parse('550e8400-e29b-41d4-a716', 'TEST', {})).toThrow(EnvValidationError);
  });
});

describe('regex validator', () => {
  it('should validate against pattern', () => {
    const validator = regex({ pattern: /^[A-Z]{3}-\d{3}$/ });
    expect(validator.parse('ABC-123', 'TEST', {})).toBe('ABC-123');
    expect(() => validator.parse('abc-123', 'TEST', {})).toThrow(EnvValidationError);
  });
});

describe('enum validator', () => {
  it('should validate enum values', () => {
    const validator = enumValidator({ values: ['development', 'staging', 'production'] as const });
    expect(validator.parse('development', 'TEST', {})).toBe('development');
    expect(validator.parse('production', 'TEST', {})).toBe('production');
    expect(() => validator.parse('invalid', 'TEST', {})).toThrow(EnvValidationError);
  });
});

describe('duration validator', () => {
  it('should parse duration values', () => {
    const validator = duration();
    expect(validator.parse('100ms', 'TEST', {})).toBe(100);
    expect(validator.parse('5s', 'TEST', {})).toBe(5000);
    expect(validator.parse('2m', 'TEST', {})).toBe(120000);
    expect(validator.parse('1h', 'TEST', {})).toBe(3600000);
    expect(validator.parse('1d', 'TEST', {})).toBe(86400000);
  });

  it('should convert to specified unit', () => {
    const validator = duration({ unit: 's' });
    expect(validator.parse('5000ms', 'TEST', {})).toBe(5);
    expect(validator.parse('2m', 'TEST', {})).toBe(120);
  });

  it('should throw on invalid duration', () => {
    const validator = duration();
    expect(() => validator.parse('invalid', 'TEST', {})).toThrow(EnvValidationError);
  });
});

describe('bytes validator', () => {
  it('should parse byte values', () => {
    const validator = bytes();
    expect(validator.parse('100B', 'TEST', {})).toBe(100);
    expect(validator.parse('5KB', 'TEST', {})).toBe(5120);
    expect(validator.parse('2MB', 'TEST', {})).toBe(2097152);
    expect(validator.parse('1GB', 'TEST', {})).toBe(1073741824);
  });

  it('should convert to specified unit', () => {
    const validator = bytes({ unit: 'KB' });
    expect(validator.parse('2048B', 'TEST', {})).toBe(2);
    expect(validator.parse('1MB', 'TEST', {})).toBe(1024);
  });

  it('should throw on invalid bytes', () => {
    const validator = bytes();
    expect(() => validator.parse('invalid', 'TEST', {})).toThrow(EnvValidationError);
  });
});

describe('makeValidator', () => {
  it('should create custom validators', () => {
    const hexColor = makeValidator<string>((value, key) => {
      if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
        throw new EnvValidationError(key, 'must be a valid hex color', value);
      }
      return value.toLowerCase();
    });

    const validator = hexColor();
    expect(validator.parse('#FF0000', 'TEST', {})).toBe('#ff0000');
    expect(() => validator.parse('red', 'TEST', {})).toThrow(EnvValidationError);
  });

  it('should support default values', () => {
    const hexColor = makeValidator<string>((value) => value.toLowerCase());
    const validator = hexColor({ default: '#000000' });
    expect(validator.parse(undefined, 'TEST', {})).toBe('#000000');
  });

  it('should support choices', () => {
    const hexColor = makeValidator<string>((value) => value.toLowerCase());
    const validator = hexColor({ choices: ['#ff0000', '#00ff00', '#0000ff'] });
    expect(validator.parse('#ff0000', 'TEST', {})).toBe('#ff0000');
    expect(() => validator.parse('#ffffff', 'TEST', {})).toThrow(EnvValidationError);
  });
});
