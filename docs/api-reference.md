# API Reference

This document provides a complete reference for all EnvGuard exports.

## Core Functions

### `cleanEnv<T>(spec, options?)`

The main function for validating environment variables.

```typescript
function cleanEnv<T extends ValidatorSpec>(
  spec: T,
  options?: EnvGuardOptions
): EnvGuardResult<T>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `spec` | `ValidatorSpec` | Object mapping env var names to validators |
| `options` | `EnvGuardOptions` | Optional configuration |

**Returns:** An immutable object containing validated environment variables plus helper properties (`isProduction`, `isDevelopment`, `isTest`).

**Example:**

```typescript
import { cleanEnv, str, num, bool } from 'envguard';

const env = cleanEnv({
  PORT: num({ default: 3000 }),
  API_KEY: str({ secret: true }),
  DEBUG: bool({ default: false }),
});

// Access validated values
console.log(env.PORT);        // number
console.log(env.API_KEY);     // string
console.log(env.DEBUG);       // boolean

// Helper properties
console.log(env.isProduction);  // boolean
console.log(env.isDevelopment); // boolean
console.log(env.isTest);        // boolean
```

### `customCleanEnv<T, R>(spec, middleware, options?)`

Validate environment variables with a custom middleware function.

```typescript
function customCleanEnv<T extends ValidatorSpec, R>(
  spec: T,
  middleware: (env: InferEnvType<T>, rawEnv: Record<string, string | undefined>) => R,
  options?: EnvGuardOptions
): R
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `spec` | `ValidatorSpec` | Object mapping env var names to validators |
| `middleware` | `Function` | Transform function for the validated env |
| `options` | `EnvGuardOptions` | Optional configuration |

**Example:**

```typescript
import { customCleanEnv, str, num } from 'envguard';

const env = customCleanEnv(
  {
    DB_HOST: str({ default: 'localhost' }),
    DB_PORT: num({ default: 5432 }),
    DB_NAME: str(),
    DB_USER: str(),
    DB_PASS: str({ secret: true }),
  },
  (env) => ({
    ...env,
    connectionString: `postgres://${env.DB_USER}:${env.DB_PASS}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`,
  })
);

console.log(env.connectionString);
```

## Options

### `EnvGuardOptions`

Configuration options for `cleanEnv` and `customCleanEnv`.

```typescript
interface EnvGuardOptions {
  env?: Record<string, string | undefined>;
  reporter?: Reporter;
  strict?: boolean;
  warnOnExtra?: boolean;
  allowedExtra?: string[];
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `env` | `Record<string, string \| undefined>` | `process.env` | Environment object to validate |
| `reporter` | `Reporter` | `defaultReporter` | Custom error reporter |
| `strict` | `boolean` | `false` | Fail on unknown env vars |
| `warnOnExtra` | `boolean` | `false` | Warn about unknown env vars |
| `allowedExtra` | `string[]` | `[]` | Extra vars to ignore in strict/warn mode |

**Example:**

```typescript
import { cleanEnv, str, createThrowingReporter } from 'envguard';

const env = cleanEnv(
  { API_KEY: str() },
  {
    env: process.env,
    reporter: createThrowingReporter(),
    strict: false,
    warnOnExtra: true,
    allowedExtra: ['MY_CUSTOM_VAR'],
  }
);
```

## Reporters

### `defaultReporter`

The default reporter that logs errors to console and exits the process.

```typescript
const defaultReporter: Reporter;
```

### `createSilentReporter()`

Creates a reporter that throws errors without logging.

```typescript
function createSilentReporter(): Reporter
```

**Example:**

```typescript
import { cleanEnv, str, createSilentReporter } from 'envguard';

try {
  const env = cleanEnv(
    { API_KEY: str() },
    { reporter: createSilentReporter() }
  );
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

### `createThrowingReporter()`

Creates a reporter that throws detailed errors and logs warnings.

```typescript
function createThrowingReporter(): Reporter
```

### Custom Reporter

You can create your own reporter by implementing the `Reporter` interface:

```typescript
interface Reporter {
  onError: (errors: ValidationError[]) => void;
  onWarning?: (warnings: ValidationError[]) => void;
  onSuccess?: (env: Record<string, unknown>) => void;
}

interface ValidationError {
  key: string;
  message: string;
  value?: string;
  isWarning?: boolean;
}
```

**Example:**

```typescript
import { cleanEnv, str, Reporter } from 'envguard';

const customReporter: Reporter = {
  onError: (errors) => {
    errors.forEach(e => {
      myLogger.error(`Env error: ${e.key} - ${e.message}`);
    });
    throw new Error('Environment validation failed');
  },
  onWarning: (warnings) => {
    warnings.forEach(w => {
      myLogger.warn(`Env warning: ${w.key} - ${w.message}`);
    });
  },
  onSuccess: (env) => {
    myLogger.info('Environment validated successfully');
  },
};

const env = cleanEnv(
  { API_KEY: str() },
  { reporter: customReporter }
);
```

## Utility Functions

### `maskSecret(value, visibleChars?)`

Masks a secret value for safe logging.

```typescript
function maskSecret(value: string, visibleChars?: number): string
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | `string` | - | The secret value to mask |
| `visibleChars` | `number` | `4` | Number of characters to show at start/end |

**Example:**

```typescript
import { maskSecret } from 'envguard';

maskSecret('my-secret-api-key');
// Returns: 'my-s****-key'

maskSecret('short');
// Returns: '****'
```

### `generateEnvExample(spec)`

Generates content for a .env.example file from a validator spec.

```typescript
function generateEnvExample(spec: ValidatorSpec): string
```

**Example:**

```typescript
import { generateEnvExample, str, num, bool } from 'envguard';

const spec = {
  PORT: num({ default: 3000, desc: 'Server port' }),
  API_KEY: str({ desc: 'API authentication key', example: 'sk_live_xxx' }),
  DEBUG: bool({ default: false, desc: 'Enable debug mode' }),
};

const content = generateEnvExample(spec);
console.log(content);
// # Server port
// PORT=3000
//
// # API authentication key
// API_KEY=sk_live_xxx
//
// # Enable debug mode
// DEBUG=false
```

### `writeEnvExample(spec, path?)`

Writes a .env.example file from a validator spec.

```typescript
function writeEnvExample(spec: ValidatorSpec, path?: string): void
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `spec` | `ValidatorSpec` | - | The validator specification |
| `path` | `string` | `'.env.example'` | Output file path |

### `testOnly<T>(value)`

Returns a value only in test environment, undefined otherwise.

```typescript
function testOnly<T>(value: T): T | undefined
```

**Example:**

```typescript
import { cleanEnv, str, testOnly } from 'envguard';

const env = cleanEnv({
  API_KEY: str({ default: testOnly('test-key') }),
});
```

### `devOnly<T>(value)`

Returns a value only in development environment, undefined otherwise.

```typescript
function devOnly<T>(value: T): T | undefined
```

### `groupByPrefix(env, prefix)`

Groups environment variables by a common prefix.

```typescript
function groupByPrefix(
  env: Record<string, string | undefined>,
  prefix: string
): Record<string, string | undefined>
```

**Example:**

```typescript
import { groupByPrefix } from 'envguard';

const env = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'mydb',
  REDIS_HOST: 'localhost',
};

const dbEnv = groupByPrefix(env, 'DB_');
// { HOST: 'localhost', PORT: '5432', NAME: 'mydb' }
```

### `flattenEnv(env, prefix?)`

Flattens a nested object into environment variable format.

```typescript
function flattenEnv(
  env: Record<string, unknown>,
  prefix?: string
): Record<string, string>
```

**Example:**

```typescript
import { flattenEnv } from 'envguard';

const config = {
  database: {
    host: 'localhost',
    port: 5432,
  },
  cache: {
    enabled: true,
  },
};

const flat = flattenEnv(config);
// { DATABASE_HOST: 'localhost', DATABASE_PORT: '5432', CACHE_ENABLED: 'true' }
```

### Environment Helpers

```typescript
function isProduction(env?: Record<string, string | undefined>): boolean
function isDevelopment(env?: Record<string, string | undefined>): boolean
function isTest(env?: Record<string, string | undefined>): boolean
```

Check the current environment based on `NODE_ENV`.

## Error Classes

### `EnvError`

Base class for all EnvGuard errors.

```typescript
class EnvError extends Error {
  key: string;
  value?: string;
}
```

### `EnvMissingError`

Thrown when a required environment variable is missing.

```typescript
class EnvMissingError extends EnvError {
  constructor(key: string);
}
```

### `EnvValidationError`

Thrown when an environment variable fails validation.

```typescript
class EnvValidationError extends EnvError {
  constructor(key: string, message: string, value?: string);
}
```

## Types

### `ValidatorSpec`

Type for the specification object passed to `cleanEnv`.

```typescript
type ValidatorSpec = Record<string, Validator<unknown>>;
```

### `InferEnvType<T>`

Utility type to infer the result type from a validator spec.

```typescript
type InferEnvType<T extends ValidatorSpec> = {
  [K in keyof T]: T[K] extends Validator<infer U> ? U : never;
};
```

### `Validator<T>`

Interface for validators.

```typescript
interface Validator<T> {
  parse(value: string | undefined, key: string, env: Record<string, string | undefined>): T;
  _options: ValidatorOptions<T>;
  _type: string;
}
```

### `ValidatorOptions<T>`

Common options for all validators.

```typescript
interface ValidatorOptions<T> {
  default?: T;
  devDefault?: T;
  testDefault?: T;
  choices?: readonly T[];
  desc?: string;
  example?: string;
  docs?: string;
  secret?: boolean;
  deprecated?: string;
  requiredWhen?: (env: Record<string, unknown>) => boolean;
  warnOnly?: boolean;
}
```
