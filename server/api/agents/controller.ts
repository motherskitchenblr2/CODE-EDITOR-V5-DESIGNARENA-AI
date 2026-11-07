// ============================================================================
// Volt Code AGI - Agent API Controller
// ============================================================================

import { Request, Response } from 'express';
import { supabase } from '../../config/supabase';
import { agents, tasks, messages, collaborations } from '../../index';
import {
  AgentState,
  AgentTask,
  AgentMessage,
  AgentCollaboration,
  AgentConfig,
  TaskStatus,
  TaskPriority,
  AgentTab,
  AgentType,
} from '../../../shared/types';

// ==========================================================================
// Agent Controllers
// ==========================================================================

export const getAllAgents = async (req: Request, res: Response) => {
  try {
    const agentList = Array.from(agents.values()).map((agent) => ({
      id: agent.id,
      type: agent.type,
      tab: agent.tab,
      status: agent.status,
      currentTask: agent.currentTask,
      tasks: agent.tasks,
      health: agent.health,
      config: agent.config,
    }));

    res.json({
      success: true,
      data: agentList,
      count: agentList.length,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};

export const getAgentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agent = agents.get(id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    res.json({
      success: true,
      data: agent,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};

export const getAgentsByTab = async (req: Request, res: Response) => {
  try {
    const { tab } = req.params;
    const validTabs: AgentTab[] = ['editor', 'github', 'dashboard'];

    if (!validTabs.includes(tab as AgentTab)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tab',
      });
    }

    const agentList = Array.from(agents.values())
      .filter((agent) => agent.tab === tab)
      .map((agent) => ({
        id: agent.id,
        type: agent.type,
        tab: agent.tab,
        status: agent.status,
        currentTask: agent.currentTask,
        config: agent.config,
      }));

    res.json({
      success: true,
      data: agentList,
      count: agentList.length,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents by tab',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};

export const getAgentsByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const validTypes: AgentType[] = [
      'editor',
      'pr-agent',
      'branch-conflict',
      'security-scan',
      'code-monitor',
      'bug-fix',
      'dependency-update',
      'orchestrator',
    ];

    if (!validTypes.includes(type as AgentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid agent type',
      });
    }

    const agentList = Array.from(agents.values())
      .filter((agent) => agent.type === type)
      .map((agent) => ({
        id: agent.id,
        type: agent.type,
        tab: agent.tab,
        status: agent.status,
        currentTask: agent.currentTask,
        config: agent.config,
      }));

    res.json({
      success: true,
      data: agentList,
      count: agentList.length,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents by type',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};

// ==========================================================================
// Task Controllers
// ==========================================================================

export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const { status, priority, agentId, tab, limit = 100, offset = 0 } = req.query;

    let taskList = Array.from(tasks.values());

    // Filter by status
    if (status && typeof status === 'string') {
      taskList = taskList.filter((task) => task.status === (status as TaskStatus));
    }

    // Filter by priority
    if (priority && typeof priority === 'string') {
      taskList = taskList.filter((task) => task.priority === (priority as TaskPriority));
    }

    // Filter by agent
    if (agentId && typeof agentId === 'string') {
      taskList = taskList.filter((task) => task.agentId === agentId);
    }

    // Filter by tab
    if (tab && typeof tab === 'string') {
      taskList = taskList.filter((task) => task.tab === (tab as AgentTab));
    }

    // Pagination
    const paginatedTasks = taskList.slice(
      Number(offset),
      Number(offset) + Number(limit)
    );

    res.json({
      success: true,
      data: paginatedTasks,
      count: taskList.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = tasks.get(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    res.json({
      success: true,
      data: task,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      priority = 'medium',
      tab = 'editor',
      createdBy = 'user',
      collaborationContextId = null,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required',
      });
    }

    const validPriorities: TaskPriority[] = ['critical', 'high', 'medium', 'low'];
    const validTabs: AgentTab[] = ['editor', 'github', 'dashboard'];

    if (!validPriorities.includes(priority as TaskPriority)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid priority',
      });
    }

    if (!validTabs.includes(tab as AgentTab)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tab',
      });
    }

    const task: AgentTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title,
      description: description || '',
      priority: priority as TaskPriority,
      status: 'pending',
      agentId: null,
      agentType: null,
      assignedAt: null,
      startedAt: null,
      completedAt: null,
      failedAt: null,
      errorMessage: null,
      result: null,
      createdBy,
      createdAt: Date.now(),
      tab: tab as AgentTab,
      collaborationContextId,
    };

    tasks.set(task.id, task);

    // Store in Supabase
    try {
      await supabase.from('tasks').insert({
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

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to create task',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = tasks.get(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    // Update task
    const updatedTask = { ...task, ...updates };
    tasks.set(id, updatedTask);

    // Update in Supabase
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.agentId !== undefined) dbUpdates.agent_id = updates.agentId;
      if (updates.agentType !== undefined) dbUpdates.agent_type = updates.agentType;
      if (updates.assignedAt !== undefined) dbUpdates.assigned_at = updates.assignedAt ? new Date(updates.assignedAt).toISOString() : null;
      if (updates.startedAt !== undefined) dbUpdates.started_at = updates.startedAt ? new Date(updates.startedAt).toISOString() : null;
      if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt ? new Date(updates.completedAt).toISOString() : null;
      if (updates.failedAt !== undefined) dbUpdates.failed_at = updates.failedAt ? new Date(updates.failedAt).toISOString() : null;
      if (updates.errorMessage !== undefined) dbUpdates.error_message = updates.errorMessage;
      if (updates.result !== undefined) dbUpdates.result = updates.result;

      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from('tasks').update(dbUpdates).eq('id', id);
      }
    } catch (err) {
      console.error('Failed to update task in database:', err);
    }

    res.json({
      success: true,
      data: updatedTask,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to update task',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = tasks.get(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    tasks.delete(id);

    // Delete from Supabase
    try {
      await supabase.from('tasks').delete().eq('id', id);
    } catch (err) {
      console.error('Failed to delete task from database:', err);
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete task',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};

// ==========================================================================
// Message Controllers
// ==========================================================================

export const getAllMessages = async (req: Request, res: Response) => {
  try {
    const { agentId, taskId, tab, limit = 100, offset = 0 } = req.query;

    let messageList = [...messages];

    // Filter by agent
    if (agentId && typeof agentId === 'string') {
      messageList = messageList.filter(
        (msg) => msg.from === agentId || msg.to === agentId
      );
    }

    // Filter by task
    if (taskId && typeof taskId === 'string') {
      messageList = messageList.filter((msg) => msg.taskId === taskId);
    }

    // Filter by tab
    if (tab && typeof tab === 'string') {
      messageList = messageList.filter((msg) => msg.tab === (tab as AgentTab));
    }

    // Pagination
    const paginatedMessages = messageList.slice(
      Number(offset),
      Number(offset) + Number(limit)
    );

    res.json({
      success: true,
      data: paginatedMessages,
      count: messageList.length,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};

export const getMessageById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const message = messages.find((msg) => msg.id === id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    res.json({
      success: true,
      data: message,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch message',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};

export const createMessage = async (req: Request, res: Response) => {
  try {
    const { from, to, content, taskId = null, tab = 'editor' } = req.body;

    if (!from || !content) {
      return res.status(400).json({
        success: false,
        error: 'From and content are required',
      });
    }

    const message: AgentMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      from,
      to: to || 'all',
      content,
      taskId,
      tab: tab as AgentTab,
      timestamp: Date.now(),
      read: false,
    };

    messages.push(message);

    // Store in Supabase
    try {
      await supabase.from('agent_messages').insert({
        id: message.id,
        from_id: message.from,
        to_id: message.to,
        content: message.content,
        task_id: message.taskId,
        tab: message.tab,
        timestamp: new Date(message.timestamp).toISOString(),
        read: false,
        metadata: null,
      });
    } catch (err) {
      console.error('Failed to save message to database:', err);
    }

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to create message',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};

export const markMessageAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const message = messages.find((msg) => msg.id === id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    message.read = true;

    // Update in Supabase
    try {
      await supabase.from('agent_messages').update({ read: true }).eq('id', id);
    } catch (err) {
      console.error('Failed to update message in database:', err);
    }

    res.json({
      success: true,
      data: message,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to mark message as read',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};

// ==========================================================================
// Collaboration Controllers
// ==========================================================================

export const getAllCollaborations = async (req: Request, res: Response) => {
  try {
    const collaborationList = Array.from(collaborations.values());

    res.json({
      success: true,
      data: collaborationList,
      count: collaborationList.length,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collaborations',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};

export const getCollaborationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const collaboration = collaborations.get(id);

    if (!collaboration) {
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found',
      });
    }

    res.json({
      success: true,
      data: collaboration,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collaboration',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};

export const createCollaboration = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description = '',
      agentIds = [],
      sharedContext = {},
      createdBy = 'user',
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required',
      });
    }

    const collaboration: AgentCollaboration = {
      id: `collab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      description,
      agentIds,
      sharedContext,
      createdBy,
      createdAt: Date.now(),
      status: 'active',
    };

    collaborations.set(collaboration.id, collaboration);

    // Store in Supabase
    try {
      await supabase.from('collaborations').insert({
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

    res.status(201).json({
      success: true,
      data: collaboration,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to create collaboration',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};

// ==========================================================================
// Stats Controllers
// ==========================================================================

export const getSystemStats = async (req: Request, res: Response) => {
  try {
    const totalAgents = agents.size;
    const onlineAgents = Array.from(agents.values()).filter(
      (agent) => agent.status !== 'offline'
    ).length;
    const totalTasks = tasks.size;
    const completedTasks = Array.from(tasks.values()).filter(
      (task) => task.status === 'completed'
    ).length;
    const pendingTasks = Array.from(tasks.values()).filter(
      (task) => task.status === 'pending'
    ).length;

    res.json({
      success: true,
      data: {
        totalAgents,
        onlineAgents,
        totalTasks,
        completedTasks,
        pendingTasks,
        totalMessages: messages.length,
        activeCollaborations: Array.from(collaborations.values()).filter(
          (c) => c.status === 'active'
        ).length,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};

export const getAgentStats = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const agent = agents.get(agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    const agentTasks = Array.from(tasks.values()).filter(
      (task) => task.agentId === agentId
    );
    const completedTasks = agentTasks.filter((task) => task.status === 'completed').length;
    const failedTasks = agentTasks.filter((task) => task.status === 'failed').length;
    const pendingTasks = agentTasks.filter((task) => task.status === 'pending').length;
    const inProgressTasks = agentTasks.filter((task) => task.status === 'in-progress').length;

    res.json({
      success: true,
      data: {
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
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent stats',
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
};
