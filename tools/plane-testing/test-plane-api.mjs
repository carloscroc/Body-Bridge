// Test Plane.so API connection using Node.js fetch
const API_KEY = 'plane_api_996fecef7f91430dac6964b212cf4274';
const BASE_URL = 'http://10.0.0.112:3300/api/v1/';
const WORKSPACE_SLUG = 'body-bridge';
const PROJECT_ID = '8e7bb5fa-3f95-4701-a3d0-49562b4c0f4c';

async function testConnection() {
  try {
    console.log('Testing connection to Plane.so...');
    console.log('Workspace: ' + WORKSPACE_SLUG);
    console.log('Project: ' + PROJECT_ID);
    
    const headers = {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Test 1: List states
    console.log('');
    console.log('1. Fetching states...');
    const statesUrl = BASE_URL + 'workspaces/' + WORKSPACE_SLUG + '/projects/' + PROJECT_ID + '/states/';
    const statesResponse = await fetch(statesUrl, { headers });
    
    if (!statesResponse.ok) {
      throw new Error('States API failed: ' + statesResponse.status + ' - ' + statesResponse.statusText);
    }
    
    const statesData = await statesResponse.json();
    const states = statesData.results || [];
    console.log('Successfully connected to Plane.so');
    console.log('Found ' + states.length + ' states:');
    
    const stateMap = new Map();
    states.forEach(state => {
      console.log('  - ' + state.name + ' (' + state.id + ') [' + state.group + ']');
      stateMap.set(state.id, state.name);
      stateMap.set(state.name, state.id);
    });
    
    // Test 2: List work items
    console.log('');
    console.log('2. Fetching work items...');
    const workItemsUrl = BASE_URL + 'workspaces/' + WORKSPACE_SLUG + '/projects/' + PROJECT_ID + '/issues/';
    const workItemsResponse = await fetch(workItemsUrl + '?per_page=10', { headers });
    
    if (!workItemsResponse.ok) {
      throw new Error('Work items API failed: ' + workItemsResponse.status + ' - ' + workItemsResponse.statusText);
    }
    
    const workItemsData = await workItemsResponse.json();
    const workItems = workItemsData.results || [];
    console.log('Found ' + workItems.length + ' work items (showing first 10):');
    
    workItems.slice(0, 10).forEach(item => {
      const stateName = stateMap.get(item.state) || item.state;
      console.log('  - [' + item.sequence_id + '] ' + item.name);
      console.log('    ID: ' + item.id);
      console.log('    State: ' + stateName);
      console.log('    Priority: ' + item.priority);
    });
    
    // Test 3: Try to get specific issue BODYB-8
    console.log('');
    console.log('3. Fetching specific issue BODYB-8...');
    try {
      // First try to find it by sequence_id
      const searchUrl = BASE_URL + 'workspaces/' + WORKSPACE_SLUG + '/projects/' + PROJECT_ID + '/issues/?sequence_id=8';
      const searchResponse = await fetch(searchUrl, { headers });
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const searchResults = searchData.results || [];
        
        if (searchResults.length > 0) {
          const issue = searchResults[0];
          console.log('Found issue: BODYB-8');
          console.log('  Title: ' + issue.name);
          console.log('  ID: ' + issue.id);
          console.log('  State: ' + (stateMap.get(issue.state) || issue.state));
          console.log('  Priority: ' + issue.priority);
          console.log('  Sequence: ' + issue.sequence_id);
          const desc = issue.description_stripped ? issue.description_stripped.substring(0, 200) : 'No description';
          console.log('  Description: ' + desc);
        } else {
          console.log('Issue BODYB-8 not found');
        }
      } else {
        console.log('Error searching for BODYB-8: ' + searchResponse.status + ' - ' + searchResponse.statusText);
      }
    } catch (error) {
      console.log('Error fetching BODYB-8: ' + error.message);
    }
    
    // Test 4: Check for active issues ready for Symphony
    console.log('');
    console.log('4. Testing Symphony active states...');
    const activeStateGroups = ['unstarted', 'started'];
    const targetStateNames = [];
    const targetStateUuids = [];
    
    for (const state of states) {
      if (activeStateGroups.includes(state.group) && !targetStateUuids.includes(state.id)) {
        targetStateNames.push(state.name);
        targetStateUuids.push(state.id);
      }
    }
    
    console.log('Active state groups: ' + activeStateGroups.join(', '));
    console.log('Active state names: ' + targetStateNames.join(', '));
    
    const activeItems = [];
    for (const uuid of targetStateUuids) {
      const activeUrl = BASE_URL + 'workspaces/' + WORKSPACE_SLUG + '/projects/' + PROJECT_ID + '/issues/?state=' + uuid + '&expand=project,label';
      const activeResponse = await fetch(activeUrl, { headers });
      
      if (activeResponse.ok) {
        const activeData = await activeResponse.json();
        const items = activeData.results || [];
        activeItems.push(...items);
      }
    }
    
    console.log('Found ' + activeItems.length + ' active issues ready for Symphony processing:');
    activeItems.forEach(item => {
      const stateName = stateMap.get(item.state) || item.state;
      console.log('  - [' + item.sequence_id + '] ' + item.name + ' (' + stateName + ')');
    });
    
    console.log('');
    console.log('All tests passed! Plane.so connection is working correctly.');
    
  } catch (error) {
    console.error('Failed to connect to Plane.so:', error.message);
    process.exit(1);
  }
}

testConnection();
