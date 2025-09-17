import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBatteryProduct() {
  console.log('🔍 Looking for the problematic battery product...');
  
  // Find the battery that's being misclassified
  const batteryProduct = await prisma.product.findFirst({
    where: {
      name: {
        contains: 'Koonenda SR521SW'
      }
    }
  });

  if (batteryProduct) {
    console.log('📦 Found the battery product:');
    console.log(`   ID: ${batteryProduct.id}`);
    console.log(`   Name: ${batteryProduct.name}`);
    console.log(`   Description: ${batteryProduct.description}`);
    console.log(`   Category: ${batteryProduct.category}`);
    console.log(`   Brand: ${batteryProduct.brand}`);
    console.log(`   Source URL: ${batteryProduct.sourceUrl}`);
    console.log(`   Vendor Data: ${JSON.stringify(batteryProduct.vendorData, null, 2)}`);
    
    // Check if "gemfan" appears anywhere in the data
    const fullText = `${batteryProduct.name} ${batteryProduct.description || ''} ${batteryProduct.brand || ''} ${JSON.stringify(batteryProduct.vendorData || {})}`.toLowerCase();
    console.log('\n🕵️ Checking for "gemfan" contamination:');
    console.log(`   Contains "gemfan": ${fullText.includes('gemfan')}`);
    
    if (fullText.includes('gemfan')) {
      const gemfanIndex = fullText.indexOf('gemfan');
      console.log(`   Found at index: ${gemfanIndex}`);
      console.log(`   Context: "${fullText.substring(Math.max(0, gemfanIndex-20), gemfanIndex+25)}"`);
    }
    
    // Also check related products (maybe there's cross-contamination)
    console.log('\n🔍 Checking for any products with "gemfan" in related vendor data...');
    const gemfanProducts = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'gemfan', mode: 'insensitive' } },
          { description: { contains: 'gemfan', mode: 'insensitive' } },
          { brand: { contains: 'gemfan', mode: 'insensitive' } }
        ]
      },
      take: 5
    });
    
    console.log(`   Found ${gemfanProducts.length} products with "gemfan"`);
    gemfanProducts.forEach((p, i) => {
      console.log(`   ${i+1}. ${p.name} (${p.category})`);
    });
    
  } else {
    console.log('❌ Could not find the battery product in database');
  }

  await prisma.$disconnect();
}

checkBatteryProduct().catch(console.error);