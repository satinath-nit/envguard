# Validators

EnvGuard provides a comprehensive set of built-in validators for common use cases. All validators support common options like `default`, `devDefault`, `testDefault`, `desc`, `example`, and more.

## Common Options

All validators accept these common options:

| Option | Type | Description |
|--------|------|-------------|
| `default` | `T` | Default value when variable is missing |
| `devDefault` | `T` | Default for non-production environments |
| `testDefault` | `T` | Default for test environment only |
| `choices` | `T[]` | Array of allowed values |
| `desc` | `string` | Description for documentation |
| `example` | `string` | Example value for .env.example |
| `docs` | `string` | URL to documentation |
| `secret` | `boolean` | Mask value in error messages |
| `deprecated` | `string` | Deprecation warning message |
| `requiredWhen` | `(env) => boolean` | Conditional requirement |
| `warnOnly` | `boolean` | Don't fail on validation errors |

## String Validators

### `str(options?)`

Validates and returns string values.

```typescript
import { str } from 'envguard';

const env = cleanEnv({
  // Basic string
  NAME: str(),
  
  // With default
  HOST: str({ default: 'localhost' }),
  
  // With length constraints
  CODE: str({ minLength: 3, maxLength: 10 }),
  
  // With pattern validation
  SLUG: str({ pattern: /^[a-z0-9-]+$/ }),
  
  // With transformation
  USERNAME: str({ trim: true, toLowerCase: true }),
  COUNTRY_CODE: str({ toUpperCase: true }),
  
  // With choices
  LOG_FORMAT: str({ choices: ['json', 'text', 'pretty'] }),
});
```

**String-specific options:**

| Option | Type | Description |
|--------|------|-------------|
| `minLength` | `number` | Minimum string length |
| `maxLength` | `number` | Maximum string length |
| `pattern` | `RegExp` | Regex pattern to match |
| `trim` | `boolean` | Trim whitespace |
| `toLowerCase` | `boolean` | Convert to lowercase |
| `toUpperCase` | `boolean` | Convert to uppercase |

### `email(options?)`

Validates email addresses.

```typescript
import { email } from 'envguard';

const env = cleanEnv({
  ADMIN_EMAIL: email(),
  SUPPORT_EMAIL: email({ default: 'support@example.com' }),
});
```

### `url(options?)`

Validates URLs with http/https protocol.

```typescript
import { url } from 'envguard';

const env = cleanEnv({
  API_URL: url(),
  WEBHOOK_URL: url({ default: 'https://example.com/webhook' }),
});
```

### `host(options?)`

Validates hostnames or IP addresses (IPv4 and IPv6).

```typescript
import { host } from 'envguard';

const env = cleanEnv({
  DB_HOST: host({ default: 'localhost' }),
  REDIS_HOST: host(),
});

// Valid values: 'example.com', '192.168.1.1', '::1', '2001:db8::1'
```

### `uuid(options?)`

Validates UUID strings (versions 1-5).

```typescript
import { uuid } from 'envguard';

const env = cleanEnv({
  SESSION_ID: uuid(),
  TENANT_ID: uuid({ default: '00000000-0000-0000-0000-000000000000' }),
});
```

### `regex(options)`

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

## Numeric Validators

### `num(options?)`

Validates and parses numeric values.

```typescript
import { num } from 'envguard';

const env = cleanEnv({
  // Basic number
  PORT: num({ default: 3000 }),
  
  // With constraints
  MAX_CONNECTIONS: num({ min: 1, max: 100 }),
  
  // Integer only
  RETRY_COUNT: num({ integer: true }),
  
  // With choices
  WORKERS: num({ choices: [1, 2, 4, 8] }),
});
```

**Number-specific options:**

| Option | Type | Description |
|--------|------|-------------|
| `min` | `number` | Minimum value |
| `max` | `number` | Maximum value |
| `integer` | `boolean` | Must be an integer |

### `port(options?)`

Validates TCP port numbers (1-65535).

```typescript
import { port } from 'envguard';

const env = cleanEnv({
  PORT: port({ default: 3000 }),
  
  // Custom range (e.g., non-privileged ports only)
  ADMIN_PORT: port({ min: 1024, max: 49151 }),
});
```

### `duration(options?)`

Parses duration strings into milliseconds (or other units).

```typescript
import { duration } from 'envguard';

const env = cleanEnv({
  // Returns milliseconds by default
  TIMEOUT: duration({ default: 5000 }),
  
  // Convert to seconds
  CACHE_TTL: duration({ unit: 's' }),
});

// Valid values: '100ms', '5s', '2m', '1h', '7d'
// TIMEOUT=30s -> 30000 (ms)
// CACHE_TTL=5m -> 300 (s)
```

**Duration-specific options:**

| Option | Type | Description |
|--------|------|-------------|
| `unit` | `'ms' \| 's' \| 'm' \| 'h' \| 'd'` | Output unit (default: 'ms') |

### `bytes(options?)`

Parses byte size strings into bytes (or other units).

```typescript
import { bytes } from 'envguard';

const env = cleanEnv({
  // Returns bytes by default
  MAX_FILE_SIZE: bytes({ default: 10485760 }), // 10MB
  
  // Convert to megabytes
  MEMORY_LIMIT: bytes({ unit: 'MB' }),
});

// Valid values: '100B', '5KB', '2MB', '1GB', '1TB'
// MAX_FILE_SIZE=50MB -> 52428800 (bytes)
// MEMORY_LIMIT=2GB -> 2048 (MB)
```

**Bytes-specific options:**

| Option | Type | Description |
|--------|------|-------------|
| `unit` | `'B' \| 'KB' \| 'MB' \| 'GB' \| 'TB'` | Output unit (default: 'B') |

## Boolean Validator

### `bool(options?)`

Validates and parses boolean values.

```typescript
import { bool } from 'envguard';

const env = cleanEnv({
  DEBUG: bool({ default: false }),
  ENABLE_CACHE: bool({ default: true }),
});
```

**Accepted values:**
- True: `'1'`, `'true'`, `'t'`, `'yes'`, `'y'`, `'on'`
- False: `'0'`, `'false'`, `'f'`, `'no'`, `'n'`, `'off'`

Values are case-insensitive.

## Data Validators

### `json<T>(options?)`

Parses JSON values.

```typescript
import { json } from 'envguard';

const env = cleanEnv({
  // Basic JSON
  CONFIG: json<{ key: string }>(),
  
  // With schema validation
  SETTINGS: json<Settings>({
    schema: (v): v is Settings => 
      typeof v === 'object' && v !== null && 'name' in v,
  }),
});

// CONFIG='{"key": "value"}' -> { key: 'value' }
```

**JSON-specific options:**

| Option | Type | Description |
|--------|------|-------------|
| `schema` | `(value: unknown) => value is T` | Type guard for validation |

### `array<T>(options?)`

Parses comma-separated values into arrays.

```typescript
import { array, num } from 'envguard';

const env = cleanEnv({
  // String array (default)
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

// ALLOWED_HOSTS='localhost,example.com' -> ['localhost', 'example.com']
// TAGS='a|b|c' -> ['a', 'b', 'c']
// PORTS='80,443,8080' -> [80, 443, 8080]
```

**Array-specific options:**

| Option | Type | Description |
|--------|------|-------------|
| `separator` | `string` | Item separator (default: ',') |
| `itemValidator` | `Validator<T>` | Validator for each item |
| `minItems` | `number` | Minimum array length |
| `maxItems` | `number` | Maximum array length |
| `unique` | `boolean` | Require unique items |

## Enum Validator

### `enums(options)`

Validates against a list of allowed values with proper TypeScript inference.

```typescript
import { enums } from 'envguard';

const env = cleanEnv({
  LOG_LEVEL: enums({ 
    values: ['debug', 'info', 'warn', 'error'] as const,
    default: 'info',
  }),
  
  NODE_ENV: enums({
    values: ['development', 'staging', 'production'] as const,
  }),
});

// env.LOG_LEVEL is typed as 'debug' | 'info' | 'warn' | 'error'
```

**Enum-specific options:**

| Option | Type | Description |
|--------|------|-------------|
| `values` | `readonly T[]` | Array of allowed values (required) |

## Custom Validators

### `makeValidator<T>(parser, type?)`

Create your own validators for custom types.

```typescript
import { makeValidator, EnvValidationError } from 'envguard';

// Simple custom validator
const hexColor = makeValidator<string>((value, key) => {
  if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
    throw new EnvValidationError(key, 'must be a valid hex color', value);
  }
  return value.toLowerCase();
});

// Use it like any other validator
const env = cleanEnv({
  PRIMARY_COLOR: hexColor({ default: '#000000' }),
  ACCENT_COLOR: hexColor(),
});
```

The parser function receives:
- `value`: The raw string value from the environment
- `key`: The environment variable name

It should either:
- Return the parsed/validated value
- Throw an `EnvValidationError` if validation fails
