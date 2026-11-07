// ============================================================================
// Volt Code AGI - Supabase Configuration
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is required in environment variables');
}

if (!supabaseKey) {
  throw new Error('SUPABASE_ANON_KEY or SUPABASE_SERVICE_KEY is required in environment variables');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'volt-code-agi/server',
    },
  },
});

// Database table names
export const DB_TABLES = {
  AGENTS: 'agents',
  TASKS: 'tasks',
  MESSAGES: 'agent_messages',
  COLLABORATIONS: 'collaborations',
  VULNERABILITIES: 'vulnerabilities',
  DEPENDENCY_UPDATES: 'dependency_updates',
} as const;

// Initialize database schema (run on startup)
export async function initializeDatabase(): Promise<void> {
  try {
    // Check if tables exist
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', DB_TABLES.AGENTS);

    if (error || !data?.length) {
      console.log('Database tables not found. Please create them using the schema.sql file.');
    } else {
      console.log('✅ Database tables verified');
    }
  } catch (err) {
    console.warn('Could not verify database schema:', err);
  }
}

// Generate unique IDs
export function generateId(prefix: string = 'agent'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
