// ============================================================================
// Volt Code AGI - Server Constants
// ============================================================================

import { DEFAULT_AGENT_CONFIGS } from '../../shared/types';

const parseEnvIntWithBounds = (
  rawValue: string | undefined,
  fallback: number,
  min: number,
  max: number
): number => {
  const parsed = Number.parseInt(rawValue ?? '', 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
};

// Server Configuration
export const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  SOCKET_IO_CORS_ORIGIN: process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:5173',
} as const;

// Agent Configuration
export const AGENT_CONFIG = {
  HEARTBEAT_INTERVAL_MS: parseEnvIntWithBounds(process.env.AGENT_HEARTBEAT_INTERVAL_MS, 10000, 1000, 60000),
  OFFLINE_TIMEOUT_MS: parseEnvIntWithBounds(process.env.AGENT_OFFLINE_TIMEOUT_MS, 60000, 5000, 300000),
  MAX_TASKS_PER_AGENT: 10,
  DEFAULT_AGENTS: DEFAULT_AGENT_CONFIGS,
} as const;

// GitHub Configuration
export const GITHUB_CONFIG = {
  TOKEN: process.env.GITHUB_TOKEN || '',
  API_URL: 'https://api.github.com',
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  SCAN_INTERVAL_MS: parseEnvIntWithBounds(process.env.SECURITY_SCAN_INTERVAL_MS, 3600000, 60000, 86400000), // 1 hour
  MAX_VULNERABILITIES_PER_SCAN: 100,
} as const;

// API Rate Limiting
export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 1000,
} as const;
