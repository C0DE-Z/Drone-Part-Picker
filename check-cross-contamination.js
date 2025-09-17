import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findCrossContamination() {
  console.log('🔍 Looking for products with cross-contaminated descriptions...');
  
  // Look for batteries that mention prop brands
  const batteriesWithPropBrands = await prisma.product.findMany({
    where: {
      category: 'battery',
      OR: [
        { name: { contains: 'gemfan', mode: 'insensitive' } },
        { description: { contains: 'gemfan', mode: 'insensitive' } },
        { name: { contains: 'hqprop', mode: 'insensitive' } },
        { description: { contains: 'hqprop', mode: 'insensitive' } },
        { name: { contains: 'dalprop', mode: 'insensitive' } },
        { description: { contains: 'dalprop', mode: 'insensitive' } }
      ]
    }
  });
  
  console.log(`\n📋 Found ${batteriesWithPropBrands.length} batteries with prop brand mentions:`);
  batteriesWithPropBrands.forEach(battery => {
    console.log(`   - ${battery.name} (${battery.category})`);
  });
  
  // Look for props that mention battery terms
  const propsWithBatteryTerms = await prisma.product.findMany({
    where: {
      category: 'prop',
      OR: [
        { name: { contains: 'battery', mode: 'insensitive' } },
        { description: { contains: 'battery', mode: 'insensitive' } },
        { name: { contains: 'mah', mode: 'insensitive' } },
        { description: { contains: 'mah', mode: 'insensitive' } },
        { name: { contains: 'lipo', mode: 'insensitive' } },
        { description: { contains: 'lipo', mode: 'insensitive' } }
      ]
    }
  });
  
  console.log(`\n🎯 Found ${propsWithBatteryTerms.length} props with battery mentions:`);
  propsWithBatteryTerms.forEach(prop => {
    console.log(`   - ${prop.name} (${prop.category})`);
  });
  
  // Look for motors mentioned in camera descriptions  
  const motorsInCameraDescs = await prisma.product.findMany({
    where: {
      category: 'camera',
      OR: [
        { name: { contains: 'motor', mode: 'insensitive' } },
        { description: { contains: 'motor', mode: 'insensitive' } },
        { name: { contains: 'kv', mode: 'insensitive' } },
        { description: { contains: 'kv', mode: 'insensitive' } }
      ]
    }
  });
  
  console.log(`\n📷 Found ${motorsInCameraDescs.length} cameras with motor mentions:`);
  motorsInCameraDescs.forEach(camera => {
    console.log(`   - ${camera.name} (${camera.category})`);
  });
  
  // Summary
  const totalCrossContaminated = batteriesWithPropBrands.length + propsWithBatteryTerms.length + motorsInCameraDescs.length;
  console.log(`\n🎯 Summary: Found ${totalCrossContaminated} potentially cross-contaminated products`);
  
  if (totalCrossContaminated > 0) {
    console.log('\n💡 Recommendations:');
    console.log('   1. Review and clean product descriptions');
    console.log('   2. Implement description validation during import');
    console.log('   3. Add category-specific keyword filtering');
    console.log('   4. Monitor for future cross-contamination');
  }

  await prisma.$disconnect();
}

findCrossContamination().catch(console.error);