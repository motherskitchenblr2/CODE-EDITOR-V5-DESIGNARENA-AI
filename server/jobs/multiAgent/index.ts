// ============================================================================
// Volt Code AGI - MultiAgent Module Exports
// ============================================================================

import { Server } from 'socket.io';
import { SupabaseClient } from '@supabase/supabase-js';
import { MultiAgentOrchestrator, initializeAgents, getOrchestrator, setOrchestrator } from './orchestrator';
import { EditorAgent, createEditorAgent } from './editorAgent';
import { PRAgent, createPRAgent } from './prAgent';
import { BranchConflictAgent, createBranchConflictAgent } from './branchConflictAgent';
import { SecurityAgent, createSecurityAgent } from './securityAgent';
import { CodeMonitorAgent, createCodeMonitorAgent } from './codeMonitorAgent';
import { BugFixAgent, createBugFixAgent } from './bugFixAgent';
import { DependencyAgent, createDependencyAgent } from './dependencyAgent';
import { BaseAgent, AgentContext, AgentFactory } from './types';
import {
  AgentConfig,
  AgentType,
  AgentTab,
  AgentStatus,
  AgentTask,
  AgentMessage,
  AgentState,
  AgentCollaboration,
  TaskPriority,
  TaskStatus,
  VulnerabilityAlert,
  DependencyUpdate,
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  DEFAULT_AGENT_CONFIGS,
} from '../../../shared/types';

// Re-export types
export type {
  AgentConfig,
  AgentType,
  AgentTab,
  AgentStatus,
  AgentTask,
  AgentMessage,
  AgentState,
  AgentCollaboration,
  TaskPriority,
  TaskStatus,
  VulnerabilityAlert,
  DependencyUpdate,
};

export {
  AgentType,
  AgentTab,
  AgentStatus,
  TaskPriority,
  TaskStatus,
  DEFAULT_AGENT_CONFIGS,
};

// Export agent classes
export {
  MultiAgentOrchestrator,
  EditorAgent,
  PRAgent,
  BranchConflictAgent,
  SecurityAgent,
  CodeMonitorAgent,
  BugFixAgent,
  DependencyAgent,
  BaseAgent,
};

// Export factory functions
export {
  createEditorAgent,
  createPRAgent,
  createBranchConflictAgent,
  createSecurityAgent,
  createCodeMonitorAgent,
  createBugFixAgent,
  createDependencyAgent,
};

// Export orchestrator functions
export { initializeAgents, getOrchestrator, setOrchestrator };

// Agent types for initialization
type AgentConstructor = (ctx: AgentContext) => BaseAgent;

interface AgentRegistration {
  type: AgentType;
  create: AgentConstructor;
  config: AgentConfig;
}

// All agent registrations
const AGENT_REGISTRATIONS: AgentRegistration[] = [
  {
    type: 'editor',
    create: createEditorAgent,
    config: DEFAULT_AGENT_CONFIGS.find((c) => c.type === 'editor')!,
  },
  {
    type: 'pr-agent',
    create: createPRAgent,
    config: DEFAULT_AGENT_CONFIGS.find((c) => c.type === 'pr-agent')!,
  },
  {
    type: 'branch-conflict',
    create: createBranchConflictAgent,
    config: DEFAULT_AGENT_CONFIGS.find((c) => c.type === 'branch-conflict')!,
  },
  {
    type: 'security-scan',
    create: createSecurityAgent,
    config: DEFAULT_AGENT_CONFIGS.find((c) => c.type === 'security-scan')!,
  },
  {
    type: 'code-monitor',
    create: createCodeMonitorAgent,
    config: DEFAULT_AGENT_CONFIGS.find((c) => c.type === 'code-monitor')!,
  },
  {
    type: 'bug-fix',
    create: createBugFixAgent,
    config: DEFAULT_AGENT_CONFIGS.find((c) => c.type === 'bug-fix')!,
  },
  {
    type: 'dependency-update',
    create: createDependencyAgent,
    config: DEFAULT_AGENT_CONFIGS.find((c) => c.type === 'dependency-update')!,
  },
];

// All agents array (initialized agents)
let allAgents: BaseAgent[] = [];

// Initialize all agents with the orchestrator
async function initializeAllAgents(io: Server, supabase: SupabaseClient): Promise<BaseAgent[]> {
  console.log('🚀 Initializing all Volt Code AGI agents...');

  // Create orchestrator
  const orchestrator = new MultiAgentOrchestrator(io, supabase);
  setOrchestrator(orchestrator);

  // Create agent context
  const ctx: AgentContext = {
    io,
    supabase,
    orchestrator,
    config: DEFAULT_AGENT_CONFIGS.find((c) => c.type === 'orchestrator')!,
  };

  // Initialize each agent
  for (const registration of AGENT_REGISTRATIONS) {
    try {
      const agent = registration.create({ ...ctx, config: registration.config });
      await agent.initialize();
      allAgents.push(agent);
      console.log(`✅ Agent initialized: ${registration.type}`);
    } catch (err) {
      console.error(`❌ Failed to initialize agent: ${registration.type}`, err);
    }
  }

  console.log(`✅ All ${allAgents.length} agents initialized successfully`);
  return allAgents;
}

// Get all agents
export function getAllAgents(): BaseAgent[] {
  return allAgents;
}

// Get agent by type
export function getAgentByType(type: AgentType): BaseAgent | undefined {
  return allAgents.find((agent) => agent.type === type);
}

// Get agent by ID
export function getAgentById(id: string): BaseAgent | undefined {
  return allAgents.find((agent) => agent.id === id);
}

// Cleanup all agents
export async function cleanupAllAgents(): Promise<void> {
  console.log('🧹 Cleaning up all agents...');
  for (const agent of allAgents) {
    try {
      await agent.cleanup();
      console.log(`✅ Cleaned up agent: ${agent.type}`);
    } catch (err) {
      console.error(`❌ Failed to cleanup agent: ${agent.type}`, err);
    }
  }
  allAgents = [];
  console.log('✅ All agents cleaned up');
}

// Re-initialize agents (for hot reload)
export async function reinitializeAgents(io: Server, supabase: SupabaseClient): Promise<BaseAgent[]> {
  await cleanupAllAgents();
  return initializeAllAgents(io, supabase);
}

// Export allAgents (for compatibility with plan)
export { allAgents, initializeAllAgents };
