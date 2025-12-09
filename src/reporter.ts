/* eslint-disable no-console */
import { ValidationError, Reporter } from './types.js';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

function colorize(text: string, color: keyof typeof COLORS): string {
  if (typeof process !== 'undefined' && process.env['NO_COLOR'] !== undefined) {
    return text;
  }
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function formatError(error: ValidationError, isWarning: boolean): string {
  const prefix = isWarning
    ? colorize('WARNING', 'yellow')
    : colorize('ERROR', 'red');
  
  const key = colorize(error.key, 'cyan');
  const message = error.message;
  
  let output = `  ${prefix}: ${key} - ${message}`;
  
  if (error.value !== undefined) {
    const maskedValue = error.value.length > 20
      ? `${error.value.substring(0, 10)}...${error.value.substring(error.value.length - 5)}`
      : error.value;
    output += colorize(` (received: "${maskedValue}")`, 'dim');
  }
  
  return output;
}

function formatHeader(title: string, count: number): string {
  return colorize(`\n${title} (${count}):`, 'bold');
}

export const defaultReporter: Reporter = {
  onError: (errors: ValidationError[]): void => {
    const warnings = errors.filter(e => e.isWarning === true);
    const actualErrors = errors.filter(e => e.isWarning !== true);
    
    if (warnings.length > 0) {
      console.error(formatHeader('Environment Variable Warnings', warnings.length));
      for (const warning of warnings) {
        console.error(formatError(warning, true));
      }
    }
    
    if (actualErrors.length > 0) {
      console.error(formatHeader('Environment Variable Errors', actualErrors.length));
      for (const error of actualErrors) {
        console.error(formatError(error, false));
      }
      console.error('');
      
      if (typeof process !== 'undefined' && typeof process.exit === 'function') {
        process.exit(1);
      } else {
        throw new Error(`Environment validation failed with ${actualErrors.length} error(s)`);
      }
    }
  },
  
  onWarning: (warnings: ValidationError[]): void => {
    if (warnings.length > 0) {
      console.warn(formatHeader('Environment Variable Warnings', warnings.length));
      for (const warning of warnings) {
        console.warn(formatError(warning, true));
      }
      console.warn('');
    }
  },
  
  onSuccess: (_env: Record<string, unknown>): void => {
    // Silent by default
  },
};

export function createSilentReporter(): Reporter {
  return {
    onError: (errors: ValidationError[]): void => {
      const actualErrors = errors.filter(e => e.isWarning !== true);
      if (actualErrors.length > 0) {
        throw new Error(`Environment validation failed: ${actualErrors.map(e => e.key).join(', ')}`);
      }
    },
  };
}

export function createThrowingReporter(): Reporter {
  return {
    onError: (errors: ValidationError[]): void => {
      const actualErrors = errors.filter(e => e.isWarning !== true);
      if (actualErrors.length > 0) {
        const message = actualErrors
          .map(e => `${e.key}: ${e.message}`)
          .join('\n');
        throw new Error(`Environment validation failed:\n${message}`);
      }
    },
    onWarning: (warnings: ValidationError[]): void => {
      if (warnings.length > 0) {
        console.warn(`Environment warnings: ${warnings.map(w => w.key).join(', ')}`);
      }
    },
  };
}
