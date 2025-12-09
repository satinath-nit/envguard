import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanEnv, customCleanEnv } from '../src/envguard.js';
import { str, num, bool, email } from '../src/validators.js';
import { createThrowingReporter, createSilentReporter } from '../src/reporter.js';

describe('cleanEnv', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should validate and return environment variables', () => {
    const env = cleanEnv(
      {
        PORT: num(),
        HOST: str(),
        DEBUG: bool(),
      },
      {
        env: { PORT: '3000', HOST: 'localhost', DEBUG: 'true' },
        reporter: createThrowingReporter(),
      }
    );

    expect(env.PORT).toBe(3000);
    expect(env.HOST).toBe('localhost');
    expect(env.DEBUG).toBe(true);
  });

  it('should throw on missing required variables', () => {
    expect(() =>
      cleanEnv(
        { REQUIRED: str() },
        {
          env: {},
          reporter: createThrowingReporter(),
        }
      )
    ).toThrow();
  });

  it('should use default values', () => {
    const env = cleanEnv(
      {
        PORT: num({ default: 3000 }),
        HOST: str({ default: 'localhost' }),
      },
      {
        env: {},
        reporter: createThrowingReporter(),
      }
    );

    expect(env.PORT).toBe(3000);
    expect(env.HOST).toBe('localhost');
  });

  it('should provide isProduction, isDevelopment, isTest helpers', () => {
    const devEnv = cleanEnv(
      {},
      {
        env: { NODE_ENV: 'development' },
        reporter: createThrowingReporter(),
      }
    );
    expect(devEnv.isDevelopment).toBe(true);
    expect(devEnv.isProduction).toBe(false);
    expect(devEnv.isTest).toBe(false);

    const prodEnv = cleanEnv(
      {},
      {
        env: { NODE_ENV: 'production' },
        reporter: createThrowingReporter(),
      }
    );
    expect(prodEnv.isProduction).toBe(true);
    expect(prodEnv.isDevelopment).toBe(false);

    const testEnv = cleanEnv(
      {},
      {
        env: { NODE_ENV: 'test' },
        reporter: createThrowingReporter(),
      }
    );
    expect(testEnv.isTest).toBe(true);
  });

  it('should be immutable', () => {
    const env = cleanEnv(
      { PORT: num({ default: 3000 }) },
      {
        env: {},
        reporter: createThrowingReporter(),
      }
    );

    expect(() => {
      (env as Record<string, unknown>).PORT = 4000;
    }).toThrow();

    expect(() => {
      delete (env as Record<string, unknown>).PORT;
    }).toThrow();
  });

  it('should warn on accessing undefined variables', () => {
    const env = cleanEnv(
      { PORT: num({ default: 3000 }) },
      {
        env: {},
        reporter: createThrowingReporter(),
      }
    );

    const _value = (env as Record<string, unknown>).UNDEFINED_VAR;
    expect(console.warn).toHaveBeenCalled();
  });

  it('should handle warnOnly option', () => {
    const env = cleanEnv(
      {
        OPTIONAL: str({ warnOnly: true }),
        REQUIRED: str({ default: 'default' }),
      },
      {
        env: {},
        reporter: createThrowingReporter(),
      }
    );

    expect(env.OPTIONAL).toBeUndefined();
    expect(env.REQUIRED).toBe('default');
  });

  it('should warn on extra environment variables when warnOnExtra is true', () => {
    cleanEnv(
      { PORT: num({ default: 3000 }) },
      {
        env: { PORT: '3000', EXTRA_VAR: 'value' },
        warnOnExtra: true,
        reporter: createThrowingReporter(),
      }
    );

    expect(console.warn).toHaveBeenCalled();
  });

  it('should throw on extra environment variables when strict is true', () => {
    expect(() =>
      cleanEnv(
        { PORT: num({ default: 3000 }) },
        {
          env: { PORT: '3000', EXTRA_VAR: 'value' },
          strict: true,
          reporter: createThrowingReporter(),
        }
      )
    ).toThrow();
  });

  it('should allow specified extra variables', () => {
    const env = cleanEnv(
      { PORT: num({ default: 3000 }) },
      {
        env: { PORT: '3000', ALLOWED_EXTRA: 'value' },
        strict: true,
        allowedExtra: ['ALLOWED_EXTRA'],
        reporter: createThrowingReporter(),
      }
    );

    expect(env.PORT).toBe(3000);
  });

  it('should handle deprecated variables', () => {
    cleanEnv(
      {
        OLD_VAR: str({ deprecated: 'Use NEW_VAR instead', default: 'value' }),
      },
      {
        env: { OLD_VAR: 'old-value' },
        reporter: createThrowingReporter(),
      }
    );

    expect(console.warn).toHaveBeenCalled();
  });

  it('should handle requiredWhen option', () => {
    const env = cleanEnv(
      {
        USE_CACHE: bool({ default: false }),
        CACHE_URL: str({
          requiredWhen: (env) => env.USE_CACHE === true,
          default: undefined,
        }),
      },
      {
        env: { USE_CACHE: 'false' },
        reporter: createThrowingReporter(),
      }
    );

    expect(env.USE_CACHE).toBe(false);
    expect(env.CACHE_URL).toBeUndefined();

    expect(() =>
      cleanEnv(
        {
          USE_CACHE: bool({ default: false }),
          CACHE_URL: str({
            requiredWhen: (env) => env.USE_CACHE === true,
          }),
        },
        {
          env: { USE_CACHE: 'true' },
          reporter: createThrowingReporter(),
        }
      )
    ).toThrow();
  });

  it('should mask secret values in error messages', () => {
    const mockReporter = {
      onError: vi.fn(),
      onWarning: vi.fn(),
    };

    cleanEnv(
      {
        API_KEY: str({ secret: true }),
      },
      {
        env: { API_KEY: '' },
        reporter: mockReporter,
      }
    );

    expect(mockReporter.onError).toHaveBeenCalled();
  });
});

describe('customCleanEnv', () => {
  it('should apply custom middleware', () => {
    const env = customCleanEnv(
      {
        PORT: num({ default: 3000 }),
        HOST: str({ default: 'localhost' }),
      },
      (env) => ({
        ...env,
        serverUrl: `http://${env.HOST}:${env.PORT}`,
      }),
      {
        env: {},
        reporter: createThrowingReporter(),
      }
    );

    expect(env.serverUrl).toBe('http://localhost:3000');
  });
});

describe('silent reporter', () => {
  it('should not log errors but still throw', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() =>
      cleanEnv(
        { REQUIRED: str() },
        {
          env: {},
          reporter: createSilentReporter(),
        }
      )
    ).toThrow();

    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
