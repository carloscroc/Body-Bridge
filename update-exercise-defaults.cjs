const { ConvexHttpClient } = require("convex/client");
const { fetch } = require("node-fetch");

const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL || "http://127.0.0.1:3210");

async function main() {
  // Get all exercises without isActive
  const result = await client.query("exercises:list", {});
  const exercises = result.filter(e => e.isActive === undefined);
  
  console.log(`Found ${exercises.length} exercises without isActive field`);
  
  // Update each one
  let updated = 0;
  for (const exercise of exercises) {
    await client.mutation("exercises:update", {
      exerciseId: exercise._id,
      updates: {
        isActive: true,
        sourceSystem: "seed"
      }
    });
    updated++;
    console.log(`Updated ${updated}/${exercises.length}: ${exercise.name}`);
  }
  
  console.log(`Successfully updated ${updated} exercises`);
}

main().catch(console.error);