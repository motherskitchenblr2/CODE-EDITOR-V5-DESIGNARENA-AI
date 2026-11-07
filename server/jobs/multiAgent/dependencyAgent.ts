// ============================================================================
// Volt Code AGI - Dependencies Agent
// ============================================================================

import { BaseAgent, AgentContext } from './types';
import {
  AgentTask,
  AgentMessage,
  AgentConfig,
  AgentType,
  AgentTab,
  AgentStatus,
  DependencyUpdate,
} from '../../../shared/types';
import { DEFAULT_AGENT_CONFIGS } from '../../../shared/types';

// ==========================================================================
// Dependency Agent Configuration
// ==========================================================================

const DEPENDENCY_CONFIG: AgentConfig = DEFAULT_AGENT_CONFIGS.find(
  (c) => c.type === 'dependency-update'
) || {
  id: 'dependency-agent-001',
  alias: 'dependency-update',
  type: 'dependency-update',
  tab: 'github',
  model: 'claude-fable-5.1',
  maxTasks: 3,
  description: 'Dependency updates, security patches',
  isActive: true,
};

// ==========================================================================
// Dependency Agent Class
// ==========================================================================

export class DependencyAgent extends BaseAgent {
  private dependencies: Map<string, DependencyInfo>;
  private packageJson: PackageJson;
  private updateQueue: DependencyUpdate[];
  private vulnerabilityScans: Map<string, DependencyVulnerability>;

  constructor(ctx: AgentContext) {
    super(ctx);
    this.dependencies = new Map();
    this.updateQueue = [];
    this.vulnerabilityScans = new Map();
    this.packageJson = {
      name: 'volt-code-agi',
      version: '1.0.0',
      dependencies: {},
      devDependencies: {},
    };

    // Initialize with sample dependencies
    this.initializeDependencies();
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  async initialize(): Promise<void> {
    console.log(`📦 Dependency Agent (${this.id}) initializing...`);
    this.status = 'idle';
    this.updateHeartbeat();

    // Register with orchestrator
    await this.ctx.orchestrator.registerAgent(DEPENDENCY_CONFIG);

    // Start update check loop
    this.startUpdateCheckLoop();

    // Start vulnerability scan loop
    this.startVulnerabilityScanLoop();

    console.log(`✅ Dependency Agent (${this.id}) ready`);
  }

  private initializeDependencies(): void {
    // Sample dependencies
    const sampleDependencies: Record<string, string> = {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      'typescript': '^5.0.0',
      'express': '^4.18.0',
      'socket.io': '^4.7.0',
      'lodash': '^4.17.21',
      'axios': '^1.5.0',
      'zod': '^3.22.0',
      'uuid': '^9.0.0',
      '@supabase/supabase-js': '^2.30.0',
    };

    Object.entries(sampleDependencies).forEach(([name, version]) => {
      this.dependencies.set(name, {
        name,
        version,
        latestVersion: this.getLatestVersion(name, version),
        isOutdated: this.isOutdated(name, version),
        isSecurityRisk: this.hasSecurityVulnerability(name, version),
        lastChecked: Date.now(),
        category: this.getCategory(name),
      });

      this.packageJson.dependencies[name] = version;
    });
  }

  private startUpdateCheckLoop(): void {
    // Check for updates every hour
    setInterval(() => {
      this.checkForUpdates().catch(console.error);
    }, 3600000);

    // Initial check
    this.checkForUpdates().catch(console.error);
  }

  private startVulnerabilityScanLoop(): void {
    // Scan for vulnerabilities every 30 minutes
    setInterval(() => {
      this.scanForVulnerabilities().catch(console.error);
    }, 1800000);

    // Initial scan
    this.scanForVulnerabilities().catch(console.error);
  }

  // ==========================================================================
  // Task Execution
  // ==========================================================================

  async executeTask(task: AgentTask): Promise<void> {
    console.log(`📦 Dependency Agent executing task: ${task.title}`);

    this.currentTask = task;
    this.updateStatus('busy');
    this.ctx.orchestrator.startTask(task.id).catch(console.error);

    try {
      // Route task based on type
      switch (task.title.toLowerCase() || task.description.toLowerCase()) {
        case 'check updates':
        case 'check dependencies':
          await this.handleCheckUpdates(task);
          break;
        case 'update dependency':
        case 'update dependencies':
          await this.handleUpdateDependencies(task);
          break;
        case 'scan vulnerabilities':
        case 'security scan':
          await this.handleScanVulnerabilities(task);
          break;
        case 'patch dependency':
        case 'apply patch':
          await this.handlePatchDependency(task);
          break;
        case 'cleanup dependencies':
          await this.handleCleanupDependencies(task);
          break;
        default:
          await this.handleGenericTask(task);
      }

      await this.completeTask(task.id, { success: true });
      console.log(`✅ Dependency Agent completed task: ${task.title}`);
    } catch (err) {
      console.error(`❌ Dependency Agent failed task: ${task.title}`, err);
      await this.failTask(task.id, `Dependency Agent error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      this.currentTask = null;
      this.updateStatus('idle');
      this.updateHeartbeat();
    }
  }

  // ==========================================================================
  // Task Handlers
  // ==========================================================================

  private async handleCheckUpdates(task: AgentTask): Promise<void> {
    // Check for dependency updates
    await this.checkForUpdates();

    const updates = this.updateQueue;

    if (updates.length > 0) {
      const updateSummary = updates.map(
        (u) => `- ${u.packageName}: ${u.currentVersion} → ${u.targetVersion} (${u.riskLevel})`
      ).join('\n');

      await this.sendMessage(
        'all',
        `Dependency updates available:\n${updateSummary}`,
        task.id
      );

      // Notify PR agent to create update PR
      await this.sendMessage(
        'pr-agent-001',
        `Create dependency update PR for ${updates.length} package(s)`,
        task.id
      );
    } else {
      await this.sendMessage(
        'all',
        'All dependencies are up to date',
        task.id
      );
    }
  }

  private async handleUpdateDependencies(task: AgentTask): Promise<void> {
    // Update specific dependencies
    const packages = this.extractPackagesFromDescription(task.description);

    if (packages.length === 0) {
      // Update all
      await this.updateAllDependencies();
    } else {
      for (const pkg of packages) {
        await this.updateDependency(pkg);
      }
    }

    await this.sendMessage(
      'all',
      `Dependencies updated: ${packages.length > 0 ? packages.join(', ') : 'all'}`,
      task.id
    );
  }

  private async handleScanVulnerabilities(task: AgentTask): Promise<void> {
    // Scan for vulnerabilities
    await this.scanForVulnerabilities();

    const vulnerabilities = Array.from(this.vulnerabilityScans.values());

    if (vulnerabilities.length > 0) {
      const vulnSummary = vulnerabilities.map(
        (v) => `- ${v.packageName}@${v.version}: ${v.cveId} (${v.severity})`
      ).join('\n');

      await this.sendMessage(
        'security-scan-agent-001',
        `Vulnerabilities found:\n${vulnSummary}`,
        task.id
      );

      // Notify PR agent to create security patch PR
      await this.sendMessage(
        'pr-agent-001',
        `Create security patch PR for ${vulnerabilities.length} vulnerability(ies)`,
        task.id
      );
    } else {
      await this.sendMessage(
        'all',
        'No vulnerabilities found in dependencies',
        task.id
      );
    }
  }

  private async handlePatchDependency(task: AgentTask): Promise<void> {
    // Patch specific dependency
    const packages = this.extractPackagesFromDescription(task.description);

    for (const pkg of packages) {
      await this.patchDependency(pkg);
    }

    await this.sendMessage(
      'all',
      `Security patches applied: ${packages.join(', ')}`,
      task.id
    );
  }

  private async handleCleanupDependencies(task: AgentTask): Promise<void> {
    // Clean up unused dependencies
    await this.simulateDelay(2000);

    const unusedDeps = this.findUnusedDependencies();

    if (unusedDeps.length > 0) {
      await this.sendMessage(
        'all',
        `Unused dependencies found: ${unusedDeps.join(', ')}. Consider removing.`,
        task.id
      );
    } else {
      await this.sendMessage(
        'all',
        'No unused dependencies found',
        task.id
      );
    }
  }

  private async handleGenericTask(task: AgentTask): Promise<void> {
    // Generic task handling
    await this.simulateDelay(2000);
    console.log(`Dependency Agent processed generic task: ${task.title}`);
  }

  // ==========================================================================
  // Update Management
  // ==========================================================================

  private async checkForUpdates(): Promise<void> {
    console.log('📦 Checking for dependency updates...');

    this.dependencies.forEach((dep) => {
      if (dep.isOutdated) {
        const update: DependencyUpdate = {
          id: `update-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          taskId: this.currentTask?.id || '',
          agentId: this.id,
          packageName: dep.name,
          currentVersion: dep.version,
          targetVersion: dep.latestVersion || '',
          riskLevel: this.getRiskLevel(dep.name, dep.version, dep.latestVersion || ''),
          changelog: this.generateChangelog(dep.name, dep.version, dep.latestVersion || ''),
          breakingChanges: this.hasBreakingChanges(dep.name, dep.version, dep.latestVersion || ''),
          timestamp: Date.now(),
        };

        this.updateQueue.push(update);

        // Broadcast update
        this.ctx.io.emit('agent:dependency:update', {
          taskId: update.taskId,
          agentId: this.id,
          update,
          timestamp: Date.now(),
        });
      }
    });

    console.log(`Found ${this.updateQueue.length} updates`);
  }

  private async updateDependency(packageName: string): Promise<void> {
    const dep = this.dependencies.get(packageName);
    if (!dep) return;

    // Simulate update
    await this.simulateDelay(1000);

    const oldVersion = dep.version;
    dep.version = dep.latestVersion || dep.version;
    dep.isOutdated = false;
    dep.lastChecked = Date.now();

    // Update package.json
    if (this.packageJson.dependencies[packageName]) {
      this.packageJson.dependencies[packageName] = dep.version;
    }

    // Remove from update queue
    this.updateQueue = this.updateQueue.filter(
      (u) => u.packageName !== packageName
    );

    console.log(`✅ Updated ${packageName}: ${oldVersion} → ${dep.version}`);
  }

  private async updateAllDependencies(): Promise<void> {
    const updates = [...this.updateQueue];

    for (const update of updates) {
      await this.updateDependency(update.packageName);
    }

    console.log(`✅ Updated all dependencies`);
  }

  // ==========================================================================
  // Vulnerability Scanning
  // ==========================================================================

  private async scanForVulnerabilities(): Promise<void> {
    console.log('🔒 Scanning for vulnerabilities...');

    this.dependencies.forEach((dep) => {
      if (dep.isSecurityRisk) {
        const vuln: DependencyVulnerability = {
          id: `vuln-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          packageName: dep.name,
          version: dep.version,
          cveId: this.generateCVEId(dep.name),
          severity: this.getVulnerabilitySeverity(dep.name, dep.version),
          description: this.getVulnerabilityDescription(dep.name),
          fixedVersion: this.getFixedVersion(dep.name, dep.version),
          timestamp: Date.now(),
        };

        this.vulnerabilityScans.set(vuln.id, vuln);
      }
    });

    console.log(`Found ${this.vulnerabilityScans.size} vulnerabilities`);
  }

  private async patchDependency(packageName: string): Promise<void> {
    const dep = this.dependencies.get(packageName);
    if (!dep) return;

    // Find vulnerability for this package
    const vuln = Array.from(this.vulnerabilityScans.values()).find(
      (v) => v.packageName === packageName
    );

    if (vuln && vuln.fixedVersion) {
      // Update to fixed version
      await this.updateDependency(packageName);

      // Remove from vulnerability scans
      this.vulnerabilityScans.forEach((v, key) => {
        if (v.packageName === packageName) {
          this.vulnerabilityScans.delete(key);
        }
      });

      console.log(`✅ Patched ${packageName} to ${vuln.fixedVersion}`);
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private extractPackagesFromDescription(description: string | undefined): string[] {
    if (!description) return [];

    const packages: Set<string> = new Set();

    // Extract package names
    const patterns = [
      /package:(\w+)/g,
      /(\w+):\d+/g,
      /dependency:(\w+)/g,
    ];

    patterns.forEach((pattern) => {
      const matches = description.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          const pkg = match.split(':').pop() || match;
          packages.add(pkg);
        });
      }
    });

    return Array.from(packages);
  }

  private getLatestVersion(packageName: string, currentVersion: string): string {
    // Simulate getting latest version from npm
    const versions: Record<string, string> = {
      react: '19.0.0',
      'react-dom': '19.0.0',
      typescript: '5.5.0',
      express: '4.20.0',
      'socket.io': '4.8.0',
      lodash: '4.17.21',
      axios: '1.7.0',
      zod: '3.23.0',
      uuid: '10.0.0',
      '@supabase/supabase-js': '2.45.0',
    };

    return versions[packageName] || currentVersion;
  }

  private isOutdated(packageName: string, currentVersion: string): boolean {
    const latest = this.getLatestVersion(packageName, currentVersion);
    return currentVersion !== latest;
  }

  private hasSecurityVulnerability(packageName: string, version: string): boolean {
    // Simulate vulnerability detection
    const vulnerablePackages = ['lodash', 'axios', 'express'];
    return vulnerablePackages.includes(packageName) && Math.random() < 0.5;
  }

  private getCategory(packageName: string): string {
    const categories: Record<string, string> = {
      react: 'frontend',
      'react-dom': 'frontend',
      typescript: 'dev',
      express: 'backend',
      'socket.io': 'realtime',
      lodash: 'utility',
      axios: 'http',
      zod: 'validation',
      uuid: 'utility',
      '@supabase/supabase-js': 'database',
    };
    return categories[packageName] || 'other';
  }

  private getRiskLevel(packageName: string, currentVersion: string, targetVersion: string): 'critical' | 'high' | 'medium' | 'low' {
    // Simulate risk assessment
    const riskFactors = {
      major: 0.3,
      minor: 0.6,
      patch: 0.1,
    };

    const changeType = this.getVersionChangeType(currentVersion, targetVersion);
    const risk = riskFactors[changeType as keyof typeof riskFactors] || 0.5;

    if (risk < 0.2) return 'low';
    if (risk < 0.4) return 'medium';
    if (risk < 0.7) return 'high';
    return 'critical';
  }

  private getVersionChangeType(current: string, target: string): string {
    // Simulate version comparison
    const currentParts = current.replace(/[^\d.]/g, '').split('.').map(Number);
    const targetParts = target.replace(/[^\d.]/g, '').split('.').map(Number);

    if (currentParts.length < 3 || targetParts.length < 3) {
      return 'major';
    }

    if (currentParts[0] !== targetParts[0]) return 'major';
    if (currentParts[1] !== targetParts[1]) return 'minor';
    return 'patch';
  }

  private hasBreakingChanges(packageName: string, current: string, target: string): boolean {
    return this.getVersionChangeType(current, target) === 'major';
  }

  private generateChangelog(packageName: string, current: string, target: string): string {
    const changes: string[] = [];

    const changeType = this.getVersionChangeType(current, target);

    switch (changeType) {
      case 'major':
        changes.push('Breaking changes', 'New features', 'Performance improvements');
        break;
      case 'minor':
        changes.push('New features', 'Bug fixes');
        break;
      case 'patch':
        changes.push('Bug fixes', 'Security patches');
        break;
    }

    return changes.join(', ');
  }

  private findUnusedDependencies(): string[] {
    // Simulate finding unused dependencies
    const allDeps = Array.from(this.dependencies.keys());
    const usedDeps = allDeps.filter(() => Math.random() < 0.7); // 70% are used
    return allDeps.filter((d) => !usedDeps.includes(d));
  }

  private generateCVEId(packageName: string): string {
    return `CVE-2024-${Math.floor(Math.random() * 9000) + 1000}-${packageName.substring(0, 4).toUpperCase()}`;
  }

  private getVulnerabilitySeverity(packageName: string, version: string): 'critical' | 'high' | 'medium' | 'low' {
    const severities: ('critical' | 'high' | 'medium' | 'low')[] = ['critical', 'high', 'medium', 'low'];
    return severities[Math.floor(Math.random() * severities.length)];
  }

  private getVulnerabilityDescription(packageName: string): string {
    const descriptions: Record<string, string> = {
      lodash: 'Prototype pollution vulnerability',
      axios: 'Server-side request forgery',
      express: 'Path traversal vulnerability',
    };
    return descriptions[packageName] || 'Security vulnerability detected';
  }

  private getFixedVersion(packageName: string, currentVersion: string): string | null {
    if (packageName === 'lodash' && currentVersion.startsWith('4.')) {
      return '4.17.21';
    }
    if (packageName === 'axios' && currentVersion.startsWith('1.')) {
      return '1.7.0';
    }
    if (packageName === 'express' && currentVersion.startsWith('4.')) {
      return '4.20.0';
    }
    return null;
  }

  // ==========================================================================
  // Message Handling
  // ==========================================================================

  async handleMessage(message: AgentMessage): Promise<void> {
    console.log(`📦 Dependency Agent received message from ${message.from}: ${message.content}`);

    // Handle messages from other agents
    switch (message.from) {
      case 'security-scan-agent-001':
        await this.handleSecurityMessage(message);
        break;
      case 'pr-agent-001':
        await this.handlePRMessage(message);
        break;
      case 'editor-agent-001':
        await this.handleEditorMessage(message);
        break;
      default:
        console.log(`Dependency Agent: Received message from ${message.from}`);
    }
  }

  private async handleSecurityMessage(message: AgentMessage): Promise<void> {
    // Handle security-related messages
    if (message.content.includes('vulnerability') || message.content.includes('CVE')) {
      console.log(`🚨 Security alert: ${message.content}`);
      // Re-scan for vulnerabilities
      await this.scanForVulnerabilities();
    }
  }

  private async handlePRMessage(message: AgentMessage): Promise<void> {
    // Handle PR-related messages
    if (message.content.includes('merged') || message.content.includes('created')) {
      console.log(`📦 PR event: ${message.content}`);
      // Check for dependency updates in PR
      await this.checkForUpdates();
    }
  }

  private async handleEditorMessage(message: AgentMessage): Promise<void> {
    // Handle editor messages
    if (message.content.includes('new dependency') || message.content.includes('added')) {
      console.log(`📦 New dependency: ${message.content}`);
      // Add new dependency
      const packages = this.extractPackagesFromDescription(message.content);
      for (const pkg of packages) {
        if (!this.dependencies.has(pkg)) {
          this.dependencies.set(pkg, {
            name: pkg,
            version: '1.0.0',
            latestVersion: '1.1.0',
            isOutdated: true,
            isSecurityRisk: false,
            lastChecked: Date.now(),
            category: 'new',
          });
        }
      }
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
    this.dependencies.clear();
    this.updateQueue = [];
    this.vulnerabilityScans.clear();

    console.log(`📦 Dependency Agent (${this.id}) cleaned up`);
  }
}

// ==========================================================================
// Types
// ==========================================================================

interface DependencyInfo {
  name: string;
  version: string;
  latestVersion: string | null;
  isOutdated: boolean;
  isSecurityRisk: boolean;
  lastChecked: number;
  category: string;
}

interface PackageJson {
  name: string;
  version: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

interface DependencyVulnerability {
  id: string;
  packageName: string;
  version: string;
  cveId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  fixedVersion: string | null;
  timestamp: number;
}

// ==========================================================================
// Agent Factory Function
// ==========================================================================

export function createDependencyAgent(ctx: AgentContext): DependencyAgent {
  return new DependencyAgent(ctx);
}
