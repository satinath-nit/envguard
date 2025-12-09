# Getting Started

This guide will help you get up and running with EnvGuard in your project.

## Installation

Install EnvGuard using your preferred package manager:

```bash
# npm
npm install envguard

# yarn
yarn add envguard

# pnpm
pnpm add envguard

# bun
bun add envguard
```

## Basic Usage

### 1. Create an Environment Configuration

Create a file to define and validate your environment variables:

```typescript
// src/env.ts
import { cleanEnv, str, num, bool, url, email } from 'envguard';

export const env = cleanEnv({
  // Server configuration
  PORT: num({ default: 3000, desc: 'Server port' }),
  HOST: str({ default: 'localhost', desc: 'Server host' }),
  
  // Database
  DATABASE_URL: url({ desc: 'PostgreSQL connection URL' }),
  
  // Authentication
  JWT_SECRET: str({ secret: true, desc: 'JWT signing secret' }),
  
  // Feature flags
  DEBUG: bool({ default: false, desc: 'Enable debug mode' }),
  
  // Email
  SMTP_HOST: str({ devDefault: 'localhost', desc: 'SMTP server host' }),
  ADMIN_EMAIL: email({ default: 'admin@example.com' }),
});
```

### 2. Use the Validated Environment

Import and use your validated environment throughout your application:

```typescript
// src/server.ts
import { env } from './env';

const server = createServer({
  port: env.PORT,      // TypeScript knows this is a number
  host: env.HOST,      // TypeScript knows this is a string
  debug: env.DEBUG,    // TypeScript knows this is a boolean
});

// Environment helpers are automatically available
if (env.isProduction) {
  enableProductionOptimizations();
}

if (env.isDevelopment) {
  enableHotReload();
}
```

### 3. Create a .env File

Create a `.env` file in your project root:

```env
PORT=8080
DATABASE_URL=postgres://user:pass@localhost:5432/mydb
JWT_SECRET=your-super-secret-key
DEBUG=true
SMTP_HOST=smtp.example.com
```

## Using with dotenv

EnvGuard works seamlessly with dotenv. Load your `.env` file before calling `cleanEnv`:

```typescript
import 'dotenv/config';
import { cleanEnv, str, num } from 'envguard';

const env = cleanEnv({
  PORT: num({ default: 3000 }),
  API_KEY: str(),
});
```

Or load dotenv manually:

```typescript
import * as dotenv from 'dotenv';
dotenv.config();

import { cleanEnv, str, num } from 'envguard';
// ...
```

## TypeScript Configuration

EnvGuard is written in TypeScript and provides full type inference out of the box. No additional configuration is required.

For the best experience, ensure your `tsconfig.json` has strict mode enabled:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

## Error Handling

By default, EnvGuard will log errors and exit the process if validation fails:

```
Environment Variable Errors (2):
  ERROR: DATABASE_URL - Missing required environment variable: DATABASE_URL
  ERROR: JWT_SECRET - Missing required environment variable: JWT_SECRET
```

You can customize this behavior with a custom reporter:

```typescript
import { cleanEnv, str, createThrowingReporter } from 'envguard';

const env = cleanEnv(
  { API_KEY: str() },
  { reporter: createThrowingReporter() }
);
```

## Next Steps

- Learn about all available [Validators](./validators.md)
- Explore [Advanced Features](./advanced-features.md) like secret masking and conditional requirements
- See [Examples](./examples.md) for real-world usage patterns
- Read the complete [API Reference](./api-reference.md)
