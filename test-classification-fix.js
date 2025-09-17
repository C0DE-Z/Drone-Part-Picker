import { ProductResortService } from './services/ProductResortService.js';

async function testBatteryClassification() {
  const resortService = new ProductResortService();
  
  console.log('🧪 Testing the updated classification logic...');
  
  // Test the exact battery product that was misclassified
  const productName = "Koonenda SR521SW 1.5V 10mAh Lithium Button Battery 10 Pack";
  const productDescription = `Description

These batteries are a perfect fit for the Gemfan Moonlight V2 LED 51466 Durable Tri-Blade 5" Props!
Specifications

Replacements: 379, 379A, V379, 379-1W, O-379A, 379L, D379, SP379, 618, LR63, 1191SO, 280-59, JA, 521, CX521A, SB-AC/DC, LR521, SR521, SR521SW (Alkaline Version), SR521W, SR63, LR69
Storage life: 2 years
Capacity: 10mAh
Battery Package: 30pcs
Single Battery dimension: 5.8mm diameter* 2.1mm thickness
Single Weight: 0.28g

Includes

10x Koonenda SR521SW 1.5V 10mAh Lithium Button Battery`;

  // Use the private method by casting
  const classification = (resortService as any).determineCategory(productName, productDescription);
  
  console.log(`📦 Product: ${productName}`);
  console.log(`🏷️  Classification: ${classification}`);
  console.log(`✅ Expected: battery`);
  console.log(`🎯 Result: ${classification === 'battery' ? 'CORRECT' : 'INCORRECT'}`);
  
  // Test a few more cases
  const testCases = [
    {
      name: "CNHL 1300mAh 4S 100C Lipo Battery",
      description: "High quality LiPo battery for racing drones",
      expected: "battery"
    },
    {
      name: "Gemfan Hurricane 51466 Tri-Blade Prop",
      description: "Durable propeller for 5 inch drones",
      expected: "prop"
    },
    {
      name: "T-Motor F60 Pro 2207 2750KV Motor",
      description: "Brushless motor for racing quads",
      expected: "motor"
    },
    {
      name: "iFlight Nazgul5 Frame Kit",
      description: "Carbon fiber frame for freestyle flying",
      expected: "frame"
    }
  ];
  
  console.log('\n🧪 Testing additional cases:');
  for (const testCase of testCases) {
    const result = (resortService as any).determineCategory(testCase.name, testCase.description);
    const isCorrect = result === testCase.expected;
    console.log(`   ${isCorrect ? '✅' : '❌'} ${testCase.name} → ${result} (expected: ${testCase.expected})`);
  }
  
  await resortService.close();
}

testBatteryClassification().catch(console.error);