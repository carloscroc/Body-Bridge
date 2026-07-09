// Quick script to run the Jasmine tagging migration
const { Id } = require("./convex/_generated/dataModel");
const { internal } = require("./convex/_generated/server");

async function runMigration() {
  console.log("Starting Jasmine migration...");

  const result = await internal.migrations.tagNotionAsJasmine({
    // No admin secret needed in development
  });

  console.log("Migration result:", result);
  console.log("✅ Migration complete!");

  return result;
}

runMigration()
  .then(result => {
    console.log("✅ Success:", result);
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });