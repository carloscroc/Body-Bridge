#!/usr/bin/env node

// Simple Symphony-inspired orchestration system for Plane.so + OpenCode
import { PlaneAdapter, planeConfigFromEnv } from './symphony-integration/implementation/plane-so-adapter/index.js';

class OpenCodeOrchestrator {
  constructor(adapter, workflowConfig) {
    this.adapter = adapter;
    this.workflowConfig = workflowConfig;
    this.isRunning = false;
    this.processedIssues = new Set();
  }

  start() {
    console.log('🚀 OpenCode Orchestrator starting...');
    console.log(`Project: ${this.workflowConfig.tracker.project_id}`);
    console.log(`Active states: ${this.workflowConfig.tracker.active_states.join(', ')}`);
    
    this.isRunning = true;
    this.runLoop();
  }

  async runLoop() {
    while (this.isRunning) {
      try {
        // Fetch candidate issues
        console.log('🔍 Fetching candidate issues...');
        const issues = await this.adapter.fetch_candidate_issues();
        
        console.log(`Found ${issues.length} candidate issues`);
        
        for (const issue of issues) {
          if (!this.processedIssues.has(issue.id)) {
            await this.processIssue(issue);
          }
        }
        
        // Wait before next poll
        await this.sleep(this.workflowConfig.polling.interval_ms);
        
      } catch (error) {
        console.error('❌ Error in orchestration loop:', error);
        await this.sleep(5000); // Wait 5 seconds on error
      }
    }
  }

  async processIssue(issue) {
    console.log(`\n📋 Processing: ${issue.identifier} - ${issue.title}`);
    this.processedIssues.add(issue.id);
    
    try {
      // Move to "In Progress"
      console.log(`  → Moving to "In Progress"...`);
      await this.adapter.update_issue_state(issue.id, 'In Progress');
      
      // Add comment to show we started
      const startComment = `<p><strong>🤖 OpenCode Agent Started</strong></p>
<p>Working on this issue...</p>`;
      await this.adapter.create_comment(issue.id, startComment);
      
      console.log(`  ⏳ Ready for AI processing. Issue URL: ${issue.url}`);
      console.log(`  📝 Create issues in Plane.so and OpenCode will pick them up automatically`);
      console.log(`  ✅ After processing, move to "Done" or "Cancelled" as needed`);
      
    } catch (error) {
      console.error(`  ❌ Failed to process issue ${issue.identifier}:`, error);
      
      // Add error comment
      const errorComment = `<p><strong>❌ OpenCode Orchestrator Error</strong></p>
<p>${error.message}</p>`;
      await this.adapter.create_comment(issue.id, errorComment);
    }
  }

  stop() {
    console.log('\n🛑 Stopping orchestration...');
    this.isRunning = false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  try {
    // Load configuration
    const env = process.env;
    
    const config = {
      tracker: {
        kind: 'plane',
        endpoint: env.PLANE_BASE_URL || 'http://10.0.0.112:3300/api/v1/',
        apiKey: env.PLANE_API_KEY || '',
        workspace_slug: env.PLANE_WORKSPACE_SLUG || 'body-bridge',
        project_id: env.PLANE_PROJECT_ID || '',
        active_states: ['Todo', 'In Progress'],
        terminal_states: ['Done', 'Cancelled']
      },
      polling: {
        interval_ms: 30000
      },
      agent: {
        mode: 'local'
      },
      workspace: {
        root: process.cwd()
      }
    };
    
    // Validate config
    if (!config.tracker.apiKey) {
      throw new Error('PLANE_API_KEY environment variable is required');
    }
    if (!config.tracker.project_id) {
      throw new 'PLANE_PROJECT_ID environment variable is required';
    }
    if (!config.tracker.workspace_slug) {
      throw new Error('PLANE_WORKSPACE_SLUG environment variable is required');
    }
    
    // Create Plane adapter
    const planeConfig = {
      base_url: config.tracker.endpoint,
      api_key: config.tracker.apiKey,
      workspace_slug: config.tracker.workspace_slug,
      project_id: config.tracker.project_id,
      active_states: config.tracker.active_states,
      terminal_states: config.tracker.terminal_states,
    };
    
    const adapter = new PlaneAdapter(planeConfig);
    
    // Create and start orchestrator
    const orchestrator = new OpenCodeOrchestrator(adapter, config);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      orchestrator.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      orchestrator.stop();
      process.exit(0);
    });
    
    orchestrator.start();
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

if (import.meta.url) {
  // Run as module
  main();
} else {
  // Run as script
  main();
}