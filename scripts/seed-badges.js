// Seed script to create default badges through API
const badges = [
  {
    name: 'Admin',
    description: 'Site Administrator',
    type: 'ADMIN',
    icon: '👑',
    color: '#DC2626',
    rarity: 'legendary'
  },
  {
    name: 'Moderator',
    description: 'Community Moderator',
    type: 'MODERATOR',
    icon: '🛡️',
    color: '#7C3AED',
    rarity: 'epic'
  },
  {
    name: 'Verified',
    description: 'Verified Account',
    type: 'VERIFIED',
    icon: '✅',
    color: '#059669',
    rarity: 'rare'
  },
  {
    name: 'Early User',
    description: 'Beta Tester',
    type: 'EARLY_USER',
    icon: '🚀',
    color: '#2563EB',
    rarity: 'rare'
  },
  {
    name: 'Top Contributor',
    description: 'Highly Active Community Member',
    type: 'TOP_CONTRIBUTOR',
    icon: '⭐',
    color: '#F59E0B',
    rarity: 'epic'
  },
  {
    name: 'Drone Expert',
    description: 'Recognized Drone Building Expert',
    type: 'DRONE_EXPERT',
    icon: '🔧',
    color: '#10B981',
    rarity: 'epic'
  }
];

async function seedBadges() {
  console.log('Seeding badges...');
  
  for (const badge of badges) {
    try {
      const response = await fetch('http://localhost:3000/api/badges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(badge)
      });
      
      if (response.ok) {
        console.log(`✅ Created badge: ${badge.name}`);
      } else {
        console.log(`❌ Failed to create badge: ${badge.name}`);
      }
    } catch (error) {
      console.error(`Error creating badge ${badge.name}:`, error);
    }
  }
  
  console.log('Badge seeding complete!');
}

// Note: This script requires an admin user to be logged in
// Run this from the browser console when logged in as an admin
console.log('Copy and paste this into browser console when logged in as admin:');
console.log(seedBadges.toString());
console.log('Then call: seedBadges()');

export { seedBadges };
