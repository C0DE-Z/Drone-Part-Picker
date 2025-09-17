import { ProductResortService } from './services/ProductResortService.ts';

// Test classification with problematic examples
async function testClassification() {
  const service = new ProductResortService();
  
  const testCases = [
    // Should be BATTERY
    {
      name: 'Koonenda SR521SW 1.5V 10mAh Lithium Button Battery (10-Pack)',
      description: 'These batteries are a perfect fit for the Gemfan Moonlight V2 LED 51466 Durable Tri-Blade 5" Props!',
      expected: 'battery'
    },
    {
      name: 'Tattu 1550mAh 4S 14.8V 75C LiPo Battery',
      description: 'High performance LiPo battery pack for racing drones',
      expected: 'battery'
    },
    
    // Should be MOTOR (not battery despite LiPo mention)
    {
      name: 'T-Motor VELOX V2306 V3 5" Power System',
      description: 'High performance motor for 5 inch racing drones. Compatible with 4S-6S LiPo batteries.',
      expected: 'motor'
    },
    {
      name: 'Badass 2 - 2306.5 Motor - 1400KV',
      description: 'Designed for 6S LiPo setups. Motor specifications: 2306.5 size, 1400KV rating.',
      expected: 'motor'
    },
    {
      name: 'EMAX RSIII Series 2207 2100Kv Motor',
      description: 'Brushless motor for FPV racing. Works with 3S-4S LiPo batteries.',
      expected: 'motor'
    },
    
    // Should be FRAME (not battery despite battery mention)
    {
      name: 'BetaFPV Meteor85 Brushless Whoop Frame - Choose Color',
      description: 'Ultra-light frame for 85mm whoops. Battery mounting system included.',
      expected: 'frame'
    },
    {
      name: 'Flywoo Firefly16 Nano Baby V3 O4 Frame Kit',
      description: 'Compact micro frame with integrated battery protection and camera mount.',
      expected: 'frame'
    },
    
    // Should be CAMERA (not battery despite battery mention)
    {
      name: 'RunCam 6 - 4K Action Camera',
      description: '4K action camera with internal rechargeable battery. Records 4K at 60fps.',
      expected: 'camera'
    },
    {
      name: 'DJI Osmo Action 5 Standard Combo',
      description: 'Professional action camera with long-lasting battery and 4K recording.',
      expected: 'camera'
    },
    
    // Should be STACK (not battery despite LiPo mention)
    {
      name: 'AIKON AK8 80A 2-8S BLheli_S ESC',
      description: '80A ESC stack for high power builds. Supports 2S-8S LiPo batteries.',
      expected: 'stack'
    }
  ];
  
  console.log('🧪 Testing Fixed Classification Logic...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    const result = service.determineCategory(test.name, test.description);
    const isCorrect = result === test.expected;
    
    console.log(`${isCorrect ? '✅' : '❌'} ${test.name}`);
    console.log(`   Expected: ${test.expected}, Got: ${result}`);
    if (!isCorrect) {
      console.log(`   Description: ${test.description}`);
      failed++;
    } else {
      passed++;
    }
    console.log('');
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Classification logic is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Review classification logic.');
  }
}

testClassification().catch(console.error);