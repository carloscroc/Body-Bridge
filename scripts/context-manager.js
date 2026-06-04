#!/usr/bin/env node

/**
 * Context Manager for Forge
 * 
 * Manages context save/restore with mempalace integration
 */

import { MempalaceClient } from './mempalace-client.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class ContextManager {
  constructor(config = {}) {
    this.client = new MempalaceClient(config);
    this.projectRoot = process.cwd();
    this.memoryDir = path.join(this.projectRoot, '.memory');
    this.contextFile = path.join(this.memoryDir, 'current-context.json');
    this.historyFile = path.join(this.memoryDir, 'context-history.json');
    
    this.ensureMemoryDirectory();
  }

  ensureMemoryDirectory() {
    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }
  }

  /**
   * Save current context to mempalace
   * @param {Object} context - Current context data
   * @returns {Promise<string>} Context ID
   */
  async saveContext(context = {}) {
    const contextId = this.generateContextId();
    const timestamp = new Date().toISOString();
    
    // Gather current context if not provided
    const fullContext = context || await this.gatherCurrentContext();
    
    const enrichedContext = {
      id: contextId,
      timestamp,
      project: this.client.config.project,
      session_id: this.client.getSessionId(),
      type: 'context',
      category: 'context',
      importance: 'high',
      summary: `Context snapshot: ${fullContext.currentTask || 'No specific task'}`,
      content: this.formatContextContent(fullContext),
      tags: ['context', 'snapshot', 'session'],
      related_files: fullContext.files || [],
      outcomes: [`Context saved with ${Object.keys(fullContext).length} data points`],
      metadata: {
        context_type: 'snapshot',
        git_branch: fullContext.gitBranch,
        git_status: fullContext.gitStatus,
        working_directory: fullContext.workingDirectory,
        environment: fullContext.environment
      }
    };

    // Store in mempalace
    await this.client.storeMemory(enrichedContext);
    
    // Also save locally for quick access
    await this.saveLocalContext(enrichedContext);
    
    // Update history
    await this.updateContextHistory(enrichedContext);
    
    console.log(`✅ Context saved: ${contextId}`);
    return contextId;
  }

  /**
   * Restore context from mempalace
   * @param {Object} query - Query to find context
   * @returns {Promise<Object>} Restored context
   */
  async restoreContext(query = {}) {
    const {
      search,
      contextId,
      recent = false,
      limit = 5
    } = query;

    let contexts;

    if (contextId) {
      // Restore specific context by ID
      contexts = await this.client.retrieveMemories({
        category: 'context',
        limit: 100
      });
      contexts = contexts.filter(c => c.id === contextId);
    } else if (recent) {
      // Get most recent context
      contexts = await this.client.getRecentMemories(limit);
      contexts = contexts.filter(c => c.category === 'context');
    } else if (search) {
      // Search for relevant context
      contexts = await this.client.retrieveMemories({
        search,
        category: 'context',
        limit
      });
    } else {
      // Get most recent context by default
      contexts = await this.client.getRecentMemories(1);
      contexts = contexts.filter(c => c.category === 'context');
    }

    if (contexts.length === 0) {
      console.warn('No matching contexts found');
      return null;
    }

    const context = contexts[0];
    console.log(`📋 Restored context: ${context.id}`);
    
    return this.parseContextContent(context);
  }

  /**
   * Merge multiple contexts
   * @param {Array} contextIds - Array of context IDs to merge
   * @returns {Promise<Object>} Merged context
   */
  async mergeContexts(contextIds) {
    const contexts = await Promise.all(
      contextIds.map(id => this.restoreContext({ contextId: id }))
    );

    const merged = {
      merged_from: contextIds,
      merged_at: new Date().toISOString(),
      contexts: contexts
    };

    // Merge common fields
    const fields = ['currentTask', 'files', 'gitBranch', 'environment'];
    fields.forEach(field => {
      const values = contexts
        .map(c => c[field])
        .filter(v => v !== undefined && v !== null);
      
      if (values.length > 0) {
        merged[field] = values[values.length - 1]; // Use most recent
      }
    });

    // Save merged context
    const mergedId = await this.saveContext(merged);
    
    console.log(`🔀 Merged ${contextIds.length} contexts into: ${mergedId}`);
    return merged;
  }

  /**
   * Get context history
   * @param {number} limit - Maximum number of contexts
   * @returns {Promise<Array>} Context history
   */
  async getContextHistory(limit = 20) {
    if (!fs.existsSync(this.historyFile)) {
      return [];
    }

    const history = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
    return history.slice(0, limit);
  }

  /**
   * Get specific context version
   * @param {string} version - Context version/ID
   * @returns {Promise<Object>} Context data
   */
  async getContextVersion(version) {
    return this.restoreContext({ contextId: version });
  }

  /**
   * Auto-save context at regular intervals
   * @param {number} interval - Interval in milliseconds
   */
  async autoSave(interval = 300000) { // 5 minutes default
    console.log(`🔄 Auto-save enabled (every ${interval / 1000} seconds)`);
    
    setInterval(async () => {
      try {
        await this.saveContext();
        console.log('✅ Auto-saved context');
      } catch (error) {
        console.error('Auto-save failed:', error.message);
      }
    }, interval);
  }

  // Private helper methods

  generateContextId() {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async gatherCurrentContext() {
    const context = {
      timestamp: new Date().toISOString(),
      workingDirectory: process.cwd(),
      environment: process.env.NODE_ENV || 'development',
      session_id: this.client.getSessionId()
    };

    try {
      // Git information
      context.gitBranch = this.getGitBranch();
      context.gitStatus = this.getGitStatus();
      context.gitCommit = this.getLatestCommit();
    } catch (error) {
      console.warn('Could not get git information:', error.message);
    }

    try {
      // File information
      context.files = this.getModifiedFiles();
      context.fileCount = this.getFileCount();
    } catch (error) {
      console.warn('Could not get file information:', error.message);
    }

    try {
      // Package information
      context.packageInfo = this.getPackageInfo();
    } catch (error) {
      console.warn('Could not get package information:', error.message);
    }

    try {
      // Recent activity
      context.recentActivity = this.getRecentActivity();
    } catch (error) {
      console.warn('Could not get recent activity:', error.message);
    }

    return context;
  }

  formatContextContent(context) {
    return `Context Snapshot:
Timestamp: ${context.timestamp}
Session ID: ${context.session_id}
Working Directory: ${context.workingDirectory}
Environment: ${context.environment}

Git Information:
Branch: ${context.gitBranch || 'N/A'}
Status: ${context.gitStatus || 'N/A'}
Latest Commit: ${context.gitCommit || 'N/A'}

Files:
Modified: ${context.files ? context.files.length : 0}
Total Files: ${context.fileCount || 'N/A'}
${context.files ? context.files.map(f => `  - ${f}`).join('\n') : ''}

Package Information:
${context.packageInfo ? `Name: ${context.packageInfo.name}\nVersion: ${context.packageInfo.version}` : 'N/A'}

Recent Activity:
${context.recentActivity ? context.recentActivity.map(a => `  - ${a}`).join('\n') : 'No recent activity'}

Additional Context:
${Object.entries(context)
  .filter(([key]) => !['timestamp', 'session_id', 'workingDirectory', 'environment', 
    'gitBranch', 'gitStatus', 'gitCommit', 'files', 'fileCount', 'packageInfo', 'recentActivity'].includes(key))
  .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
  .join('\n')}`;
  }

  parseContextContent(context) {
    const parsed = {
      id: context.id,
      timestamp: context.timestamp,
      summary: context.summary,
      metadata: context.metadata
    };

    if (context.content) {
      const lines = context.content.split('\n');
      lines.forEach(line => {
        const match = line.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          const [, key, value] = match;
          parsed[key.toLowerCase().replace(/\s+/g, '_')] = value;
        }
      });
    }

    return parsed;
  }

  async saveLocalContext(context) {
    fs.writeFileSync(this.contextFile, JSON.stringify(context, null, 2));
  }

  async updateContextHistory(context) {
    let history = [];
    
    if (fs.existsSync(this.historyFile)) {
      history = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
    }

    history.unshift({
      id: context.id,
      timestamp: context.timestamp,
      summary: context.summary,
      git_branch: context.metadata.git_branch
    });

    // Keep only last 100 contexts
    history = history.slice(0, 100);

    fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
  }

  getGitBranch() {
    try {
      return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch (error) {
      return null;
    }
  }

  getGitStatus() {
    try {
      return execSync('git status --short', { encoding: 'utf8' }).trim();
    } catch (error) {
      return null;
    }
  }

  getLatestCommit() {
    try {
      return execSync('git log -1 --pretty=format:"%h - %s (%an, %ar)"', { encoding: 'utf8' }).trim();
    } catch (error) {
      return null;
    }
  }

  getModifiedFiles() {
    try {
      const status = execSync('git status --short', { encoding: 'utf8' }).trim();
      return status.split('\n')
        .filter(line => line.trim())
        .map(line => line.split(' ')[1]);
    } catch (error) {
      return [];
    }
  }

  getFileCount() {
    try {
      const isWin = process.platform === 'win32';
      const cmd = isWin
        ? 'cmd /c "dir /s /b /a-d . 2>nul | find /c /v """'
        : 'find . -type f -not -path "./node_modules/*" -not -path "./.git/*" | wc -l';
      return execSync(cmd, { encoding: 'utf8' }).trim();
    } catch (error) {
      return null;
    }
  }

  getPackageInfo() {
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      if (fs.existsSync(packagePath)) {
        return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  getRecentActivity() {
    try {
      const historyFile = path.join(this.memoryDir, 'context-history.json');
      if (fs.existsSync(historyFile)) {
        const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        return history.slice(0, 5).map(h => h.summary);
      }
    } catch (error) {
      return [];
    }
    return [];
  }
}

// Export for use in other scripts
export { ContextManager };

// CLI interface
import { pathToFileURL } from 'url';
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const command = args[0];
  const data = args[1] ? JSON.parse(args[1]) : {};

  const contextManager = new ContextManager();

  async function runCLI() {
    try {
      switch (command) {
        case 'save':
          const contextId = await contextManager.saveContext(data);
          console.log('Context saved:', contextId);
          break;

        case 'restore':
          const query = data.query || {};
          const context = await contextManager.restoreContext(query);
          console.log('Restored context:', JSON.stringify(context, null, 2));
          break;

        case 'merge':
          const merged = await contextManager.mergeContexts(data.contextIds);
          console.log('Merged context:', JSON.stringify(merged, null, 2));
          break;

        case 'history':
          const history = await contextManager.getContextHistory(data.limit);
          console.log('Context history:', JSON.stringify(history, null, 2));
          break;

        case 'version':
          const version = await contextManager.getContextVersion(data.version);
          console.log('Context version:', JSON.stringify(version, null, 2));
          break;

        case 'autosave':
          const interval = data.interval || 300000;
          await contextManager.autoSave(interval);
          break;

        default:
          console.log('Usage: node context-manager.js [save|restore|merge|history|version|autosave] [args]');
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }

  runCLI();
}