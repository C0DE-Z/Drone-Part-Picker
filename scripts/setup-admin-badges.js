const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupAdminBadges() {
  try {
    console.log('Setting up admin badges...');

    // Create default badges if they don't exist
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
        description: 'One of the first users',
        type: 'EARLY_USER',
        icon: '🌟',
        color: '#F59E0B',
        rarity: 'epic'
      },
      {
        name: 'Top Contributor',
        description: 'Outstanding community contributor',
        type: 'TOP_CONTRIBUTOR',
        icon: '🏆',
        color: '#8B5CF6',
        rarity: 'legendary'
      },
      {
        name: 'Drone Expert',
        description: 'Recognized drone building expert',
        type: 'DRONE_EXPERT',
        icon: '🚁',
        color: '#10B981',
        rarity: 'epic'
      }
    ];

    // Create badges
    for (const badgeData of badges) {
      // Check if badge already exists
      const existingBadge = await prisma.badge.findFirst({
        where: { type: badgeData.type }
      });

      if (!existingBadge) {
        await prisma.badge.create({
          data: badgeData
        });
        console.log(`✓ Created badge: ${badgeData.name}`);
      } else {
        console.log(`✓ Badge already exists: ${badgeData.name}`);
      }
    }

    // Find admin users and assign admin badges
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });

    const adminBadge = await prisma.badge.findFirst({
      where: { type: 'ADMIN' }
    });

    const verifiedBadge = await prisma.badge.findFirst({
      where: { type: 'VERIFIED' }
    });

    for (const user of adminUsers) {
      // Assign admin badge
      if (adminBadge) {
        await prisma.userBadge.upsert({
          where: {
            userId_badgeId: {
              userId: user.id,
              badgeId: adminBadge.id
            }
          },
          update: {},
          create: {
            userId: user.id,
            badgeId: adminBadge.id,
            reason: 'Site Administrator',
            awardedBy: 'system'
          }
        });
        console.log(`✓ Assigned admin badge to user: ${user.username || user.email}`);
      }

      // Assign verified badge
      if (verifiedBadge) {
        await prisma.userBadge.upsert({
          where: {
            userId_badgeId: {
              userId: user.id,
              badgeId: verifiedBadge.id
            }
          },
          update: {},
          create: {
            userId: user.id,
            badgeId: verifiedBadge.id,
            reason: 'Verified account',
            awardedBy: 'system'
          }
        });
        console.log(`✓ Assigned verified badge to user: ${user.username || user.email}`);
      }
    }

    // Find moderator users and assign moderator badges
    const moderatorUsers = await prisma.user.findMany({
      where: { role: 'MODERATOR' }
    });

    const moderatorBadge = await prisma.badge.findFirst({
      where: { type: 'MODERATOR' }
    });

    for (const user of moderatorUsers) {
      // Assign moderator badge
      if (moderatorBadge) {
        await prisma.userBadge.upsert({
          where: {
            userId_badgeId: {
              userId: user.id,
              badgeId: moderatorBadge.id
            }
          },
          update: {},
          create: {
            userId: user.id,
            badgeId: moderatorBadge.id,
            reason: 'Community Moderator',
            awardedBy: 'system'
          }
        });
        console.log(`✓ Assigned moderator badge to user: ${user.username || user.email}`);
      }

      // Assign verified badge
      if (verifiedBadge) {
        await prisma.userBadge.upsert({
          where: {
            userId_badgeId: {
              userId: user.id,
              badgeId: verifiedBadge.id
            }
          },
          update: {},
          create: {
            userId: user.id,
            badgeId: verifiedBadge.id,
            reason: 'Verified account',
            awardedBy: 'system'
          }
        });
        console.log(`✓ Assigned verified badge to user: ${user.username || user.email}`);
      }
    }

    console.log('✅ Admin badges setup complete!');
  } catch (error) {
    console.error('Error setting up admin badges:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdminBadges();
