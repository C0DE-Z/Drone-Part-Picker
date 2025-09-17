import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupMisclassifications() {
  console.log('🧹 Cleaning up misclassified products...');
  
  // 1. Fix the remaining battery duplicates
  const batteryDuplicates = await prisma.product.findMany({
    where: {
      name: {
        contains: 'Koonenda SR521SW'
      },
      category: 'prop'
    }
  });
  
  console.log(`\n🔋 Found ${batteryDuplicates.length} battery duplicates still classified as prop`);
  for (const battery of batteryDuplicates) {
    await prisma.product.update({
      where: { id: battery.id },
      data: { category: 'battery' }
    });
    console.log(`   ✅ Fixed: ${battery.name}`);
  }
  
  // 2. Fix T-Motor Power Systems (motor+prop combos should be "motor")
  const tMotorSystems = await prisma.product.findMany({
    where: {
      name: {
        contains: 'T-Motor VELOX'
      },
      OR: [
        { category: 'prop' },
        { category: 'stack' }
      ]
    }
  });
  
  console.log(`\n⚡ Found ${tMotorSystems.length} T-Motor power systems to reclassify`);
  for (const motor of tMotorSystems) {
    await prisma.product.update({
      where: { id: motor.id },
      data: { category: 'motor' }
    });
    console.log(`   ✅ Fixed: ${motor.name} (${motor.category} → motor)`);
  }
  
  // 3. Fix frame products classified as camera
  const frameProducts = await prisma.product.findMany({
    where: {
      name: {
        contains: 'Frame'
      },
      category: 'camera'
    }
  });
  
  console.log(`\n🖼️  Found ${frameProducts.length} frame products classified as camera`);
  for (const frame of frameProducts) {
    await prisma.product.update({
      where: { id: frame.id },
      data: { category: 'frame' }
    });
    console.log(`   ✅ Fixed: ${frame.name}`);
  }
  
  // 4. Verify the main battery is now correct
  const mainBattery = await prisma.product.findFirst({
    where: {
      name: {
        contains: 'Koonenda SR521SW'
      }
    }
  });
  
  console.log(`\n🎯 Main battery verification:`);
  console.log(`   Name: ${mainBattery?.name}`);
  console.log(`   Category: ${mainBattery?.category}`);
  console.log(`   Status: ${mainBattery?.category === 'battery' ? '✅ CORRECT' : '❌ STILL WRONG'}`);
  
  await prisma.$disconnect();
}

cleanupMisclassifications().catch(console.error);