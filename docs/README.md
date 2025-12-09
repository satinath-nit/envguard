# EnvGuard Documentation

Welcome to the EnvGuard documentation. EnvGuard is a type-safe environment variable validation library for Node.js, Bun, and other JavaScript runtimes.

## Table of Contents

1. [Getting Started](./getting-started.md) - Installation and basic usage
2. [Validators](./validators.md) - Complete reference for all built-in validators
3. [API Reference](./api-reference.md) - Detailed API documentation
4. [Advanced Features](./advanced-features.md) - Secret masking, conditional requirements, and more
5. [Examples](./examples.md) - Real-world usage examples
6. [Migration from envalid](./migration-from-envalid.md) - Guide for migrating from envalid

## Quick Example

```typescript
import { cleanEnv, str, num, bool, url } from 'envguard';

const env = cleanEnv({
  PORT: num({ default: 3000 }),
  DATABASE_URL: url(),
  API_KEY: str({ secret: true }),
  DEBUG: bool({ default: false }),
});

console.log(env.PORT);        // number: 3000
console.log(env.DATABASE_URL); // string: validated URL
console.log(env.isProduction); // boolean: true if NODE_ENV === 'production'
```

## Why EnvGuard?

EnvGuard provides several advantages over other environment validation libraries:

- **Zero dependencies** - No external runtime dependencies
- **Full TypeScript support** - Automatic type inference for validated environment
- **Comprehensive validators** - Built-in support for strings, numbers, booleans, URLs, emails, UUIDs, durations, byte sizes, and more
- **Secret masking** - Automatically mask sensitive values in error messages
- **Flexible defaults** - Support for `default`, `devDefault`, and `testDefault`
- **Warning mode** - Non-blocking validation for optional variables
- **Extra variable detection** - Catch typos and unused variables
- **.env.example generation** - Auto-generate documentation from your schema

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/YOUR_USERNAME/envguard/issues) on GitHub.
