import {
  ValidatorSpec,
  InferEnvType,
  EnvGuardOptions,
  ValidationError,
  EnvError,
} from './types.js';
import { defaultReporter } from './reporter.js';
import { maskSecret, isProduction, isDevelopment, isTest } from './utils.js';

type EnvGuardResult<T extends ValidatorSpec> = InferEnvType<T> & {
  readonly isProduction: boolean;
  readonly isDevelopment: boolean;
  readonly isTest: boolean;
};

export function cleanEnv<T extends ValidatorSpec>(
  spec: T,
  options: EnvGuardOptions = {}
): EnvGuardResult<T> {
  const {
    env = typeof process !== 'undefined' ? process.env : {},
    reporter = defaultReporter,
    strict = false,
    warnOnExtra = false,
    allowedExtra = [],
  } = options;
  
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const result: Record<string, unknown> = {};
  const specKeys = new Set(Object.keys(spec));
  
  const allowedExtraSet = new Set([
    ...allowedExtra,
    'NODE_ENV',
    'PATH',
    'HOME',
    'USER',
    'SHELL',
    'TERM',
    'LANG',
    'LC_ALL',
    'TZ',
    'PWD',
    'OLDPWD',
    'HOSTNAME',
    'LOGNAME',
    '_',
  ]);
  
  for (const [key, validator] of Object.entries(spec)) {
    const value = env[key];
    const opts = validator._options;
    
    if (opts.deprecated !== undefined && value !== undefined && value !== '') {
      warnings.push({
        key,
        message: `Deprecated: ${opts.deprecated}`,
        value: opts.secret === true ? maskSecret(value) : value,
        isWarning: true,
      });
    }
    
    if (opts.requiredWhen !== undefined) {
      const isRequired = opts.requiredWhen(result);
      if (!isRequired && (value === undefined || value === '')) {
        result[key] = opts.default;
        continue;
      }
    }
    
    try {
      const parsed = validator.parse(value, key, env);
      result[key] = parsed;
    } catch (error) {
      if (error instanceof EnvError) {
        const errorValue = opts.secret === true ? maskSecret(error.value) : error.value;
        const validationError: ValidationError = {
          key,
          message: error.message,
          isWarning: opts.warnOnly === true,
        };
        if (errorValue !== undefined) {
          validationError.value = errorValue;
        }
        
        if (opts.warnOnly === true) {
          warnings.push(validationError);
          result[key] = opts.default;
        } else {
          errors.push(validationError);
        }
      } else {
        throw error;
      }
    }
  }
  
  if (warnOnExtra || strict) {
    for (const key of Object.keys(env)) {
      if (!specKeys.has(key) && !allowedExtraSet.has(key) && !key.startsWith('npm_')) {
        const warning: ValidationError = {
          key,
          message: 'Unknown environment variable',
          isWarning: !strict,
        };
        
        if (strict) {
          errors.push(warning);
        } else {
          warnings.push(warning);
        }
      }
    }
  }
  
  if (warnings.length > 0 && reporter.onWarning !== undefined) {
    reporter.onWarning(warnings);
  }
  
  if (errors.length > 0) {
    reporter.onError(errors);
  }
  
  if (errors.length === 0 && reporter.onSuccess !== undefined) {
    reporter.onSuccess(result);
  }
  
  const finalResult = Object.freeze({
    ...result,
    isProduction: isProduction(env),
    isDevelopment: isDevelopment(env),
    isTest: isTest(env),
  }) as EnvGuardResult<T>;
  
  return createEnvProxy(finalResult, spec);
}

function createEnvProxy<T extends ValidatorSpec>(
  env: EnvGuardResult<T>,
  spec: T
): EnvGuardResult<T> {
  const specKeys = new Set([...Object.keys(spec), 'isProduction', 'isDevelopment', 'isTest']);
  
  return new Proxy(env, {
    get(target, prop: string | symbol): unknown {
      if (typeof prop === 'symbol') {
        return Reflect.get(target, prop);
      }
      
      if (!specKeys.has(prop) && !(prop in target)) {
        // eslint-disable-next-line no-console
        console.warn(`[envguard] Accessing undefined environment variable: ${prop}`);
      }
      
      return Reflect.get(target, prop);
    },
    
    set(_target, prop: string | symbol): boolean {
      throw new Error(`Cannot modify environment variable: ${String(prop)}`);
    },
    
    deleteProperty(_target, prop: string | symbol): boolean {
      throw new Error(`Cannot delete environment variable: ${String(prop)}`);
    },
    
    defineProperty(_target, prop: string | symbol): boolean {
      throw new Error(`Cannot define environment variable: ${String(prop)}`);
    },
    
    ownKeys(target): (string | symbol)[] {
      return Reflect.ownKeys(target);
    },
    
    has(target, prop: string | symbol): boolean {
      return Reflect.has(target, prop);
    },
    
    getOwnPropertyDescriptor(target, prop: string | symbol): PropertyDescriptor | undefined {
      const descriptor = Reflect.getOwnPropertyDescriptor(target, prop);
      if (descriptor !== undefined) {
        return { ...descriptor, enumerable: true };
      }
      return undefined;
    },
  });
}

export function customCleanEnv<T extends ValidatorSpec, R>(
  spec: T,
  middleware: (env: InferEnvType<T>, rawEnv: Record<string, string | undefined>) => R,
  options: EnvGuardOptions = {}
): R {
  const env = cleanEnv(spec, options);
  const rawEnv = options.env ?? (typeof process !== 'undefined' ? process.env : {});
  return middleware(env, rawEnv);
}
