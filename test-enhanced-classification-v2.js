/**
 * Enhanced Classification Test Suite
 * 
 * Comprehensive test suite to validate the enhanced classification system
 * against real-world edge cases and problem scenarios.
 */

import { enhancedClassificationService } from '../utils/EnhancedClassificationIntegrationService';

// Comprehensive test cases covering all edge cases identified
const COMPREHENSIVE_TEST_CASES = [
  // === FRAME MISCLASSIFICATION CASES ===
  {
    name: "SpeedyBee Mario 5 Frame Kit - DC O4",
    description: "experience agile freestyle and smooth cinematic flight with the speedybee mario 5 dc o4 frame kit. built for dji o4, this 5-inch dc frame offers strong carbon fiber construction, clean cable routing, and pro-level compatibility—perfect for pilots who push limits. propeller compatibility: up to 5.1\"",
    expected: "frame",
    problemArea: "frame kit misclassified as prop due to 'propeller compatibility'"
  },
  {
    name: "Lumenier QAV-S 2 JohnnyFPV SE 5\" Frame Kit",
    description: "introducing the lumenier qav-s 2 johnnyfpv special edition frame, a cutting-edge masterpiece designed to elevate your fpv drone experience. wheelbase: 220mm",
    expected: "frame",
    problemArea: "frame with wheelbase should be definitive"
  },
  {
    name: "Axisflying Manta 5 SE Squashed X Frame Kit",
    description: "the axisflying manta 5 se frame kit is a sleek, extremely durable, and blue-flake forged carbon flying machine. wheelbase: 223mm, supported prop size: max 5.1 inch",
    expected: "frame",
    problemArea: "frame with wheelbase and prop compatibility mention"
  },

  // === MOTOR EDGE CASES ===
  {
    name: "T-Motor F60 Pro III 2207 2450KV Motor",
    description: "brushless motor with 2450kv rating and 2207 stator size for freestyle drones",
    expected: "motor",
    problemArea: "T-Motor brand disambiguation"
  },
  {
    name: "EMAX RS2205 2300KV Brushless Motor",
    description: "high performance 2205 brushless motor with 2300kv rating for racing applications",
    expected: "motor",
    problemArea: "motor with stator and KV"
  },
  {
    name: "T-Motor Velox V2207 1750KV Power System",
    description: "t-motor velox power system with 1750kv brushless motor for cinematic applications",
    expected: "motor",
    problemArea: "power system should override other indicators"
  },

  // === PROPELLER CASES ===
  {
    name: "Gemfan 5152 3-Blade Propellers",
    description: "5152 three blade propellers for 5 inch freestyle drones, premium material construction",
    expected: "prop",
    problemArea: "definitive propeller product"
  },
  {
    name: "HQProp 5x4.3x3 Racing Props",
    description: "5x4.3x3 racing propellers for maximum performance and efficiency",
    expected: "prop",
    problemArea: "prop brand with size specification"
  },
  {
    name: "Ethix S5 Stout Props",
    description: "ethix stout propellers designed for aggressive flying and durability",
    expected: "prop",
    problemArea: "prop brand without size in name"
  },

  // === BATTERY CASES ===
  {
    name: "Tattu 1550mAh 4S 75C LiPo Battery",
    description: "high performance 4s lipo battery with 1550mah capacity and xt60 connector for racing",
    expected: "battery",
    problemArea: "battery with all typical specs"
  },
  {
    name: "GNB 1300mAh 6S 120C Battery Pack",
    description: "gnb 6s 1300mah high discharge battery pack for extreme performance applications",
    expected: "battery",
    problemArea: "battery brand with capacity and cells"
  },
  {
    name: "CNHL 850mAh 4S LiPo",
    description: "cnhl 4s lipo battery 850mah capacity with high c rating for micro builds",
    expected: "battery",
    problemArea: "battery brand identification"
  },

  // === STACK/ESC/FC CASES ===
  {
    name: "Holybro Kakute F7 AIO Flight Controller",
    description: "holybro kakute f7 all-in-one flight controller with integrated esc and pdb",
    expected: "stack",
    problemArea: "AIO flight controller"
  },
  {
    name: "Matek H743-SLIM Flight Controller",
    description: "matek h743 slim flight controller with advanced features and betaflight support",
    expected: "stack",
    problemArea: "flight controller brand recognition"
  },
  {
    name: "BetaFPV F4 4in1 20A ESC",
    description: "betafpv f4 4in1 esc with 20a current rating for micro drones",
    expected: "stack",
    problemArea: "4-in-1 ESC classification"
  },
  {
    name: "SpeedyBee F7 V3 Stack",
    description: "speedybee f7 v3 flight controller stack with integrated esc and current sensor",
    expected: "stack",
    problemArea: "stack designation"
  },

  // === CAMERA CASES ===
  {
    name: "RunCam Phoenix 2 FPV Camera",
    description: "runcam phoenix 2 fpv camera with 1000tvl resolution and low latency",
    expected: "camera",
    problemArea: "FPV camera with TVL spec"
  },
  {
    name: "DJI O3 Air Unit",
    description: "dji o3 air unit digital fpv system with 4k recording capability",
    expected: "camera",
    problemArea: "digital FPV system"
  },
  {
    name: "Foxeer Razer Micro Camera",
    description: "foxeer razer micro fpv camera for micro and nano drones",
    expected: "camera",
    problemArea: "camera brand with micro designation"
  },

  // === TRICKY EDGE CASES ===
  {
    name: "Motor Mount for 2207 Motors",
    description: "aluminum motor mount for 2207 size motors, vibration dampening design",
    expected: "unknown", // Motor mount should not be classified as motor
    problemArea: "motor mount vs motor disambiguation"
  },
  {
    name: "Frame Protection Kit",
    description: "frame protection kit with carbon fiber guards and dampeners",
    expected: "unknown", // Accessories should not be main categories
    problemArea: "frame accessory vs frame"
  },
  {
    name: "GoPro Session 5 Action Camera",
    description: "gopro session 5 action camera for aerial photography",
    expected: "unknown", // Action cameras excluded from FPV cameras
    problemArea: "action camera exclusion"
  },

  // === BRAND DISAMBIGUATION CASES ===
  {
    name: "T-Motor Air Gear 350 Propellers",
    description: "t-motor air gear 350 propellers for large scale applications",
    expected: "prop",
    problemArea: "T-Motor prop vs motor disambiguation"
  },
  {
    name: "T-Motor F7 Flight Controller",
    description: "t-motor f7 flight controller with built-in esc and advanced features",
    expected: "stack",
    problemArea: "T-Motor FC vs motor disambiguation"
  },
  {
    name: "iFlight SucceX-E F4 Stack",
    description: "iflight succex-e f4 flight controller and esc stack combination",
    expected: "stack",
    problemArea: "iFlight brand context awareness"
  },

  // === SPECIFICATION CONTEXT CASES ===
  {
    name: "5\" Freestyle Frame with 5152 Prop Support",
    description: "5 inch freestyle frame designed for 5152 propellers, carbon fiber construction",
    expected: "frame",
    problemArea: "frame with prop specification mention"
  },
  {
    name: "Racing Frame - Supports 2207 Motors",
    description: "racing frame with motor mount compatibility for 2207 motor size",
    expected: "frame",
    problemArea: "frame with motor compatibility"
  },
  {
    name: "Battery Tray for 1500mAh Packs",
    description: "battery mounting tray for 1500mah battery packs with xt60 connector",
    expected: "unknown",
    problemArea: "battery accessory vs battery"
  }
];

console.log('🧪 Enhanced Classification Test Suite');
console.log('=====================================');

console.log(`\n📊 Running ${COMPREHENSIVE_TEST_CASES.length} comprehensive test cases...`);

let totalTests = 0;
let passedTests = 0;
let failedTests = [];

const categoryStats = {
  motor: { total: 0, passed: 0 },
  frame: { total: 0, passed: 0 },
  stack: { total: 0, passed: 0 },
  camera: { total: 0, passed: 0 },
  prop: { total: 0, passed: 0 },
  battery: { total: 0, passed: 0 },
  unknown: { total: 0, passed: 0 }
};

for (const testCase of COMPREHENSIVE_TEST_CASES) {
  totalTests++;
  categoryStats[testCase.expected].total++;
  
  console.log(`\n🔍 Test ${totalTests}: "${testCase.name}"`);
  console.log(`   Expected: ${testCase.expected}`);
  console.log(`   Problem: ${testCase.problemArea}`);
  
  try {
    const result = enhancedClassificationService.classifyProduct(
      testCase.name, 
      testCase.description
    );
    
    const isCorrect = result.enhanced.category === testCase.expected;
    
    if (isCorrect) {
      passedTests++;
      categoryStats[testCase.expected].passed++;
      console.log(`   ✅ PASSED: ${result.enhanced.category} (${result.enhanced.confidence}% via ${result.enhanced.method})`);
    } else {
      const analysis = `Expected ${testCase.expected}, got ${result.enhanced.category} (${result.enhanced.confidence}% confidence)`;
      failedTests.push({ test: testCase, result, analysis });
      console.log(`   ❌ FAILED: ${analysis}`);
      console.log(`   Method: ${result.enhanced.method}`);
      console.log(`   Reasoning: ${result.enhanced.reasoning.join(', ')}`);
      
      if (result.analysis.warnings.length > 0) {
        console.log(`   Warnings: ${result.analysis.warnings.join(', ')}`);
      }
    }
  } catch (error) {
    console.log(`   💥 ERROR: ${error}`);
    failedTests.push({ 
      test: testCase, 
      result: null, 
      analysis: `Classification error: ${error}` 
    });
  }
}

const accuracyPercentage = (passedTests / totalTests) * 100;

console.log('\n📊 ============ TEST RESULTS ============');
console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
console.log(`❌ Failed: ${failedTests.length}/${totalTests} tests`);
console.log(`🎯 Overall Accuracy: ${accuracyPercentage.toFixed(1)}%`);

console.log('\n📈 Category-wise Performance:');
for (const [category, stats] of Object.entries(categoryStats)) {
  if (stats.total > 0) {
    const categoryAccuracy = (stats.passed / stats.total) * 100;
    console.log(`   ${category}: ${stats.passed}/${stats.total} (${categoryAccuracy.toFixed(1)}%)`);
  }
}

if (failedTests.length > 0) {
  console.log('\n🔍 ============ FAILED TEST ANALYSIS ============');
  
  const failuresByCategory = failedTests.reduce((acc, failure) => {
    const expected = failure.test.expected;
    if (!acc[expected]) acc[expected] = [];
    acc[expected].push(failure);
    return acc;
  }, {});
  
  for (const [category, failures] of Object.entries(failuresByCategory)) {
    console.log(`\n❌ ${category.toUpperCase()} Failures (${failures.length}):`);
    
    for (const failure of failures) {
      console.log(`\n   📦 "${failure.test.name}"`);
      console.log(`      Problem: ${failure.test.problemArea}`);
      console.log(`      Analysis: ${failure.analysis}`);
      
      if (failure.result?.enhanced) {
        console.log(`      Method Used: ${failure.result.enhanced.method}`);
        console.log(`      Reasoning: ${failure.result.enhanced.reasoning.join(', ')}`);
      }
    }
  }
  
  console.log('\n💡 ============ IMPROVEMENT SUGGESTIONS ============');
  
  if (failuresByCategory.frame) {
    console.log('\n🏗️ Frame Classification Issues:');
    console.log('   - Strengthen "frame kit" pattern recognition');
    console.log('   - Improve handling of specification mentions vs actual product type');
    console.log('   - Add negative patterns for compatibility mentions');
  }
  
  if (failuresByCategory.motor) {
    console.log('\n⚡ Motor Classification Issues:');
    console.log('   - Enhance T-Motor brand disambiguation');
    console.log('   - Improve motor mount vs motor distinction');
    console.log('   - Strengthen KV rating detection');
  }
  
  if (failuresByCategory.prop) {
    console.log('\n🌀 Propeller Classification Issues:');
    console.log('   - Better prop brand recognition');
    console.log('   - Improve size pattern matching');
    console.log('   - Handle blade count specifications');
  }
  
  if (failuresByCategory.stack) {
    console.log('\n🔗 Stack/ESC/FC Classification Issues:');
    console.log('   - Enhance AIO system detection');
    console.log('   - Improve brand-specific FC recognition');
    console.log('   - Better 4-in-1 ESC patterns');
  }
  
  if (failuresByCategory.camera) {
    console.log('\n📷 Camera Classification Issues:');
    console.log('   - Improve digital FPV system detection');
    console.log('   - Better camera brand recognition');
    console.log('   - Exclude action cameras more effectively');
  }
  
  if (failuresByCategory.battery) {
    console.log('\n🔋 Battery Classification Issues:');
    console.log('   - Enhance capacity pattern matching');
    console.log('   - Better cell count detection');
    console.log('   - Improve brand recognition');
  }
}

console.log('\n🎯 ============ TARGET ANALYSIS ============');
if (accuracyPercentage >= 99) {
  console.log('🎉 EXCELLENT! Achieved 99%+ accuracy target!');
} else if (accuracyPercentage >= 95) {
  console.log('✅ VERY GOOD! Close to 99% target, minor improvements needed.');
} else if (accuracyPercentage >= 90) {
  console.log('🚧 GOOD! Significant improvements made, more work needed for 99% target.');
} else {
  console.log('⚠️ NEEDS WORK! Major improvements required to reach 99% accuracy.');
}

const remainingWork = Math.ceil((99 - accuracyPercentage) * totalTests / 100);
if (remainingWork > 0) {
  console.log(`📈 Need to fix ${remainingWork} more test(s) to reach 99% accuracy`);
}

console.log('\n🔄 ============ NEXT STEPS ============');
if (accuracyPercentage < 99) {
  console.log('1. Analyze failed test patterns');
  console.log('2. Enhance classification rules for failing categories');
  console.log('3. Add more specific brand and pattern recognition');
  console.log('4. Implement negative patterns to prevent false positives');
  console.log('5. Re-run tests to validate improvements');
} else {
  console.log('1. Monitor real-world performance');
  console.log('2. Collect feedback from classification game');
  console.log('3. Add new test cases as edge cases are discovered');
  console.log('4. Continue refinement based on user feedback');
}

console.log('\n✨ Enhanced Classification Test Suite Complete');