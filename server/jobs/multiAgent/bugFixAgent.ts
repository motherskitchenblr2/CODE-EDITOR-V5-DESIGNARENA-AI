// ============================================================================
// Volt Code AGI - Bug Fixing Agent
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
// Bug Fix Agent Configuration
// ==========================================================================

const BUG_FIX_CONFIG: AgentConfig = DEFAULT_AGENT_CONFIGS.find(
  (c) => c.type === 'bug-fix'
) || {
  id: 'bug-fix-agent-001',
  alias: 'bug-fix',
  type: 'bug-fix',
  tab: 'github',
  model: 'claude-opus-5.5',
  maxTasks: 3,
  description: 'Bug triage, reproduction, fix implementation',
  isActive: true,
};

// ==========================================================================
// Bug Fix Agent Class
// ==========================================================================

export class BugFixAgent extends BaseAgent {
  private bugQueue: BugReport[];
  private reproductionEnvironments: Map<string, ReproductionEnvironment>;
  private fixHistory: Map<string, BugFix>;

  constructor(ctx: AgentContext) {
    super(ctx);
    this.bugQueue = [];
    this.reproductionEnvironments = new Map();
    this.fixHistory = new Map();
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  async initialize(): Promise<void> {
    console.log(`🐛 Bug Fix Agent (${this.id}) initializing...`);
    this.status = 'idle';
    this.updateHeartbeat();

    // Register with orchestrator
    await this.ctx.orchestrator.registerAgent(BUG_FIX_CONFIG);

    // Start bug triage loop
    this.startBugTriageLoop();

    console.log(`✅ Bug Fix Agent (${this.id}) ready`);
  }

  private startBugTriageLoop(): void {
    // Process bug queue every 10 seconds
    setInterval(() => {
      this.processBugQueue().catch(console.error);
    }, 10000);
  }

  // ==========================================================================
  // Task Execution
  // ==========================================================================

  async executeTask(task: AgentTask): Promise<void> {
    console.log(`🐛 Bug Fix Agent executing task: ${task.title}`);

    this.currentTask = task;
    this.updateStatus('busy');
    this.ctx.orchestrator.startTask(task.id).catch(console.error);

    try {
      // Route task based on type
      switch (task.title.toLowerCase() || task.description.toLowerCase()) {
        case 'triage bug':
        case 'bug triage':
          await this.handleBugTriage(task);
          break;
        case 'reproduce bug':
        case 'reproduce':
          await this.handleReproduceBug(task);
          break;
        case 'fix bug':
        case 'implement fix':
          await this.handleImplementFix(task);
          break;
        case 'verify fix':
        case 'verify':
          await this.handleVerifyFix(task);
          break;
        case 'create pr':
          await this.handleCreateFixPR(task);
          break;
        default:
          await this.handleGenericTask(task);
      }

      await this.completeTask(task.id, { success: true });
      console.log(`✅ Bug Fix Agent completed task: ${task.title}`);
    } catch (err) {
      console.error(`❌ Bug Fix Agent failed task: ${task.title}`, err);
      await this.failTask(task.id, `Bug Fix Agent error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      this.currentTask = null;
      this.updateStatus('idle');
      this.updateHeartbeat();
    }
  }

  // ==========================================================================
  // Task Handlers
  // ==========================================================================

  private async handleBugTriage(task: AgentTask): Promise<void> {
    // Simulate bug triage
    await this.simulateDelay(2000);

    // Extract bug info from task
    const bugInfo = this.extractBugInfo(task.description);

    const bugReport: BugReport = {
      id: `bug-${Date.now()}`,
      title: bugInfo.title || task.title,
      description: bugInfo.description || task.description || '',
      severity: bugInfo.severity || 'medium',
      status: 'triage',
      reportedBy: bugInfo.reportedBy || 'user',
      reportedAt: Date.now(),
      labels: bugInfo.labels || [],
      priority: this.severityToPriority(bugInfo.severity || 'medium'),
    };

    this.bugQueue.push(bugReport);

    await this.sendMessage(
      'all',
      `Bug triaged: ${bugReport.title} (${bugReport.severity})`,
      task.id
    );

    // Notify editor agent if high priority
    if (bugReport.priority === 'high' || bugReport.priority === 'critical') {
      await this.sendMessage(
        'editor-agent-001',
        `High priority bug: ${bugReport.title}. Please review.`,
        task.id
      );
    }
  }

  private async handleReproduceBug(task: AgentTask): Promise<void> {
    // Simulate bug reproduction
    await this.simulateDelay(3000);

    const bugId = task.description?.split(' ').pop() || '';
    const bug = this.bugQueue.find((b) => b.id === bugId);

    if (bug) {
      // Create isolated reproduction environment
      const env = await this.createReproductionEnvironment(bug);
      this.reproductionEnvironments.set(bug.id, env);

      bug.status = 'reproducing';

      // Simulate reproduction
      const canReproduce = Math.random() < 0.8; // 80% chance of successful reproduction

      if (canReproduce) {
        bug.status = 'reproduced';
        await this.sendMessage(
          'all',
          `Bug reproduced: ${bug.title}. Environment: ${env.id}`,
          task.id
        );

        // Notify editor agent to implement fix
        await this.sendMessage(
          'editor-agent-001',
          `Bug reproduced: ${bug.title}. Please implement fix in environment ${env.id}`,
          task.id
        );
      } else {
        bug.status = 'cannot-reproduce';
        await this.sendMessage(
          'all',
          `Cannot reproduce bug: ${bug.title}. Needs more information.`,
          task.id
        );
      }
    } else {
      await this.sendMessage(
        'all',
        `Bug not found: ${bugId}`,
        task.id
      );
    }
  }

  private async handleImplementFix(task: AgentTask): Promise<void> {
    // Simulate fix implementation
    await this.simulateDelay(4000);

    const bugId = task.description?.split(' ').pop() || '';
    const bug = this.bugQueue.find((b) => b.id === bugId);

    if (bug) {
      // Check if bug is reproduced
      if (bug.status !== 'reproduced') {
        throw new Error('Cannot implement fix: Bug not reproduced yet');
      }

      bug.status = 'fixing';

      // Simulate fix implementation
      const fix: BugFix = {
        id: `fix-${Date.now()}`,
        bugId: bug.id,
        description: `Fix for: ${bug.title}`,
        changes: this.generateRandomChanges(),
        implementedAt: Date.now(),
        implementedBy: this.id,
        status: 'implemented',
      };

      this.fixHistory.set(fix.id, fix);
      bug.fixId = fix.id;
      bug.status = 'fixed';

      await this.sendMessage(
        'all',
        `Fix implemented: ${bug.title}. Changes: ${fix.changes.length} file(s)`,
        task.id
      );

      // Notify editor agent to verify
      await this.sendMessage(
        'editor-agent-001',
        `Fix implemented for: ${bug.title}. Please verify.`,
        task.id
      );
    } else {
      await this.sendMessage(
        'all',
        `Bug not found: ${bugId}`,
        task.id
      );
    }
  }

  private async handleVerifyFix(task: AgentTask): Promise<void> {
    // Simulate fix verification
    await this.simulateDelay(2500);

    const fixId = task.description?.split(' ').pop() || '';
    const fix = this.fixHistory.get(fixId);

    if (fix) {
      const bug = this.bugQueue.find((b) => b.id === fix.bugId);

      if (bug) {
        // Simulate verification
        const isFixed = Math.random() < 0.9; // 90% chance of successful fix

        if (isFixed) {
          bug.status = 'verified';
          fix.status = 'verified';

          await this.sendMessage(
            'all',
            `Fix verified: ${bug.title}. Ready for PR.`,
            task.id
          );

          // Create PR for the fix
          await this.sendMessage(
            'pr-agent-001',
            `Create PR for fix: ${bug.title}. Fix ID: ${fix.id}`,
            task.id
          );
        } else {
          bug.status = 'reopened';
          fix.status = 'failed';

          await this.sendMessage(
            'all',
            `Fix verification failed: ${bug.title}. Bug reopened.`,
            task.id
          );

          // Notify editor agent
          await this.sendMessage(
            'editor-agent-001',
            `Fix failed for: ${bug.title}. Please review.`,
            task.id
          );
        }
      }
    } else {
      await this.sendMessage(
        'all',
        `Fix not found: ${fixId}`,
        task.id
      );
    }
  }

  private async handleCreateFixPR(task: AgentTask): Promise<void> {
    // Forward to PR agent
    await this.sendMessage(
      'pr-agent-001',
      `Create PR for bug fix: ${task.description}`,
      task.id
    );
  }

  private async handleGenericTask(task: AgentTask): Promise<void> {
    // Generic task handling
    await this.simulateDelay(2000);
    console.log(`Bug Fix Agent processed generic task: ${task.title}`);
  }

  // ==========================================================================
  // Bug Queue Processing
  // ==========================================================================

  private async processBugQueue(): Promise<void> {
    if (this.bugQueue.length === 0) return;

    // Sort by priority
    this.bugQueue.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Process highest priority bug
    const bug = this.bugQueue[0];

    if (bug.status === 'triage') {
      // Auto-reproduce if not already
      this.handleReproduceBug({
        id: `auto-task-${Date.now()}`,
        title: 'Reproduce Bug',
        description: bug.id,
        priority: bug.priority,
        status: 'pending',
        agentId: null,
        agentType: null,
        assignedAt: null,
        startedAt: null,
        completedAt: null,
        failedAt: null,
        errorMessage: null,
        result: null,
        createdBy: this.id,
        createdAt: Date.now(),
        tab: 'github',
        collaborationContextId: null,
      }).catch(console.error);
    } else if (bug.status === 'reproduced' && !bug.fixId) {
      // Auto-implement fix
      this.handleImplementFix({
        id: `auto-task-${Date.now()}`,
        title: 'Implement Fix',
        description: bug.id,
        priority: bug.priority,
        status: 'pending',
        agentId: null,
        agentType: null,
        assignedAt: null,
        startedAt: null,
        completedAt: null,
        failedAt: null,
        errorMessage: null,
        result: null,
        createdBy: this.id,
        createdAt: Date.now(),
        tab: 'github',
        collaborationContextId: null,
      }).catch(console.error);
    } else if (bug.status === 'fixed' && !bug.verifiedAt) {
      // Auto-verify
      this.handleVerifyFix({
        id: `auto-task-${Date.now()}`,
        title: 'Verify Fix',
        description: bug.fixId || bug.id,
        priority: bug.priority,
        status: 'pending',
        agentId: null,
        agentType: null,
        assignedAt: null,
        startedAt: null,
        completedAt: null,
        failedAt: null,
        errorMessage: null,
        result: null,
        createdBy: this.id,
        createdAt: Date.now(),
        tab: 'github',
        collaborationContextId: null,
      }).catch(console.error);
    }
  }

  // ==========================================================================
  // Reproduction Environment
  // ==========================================================================

  private async createReproductionEnvironment(bug: BugReport): Promise<ReproductionEnvironment> {
    const env: ReproductionEnvironment = {
      id: `env-${Date.now()}`,
      bugId: bug.id,
      path: `/tmp/reproduce/${bug.id}`,
      branch: `reproduce-${bug.id}`,
      createdAt: Date.now(),
      isActive: true,
      steps: [],
    };

    // Simulate environment creation
    await this.simulateDelay(1000);

    // Generate reproduction steps
    env.steps = this.generateReproductionSteps(bug);

    return env;
  }

  private generateReproductionSteps(bug: BugReport): string[] {
    const steps: string[] = [];

    // Generate random reproduction steps
    const stepTemplates = [
      `Run command: npm test`,
      `Open file: ${bug.title.toLowerCase().replace(/\s+/g, '-')}.ts`,
      `Call function: test${Math.floor(Math.random() * 100)}()`,
      `Navigate to: /${bug.title.toLowerCase().replace(/\s+/g, '-')}`,
      `Input: ${Math.random().toString(36).substring(2, 10)}`,
      `Click: Submit button`,
      `Wait for: Error to appear`,
    ];

    const count = Math.floor(Math.random() * 5) + 3; // 3-7 steps
    for (let i = 0; i < count; i++) {
      steps.push(stepTemplates[Math.floor(Math.random() * stepTemplates.length)]);
    }

    return steps;
  }

  // ==========================================================================
  // Bug Extraction
  // ==========================================================================

  private extractBugInfo(description: string | undefined): {
    title?: string;
    description?: string;
    severity?: string;
    reportedBy?: string;
    labels?: string[];
  } {
    if (!description) return {};

    const result: {
      title?: string;
      description?: string;
      severity?: string;
      reportedBy?: string;
      labels?: string[];
    } = {};

    // Extract title
    const titleMatch = description.match(/title:\s*([^\n]+)/i);
    if (titleMatch) result.title = titleMatch[1];

    // Extract description
    const descMatch = description.match(/description:\s*([^\n]+)/i);
    if (descMatch) result.description = descMatch[1];

    // Extract severity
    const severityMatch = description.match(/severity:\s*(\w+)/i);
    if (severityMatch) result.severity = severityMatch[1].toLowerCase();

    // Extract reported by
    const reportedByMatch = description.match(/reported by:\s*([^\n]+)/i);
    if (reportedByMatch) result.reportedBy = reportedByMatch[1];

    // Extract labels
    const labelsMatch = description.match(/labels:\s*([^\n]+)/i);
    if (labelsMatch) {
      result.labels = labelsMatch[1].split(',').map((l) => l.trim());
    }

    return result;
  }

  private severityToPriority(severity: string): 'critical' | 'high' | 'medium' | 'low' {
    const mapping: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low',
    };
    return mapping[severity.toLowerCase()] || 'medium';
  }

  private generateRandomChanges(): string[] {
    const changes: string[] = [];
    const fileTypes = ['.ts', '.tsx', '.js', '.jsx', '.json'];

    const count = Math.floor(Math.random() * 5) + 1; // 1-5 files
    for (let i = 0; i < count; i++) {
      const file = `src/${Math.random().toString(36).substring(2, 10)}${fileTypes[Math.floor(Math.random() * fileTypes.length)]}`;
      changes.push(file);
    }

    return changes;
  }

  // ==========================================================================
  // Message Handling
  // ==========================================================================

  async handleMessage(message: AgentMessage): Promise<void> {
    console.log(`🐛 Bug Fix Agent received message from ${message.from}: ${message.content}`);

    // Handle messages from other agents
    switch (message.from) {
      case 'editor-agent-001':
        await this.handleEditorMessage(message);
        break;
      case 'code-monitor-agent-001':
        await this.handleMonitorMessage(message);
        break;
      case 'security-scan-agent-001':
        await this.handleSecurityMessage(message);
        break;
      case 'pr-agent-001':
        await this.handlePRMessage(message);
        break;
      default:
        console.log(`Bug Fix Agent: Received message from ${message.from}`);
    }
  }

  private async handleEditorMessage(message: AgentMessage): Promise<void> {
    // Handle editor messages
    if (message.content.includes('bug') || message.content.includes('issue')) {
      console.log(`🐛 Bug report from editor: ${message.content}`);
      // Auto-triage bug
      this.handleBugTriage({
        id: `auto-task-${Date.now()}`,
        title: 'Triage Bug',
        description: message.content,
        priority: 'medium',
        status: 'pending',
        agentId: null,
        agentType: null,
        assignedAt: null,
        startedAt: null,
        completedAt: null,
        failedAt: null,
        errorMessage: null,
        result: null,
        createdBy: 'editor-agent',
        createdAt: Date.now(),
        tab: 'editor',
        collaborationContextId: null,
      }).catch(console.error);
    }
  }

  private async handleMonitorMessage(message: AgentMessage): Promise<void> {
    // Handle code monitor messages
    if (message.content.includes('quality') || message.content.includes('issue')) {
      console.log(`📊 Quality issue detected: ${message.content}`);
      // Check if this is a bug
      if (Math.random() < 0.5) {
        this.handleBugTriage({
          id: `auto-task-${Date.now()}`,
          title: 'Triage Bug',
          description: `Quality issue: ${message.content}`,
          priority: 'medium',
          status: 'pending',
          agentId: null,
          agentType: null,
          assignedAt: null,
          startedAt: null,
          completedAt: null,
          failedAt: null,
          errorMessage: null,
          result: null,
          createdBy: 'code-monitor-agent',
          createdAt: Date.now(),
          tab: 'editor',
          collaborationContextId: null,
        }).catch(console.error);
      }
    }
  }

  private async handleSecurityMessage(message: AgentMessage): Promise<void> {
    // Handle security messages
    if (message.content.includes('vulnerability') || message.content.includes('CVE')) {
      console.log(`🚨 Security vulnerability: ${message.content}`);
      // Create bug for security vulnerability
      this.handleBugTriage({
        id: `auto-task-${Date.now()}`,
        title: 'Triage Bug',
        description: `Security vulnerability: ${message.content}`,
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
        createdBy: 'security-scan-agent',
        createdAt: Date.now(),
        tab: 'editor',
        collaborationContextId: null,
      }).catch(console.error);
    }
  }

  private async handlePRMessage(message: AgentMessage): Promise<void> {
    // Handle PR messages
    if (message.content.includes('conflict') || message.content.includes('merge')) {
      console.log(`⚠️ PR conflict: ${message.content}`);
      // This might indicate a bug in the merge process
    }
  }

  // ==========================================================================
  // Utility
  // ==========================================================================

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  async cleanup(): Promise<void> {
    this.bugQueue = [];
    this.reproductionEnvironments.clear();
    this.fixHistory.clear();

    console.log(`🐛 Bug Fix Agent (${this.id}) cleaned up`);
  }
}

// ==========================================================================
// Types
// ==========================================================================

interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'triage' | 'reproducing' | 'reproduced' | 'cannot-reproduce' | 'fixing' | 'fixed' | 'verified' | 'reopened';
  reportedBy: string;
  reportedAt: number;
  labels: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  fixId?: string;
  verifiedAt?: number;
}

interface ReproductionEnvironment {
  id: string;
  bugId: string;
  path: string;
  branch: string;
  createdAt: number;
  isActive: boolean;
  steps: string[];
}

interface BugFix {
  id: string;
  bugId: string;
  description: string;
  changes: string[];
  implementedAt: number;
  implementedBy: string;
  status: 'implemented' | 'verified' | 'failed';
}

// ==========================================================================
// Agent Factory Function
// ==========================================================================

export function createBugFixAgent(ctx: AgentContext): BugFixAgent {
  return new BugFixAgent(ctx);
}
