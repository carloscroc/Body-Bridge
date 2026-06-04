// Plane.so Tracker Plugin - wraps Plane adapter
class PlaneTrackerPlugin {
  name = 'Plane.so';
  kind = 'plane';

  validateConfig(config) {
    const errors = [];
    const tracker = config.tracker;
    
    if (!tracker.apiKey?.trim()) {
      errors.push('tracker.api_key is missing after environment resolution');
    }
    if (!tracker.workspace_slug?.trim()) {
      errors.push('tracker.workspace_slug is required for tracker.kind=plane');
    }
    if (!tracker.project_id?.trim()) {
      errors.push('tracker.project_id is required for tracker.kind=plane');
    }
    
    return errors;
  }

  createClient(config, logger) {
    // We'll use a simple wrapper that calls the Plane adapter methods directly
    // This approach works with the compiled Symphony JavaScript
    return {
      async fetch_candidate_issues() {
        return this.fetchIssuesByStates(config.tracker.activeStates);
      },
      
      async fetch_issues_by_states(stateNames) {
        // Implementation to fetch from Plane.so API
        const PLANE_API_KEY = config.tracker.apiKey;
        const BASE_URL = config.tracker.endpoint;
        const WORKSPACE_SLUG = config.tracker.workspace_slug;
        const PROJECT_ID = config.tracker.project_id;
        
        const headers = {
          'X-API-Key': PLANE_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
        
        // Get states first
        const statesUrl = `${BASE_URL}workspaces/${WORKSPACE_SLUG}/projects/${PROJECT_ID}/states/`;
        const statesResponse = await fetch(statesUrl, { headers });
        const statesData = await statesResponse.json();
        const states = statesData.results || [];
        
        const stateMap = new Map();
        const stateGroupMap = new Map();
        states.forEach(state => {
          stateMap.set(state.name, state.id);
          stateMap.set(state.id, state.name);
          stateGroupMap.set(state.group, []);
        });
        
        states.forEach(state => {
          stateGroupMap.get(state.group).push(state.name);
        });
        
        // Get state UUIDs for the requested states
        const stateNames = Array.isArray(stateNames) ? stateNames : [stateNames];
        const targetStateNames = [];
        const targetStateUuids = [];
        
        for (const stateName of stateNames) {
          const state = states.find(s => s.name === stateName);
          if (state && !targetStateUuids.includes(state.id)) {
            targetStateNames.push(state.name);
            targetStateUuids.push(state.id);
          }
        }
        
        // Map state groups (Todo -> unstarted, etc.)
        const stateGroupMapping = {
          'Todo': ['unstarted'],
          'In Progress': ['started'],
          'Done': ['completed'],
          'Cancelled': ['cancelled'],
          'Backlog': ['backlog']
        };
        
        // If active states contain groups, expand them
        const expandedStateNames = [];
        for (const stateName of stateNames) {
          const expanded = stateGroupMapping[stateName] || [stateName];
          expandedStateNames.push(...expanded);
        }
        
        const allIssues = [];
        for (const stateName of expandedStateNames) {
          const state = states.find(s => s.name === stateName);
          if (state) {
            const issuesUrl = `${BASE_URL}workspaces/${WORKSPACE_SLUG}/projects/${PROJECT_ID}/issues/?state=${state.id}`;
            const issuesResponse = await fetch(issuesUrl, { headers });
            const issuesData = await issuesResponse.json();
            const issues = issuesData.results || [];
            
            allIssues.push(...issues.map(issue => {
              const projectIdentifier = issue.project_detail?.identifier || 'BODYBRIDGE';
              const identifier = `${projectIdentifier}-${issue.sequence_id}`;
              const url = `${BASE_URL.replace(/\/+$/, '')}/workspaces/${WORKSPACE_SLUG}/work-items/${identifier}/`;
              
              // Map priority from Plane.so string to number
              const priorityMap = { none: 0, low: 1, medium: 2, high: 3, urgent: 4 };
              const priority = priorityMap[issue.priority] || 0;
              
              return {
                id: issue.id,
                identifier: identifier,
                title: issue.name,
                description: issue.description_stripped || '',
                priority: priority,
                state: stateMap.get(issue.state) || issue.state,
                branch_name: `issue-${issue.sequence_id}-${issue.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}`,
                url: url,
                assignee_id: issue.assignees?.[0] || null,
                blocked_by: issue.blocked_by || [],
                labels: issue.label_details?.map(l => l.name) || issue.labels || [],
                assigned_to_worker: (issue.assignees?.length ?? 0) > 0,
                created_at: issue.created_at,
                updated_at: issue.updated_at
              };
            }));
          }
        }
        
        // Remove duplicates by ID
        const seen = new Set();
        return allIssues.filter(issue => {
          if (seen.has(issue.id)) return false;
          seen.add(issue.id);
          return true;
        });
      },
      
      async fetch_issue_states_by_ids(issueIds) {
        const PLANE_API_KEY = config.tracker.apiKey;
        const BASE_URL = config.tracker.endpoint;
        const WORKSPACE_SLUG = config.tracker.workspace_slug;
        const PROJECT_ID = config.tracker.project_id;
        
        const headers = {
          'X-API-Key': PLANE_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
        
        const result = new Map();
        
        // Get states mapping
        const statesUrl = `${BASE_URL}workspaces/${WORKSPACE_SLUG}/projects/${PROJECT_ID}/states/`;
        const statesResponse = await fetch(statesUrl, { headers });
        const statesData = await statesResponse.json();
        const states = statesData.results || [];
        
        const stateMap = new Map();
        states.forEach(state => {
          stateMap.set(state.id, state.name);
        });
        
        // Fetch each issue state
        for (const issueId of issueIds) {
          try {
            const issueUrl = `${BASE_URL}workspaces/${WORKSPACE_SLUG}/projects/${PROJECT_ID}/issues/${issueId}/`;
            const issueResponse = await fetch(issueUrl, { headers });
            
            if (issueResponse.ok) {
              const issue = await issueResponse.json();
              const stateName = stateMap.get(issue.state) || issue.state;
              result.set(issueId, stateName);
            } else {
              result.set(issueId, 'unknown');
            }
          } catch {
            result.set(issueId, 'unknown');
          }
        }
        
        return result;
      },
      
      async create_comment(issueId, commentHtml) {
        const PLANE_API_KEY = config.tracker.apiKey;
        const BASE_URL = config.tracker.endpoint;
        const WORKSPACE_SLUG = config.tracker.workspace_slug;
        const PROJECT_ID = config.tracker.project_id;
        
        const headers = {
          'X-API-Key': PLANE_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
        
        const commentsUrl = `${BASE_URL}workspaces/${WORKSPACE_SLUG}/projects/${PROJECT_ID}/issues/${issueId}/comments/`;
        await fetch(commentsUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ comment_html: commentHtml })
        });
      },
      
      async update_issue_state(issueId, stateName) {
        const PLANE_API_KEY = config.tracker.apiKey;
        const BASE_URL = config.tracker.endpoint;
        const WORKSPACE_SLUG = config.tracker.workspace_slug;
        const PROJECT_ID = config.tracker.project_id;
        
        const headers = {
          'X-API-Key': PLANE_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
        
        // Get state UUID
        const statesUrl = `${BASE_URL}workspaces/${WORKSPACE_SLUG}/projects/${PROJECT_ID}/states/`;
        const statesResponse = await fetch(statesUrl, { headers });
        const statesData = await statesResponse.json();
        const states = statesData.results || [];
        
        const state = states.find(s => s.name === stateName);
        if (!state) {
          throw new Error(`Plane state "${stateName}" not found in project`);
        }
        
        const issueUrl = `${BASE_URL}workspaces/${WORKSPACE_SLUG}/projects/${PROJECT_ID}/issues/${issueId}/`;
        await fetch(issueUrl, {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify({ state: state.id })
        });
      }
    };
  }
}

export { PlaneTrackerPlugin };