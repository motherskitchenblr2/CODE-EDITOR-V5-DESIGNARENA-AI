// ============================================================================
// Volt Code AGI - Code Monitoring Agent
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
// Code Monitor Agent Configuration
// ==========================================================================

const CODE_MONITOR_CONFIG: AgentConfig = DEFAULT_AGENT_CONFIGS.find(
  (c) => c.type === 'code-monitor'
) || {
  id: 'code-monitor-agent-001',
  alias: 'code-monitor',
  type: 'code-monitor',
  tab: 'editor',
  model: 'claude-fable-5.1',
  maxTasks: 5,
  description: 'Code quality, telemetry, drift detection',
  isActive: true,
};

// ==========================================================================
// Code Monitor Agent Class
// ==========================================================================

export class CodeMonitorAgent extends BaseAgent {
  private fileWatches: Map<string, FileWatch>;
  private codeMetrics: Map<string, CodeMetrics>;
  private qualityThresholds: QualityThresholds;
  private driftDetection: Map<string, CodeDrift>;

  constructor(ctx: AgentContext) {
    super(ctx);
    this.fileWatches = new Map();
    this.codeMetrics = new Map();
    this.driftDetection = new Map();
    this.qualityThresholds = {
      complexity: { warning: 10, critical: 20 },
      duplication: { warning: 5, critical: 15 },
      coverage: { warning: 80, critical: 50 },
      issues: { warning: 5, critical: 10 },
    };
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  async initialize(): Promise<void> {
    console.log(`📊 Code Monitor Agent (${this.id}) initializing...`);
    this.status = 'idle';
    this.updateHeartbeat();

    // Register with orchestrator
    await this.ctx.orchestrator.registerAgent(CODE_MONITOR_CONFIG);

    // Start monitoring loop
    this.startMonitoringLoop();

    console.log(`✅ Code Monitor Agent (${this.id}) ready`);
  }

  private startMonitoringLoop(): void {
    // Check file changes every 5 seconds
    setInterval(() => {
      this.checkFileChanges().catch(console.error);
    }, 5000);

    // Analyze code quality every 30 seconds
    setInterval(() => {
      this.analyzeCodeQuality().catch(console.error);
    }, 30000);

    // Detect drift every minute
    setInterval(() => {
      this.detectDrift().catch(console.error);
    }, 60000);
  }

  // ==========================================================================
  // Task Execution
  // ==========================================================================

  async executeTask(task: AgentTask): Promise<void> {
    console.log(`📊 Code Monitor Agent executing task: ${task.title}`);

    this.currentTask = task;
    this.updateStatus('busy');
    this.ctx.orchestrator.startTask(task.id).catch(console.error);

    try {
      // Route task based on type
      switch (task.title.toLowerCase() || task.description.toLowerCase()) {
        case 'monitor code':
        case 'start monitoring':
          await this.handleStartMonitoring(task);
          break;
        case 'stop monitoring':
          await this.handleStopMonitoring(task);
          break;
        case 'analyze quality':
        case 'quality analysis':
          await this.handleQualityAnalysis(task);
          break;
        case 'check drift':
        case 'drift detection':
          await this.handleDriftDetection(task);
          break;
        case 'generate telemetry':
          await this.handleGenerateTelemetry(task);
          break;
        default:
          await this.handleGenericTask(task);
      }

      await this.completeTask(task.id, { success: true });
      console.log(`✅ Code Monitor Agent completed task: ${task.title}`);
    } catch (err) {
      console.error(`❌ Code Monitor Agent failed task: ${task.title}`, err);
      await this.failTask(task.id, `Code Monitor Agent error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      this.currentTask = null;
      this.updateStatus('idle');
      this.updateHeartbeat();
    }
  }

  // ==========================================================================
  // Task Handlers
  // ==========================================================================

  private async handleStartMonitoring(task: AgentTask): Promise<void> {
    // Extract file paths from task description
    const files = this.extractFilesFromDescription(task.description);

    for (const file of files) {
      await this.startWatchingFile(file);
    }

    await this.sendMessage(
      'all',
      `Started monitoring ${files.length} file(s): ${files.join(', ')}`,
      task.id
    );
  }

  private async handleStopMonitoring(task: AgentTask): Promise<void> {
    // Extract file paths from task description
    const files = this.extractFilesFromDescription(task.description);

    for (const file of files) {
      this.stopWatchingFile(file);
    }

    await this.sendMessage(
      'all',
      `Stopped monitoring ${files.length} file(s): ${files.join(', ')}`,
      task.id
    );
  }

  private async handleQualityAnalysis(task: AgentTask): Promise<void> {
    // Analyze code quality
    await this.analyzeCodeQuality();

    const metrics = Array.from(this.codeMetrics.values());
    const issues = metrics.filter((m) => m.issues.length > 0);

    if (issues.length > 0) {
      const issueSummary = issues.map(
        (m) => `${m.filePath}: ${m.issues.length} issue(s)`
      ).join('\n');

      await this.sendMessage(
        'editor-agent-001',
        `Code quality issues detected:\n${issueSummary}`,
        task.id
      );
    } else {
      await this.sendMessage(
        'all',
        'Code quality analysis: No issues detected',
        task.id
      );
    }
  }

  private async handleDriftDetection(task: AgentTask): Promise<void> {
    // Detect code drift
    await this.detectDrift();

    const drifts = Array.from(this.driftDetection.values()).filter(
      (d) => d.status === 'detected'
    );

    if (drifts.length > 0) {
      const driftSummary = drifts.map(
        (d) => `${d.filePath}: ${d.changePercentage}% changed`
      ).join('\n');

      await this.sendMessage(
        'editor-agent-001',
        `Code drift detected:\n${driftSummary}`,
        task.id
      );
    } else {
      await this.sendMessage(
        'all',
        'Code drift detection: No significant drift detected',
        task.id
      );
    }
  }

  private async handleGenerateTelemetry(task: AgentTask): Promise<void> {
    // Generate telemetry report
    const telemetry = this.generateTelemetryReport();

    await this.sendMessage(
      'all',
      `Telemetry Report:\n${JSON.stringify(telemetry, null, 2)}`,
      task.id
    );
  }

  private async handleGenericTask(task: AgentTask): Promise<void> {
    // Generic task handling
    await this.simulateDelay(2000);
    console.log(`Code Monitor Agent processed generic task: ${task.title}`);
  }

  // ==========================================================================
  // Monitoring Methods
  // ==========================================================================

  private async checkFileChanges(): Promise<void> {
    const changedFiles: string[] = [];

    this.fileWatches.forEach((watch, filePath) => {
      // Simulate file change detection
      if (Math.random() < 0.1) {
        watch.lastModified = Date.now();
        watch.hasChanged = true;
        changedFiles.push(filePath);
      }
    });

    if (changedFiles.length > 0) {
      console.log(`📝 Detected changes in ${changedFiles.length} file(s)`);

      for (const filePath of changedFiles) {
        await this.handleFileChange(filePath);
      }
    }
  }

  private async handleFileChange(filePath: string): Promise<void> {
    const watch = this.fileWatches.get(filePath);
    if (!watch) return;

    // Update last modified
    watch.lastModified = Date.now();
    watch.hasChanged = false;

    // Re-analyze the file
    await this.analyzeFile(filePath);

    // Notify other agents
    await this.sendMessage(
      'editor-agent-001',
      `File changed: ${filePath}. Re-analyzing...`,
      this.currentTask?.id
    );

    await this.sendMessage(
      'security-scan-agent-001',
      `File changed: ${filePath}. Please re-scan for vulnerabilities.`,
      this.currentTask?.id
    );
  }

  private async analyzeCodeQuality(): Promise<void> {
    console.log('📊 Analyzing code quality...');

    this.fileWatches.forEach((watch) => {
      if (!this.codeMetrics.has(watch.filePath)) {
        this.codeMetrics.set(watch.filePath, {
          filePath: watch.filePath,
          complexity: 0,
          duplication: 0,
          coverage: 100,
          issues: [],
          lastAnalyzed: Date.now(),
        });
      }

      const metrics = this.codeMetrics.get(watch.filePath)!;

      // Simulate quality analysis with random values
      metrics.complexity = Math.floor(Math.random() * 30);
      metrics.duplication = Math.floor(Math.random() * 20);
      metrics.coverage = Math.floor(Math.random() * 100);
      metrics.issues = this.generateRandomIssues();
      metrics.lastAnalyzed = Date.now();

      // Check thresholds
      this.checkQualityThresholds(metrics);
    });
  }

  private checkQualityThresholds(metrics: CodeMetrics): void {
    const issues: string[] = [];

    if (metrics.complexity >= this.qualityThresholds.complexity.critical) {
      issues.push(`High complexity (${metrics.complexity}) exceeds critical threshold`);
    } else if (metrics.complexity >= this.qualityThresholds.complexity.warning) {
      issues.push(`Complexity (${metrics.complexity}) exceeds warning threshold`);
    }

    if (metrics.duplication >= this.qualityThresholds.duplication.critical) {
      issues.push(`High duplication (${metrics.duplication}%) exceeds critical threshold`);
    } else if (metrics.duplication >= this.qualityThresholds.duplication.warning) {
      issues.push(`Duplication (${metrics.duplication}%) exceeds warning threshold`);
    }

    if (metrics.coverage <= this.qualityThresholds.coverage.critical) {
      issues.push(`Low coverage (${metrics.coverage}%) below critical threshold`);
    } else if (metrics.coverage <= this.qualityThresholds.coverage.warning) {
      issues.push(`Coverage (${metrics.coverage}%) below warning threshold`);
    }

    if (metrics.issues.length >= this.qualityThresholds.issues.critical) {
      issues.push(`Too many issues (${metrics.issues.length}) exceeds critical threshold`);
    } else if (metrics.issues.length >= this.qualityThresholds.issues.warning) {
      issues.push(`Many issues (${metrics.issues.length}) exceeds warning threshold`);
    }

    if (issues.length > 0) {
      console.warn(`⚠️ Quality issues in ${metrics.filePath}: ${issues.join(', ')}`);
    }
  }

  private async detectDrift(): Promise<void> {
    console.log('🔄 Detecting code drift...');

    this.fileWatches.forEach((watch) => {
      if (!this.driftDetection.has(watch.filePath)) {
        this.driftDetection.set(watch.filePath, {
          filePath: watch.filePath,
          baseHash: this.generateHash(),
          currentHash: this.generateHash(),
          changePercentage: 0,
          status: 'stable',
          lastChecked: Date.now(),
        });
      }

      const drift = this.driftDetection.get(watch.filePath)!;

      // Simulate drift detection
      const changeProbability = Math.random();

      if (changeProbability < 0.3) {
        // 30% chance of drift
        drift.currentHash = this.generateHash();
        drift.changePercentage = Math.floor(Math.random() * 80) + 10; // 10-90%
        drift.status = 'detected';
      } else {
        drift.changePercentage = 0;
        drift.status = 'stable';
      }

      drift.lastChecked = Date.now();
    });
  }

  // ==========================================================================
  // File Watching
  // ==========================================================================

  private extractFilesFromDescription(description: string | undefined): string[] {
    if (!description) return [];

    const filePatterns = [
      /file:(\S+)/g,
      /path:(\S+)/g,
      /(\S+\.(ts|tsx|js|jsx|py|java|cpp|h|html|css|json))\b/g,
    ];

    const files: Set<string> = new Set();

    filePatterns.forEach((pattern) => {
      const matches = description.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          const file = match.split(':').pop() || match;
          if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
            files.add(file);
          }
        });
      }
    });

    return Array.from(files);
  }

  private async startWatchingFile(filePath: string): Promise<void> {
    if (this.fileWatches.has(filePath)) {
      console.log(`⚠️ Already watching ${filePath}`);
      return;
    }

    const watch: FileWatch = {
      filePath,
      lastModified: Date.now(),
      hasChanged: false,
      isActive: true,
    };

    this.fileWatches.set(filePath, watch);

    // Initialize metrics
    this.codeMetrics.set(filePath, {
      filePath,
      complexity: 0,
      duplication: 0,
      coverage: 100,
      issues: [],
      lastAnalyzed: Date.now(),
    });

    // Initialize drift detection
    this.driftDetection.set(filePath, {
      filePath,
      baseHash: this.generateHash(),
      currentHash: this.generateHash(),
      changePercentage: 0,
      status: 'stable',
      lastChecked: Date.now(),
    });

    console.log(`👁️ Started watching file: ${filePath}`);

    // Initial analysis
    await this.analyzeFile(filePath);
  }

  private stopWatchingFile(filePath: string): void {
    if (!this.fileWatches.has(filePath)) {
      console.log(`⚠️ Not watching ${filePath}`);
      return;
    }

    const watch = this.fileWatches.get(filePath)!;
    watch.isActive = false;
    this.fileWatches.delete(filePath);

    // Clean up related data
    this.codeMetrics.delete(filePath);
    this.driftDetection.delete(filePath);

    console.log(`👁️ Stopped watching file: ${filePath}`);
  }

  private async analyzeFile(filePath: string): Promise<void> {
    // Simulate file analysis
    await this.simulateDelay(500);

    const metrics = this.codeMetrics.get(filePath);
    if (metrics) {
      // Simulate analysis results
      metrics.complexity = Math.floor(Math.random() * 30);
      metrics.duplication = Math.floor(Math.random() * 20);
      metrics.coverage = Math.floor(Math.random() * 100);
      metrics.issues = this.generateRandomIssues();
      metrics.lastAnalyzed = Date.now();

      this.checkQualityThresholds(metrics);
    }
  }

  // ==========================================================================
  // Telemetry
  // ==========================================================================

  private generateTelemetryReport() {
    const totalFiles = this.fileWatches.size;
    const activeWatches = Array.from(this.fileWatches.values()).filter(
      (w) => w.isActive
    ).length;
    const changedFiles = Array.from(this.fileWatches.values()).filter(
      (w) => w.hasChanged
    ).length;

    const metrics = Array.from(this.codeMetrics.values());
    const avgComplexity =
      metrics.reduce((sum, m) => sum + m.complexity, 0) / Math.max(1, metrics.length);
    const avgDuplication =
      metrics.reduce((sum, m) => sum + m.duplication, 0) / Math.max(1, metrics.length);
    const avgCoverage =
      metrics.reduce((sum, m) => sum + m.coverage, 0) / Math.max(1, metrics.length);
    const totalIssues = metrics.reduce((sum, m) => sum + m.issues.length, 0);

    const drifts = Array.from(this.driftDetection.values()).filter(
      (d) => d.status === 'detected'
    );

    return {
      timestamp: Date.now(),
      files: {
        total: totalFiles,
        active: activeWatches,
        changed: changedFiles,
      },
      quality: {
        averageComplexity: Math.round(avgComplexity * 100) / 100,
        averageDuplication: Math.round(avgDuplication * 100) / 100,
        averageCoverage: Math.round(avgCoverage * 100) / 100,
        totalIssues,
      },
      drift: {
        detected: drifts.length,
        files: drifts.map((d) => d.filePath),
      },
    };
  }

  // ==========================================================================
  // Message Handling
  // ==========================================================================

  async handleMessage(message: AgentMessage): Promise<void> {
    console.log(`📊 Code Monitor Agent received message from ${message.from}: ${message.content}`);

    // Handle messages from other agents
    switch (message.from) {
      case 'editor-agent-001':
        await this.handleEditorMessage(message);
        break;
      case 'security-scan-agent-001':
        await this.handleSecurityMessage(message);
        break;
      case 'bug-fix-agent-001':
        await this.handleBugFixMessage(message);
        break;
      default:
        console.log(`Code Monitor Agent: Received message from ${message.from}`);
    }
  }

  private async handleEditorMessage(message: AgentMessage): Promise<void> {
    // Handle code-related messages
    if (message.content.includes('new code') || message.content.includes('written')) {
      console.log(`📝 New code detected: ${message.content}`);
      // Analyze new code
      const files = this.extractFilesFromDescription(message.content);
      if (files.length > 0) {
        for (const file of files) {
          await this.startWatchingFile(file);
        }
      }
    }
  }

  private async handleSecurityMessage(message: AgentMessage): Promise<void> {
    // Handle security-related messages
    if (message.content.includes('vulnerability') || message.content.includes('CVE')) {
      console.log(`🚨 Security alert: ${message.content}`);
      // Re-analyze files for security issues
      this.fileWatches.forEach(async (watch) => {
        await this.analyzeFile(watch.filePath);
      });
    }
  }

  private async handleBugFixMessage(message: AgentMessage): Promise<void> {
    // Handle bug fix messages
    if (message.content.includes('fixed') || message.content.includes('resolved')) {
      console.log(`🐛 Bug fix: ${message.content}`);
      // Re-analyze after bug fix
      this.fileWatches.forEach(async (watch) => {
        await this.analyzeFile(watch.filePath);
      });
    }
  }

  // ==========================================================================
  // Utility
  // ==========================================================================

  private generateRandomIssues(): string[] {
    const issues: string[] = [];
    const issueTypes = [
      'Unused variable',
      'Missing type annotation',
      'Potential null reference',
      'Unused import',
      'Missing return type',
      'Complex function',
      'Long parameter list',
      'Nested callbacks',
      'Magic number',
      'Todo comment',
    ];

    const count = Math.floor(Math.random() * 10);
    for (let i = 0; i < count; i++) {
      const issue = issueTypes[Math.floor(Math.random() * issueTypes.length)];
      issues.push(issue);
    }

    return issues;
  }

  private generateHash(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  async cleanup(): Promise<void> {
    // Stop all file watches
    this.fileWatches.forEach((watch) => {
      watch.isActive = false;
    });

    this.fileWatches.clear();
    this.codeMetrics.clear();
    this.driftDetection.clear();

    console.log(`📊 Code Monitor Agent (${this.id}) cleaned up`);
  }
}

// ==========================================================================
// Types
// ==========================================================================

interface FileWatch {
  filePath: string;
  lastModified: number;
  hasChanged: boolean;
  isActive: boolean;
}

interface CodeMetrics {
  filePath: string;
  complexity: number;
  duplication: number;
  coverage: number;
  issues: string[];
  lastAnalyzed: number;
}

interface QualityThresholds {
  complexity: { warning: number; critical: number };
  duplication: { warning: number; critical: number };
  coverage: { warning: number; critical: number };
  issues: { warning: number; critical: number };
}

interface CodeDrift {
  filePath: string;
  baseHash: string;
  currentHash: string;
  changePercentage: number;
  status: 'stable' | 'detected' | 'resolved';
  lastChecked: number;
}

// ==========================================================================
// Agent Factory Function
// ==========================================================================

export function createCodeMonitorAgent(ctx: AgentContext): CodeMonitorAgent {
  return new CodeMonitorAgent(ctx);
}
