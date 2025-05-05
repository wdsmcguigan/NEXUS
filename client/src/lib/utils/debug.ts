/**
 * Debug utilities for NEXUS.email
 * 
 * Provides consistent and configurable debugging functions.
 */

// Debug levels
export enum DebugLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5
}

// Current debug level - can be set via localStorage or env var
const DEBUG_LEVEL_KEY = 'nexus-debug-level';
let currentDebugLevel = DebugLevel.INFO;

// Try to get debug level from localStorage if available
try {
  const storedLevel = localStorage.getItem(DEBUG_LEVEL_KEY);
  if (storedLevel !== null) {
    currentDebugLevel = Number(storedLevel);
  }
} catch (error) {
  // Ignore errors when localStorage is not available
}

/**
 * Set the current debug level
 */
export function setDebugLevel(level: DebugLevel): void {
  currentDebugLevel = level;
  
  // Persist to localStorage if available
  try {
    localStorage.setItem(DEBUG_LEVEL_KEY, level.toString());
  } catch (error) {
    // Ignore errors when localStorage is not available
  }
}

/**
 * Get the current debug level
 */
export function getDebugLevel(): DebugLevel {
  return currentDebugLevel;
}

/**
 * Log a debug message at the specified level
 */
export function logAtLevel(
  level: DebugLevel, 
  module: string, 
  message: string, 
  ...args: any[]
): void {
  if (level <= currentDebugLevel) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${module}]`;
    
    switch (level) {
      case DebugLevel.ERROR:
        console.error(prefix, message, ...args);
        break;
      case DebugLevel.WARN:
        console.warn(prefix, message, ...args);
        break;
      case DebugLevel.INFO:
        console.info(prefix, message, ...args);
        break;
      case DebugLevel.DEBUG:
      case DebugLevel.TRACE:
      default:
        console.log(prefix, message, ...args);
        break;
    }
  }
}

/**
 * Log a standard debug message (level: DEBUG)
 */
export function debugLog(module: string, message: string, ...args: any[]): void {
  logAtLevel(DebugLevel.DEBUG, module, message, ...args);
}

/**
 * Log an informational message (level: INFO)
 */
export function infoLog(module: string, message: string, ...args: any[]): void {
  logAtLevel(DebugLevel.INFO, module, message, ...args);
}

/**
 * Log a warning message (level: WARN)
 */
export function warnLog(module: string, message: string, ...args: any[]): void {
  logAtLevel(DebugLevel.WARN, module, message, ...args);
}

/**
 * Log an error message (level: ERROR)
 */
export function errorLog(module: string, message: string, ...args: any[]): void {
  logAtLevel(DebugLevel.ERROR, module, message, ...args);
}

/**
 * Log a trace message (level: TRACE)
 */
export function traceLog(module: string, message: string, ...args: any[]): void {
  logAtLevel(DebugLevel.TRACE, module, message, ...args);
}

/**
 * Create a logger for a specific module
 */
export function createLogger(module: string) {
  return {
    debug: (message: string, ...args: any[]) => debugLog(module, message, ...args),
    info: (message: string, ...args: any[]) => infoLog(module, message, ...args),
    warn: (message: string, ...args: any[]) => warnLog(module, message, ...args),
    error: (message: string, ...args: any[]) => errorLog(module, message, ...args),
    trace: (message: string, ...args: any[]) => traceLog(module, message, ...args)
  };
}

export default {
  DebugLevel,
  setDebugLevel,
  getDebugLevel,
  debugLog,
  infoLog,
  warnLog,
  errorLog,
  traceLog,
  createLogger
};