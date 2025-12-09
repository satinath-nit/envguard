export type ValidatorType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'email'
  | 'url'
  | 'host'
  | 'port'
  | 'json'
  | 'array'
  | 'uuid'
  | 'regex'
  | 'enum'
  | 'duration'
  | 'bytes';

export interface ValidatorOptions<T> {
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

export interface StringValidatorOptions extends ValidatorOptions<string> {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  trim?: boolean;
  toLowerCase?: boolean;
  toUpperCase?: boolean;
}

export interface NumberValidatorOptions extends ValidatorOptions<number> {
  min?: number;
  max?: number;
  integer?: boolean;
}

export interface ArrayValidatorOptions<T> extends ValidatorOptions<T[]> {
  separator?: string;
  itemValidator?: Validator<T>;
  minItems?: number;
  maxItems?: number;
  unique?: boolean;
}

export interface JsonValidatorOptions<T> extends ValidatorOptions<T> {
  schema?: (value: unknown) => value is T;
}

export interface DurationValidatorOptions extends ValidatorOptions<number> {
  unit?: 'ms' | 's' | 'm' | 'h' | 'd';
}

export interface BytesValidatorOptions extends ValidatorOptions<number> {
  unit?: 'B' | 'KB' | 'MB' | 'GB' | 'TB';
}

export interface RegexValidatorOptions extends ValidatorOptions<string> {
  pattern: RegExp;
}

export interface EnumValidatorOptions<T extends string> extends ValidatorOptions<T> {
  values: readonly T[];
}

export interface Validator<T> {
  _type: ValidatorType;
  _outputType: T;
  _options: ValidatorOptions<T>;
  parse: (value: string | undefined, key: string, env: Record<string, string | undefined>) => T;
}

export interface ValidatorSpec {
  [key: string]: Validator<unknown>;
}

export type InferEnvType<T extends ValidatorSpec> = {
  [K in keyof T]: T[K]['_outputType'];
};

export interface EnvGuardOptions {
  env?: Record<string, string | undefined>;
  reporter?: Reporter;
  strict?: boolean;
  warnOnExtra?: boolean;
  allowedExtra?: string[];
}

export interface ValidationError {
  key: string;
  message: string;
  value?: string;
  isWarning?: boolean;
}

export interface Reporter {
  onError: (errors: ValidationError[]) => void;
  onWarning?: (warnings: ValidationError[]) => void;
  onSuccess?: (env: Record<string, unknown>) => void;
}

export interface GenerateExampleOptions {
  outputPath?: string;
  includeDescriptions?: boolean;
  includeExamples?: boolean;
  includeDocs?: boolean;
  groupByPrefix?: boolean;
}

export class EnvError extends Error {
  constructor(
    message: string,
    public readonly key: string,
    public readonly value?: string
  ) {
    super(message);
    this.name = 'EnvError';
  }
}

export class EnvMissingError extends EnvError {
  constructor(key: string) {
    super(`Missing required environment variable: ${key}`, key);
    this.name = 'EnvMissingError';
  }
}

export class EnvValidationError extends EnvError {
  constructor(key: string, message: string, value?: string) {
    super(`Invalid value for ${key}: ${message}`, key, value);
    this.name = 'EnvValidationError';
  }
}
