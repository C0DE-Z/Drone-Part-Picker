const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkKoonendaBattery() {
  console.log('🔍 Checking Koonenda battery classification...\n');
  
  // Find the specific Koonenda battery
  const koonendaBattery = await prisma.product.findFirst({
    where: {
      name: {
        contains: 'Koonenda'
      }
    }
  });
  
  if (koonendaBattery) {
    console.log(`📦 Found: ${koonendaBattery.name}`);
    console.log(`   Category: ${koonendaBattery.category}`);
    console.log(`   Description: ${koonendaBattery.description || 'No description'}`);
    
    if (koonendaBattery.category !== 'battery') {
      console.log(`\n❌ PROBLEM: Battery is classified as "${koonendaBattery.category}" instead of "battery"`);
      
      // Fix it
      await prisma.product.update({
        where: { id: koonendaBattery.id },
        data: { category: 'battery' }
      });
      
      console.log(`✅ Fixed: Reclassified to "battery"`);
    } else {
      console.log(`\n✅ CORRECT: Battery is properly classified as "battery"`);
    }
  } else {
    console.log('❌ Koonenda battery not found');
  }
  
  // Also check remaining battery count
  const allBatteries = await prisma.product.findMany({
    where: { category: 'battery' }
  });
  
  console.log(`\n🔋 Total batteries in database: ${allBatteries.length}`);
  console.log('Examples:');
  allBatteries.slice(0, 3).forEach(battery => {
    console.log(`   - ${battery.name}`);
  });
}

checkKoonendaBattery()
  .then(() => prisma.$disconnect())
  .catch(error => {
    console.error('Error:', error);
    prisma.$disconnect();
  });