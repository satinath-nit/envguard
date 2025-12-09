# Examples

This document provides real-world examples of using EnvGuard in various scenarios.

## Express.js Application

```typescript
// src/env.ts
import { cleanEnv, str, num, bool, url, email } from 'envguard';

export const env = cleanEnv({
  // Server
  PORT: num({ default: 3000, desc: 'HTTP server port' }),
  HOST: str({ default: '0.0.0.0', desc: 'Server bind address' }),
  
  // Database
  DATABASE_URL: url({ desc: 'PostgreSQL connection URL' }),
  
  // Redis
  REDIS_URL: url({ 
    devDefault: 'redis://localhost:6379',
    desc: 'Redis connection URL',
  }),
  
  // Authentication
  JWT_SECRET: str({ secret: true, desc: 'JWT signing secret' }),
  JWT_EXPIRES_IN: str({ default: '7d', desc: 'JWT expiration time' }),
  
  // Email
  SMTP_HOST: str({ devDefault: 'localhost' }),
  SMTP_PORT: num({ default: 587 }),
  SMTP_USER: str({ devDefault: '' }),
  SMTP_PASS: str({ secret: true, devDefault: '' }),
  FROM_EMAIL: email({ default: 'noreply@example.com' }),
  
  // Features
  ENABLE_SWAGGER: bool({ default: true }),
  ENABLE_CORS: bool({ default: true }),
  LOG_LEVEL: str({ 
    choices: ['debug', 'info', 'warn', 'error'],
    default: 'info',
  }),
});

// src/app.ts
import express from 'express';
import { env } from './env';

const app = express();

if (env.ENABLE_CORS) {
  app.use(cors());
}

if (env.ENABLE_SWAGGER && !env.isProduction) {
  app.use('/docs', swaggerUi.serve);
}

app.listen(env.PORT, env.HOST, () => {
  console.log(`Server running on ${env.HOST}:${env.PORT}`);
});
```

## Next.js Application

```typescript
// src/env.ts
import { cleanEnv, str, url, bool } from 'envguard';

// Server-side environment variables
export const serverEnv = cleanEnv({
  DATABASE_URL: url(),
  NEXTAUTH_SECRET: str({ secret: true }),
  NEXTAUTH_URL: url({ devDefault: 'http://localhost:3000' }),
  
  // External APIs
  STRIPE_SECRET_KEY: str({ secret: true }),
  SENDGRID_API_KEY: str({ secret: true }),
});

// Client-side environment variables (must be prefixed with NEXT_PUBLIC_)
export const clientEnv = cleanEnv({
  NEXT_PUBLIC_API_URL: url({ devDefault: 'http://localhost:3000/api' }),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: str(),
  NEXT_PUBLIC_ENABLE_ANALYTICS: bool({ default: false }),
});

// Combined for convenience
export const env = { ...serverEnv, ...clientEnv };
```

## Microservice with Multiple Databases

```typescript
import { cleanEnv, str, num, bool, url, duration } from 'envguard';

export const env = cleanEnv({
  // Service identity
  SERVICE_NAME: str({ default: 'user-service' }),
  SERVICE_VERSION: str({ default: '1.0.0' }),
  
  // Primary database (PostgreSQL)
  POSTGRES_HOST: str({ default: 'localhost' }),
  POSTGRES_PORT: num({ default: 5432 }),
  POSTGRES_DB: str(),
  POSTGRES_USER: str(),
  POSTGRES_PASSWORD: str({ secret: true }),
  POSTGRES_SSL: bool({ default: false }),
  POSTGRES_POOL_SIZE: num({ default: 10 }),
  
  // Cache (Redis)
  REDIS_HOST: str({ default: 'localhost' }),
  REDIS_PORT: num({ default: 6379 }),
  REDIS_PASSWORD: str({ secret: true, default: '' }),
  REDIS_DB: num({ default: 0 }),
  REDIS_TTL: duration({ default: 3600000, desc: 'Default cache TTL' }),
  
  // Message queue (RabbitMQ)
  RABBITMQ_URL: url({ devDefault: 'amqp://localhost:5672' }),
  RABBITMQ_PREFETCH: num({ default: 10 }),
  
  // Elasticsearch
  ELASTICSEARCH_URL: url({ devDefault: 'http://localhost:9200' }),
  ELASTICSEARCH_INDEX_PREFIX: str({ default: 'app' }),
  
  // Timeouts
  REQUEST_TIMEOUT: duration({ default: 30000 }),
  DB_QUERY_TIMEOUT: duration({ default: 5000 }),
});
```

## AWS Lambda Function

```typescript
import { cleanEnv, str, num, bool, url } from 'envguard';

export const env = cleanEnv({
  // AWS
  AWS_REGION: str({ default: 'us-east-1' }),
  
  // DynamoDB
  DYNAMODB_TABLE: str(),
  DYNAMODB_ENDPOINT: url({ 
    devDefault: 'http://localhost:8000',
    desc: 'Local DynamoDB endpoint for development',
  }),
  
  // S3
  S3_BUCKET: str(),
  S3_REGION: str({ default: 'us-east-1' }),
  
  // SQS
  SQS_QUEUE_URL: url(),
  SQS_BATCH_SIZE: num({ default: 10, min: 1, max: 10 }),
  
  // Secrets Manager
  SECRETS_PREFIX: str({ default: '/myapp/prod/' }),
  
  // Lambda configuration
  MEMORY_SIZE: num({ default: 128 }),
  TIMEOUT: num({ default: 30 }),
  
  // Feature flags
  ENABLE_XRAY: bool({ default: true }),
  LOG_LEVEL: str({ 
    choices: ['DEBUG', 'INFO', 'WARN', 'ERROR'],
    default: 'INFO',
  }),
});
```

## Docker Compose Development

```typescript
// src/env.ts
import { cleanEnv, str, num, bool, url, testOnly, devOnly } from 'envguard';

export const env = cleanEnv({
  NODE_ENV: str({ 
    choices: ['development', 'test', 'production'],
    default: 'development',
  }),
  
  // App
  PORT: num({ default: 3000 }),
  
  // Database - different defaults for each environment
  DATABASE_URL: url({
    testDefault: 'postgres://postgres:postgres@localhost:5433/test_db',
    devDefault: 'postgres://postgres:postgres@localhost:5432/dev_db',
  }),
  
  // Redis
  REDIS_URL: url({
    testDefault: 'redis://localhost:6380',
    devDefault: 'redis://localhost:6379',
  }),
  
  // Mail - use Mailhog in development
  SMTP_HOST: str({
    devDefault: 'localhost',
    testDefault: 'localhost',
  }),
  SMTP_PORT: num({
    devDefault: 1025, // Mailhog
    testDefault: 1025,
    default: 587,
  }),
  
  // Debug
  DEBUG: bool({ 
    default: devOnly(true),
    desc: 'Enable debug mode',
  }),
});
```

## Multi-Tenant SaaS Application

```typescript
import { cleanEnv, str, num, bool, url, array, json } from 'envguard';

export const env = cleanEnv({
  // Core
  APP_NAME: str({ default: 'MySaaS' }),
  APP_URL: url(),
  
  // Multi-tenancy
  TENANT_MODE: str({ 
    choices: ['subdomain', 'path', 'header'],
    default: 'subdomain',
  }),
  DEFAULT_TENANT: str({ default: 'default' }),
  ALLOWED_TENANTS: array({ 
    default: [],
    desc: 'Whitelist of allowed tenant IDs (empty = all allowed)',
  }),
  
  // Database per tenant
  DATABASE_URL_TEMPLATE: str({
    default: 'postgres://user:pass@localhost:5432/{tenant}_db',
    desc: 'Template with {tenant} placeholder',
  }),
  
  // Feature flags per tier
  FEATURES_FREE: json<string[]>({ default: ['basic'] }),
  FEATURES_PRO: json<string[]>({ default: ['basic', 'advanced'] }),
  FEATURES_ENTERPRISE: json<string[]>({ 
    default: ['basic', 'advanced', 'enterprise'],
  }),
  
  // Rate limiting
  RATE_LIMIT_FREE: num({ default: 100, desc: 'Requests per minute' }),
  RATE_LIMIT_PRO: num({ default: 1000 }),
  RATE_LIMIT_ENTERPRISE: num({ default: 10000 }),
  
  // Storage limits (in bytes)
  STORAGE_LIMIT_FREE: num({ default: 104857600 }), // 100MB
  STORAGE_LIMIT_PRO: num({ default: 1073741824 }), // 1GB
  STORAGE_LIMIT_ENTERPRISE: num({ default: 10737418240 }), // 10GB
});
```

## CLI Application

```typescript
import { cleanEnv, str, bool, num } from 'envguard';

// Load from ~/.myapp/config or environment
const env = cleanEnv({
  // API Configuration
  API_URL: str({ 
    default: 'https://api.myapp.com',
    desc: 'API endpoint URL',
  }),
  API_KEY: str({ 
    secret: true,
    desc: 'Your API key (get one at https://myapp.com/settings)',
  }),
  
  // Output preferences
  OUTPUT_FORMAT: str({
    choices: ['json', 'yaml', 'table', 'plain'],
    default: 'table',
  }),
  COLOR: bool({ 
    default: true,
    desc: 'Enable colored output',
  }),
  VERBOSE: bool({ default: false }),
  
  // Performance
  TIMEOUT: num({ 
    default: 30000,
    desc: 'Request timeout in milliseconds',
  }),
  MAX_RETRIES: num({ default: 3 }),
  
  // Paths
  CONFIG_DIR: str({ 
    default: '~/.myapp',
    desc: 'Configuration directory',
  }),
  CACHE_DIR: str({ 
    default: '~/.myapp/cache',
    desc: 'Cache directory',
  }),
});
```

## Testing with EnvGuard

```typescript
// tests/setup.ts
import { cleanEnv, str, num, createSilentReporter } from 'envguard';

// Create a test-specific environment
export function createTestEnv(overrides: Record<string, string> = {}) {
  const testEnvVars = {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgres://localhost:5432/test_db',
    REDIS_URL: 'redis://localhost:6379/1',
    JWT_SECRET: 'test-secret',
    ...overrides,
  };

  return cleanEnv(
    {
      DATABASE_URL: str(),
      REDIS_URL: str(),
      JWT_SECRET: str(),
    },
    {
      env: testEnvVars,
      reporter: createSilentReporter(),
    }
  );
}

// tests/user.test.ts
import { createTestEnv } from './setup';

describe('User Service', () => {
  const env = createTestEnv();

  it('should connect to test database', () => {
    expect(env.DATABASE_URL).toContain('test_db');
  });
});
```

## Validation with Custom Reporter

```typescript
import { cleanEnv, str, num, Reporter, ValidationError } from 'envguard';
import pino from 'pino';

const logger = pino({ level: 'info' });

const pinoReporter: Reporter = {
  onError: (errors: ValidationError[]) => {
    const actualErrors = errors.filter(e => !e.isWarning);
    
    if (actualErrors.length > 0) {
      logger.fatal(
        { errors: actualErrors.map(e => ({ key: e.key, message: e.message })) },
        'Environment validation failed'
      );
      process.exit(1);
    }
  },
  
  onWarning: (warnings: ValidationError[]) => {
    warnings.forEach(w => {
      logger.warn({ key: w.key }, w.message);
    });
  },
  
  onSuccess: () => {
    logger.info('Environment validated successfully');
  },
};

export const env = cleanEnv(
  {
    PORT: num({ default: 3000 }),
    API_KEY: str(),
  },
  { reporter: pinoReporter }
);
```

## Generating Documentation

```typescript
// scripts/generate-env-docs.ts
import { generateEnvExample, str, num, bool, url } from 'envguard';
import * as fs from 'fs';

const spec = {
  PORT: num({ default: 3000, desc: 'HTTP server port' }),
  HOST: str({ default: 'localhost', desc: 'Server bind address' }),
  DATABASE_URL: url({ desc: 'PostgreSQL connection string', example: 'postgres://user:pass@localhost:5432/db' }),
  REDIS_URL: url({ desc: 'Redis connection string', example: 'redis://localhost:6379' }),
  JWT_SECRET: str({ desc: 'Secret key for JWT signing', secret: true }),
  LOG_LEVEL: str({ choices: ['debug', 'info', 'warn', 'error'], default: 'info', desc: 'Application log level' }),
  ENABLE_METRICS: bool({ default: true, desc: 'Enable Prometheus metrics endpoint' }),
};

// Generate .env.example
const envExample = generateEnvExample(spec);
fs.writeFileSync('.env.example', envExample);

// Generate markdown documentation
let markdown = '# Environment Variables\n\n';
markdown += '| Variable | Type | Default | Description |\n';
markdown += '|----------|------|---------|-------------|\n';

for (const [key, validator] of Object.entries(spec)) {
  const opts = validator._options;
  const type = validator._type;
  const defaultVal = opts.default ?? opts.devDefault ?? '-';
  const desc = opts.desc ?? '-';
  markdown += `| \`${key}\` | ${type} | ${defaultVal} | ${desc} |\n`;
}

fs.writeFileSync('docs/ENVIRONMENT.md', markdown);
console.log('Generated .env.example and docs/ENVIRONMENT.md');
```
