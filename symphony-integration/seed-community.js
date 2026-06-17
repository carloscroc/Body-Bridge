/**
 * Community Data Seeding Script
 * Run this script to populate the community section with sample data
 */

const adminSecret = process.env.ADMIN_SCRIPT_SECRET || 'testsecret123';

async function seedCommunityData() {
  console.log('🌱 Starting community data seeding...');

  try {
    // First, let's check if we have the required dependencies
    const { convex } = await import('./convex/_generated/server.js');

    // Get the seeded mutation
    const { seedCommunityData } = await import('./convex/seedCommunity.js');

    // Call the mutation
    const result = await convex.mutation(api.seedCommunityData, {
      adminSecret,
    });

    if (result.success) {
      console.log('✅ Community data seeded successfully!');
      console.log('📊 Stats:', result.stats);
    } else {
      console.log('❌ Failed to seed community data:', result.message);
    }
  } catch (error) {
    console.error('❌ Error seeding community data:', error);
    throw error;
  }
}

async function clearCommunityData() {
  console.log('🧹 Clearing community data...');

  try {
    const { convex } = await import('./convex/_generated/server.js');
    const { clearCommunityData } = await import('./convex/seedCommunity.js');

    const result = await convex.mutation(api.clearCommunityData, {
      adminSecret,
    });

    if (result.success) {
      console.log('✅ Community data cleared successfully!');
      console.log('📊 Stats:', result.stats);
    } else {
      console.log('❌ Failed to clear community data:', result.message);
    }
  } catch (error) {
    console.error('❌ Error clearing community data:', error);
    throw error;
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'seed':
    await seedCommunityData();
    break;
  case 'clear':
    await clearCommunityData();
    break;
  case 'stats':
    console.log('📊 Community stats coming soon...');
    break;
  default:
    console.log('Usage: node seed-community.js [seed|clear|stats]');
    console.log('  seed  - Populate community with sample data');
    console.log('  clear  - Clear all community data');
    console.log('  stats  - Show community statistics');
    process.exit(1);
}