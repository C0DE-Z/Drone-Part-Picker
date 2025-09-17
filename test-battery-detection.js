// Simple test of classification logic without imports
function testClassificationLogic() {
  console.log('🧪 Testing Fixed Classification Logic...\n');
  
  // Simulate the new battery detection logic
  function isDefinitivelyBattery(text) {
    text = text.toLowerCase();
    
    // Button/coin batteries are definitely batteries (specific form factor)
    if (text.includes('button battery') || text.includes('coin battery') || text.includes('lithium button')) {
      return true;
    }
    
    // Battery brands are definitive
    const batteryBrands = ['tattu', 'gnb', 'cnhl', 'gens ace', 'turnigy', 'zippy', 'ovonic', 'zeee', 'goldbat', 'dinogy'];
    if (batteryBrands.some(brand => text.includes(brand))) {
      return true;
    }
    
    // Must exclude products that are clearly NOT batteries but mention battery terms
    const nonBatteryIndicators = [
      'motor', 'kv', 'frame', 'flight controller', 'fc', 'aio', 'esc', 'camera', 'fpv camera',
      'prop', 'propeller', 'blade', 'antenna', 'vtx', 'transmitter'
    ];
    
    if (nonBatteryIndicators.some(indicator => text.includes(indicator))) {
      return false;
    }
    
    // Very specific battery patterns - capacity AND chemistry as primary product type
    const batteryPatterns = [
      /\b\d+mah.*(?:lipo|lithium|battery)\b/,  // "1500mAh LiPo"
      /\b(?:lipo|lithium).*\d+mah\b/,          // "LiPo 1500mAh"
      /\b\d+s\s+\d+mah/,                       // "4S 1500mAh"
      /\bmah.*\d+s.*(?:lipo|battery)/,         // "mAh 4S LiPo"
      /\b(?:lipo|lithium).*pack.*\d+mah/,      // "LiPo pack 1500mAh"
      /\bbattery.*pack.*\d+mah/                // "Battery pack 1500mAh"
    ];
    
    if (batteryPatterns.some(pattern => pattern.test(text))) {
      return true;
    }
    
    // Look for actual battery product names (not just compatibility mentions)
    if (text.includes('battery pack') || text.includes('lipo pack') || text.includes('lithium pack')) {
      return true;
    }
    
    return false;
  }
  
  function isDefinitivelyMotor(text) {
    text = text.toLowerCase();
    
    // Motor with KV rating (very definitive)
    if (text.includes('motor') && /\d+kv/.test(text)) {
      return true;
    }
    
    // T-Motor products (unless they're FCs)
    if (text.includes('t-motor') && !text.includes('flight controller') && !text.includes('aio')) {
      return true;
    }
    
    // Power system (T-Motor, etc.)
    if (text.includes('power system') && (text.includes('motor') || /\d+kv/.test(text))) {
      return true;
    }
    
    // Motor brands
    const motorBrands = ['emax motor', 'brotherhobby', 'racerstar', 'sunnysky'];
    if (motorBrands.some(brand => text.includes(brand))) {
      return true;
    }
    
    return false;
  }
  
  function testBatteryDetection(name, description) {
    const text = `${name} ${description}`.toLowerCase();
    
    if (isDefinitivelyBattery(text)) return 'battery';
    if (isDefinitivelyMotor(text)) return 'motor';
    
    // Simplified for testing
    if (text.includes('frame') && !text.includes('motor')) return 'frame';
    if (text.includes('camera')) return 'camera';
    if (text.includes('esc') || text.includes('aio')) return 'stack';
    
    return 'unknown';
  }
  
  const testCases = [
    // Should be BATTERY
    {
      name: 'Koonenda SR521SW 1.5V 10mAh Lithium Button Battery (10-Pack)',
      description: 'These batteries are a perfect fit for the Gemfan Moonlight V2 LED 51466 Durable Tri-Blade 5" Props!',
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
    
    // Should be FRAME (not battery despite battery mention)
    {
      name: 'BetaFPV Meteor85 Brushless Whoop Frame - Choose Color',
      description: 'Ultra-light frame for 85mm whoops. Battery mounting system included.',
      expected: 'frame'
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    const result = testBatteryDetection(test.name, test.description);
    const isCorrect = result === test.expected;
    
    console.log(`${isCorrect ? '✅' : '❌'} ${test.name}`);
    console.log(`   Expected: ${test.expected}, Got: ${result}`);
    if (!isCorrect) {
      console.log(`   Full text: ${test.name} ${test.description}`);
      failed++;
    } else {
      passed++;
    }
    console.log('');
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Battery detection logic is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Battery detection logic needs adjustment.');
  }
}

testClassificationLogic();