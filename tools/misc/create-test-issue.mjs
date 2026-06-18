// Create a test issue in the Body Bridge project
const API_KEY = 'plane_api_996fecef7f91430dac6964b212cf4274';
const BASE_URL = 'http://10.0.0.112:3300/api/v1/';
const WORKSPACE_SLUG = 'body-bridge';
const BODYBRIDGE_PROJECT_ID = '13cecebf-f9ff-41bd-b5bb-b88774ef6440';

async function createTestIssue() {
  try {
    console.log('Creating test issue in Body Bridge project...');
    
    const headers = {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // First, get the states for the Body Bridge project to find the Todo state
    const statesUrl = BASE_URL + 'workspaces/' + WORKSPACE_SLUG + '/projects/' + BODYBRIDGE_PROJECT_ID + '/states/';
    const statesResponse = await fetch(statesUrl, { headers });
    
    if (!statesResponse.ok) {
      throw new Error('States API failed: ' + statesResponse.status);
    }
    
    const statesData = await statesResponse.json();
    const states = statesData.results || [];
    
    const todoState = states.find(s => s.name === 'Todo' || s.group === 'unstarted');
    if (!todoState) {
      throw new Error('Could not find Todo state');
    }
    
    console.log('Found Todo state:', todoState.name, '(' + todoState.id + ')');
    
    // Create a test issue
    const issueData = {
      name: 'Test Symphony Integration',
      description_html: '<p>This is a test issue to verify that Symphony is properly connected to the Body Bridge project and can pick up issues when they are moved to active states.</p><p><strong>Steps to verify:</strong></p><ul><li>Create an issue in Plane.so</li><li>Move it to Todo state</li><li>Check if Symphony picks it up and starts processing</li></ul>',
      state: todoState.id,
      priority: 'high'
    };
    
    const createUrl = BASE_URL + 'workspaces/' + WORKSPACE_SLUG + '/projects/' + BODYBRIDGE_PROJECT_ID + '/issues/';
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(issueData)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error('Create issue failed: ' + createResponse.status + ' - ' + createResponse.statusText + ' - ' + errorText);
    }
    
    const createdIssue = await createResponse.json();
    console.log('Successfully created issue:');
    console.log('  Identifier: BODYBRIDGE-' + createdIssue.sequence_id);
    console.log('  Title: ' + createdIssue.name);
    console.log('  ID: ' + createdIssue.id);
    console.log('  State: ' + (todoState.name || 'Todo'));
    console.log('');
    console.log('Issue URL: http://10.0.0.112:3300/body-bridge/browse/BODYBRIDGE-' + createdIssue.sequence_id + '/');
    
  } catch (error) {
    console.error('Error creating test issue:', error.message);
  }
}

createTestIssue();
