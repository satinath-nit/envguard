# Advanced Features

EnvGuard provides several advanced features that go beyond basic environment variable validation.

## Secret Masking

When dealing with sensitive values like API keys, passwords, or tokens, you want to avoid exposing them in error messages or logs.

### Marking Variables as Secrets

```typescript
import { cleanEnv, str } from 'envguard';

const env = cleanEnv({
  DATABASE_URL: str({ secret: true }),
  API_KEY: str({ secret: true }),
  JWT_SECRET: str({ secret: true }),
});
```

When a secret variable fails validation, its value will be masked in error messages:

```
ERROR: API_KEY - Invalid value (received: "sk_l****_xxx")
```

### Manual Masking

You can also use the `maskSecret` utility directly:

```typescript
import { maskSecret } from 'envguard';

const apiKey = 'sk_live_abc123xyz789';
console.log(`API Key: ${maskSecret(apiKey)}`);
// Output: API Key: sk_l****_789

// Custom visible characters
console.log(maskSecret(apiKey, 6));
// Output: sk_liv****xyz789
```

## Conditional Requirements

Sometimes a variable is only required based on other configuration values.

### Using `requiredWhen`

```typescript
import { cleanEnv, str, bool } from 'envguard';

const env = cleanEnv({
  USE_SMTP: bool({ default: false }),
  
  SMTP_HOST: str({
    requiredWhen: (env) => env.USE_SMTP === true,
    desc: 'Required when USE_SMTP is true',
  }),
  
  SMTP_PORT: str({
    requiredWhen: (env) => env.USE_SMTP === true,
    default: '587',
  }),
  
  SMTP_USER: str({
    requiredWhen: (env) => env.USE_SMTP === true,
  }),
  
  SMTP_PASS: str({
    requiredWhen: (env) => env.USE_SMTP === true,
    secret: true,
  }),
});
```

The `requiredWhen` function receives the partially validated environment object and should return `true` if the variable is required.

## Warning-Only Mode

For non-critical variables, you can use `warnOnly` to log warnings instead of failing validation.

```typescript
import { cleanEnv, str, url } from 'envguard';

const env = cleanEnv({
  // Critical - will fail if missing
  DATABASE_URL: url(),
  
  // Non-critical - will warn but continue
  ANALYTICS_URL: url({
    warnOnly: true,
    default: undefined,
    desc: 'Analytics endpoint (optional)',
  }),
  
  SENTRY_DSN: str({
    warnOnly: true,
    desc: 'Sentry DSN for error tracking',
  }),
});
```

Output when `ANALYTICS_URL` is invalid:

```
Environment Variable Warnings (1):
  WARNING: ANALYTICS_URL - Invalid URL format
```

The application will continue running with the default value.

## Deprecation Warnings

Mark variables as deprecated to warn users about upcoming changes.

```typescript
import { cleanEnv, str } from 'envguard';

const env = cleanEnv({
  // New variable
  API_BASE_URL: str({ default: 'https://api.example.com' }),
  
  // Deprecated variable
  API_URL: str({
    deprecated: 'Use API_BASE_URL instead. Will be removed in v2.0',
    default: undefined,
  }),
});
```

When `API_URL` is set, users will see:

```
Environment Variable Warnings (1):
  WARNING: API_URL - Deprecated: Use API_BASE_URL instead. Will be removed in v2.0
```

## Extra Variable Detection

EnvGuard can detect and warn about environment variables that aren't defined in your schema.

### Warning Mode

```typescript
import { cleanEnv, str, num } from 'envguard';

const env = cleanEnv(
  {
    PORT: num({ default: 3000 }),
    API_KEY: str(),
  },
  { warnOnExtra: true }
);
```

If `DATABSE_URL` (typo) is set in the environment:

```
Environment Variable Warnings (1):
  WARNING: DATABSE_URL - Unknown environment variable
```

### Strict Mode

In strict mode, unknown variables cause validation to fail:

```typescript
const env = cleanEnv(
  {
    PORT: num({ default: 3000 }),
    API_KEY: str(),
  },
  { strict: true }
);
```

### Allowing Specific Extra Variables

You can whitelist specific variables that should be ignored:

```typescript
const env = cleanEnv(
  { PORT: num({ default: 3000 }) },
  {
    warnOnExtra: true,
    allowedExtra: ['MY_CUSTOM_VAR', 'LEGACY_CONFIG'],
  }
);
```

Common system variables like `PATH`, `HOME`, `NODE_ENV`, etc. are automatically ignored.

## Environment-Specific Defaults

EnvGuard supports different default values for different environments.

### `default`

Used when the variable is missing in any environment:

```typescript
const env = cleanEnv({
  LOG_LEVEL: str({ default: 'info' }),
});
```

### `devDefault`

Used only in non-production environments (development, test, etc.):

```typescript
const env = cleanEnv({
  API_KEY: str({ 
    devDefault: 'dev-key-for-testing',
    // Required in production
  }),
});
```

### `testDefault`

Used only in test environment (`NODE_ENV=test`):

```typescript
const env = cleanEnv({
  DATABASE_URL: url({
    testDefault: 'postgres://localhost:5432/test_db',
    devDefault: 'postgres://localhost:5432/dev_db',
    // Required in production
  }),
});
```

Priority order: `testDefault` > `devDefault` > `default`

### Helper Functions

Use `testOnly` and `devOnly` for inline defaults:

```typescript
import { cleanEnv, str, testOnly, devOnly } from 'envguard';

const env = cleanEnv({
  API_KEY: str({ default: testOnly('test-key') }),
  DEBUG_TOKEN: str({ default: devOnly('debug-token') }),
});
```

## Generating .env.example Files

EnvGuard can automatically generate `.env.example` files from your schema.

### Using `generateEnvExample`

```typescript
import { generateEnvExample, str, num, bool, url } from 'envguard';

const spec = {
  PORT: num({ default: 3000, desc: 'Server port' }),
  DATABASE_URL: url({ desc: 'PostgreSQL connection URL', example: 'postgres://user:pass@localhost:5432/db' }),
  API_KEY: str({ desc: 'API authentication key', secret: true }),
  DEBUG: bool({ default: false, desc: 'Enable debug logging' }),
};

const content = generateEnvExample(spec);
console.log(content);
```

Output:

```env
# Server port
PORT=3000

# PostgreSQL connection URL
DATABASE_URL=postgres://user:pass@localhost:5432/db

# API authentication key
API_KEY=

# Enable debug logging
DEBUG=false
```

### Using `writeEnvExample`

Write directly to a file:

```typescript
import { writeEnvExample, str, num } from 'envguard';

const spec = {
  PORT: num({ default: 3000, desc: 'Server port' }),
  API_KEY: str({ desc: 'API key' }),
};

writeEnvExample(spec, '.env.example');
```

### Taskfile Integration

The included Taskfile has a task for generating .env.example:

```bash
task generate:example
```

## Custom Middleware

Use `customCleanEnv` to transform the validated environment:

```typescript
import { customCleanEnv, str, num, bool } from 'envguard';

const env = customCleanEnv(
  {
    DB_HOST: str({ default: 'localhost' }),
    DB_PORT: num({ default: 5432 }),
    DB_NAME: str(),
    DB_USER: str(),
    DB_PASS: str({ secret: true }),
    DB_SSL: bool({ default: false }),
  },
  (env) => ({
    ...env,
    // Computed properties
    connectionString: `postgres://${env.DB_USER}:${env.DB_PASS}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`,
    poolConfig: {
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASS,
      ssl: env.DB_SSL,
    },
  })
);

// Use computed values
const pool = new Pool(env.poolConfig);
```

## Grouping by Prefix

Organize related variables using prefixes:

```typescript
import { cleanEnv, str, num, groupByPrefix } from 'envguard';

// Raw environment
const rawEnv = process.env;

// Group database variables
const dbEnv = groupByPrefix(rawEnv, 'DB_');
// { HOST: 'localhost', PORT: '5432', NAME: 'mydb' }

// Group Redis variables
const redisEnv = groupByPrefix(rawEnv, 'REDIS_');
// { HOST: 'localhost', PORT: '6379' }
```

## Immutability

The object returned by `cleanEnv` is immutable. Attempting to modify it will throw an error:

```typescript
const env = cleanEnv({
  PORT: num({ default: 3000 }),
});

env.PORT = 8080; // Throws: Cannot modify environment variable: PORT
delete env.PORT; // Throws: Cannot delete environment variable: PORT
```

This prevents accidental modifications and ensures configuration consistency throughout your application.

## Accessing Undefined Variables

EnvGuard warns when you access variables that weren't defined in your schema:

```typescript
const env = cleanEnv({
  PORT: num({ default: 3000 }),
});

console.log(env.API_KEY);
// Console warning: [envguard] Accessing undefined environment variable: API_KEY
// Returns: undefined
```

This helps catch typos and missing schema definitions during development.
