import { ValidatorSpec, GenerateExampleOptions, Validator } from './types.js';
import * as fs from 'fs';
import * as path from 'path';

export function maskSecret(value: unknown, visibleChars: number = 4): string {
  if (value === undefined || value === null) {
    return '[undefined]';
  }
  
  const str = String(value);
  
  if (str.length <= visibleChars * 2) {
    return '*'.repeat(str.length);
  }
  
  const start = str.substring(0, visibleChars);
  const end = str.substring(str.length - visibleChars);
  const masked = '*'.repeat(Math.min(str.length - visibleChars * 2, 10));
  
  return `${start}${masked}${end}`;
}

export function generateEnvExample<T extends ValidatorSpec>(
  spec: T,
  options: GenerateExampleOptions = {}
): string {
  const {
    includeDescriptions = true,
    includeExamples = true,
    includeDocs = false,
    groupByPrefix = false,
  } = options;
  
  const lines: string[] = [];
  const keys = Object.keys(spec);
  
  if (groupByPrefix) {
    const groups = new Map<string, string[]>();
    
    for (const key of keys) {
      const prefix = key.split('_')[0] ?? '';
      const existing = groups.get(prefix) ?? [];
      existing.push(key);
      groups.set(prefix, existing);
    }
    
    for (const [prefix, groupKeys] of groups) {
      if (prefix !== '') {
        lines.push(`# ${prefix} Configuration`);
      }
      
      for (const key of groupKeys) {
        lines.push(...generateKeyLines(key, spec[key]!, includeDescriptions, includeExamples, includeDocs));
      }
      
      lines.push('');
    }
  } else {
    for (const key of keys) {
      lines.push(...generateKeyLines(key, spec[key]!, includeDescriptions, includeExamples, includeDocs));
    }
  }
  
  return lines.join('\n');
}

function generateKeyLines(
  key: string,
  validator: Validator<unknown>,
  includeDescriptions: boolean,
  includeExamples: boolean,
  includeDocs: boolean
): string[] {
  const lines: string[] = [];
  const opts = validator._options;
  
  if (includeDescriptions && opts.desc !== undefined) {
    lines.push(`# ${opts.desc}`);
  }
  
  if (includeDocs && opts.docs !== undefined) {
    lines.push(`# Docs: ${opts.docs}`);
  }
  
  if (opts.deprecated !== undefined) {
    lines.push(`# DEPRECATED: ${opts.deprecated}`);
  }
  
  let value = '';
  
  if (includeExamples && opts.example !== undefined) {
    value = opts.example;
  } else if (opts.default !== undefined) {
    value = String(opts.default);
  }
  
  const required = opts.default === undefined && opts.devDefault === undefined;
  const requiredMarker = required ? ' # Required' : '';
  
  lines.push(`${key}=${value}${requiredMarker}`);
  
  return lines;
}

export function writeEnvExample<T extends ValidatorSpec>(
  spec: T,
  options: GenerateExampleOptions = {}
): void {
  const outputPath = options.outputPath ?? '.env.example';
  const content = generateEnvExample(spec, options);
  
  const dir = path.dirname(outputPath);
  if (dir !== '.' && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, content, 'utf-8');
}

export function testOnly<T>(value: T): T | undefined {
  const nodeEnv = typeof process !== 'undefined' ? process.env['NODE_ENV'] : undefined;
  return nodeEnv === 'test' ? value : undefined;
}

export function devOnly<T>(value: T): T | undefined {
  const nodeEnv = typeof process !== 'undefined' ? process.env['NODE_ENV'] : undefined;
  return nodeEnv !== 'production' ? value : undefined;
}

export function getNodeEnv(env: Record<string, string | undefined>): string {
  return env['NODE_ENV'] ?? 'development';
}

export function isProduction(env: Record<string, string | undefined>): boolean {
  return getNodeEnv(env) === 'production';
}

export function isDevelopment(env: Record<string, string | undefined>): boolean {
  return getNodeEnv(env) === 'development';
}

export function isTest(env: Record<string, string | undefined>): boolean {
  return getNodeEnv(env) === 'test';
}

export function groupByPrefix<T extends Record<string, unknown>>(
  env: T,
  prefix: string,
  options: { removePrefix?: boolean; lowercase?: boolean } = {}
): Record<string, unknown> {
  const { removePrefix = true, lowercase = true } = options;
  const result: Record<string, unknown> = {};
  const prefixWithUnderscore = prefix.endsWith('_') ? prefix : `${prefix}_`;
  
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith(prefixWithUnderscore)) {
      let newKey = removePrefix ? key.substring(prefixWithUnderscore.length) : key;
      if (lowercase) {
        newKey = newKey.toLowerCase();
      }
      result[newKey] = value;
    }
  }
  
  return result;
}

export function flattenEnv(
  env: Record<string, unknown>,
  prefix: string = '',
  separator: string = '_'
): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(env)) {
    const fullKey = prefix !== '' ? `${prefix}${separator}${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenEnv(value as Record<string, unknown>, fullKey, separator));
    } else {
      result[fullKey] = String(value);
    }
  }
  
  return result;
}
