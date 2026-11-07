// ============================================================================
// Volt Code AGI - Security Vulnerability Agent
// ============================================================================

import { BaseAgent, AgentContext } from './types';
import {
  AgentTask,
  AgentMessage,
  AgentConfig,
  AgentType,
  AgentTab,
  AgentStatus,
  VulnerabilityAlert,
} from '../../../shared/types';
import { DEFAULT_AGENT_CONFIGS } from '../../../shared/types';
import { SECURITY_CONFIG } from '../../config/constants';

// ==========================================================================
// Security Agent Configuration
// ==========================================================================

const SECURITY_CONFIG_DATA: AgentConfig = DEFAULT_AGENT_CONFIGS.find(
  (c) => c.type === 'security-scan'
) || {
  id: 'security-scan-agent-001',
  alias: 'security-scan',
  type: 'security-scan',
  tab: 'editor',
  model: 'claude-opus-5.5',
  maxTasks: 2,
  description: 'CVE scanning, security patching',
  isActive: true,
};

// ==========================================================================
// Security Agent Class
// ==========================================================================

export class SecurityAgent extends BaseAgent {
  private vulnerabilityDatabase: Map<string, VulnerabilityData>;
  private scanHistory: Map<string, SecurityScan>;
  private scheduledScans: Map<string, NodeJS.Timeout>;

  constructor(ctx: AgentContext) {
    super(ctx);
    this.vulnerabilityDatabase = new Map();
    this.scanHistory = new Map();
    this.scheduledScans = new Map();

    // Initialize vulnerability database
    this.initializeVulnerabilityDatabase();

    // Start periodic scanning
    this.startPeriodicScanning();
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  async initialize(): Promise<void> {
    console.log(`🔒 Security Agent (${this.id}) initializing...`);
    this.status = 'idle';
    this.updateHeartbeat();

    // Register with orchestrator
    await this.ctx.orchestrator.registerAgent(SECURITY_CONFIG_DATA);

    console.log(`✅ Security Agent (${this.id}) ready`);
  }

  private initializeVulnerabilityDatabase(): void {
    // Simulate vulnerability database
    const vulnerabilities: VulnerabilityData[] = [
      {
        id: 'CVE-2024-1234',
        packageName: 'lodash',
        affectedVersions: '<4.17.21',
        fixedVersion: '4.17.21',
        severity: 'critical',
        description: 'Prototype pollution vulnerability in lodash',
        cvssScore: 9.8,
        publishedAt: Date.now() - 86400000 * 7, // 1 week ago
        lastUpdated: Date.now(),
      },
      {
        id: 'CVE-2024-5678',
        packageName: 'axios',
        affectedVersions: '<1.6.0',
        fixedVersion: '1.6.0',
        severity: 'high',
        description: 'Server-side request forgery in axios',
        cvssScore: 8.1,
        publishedAt: Date.now() - 86400000 * 3, // 3 days ago
        lastUpdated: Date.now(),
      },
      {
        id: 'CVE-2024-9012',
        packageName: 'express',
        affectedVersions: '<4.18.2',
        fixedVersion: '4.18.2',
        severity: 'medium',
        description: 'Path traversal vulnerability in express',
        cvssScore: 6.5,
        publishedAt: Date.now() - 86400000 * 1, // 1 day ago
        lastUpdated: Date.now(),
      },
    ];

    vulnerabilities.forEach((vuln) => {
      this.vulnerabilityDatabase.set(vuln.id, vuln);
    });
  }

  private startPeriodicScanning(): void {
    // Schedule periodic scans
    setInterval(() => {
      this.scanAllDependencies().catch(console.error);
    }, SECURITY_CONFIG.SCAN_INTERVAL_MS);
  }

  // ==========================================================================
  // Task Execution
  // ==========================================================================

  async executeTask(task: AgentTask): Promise<void> {
    console.log(`🔒 Security Agent executing task: ${task.title}`);

    this.currentTask = task;
    this.updateStatus('busy');
    this.ctx.orchestrator.startTask(task.id).catch(console.error);

    try {
      // Route task based on type
      switch (task.title.toLowerCase() || task.description.toLowerCase()) {
        case 'scan dependencies':
        case 'security scan':
          await this.handleScanDependencies(task);
          break;
        case 'scan code':
        case 'code scan':
          await this.handleScanCode(task);
          break;
        case 'check vulnerabilities':
          await this.handleCheckVulnerabilities(task);
          break;
        case 'generate report':
          await this.handleGenerateReport(task);
          break;
        case 'patch vulnerability':
          await this.handlePatchVulnerability(task);
          break;
        default:
          await this.handleGenericTask(task);
      }

      await this.completeTask(task.id, { success: true });
      console.log(`✅ Security Agent completed task: ${task.title}`);
    } catch (err) {
      console.error(`❌ Security Agent failed task: ${task.title}`, err);
      await this.failTask(task.id, `Security Agent error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      this.currentTask = null;
      this.updateStatus('idle');
      this.updateHeartbeat();
    }
  }

  // ==========================================================================
  // Task Handlers
  // ==========================================================================

  private async handleScanDependencies(task: AgentTask): Promise<void> {
    // Simulate dependency scanning
    await this.simulateDelay(2500);

    // Get dependencies to scan from task description
    const packages = this.extractPackagesFromDescription(task.description);

    const vulnerabilities: VulnerabilityAlert[] = [];

    packages.forEach((pkg) => {
      const vulns = this.scanPackage(pkg);
      vulnerabilities.push(...vulns);
    });

    if (vulnerabilities.length > 0) {
      // Report vulnerabilities
      for (const vuln of vulnerabilities) {
        await this.reportVulnerability(vuln, task.id);
      }

      // Notify editor agent
      await this.sendMessage(
        'editor-agent-001',
        `${vulnerabilities.length} vulnerabilities found. Please review and fix.`,
        task.id
      );

      // Notify dependency agent
      await this.sendMessage(
        'dependency-agent-001',
        `Security vulnerabilities detected in dependencies. Please update.`,
        task.id
      );
    } else {
      await this.sendMessage(
        'all',
        `No vulnerabilities found in scanned dependencies.`,
        task.id
      );
    }
  }

  private async handleScanCode(task: AgentTask): Promise<void> {
    // Simulate code scanning
    await this.simulateDelay(3000);

    // Check for security issues in code
    const issues = this.scanCodeForIssues(task.description);

    if (issues.length > 0) {
      const issueList = issues.map((issue) => `- ${issue}`).join('\n');
      await this.sendMessage(
        'editor-agent-001',
        `Security issues found in code:\n${issueList}`,
        task.id
      );
    } else {
      await this.sendMessage(
        'editor-agent-001',
        `No security issues found in code.`,
        task.id
      );
    }
  }

  private async handleCheckVulnerabilities(task: AgentTask): Promise<void> {
    // Check for specific vulnerabilities
    await this.simulateDelay(1500);

    const cveId = task.description?.split(' ').pop() || '';

    if (cveId) {
      const vuln = this.vulnerabilityDatabase.get(cveId);

      if (vuln) {
        const alert: VulnerabilityAlert = {
          id: `alert-${Date.now()}`,
          taskId: task.id,
          agentId: this.id,
          cve: vuln.id,
          packageName: vuln.packageName,
          packageVersion: vuln.affectedVersions,
          fixedVersion: vuln.fixedVersion || null,
          severity: vuln.severity,
          description: vuln.description,
          fixAvailable: true,
          timestamp: Date.now(),
        };

        await this.reportVulnerability(alert, task.id);
      } else {
        await this.sendMessage(
          'all',
          `No vulnerability found with CVE ID: ${cveId}`,
          task.id
        );
      }
    } else {
      // Check all vulnerabilities
      await this.handleScanDependencies(task);
    }
  }

  private async handleGenerateReport(task: AgentTask): Promise<void> {
    // Generate security report
    await this.simulateDelay(2000);

    const scans = Array.from(this.scanHistory.values());
    const totalVulnerabilities = scans.reduce(
      (sum, scan) => sum + scan.vulnerabilities.length,
      0
    );
    const criticalVulnerabilities = scans.reduce(
      (sum, scan) =>
        sum + scan.vulnerabilities.filter((v) => v.severity === 'critical').length,
      0
    );

    const report = {
      totalScans: scans.length,
      totalVulnerabilities,
      criticalVulnerabilities,
      highVulnerabilities: scans.reduce(
        (sum, scan) => sum + scan.vulnerabilities.filter((v) => v.severity === 'high').length,
        0
      ),
      mediumVulnerabilities: scans.reduce(
        (sum, scan) => sum + scan.vulnerabilities.filter((v) => v.severity === 'medium').length,
        0
      ),
      lowVulnerabilities: scans.reduce(
        (sum, scan) => sum + scan.vulnerabilities.filter((v) => v.severity === 'low').length,
        0
      ),
      lastScan: scans.length > 0 ? scans[scans.length - 1].timestamp : null,
    };

    await this.sendMessage(
      'all',
      `Security Report:\n${JSON.stringify(report, null, 2)}`,
      task.id
    );
  }

  private async handlePatchVulnerability(task: AgentTask): Promise<void> {
    // Simulate vulnerability patching
    await this.simulateDelay(3000);

    const cveId = task.description?.split(' ').pop() || '';
    const vuln = this.vulnerabilityDatabase.get(cveId);

    if (vuln) {
      // Create patch PR via PR agent
      await this.sendMessage(
        'pr-agent-001',
        `Create security patch PR for ${vuln.id}: ${vuln.description}. Update ${vuln.packageName} to ${vuln.fixedVersion}`,
        task.id
      );

      // Notify dependency agent
      await this.sendMessage(
        'dependency-agent-001',
        `Security patch required for ${vuln.packageName}. Update to ${vuln.fixedVersion}`,
        task.id
      );
    }
  }

  private async handleGenericTask(task: AgentTask): Promise<void> {
    // Generic task handling
    await this.simulateDelay(2000);
    console.log(`Security Agent processed generic task: ${task.title}`);
  }

  // ==========================================================================
  // Scan Methods
  // ==========================================================================

  private async scanAllDependencies(): Promise<void> {
    // Simulate scanning all dependencies
    console.log('🔒 Scanning all dependencies for vulnerabilities...');

    // Get all packages from package.json (simulated)
    const packages = ['lodash', 'axios', 'express', 'react', 'react-dom', 'typescript'];

    const vulnerabilities: VulnerabilityAlert[] = [];

    packages.forEach((pkg) => {
      const vulns = this.scanPackage(pkg);
      vulnerabilities.push(...vulns);
    });

    if (vulnerabilities.length > 0) {
      console.log(`⚠️ Found ${vulnerabilities.length} vulnerabilities`);

      for (const vuln of vulnerabilities) {
        await this.reportVulnerability(vuln);
      }
    } else {
      console.log('✅ No vulnerabilities found');
    }
  }

  private extractPackagesFromDescription(description: string | undefined): string[] {
    if (!description) return [];

    // Extract package names from description
    const packagePatterns = [
      /package:(\w+)/g,
      /(\w+):\d+/g,
      /dependency:(\w+)/g,
    ];

    const packages: Set<string> = new Set();

    packagePatterns.forEach((pattern) => {
      const matches = description.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          const pkg = match.split(':').pop() || match;
          packages.add(pkg.toLowerCase());
        });
      }
    });

    return Array.from(packages);
  }

  private scanPackage(packageName: string): VulnerabilityAlert[] {
    const vulnerabilities: VulnerabilityAlert[] = [];

    this.vulnerabilityDatabase.forEach((vuln) => {
      if (vuln.packageName.toLowerCase() === packageName.toLowerCase()) {
        vulnerabilities.push({
          id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          taskId: '',
          agentId: this.id,
          cve: vuln.id,
          packageName: vuln.packageName,
          packageVersion: vuln.affectedVersions,
          fixedVersion: vuln.fixedVersion || null,
          severity: vuln.severity,
          description: vuln.description,
          fixAvailable: true,
          timestamp: Date.now(),
        });
      }
    });

    return vulnerabilities;
  }

  private scanCodeForIssues(code: string | undefined): string[] {
    if (!code) return [];

    const issues: string[] = [];

    // Check for common security issues
    if (code.includes('eval(')) {
      issues.push('Use of eval() is dangerous and should be avoided');
    }

    if (code.includes('innerHTML')) {
      issues.push('Direct use of innerHTML can lead to XSS vulnerabilities');
    }

    if (code.includes('localStorage') || code.includes('sessionStorage')) {
      issues.push('Client-side storage should be validated and sanitized');
    }

    if (code.includes('==') && !code.includes('===')) {
      issues.push('Use strict equality (===) to avoid type coercion bugs');
    }

    if (code.includes('password') && code.includes('plaintext')) {
      issues.push('Passwords should never be stored in plaintext');
    }

    return issues;
  }

  // ==========================================================================
  // Vulnerability Reporting
  // ==========================================================================

  private async reportVulnerability(
    vulnerability: VulnerabilityAlert,
    taskId: string = ''
  ): Promise<void> {
    // Store in scan history
    if (!this.scanHistory.has(vulnerability.cve)) {
      this.scanHistory.set(vulnerability.cve, {
        cve: vulnerability.cve,
        packageName: vulnerability.packageName,
        severity: vulnerability.severity,
        timestamp: Date.now(),
        vulnerabilities: [vulnerability],
      });
    } else {
      const scan = this.scanHistory.get(vulnerability.cve)!;
      scan.vulnerabilities.push(vulnerability);
    }

    // Broadcast vulnerability alert
    this.ctx.io.emit('agent:vulnerability:found', {
      taskId: vulnerability.taskId || taskId,
      agentId: this.id,
      vulnerability,
      timestamp: Date.now(),
    });

    // Send message to relevant agents
    await this.sendMessage(
      'editor-agent-001',
      `🚨 VULNERABILITY ALERT: ${vulnerability.cve} in ${vulnerability.packageName} (${vulnerability.severity})`,
      vulnerability.taskId || taskId
    );

    await this.sendMessage(
      'dependency-agent-001',
      `Vulnerability detected: ${vulnerability.cve}. Update ${vulnerability.packageName} to ${vulnerability.fixedVersion}`,
      vulnerability.taskId || taskId
    );
  }

  // ==========================================================================
  // Message Handling
  // ==========================================================================

  async handleMessage(message: AgentMessage): Promise<void> {
    console.log(`🔒 Security Agent received message from ${message.from}: ${message.content}`);

    // Handle messages from other agents
    switch (message.from) {
      case 'editor-agent-001':
        await this.handleEditorMessage(message);
        break;
      case 'dependency-agent-001':
        await this.handleDependencyMessage(message);
        break;
      case 'pr-agent-001':
        await this.handlePRMessage(message);
        break;
      default:
        console.log(`Security Agent: Received message from ${message.from}`);
    }
  }

  private async handleEditorMessage(message: AgentMessage): Promise<void> {
    // Handle code-related messages
    if (message.content.includes('scan') || message.content.includes('security')) {
      console.log(`🔍 Security scan requested: ${message.content}`);
      // Trigger security scan
      this.handleScanCode({
        id: `auto-task-${Date.now()}`,
        title: 'Scan Code',
        description: message.content,
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
        createdBy: 'editor-agent',
        createdAt: Date.now(),
        tab: 'editor',
        collaborationContextId: null,
      }).catch(console.error);
    }
  }

  private async handleDependencyMessage(message: AgentMessage): Promise<void> {
    // Handle dependency-related messages
    if (message.content.includes('new') || message.content.includes('added')) {
      console.log(`📦 New dependency detected: ${message.content}`);
      // Scan new dependencies
      const packages = this.extractPackagesFromDescription(message.content);
      if (packages.length > 0) {
        this.handleScanDependencies({
          id: `auto-task-${Date.now()}`,
          title: 'Scan Dependencies',
          description: packages.join(', '),
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
          createdBy: 'dependency-agent',
          createdAt: Date.now(),
          tab: 'github',
          collaborationContextId: null,
        }).catch(console.error);
      }
    }
  }

  private async handlePRMessage(message: AgentMessage): Promise<void> {
    // Handle PR-related messages
    if (message.content.includes('merged') || message.content.includes('created')) {
      console.log(`📦 PR event: ${message.content}`);
      // Scan PR for security issues
      this.handleScanCode({
        id: `auto-task-${Date.now()}`,
        title: 'Scan Code',
        description: `PR: ${message.content}`,
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
    // Clear all scheduled scans
    this.scheduledScans.forEach((timeout) => clearTimeout(timeout));
    this.scheduledScans.clear();

    this.vulnerabilityDatabase.clear();
    this.scanHistory.clear();

    console.log(`🔒 Security Agent (${this.id}) cleaned up`);
  }
}

// ==========================================================================
// Types
// ==========================================================================

interface VulnerabilityData {
  id: string;
  packageName: string;
  affectedVersions: string;
  fixedVersion: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  cvssScore: number;
  publishedAt: number;
  lastUpdated: number;
}

interface SecurityScan {
  cve: string;
  packageName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: number;
  vulnerabilities: VulnerabilityAlert[];
}

// ==========================================================================
// Agent Factory Function
// ==========================================================================

export function createSecurityAgent(ctx: AgentContext): SecurityAgent {
  return new SecurityAgent(ctx);
}
