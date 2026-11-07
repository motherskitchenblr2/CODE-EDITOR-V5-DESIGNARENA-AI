// ============================================================================
// Volt Code AGI - MultiAgent Types (Server-specific)
// ============================================================================

import {
  AgentConfig,
  AgentType,
  AgentTab,
  AgentStatus,
  AgentTask,
  AgentMessage,
  AgentState,
  TaskPriority,
  TaskStatus,
} from '../../../shared/types';

// Re-export shared types
export type {
  AgentConfig,
  AgentType,
  AgentTab,
  AgentStatus,
  AgentTask,
  AgentMessage,
  AgentState,
  TaskPriority,
  TaskStatus,
};

export { AgentType, AgentTab, AgentStatus, TaskPriority, TaskStatus };

// ==========================================================================
// Agent Base Class
// ==========================================================================

export interface AgentContext {
  io: any; // Socket.io server
  supabase: any; // Supabase client
  orchestrator: any; // MultiAgentOrchestrator
  config: AgentConfig;
}

export abstract class BaseAgent {
  protected ctx: AgentContext;
  public id: string;
  public type: AgentType;
  public tab: AgentTab;
  public status: AgentStatus;
  public currentTask: AgentTask | null;

  constructor(ctx: AgentContext) {
    this.ctx = ctx;
    this.id = ctx.config.id;
    this.type = ctx.config.type;
    this.tab = ctx.config.tab;
    this.status = 'idle';
    this.currentTask = null;
  }

  abstract initialize(): Promise<void>;
  abstract executeTask(task: AgentTask): Promise<void>;
  abstract handleMessage(message: AgentMessage): Promise<void>;
  abstract cleanup(): Promise<void>;

  protected sendMessage(to: string, content: string, taskId?: string): Promise<void> {
    const message: Omit<AgentMessage, 'id' | 'timestamp' | 'read'> = {
      from: this.id,
      to,
      content,
      taskId: taskId || null,
      tab: this.tab,
    };
    return this.ctx.orchestrator.sendMessage(message);
  }

  protected updateStatus(status: AgentStatus): void {
    this.status = status;
    this.ctx.orchestrator.setAgentStatus(this.id, status);
  }

  protected updateHeartbeat(): void {
    this.ctx.orchestrator.updateAgentHeartbeat(this.id, this.currentTask);
  }

  protected completeTask(taskId: string, result?: unknown): Promise<boolean> {
    return this.ctx.orchestrator.completeTask(taskId, result);
  }

  protected failTask(taskId: string, errorMessage: string): Promise<boolean> {
    return this.ctx.orchestrator.failTask(taskId, errorMessage);
  }
}

// ==========================================================================
// Agent Factory
// ==========================================================================

export interface AgentFactory {
  createAgent(type: AgentType, ctx: AgentContext): BaseAgent;
}

// ==========================================================================
// Agent Event Types
// ==========================================================================

export interface AgentEvent {
  type: string;
  payload: unknown;
  timestamp: number;
  agentId: string;
}

export type AgentEventHandler = (event: AgentEvent) => Promise<void>;

// ==========================================================================
// Agent Capabilities
// ==========================================================================

export interface AgentCapabilities {
  canHandleTask: (task: AgentTask) => boolean;
  canCollaborate: (agentType: AgentType) => boolean;
  supportsTab: (tab: AgentTab) => boolean;
}
