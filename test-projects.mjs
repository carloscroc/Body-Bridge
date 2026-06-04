// Test to see if there are multiple projects in the workspace
const API_KEY = 'plane_api_996fecef7f91430dac6964b212cf4274';
const BASE_URL = 'http://10.0.0.112:3300/api/v1/';
const WORKSPACE_SLUG = 'body-bridge';

async function testProjects() {
  try {
    console.log('Checking for multiple projects in workspace...');
    
    const headers = {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // List projects in the workspace
    const projectsUrl = BASE_URL + 'workspaces/' + WORKSPACE_SLUG + '/projects/';
    const projectsResponse = await fetch(projectsUrl, { headers });
    
    if (!projectsResponse.ok) {
      throw new Error('Projects API failed: ' + projectsResponse.status + ' - ' + projectsResponse.statusText);
    }
    
    const projectsData = await projectsResponse.json();
    const projects = projectsData.results || [];
    
    console.log('Found ' + projects.length + ' projects in workspace \'' + WORKSPACE_SLUG + '\':');
    
    projects.forEach((project, index) => {
      console.log((index + 1) + '. ' + project.name);
      console.log('   ID: ' + project.id);
      console.log('   Identifier: ' + (project.identifier || 'N/A'));
      console.log('   Description: ' + (project.description || 'No description'));
      console.log('');
    });
    
  } catch (error) {
    console.error('Error checking projects:', error.message);
  }
}

testProjects();
