import {
  Validator,
  ValidatorOptions,
  StringValidatorOptions,
  NumberValidatorOptions,
  ArrayValidatorOptions,
  JsonValidatorOptions,
  DurationValidatorOptions,
  BytesValidatorOptions,
  RegexValidatorOptions,
  EnumValidatorOptions,
  EnvValidationError,
  EnvMissingError,
} from './types.js';

function createValidator<T, O extends ValidatorOptions<T>>(
  type: Validator<T>['_type'],
  options: O,
  parser: (value: string, key: string, env: Record<string, string | undefined>) => T
): Validator<T> {
  return {
    _type: type,
    _outputType: undefined as unknown as T,
    _options: options,
    parse: (value: string | undefined, key: string, env: Record<string, string | undefined>): T => {
      if (value === undefined || value === '') {
        const nodeEnv = env['NODE_ENV'] ?? 'development';
        
        if (options.testDefault !== undefined && nodeEnv === 'test') {
          return options.testDefault;
        }
        if (options.devDefault !== undefined && nodeEnv !== 'production') {
          return options.devDefault;
        }
        if (options.default !== undefined) {
          return options.default;
        }
        throw new EnvMissingError(key);
      }
      return parser(value, key, env);
    },
  };
}

export function str(options: StringValidatorOptions = {}): Validator<string> {
  return createValidator('string', options, (value, key) => {
    let result = value;
    
    if (options.trim === true) {
      result = result.trim();
    }
    if (options.toLowerCase === true) {
      result = result.toLowerCase();
    }
    if (options.toUpperCase === true) {
      result = result.toUpperCase();
    }
    
    if (options.minLength !== undefined && result.length < options.minLength) {
      throw new EnvValidationError(key, `must be at least ${options.minLength} characters`, value);
    }
    if (options.maxLength !== undefined && result.length > options.maxLength) {
      throw new EnvValidationError(key, `must be at most ${options.maxLength} characters`, value);
    }
    if (options.pattern !== undefined && !options.pattern.test(result)) {
      throw new EnvValidationError(key, `must match pattern ${options.pattern.toString()}`, value);
    }
    if (options.choices !== undefined && !options.choices.includes(result)) {
      throw new EnvValidationError(key, `must be one of: ${options.choices.join(', ')}`, value);
    }
    
    return result;
  });
}

export function num(options: NumberValidatorOptions = {}): Validator<number> {
  return createValidator('number', options, (value, key) => {
    const parsed = Number(value);
    
    if (Number.isNaN(parsed)) {
      throw new EnvValidationError(key, 'must be a valid number', value);
    }
    if (options.integer === true && !Number.isInteger(parsed)) {
      throw new EnvValidationError(key, 'must be an integer', value);
    }
    if (options.min !== undefined && parsed < options.min) {
      throw new EnvValidationError(key, `must be at least ${options.min}`, value);
    }
    if (options.max !== undefined && parsed > options.max) {
      throw new EnvValidationError(key, `must be at most ${options.max}`, value);
    }
    if (options.choices !== undefined && !options.choices.includes(parsed)) {
      throw new EnvValidationError(key, `must be one of: ${options.choices.join(', ')}`, value);
    }
    
    return parsed;
  });
}

export function bool(options: ValidatorOptions<boolean> = {}): Validator<boolean> {
  const trueValues = new Set(['1', 'true', 't', 'yes', 'y', 'on']);
  const falseValues = new Set(['0', 'false', 'f', 'no', 'n', 'off']);
  
  return createValidator('boolean', options, (value, key) => {
    const lower = value.toLowerCase();
    
    if (trueValues.has(lower)) {
      return true;
    }
    if (falseValues.has(lower)) {
      return false;
    }
    
    throw new EnvValidationError(
      key,
      'must be a boolean value (1, 0, true, false, yes, no, on, off)',
      value
    );
  });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function email(options: ValidatorOptions<string> = {}): Validator<string> {
  return createValidator('email', options, (value, key) => {
    if (!EMAIL_REGEX.test(value)) {
      throw new EnvValidationError(key, 'must be a valid email address', value);
    }
    if (options.choices !== undefined && !options.choices.includes(value)) {
      throw new EnvValidationError(key, `must be one of: ${options.choices.join(', ')}`, value);
    }
    return value;
  });
}

const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

export function url(options: ValidatorOptions<string> = {}): Validator<string> {
  return createValidator('url', options, (value, key) => {
    if (!URL_REGEX.test(value)) {
      throw new EnvValidationError(key, 'must be a valid URL with protocol (http/https)', value);
    }
    if (options.choices !== undefined && !options.choices.includes(value)) {
      throw new EnvValidationError(key, `must be one of: ${options.choices.join(', ')}`, value);
    }
    return value;
  });
}

const HOSTNAME_REGEX = /^(?=.{1,253}$)(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)*(?!-)[A-Za-z0-9-]{1,63}(?<!-)$/;
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_REGEX = /^(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}|:(?::[0-9a-fA-F]{1,4}){1,7}|::)(?:%[0-9a-zA-Z]+)?$/;

export function host(options: ValidatorOptions<string> = {}): Validator<string> {
  return createValidator('host', options, (value, key) => {
    const isValid = HOSTNAME_REGEX.test(value) || IPV4_REGEX.test(value) || IPV6_REGEX.test(value);
    
    if (!isValid) {
      throw new EnvValidationError(key, 'must be a valid hostname or IP address', value);
    }
    if (options.choices !== undefined && !options.choices.includes(value)) {
      throw new EnvValidationError(key, `must be one of: ${options.choices.join(', ')}`, value);
    }
    return value;
  });
}

export function port(options: NumberValidatorOptions = {}): Validator<number> {
  return createValidator('port', { ...options, min: options.min ?? 1, max: options.max ?? 65535 }, (value, key) => {
    const parsed = Number(value);
    
    if (Number.isNaN(parsed) || !Number.isInteger(parsed)) {
      throw new EnvValidationError(key, 'must be a valid port number', value);
    }
    
    const min = options.min ?? 1;
    const max = options.max ?? 65535;
    
    if (parsed < min || parsed > max) {
      throw new EnvValidationError(key, `must be between ${min} and ${max}`, value);
    }
    if (options.choices !== undefined && !options.choices.includes(parsed)) {
      throw new EnvValidationError(key, `must be one of: ${options.choices.join(', ')}`, value);
    }
    
    return parsed;
  });
}

export function json<T = unknown>(options: JsonValidatorOptions<T> = {}): Validator<T> {
  return createValidator('json', options, (value, key) => {
    try {
      const parsed = JSON.parse(value) as unknown;
      
      if (options.schema !== undefined && !options.schema(parsed)) {
        throw new EnvValidationError(key, 'does not match expected schema', value);
      }
      
      return parsed as T;
    } catch (error) {
      if (error instanceof EnvValidationError) {
        throw error;
      }
      throw new EnvValidationError(key, 'must be valid JSON', value);
    }
  });
}

export function array<T = string>(options: ArrayValidatorOptions<T> = {}): Validator<T[]> {
  const separator = options.separator ?? ',';
  
  return createValidator('array', options, (value, key) => {
    const items = value.split(separator).map(item => item.trim()).filter(item => item !== '');
    
    if (options.minItems !== undefined && items.length < options.minItems) {
      throw new EnvValidationError(key, `must have at least ${options.minItems} items`, value);
    }
    if (options.maxItems !== undefined && items.length > options.maxItems) {
      throw new EnvValidationError(key, `must have at most ${options.maxItems} items`, value);
    }
    if (options.unique === true && new Set(items).size !== items.length) {
      throw new EnvValidationError(key, 'must have unique items', value);
    }
    
    if (options.itemValidator !== undefined) {
      return items.map((item, index) => {
        try {
          return options.itemValidator!.parse(item, `${key}[${index}]`, {});
        } catch (error) {
          if (error instanceof Error) {
            throw new EnvValidationError(key, `item ${index}: ${error.message}`, value);
          }
          throw error;
        }
      });
    }
    
    return items as T[];
  });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function uuid(options: ValidatorOptions<string> = {}): Validator<string> {
  return createValidator('uuid', options, (value, key) => {
    if (!UUID_REGEX.test(value)) {
      throw new EnvValidationError(key, 'must be a valid UUID', value);
    }
    if (options.choices !== undefined && !options.choices.includes(value)) {
      throw new EnvValidationError(key, `must be one of: ${options.choices.join(', ')}`, value);
    }
    return value.toLowerCase();
  });
}

export function regex(options: RegexValidatorOptions): Validator<string> {
  return createValidator('regex', options, (value, key) => {
    if (!options.pattern.test(value)) {
      throw new EnvValidationError(key, `must match pattern ${options.pattern.toString()}`, value);
    }
    if (options.choices !== undefined && !options.choices.includes(value)) {
      throw new EnvValidationError(key, `must be one of: ${options.choices.join(', ')}`, value);
    }
    return value;
  });
}

export function enumValidator<T extends string>(options: EnumValidatorOptions<T>): Validator<T> {
  return createValidator('enum', options, (value, key) => {
    if (!options.values.includes(value as T)) {
      throw new EnvValidationError(key, `must be one of: ${options.values.join(', ')}`, value);
    }
    return value as T;
  });
}

const DURATION_UNITS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

const DURATION_REGEX = /^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)?$/i;

export function duration(options: DurationValidatorOptions = {}): Validator<number> {
  const outputUnit = options.unit ?? 'ms';
  
  return createValidator('duration', options, (value, key) => {
    const match = DURATION_REGEX.exec(value);
    
    if (match === null) {
      throw new EnvValidationError(key, 'must be a valid duration (e.g., 100ms, 5s, 2m, 1h, 7d)', value);
    }
    
    const amount = parseFloat(match[1]!);
    const unit = (match[2] ?? 'ms').toLowerCase();
    
    const msValue = amount * DURATION_UNITS[unit]!;
    const result = msValue / DURATION_UNITS[outputUnit]!;
    
    if (options.choices !== undefined && !options.choices.includes(result)) {
      throw new EnvValidationError(key, `must be one of: ${options.choices.join(', ')}`, value);
    }
    
    return result;
  });
}

const BYTES_UNITS: Record<string, number> = {
  b: 1,
  kb: 1024,
  mb: 1024 * 1024,
  gb: 1024 * 1024 * 1024,
  tb: 1024 * 1024 * 1024 * 1024,
};

const BYTES_REGEX = /^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb|tb)?$/i;

export function bytes(options: BytesValidatorOptions = {}): Validator<number> {
  const outputUnit = (options.unit ?? 'B').toLowerCase();
  
  return createValidator('bytes', options, (value, key) => {
    const match = BYTES_REGEX.exec(value);
    
    if (match === null) {
      throw new EnvValidationError(key, 'must be a valid byte size (e.g., 100B, 5KB, 2MB, 1GB)', value);
    }
    
    const amount = parseFloat(match[1]!);
    const unit = (match[2] ?? 'b').toLowerCase();
    
    const byteValue = amount * BYTES_UNITS[unit]!;
    const result = byteValue / BYTES_UNITS[outputUnit]!;
    
    if (options.choices !== undefined && !options.choices.includes(result)) {
      throw new EnvValidationError(key, `must be one of: ${options.choices.join(', ')}`, value);
    }
    
    return result;
  });
}

export function makeValidator<T>(
  parser: (value: string, key: string) => T,
  type: Validator<T>['_type'] = 'string'
): (options?: ValidatorOptions<T>) => Validator<T> {
  return (options: ValidatorOptions<T> = {}): Validator<T> => {
    return createValidator(type, options, (value, key) => {
      const result = parser(value, key);
      
      if (options.choices !== undefined && !options.choices.includes(result)) {
        throw new EnvValidationError(key, `must be one of: ${options.choices.join(', ')}`, value);
      }
      
      return result;
    });
  };
}
