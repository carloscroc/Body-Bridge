import { PlaneClient } from "./plane-client.js";

// Test connection to Plane.so with real credentials
async function testConnection() {
  try {
    const config = {
      api_key: "plane_api_996fecef7f91430dac6964b212cf4274",
      base_url: "http://10.0.0.112:3300/api/v1/",
      workspace_slug: "body-bridge",
      project_id: "8e7bb5fa-3f95-4701-a3d0-49562b4c0f4c",
      active_states: ["unstarted", "started"],
      terminal_states: ["completed", "cancelled"],
    };

    console.log("Testing connection to Plane.so...");
    console.log(Workspace: );
    console.log(Project: );
    
    const client = new PlaneClient(config);
    
    // Try to list states to see if we can connect
    console.log("\n1. Fetching states...");
    const states = await client.listStates();
    console.log(Successfully connected to Plane.so);
    console.log(Found  states:);
    
    const stateMap = new Map<string, string>();
    states.forEach(state => {
      console.log(  -  () []);
      stateMap.set(state.id, state.name);
    });
    
    // Try to list work items
    console.log("\n2. Fetching work items...");
    const workItems = await client.listAllWorkItems({ per_page: 10 });
    console.log(Found  work items (showing first 10):);
    
    workItems.slice(0, 10).forEach(item => {
      const stateName = stateMap.get(item.state) || item.state;
      console.log(  - [] );
      console.log(    ID: );
      console.log(    State: );
      console.log(    Priority: );
    });
    
    // Try to get specific issue BODYB-8
    console.log("\n3. Fetching specific issue BODYB-8...");
    try {
      const issue = await client.getWorkItemByIdentifier("BODYB-8");
      if (issue) {
        console.log(Found issue: BODYB-8);
        console.log(  Title: );
        console.log(  ID: );
        console.log(  State: );
        console.log(  Priority: );
        console.log(  Sequence: );
        console.log(  Description: );
      } else {
        console.log(Issue BODYB-8 not found);
      }
    } catch (error) {
      console.log(Error fetching BODYB-8: );
    }
    
    // Try to get active states for Symphony processing
    console.log("\n4. Testing Symphony active states...");
    const activeStateGroups = ["unstarted", "started"];
    const targetStateNames: string[] = [];
    const targetStateUuids: string[] = [];
    
    for (const state of states) {
      if (activeStateGroups.includes(state.group) && !targetStateUuids.includes(state.id)) {
        targetStateNames.push(state.name);
        targetStateUuids.push(state.id);
      }
    }
    
    console.log(Active state groups: );
    console.log(Active state names: );
    
    const activeItems = [];
    for (const uuid of targetStateUuids) {
      const items = await client.listAllWorkItems({
        state: uuid,
        expand: "project,label",
      });
      activeItems.push(...items);
    }
    
    console.log(Found  active issues ready for Symphony processing:);
    activeItems.forEach(item => {
      const stateName = stateMap.get(item.state) || item.state;
      console.log(  - []  ());
    });
    
  } catch (error) {
    console.error("Failed to connect to Plane.so:", error);
  }
}

testConnection();
