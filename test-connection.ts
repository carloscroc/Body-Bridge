
import { PlaneClient } from &#34;./plane-client.js&#34;;

// Test connection to Plane.so
async function testConnection() {
  try {
    // You&#39;ll need to set these values
    const config = {
      api_key: &#34;YOUR_API_KEY_HERE&#34;, // Replace with actual API key
      base_url: &#34;http://10.0.0.112:3300/api/v1/&#34;,
      workspace_slug: &#34;body-bridge&#34;, // From the URL
      project_id: &#34;1&#34;, // This might need to be determined
      active_states: [&#34;unstarted&#34;, &#34;started&#34;],
      terminal_states: [&#34;completed&#34;, &#34;cancelled&#34;],
    };

    const client = new PlaneClient(config);
    
    // Try to list states to see if we can connect
    const states = await client.listStates();
    console.log(&#34;Successfully connected to Plane.so&#34;);
    console.log(Found \ states:);
    states.forEach(state => {
      console.log(  - \ (\) [\]);
    });
    
    // Try to list work items
    const workItems = await client.listAllWorkItems({ per_page: 5 });
    console.log(\nFound \ work items (showing first 5):);
    workItems.slice(0, 5).forEach(item => {
      console.log(  - [\] \ (\));
    });
  } catch (error) {
    console.error(&#34;Failed to connect to Plane.so:&#34;, error);
  }
}

testConnection();

