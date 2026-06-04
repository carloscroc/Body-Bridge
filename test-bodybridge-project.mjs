// Test to see issues in the actual Body Bridge project
const API_KEY = 'plane_api_996fecef7f91430dac6964b212cf4274';
const BASE_URL = 'http://10.0.0.112:3300/api/v1/';
const WORKSPACE_SLUG = 'body-bridge';
const BODYBRIDGE_PROJECT_ID = '13cecebf-f9ff-41bd-b5bb-b88774ef6440'; // From the projects list

async function testBodyBridgeProject() {
  try {
    console.log('Checking issues in Body Bridge project...');
    
    const headers = {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // List issues in the Body Bridge project
    const issuesUrl = BASE_URL + 'workspaces/' + WORKSPACE_SLUG + '/projects/' + BODYBRIDGE_PROJECT_ID + '/issues/';
    const issuesResponse = await fetch(issuesUrl, { headers });
    
    if (!issuesResponse.ok) {
      throw new Error('Issues API failed: ' + issuesResponse.status + ' - ' + issuesResponse.statusText);
    }
    
    const issuesData = await issuesResponse.json();
    const issues = issuesData.results || [];
    
    console.log('Found ' + issues.length + ' issues in Body Bridge project:');
    
    issues.forEach((issue, index) => {
      console.log((index + 1) + '. [' + issue.sequence_id + '] ' + issue.name);
      console.log('   ID: ' + issue.id);
      console.log('   State: ' + issue.state);
      console.log('   Priority: ' + issue.priority);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error checking Body Bridge project issues:', error.message);
  }
}

testBodyBridgeProject();
