// ============================================================================
// Volt Code AGI - Branch & Conflict Agent
// ============================================================================

import { BaseAgent, AgentContext } from './types';
import {
  AgentTask,
  AgentMessage,
  AgentConfig,
  AgentType,
  AgentTab,
  AgentStatus,
} from '../../../shared/types';
import { DEFAULT_AGENT_CONFIGS } from '../../../shared/types';

// ==========================================================================
// Branch Conflict Agent Configuration
// ==========================================================================

const BRANCH_CONFLICT_CONFIG: AgentConfig = DEFAULT_AGENT_CONFIGS.find(
  (c) => c.type === 'branch-conflict'
) || {
  id: 'branch-conflict-agent-001',
  alias: 'branch-conflict',
  type: 'branch-conflict',
  tab: 'github',
  model: 'claude-opus-5.5',
  maxTasks: 3,
  description: 'Branch management, merge conflict detection & resolution',
  isActive: true,
};

// ==========================================================================
// Branch Conflict Agent Class
// ==========================================================================

export class BranchConflictAgent extends BaseAgent {
  private branches: Map<string, BranchInfo>;
  private conflicts: Map<string, MergeConflict>;
  private worktrees: Map<string, GitWorktree>;

  constructor(ctx: AgentContext) {
    super(ctx);
    this.branches = new Map();
    this.conflicts = new Map();
    this.worktrees = new Map();
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  async initialize(): Promise<void> {
    console.log(`🌿 Branch & Conflict Agent (${this.id}) initializing...`);
    this.status = 'idle';
    this.updateHeartbeat();

    // Register with orchestrator
    await this.ctx.orchestrator.registerAgent(BRANCH_CONFLICT_CONFIG);

    // Initialize with default branches
    await this.initializeBranches();

    console.log(`✅ Branch & Conflict Agent (${this.id}) ready`);
  }

  private async initializeBranches(): Promise<void> {
    // Simulate existing branches
    this.branches.set('main', {
      name: 'main',
      commitHash: 'abc123',
      lastUpdated: Date.now(),
      protected: true,
      isDefault: true,
    });

    this.branches.set('develop', {
      name: 'develop',
      commitHash: 'def456',
      lastUpdated: Date.now(),
      protected: false,
      isDefault: false,
    });
  }

  // ==========================================================================
  // Task Execution
  // ==========================================================================

  async executeTask(task: AgentTask): Promise<void> {
    console.log(`🌿 Branch & Conflict Agent executing task: ${task.title}`);

    this.currentTask = task;
    this.updateStatus('busy');
    this.ctx.orchestrator.startTask(task.id).catch(console.error);

    try {
      // Route task based on type
      switch (task.title.toLowerCase() || task.description.toLowerCase()) {
        case 'check conflicts':
        case 'detect conflicts':
          await this.handleDetectConflicts(task);
          break;
        case 'resolve conflicts':
        case 'fix conflicts':
          await this.handleResolveConflicts(task);
          break;
        case 'create branch':
          await this.handleCreateBranch(task);
          break;
        case 'delete branch':
          await this.handleDeleteBranch(task);
          break;
        case 'sync branch':
          await this.handleSyncBranch(task);
          break;
        case 'rebase':
          await this.handleRebase(task);
          break;
        default:
          await this.handleGenericTask(task);
      }

      await this.completeTask(task.id, { success: true });
      console.log(`✅ Branch & Conflict Agent completed task: ${task.title}`);
    } catch (err) {
      console.error(`❌ Branch & Conflict Agent failed task: ${task.title}`, err);
      await this.failTask(task.id, `Branch Conflict Agent error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      this.currentTask = null;
      this.updateStatus('idle');
      this.updateHeartbeat();
    }
  }

  // ==========================================================================
  // Task Handlers
  // ==========================================================================

  private async handleDetectConflicts(task: AgentTask): Promise<void> {
    // Simulate conflict detection
    await this.simulateDelay(1500);

    // Extract PR or branch info from task
    const target = task.description?.split(' ').pop() || 'main';

    // Check if this is a PR number or branch name
    const prNumber = parseInt(target);
    let conflictDetected = false;

    if (!isNaN(prNumber)) {
      // This is a PR number - check for conflicts
      conflictDetected = this.detectPRConflicts(prNumber);
    } else {
      // This is a branch name - check for conflicts
      conflictDetected = this.detectBranchConflicts(target);
    }

    if (conflictDetected) {
      const conflictId = `conflict-${Date.now()}`;
      const conflict: MergeConflict = {
        id: conflictId,
        type: isNaN(prNumber) ? 'branch' : 'pr',
        target: isNaN(prNumber) ? target : `PR #${prNumber}`,
        baseBranch: 'main',
        headBranch: target,
        files: ['src/index.ts', 'src/utils.ts'],
        status: 'detected',
        detectedAt: Date.now(),
        resolvedAt: null,
        resolutionStrategy: null,
      };

      this.conflicts.set(conflictId, conflict);

      // Notify PR agent about the conflict
      await this.sendMessage(
        'pr-agent-001',
        `Merge conflict detected in ${isNaN(prNumber) ? `branch ${target}` : `PR #${prNumber}`}.`,
        task.id
      );

      // Notify editor agent to help resolve
      await this.sendMessage(
        'editor-agent-001',
        `Merge conflict detected. Please help resolve conflicts in: ${conflict.files.join(', ')}`,
        task.id
      );
    } else {
      // No conflicts found
      await this.sendMessage(
        'pr-agent-001',
        `No merge conflicts detected in ${isNaN(prNumber) ? `branch ${target}` : `PR #${prNumber}`}. Ready to merge.`,
        task.id
      );
    }
  }

  private async handleResolveConflicts(task: AgentTask): Promise<void> {
    // Simulate conflict resolution
    await this.simulateDelay(3000);

    const conflictId = task.description?.split(' ').pop() || '';
    const conflict = this.conflicts.get(conflictId);

    if (conflict) {
      conflict.status = 'resolved';
      conflict.resolvedAt = Date.now();
      conflict.resolutionStrategy = 'auto-merge';

      // Notify PR agent that conflicts are resolved
      await this.sendMessage(
        'pr-agent-001',
        `Merge conflict resolved in ${conflict.target}. Ready to merge.`,
        task.id
      );
    }
  }

  private async handleCreateBranch(task: AgentTask): Promise<void> {
    // Simulate branch creation
    await this.simulateDelay(1000);

    const branchName = task.description?.split(' ').pop() || `feature-${Date.now()}`;

    const branch: BranchInfo = {
      name: branchName,
      commitHash: this.generateCommitHash(),
      lastUpdated: Date.now(),
      protected: false,
      isDefault: false,
    };

    this.branches.set(branchName, branch);

    // Create worktree for the branch
    const worktree: GitWorktree = {
      id: `worktree-${Date.now()}`,
      path: `/tmp/worktrees/${branchName}`,
      branch: branchName,
      createdAt: Date.now(),
      isActive: true,
    };

    this.worktrees.set(worktree.id, worktree);

    await this.sendMessage(
      'all',
      `New branch created: ${branchName}`,
      task.id
    );
  }

  private async handleDeleteBranch(task: AgentTask): Promise<void> {
    // Simulate branch deletion
    await this.simulateDelay(1000);

    const branchName = task.description?.split(' ').pop() || '';

    if (this.branches.has(branchName)) {
      const branch = this.branches.get(branchName)!;

      // Don't allow deletion of protected branches
      if (branch.protected) {
        throw new Error(`Cannot delete protected branch: ${branchName}`);
      }

      this.branches.delete(branchName);

      // Clean up worktrees
      const worktreesToDelete = Array.from(this.worktrees.values()).filter(
        (w) => w.branch === branchName
      );
      worktreesToDelete.forEach((w) => this.worktrees.delete(w.id));

      await this.sendMessage(
        'all',
        `Branch deleted: ${branchName}`,
        task.id
      );
    }
  }

  private async handleSyncBranch(task: AgentTask): Promise<void> {
    // Simulate branch sync
    await this.simulateDelay(2000);

    const branchName = task.description?.split(' ').pop() || '';
    const branch = this.branches.get(branchName);

    if (branch) {
      branch.commitHash = this.generateCommitHash();
      branch.lastUpdated = Date.now();

      await this.sendMessage(
        'all',
        `Branch synced: ${branchName}`,
        task.id
      );
    }
  }

  private async handleRebase(task: AgentTask): Promise<void> {
    // Simulate rebase
    await this.simulateDelay(2500);

    const branchName = task.description?.split(' ').pop() || '';
    const branch = this.branches.get(branchName);

    if (branch) {
      // Check for conflicts during rebase
      const hasConflicts = Math.random() < 0.3; // 30% chance of conflicts

      if (hasConflicts) {
        throw new Error('Rebase conflict detected. Please resolve conflicts manually.');
      }

      branch.commitHash = this.generateCommitHash();
      branch.lastUpdated = Date.now();

      await this.sendMessage(
        'all',
        `Rebase completed: ${branchName}`,
        task.id
      );
    }
  }

  private async handleGenericTask(task: AgentTask): Promise<void> {
    // Generic task handling
    await this.simulateDelay(2000);
    console.log(`Branch & Conflict Agent processed generic task: ${task.title}`);
  }

  // ==========================================================================
  // Conflict Detection
  // ==========================================================================

  private detectPRConflicts(prNumber: number): boolean {
    // Simulate conflict detection for PR
    // 40% chance of conflicts
    return Math.random() < 0.4;
  }

  private detectBranchConflicts(branchName: string): boolean {
    // Simulate conflict detection for branch
    // 30% chance of conflicts
    return Math.random() < 0.3;
  }

  // ==========================================================================
  // Message Handling
  // ==========================================================================

  async handleMessage(message: AgentMessage): Promise<void> {
    console.log(`🌿 Branch & Conflict Agent received message from ${message.from}: ${message.content}`);

    // Handle messages from other agents
    switch (message.from) {
      case 'pr-agent-001':
        await this.handlePRMessage(message);
        break;
      case 'editor-agent-001':
        await this.handleEditorMessage(message);
        break;
      case 'bug-fix-agent-001':
        await this.handleBugFixMessage(message);
        break;
      default:
        console.log(`Branch & Conflict Agent: Received message from ${message.from}`);
    }
  }

  private async handlePRMessage(message: AgentMessage): Promise<void> {
    // Handle PR-related messages
    if (message.content.includes('created') || message.content.includes('PR')) {
      // Extract PR number
      const prMatch = message.content.match(/PR #(\d+)/);
      if (prMatch) {
        const prNumber = parseInt(prMatch[1]);
        // Auto-check for conflicts when PR is created
        this.handleDetectConflicts({
          id: `auto-task-${Date.now()}`,
          title: 'Check Conflicts',
          description: `PR #${prNumber}`,
          priority: 'high',
          status: 'pending',
          agentId: null,
          agentType: null,
          assignedAt: null,
          startedAt: null,
          completedAt: null,
          failedAt: null,
          errorMessage: null,
          result: null,
          createdBy: 'pr-agent',
          createdAt: Date.now(),
          tab: 'github',
          collaborationContextId: null,
        }).catch(console.error);
      }
    }
  }

  private async handleEditorMessage(message: AgentMessage): Promise<void> {
    // Handle editor messages
    if (message.content.includes('resolve') || message.content.includes('conflict')) {
      console.log(`✅ Conflict resolution assistance requested: ${message.content}`);
      // Editor agent is helping with conflict resolution
    }
  }

  private async handleBugFixMessage(message: AgentMessage): Promise<void> {
    // Handle bug fix messages
    if (message.content.includes('branch') || message.content.includes('worktree')) {
      console.log(`🐛 Bug fix branch request: ${message.content}`);
      // Create isolated worktree for bug fix
      await this.createIsolatedWorktree(message);
    }
  }

  // ==========================================================================
  // Worktree Management
  // ==========================================================================

  private async createIsolatedWorktree(message: AgentMessage): Promise<void> {
    const worktree: GitWorktree = {
      id: `worktree-bugfix-${Date.now()}`,
      path: `/tmp/worktrees/bugfix-${Date.now()}`,
      branch: `bugfix-${Date.now()}`,
      createdAt: Date.now(),
      isActive: true,
    };

    this.worktrees.set(worktree.id, worktree);

    // Create the branch
    const branch: BranchInfo = {
      name: worktree.branch,
      commitHash: this.generateCommitHash(),
      lastUpdated: Date.now(),
      protected: false,
      isDefault: false,
    };

    this.branches.set(branch.name, branch);

    await this.sendMessage(
      message.from,
      `Isolated worktree created: ${worktree.path} (branch: ${worktree.branch})`,
      message.taskId
    );
  }

  // ==========================================================================
  // Utility
  // ==========================================================================

  private generateCommitHash(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  async cleanup(): Promise<void> {
    this.branches.clear();
    this.conflicts.clear();
    this.worktrees.clear();
    console.log(`🌿 Branch & Conflict Agent (${this.id}) cleaned up`);
  }
}

// ==========================================================================
// Types
// ==========================================================================

interface BranchInfo {
  name: string;
  commitHash: string;
  lastUpdated: number;
  protected: boolean;
  isDefault: boolean;
}

interface MergeConflict {
  id: string;
  type: 'branch' | 'pr';
  target: string;
  baseBranch: string;
  headBranch: string;
  files: string[];
  status: 'detected' | 'resolving' | 'resolved';
  detectedAt: number;
  resolvedAt: number | null;
  resolutionStrategy: string | null;
}

interface GitWorktree {
  id: string;
  path: string;
  branch: string;
  createdAt: number;
  isActive: boolean;
}

// ==========================================================================
// Agent Factory Function
// ==========================================================================

export function createBranchConflictAgent(ctx: AgentContext): BranchConflictAgent {
  return new BranchConflictAgent(ctx);
}
