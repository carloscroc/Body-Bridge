/**
 * Simple community data seeding script using Convex CLI
 */

const { ConvexClient } = require('convex/browser');
const adminSecret = process.env.ADMIN_SCRIPT_SECRET || 'testsecret123';

// Create a simple Convex client
const convex = new ConvexClient({
  address: process.env.VITE_CONVEX_URL || 'http://127.0.0.1:3210',
});

async function seedCommunityData() {
  console.log('🌱 Starting community data seeding...');

  try {
    // Check if we have profiles to work with
    const profiles = await convex.query('api.profiles.getUsers', {});
    console.log(`Found ${profiles.length} profiles`);

    if (profiles.length < 2) {
      console.log('❌ Need at least 2 profiles to seed community data');
      console.log('Please create user accounts first.');
      return;
    }

    const clientProfile = profiles.find(p => p.role === 'user') || profiles[0];
    const trainerProfile = profiles.find(p => p.role === 'trainer') || profiles[1];

    console.log('Using profiles:', {
      client: clientProfile?.name || 'Unknown',
      trainer: trainerProfile?.name || 'Unknown'
    });

    const now = Date.now();

    // Sample posts
    const samplePosts = [
      {
        authorId: clientProfile.id,
        authorName: clientProfile.name || 'Community Member',
        authorAvatar: clientProfile.avatarUrl,
        authorRole: 'client',
        title: 'Just hit a new PR on bench press! 💪',
        content: 'After months of training, I finally hit my goal of 225 lbs on bench press! The programming from the coaches here really paid off. Thanks everyone for the support!',
        category: 'PR',
        mediaUrls: [],
        isPinned: true,
      },
      {
        authorId: trainerProfile.id,
        authorName: trainerProfile.name || 'Coach Sarah',
        authorAvatar: trainerProfile.avatarUrl,
        authorRole: 'trainer',
        title: 'Weekly Training Tip: Rest & Recovery',
        content: 'Don\'t underestimate the power of proper rest! 🛌 I\'ve seen too many athletes overtraining because they think more is always better. Quality > Quantity. Aim for 7-9 hours of sleep and take at least 1-2 rest days per week.',
        category: 'General Discussion',
        mediaUrls: [],
        isPinned: true,
      },
      {
        authorId: clientProfile.id,
        authorName: clientProfile.name || 'Mike F.',
        authorAvatar: clientProfile.avatarUrl,
        authorRole: 'client',
        title: 'Need help with squat form',
        content: 'I\'ve been working on my squat form but I feel like my knees might be caving in. Any tips from the coaches here? 🏋️‍♂️',
        category: 'Form Check',
        mediaUrls: [],
        isPinned: false,
      },
      {
        authorId: trainerProfile.id,
        authorName: trainerProfile.name || 'Coach Mike',
        authorAvatar: trainerProfile.avatarUrl,
        authorRole: 'trainer',
        title: 'Client Transformation Spotlight - John\'s Journey',
        content: 'In just 3 months, John has completely transformed his physique and strength! Down 15 lbs of body fat while maintaining muscle mass. 🏆',
        category: 'Wins',
        mediaUrls: [],
        isPinned: true,
      },
      {
        authorId: clientProfile.id,
        authorName: clientProfile.name || 'Emma L.',
        authorAvatar: clientProfile.avatarUrl,
        authorRole: 'client',
        title: 'Question about workout timing',
        content: 'What\'s the best time of day to train for strength gains? I\'ve been training in the mornings but wondering if evenings might be better. ⏰',
        category: 'Ask',
        mediaUrls: [],
        isPinned: false,
      },
    ];

    // Insert posts using the mutation directly
    console.log('Creating sample posts...');
    const createdPosts = [];
    for (const post of samplePosts) {
      try {
        const result = await convex.mutation('api.seed.insertSocialPost', {
          adminSecret,
          post,
        });
        if (result.success) {
          console.log(`✅ Created post: ${post.title.substring(0, 30)}...`);
          createdPosts.push(result.postId);
        }
      } catch (error) {
        console.error(`❌ Failed to create post: ${post.title}`, error.message);
      }
    }

    // Add some comments
    console.log('Creating sample comments...');
    if (createdPosts.length >= 2) {
      const sampleComments = [
        {
          postId: createdPosts[0],
          authorId: trainerProfile.id,
          authorName: trainerProfile.name || 'Coach Sarah',
          authorAvatar: trainerProfile.avatarUrl,
          authorRole: 'trainer',
          content: 'Incredible progress! 🙌 All that hard work is paying off.',
          parentCommentId: undefined,
        },
        {
          postId: createdPosts[0],
          authorId: clientProfile.id,
          authorName: 'Client Dave',
          authorAvatar: undefined,
          authorRole: 'client',
          content: 'Congrats! That\'s amazing progress. 💪',
          parentCommentId: undefined,
        },
        {
          postId: createdPosts[2],
          authorId: trainerProfile.id,
          authorName: trainerProfile.name || 'Coach Sarah',
          authorAvatar: trainerProfile.avatarUrl,
          authorRole: 'trainer',
          content: 'Great question! Make sure your knees are tracking over your toes. 📹',
          parentCommentId: undefined,
        },
      ];

      for (const comment of sampleComments) {
        try {
          const result = await convex.mutation('api.seed.insertSocialComment', {
            adminSecret,
            comment,
          });
          if (result.success) {
            console.log(`✅ Created comment for post ${comment.postId}`);
          }
        } catch (error) {
          console.error(`❌ Failed to create comment:`, error.message);
        }
      }
    }

    // Add some likes
    console.log('Creating sample likes...');
    const sampleLikes = [
      { postId: createdPosts[0], userId: trainerProfile.id },
      { postId: createdPosts[1], userId: clientProfile.id },
      { postId: createdPosts[2], userId: trainerProfile.id },
    ];

    for (const like of sampleLikes) {
      try {
        const result = await convex.mutation('api.seed.insertSocialLike', {
          adminSecret,
          like,
        });
        if (result.success) {
          console.log(`✅ Created like for post ${like.postId}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create like:`, error.message);
      }
    }

    // Add group members
    console.log('Adding group members...');
    for (const profile of profiles) {
      try {
        await convex.mutation('api.seed.insertGroupMember', {
          adminSecret,
          member: {
            userId: profile.id,
            fullName: profile.name || 'Member',
            avatarUrl: profile.avatarUrl,
            role: profile.role,
          },
        });
        console.log(`✅ Added group member: ${profile.name}`);
      } catch (error) {
        console.error(`❌ Failed to add group member: ${profile.name}`, error.message);
      }
    }

    console.log('\n✅ Community data seeded successfully!');
    console.log(`📊 Posts: ${createdPosts.length}, Comments: ${sampleComments.length}, Likes: ${sampleLikes.length}, Members: ${profiles.length}`);
  } catch (error) {
    console.error('❌ Error seeding community data:', error);
    throw error;
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'seed':
    seedCommunityData();
    break;
  default:
    console.log('Usage: node seed-community-simple.js [seed]');
    console.log('  seed  - Populate community with sample data');
    process.exit(1);
}