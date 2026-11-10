// ============================================================================
// Volt Code AGI - MultiAgentOrchestrator
// ============================================================================

import { Server } from 'socket.io';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  AgentState,
  AgentTask,
  AgentConfig,
  AgentType,
  AgentTab,
  AgentStatus,
  TaskPriority,
  TaskStatus,
  AgentMessage,
  AgentCollaboration,
  AgentHeartbeatPayload,
  AgentStatusUpdatePayload,
  TaskAssignmentPayload,
  DEFAULT_AGENT_CONFIGS,
} from '../../../shared/types';
import { AGENT_CONFIG } from '../../config/constants';
import { generateId } from '../../config/supabase';

// ==========================================================================
// MultiAgentOrchestrator Class
// ==========================================================================

export class MultiAgentOrchestrator {
  private io: Server;
  private supabase: SupabaseClient;
  private agents: Map<string, AgentState>;
  private tasks: Map<string, AgentTask>;
  private messages: AgentMessage[];
  private collaborations: Map<string, AgentCollaboration>;
  private taskQueue: AgentTask[];
  private heartbeatInterval: NodeJS.Timeout;
  private offlineCheckInterval: NodeJS.Timeout;

  constructor(io: Server, supabase: SupabaseClient) {
    this.io = io;
    this.supabase = supabase;
    this.agents = new Map();
    this.tasks = new Map();
    this.messages = [];
    this.collaborations = new Map();
    this.taskQueue = [];

    // Initialize agents from configuration
    this.initializeAgents();

    // Start heartbeat monitoring
    this.startHeartbeatMonitoring();

    // Start offline detection
    this.startOfflineDetection();

    // Register Socket.io handlers
    this.registerSocketHandlers();
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  private initializeAgents(): void {
    DEFAULT_AGENT_CONFIGS.forEach((config) => {
      const agentState: AgentState = {
        id: config.id,
        type: config.type,
        tab: config.tab,
        status: 'offline',
        currentTask: null,
        tasks: [],
        health: {
          agentId: config.id,
          status: 'offline',
          lastHeartbeat: 0,
          currentTaskId: null,
          tasksCompleted: 0,
          tasksFailed: 0,
        },
        config,
      };
      this.agents.set(config.id, agentState);

      // Load from database if exists
      this.loadAgentFromDatabase(config.id).catch(console.error);
    });
  }

  private async loadAgentFromDatabase(agentId: string): Promise<void> {
    try {
      const { data } = await this.supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (data) {
        const agent = this.agents.get(agentId);
        if (agent) {
          agent.status = data.status as AgentStatus;
          agent.health.status = data.status as AgentStatus;
          agent.health.lastHeartbeat = data.updated_at
            ? new Date(data.updated_at).getTime()
            : 0;
        }
      }
    } catch (err) {
      console.error(`Failed to load agent ${agentId} from database:`, err);
    }
  }

  // ==========================================================================
  // Heartbeat Monitoring
  // ==========================================================================

  private startHeartbeatMonitoring(): void {
    this.heartbeatInterval = setInterval(() => {
      this.agents.forEach((agent) => {
        // Simulate heartbeat for testing
        if (agent.config.isActive && agent.status !== 'offline') {
          this.updateAgentHeartbeat(agent.id);
        }
      });
    }, AGENT_CONFIG.HEARTBEAT_INTERVAL_MS);
  }

  private startOfflineDetection(): void {
    this.offlineCheckInterval = setInterval(() => {
      const now = Date.now();
      const offlineThreshold = now - AGENT_CONFIG.OFFLINE_TIMEOUT_MS;

      this.agents.forEach((agent, agentId) => {
        if (agent.health.lastHeartbeat < offlineThreshold && agent.status !== 'offline') {
          this.setAgentStatus(agentId, 'offline');
        }
      });
    }, 10000); // Check every 10 seconds
  }

  // ==========================================================================
  // Agent Management
  // ==========================================================================

  public async registerAgent(config: AgentConfig): Promise<AgentState> {
    const agentState: AgentState = {
      id: config.id,
      type: config.type,
      tab: config.tab,
      status: 'idle',
      currentTask: null,
      tasks: [],
      health: {
        agentId: config.id,
        status: 'idle',
        lastHeartbeat: Date.now(),
        currentTaskId: null,
        tasksCompleted: 0,
        tasksFailed: 0,
      },
      config,
    };

    this.agents.set(config.id, agentState);

    // Store in database
    try {
      await this.supabase.from('agents').upsert({
        id: config.id,
        type: config.type,
        tab: config.tab,
        status: 'idle',
        config,
        current_task_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to save agent to database:', err);
    }

    this.broadcastAgentStatus(config.id);
    return agentState;
  }

  public getAgent(agentId: string): AgentState | undefined {
    return this.agents.get(agentId);
  }

  public getAgentsByType(type: AgentType): AgentState[] {
    return Array.from(this.agents.values()).filter((agent) => agent.type === type);
  }

  public getAgentsByTab(tab: AgentTab): AgentState[] {
    return Array.from(this.agents.values()).filter((agent) => agent.tab === tab);
  }

  public getAllAgents(): AgentState[] {
    return Array.from(this.agents.values());
  }

  public setAgentStatus(agentId: string, status: AgentStatus): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.status = status;
    agent.health.status = status;
    agent.health.lastHeartbeat = Date.now();

    // Update in database
    this.supabase.from('agents').update({
      status,
      updated_at: new Date().toISOString(),
    }).eq('id', agentId).catch(console.error);

    this.broadcastAgentStatus(agentId);
  }

  public updateAgentHeartbeat(agentId: string, task: AgentTask | null = null): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.health.lastHeartbeat = Date.now();
    if (task) {
      agent.health.currentTaskId = task.id;
    }

    // Update in database
    this.supabase.from('agents').update({
      status: agent.status,
      current_task_id: task?.id || null,
      updated_at: new Date().toISOString(),
    }).eq('id', agentId).catch(console.error);

    this.broadcastAgentStatus(agentId);
  }

  // ==========================================================================
  // Task Management
  // ==========================================================================

  public async createTask(taskData: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    tab?: AgentTab;
    createdBy?: string;
    collaborationContextId?: string | null;
  }): Promise<AgentTask> {
    const task: AgentTask = {
      id: generateId('task'),
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      status: 'pending',
      agentId: null,
      agentType: null,
      assignedAt: null,
      startedAt: null,
      completedAt: null,
      failedAt: null,
      errorMessage: null,
      result: null,
      createdBy: taskData.createdBy || 'user',
      createdAt: Date.now(),
      tab: taskData.tab || 'editor',
      collaborationContextId: taskData.collaborationContextId || null,
    };

    this.tasks.set(task.id, task);
    this.taskQueue.push(task);

    // Store in database
    try {
      await this.supabase.from('tasks').insert({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        agent_id: null,
        agent_type: null,
        assigned_at: null,
        started_at: null,
        completed_at: null,
        failed_at: null,
        error_message: null,
        result: null,
        created_by: task.createdBy,
        created_at: new Date(task.createdAt).toISOString(),
        tab: task.tab,
        collaboration_context_id: task.collaborationContextId,
      });
    } catch (err) {
      console.error('Failed to save task to database:', err);
    }

    // Auto-assign if possible
    this.autoAssignTask(task);

    return task;
  }

  public getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  public getAllTasks(): AgentTask[] {
    return Array.from(this.tasks.values());
  }

  public getTasksByStatus(status: TaskStatus): AgentTask[] {
    return Array.from(this.tasks.values()).filter((task) => task.status === status);
  }

  public getTasksByAgent(agentId: string): AgentTask[] {
    return Array.from(this.tasks.values()).filter((task) => task.agentId === agentId);
  }

  public async assignTask(taskId: string, agentId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    const agent = this.agents.get(agentId);

    if (!task || !agent) {
      return false;
    }

    // Check if agent can take more tasks
    const agentTasks = this.getTasksByAgent(agentId);
    const inProgressTasks = agentTasks.filter(
      (t) => t.status === 'in-progress' || t.status === 'assigned'
    );

    if (inProgressTasks.length >= agent.config.maxTasks) {
      return false;
    }

    // Update task
    task.status = 'assigned';
    task.agentId = agentId;
    task.agentType = agent.type;
    task.assignedAt = Date.now();

    // Update agent
    agent.status = 'busy';
    agent.currentTask = task;
    agent.health.status = 'busy';
    agent.health.currentTaskId = task.id;

    // Update in database
    try {
      await this.supabase.from('tasks').update({
        status: 'assigned',
        agent_id: agentId,
        agent_type: agent.type,
        assigned_at: new Date().toISOString(),
      }).eq('id', taskId);

      await this.supabase.from('agents').update({
        status: 'busy',
        current_task_id: task.id,
        updated_at: new Date().toISOString(),
      }).eq('id', agentId);
    } catch (err) {
      console.error('Failed to update task/agent in database:', err);
    }

    this.broadcastAgentStatus(agentId);
    this.broadcastTaskUpdate(task);

    return true;
  }

  public async startTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task || !task.agentId) {
      return false;
    }

    task.status = 'in-progress';
    task.startedAt = Date.now();

    const agent = this.agents.get(task.agentId);
    if (agent) {
      agent.health.status = 'busy';
    }

    // Update in database
    try {
      await this.supabase.from('tasks').update({
        status: 'in-progress',
        started_at: new Date().toISOString(),
      }).eq('id', taskId);
    } catch (err) {
      console.error('Failed to update task in database:', err);
    }

    this.broadcastTaskUpdate(task);
    return true;
  }

  public async completeTask(taskId: string, result: unknown = null): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task || !task.agentId) {
      return false;
    }

    task.status = 'completed';
    task.completedAt = Date.now();
    task.result = result;

    const agent = this.agents.get(task.agentId);
    if (agent) {
      agent.status = 'idle';
      agent.currentTask = null;
      agent.health.status = 'idle';
      agent.health.currentTaskId = null;
      agent.health.tasksCompleted++;
    }

    // Update in database
    try {
      await this.supabase.from('tasks').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result,
      }).eq('id', taskId);

      await this.supabase.from('agents').update({
        status: 'idle',
        current_task_id: null,
        updated_at: new Date().toISOString(),
      }).eq('id', task.agentId);
    } catch (err) {
      console.error('Failed to update task/agent in database:', err);
    }

    this.broadcastAgentStatus(task.agentId);
    this.broadcastTaskUpdate(task);

    // Auto-assign next task
    this.autoAssignTask();

    return true;
  }

  public async failTask(taskId: string, errorMessage: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task || !task.agentId) {
      return false;
    }

    task.status = 'failed';
    task.failedAt = Date.now();
    task.errorMessage = errorMessage;

    const agent = this.agents.get(task.agentId);
    if (agent) {
      agent.status = 'idle';
      agent.currentTask = null;
      agent.health.status = 'idle';
      agent.health.currentTaskId = null;
      agent.health.tasksFailed++;
    }

    // Update in database
    try {
      await this.supabase.from('tasks').update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        error_message: errorMessage,
      }).eq('id', taskId);

      await this.supabase.from('agents').update({
        status: 'idle',
        current_task_id: null,
        updated_at: new Date().toISOString(),
      }).eq('id', task.agentId);
    } catch (err) {
      console.error('Failed to update task/agent in database:', err);
    }

    this.broadcastAgentStatus(task.agentId);
    this.broadcastTaskUpdate(task);

    // Auto-assign next task
    this.autoAssignTask();

    return true;
  }

  // ==========================================================================
  // Auto-Assignment
  // ==========================================================================

  private autoAssignTask(task?: AgentTask): void {
    // If a specific task is provided, use it
    const taskToAssign = task || this.taskQueue.shift();
    if (!taskToAssign) return;

    // Find best agent for this task
    const bestAgent = this.findBestAgent(taskToAssign);
    if (!bestAgent) {
      // Put back in queue if no agent available
      this.taskQueue.unshift(taskToAssign);
      return;
    }

    // Assign task
    this.assignTask(taskToAssign.id, bestAgent.id).catch(console.error);
  }

  private findBestAgent(task: AgentTask): AgentState | null {
    // Filter agents by type and tab if specified
    let candidates = Array.from(this.agents.values()).filter((agent) => {
      // Match tab
      if (task.tab && agent.tab !== task.tab) {
        return false;
      }

      // Agent must be idle or have capacity
      if (agent.status !== 'idle') {
        const agentTasks = this.getTasksByAgent(agent.id);
        const inProgress = agentTasks.filter(
          (t) => t.status === 'in-progress' || t.status === 'assigned'
        );
        if (inProgress.length >= agent.config.maxTasks) {
          return false;
        }
      }

      return true;
    });

    // If no candidates, return null
    if (candidates.length === 0) {
      return null;
    }

    // Sort by least loaded (fewest tasks)
    candidates.sort((a, b) => {
      const aTasks = this.getTasksByAgent(a.id).length;
      const bTasks = this.getTasksByAgent(b.id).length;
      return aTasks - bTasks;
    });

    // Return the least loaded agent
    return candidates[0];
  }

  // ==========================================================================
  // Messaging
  // ==========================================================================

  public async sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp' | 'read'>): Promise<AgentMessage> {
    const newMessage: AgentMessage = {
      id: generateId('msg'),
      ...message,
      timestamp: Date.now(),
      read: false,
    };

    this.messages.push(newMessage);

    // Store in database
    try {
      await this.supabase.from('agent_messages').insert({
        id: newMessage.id,
        from_id: newMessage.from,
        to_id: newMessage.to,
        content: newMessage.content,
        task_id: newMessage.taskId,
        tab: newMessage.tab,
        timestamp: new Date(newMessage.timestamp).toISOString(),
        read: false,
        metadata: null,
      });
    } catch (err) {
      console.error('Failed to save message to database:', err);
    }

    // Broadcast message
    this.broadcastMessage(newMessage);

    return newMessage;
  }

  private broadcastMessage(message: AgentMessage): void {
    if (message.to === 'all') {
      this.io.emit('agent:message', message);
    } else {
      // Send to specific agent
      this.io.to(message.to).emit('agent:message', message);
    }
  }

  // ==========================================================================
  // Collaboration
  // ==========================================================================

  public async createCollaboration(collaborationData: {
    name: string;
    description?: string;
    agentIds: string[];
    sharedContext?: Record<string, unknown>;
    createdBy?: string;
  }): Promise<AgentCollaboration> {
    const collaboration: AgentCollaboration = {
      id: generateId('collab'),
      name: collaborationData.name,
      description: collaborationData.description || '',
      agentIds: collaborationData.agentIds,
      sharedContext: collaborationData.sharedContext || {},
      createdBy: collaborationData.createdBy || 'user',
      createdAt: Date.now(),
      status: 'active',
    };

    this.collaborations.set(collaboration.id, collaboration);

    // Store in database
    try {
      await this.supabase.from('collaborations').insert({
        id: collaboration.id,
        name: collaboration.name,
        description: collaboration.description,
        agent_ids: collaboration.agentIds,
        shared_context: collaboration.sharedContext,
        created_by: collaboration.createdBy,
        created_at: new Date(collaboration.createdAt).toISOString(),
        status: 'active',
      });
    } catch (err) {
      console.error('Failed to save collaboration to database:', err);
    }

    this.io.emit('collaboration:update', collaboration);
    return collaboration;
  }

  public getCollaboration(id: string): AgentCollaboration | undefined {
    return this.collaborations.get(id);
  }

  public getAllCollaborations(): AgentCollaboration[] {
    return Array.from(this.collaborations.values());
  }

  // ==========================================================================
  // Broadcasting
  // ==========================================================================

  private broadcastAgentStatus(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const payload: AgentStatusUpdatePayload = {
      agentId: agent.id,
      agentType: agent.type,
      status: agent.status,
      currentTask: agent.currentTask,
      tab: agent.tab,
      timestamp: Date.now(),
    };

    this.io.emit('agent:status:update', payload);
  }

  private broadcastTaskUpdate(task: AgentTask): void {
    if (task.agentId) {
      const payload: TaskAssignmentPayload = {
        taskId: task.id,
        agentId: task.agentId,
        agentType: task.agentType!,
        task,
      };
      this.io.emit('agent:task:assigned', payload);
    }
  }

  // ==========================================================================
  // Socket.io Handlers
  // ==========================================================================

  private registerSocketHandlers(): void {
    // These are already registered in server/index.ts
    // This method is for additional orchestrator-specific handlers
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  public getSystemStats() {
    const totalAgents = this.agents.size;
    const onlineAgents = Array.from(this.agents.values()).filter(
      (agent) => agent.status !== 'offline'
    ).length;
    const totalTasks = this.tasks.size;
    const completedTasks = Array.from(this.tasks.values()).filter(
      (task) => task.status === 'completed'
    ).length;
    const pendingTasks = Array.from(this.tasks.values()).filter(
      (task) => task.status === 'pending'
    ).length;

    return {
      totalAgents,
      onlineAgents,
      totalTasks,
      completedTasks,
      pendingTasks,
      totalMessages: this.messages.length,
      activeCollaborations: Array.from(this.collaborations.values()).filter(
        (c) => c.status === 'active'
      ).length,
    };
  }

  public getAgentStats(agentId: string) {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    const agentTasks = this.getTasksByAgent(agentId);
    const completedTasks = agentTasks.filter((task) => task.status === 'completed').length;
    const failedTasks = agentTasks.filter((task) => task.status === 'failed').length;
    const pendingTasks = agentTasks.filter((task) => task.status === 'pending').length;
    const inProgressTasks = agentTasks.filter(
      (task) => task.status === 'in-progress' || task.status === 'assigned'
    ).length;

    return {
      agentId: agent.id,
      type: agent.type,
      status: agent.status,
      totalTasks: agentTasks.length,
      completedTasks,
      failedTasks,
      pendingTasks,
      inProgressTasks,
      tasksCompleted: agent.health.tasksCompleted,
      tasksFailed: agent.health.tasksFailed,
      currentTask: agent.currentTask,
    };
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  public destroy(): void {
    clearInterval(this.heartbeatInterval);
    clearInterval(this.offlineCheckInterval);
  }
}

// ==========================================================================
// Singleton Instance
// ==========================================================================

let orchestrator: MultiAgentOrchestrator | null = null;

export function getOrchestrator(io?: Server, supabase?: SupabaseClient): MultiAgentOrchestrator {
  if (!orchestrator && io && supabase) {
    orchestrator = new MultiAgentOrchestrator(io, supabase);
  }
  if (!orchestrator) {
    throw new Error('Orchestrator not initialized. Call initializeAgents() first.');
  }
  return orchestrator;
}

export function setOrchestrator(instance: MultiAgentOrchestrator): void {
  orchestrator = instance;
}

export function initializeAgents(io: Server, supabase: SupabaseClient): MultiAgentOrchestrator {
  orchestrator = new MultiAgentOrchestrator(io, supabase);
  return orchestrator;
}
