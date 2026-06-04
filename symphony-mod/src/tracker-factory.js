import { TrackerRegistry } from './tracker-registry.js';

// Create and configure tracker client dynamically
export function createTrackerClient(config, logger) {
  const registry = new TrackerRegistry();
  
  // Import and register built-in trackers
  const { LinearTrackerPlugin } = require('./trackers/linear-plugin.js');
  const { PlaneTrackerPlugin } = require('./trackers/plane-plugin.js');
  
  registry.register(new LinearTrackerPlugin());
  registry.register(new PlaneTrackerPlugin());
  
  // Support custom tracker plugins via config
  if (config.tracker.pluginPath) {
    try {
      const CustomPlugin = require(config.tracker.pluginPath);
      const customPlugin = new CustomPlugin();
      registry.register(customPlugin);
    } catch (error) {
      throw new Error(`Failed to load custom tracker plugin from ${config.tracker.pluginPath}: ${error.message}`);
    }
  }
  
  return registry.createClient(config.tracker.kind, config, logger);
}