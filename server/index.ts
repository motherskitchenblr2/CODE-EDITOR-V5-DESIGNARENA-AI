// ============================================================================
// Volt Code AGI - Server Entry Point
// ============================================================================

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase, supabase } from './config/supabase';
import { SERVER_CONFIG, AGENT_CONFIG } from './config/constants';
import { initializeAllAgents } from './jobs/multiAgent';
import { agentRouter } from './api/agents/routes';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  AgentState,
  AgentTask,
  AgentMessage,
  AgentCollaboration,
  AgentConfig,
} from '../../shared/types';

// Load environment variables
dotenv.config();

// Initialize database
initializeDatabase().catch(console.error);

// Create Express app
const app = express();
const httpServer = createServer(app);

// Socket.io server with typed events
const io = new Server<ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData>(httpServer, {
  cors: {
    origin: SERVER_CONFIG.SOCKET_IO_CORS_ORIGIN.split(','),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  },
});

// Middleware
app.use(cors({
  origin: SERVER_CONFIG.SOCKET_IO_CORS_ORIGIN.split(','),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: Date.now(),
    environment: SERVER_CONFIG.NODE_ENV,
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/agents', agentRouter);

// API root
app.get('/api', (req, res) => {
  res.json({
    name: 'Volt Code AGI API',
    version: '1.0.0',
    endpoints: {
      agents: '/api/agents',
      health: '/health',
    },
  });
});

// Serve static files from client build in production
if (SERVER_CONFIG.IS_PRODUCTION) {
  app.use(express.static('../dist'));
  app.get('*', (req, res) => {
    res.sendFile('index.html', { root: '../dist' });
  });
}

// ==========================================================================
// Socket.io Event Handlers
// ==========================================================================

// Store connected sockets by user/agent
const connectedSockets = new Map<string, Set<string>>(); // agentId -> Set<socketId>
const socketToAgent = new Map<string, string>(); // socketId -> agentId

// Agent state manager (in-memory cache, synced with Supabase)
let agents: Map<string, AgentState> = new Map();
let tasks: Map<string, AgentTask> = new Map();
let messages: AgentMessage[] = [];
let collaborations: Map<string, AgentCollaboration> = new Map();

// Initialize agents from configuration
function initializeAgentStates(): void {
  AGENT_CONFIG.DEFAULT_AGENTS.forEach((config) => {
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
    agents.set(config.id, agentState);
  });
}

// Broadcast agent status to all clients
function broadcastAgentStatus(agentId: string): void {
  const agent = agents.get(agentId);
  if (!agent) return;

  io.emit('agent:status:update', {
    agentId: agent.id,
    agentType: agent.type,
    status: agent.status,
    currentTask: agent.currentTask,
    tab: agent.tab,
    timestamp: Date.now(),
  });
}

// Broadcast all agents to a specific socket
function broadcastAllAgents(socketId: string): void {
  const agentList = Array.from(agents.values());
  io.to(socketId).emit('agents:list', agentList);
}

// Broadcast all tasks to a specific socket
function broadcastAllTasks(socketId: string): void {
  const taskList = Array.from(tasks.values());
  io.to(socketId).emit('tasks:list', taskList);
}

// Broadcast all messages to a specific socket
function broadcastAllMessages(socketId: string): void {
  io.to(socketId).emit('messages:list', messages);
}

// Heartbeat monitoring
setInterval(() => {
  const now = Date.now();
  const offlineThreshold = now - AGENT_CONFIG.OFFLINE_TIMEOUT_MS;

  agents.forEach((agent, agentId) => {
    if (agent.health.lastHeartbeat < offlineThreshold && agent.status !== 'offline') {
      agent.status = 'offline';
      agent.health.status = 'offline';
      broadcastAgentStatus(agentId);
    }
  });
}, 1000);

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Send initial data
  socket.emit('agents:list', Array.from(agents.values()));
  socket.emit('tasks:list', Array.from(tasks.values()));
  socket.emit('messages:list', messages);

  // Agent registration
  socket.on('agent:register', async (config: AgentConfig) => {
    console.log(`🤖 Agent registered: ${config.id} (${config.type})`);

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

    agents.set(config.id, agentState);
    socketToAgent.set(socket.id, config.id);

    if (!connectedSockets.has(config.id)) {
      connectedSockets.set(config.id, new Set());
    }
    connectedSockets.get(config.id)?.add(socket.id);

    // Store in Supabase
    try {
      await supabase.from('agents').upsert({
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

    broadcastAgentStatus(config.id);
    socket.emit('agent:status:update', {
      agentId: config.id,
      agentType: config.type,
      status: 'idle',
      currentTask: null,
      tab: config.tab,
      timestamp: Date.now(),
    });
  });

  // Agent message
  socket.on('agent:message', async (payload: {
    id: string;
    from: string;
    to: string;
    content: string;
    taskId: string | null;
    tab: string;
    timestamp: number;
    read: boolean;
  }) => {
    const message: AgentMessage = {
      ...payload,
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
        tab: message.tab as any,
        timestamp: new Date(message.timestamp).toISOString(),
        read: false,
        metadata: null,
      });
    } catch (err) {
      console.error('Failed to save message to database:', err);
    }

    // Broadcast to recipient or all
    if (message.to === 'all') {
      io.emit('agent:message', message);
    } else if (connectedSockets.has(message.to)) {
      connectedSockets.get(message.to)?.forEach((socketId) => {
        io.to(socketId).emit('agent:message', message);
      });
    } else {
      // Send to sender if recipient not found
      socket.emit('agent:message', message);
    }
  });

  // Task creation
  socket.on('agent:task:create', async (taskData: {
    title: string;
    description: string;
    priority: string;
    tab: string;
    createdBy: string;
    collaborationContextId: string | null;
  }) => {
    const task: AgentTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      ...taskData,
      status: 'pending',
      agentId: null,
      agentType: null,
      assignedAt: null,
      startedAt: null,
      completedAt: null,
      failedAt: null,
      errorMessage: null,
      result: null,
      createdAt: Date.now(),
    };

    tasks.set(task.id, task);

    // Store in Supabase
    try {
      await supabase.from('tasks').insert({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority as any,
        status: 'pending',
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
        tab: task.tab as any,
        collaboration_context_id: task.collaborationContextId,
      });
    } catch (err) {
      console.error('Failed to save task to database:', err);
    }

    // Broadcast to all clients
    io.emit('agent:task:assigned', {
      taskId: task.id,
      agentId: '',
      agentType: '',
      task,
    });

    socket.emit('tasks:list', Array.from(tasks.values()));
  });

  // Task assignment
  socket.on('agent:task:assign', async (payload: { taskId: string; agentId: string }) => {
    const task = tasks.get(payload.taskId);
    const agent = agents.get(payload.agentId);

    if (!task || !agent) {
      socket.emit('error', { message: 'Task or agent not found' });
      return;
    }

    task.status = 'assigned';
    task.agentId = payload.agentId;
    task.agentType = agent.type;
    task.assignedAt = Date.now();

    agent.status = 'busy';
    agent.currentTask = task;
    agent.health.status = 'busy';
    agent.health.currentTaskId = task.id;

    // Update in Supabase
    try {
      await supabase.from('tasks').update({
        status: 'assigned',
        agent_id: payload.agentId,
        agent_type: agent.type,
        assigned_at: new Date().toISOString(),
      }).eq('id', payload.taskId);

      await supabase.from('agents').update({
        status: 'busy',
        current_task_id: task.id,
        updated_at: new Date().toISOString(),
      }).eq('id', payload.agentId);
    } catch (err) {
      console.error('Failed to update task/agent in database:', err);
    }

    broadcastAgentStatus(payload.agentId);
    io.emit('agent:task:assigned', {
      taskId: task.id,
      agentId: payload.agentId,
      agentType: agent.type,
      task,
    });
  });

  // Agent heartbeat
  socket.on('agent:heartbeat', (payload: {
    agentId: string;
    status: string;
    currentTask: AgentTask | null;
    timestamp: number;
  }) => {
    const agent = agents.get(payload.agentId);
    if (!agent) return;

    agent.health.lastHeartbeat = payload.timestamp || Date.now();
    agent.health.status = payload.status as any;
    agent.health.currentTaskId = payload.currentTask?.id || null;

    // Update status if changed
    if (agent.status !== payload.status) {
      agent.status = payload.status as any;
      if (payload.status === 'idle') {
        agent.currentTask = null;
        agent.health.currentTaskId = null;
      } else if (payload.status === 'busy' && payload.currentTask) {
        agent.currentTask = payload.currentTask;
      }
      broadcastAgentStatus(payload.agentId);
    }

    // Update in Supabase
    supabase.from('agents').update({
      status: payload.status,
      current_task_id: payload.currentTask?.id || null,
      updated_at: new Date().toISOString(),
    }).eq('id', payload.agentId).catch(console.error);
  });

  // Request agent list
  socket.on('agents:list', () => {
    broadcastAllAgents(socket.id);
  });

  // Request task list
  socket.on('tasks:list', () => {
    broadcastAllTasks(socket.id);
  });

  // Request message list
  socket.on('messages:list', () => {
    broadcastAllMessages(socket.id);
  });

  // Collaboration creation
  socket.on('collaboration:create', async (collaborationData: {
    name: string;
    description: string;
    agentIds: string[];
    sharedContext: Record<string, unknown>;
    createdBy: string;
  }) => {
    const collaboration: AgentCollaboration = {
      id: `collab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      ...collaborationData,
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
        created_at: new Date().toISOString(),
        status: 'active',
      });
    } catch (err) {
      console.error('Failed to save collaboration to database:', err);
    }

    io.emit('collaboration:update', collaboration);
    socket.emit('collaboration:update', collaboration);
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);

    const agentId = socketToAgent.get(socket.id);
    if (agentId) {
      const agentSockets = connectedSockets.get(agentId);
      if (agentSockets) {
        agentSockets.delete(socket.id);
        if (agentSockets.size === 0) {
          connectedSockets.delete(agentId);
          // Mark agent as offline
          const agent = agents.get(agentId);
          if (agent) {
            agent.status = 'offline';
            agent.health.status = 'offline';
            broadcastAgentStatus(agentId);
          }
        }
      }
      socketToAgent.delete(socket.id);
    }
  });
});

// ==========================================================================
// Initialize Agents
// ==========================================================================

async function startAgentSystem(): Promise<void> {
  try {
    // Initialize agent states
    initializeAgentStates();

    // Initialize all agents
    await initializeAllAgents(io, supabase);

    console.log('✅ Agent system initialized');
  } catch (err) {
    console.error('❌ Failed to initialize agent system:', err);
  }
}

// ==========================================================================
// Start Server
// ==========================================================================

const startServer = async () => {
  try {
    // Start agent system
    await startAgentSystem();

    // Start HTTP server
    httpServer.listen(SERVER_CONFIG.PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    🚀 Volt Code AGI Server                      ║
╠════════════════════════════════════════════════════════════════╣
║  Server:    http://localhost:${SERVER_CONFIG.PORT}                  ║
║  API:       http://localhost:${SERVER_CONFIG.PORT}/api              ║
║  Health:    http://localhost:${SERVER_CONFIG.PORT}/health           ║
║  Socket.io: http://localhost:${SERVER_CONFIG.PORT}                  ║
║  Mode:      ${SERVER_CONFIG.NODE_ENV}                                       ║
╚════════════════════════════════════════════════════════════════╝
      `);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
      httpServer.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('\n🛑 SIGINT received. Shutting down gracefully...');
      httpServer.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer().catch(console.error);
