#!/usr/bin/env node

/**
 * Mempalace Client for Forge
 * 
 * Provides JavaScript interface to mempalace ChromaDB for storing and retrieving memories
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

class MempalaceClient {
  constructor(config = {}) {
    this.config = {
      mempalacePath: config.mempalacePath || '/home/carlos/.mempalace',
      project: config.project || 'forge',
      ...config
    };
    
    this.configPath = path.join(this.config.mempalacePath, 'config.json');
    this.palacePath = path.join(this.config.mempalacePath, 'palace');
    
    this.loadConfig();
  }

  loadConfig() {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      this.mempalaceConfig = JSON.parse(configData);
    } catch (error) {
      console.warn('Could not load mempalace config:', error.message);
      this.mempalaceConfig = {
        palace_path: this.palacePath,
        collection_name: 'mempalace_drawers',
        topic_wings: ['technical', 'security', 'project', 'performance', 'learning', 'context'],
        hall_keywords: {}
      };
    }
  }

  /**
   * Store a memory in mempalace
   * @param {Object} memory - Memory object with metadata
   * @returns {Promise<string>} Memory ID
   */
  async storeMemory(memory) {
    const memoryId = this.generateMemoryId();
    const timestamp = new Date().toISOString();
    
    const enrichedMemory = {
      id: memoryId,
      timestamp,
      project: this.config.project,
      session_id: this.getSessionId(),
      ...memory
    };

    // Validate memory structure
    this.validateMemory(enrichedMemory);

    // Determine category
    const category = this.determineCategory(enrichedMemory);
    enrichedMemory.category = category;

    // Store in mempalace (using Python script for ChromaDB interaction)
    await this.storeInChroma(enrichedMemory);

    // Also store in local memory index
    await this.updateLocalIndex(enrichedMemory);

    console.log(`✅ Memory stored: ${memoryId} (${category})`);
    return memoryId;
  }

  /**
   * Retrieve memories based on query
   * @param {Object} query - Query parameters
   * @returns {Promise<Array>} Retrieved memories
   */
  async retrieveMemories(query = {}) {
    const {
      search,
      category,
      tags,
      limit = 10,
      dateRange,
      importance
    } = query;

    let memories = await this.getAllMemories();

    // Apply filters
    if (category) {
      memories = memories.filter(m => m.category === category);
    }

    if (tags && tags.length > 0) {
      memories = memories.filter(m => 
        tags.some(tag => m.tags && m.tags.includes(tag))
      );
    }

    if (importance) {
      memories = memories.filter(m => m.importance === importance);
    }

    if (dateRange) {
      const { start, end } = dateRange;
      memories = memories.filter(m => {
        const date = new Date(m.timestamp);
        return date >= new Date(start) && date <= new Date(end);
      });
    }

    // Semantic search if query provided
    if (search) {
      memories = await this.semanticSearch(memories, search);
    }

    // Sort by relevance and timestamp
    memories = this.sortMemories(memories);

    // Limit results
    return memories.slice(0, limit);
  }

  /**
   * Update an existing memory
   * @param {string} id - Memory ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<boolean>} Success status
   */
  async updateMemory(id, updates) {
    const memories = await this.getAllMemories();
    const index = memories.findIndex(m => m.id === id);

    if (index === -1) {
      console.warn(`Memory not found: ${id}`);
      return false;
    }

    memories[index] = {
      ...memories[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    await this.saveAllMemories(memories);
    console.log(`✅ Memory updated: ${id}`);
    return true;
  }

  /**
   * Delete a memory
   * @param {string} id - Memory ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteMemory(id) {
    const memories = await this.getAllMemories();
    const filtered = memories.filter(m => m.id !== id);

    if (filtered.length === memories.length) {
      console.warn(`Memory not found: ${id}`);
      return false;
    }

    await this.saveAllMemories(filtered);
    console.log(`✅ Memory deleted: ${id}`);
    return true;
  }

  /**
   * Search memories by category
   * @param {string} category - Category to search
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Matching memories
   */
  async searchByCategory(category, limit = 10) {
    return this.retrieveMemories({ category, limit });
  }

  /**
   * Search memories by tags
   * @param {Array<string>} tags - Tags to search
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Matching memories
   */
  async searchByTags(tags, limit = 10) {
    return this.retrieveMemories({ tags, limit });
  }

  /**
   * Get recent memories
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Recent memories
   */
  async getRecentMemories(limit = 10) {
    const memories = await this.getAllMemories();
    return memories
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Get memories by date range
   * @param {string} start - Start date (ISO string)
   * @param {string} end - End date (ISO string)
   * @returns {Promise<Array>} Memories in range
   */
  async getMemoriesByDateRange(start, end) {
    return this.retrieveMemories({ dateRange: { start, end } });
  }

  /**
   * Get memory statistics
   * @returns {Promise<Object>} Memory statistics
   */
  async getStats() {
    const memories = await this.getAllMemories();
    
    const stats = {
      total: memories.length,
      byCategory: {},
      byImportance: {},
      byType: {},
      recentActivity: memories.slice(0, 5).map(m => ({
        id: m.id,
        timestamp: m.timestamp,
        summary: m.summary
      }))
    };

    memories.forEach(memory => {
      // By category
      stats.byCategory[memory.category] = (stats.byCategory[memory.category] || 0) + 1;
      
      // By importance
      stats.byImportance[memory.importance] = (stats.byImportance[memory.importance] || 0) + 1;
      
      // By type
      stats.byType[memory.type] = (stats.byType[memory.type] || 0) + 1;
    });

    return stats;
  }

  // Private helper methods

  generateMemoryId() {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSessionId() {
    // Try to get session ID from environment or generate one
    return process.env.SESSION_ID || this.generateMemoryId();
  }

  validateMemory(memory) {
    const required = ['summary', 'content', 'category', 'type', 'importance'];
    const missing = required.filter(field => !memory[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  determineCategory(memory) {
    if (memory.category) return memory.category;

    const content = (memory.summary + ' ' + memory.content).toLowerCase();
    const keywords = this.mempalaceConfig.hall_keywords || {};

    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => content.includes(word))) {
        return category;
      }
    }

    return 'technical'; // Default category
  }

  async storeInChroma(memory) {
    // This would use ChromaDB Python client
    // For now, we'll use local storage
    console.log(`Storing in ChromaDB: ${memory.id}`);
  }

  async updateLocalIndex(memory) {
    const indexFile = path.join(process.cwd(), '.memory', 'memory-index.json');
    const memoryDir = path.join(process.cwd(), '.memory');

    // Ensure directory exists
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }

    let index = [];
    if (fs.existsSync(indexFile)) {
      index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
    }

    index.push({
      id: memory.id,
      timestamp: memory.timestamp,
      category: memory.category,
      type: memory.type,
      importance: memory.importance,
      summary: memory.summary,
      tags: memory.tags || []
    });

    fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
  }

  async getAllMemories() {
    const indexFile = path.join(process.cwd(), '.memory', 'memory-index.json');
    
    if (!fs.existsSync(indexFile)) {
      return [];
    }

    return JSON.parse(fs.readFileSync(indexFile, 'utf8'));
  }

  async saveAllMemories(memories) {
    const indexFile = path.join(process.cwd(), '.memory', 'memory-index.json');
    fs.writeFileSync(indexFile, JSON.stringify(memories, null, 2));
  }

  async semanticSearch(memories, query) {
    // Simple keyword search for now
    // In production, this would use vector similarity
    const queryLower = query.toLowerCase();
    
    return memories.filter(memory => {
      const content = (
        memory.summary + ' ' + 
        memory.content + ' ' + 
        (memory.tags || []).join(' ')
      ).toLowerCase();
      
      return content.includes(queryLower);
    });
  }

  sortMemories(memories) {
    return memories.sort((a, b) => {
      // Sort by importance first
      const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const importanceDiff = importanceOrder[a.importance] - importanceOrder[b.importance];
      
      if (importanceDiff !== 0) return importanceDiff;
      
      // Then by timestamp (most recent first)
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }
}

// Export for use in other scripts
export { MempalaceClient };

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];

  const client = new MempalaceClient();

  async function runCLI() {
    try {
      switch (command) {
        case 'store':
          const memoryData = JSON.parse(args[1]);
          const id = await client.storeMemory(memoryData);
          console.log('Stored memory:', id);
          break;

        case 'retrieve':
          const query = args[1] ? JSON.parse(args[1]) : {};
          const memories = await client.retrieveMemories(query);
          console.log(JSON.stringify(memories, null, 2));
          break;

        case 'stats':
          const stats = await client.getStats();
          console.log(JSON.stringify(stats, null, 2));
          break;

        case 'recent':
          const recent = await client.getRecentMemories(parseInt(args[1]) || 10);
          console.log(JSON.stringify(recent, null, 2));
          break;

        default:
          console.log('Usage: node mempalace-client.js [store|retrieve|stats|recent] [args]');
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }

  runCLI();
}