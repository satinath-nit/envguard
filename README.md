# EnvGuard

Type-safe environment variable validation for Node.js, Bun, and other JavaScript runtimes.

[![npm version](https://badge.fury.io/js/envguard.svg)](https://www.npmjs.com/package/envguard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Type-safe**: Full TypeScript support with automatic type inference
- **Zero dependencies**: Lightweight with no external dependencies
- **Comprehensive validators**: Built-in validators for strings, numbers, booleans, emails, URLs, UUIDs, durations, byte sizes, and more
- **Custom validators**: Easy to create your own validators
- **Secret masking**: Automatically mask sensitive values in error messages
- **Flexible defaults**: Support for `default`, `devDefault`, and `testDefault` values
- **Conditional requirements**: Make variables required based on other values
- **Warning mode**: Non-blocking validation for optional variables
- **Extra variable detection**: Warn or error on unknown environment variables
- **Immutable output**: Validated environment is frozen and protected
- **.env.example generation**: Auto-generate example files from your schema
- **Colored error output**: Beautiful, readable error messages

## Installation

```bash
npm install envguard
```

## Quick Start

```typescript
import { cleanEnv, str, num, bool, email, url } from 'envguard';

const env = cleanEnv({
  PORT: num({ default: 3000 }),
  HOST: str({ default: 'localhost' }),
  DATABASE_URL: url(),
  API_KEY: str({ secret: true }),
  DEBUG: bool({ default: false }),
  ADMIN_EMAIL: email({ default: 'admin@example.com' }),
});

// Fully typed!
console.log(env.PORT);        // number
console.log(env.HOST);        // string
console.log(env.DATABASE_URL); // string
console.log(env.DEBUG);       // boolean

// Environment helpers
console.log(env.isProduction);  // boolean
console.log(env.isDevelopment); // boolean
console.log(env.isTest);        // boolean
```

## Validators

### Basic Validators

#### `str(options?)`

Validates string values.

```typescript
import { str } from 'envguard';

const env = cleanEnv({
  // Basic string
  NAME: str(),
  
  // With default
  HOST: str({ default: 'localhost' }),
  
  // With validation
  CODE: str({ 
    minLength: 3,
    maxLength: 10,
    pattern: /^[A-Z]+$/,
  }),
  
  // With transformation
  SLUG: str({ 
    trim: true,
    toLowerCase: true,
  }),
  
  // With choices
  NODE_ENV: str({ 
    choices: ['development', 'staging', 'production'],
  }),
});
```

#### `num(options?)`

Validates numeric values.

```typescript
import { num } from 'envguard';

const env = cleanEnv({
  PORT: num({ default: 3000 }),
  
  // With constraints
  MAX_CONNECTIONS: num({ 
    min: 1,
    max: 100,
    integer: true,
  }),
  
  // With choices
  RETRY_COUNT: num({ 
    choices: [1, 3, 5, 10],
  }),
});
```

#### `bool(options?)`

Validates boolean values. Accepts: `1`, `0`, `true`, `false`, `yes`, `no`, `on`, `off`, `t`, `f`, `y`, `n`.

```typescript
import { bool } from 'envguard';

const env = cleanEnv({
  DEBUG: bool({ default: false }),
  ENABLE_CACHE: bool({ default: true }),
});
```

### Network Validators

#### `email(options?)`

Validates email addresses.

```typescript
import { email } from 'envguard';

const env = cleanEnv({
  ADMIN_EMAIL: email(),
  SUPPORT_EMAIL: email({ default: 'support@example.com' }),
});
```

#### `url(options?)`

Validates URLs with http/https protocol.

```typescript
import { url } from 'envguard';

const env = cleanEnv({
  API_URL: url(),
  WEBHOOK_URL: url({ default: 'https://example.com/webhook' }),
});
```

#### `host(options?)`

Validates hostnames or IP addresses (IPv4 and IPv6).

```typescript
import { host } from 'envguard';

const env = cleanEnv({
  DB_HOST: host({ default: 'localhost' }),
  REDIS_HOST: host(),
});
```

#### `port(options?)`

Validates TCP port numbers (1-65535).

```typescript
import { port } from 'envguard';

const env = cleanEnv({
  PORT: port({ default: 3000 }),
  
  // Custom range
  ADMIN_PORT: port({ min: 1024, max: 49151 }),
});
```

### Data Validators

#### `json<T>(options?)`

Parses JSON values.

```typescript
import { json } from 'envguard';

const env = cleanEnv({
  CONFIG: json<{ key: string }>(),
  
  // With schema validation
  SETTINGS: json<Settings>({
    schema: (v): v is Settings => 
      typeof v === 'object' && v !== null && 'name' in v,
  }),
});
```

#### `array<T>(options?)`

Parses comma-separated values into arrays.

```typescript
import { array, num } from 'envguard';

const env = cleanEnv({
  // String array
  ALLOWED_HOSTS: array({ default: ['localhost'] }),
  
  // Custom separator
  TAGS: array({ separator: '|' }),
  
  // With item validation
  PORTS: array({ itemValidator: num() }),
  
  // With constraints
  IDS: array({ 
    minItems: 1,
    maxItems: 10,
    unique: true,
  }),
});
```

#### `uuid(options?)`

Validates UUID strings.

```typescript
import { uuid } from 'envguard';

const env = cleanEnv({
  SESSION_ID: uuid(),
  TENANT_ID: uuid({ default: '00000000-0000-0000-0000-000000000000' }),
});
```

### Special Validators

#### `enums(options)`

Validates against a list of allowed values with proper TypeScript inference.

```typescript
import { enums } from 'envguard';

const env = cleanEnv({
  LOG_LEVEL: enums({ 
    values: ['debug', 'info', 'warn', 'error'] as const,
    default: 'info',
  }),
});

// env.LOG_LEVEL is typed as 'debug' | 'info' | 'warn' | 'error'
```

#### `regex(options)`

Validates against a custom regular expression.

```typescript
import { regex } from 'envguard';

const env = cleanEnv({
  LICENSE_KEY: regex({ 
    pattern: /^[A-Z]{3}-\d{4}-[A-Z]{3}$/,
    desc: 'License key in format XXX-0000-XXX',
  }),
});
```

#### `duration(options?)`

Parses duration strings (e.g., `100ms`, `5s`, `2m`, `1h`, `7d`).

```typescript
import { duration } from 'envguard';

const env = cleanEnv({
  // Returns milliseconds by default
  TIMEOUT: duration({ default: 5000 }),
  
  // Convert to seconds
  CACHE_TTL: duration({ unit: 's' }),
});

// TIMEOUT=30s -> 30000 (ms)
// CACHE_TTL=5m -> 300 (s)
```

#### `bytes(options?)`

Parses byte size strings (e.g., `100B`, `5KB`, `2MB`, `1GB`).

```typescript
import { bytes } from 'envguard';

const env = cleanEnv({
  // Returns bytes by default
  MAX_FILE_SIZE: bytes({ default: 10485760 }), // 10MB
  
  // Convert to megabytes
  MEMORY_LIMIT: bytes({ unit: 'MB' }),
});

// MAX_FILE_SIZE=50MB -> 52428800 (bytes)
// MEMORY_LIMIT=2GB -> 2048 (MB)
```

## Advanced Features

### Default Values

EnvGuard supports multiple types of default values:

```typescript
const env = cleanEnv({
  // Always use this default
  PORT: num({ default: 3000 }),
  
  // Only in non-production environments
  DEBUG: bool({ devDefault: true }),
  
  // Only in test environment
  DB_URL: str({ testDefault: 'sqlite::memory:' }),
});
```

### Secret Masking

Mark sensitive variables to mask their values in error messages:

```typescript
const env = cleanEnv({
  API_KEY: str({ secret: true }),
  DATABASE_PASSWORD: str({ secret: true }),
});

// Error messages will show: "API_KEY: supe**********d123"
```

### Conditional Requirements

Make variables required based on other values:

```typescript
const env = cleanEnv({
  USE_REDIS: bool({ default: false }),
  REDIS_URL: str({
    requiredWhen: (env) => env.USE_REDIS === true,
    default: undefined,
  }),
});
```

### Warning Mode

Use `warnOnly` for non-critical variables that shouldn't block startup:

```typescript
const env = cleanEnv({
  ANALYTICS_KEY: str({ 
    warnOnly: true,
    desc: 'Optional analytics tracking key',
  }),
});
```

### Extra Variable Detection

Detect unknown environment variables:

```typescript
const env = cleanEnv(
  { PORT: num() },
  {
    // Warn about extra variables
    warnOnExtra: true,
    
    // Or throw an error
    strict: true,
    
    // Allow specific extra variables
    allowedExtra: ['CUSTOM_VAR'],
  }
);
```

### Custom Validators

Create your own validators:

```typescript
import { makeValidator, EnvValidationError } from 'envguard';

const hexColor = makeValidator<string>((value, key) => {
  if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
    throw new EnvValidationError(key, 'must be a valid hex color', value);
  }
  return value.toLowerCase();
});

const env = cleanEnv({
  PRIMARY_COLOR: hexColor({ default: '#000000' }),
  ACCENT_COLOR: hexColor(),
});
```

### Custom Middleware

Transform the validated environment:

```typescript
import { customCleanEnv, str, num } from 'envguard';

const env = customCleanEnv(
  {
    DB_HOST: str({ default: 'localhost' }),
    DB_PORT: num({ default: 5432 }),
    DB_NAME: str(),
  },
  (env) => ({
    ...env,
    connectionString: `postgres://${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`,
  })
);

console.log(env.connectionString);
```

### Utility Functions

#### Group by Prefix

```typescript
import { cleanEnv, str, num, groupByPrefix } from 'envguard';

const env = cleanEnv({
  DB_HOST: str({ default: 'localhost' }),
  DB_PORT: num({ default: 5432 }),
  DB_NAME: str({ default: 'mydb' }),
  CACHE_HOST: str({ default: 'localhost' }),
});

const dbConfig = groupByPrefix(env, 'DB');
// { host: 'localhost', port: 5432, name: 'mydb' }
```

#### Generate .env.example

```typescript
import { writeEnvExample, str, num, bool } from 'envguard';

const spec = {
  PORT: num({ default: 3000, desc: 'Server port' }),
  HOST: str({ desc: 'Server host', example: 'localhost' }),
  DEBUG: bool({ default: false, desc: 'Enable debug mode' }),
  API_KEY: str({ desc: 'API key for external service', secret: true }),
};

writeEnvExample(spec, {
  outputPath: '.env.example',
  includeDescriptions: true,
  includeExamples: true,
  groupByPrefix: true,
});
```

Output:
```env
# Server port
PORT=3000
# Server host
HOST=localhost
# Enable debug mode
DEBUG=false
# API key for external service
API_KEY= # Required
```

### Custom Reporter

Override error handling:

```typescript
import { cleanEnv, str } from 'envguard';

const env = cleanEnv(
  { API_KEY: str() },
  {
    reporter: {
      onError: (errors) => {
        // Custom error handling
        console.error('Config errors:', errors);
        process.exit(1);
      },
      onWarning: (warnings) => {
        // Custom warning handling
        console.warn('Config warnings:', warnings);
      },
    },
  }
);
```

## Comparison with envalid

EnvGuard improves on envalid in several ways:

| Feature | EnvGuard | envalid |
|---------|----------|---------|
| Zero dependencies | Yes | No (tslib) |
| `testDefault` | Yes | No |
| `warnOnly` mode | Yes | No |
| Extra variable detection | Yes | No |
| Secret masking | Yes | No |
| Duration validator | Yes | No |
| Bytes validator | Yes | No |
| UUID validator | Yes | No |
| .env.example generation | Yes | No |
| Enumerable proxy properties | Yes | No |
| Conditional requirements | Yes | Yes |
| Custom validators | Yes | Yes |
| TypeScript inference | Yes | Yes |

## API Reference

### `cleanEnv(spec, options?)`

Main validation function.

**Options:**
- `env`: Custom environment object (default: `process.env`)
- `reporter`: Custom error reporter
- `strict`: Throw on unknown variables (default: `false`)
- `warnOnExtra`: Warn on unknown variables (default: `false`)
- `allowedExtra`: Array of allowed extra variable names

### Validator Options

All validators accept these common options:

- `default`: Default value when variable is missing
- `devDefault`: Default for non-production environments
- `testDefault`: Default for test environment only
- `choices`: Array of allowed values
- `desc`: Description for documentation
- `example`: Example value for .env.example
- `docs`: URL to documentation
- `secret`: Mask value in error messages
- `deprecated`: Deprecation warning message
- `requiredWhen`: Function to determine if required
- `warnOnly`: Don't fail on validation errors

## License

MIT
