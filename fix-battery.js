import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBatteryProduct() {
  console.log('🔧 Fixing the corrupted battery product...');
  
  // Find the battery that's being misclassified
  const batteryProduct = await prisma.product.findFirst({
    where: {
      name: {
        contains: 'Koonenda SR521SW'
      }
    }
  });

  if (batteryProduct) {
    console.log(`📦 Found battery: ${batteryProduct.name}`);
    console.log(`   Current category: ${batteryProduct.category}`);
    
    // Clean description by removing the prop cross-reference
    const cleanDescription = `Description

Specifications

Replacements: 379, 379A, V379, 379-1W, O-379A, 379L, D379, SP379, 618, LR63, 1191SO, 280-59, JA, 521, CX521A, SB-AC/DC, LR521, SR521, SR521SW (Alkaline Version), SR521W, SR63, LR69
Storage life: 2 years
Capacity: 10mAh
Battery Package: 30pcs
Single Battery dimension: 5.8mm diameter* 2.1mm thickness
Single Weight: 0.28g

Includes

10x Koonenda SR521SW 1.5V 10mAh Lithium Button Battery

More Info

SKU: 4891109011648
Barcode: 4891109011648`;
    
    // Update the product with clean description and correct category
    await prisma.product.update({
      where: { id: batteryProduct.id },
      data: {
        category: 'battery',
        description: cleanDescription,
        specifications: {
          capacity: '10mAh',
          voltage: '1.5V',
          chemistry: 'LITHIUM',
          type: 'Button Battery',
          weight: '0.28g',
          dimensions: '5.8mm x 2.1mm'
        }
      }
    });
    
    console.log('✅ Fixed the battery product:');
    console.log('   - Removed prop cross-reference from description');
    console.log('   - Set category to "battery"');
    console.log('   - Added proper battery specifications');
    
    // Verify the fix
    const updatedProduct = await prisma.product.findUnique({
      where: { id: batteryProduct.id }
    });
    
    console.log(`\n📋 Updated product:`)
    console.log(`   Category: ${updatedProduct?.category}`);
    console.log(`   Description contains "gemfan": ${updatedProduct?.description?.toLowerCase().includes('gemfan')}`);
    
  } else {
    console.log('❌ Could not find the battery product');
  }

  await prisma.$disconnect();
}

fixBatteryProduct().catch(console.error);