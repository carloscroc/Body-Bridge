// Linear Tracker Plugin - wraps existing Linear client
import { LinearIssueTrackerClient } from './linear-client.js';

class LinearTrackerPlugin {
  name = 'Linear';
  kind = 'linear';

  validateConfig(config) {
    const errors = [];
    const tracker = config.tracker;
    
    if (!tracker.apiKey?.trim()) {
      errors.push('tracker.api_key is missing after environment resolution');
    }
    if (!tracker.projectSlug?.trim()) {
      errors.push('tracker.project_slug is required for tracker.kind=linear');
    }
    
    return errors;
  }

  createClient(config, logger) {
    return new LinearIssueTrackerClient(config, logger);
  }
}

export { LinearTrackerPlugin };