// ============================================================================
// Volt Code AGI - Socket Context Types
// ============================================================================

import { Socket } from 'socket.io-client';
import {
  AgentStatus,
  AgentType,
  AgentTab,
  AgentTask,
  AgentMessage,
  TaskPriority,
  TaskStatus,
  AgentStatusUpdatePayload,
  AgentMessagePayload,
  TaskAssignmentPayload,
  AgentHeartbeatPayload,
  VulnerabilityFoundPayload,
  DependencyUpdatePayload,
  AgentState,
  AgentConfig,
} from '../../shared/types';

// ==========================================================================
// Socket Event Types
// ==========================================================================

// Client-to-Server events
export interface ClientSocketEvents {
  'agent:register': (config: AgentConfig) => void;
  'agent:message': (payload: AgentMessagePayload) => void;
  'agent:task:create': (task: Omit<AgentTask, 'id' | 'createdAt' | 'assignedAt' | 'startedAt' | 'completedAt' | 'failedAt' | 'agentId' | 'agentType' | 'status' | 'errorMessage' | 'result'>) => void;
  'agent:task:assign': (payload: { taskId: string; agentId: string }) => void;
  'agent:task:update': (payload: { taskId: string; updates: Partial<AgentTask> }) => void;
  'agent:heartbeat': (payload: AgentHeartbeatPayload) => void;
  'agents:list': () => void;
  'tasks:list': () => void;
  'messages:list': () => void;
  'collaboration:create': (collaboration: Omit<import('../../shared/types').AgentCollaboration, 'id' | 'createdAt' | 'status'>) => void;
}

// Server-to-Client events
export interface ServerSocketEvents {
  'agent:status:update': (payload: AgentStatusUpdatePayload) => void;
  'agent:message': (payload: AgentMessagePayload) => void;
  'agent:task:assigned': (payload: TaskAssignmentPayload) => void;
  'agent:heartbeat': (payload: AgentHeartbeatPayload) => void;
  'agent:vulnerability:found': (payload: VulnerabilityFoundPayload) => void;
  'agent:dependency:update': (payload: DependencyUpdatePayload) => void;
  'agents:list': (agents: AgentState[]) => void;
  'tasks:list': (tasks: AgentTask[]) => void;
  'messages:list': (messages: AgentMessage[]) => void;
  'collaboration:update': (collaboration: import('../../shared/types').AgentCollaboration) => void;
  'error': (error: { message: string; code?: string }) => void;
  connect: () => void;
  disconnect: () => void;
  connect_error: (error: Error) => void;
}

// Socket Data
export interface SocketData {
  userId?: string;
  sessionId?: string;
}

// ==========================================================================
// Context Types
// ==========================================================================

// Agent Status Update Callback
export type AgentStatusUpdateCallback = (payload: AgentStatusUpdatePayload) => void;

// Agent Message Callback
export type AgentMessageCallback = (payload: AgentMessagePayload) => void;

// Task Assignment Callback
export type TaskAssignmentCallback = (payload: TaskAssignmentPayload) => void;

// Agent Heartbeat Callback
export type AgentHeartbeatCallback = (payload: AgentHeartbeatPayload) => void;

// Vulnerability Found Callback
export type VulnerabilityFoundCallback = (payload: VulnerabilityFoundPayload) => void;

// Dependency Update Callback
export type DependencyUpdateCallback = (payload: DependencyUpdatePayload) => void;

// Agents List Callback
export type AgentsListCallback = (agents: AgentState[]) => void;

// Tasks List Callback
export type TasksListCallback = (tasks: AgentTask[]) => void;

// Messages List Callback
export type MessagesListCallback = (messages: AgentMessage[]) => void;

// Collaboration Update Callback
export type CollaborationUpdateCallback = (collaboration: import('../../shared/types').AgentCollaboration) => void;

// Error Callback
export type ErrorCallback = (error: { message: string; code?: string }) => void;

// Connection Callback
export type ConnectionCallback = () => void;

// Disconnect Callback
export type DisconnectCallback = () => void;

// ==========================================================================
// Socket Context Value
// ==========================================================================

export interface SocketContextValue {
  // Socket instance
  socket: Socket<ServerSocketEvents, ClientSocketEvents> | null;
  
  // Connection status
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Agents
  agents: AgentState[];
  
  // Tasks
  tasks: AgentTask[];
  
  // Messages
  messages: AgentMessage[];
  
  // Subscriptions
  onAgentStatusUpdate: (callback: AgentStatusUpdateCallback) => void;
  offAgentStatusUpdate: (callback: AgentStatusUpdateCallback) => void;
  
  onAgentMessage: (callback: AgentMessageCallback) => void;
  offAgentMessage: (callback: AgentMessageCallback) => void;
  
  onTaskAssigned: (callback: TaskAssignmentCallback) => void;
  offTaskAssigned: (callback: TaskAssignmentCallback) => void;
  
  onAgentHeartbeat: (callback: AgentHeartbeatCallback) => void;
  offAgentHeartbeat: (callback: AgentHeartbeatCallback) => void;
  
  onVulnerabilityFound: (callback: VulnerabilityFoundCallback) => void;
  offVulnerabilityFound: (callback: VulnerabilityFoundCallback) => void;
  
  onDependencyUpdate: (callback: DependencyUpdateCallback) => void;
  offDependencyUpdate: (callback: DependencyUpdateCallback) => void;
  
  onAgentsList: (callback: AgentsListCallback) => void;
  offAgentsList: (callback: AgentsListCallback) => void;
  
  onTasksList: (callback: TasksListCallback) => void;
  offTasksList: (callback: TasksListCallback) => void;
  
  onMessagesList: (callback: MessagesListCallback) => void;
  offMessagesList: (callback: MessagesListCallback) => void;
  
  onCollaborationUpdate: (callback: CollaborationUpdateCallback) => void;
  offCollaborationUpdate: (callback: CollaborationUpdateCallback) => void;
  
  onError: (callback: ErrorCallback) => void;
  offError: (callback: ErrorCallback) => void;
  
  onConnect: (callback: ConnectionCallback) => void;
  offConnect: (callback: ConnectionCallback) => void;
  
  onDisconnect: (callback: DisconnectCallback) => void;
  offDisconnect: (callback: DisconnectCallback) => void;
  
  // Emit functions
  emitAgentMessage: (payload: AgentMessagePayload) => void;
  emitAgentTaskCreate: (task: Omit<AgentTask, 'id' | 'createdAt' | 'assignedAt' | 'startedAt' | 'completedAt' | 'failedAt' | 'agentId' | 'agentType' | 'status' | 'errorMessage' | 'result'>) => void;
  emitAgentTaskAssign: (taskId: string, agentId: string) => void;
  emitAgentHeartbeat: (payload: AgentHeartbeatPayload) => void;
  emitAgentsList: () => void;
  emitTasksList: () => void;
  emitMessagesList: () => void;
  
  // Agent management
  getAgentById: (id: string) => AgentState | undefined;
  getAgentByType: (type: AgentType) => AgentState | undefined;
  getAgentsByTab: (tab: AgentTab) => AgentState[];
  getAgentsByStatus: (status: AgentStatus) => AgentState[];
  
  // Task management
  getTaskById: (id: string) => AgentTask | undefined;
  getTasksByStatus: (status: TaskStatus) => AgentTask[];
  getTasksByAgent: (agentId: string) => AgentTask[];
  getTasksByPriority: (priority: TaskPriority) => AgentTask[];
  
  // Message management
  getMessagesByAgent: (agentId: string) => AgentMessage[];
  getMessagesByTask: (taskId: string) => AgentMessage[];
}

// ==========================================================================
// Helper Types
// ==========================================================================

export interface AgentStats {
  total: number;
  online: number;
  byTab: Record<AgentTab, number>;
  byStatus: Record<AgentStatus, number>;
  byType: Record<AgentType, number>;
}

export interface TaskStats {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  byTab: Record<AgentTab, number>;
}

export interface SystemStats {
  agents: AgentStats;
  tasks: TaskStats;
  messages: number;
  vulnerabilities: number;
  dependencyUpdates: number;
}
