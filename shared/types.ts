// ============================================================================
// Volt Code AGI - Shared Types
// ============================================================================

import { Socket } from 'socket.io';

// ==========================================================================
// Agent Types
// ==========================================================================

export type AgentTab = 'editor' | 'github' | 'dashboard';

export type AgentStatus = 'idle' | 'busy' | 'error' | 'offline';

export type AgentType =
  | 'editor'
  | 'pr-agent'
  | 'branch-conflict'
  | 'security-scan'
  | 'code-monitor'
  | 'bug-fix'
  | 'dependency-update'
  | 'orchestrator';

// ==========================================================================
// Agent Configuration
// ==========================================================================

export interface AgentConfig {
  id: string;
  alias: string;
  type: AgentType;
  tab: AgentTab;
  model: string;
  maxTasks: number;
  description: string;
  isActive: boolean;
}

// Default agent configurations
export const DEFAULT_AGENT_CONFIGS: AgentConfig[] = [
  {
    id: 'editor-agent-001',
    alias: 'editor',
    type: 'editor',
    tab: 'editor',
    model: 'claude-opus-5.5',
    maxTasks: 3,
    description: 'Code writing, refactoring, implementation',
    isActive: true,
  },
  {
    id: 'pr-agent-001',
    alias: 'pr-agent',
    type: 'pr-agent',
    tab: 'github',
    model: 'claude-opus-5.5',
    maxTasks: 5,
    description: 'Pull request lifecycle management',
    isActive: true,
  },
  {
    id: 'branch-conflict-agent-001',
    alias: 'branch-conflict',
    type: 'branch-conflict',
    tab: 'github',
    model: 'claude-opus-5.5',
    maxTasks: 3,
    description: 'Branch management, merge conflict resolution',
    isActive: true,
  },
  {
    id: 'security-scan-agent-001',
    alias: 'security-scan',
    type: 'security-scan',
    tab: 'editor',
    model: 'claude-opus-5.5',
    maxTasks: 2,
    description: 'CVE scanning, security patching',
    isActive: true,
  },
  {
    id: 'code-monitor-agent-001',
    alias: 'code-monitor',
    type: 'code-monitor',
    tab: 'editor',
    model: 'claude-fable-5.1',
    maxTasks: 5,
    description: 'Code quality, telemetry, drift detection',
    isActive: true,
  },
  {
    id: 'bug-fix-agent-001',
    alias: 'bug-fix',
    type: 'bug-fix',
    tab: 'github',
    model: 'claude-opus-5.5',
    maxTasks: 3,
    description: 'Bug triage, reproduction, fix implementation',
    isActive: true,
  },
  {
    id: 'dependency-agent-001',
    alias: 'dependency-update',
    type: 'dependency-update',
    tab: 'github',
    model: 'claude-fable-5.1',
    maxTasks: 3,
    description: 'Dependency updates, security patches',
    isActive: true,
  },
  {
    id: 'orchestrator-agent-001',
    alias: 'orchestrator',
    type: 'orchestrator',
    tab: 'dashboard',
    model: 'claude-opus-5.5',
    maxTasks: 10,
    description: 'Coordinates all agents',
    isActive: true,
  },
];

// ==========================================================================
// Agent State
// ==========================================================================

export interface AgentHealth {
  agentId: string;
  status: AgentStatus;
  lastHeartbeat: number;
  currentTaskId: string | null;
  tasksCompleted: number;
  tasksFailed: number;
}

export interface AgentState {
  id: string;
  type: AgentType;
  tab: AgentTab;
  status: AgentStatus;
  currentTask: AgentTask | null;
  tasks: AgentTask[];
  health: AgentHealth;
  config: AgentConfig;
}

// ==========================================================================
// Tasks
// ==========================================================================

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type TaskStatus = 'pending' | 'assigned' | 'in-progress' | 'completed' | 'failed' | 'cancelled';

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  agentId: string | null;
  agentType: AgentType | null;
  assignedAt: number | null;
  startedAt: number | null;
  completedAt: number | null;
  failedAt: number | null;
  errorMessage: string | null;
  result: unknown;
  createdBy: string;
  createdAt: number;
  tab: AgentTab;
  collaborationContextId: string | null;
}

// ==========================================================================
// Messaging
// ==========================================================================

export interface AgentMessage {
  id: string;
  from: string; // agentId or 'user'
  to: string; // agentId or 'all' or 'user'
  content: string;
  taskId: string | null;
  tab: AgentTab;
  timestamp: number;
  read: boolean;
  metadata?: Record<string, unknown>;
}

// ==========================================================================
// Collaboration
// ==========================================================================

export interface AgentCollaboration {
  id: string;
  name: string;
  description: string;
  agentIds: string[];
  sharedContext: Record<string, unknown>;
  createdAt: number;
  createdBy: string;
  status: 'active' | 'completed' | 'failed';
}

// ==========================================================================
// Security & Dependencies
// ==========================================================================

export interface VulnerabilityAlert {
  id: string;
  taskId: string;
  agentId: string;
  cve: string;
  packageName: string;
  packageVersion: string;
  fixedVersion: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  fixAvailable: boolean;
  timestamp: number;
}

export interface DependencyUpdate {
  id: string;
  taskId: string;
  agentId: string;
  packageName: string;
  currentVersion: string;
  targetVersion: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  changelog: string;
  breakingChanges: boolean;
  timestamp: number;
}

// ==========================================================================
// Socket.io Events
// ==========================================================================

// Event: Agent Status Update
export interface AgentStatusUpdatePayload {
  agentId: string;
  agentType: AgentType;
  status: AgentStatus;
  currentTask: AgentTask | null;
  tab: AgentTab;
  timestamp: number;
}

// Event: Agent Message
export interface AgentMessagePayload {
  id: string;
  from: string;
  to: string;
  content: string;
  taskId: string | null;
  tab: AgentTab;
  timestamp: number;
  read: boolean;
}

// Event: Task Assigned
export interface TaskAssignmentPayload {
  taskId: string;
  agentId: string;
  agentType: AgentType;
  task: AgentTask;
}

// Event: Agent Heartbeat
export interface AgentHeartbeatPayload {
  agentId: string;
  status: AgentStatus;
  currentTask: AgentTask | null;
  timestamp: number;
}

// Event: Vulnerability Found
export interface VulnerabilityFoundPayload {
  taskId: string;
  agentId: string;
  vulnerability: VulnerabilityAlert;
  timestamp: number;
}

// Event: Dependency Update
export interface DependencyUpdatePayload {
  taskId: string;
  agentId: string;
  update: DependencyUpdate;
  timestamp: number;
}

// Socket.io Event Types
export interface ServerToClientEvents {
  'agent:status:update': (payload: AgentStatusUpdatePayload) => void;
  'agent:message': (payload: AgentMessagePayload) => void;
  'agent:task:assigned': (payload: TaskAssignmentPayload) => void;
  'agent:heartbeat': (payload: AgentHeartbeatPayload) => void;
  'agent:vulnerability:found': (payload: VulnerabilityFoundPayload) => void;
  'agent:dependency:update': (payload: DependencyUpdatePayload) => void;
  'agents:list': (agents: AgentState[]) => void;
  'tasks:list': (tasks: AgentTask[]) => void;
  'messages:list': (messages: AgentMessage[]) => void;
  'collaboration:update': (collaboration: AgentCollaboration) => void;
  'error': (error: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  'agent:register': (config: AgentConfig) => void;
  'agent:message': (payload: AgentMessagePayload) => void;
  'agent:task:create': (task: Omit<AgentTask, 'id' | 'createdAt' | 'assignedAt' | 'startedAt' | 'completedAt' | 'failedAt' | 'agentId' | 'agentType' | 'status' | 'errorMessage' | 'result'>) => void;
  'agent:task:assign': (payload: { taskId: string; agentId: string }) => void;
  'agent:task:update': (payload: { taskId: string; updates: Partial<AgentTask> }) => void;
  'agent:heartbeat': (payload: AgentHeartbeatPayload) => void;
  'agents:list': () => void;
  'tasks:list': () => void;
  'messages:list': () => void;
  'collaboration:create': (collaboration: Omit<AgentCollaboration, 'id' | 'createdAt' | 'status'>) => void;
}

export interface InterServerEvents {
  // For multi-server setups
  'agent:broadcast': (payload: AgentStatusUpdatePayload) => void;
}

export interface SocketData {
  userId: string;
  sessionId: string;
}

export type AgentSocket = Socket<ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData>;

// ==========================================================================
// Database Types (Supabase)
// ==========================================================================

export interface DatabaseAgent {
  id: string;
  type: AgentType;
  tab: AgentTab;
  status: AgentStatus;
  config: AgentConfig;
  current_task_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  agent_id: string | null;
  agent_type: AgentType | null;
  assigned_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  result: unknown;
  created_by: string;
  created_at: string;
  tab: AgentTab;
  collaboration_context_id: string | null;
}

export interface DatabaseMessage {
  id: string;
  from_id: string;
  to_id: string;
  content: string;
  task_id: string | null;
  tab: AgentTab;
  timestamp: string;
  read: boolean;
  metadata: Record<string, unknown> | null;
}

// ==========================================================================
// Utility Types
// ==========================================================================

export interface SystemStats {
  totalAgents: number;
  onlineAgents: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalMessages: number;
  vulnerabilitiesFound: number;
  dependencyUpdates: number;
}

export interface AgentTabStats {
  editor: {
    agents: number;
    tasks: number;
    messages: number;
  };
  github: {
    agents: number;
    tasks: number;
    messages: number;
  };
  dashboard: {
    agents: number;
    tasks: number;
    messages: number;
  };
}
