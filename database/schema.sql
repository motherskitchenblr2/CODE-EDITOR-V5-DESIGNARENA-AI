-- ============================================================================
-- Volt Code AGI - Supabase Database Schema
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==========================================================================
-- Agents Table
-- ==========================================================================

CREATE TABLE IF NOT EXISTS agents (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  type VARCHAR(50) NOT NULL,
  tab VARCHAR(50) NOT NULL CHECK (tab IN ('editor', 'github', 'dashboard')),
  status VARCHAR(50) NOT NULL DEFAULT 'offline' CHECK (status IN ('idle', 'busy', 'error', 'offline')),
  config JSONB NOT NULL,
  current_task_id VARCHAR(255) REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for agents
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type);
CREATE INDEX IF NOT EXISTS idx_agents_tab ON agents(tab);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

-- ==========================================================================
-- Tasks Table
-- ==========================================================================

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in-progress', 'completed', 'failed', 'cancelled')),
  agent_id VARCHAR(255) REFERENCES agents(id) ON DELETE SET NULL,
  agent_type VARCHAR(50),
  assigned_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  result JSONB,
  created_by VARCHAR(255) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tab VARCHAR(50) NOT NULL DEFAULT 'editor' CHECK (tab IN ('editor', 'github', 'dashboard')),
  collaboration_context_id VARCHAR(255) REFERENCES collaborations(id) ON DELETE SET NULL
);

-- Indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tab ON tasks(tab);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- ==========================================================================
-- Agent Messages Table
-- ==========================================================================

CREATE TABLE IF NOT EXISTS agent_messages (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  from_id VARCHAR(255) NOT NULL,
  to_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  task_id VARCHAR(255) REFERENCES tasks(id) ON DELETE CASCADE,
  tab VARCHAR(50) NOT NULL DEFAULT 'editor' CHECK (tab IN ('editor', 'github', 'dashboard')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT false,
  metadata JSONB
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_from_id ON agent_messages(from_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_id ON agent_messages(to_id);
CREATE INDEX IF NOT EXISTS idx_messages_task_id ON agent_messages(task_id);
CREATE INDEX IF NOT EXISTS idx_messages_tab ON agent_messages(tab);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON agent_messages(timestamp);

-- ==========================================================================
-- Collaborations Table
-- ==========================================================================

CREATE TABLE IF NOT EXISTS collaborations (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  agent_ids VARCHAR(255)[] NOT NULL,
  shared_context JSONB,
  created_by VARCHAR(255) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed'))
);

-- Indexes for collaborations
CREATE INDEX IF NOT EXISTS idx_collaborations_status ON collaborations(status);
CREATE INDEX IF NOT EXISTS idx_collaborations_created_at ON collaborations(created_at);

-- ==========================================================================
-- Vulnerabilities Table
-- ==========================================================================

CREATE TABLE IF NOT EXISTS vulnerabilities (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  task_id VARCHAR(255) REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id VARCHAR(255) REFERENCES agents(id) ON DELETE CASCADE,
  cve VARCHAR(100) NOT NULL,
  package_name VARCHAR(255) NOT NULL,
  package_version VARCHAR(100) NOT NULL,
  fixed_version VARCHAR(100),
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  description TEXT,
  fix_available BOOLEAN DEFAULT true,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for vulnerabilities
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_cve ON vulnerabilities(cve);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_package_name ON vulnerabilities(package_name);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_severity ON vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_timestamp ON vulnerabilities(timestamp);

-- ==========================================================================
-- Dependency Updates Table
-- ==========================================================================

CREATE TABLE IF NOT EXISTS dependency_updates (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  task_id VARCHAR(255) REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id VARCHAR(255) REFERENCES agents(id) ON DELETE CASCADE,
  package_name VARCHAR(255) NOT NULL,
  current_version VARCHAR(100) NOT NULL,
  target_version VARCHAR(100) NOT NULL,
  risk_level VARCHAR(50) NOT NULL CHECK (risk_level IN ('critical', 'high', 'medium', 'low')),
  changelog TEXT,
  breaking_changes BOOLEAN DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for dependency updates
CREATE INDEX IF NOT EXISTS idx_dependency_updates_package_name ON dependency_updates(package_name);
CREATE INDEX IF NOT EXISTS idx_dependency_updates_risk_level ON dependency_updates(risk_level);
CREATE INDEX IF NOT EXISTS idx_dependency_updates_timestamp ON dependency_updates(timestamp);

-- ==========================================================================
-- Update timestamps trigger
-- ==========================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to agents table
DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================================
-- Row Level Security (RLS) Policies
-- ==========================================================================

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependency_updates ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for security)
-- These are example policies - customize based on your security requirements

-- Agents: Allow read access to all, write access to authenticated users
CREATE POLICY "Allow read access to agents" ON agents
  FOR SELECT USING (true);

CREATE POLICY "Allow insert on agents" ON agents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update on agents" ON agents
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete on agents" ON agents
  FOR DELETE USING (true);

-- Tasks: Similar policies
CREATE POLICY "Allow read access to tasks" ON tasks
  FOR SELECT USING (true);

CREATE POLICY "Allow insert on tasks" ON tasks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update on tasks" ON tasks
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete on tasks" ON tasks
  FOR DELETE USING (true);

-- Messages: Allow read/write for all
CREATE POLICY "Allow read access to messages" ON agent_messages
  FOR SELECT USING (true);

CREATE POLICY "Allow insert on messages" ON agent_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update on messages" ON agent_messages
  FOR UPDATE USING (true) WITH CHECK (true);

-- Collaborations
CREATE POLICY "Allow read access to collaborations" ON collaborations
  FOR SELECT USING (true);

CREATE POLICY "Allow insert on collaborations" ON collaborations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update on collaborations" ON collaborations
  FOR UPDATE USING (true) WITH CHECK (true);

-- Vulnerabilities
CREATE POLICY "Allow read access to vulnerabilities" ON vulnerabilities
  FOR SELECT USING (true);

CREATE POLICY "Allow insert on vulnerabilities" ON vulnerabilities
  FOR INSERT WITH CHECK (true);

-- Dependency updates
CREATE POLICY "Allow read access to dependency_updates" ON dependency_updates
  FOR SELECT USING (true);

CREATE POLICY "Allow insert on dependency_updates" ON dependency_updates
  FOR INSERT WITH CHECK (true);

-- ==========================================================================
-- Insert sample data (optional - for testing)
-- ==========================================================================

-- Uncomment the following section to insert sample data for testing

-- INSERT INTO agents (id, type, tab, status, config) VALUES
-- ('editor-agent-001', 'editor', 'editor', 'idle', '{"id": "editor-agent-001", "alias": "editor", "type": "editor", "tab": "editor", "model": "claude-opus-5.5", "maxTasks": 3, "description": "Code writing, refactoring, implementation", "isActive": true}'),
-- ('pr-agent-001', 'pr-agent', 'github', 'idle', '{"id": "pr-agent-001", "alias": "pr-agent", "type": "pr-agent", "tab": "github", "model": "claude-opus-5.5", "maxTasks": 5, "description": "Pull request lifecycle management", "isActive": true}'),
-- ('branch-conflict-agent-001', 'branch-conflict', 'github', 'idle', '{"id": "branch-conflict-agent-001", "alias": "branch-conflict", "type": "branch-conflict", "tab": "github", "model": "claude-opus-5.5", "maxTasks": 3, "description": "Branch management, merge conflict resolution", "isActive": true}'),
-- ('security-scan-agent-001', 'security-scan', 'editor', 'idle', '{"id": "security-scan-agent-001", "alias": "security-scan", "type": "security-scan", "tab": "editor", "model": "claude-opus-5.5", "maxTasks": 2, "description": "CVE scanning, security patching", "isActive": true}'),
-- ('code-monitor-agent-001', 'code-monitor', 'editor', 'idle', '{"id": "code-monitor-agent-001", "alias": "code-monitor", "type": "code-monitor", "tab": "editor", "model": "claude-fable-5.1", "maxTasks": 5, "description": "Code quality, telemetry, drift detection", "isActive": true}'),
-- ('bug-fix-agent-001', 'bug-fix', 'github', 'idle', '{"id": "bug-fix-agent-001", "alias": "bug-fix", "type": "bug-fix", "tab": "github", "model": "claude-opus-5.5", "maxTasks": 3, "description": "Bug triage, reproduction, fix implementation", "isActive": true}'),
-- ('dependency-agent-001', 'dependency-update', 'github', 'idle', '{"id": "dependency-agent-001", "alias": "dependency-update", "type": "dependency-update", "tab": "github", "model": "claude-fable-5.1", "maxTasks": 3, "description": "Dependency updates, security patches", "isActive": true}'),
-- ('orchestrator-agent-001', 'orchestrator', 'dashboard', 'idle', '{"id": "orchestrator-agent-001", "alias": "orchestrator", "type": "orchestrator", "tab": "dashboard", "model": "claude-opus-5.5", "maxTasks": 10, "description": "Coordinates all agents", "isActive": true}');

-- ==========================================================================
-- Comments
-- ==========================================================================

-- This schema creates all the necessary tables for Volt Code AGI
-- To use this schema:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to SQL Editor
-- 3. Paste and run this entire file
-- 4. Alternatively, use the Supabase CLI: supabase db push

-- For production use:
-- - Review and adjust RLS policies based on your security requirements
-- - Consider adding more indexes based on your query patterns
-- - Add constraints and validations as needed
-- - Consider partitioning large tables by timestamp
