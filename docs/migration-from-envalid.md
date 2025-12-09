# Migration from envalid

This guide helps you migrate from envalid to EnvGuard. EnvGuard is designed to be a drop-in replacement with additional features and improvements.

## Why Migrate?

EnvGuard offers several advantages over envalid:

| Feature | envalid | EnvGuard |
|---------|---------|----------|
| Zero dependencies | No (requires tslib) | Yes |
| `testDefault` option | No | Yes |
| `warnOnly` mode | No | Yes |
| Extra variable detection | No | Yes |
| Secret masking | Limited | Full support |
| Duration validator | No | Yes |
| Bytes validator | No | Yes |
| UUID validator | No | Yes |
| Conditional requirements | No | Yes |
| .env.example generation | No | Yes |
| Enumerable properties | Broken (#241) | Fixed |

## Quick Migration

### Step 1: Install EnvGuard

```bash
npm uninstall envalid
npm install envguard
```

### Step 2: Update Imports

```diff
- import { cleanEnv, str, num, bool, url, email, json, host, port } from 'envalid';
+ import { cleanEnv, str, num, bool, url, email, json, host, port } from 'envguard';
```

### Step 3: Run Your Application

In most cases, your existing code will work without changes. EnvGuard is API-compatible with envalid for common use cases.

## API Differences

### Validator Names

Most validators have the same names:

| envalid | EnvGuard | Notes |
|---------|----------|-------|
| `str()` | `str()` | Same |
| `num()` | `num()` | Same |
| `bool()` | `bool()` | Same |
| `url()` | `url()` | Same |
| `email()` | `email()` | Same |
| `host()` | `host()` | Same |
| `port()` | `port()` | Same |
| `json()` | `json()` | Same |
| `makeValidator()` | `makeValidator()` | Same |

### New Validators in EnvGuard

EnvGuard adds validators not available in envalid:

```typescript
import { 
  uuid,      // UUID validation
  regex,     // Custom regex patterns
  enums,     // Enum values with type inference
  duration,  // Duration strings (5s, 2m, 1h)
  bytes,     // Byte sizes (5KB, 2MB, 1GB)
  array,     // Comma-separated arrays
} from 'envguard';
```

### Options Differences

#### `devDefault` Behavior

Both libraries support `devDefault`, but EnvGuard also adds `testDefault`:

```typescript
// envalid
const env = cleanEnv({
  API_KEY: str({ devDefault: 'dev-key' }), // Used in development AND test
});

// EnvGuard - more granular control
const env = cleanEnv({
  API_KEY: str({ 
    devDefault: 'dev-key',   // Used in development only
    testDefault: 'test-key', // Used in test only
  }),
});
```

#### New Options in EnvGuard

```typescript
const env = cleanEnv({
  // Secret masking in error messages
  API_KEY: str({ secret: true }),
  
  // Warning-only mode (doesn't fail validation)
  ANALYTICS_ID: str({ warnOnly: true }),
  
  // Conditional requirements
  SMTP_HOST: str({ 
    requiredWhen: (env) => env.USE_EMAIL === true,
  }),
  
  // Deprecation warnings
  OLD_API_KEY: str({ 
    deprecated: 'Use API_KEY instead',
  }),
});
```

### `cleanEnv` Options

#### envalid Options

```typescript
// envalid
cleanEnv(process.env, validators, {
  reporter: customReporter,
  dotEnvPath: '.env',
  transformer: (env) => env,
});
```

#### EnvGuard Options

```typescript
// EnvGuard
cleanEnv(validators, {
  env: process.env,        // Pass env object explicitly
  reporter: customReporter,
  strict: false,           // Fail on unknown vars
  warnOnExtra: false,      // Warn about unknown vars
  allowedExtra: [],        // Whitelist for strict/warn mode
});
```

**Key differences:**
- EnvGuard doesn't have built-in dotenv loading (use `dotenv` package separately)
- EnvGuard adds `strict`, `warnOnExtra`, and `allowedExtra` options
- The `env` parameter is passed in options, not as the first argument

### Reporter Interface

#### envalid Reporter

```typescript
// envalid
const reporter = ({ errors, env }) => {
  console.error(errors);
  process.exit(1);
};
```

#### EnvGuard Reporter

```typescript
// EnvGuard
const reporter: Reporter = {
  onError: (errors: ValidationError[]) => {
    console.error(errors);
    process.exit(1);
  },
  onWarning: (warnings: ValidationError[]) => {
    console.warn(warnings);
  },
  onSuccess: (env: Record<string, unknown>) => {
    console.log('Validated!');
  },
};
```

EnvGuard's reporter is more structured with separate callbacks for errors, warnings, and success.

## Code Migration Examples

### Basic Migration

```typescript
// Before (envalid)
import { cleanEnv, str, num, bool } from 'envalid';

const env = cleanEnv(process.env, {
  PORT: num({ default: 3000 }),
  API_KEY: str(),
  DEBUG: bool({ default: false }),
});

// After (EnvGuard)
import { cleanEnv, str, num, bool } from 'envguard';

const env = cleanEnv({
  PORT: num({ default: 3000 }),
  API_KEY: str(),
  DEBUG: bool({ default: false }),
});
```

### With Custom Environment

```typescript
// Before (envalid)
import { cleanEnv, str } from 'envalid';

const env = cleanEnv(customEnvObject, {
  API_KEY: str(),
});

// After (EnvGuard)
import { cleanEnv, str } from 'envguard';

const env = cleanEnv(
  { API_KEY: str() },
  { env: customEnvObject }
);
```

### With dotenv

```typescript
// Before (envalid)
import { cleanEnv, str } from 'envalid';

const env = cleanEnv(process.env, {
  API_KEY: str(),
}, {
  dotEnvPath: '.env.local',
});

// After (EnvGuard)
import 'dotenv/config'; // or: dotenv.config({ path: '.env.local' })
import { cleanEnv, str } from 'envguard';

const env = cleanEnv({
  API_KEY: str(),
});
```

### Custom Validator

```typescript
// Before (envalid)
import { makeValidator, EnvError } from 'envalid';

const hexColor = makeValidator((value) => {
  if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
    throw new EnvError('must be a hex color');
  }
  return value.toLowerCase();
});

// After (EnvGuard)
import { makeValidator, EnvValidationError } from 'envguard';

const hexColor = makeValidator<string>((value, key) => {
  if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
    throw new EnvValidationError(key, 'must be a hex color', value);
  }
  return value.toLowerCase();
});
```

### Custom Reporter

```typescript
// Before (envalid)
import { cleanEnv, str } from 'envalid';

const env = cleanEnv(process.env, {
  API_KEY: str(),
}, {
  reporter: ({ errors }) => {
    Object.entries(errors).forEach(([key, err]) => {
      console.error(`${key}: ${err.message}`);
    });
    process.exit(1);
  },
});

// After (EnvGuard)
import { cleanEnv, str, Reporter } from 'envguard';

const customReporter: Reporter = {
  onError: (errors) => {
    errors.forEach(({ key, message }) => {
      console.error(`${key}: ${message}`);
    });
    process.exit(1);
  },
};

const env = cleanEnv(
  { API_KEY: str() },
  { reporter: customReporter }
);
```

## Taking Advantage of New Features

After migrating, you can start using EnvGuard's additional features:

### Secret Masking

```typescript
const env = cleanEnv({
  DATABASE_URL: url({ secret: true }),
  API_KEY: str({ secret: true }),
});
// Error messages will show: "API_KEY - Invalid (received: sk_l****_xxx)"
```

### Test-Specific Defaults

```typescript
const env = cleanEnv({
  DATABASE_URL: url({
    testDefault: 'postgres://localhost/test_db',
    devDefault: 'postgres://localhost/dev_db',
  }),
});
```

### Warning Mode

```typescript
const env = cleanEnv({
  ANALYTICS_ID: str({ 
    warnOnly: true,
    desc: 'Optional analytics tracking ID',
  }),
});
```

### Extra Variable Detection

```typescript
const env = cleanEnv(
  { PORT: num() },
  { warnOnExtra: true } // Warns about typos like PROT instead of PORT
);
```

### Conditional Requirements

```typescript
const env = cleanEnv({
  USE_SMTP: bool({ default: false }),
  SMTP_HOST: str({
    requiredWhen: (env) => env.USE_SMTP === true,
  }),
});
```

### Generate .env.example

```typescript
import { writeEnvExample, str, num } from 'envguard';

const spec = {
  PORT: num({ default: 3000, desc: 'Server port' }),
  API_KEY: str({ desc: 'API key', example: 'sk_xxx' }),
};

writeEnvExample(spec);
```

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors after migration, ensure your `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "node"
  }
}
```

### Missing Validators

If you were using envalid validators that don't exist in EnvGuard, you can create them with `makeValidator`:

```typescript
import { makeValidator, EnvValidationError } from 'envguard';

// Example: Create a custom validator
const myValidator = makeValidator<string>((value, key) => {
  // Your validation logic
  return value;
});
```

### Reporter Compatibility

If your custom reporter isn't working, update it to use the new interface:

```typescript
// Old format (won't work)
const reporter = ({ errors, env }) => { ... };

// New format
const reporter: Reporter = {
  onError: (errors) => { ... },
  onWarning: (warnings) => { ... }, // optional
  onSuccess: (env) => { ... },      // optional
};
```

## Getting Help

If you encounter issues during migration:

1. Check the [API Reference](./api-reference.md) for detailed documentation
2. Review the [Examples](./examples.md) for common patterns
3. Open an issue on GitHub with your specific use case
