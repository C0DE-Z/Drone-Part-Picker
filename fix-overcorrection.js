const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixOverclassifiedBatteries() {
  console.log('🔧 Fixing overcorrected battery classifications...\n');
  
  // Find all products currently classified as "battery"
  const batteryProducts = await prisma.product.findMany({
    where: { category: 'battery' }
  });
  
  console.log(`📦 Found ${batteryProducts.length} products classified as "battery"`);
  
  let fixed = 0;
  const corrections = [];
  
  for (const product of batteryProducts) {
    const text = `${product.name} ${product.description || ''}`.toLowerCase();
    
    // Check if this is likely NOT a battery
    let newCategory = null;
    let reason = '';
    
    // Motor detection
    if ((text.includes('motor') && /\d+kv/.test(text)) || 
        (text.includes('t-motor') && !text.includes('flight controller')) ||
        (text.includes('power system') && text.includes('motor'))) {
      newCategory = 'motor';
      reason = 'Motor with KV rating or motor brand';
    }
    
    // Frame detection
    else if (text.includes('frame') && !text.includes('motor') && !text.includes('esc')) {
      newCategory = 'frame';
      reason = 'Contains "frame"';
    }
    
    // Camera detection
    else if (text.includes('camera') && (text.includes('4k') || text.includes('action') || text.includes('fpv') || text.includes('runcam') || text.includes('dji osmo'))) {
      newCategory = 'camera';
      reason = 'Camera product';
    }
    
    // Stack/ESC detection
    else if (text.includes('esc') || text.includes('aio') || text.includes('flight controller') || /\b(f411|f722|f405|f745)\b/.test(text)) {
      newCategory = 'stack';
      reason = 'ESC or flight controller';
    }
    
    // Prop detection
    else if (text.includes('prop') && text.includes('blade') && !text.includes('battery pack')) {
      newCategory = 'prop';
      reason = 'Propeller with blade reference';
    }
    
    // If we found a better classification, update it
    if (newCategory && newCategory !== 'battery') {
      await prisma.product.update({
        where: { id: product.id },
        data: { category: newCategory }
      });
      
      corrections.push({
        name: product.name,
        oldCategory: 'battery',
        newCategory: newCategory,
        reason: reason
      });
      
      console.log(`🔄 Fixed: ${product.name}`);
      console.log(`   battery → ${newCategory} (${reason})`);
      fixed++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixed} overcorrected products out of ${batteryProducts.length} total`);
  
  // Show summary of actual batteries remaining
  const remainingBatteries = await prisma.product.findMany({
    where: { category: 'battery' }
  });
  
  console.log(`\n🔋 Remaining legitimate batteries: ${remainingBatteries.length}`);
  remainingBatteries.slice(0, 5).forEach(battery => {
    console.log(`   - ${battery.name}`);
  });
  
  if (remainingBatteries.length > 5) {
    console.log(`   ... and ${remainingBatteries.length - 5} more`);
  }
  
  return { totalProcessed: batteryProducts.length, fixed: fixed, corrections: corrections };
}

fixOverclassifiedBatteries()
  .then(() => prisma.$disconnect())
  .catch(error => {
    console.error('Error:', error);
    prisma.$disconnect();
  });