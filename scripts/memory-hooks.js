#!/usr/bin/env node

/**
 * Memory Hooks for Forge
 * 
 * Automated memory capture at key development events
 */

import { MempalaceClient } from './mempalace-client.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class MemoryHooks {
  constructor(config = {}) {
    this.client = new MempalaceClient(config);
    this.projectRoot = process.cwd();
    this.memoryDir = path.join(this.projectRoot, '.memory');
    
    this.ensureMemoryDirectory();
  }

  ensureMemoryDirectory() {
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }
  }

  /**
   * Hook for git commits
   * @param {Object} commitData - Git commit information
   */
  async onGitCommit(commitData) {
    const memory = {
      category: 'technical',
      type: 'commit',
      importance: this.determineImportance(commitData),
      summary: `Git commit: ${commitData.message.split('\n')[0]}`,
      content: this.formatCommitContent(commitData),
      tags: this.extractCommitTags(commitData),
      related_files: commitData.files,
      outcomes: [`Committed ${commitData.files.length} files`],
      metadata: {
        commit_hash: commitData.hash,
        branch: commitData.branch,
        author: commitData.author
      }
    };

    await this.client.storeMemory(memory);
  }

  /**
   * Hook for build completion
   * @param {Object} buildResults - Build results and metrics
   */
  async onBuildComplete(buildResults) {
    const memory = {
      category: 'performance',
      type: 'build',
      importance: buildResults.success ? 'medium' : 'high',
      summary: buildResults.success 
        ? `Build completed successfully in ${buildResults.duration}s`
        : `Build failed after ${buildResults.duration}s`,
      content: this.formatBuildContent(buildResults),
      tags: ['build', 'performance', buildResults.success ? 'success' : 'failure'],
      outcomes: buildResults.success 
        ? [`Build completed`, `${buildResults.warnings} warnings`]
        : [`Build failed`, `${buildResults.errors} errors`],
      metadata: {
        duration: buildResults.duration,
        success: buildResults.success,
        warnings: buildResults.warnings,
        errors: buildResults.errors,
        bundle_size: buildResults.bundleSize
      }
    };

    await this.client.storeMemory(memory);
  }

  /**
   * Hook for test completion
   * @param {Object} testResults - Test results and metrics
   */
  async onTestComplete(testResults) {
    const memory = {
      category: 'technical',
      type: 'test',
      importance: testResults.failed > 0 ? 'high' : 'medium',
      summary: `Tests completed: ${testResults.passed} passed, ${testResults.failed} failed`,
      content: this.formatTestContent(testResults),
      tags: ['test', 'quality', testResults.failed > 0 ? 'failure' : 'success'],
      related_files: testResults.testFiles,
      outcomes: [
        `${testResults.passed} tests passed`,
        testResults.failed > 0 ? `${testResults.failed} tests failed` : 'All tests passed',
        `${testResults.coverage}% coverage`
      ],
      metadata: {
        total: testResults.total,
        passed: testResults.passed,
        failed: testResults.failed,
        skipped: testResults.skipped,
        coverage: testResults.coverage,
        duration: testResults.duration
      }
    };

    await this.client.storeMemory(memory);
  }

  /**
   * Hook for security scan completion
   * @param {Object} scanResults - Security scan results
   */
  async onSecurityScan(scanResults) {
    const memory = {
      category: 'security',
      type: 'security-audit',
      importance: scanResults.critical > 0 || scanResults.high > 0 ? 'critical' : 'medium',
      summary: `Security scan: ${scanResults.total} vulnerabilities found`,
      content: this.formatSecurityContent(scanResults),
      tags: ['security', 'audit', 'vulnerability'],
      outcomes: [
        `${scanResults.critical} critical`,
        `${scanResults.high} high`,
        `${scanResults.moderate} moderate`,
        `${scanResults.low} low`
      ],
      metadata: {
        total: scanResults.total,
        critical: scanResults.critical,
        high: scanResults.high,
        moderate: scanResults.moderate,
        low: scanResults.low,
        scan_tool: scanResults.tool,
        scan_duration: scanResults.duration
      }
    };

    await this.client.storeMemory(memory);
  }

  /**
   * Hook for vulnerability fix
   * @param {Object} vulnerabilityData - Vulnerability fix information
   */
  async onVulnerabilityFix(vulnerabilityData) {
    const memory = {
      category: 'security',
      type: 'fix',
      importance: 'critical',
      summary: `Fixed ${vulnerabilityData.severity} vulnerability: ${vulnerabilityData.name}`,
      content: this.formatVulnerabilityContent(vulnerabilityData),
      tags: ['security', 'fix', vulnerabilityData.severity, vulnerabilityData.cwe],
      related_files: vulnerabilityData.files,
      outcomes: [
        `Updated ${vulnerabilityData.package}`,
        `Resolved ${vulnerabilityData.cve || 'security issue'}`,
        'No known vulnerabilities remaining'
      ],
      next_steps: [
        'Monitor for issues',
        'Update documentation',
        'Test affected functionality'
      ],
      metadata: {
        package: vulnerabilityData.package,
        old_version: vulnerabilityData.oldVersion,
        new_version: vulnerabilityData.newVersion,
        severity: vulnerabilityData.severity,
        cve: vulnerabilityData.cve,
        cwe: vulnerabilityData.cwe,
        cvss: vulnerabilityData.cvss
      }
    };

    await this.client.storeMemory(memory);
  }

  /**
   * Hook for code changes
   * @param {Object} changeData - Code change information
   */
  async onCodeChange(changeData) {
    const memory = {
      category: 'technical',
      type: 'code-change',
      importance: this.determineChangeImportance(changeData),
      summary: `Code change: ${changeData.description}`,
      content: this.formatCodeChangeContent(changeData),
      tags: ['code', 'change', changeData.type],
      related_files: changeData.files,
      outcomes: [`Modified ${changeData.files.length} files`],
      metadata: {
        change_type: changeData.type,
        lines_added: changeData.linesAdded,
        lines_removed: changeData.linesRemoved,
        files_modified: changeData.files.length
      }
    };

    await this.client.storeMemory(memory);
  }

  /**
   * Hook for session end
   * @param {Object} sessionData - Session information
   */
  async onSessionEnd(sessionData) {
    const memory = {
      category: 'context',
      type: 'session',
      importance: 'medium',
      summary: `Session completed: ${sessionData.tasksCompleted} tasks`,
      content: this.formatSessionContent(sessionData),
      tags: ['session', 'context', 'progress'],
      outcomes: sessionData.achievements,
      next_steps: sessionData.nextSteps,
      metadata: {
        duration: sessionData.duration,
        tasks_completed: sessionData.tasksCompleted,
        files_modified: sessionData.filesModified,
        commands_run: sessionData.commandsRun
      }
    };

    await this.client.storeMemory(memory);
  }

  /**
   * Hook for architecture decision
   * @param {Object} decisionData - Architecture decision information
   */
  async onArchitectureDecision(decisionData) {
    const memory = {
      category: 'project',
      type: 'decision',
      importance: 'high',
      summary: `Architecture decision: ${decisionData.title}`,
      content: this.formatDecisionContent(decisionData),
      tags: ['architecture', 'decision', decisionData.category],
      outcomes: [decisionData.outcome],
      next_steps: decisionData.nextSteps,
      metadata: {
        decision_type: decisionData.type,
        alternatives_considered: decisionData.alternatives,
        impact: decisionData.impact,
        rationale: decisionData.rationale
      }
    };

    await this.client.storeMemory(memory);
  }

  /**
   * Hook for feature implementation
   * @param {Object} featureData - Feature implementation information
   */
  async onFeatureImplementation(featureData) {
    const memory = {
      category: 'project',
      type: 'feature',
      importance: 'high',
      summary: `Feature implemented: ${featureData.name}`,
      content: this.formatFeatureContent(featureData),
      tags: ['feature', 'implementation', featureData.category],
      related_files: featureData.files,
      outcomes: featureData.outcomes,
      next_steps: featureData.nextSteps,
      metadata: {
        feature_type: featureData.type,
        complexity: featureData.complexity,
        estimated_effort: featureData.estimatedEffort,
        actual_effort: featureData.actualEffort
      }
    };

    await this.client.storeMemory(memory);
  }

  // Helper methods

  determineImportance(commitData) {
    const message = commitData.message.toLowerCase();
    
    if (message.includes('security') || message.includes('critical') || message.includes('fix')) {
      return 'high';
    }
    
    if (message.includes('feature') || message.includes('implement')) {
      return 'medium';
    }
    
    return 'low';
  }

  determineChangeImportance(changeData) {
    if (changeData.type === 'security' || changeData.type === 'critical') {
      return 'high';
    }
    
    if (changeData.linesAdded + changeData.linesRemoved > 100) {
      return 'medium';
    }
    
    return 'low';
  }

  extractCommitTags(commitData) {
    const tags = ['commit'];
    const message = commitData.message.toLowerCase();
    
    if (message.includes('fix')) tags.push('fix');
    if (message.includes('feature')) tags.push('feature');
    if (message.includes('security')) tags.push('security');
    if (message.includes('refactor')) tags.push('refactor');
    if (message.includes('test')) tags.push('test');
    if (message.includes('docs')) tags.push('documentation');
    
    return tags;
  }

  formatCommitContent(commitData) {
    return `Commit: ${commitData.hash}
Author: ${commitData.author}
Branch: ${commitData.branch}
Date: ${commitData.date}

Message:
${commitData.message}

Files changed:
${commitData.files.map(f => `  ${f}`).join('\n')}`;
  }

  formatBuildContent(buildResults) {
    return `Build Status: ${buildResults.success ? 'SUCCESS' : 'FAILED'}
Duration: ${buildResults.duration}s
Warnings: ${buildResults.warnings}
Errors: ${buildResults.errors}
Bundle Size: ${buildResults.bundleSize || 'N/A'}

${buildResults.success ? 'Build completed successfully' : 'Build failed with errors'}`;
  }

  formatTestContent(testResults) {
    return `Test Results:
Total: ${testResults.total}
Passed: ${testResults.passed}
Failed: ${testResults.failed}
Skipped: ${testResults.skipped}
Coverage: ${testResults.coverage}%
Duration: ${testResults.duration}s

${testResults.failed > 0 ? 'Failed tests:\n' + testResults.failures.map(f => `  - ${f}`).join('\n') : 'All tests passed!'}`;
  }

  formatSecurityContent(scanResults) {
    return `Security Scan Results:
Tool: ${scanResults.tool}
Duration: ${scanResults.duration}s

Vulnerabilities:
Critical: ${scanResults.critical}
High: ${scanResults.high}
Moderate: ${scanResults.moderate}
Low: ${scanResults.low}
Total: ${scanResults.total}

${scanResults.details || ''}`;
  }

  formatVulnerabilityContent(vulnerabilityData) {
    return `Vulnerability Fix:
Package: ${vulnerabilityData.package}
Severity: ${vulnerabilityData.severity}
CVE: ${vulnerabilityData.cve || 'N/A'}
CWE: ${vulnerabilityData.cwe}
CVSS: ${vulnerabilityData.cvss}

Versions:
Before: ${vulnerabilityData.oldVersion}
After: ${vulnerabilityData.newVersion}

Description:
${vulnerabilityData.description}

Impact:
${vulnerabilityData.impact}

Fix:
${vulnerabilityData.fix}`;
  }

  formatCodeChangeContent(changeData) {
    return `Code Change:
Type: ${changeData.type}
Description: ${changeData.description}

Files Modified: ${changeData.files.length}
Lines Added: ${changeData.linesAdded}
Lines Removed: ${changeData.linesRemoved}

Files:
${changeData.files.map(f => `  ${f}`).join('\n')}

Reason:
${changeData.reason}`;
  }

  formatSessionContent(sessionData) {
    return `Session Summary:
Duration: ${sessionData.duration}
Tasks Completed: ${sessionData.tasksCompleted}
Files Modified: ${sessionData.filesModified}
Commands Run: ${sessionData.commandsRun}

Achievements:
${sessionData.achievements.map(a => `  ✅ ${a}`).join('\n')}

Next Steps:
${sessionData.nextSteps.map(s => `  📋 ${s}`).join('\n')}`;
  }

  formatDecisionContent(decisionData) {
    return `Architecture Decision:
Title: ${decisionData.title}
Type: ${decisionData.type}
Category: ${decisionData.category}

Decision:
${decisionData.decision}

Rationale:
${decisionData.rationale}

Alternatives Considered:
${decisionData.alternatives.map(a => `  - ${a}`).join('\n')}

Impact:
${decisionData.impact}

Outcome:
${decisionData.outcome}

Next Steps:
${decisionData.nextSteps.map(s => `  - ${s}`).join('\n')}`;
  }

  formatFeatureContent(featureData) {
    return `Feature Implementation:
Name: ${featureData.name}
Type: ${featureData.type}
Category: ${featureData.category}

Description:
${featureData.description}

Implementation:
Complexity: ${featureData.complexity}
Estimated Effort: ${featureData.estimatedEffort}
Actual Effort: ${featureData.actualEffort}

Files:
${featureData.files.map(f => `  - ${f}`).join('\n')}

Outcomes:
${featureData.outcomes.map(o => `  ✅ ${o}`).join('\n')}

Next Steps:
${featureData.nextSteps.map(s => `  📋 ${s}`).join('\n')}`;
  }
}

// Export for use in other scripts
export { MemoryHooks };

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];
  const data = args[1] ? JSON.parse(args[1]) : {};

  const hooks = new MemoryHooks();

  async function runCLI() {
    try {
      switch (command) {
        case 'commit':
          await hooks.onGitCommit(data);
          break;
        case 'build':
          await hooks.onBuildComplete(data);
          break;
        case 'test':
          await hooks.onTestComplete(data);
          break;
        case 'security':
          await hooks.onSecurityScan(data);
          break;
        case 'vulnerability':
          await hooks.onVulnerabilityFix(data);
          break;
        case 'session':
          await hooks.onSessionEnd(data);
          break;
        default:
          console.log('Usage: node memory-hooks.js [commit|build|test|security|vulnerability|session] [json_data]');
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }

  runCLI();
}