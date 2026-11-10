// ============================================================================
// Volt Code AGI - Socket Provider Component
// ============================================================================

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  SocketContextValue,
  ServerSocketEvents,
  ClientSocketEvents,
} from './SocketContext';
import {
  AgentStatusUpdatePayload,
  AgentMessagePayload,
  TaskAssignmentPayload,
  AgentHeartbeatPayload,
  VulnerabilityFoundPayload,
  DependencyUpdatePayload,
  AgentState,
  AgentTask,
  AgentMessage,
  AgentStatus,
  AgentType,
  AgentTab,
  TaskStatus,
  TaskPriority,
} from '../../shared/types';

// ==========================================================================
// Context
// ==========================================================================

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

// ==========================================================================
// Provider Component
// ==========================================================================

interface SocketProviderProps {
  children: React.ReactNode;
  serverUrl?: string;
  autoConnect?: boolean;
}

export function SocketProvider({
  children,
  serverUrl = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001',
  autoConnect = true,
}: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket<ServerSocketEvents, ClientSocketEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);

  // Callback refs for subscriptions
  const agentStatusUpdateCallbacks = useRef<Set<Function>>(new Set());
  const agentMessageCallbacks = useRef<Set<Function>>(new Set());
  const taskAssignmentCallbacks = useRef<Set<Function>>(new Set());
  const agentHeartbeatCallbacks = useRef<Set<Function>>(new Set());
  const vulnerabilityFoundCallbacks = useRef<Set<Function>>(new Set());
  const dependencyUpdateCallbacks = useRef<Set<Function>>(new Set());
  const agentsListCallbacks = useRef<Set<Function>>(new Set());
  const tasksListCallbacks = useRef<Set<Function>>(new Set());
  const messagesListCallbacks = useRef<Set<Function>>(new Set());
  const collaborationUpdateCallbacks = useRef<Set<Function>>(new Set());
  const errorCallbacks = useRef<Set<Function>>(new Set());
  const connectCallbacks = useRef<Set<Function>>(new Set());
  const disconnectCallbacks = useRef<Set<Function>>(new Set());

  // ==========================================================================
  // Connection Management
  // ==========================================================================

  const connect = useCallback(() => {
    if (socket && isConnected) return;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      const newSocket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        autoConnect,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      setSocket(newSocket);

      // Connection event
      newSocket.on('connect', () => {
        setIsConnected(true);
        setIsConnecting(false);
        console.log('✅ Socket.io connected');
        connectCallbacks.current.forEach((cb) => cb());
      });

      // Disconnect event
      newSocket.on('disconnect', () => {
        setIsConnected(false);
        setIsConnecting(false);
        console.log('❌ Socket.io disconnected');
        disconnectCallbacks.current.forEach((cb) => cb());
      });

      // Connect error
      newSocket.on('connect_error', (error: Error) => {
        setIsConnecting(false);
        setConnectionError(error.message);
        console.error('❌ Socket.io connection error:', error);
      });

      // Agent status update
      newSocket.on('agent:status:update', (payload: AgentStatusUpdatePayload) => {
        setAgents((prev) => {
          const existingIndex = prev.findIndex((a) => a.id === payload.agentId);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              status: payload.status,
              currentTask: payload.currentTask,
            };
            return updated;
          }
          return prev;
        });
        agentStatusUpdateCallbacks.current.forEach((cb) => cb(payload));
      });

      // Agent message
      newSocket.on('agent:message', (payload: AgentMessagePayload) => {
        setMessages((prev) => [...prev, payload]);
        agentMessageCallbacks.current.forEach((cb) => cb(payload));
      });

      // Task assigned
      newSocket.on('agent:task:assigned', (payload: TaskAssignmentPayload) => {
        setTasks((prev) => {
          const existingIndex = prev.findIndex((t) => t.id === payload.taskId);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = payload.task;
            return updated;
          }
          return [...prev, payload.task];
        });
        taskAssignmentCallbacks.current.forEach((cb) => cb(payload));
      });

      // Agent heartbeat
      newSocket.on('agent:heartbeat', (payload: AgentHeartbeatPayload) => {
        agentHeartbeatCallbacks.current.forEach((cb) => cb(payload));
      });

      // Vulnerability found
      newSocket.on('agent:vulnerability:found', (payload: VulnerabilityFoundPayload) => {
        vulnerabilityFoundCallbacks.current.forEach((cb) => cb(payload));
      });

      // Dependency update
      newSocket.on('agent:dependency:update', (payload: DependencyUpdatePayload) => {
        dependencyUpdateCallbacks.current.forEach((cb) => cb(payload));
      });

      // Agents list
      newSocket.on('agents:list', (agentList: AgentState[]) => {
        setAgents(agentList);
        agentsListCallbacks.current.forEach((cb) => cb(agentList));
      });

      // Tasks list
      newSocket.on('tasks:list', (taskList: AgentTask[]) => {
        setTasks(taskList);
        tasksListCallbacks.current.forEach((cb) => cb(taskList));
      });

      // Messages list
      newSocket.on('messages:list', (messageList: AgentMessage[]) => {
        setMessages(messageList);
        messagesListCallbacks.current.forEach((cb) => cb(messageList));
      });

      // Collaboration update
      newSocket.on('collaboration:update', (collaboration: any) => {
        collaborationUpdateCallbacks.current.forEach((cb) => cb(collaboration));
      });

      // Error
      newSocket.on('error', (error: { message: string; code?: string }) => {
        setConnectionError(error.message);
        errorCallbacks.current.forEach((cb) => cb(error));
      });

    } catch (error) {
      setIsConnecting(false);
      setConnectionError(error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Failed to create socket:', error);
    }
  }, [serverUrl, autoConnect, isConnected, socket]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, [socket]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // ==========================================================================
  // Subscription Methods
  // ==========================================================================

  const onAgentStatusUpdate = useCallback((callback: (payload: AgentStatusUpdatePayload) => void) => {
    agentStatusUpdateCallbacks.current.add(callback);
    return () => agentStatusUpdateCallbacks.current.delete(callback);
  }, []);

  const offAgentStatusUpdate = useCallback((callback: (payload: AgentStatusUpdatePayload) => void) => {
    agentStatusUpdateCallbacks.current.delete(callback);
  }, []);

  const onAgentMessage = useCallback((callback: (payload: AgentMessagePayload) => void) => {
    agentMessageCallbacks.current.add(callback);
    return () => agentMessageCallbacks.current.delete(callback);
  }, []);

  const offAgentMessage = useCallback((callback: (payload: AgentMessagePayload) => void) => {
    agentMessageCallbacks.current.delete(callback);
  }, []);

  const onTaskAssigned = useCallback((callback: (payload: TaskAssignmentPayload) => void) => {
    taskAssignmentCallbacks.current.add(callback);
    return () => taskAssignmentCallbacks.current.delete(callback);
  }, []);

  const offTaskAssigned = useCallback((callback: (payload: TaskAssignmentPayload) => void) => {
    taskAssignmentCallbacks.current.delete(callback);
  }, []);

  const onAgentHeartbeat = useCallback((callback: (payload: AgentHeartbeatPayload) => void) => {
    agentHeartbeatCallbacks.current.add(callback);
    return () => agentHeartbeatCallbacks.current.delete(callback);
  }, []);

  const offAgentHeartbeat = useCallback((callback: (payload: AgentHeartbeatPayload) => void) => {
    agentHeartbeatCallbacks.current.delete(callback);
  }, []);

  const onVulnerabilityFound = useCallback((callback: (payload: VulnerabilityFoundPayload) => void) => {
    vulnerabilityFoundCallbacks.current.add(callback);
    return () => vulnerabilityFoundCallbacks.current.delete(callback);
  }, []);

  const offVulnerabilityFound = useCallback((callback: (payload: VulnerabilityFoundPayload) => void) => {
    vulnerabilityFoundCallbacks.current.delete(callback);
  }, []);

  const onDependencyUpdate = useCallback((callback: (payload: DependencyUpdatePayload) => void) => {
    dependencyUpdateCallbacks.current.add(callback);
    return () => dependencyUpdateCallbacks.current.delete(callback);
  }, []);

  const offDependencyUpdate = useCallback((callback: (payload: DependencyUpdatePayload) => void) => {
    dependencyUpdateCallbacks.current.delete(callback);
  }, []);

  const onAgentsList = useCallback((callback: (agents: AgentState[]) => void) => {
    agentsListCallbacks.current.add(callback);
    return () => agentsListCallbacks.current.delete(callback);
  }, []);

  const offAgentsList = useCallback((callback: (agents: AgentState[]) => void) => {
    agentsListCallbacks.current.delete(callback);
  }, []);

  const onTasksList = useCallback((callback: (tasks: AgentTask[]) => void) => {
    tasksListCallbacks.current.add(callback);
    return () => tasksListCallbacks.current.delete(callback);
  }, []);

  const offTasksList = useCallback((callback: (tasks: AgentTask[]) => void) => {
    tasksListCallbacks.current.delete(callback);
  }, []);

  const onMessagesList = useCallback((callback: (messages: AgentMessage[]) => void) => {
    messagesListCallbacks.current.add(callback);
    return () => messagesListCallbacks.current.delete(callback);
  }, []);

  const offMessagesList = useCallback((callback: (messages: AgentMessage[]) => void) => {
    messagesListCallbacks.current.delete(callback);
  }, []);

  const onCollaborationUpdate = useCallback((callback: (collaboration: any) => void) => {
    collaborationUpdateCallbacks.current.add(callback);
    return () => collaborationUpdateCallbacks.current.delete(callback);
  }, []);

  const offCollaborationUpdate = useCallback((callback: (collaboration: any) => void) => {
    collaborationUpdateCallbacks.current.delete(callback);
  }, []);

  const onError = useCallback((callback: (error: { message: string; code?: string }) => void) => {
    errorCallbacks.current.add(callback);
    return () => errorCallbacks.current.delete(callback);
  }, []);

  const offError = useCallback((callback: (error: { message: string; code?: string }) => void) => {
    errorCallbacks.current.delete(callback);
  }, []);

  const onConnect = useCallback((callback: () => void) => {
    connectCallbacks.current.add(callback);
    return () => connectCallbacks.current.delete(callback);
  }, []);

  const offConnect = useCallback((callback: () => void) => {
    connectCallbacks.current.delete(callback);
  }, []);

  const onDisconnect = useCallback((callback: () => void) => {
    disconnectCallbacks.current.add(callback);
    return () => disconnectCallbacks.current.delete(callback);
  }, []);

  const offDisconnect = useCallback((callback: () => void) => {
    disconnectCallbacks.current.delete(callback);
  }, []);

  // ==========================================================================
  // Emit Methods
  // ==========================================================================

  const emitAgentMessage = useCallback((payload: AgentMessagePayload) => {
    if (socket && isConnected) {
      socket.emit('agent:message', payload);
    }
  }, [socket, isConnected]);

  const emitAgentTaskCreate = useCallback((task: Omit<AgentTask, 'id' | 'createdAt' | 'assignedAt' | 'startedAt' | 'completedAt' | 'failedAt' | 'agentId' | 'agentType' | 'status' | 'errorMessage' | 'result'>) => {
    if (socket && isConnected) {
      socket.emit('agent:task:create', task);
    }
  }, [socket, isConnected]);

  const emitAgentTaskAssign = useCallback((taskId: string, agentId: string) => {
    if (socket && isConnected) {
      socket.emit('agent:task:assign', { taskId, agentId });
    }
  }, [socket, isConnected]);

  const emitAgentHeartbeat = useCallback((payload: AgentHeartbeatPayload) => {
    if (socket && isConnected) {
      socket.emit('agent:heartbeat', payload);
    }
  }, [socket, isConnected]);

  const emitAgentsList = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('agents:list');
    }
  }, [socket, isConnected]);

  const emitTasksList = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('tasks:list');
    }
  }, [socket, isConnected]);

  const emitMessagesList = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('messages:list');
    }
  }, [socket, isConnected]);

  // ==========================================================================
  // Agent Management Helpers
  // ==========================================================================

  const getAgentById = useCallback((id: string): AgentState | undefined => {
    return agents.find((a) => a.id === id);
  }, [agents]);

  const getAgentByType = useCallback((type: AgentType): AgentState | undefined => {
    return agents.find((a) => a.type === type);
  }, [agents]);

  const getAgentsByTab = useCallback((tab: AgentTab): AgentState[] => {
    return agents.filter((a) => a.tab === tab);
  }, [agents]);

  const getAgentsByStatus = useCallback((status: AgentStatus): AgentState[] => {
    return agents.filter((a) => a.status === status);
  }, [agents]);

  // ==========================================================================
  // Task Management Helpers
  // ==========================================================================

  const getTaskById = useCallback((id: string): AgentTask | undefined => {
    return tasks.find((t) => t.id === id);
  }, [tasks]);

  const getTasksByStatus = useCallback((status: TaskStatus): AgentTask[] => {
    return tasks.filter((t) => t.status === status);
  }, [tasks]);

  const getTasksByAgent = useCallback((agentId: string): AgentTask[] => {
    return tasks.filter((t) => t.agentId === agentId);
  }, [tasks]);

  const getTasksByPriority = useCallback((priority: TaskPriority): AgentTask[] => {
    return tasks.filter((t) => t.priority === priority);
  }, [tasks]);

  // ==========================================================================
  // Message Management Helpers
  // ==========================================================================

  const getMessagesByAgent = useCallback((agentId: string): AgentMessage[] => {
    return messages.filter((m) => m.from === agentId || m.to === agentId);
  }, [messages]);

  const getMessagesByTask = useCallback((taskId: string): AgentMessage[] => {
    return messages.filter((m) => m.taskId === taskId);
  }, [messages]);

  // ==========================================================================
  // Context Value
  // ==========================================================================

  const contextValue: SocketContextValue = {
    socket,
    isConnected,
    isConnecting,
    connectionError,
    agents,
    tasks,
    messages,
    onAgentStatusUpdate,
    offAgentStatusUpdate,
    onAgentMessage,
    offAgentMessage,
    onTaskAssigned,
    offTaskAssigned,
    onAgentHeartbeat,
    offAgentHeartbeat,
    onVulnerabilityFound,
    offVulnerabilityFound,
    onDependencyUpdate,
    offDependencyUpdate,
    onAgentsList,
    offAgentsList,
    onTasksList,
    offTasksList,
    onMessagesList,
    offMessagesList,
    onCollaborationUpdate,
    offCollaborationUpdate,
    onError,
    offError,
    onConnect,
    offConnect,
    onDisconnect,
    offDisconnect,
    emitAgentMessage,
    emitAgentTaskCreate,
    emitAgentTaskAssign,
    emitAgentHeartbeat,
    emitAgentsList,
    emitTasksList,
    emitMessagesList,
    getAgentById,
    getAgentByType,
    getAgentsByTab,
    getAgentsByStatus,
    getTaskById,
    getTasksByStatus,
    getTasksByAgent,
    getTasksByPriority,
    getMessagesByAgent,
    getMessagesByTask,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

// ==========================================================================
// Hook
// ==========================================================================

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// ==========================================================================
// Export
// ==========================================================================

export { SocketContext };
export default SocketProvider;
