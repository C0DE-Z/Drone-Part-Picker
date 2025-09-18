/**
 * Test script to verify the enhanced component classification
 * Run this to test classification of problematic products like ESCs vs Motors
 */

import { ComponentClassificationService } from '../utils/ComponentClassificationService';

console.log('🧪 Testing Enhanced Component Classification');
console.log('=' .repeat(50));

// Test cases that were causing issues
const testCases = [
  {
    name: 'iFLight SucceX-E F7 45A Stack',
    description: '45A ESC with F7 flight controller, 30.5x30.5mm mounting',
    expected: 'stack'
  },
  {
    name: 'T-Motor F40 Pro IV 2207 2400KV',
    description: 'Brushless motor with 2400KV rating and 2207 stator size',
    expected: 'motor'
  },
  {
    name: 'MAMBA F722 MK2 40A ESC Stack',
    description: '4-in-1 ESC with F722 flight controller',
    expected: 'stack'
  },
  {
    name: 'Individual 30A ESC',
    description: 'Single electronic speed controller 30A current rating',
    expected: 'stack'
  },
  {
    name: 'Gemfan 5140 Propeller 3-Blade',
    description: '5 inch propeller with 4.0 pitch and 3 blades',
    expected: 'prop'
  },
  {
    name: 'TATTU 1550mAh 4S 100C LiPo',
    description: '4S LiPo battery with 1550mAh capacity and 100C rating',
    expected: 'battery'
  },
  {
    name: 'T-Motor VELOX V2207 V2 Power System',
    description: 'Motor and propeller combo system with 2207 stator',
    expected: 'motor'
  },
  {
    name: 'Holybro Kakute H7 V1.3 Flight Controller',
    description: 'H7 flight controller with 30.5x30.5mm mounting pattern',
    expected: 'stack'
  }
];

console.log('Running classification tests...\n');

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Description: ${testCase.description}`);
  console.log(`Expected: ${testCase.expected}`);
  
  const result = ComponentClassificationService.classifyComponent(
    testCase.name,
    testCase.description
  );
  
  const passed = result.category === testCase.expected;
  console.log(`Result: ${result.category} (${result.confidence}%)`);
  console.log(`Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Reasons: ${result.reasons.join(', ')}`);
  console.log('-'.repeat(40));
  
  if (passed) passedTests++;
});

console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! Classification system is working correctly.');
} else {
  console.log('⚠️  Some tests failed. Review the classification logic.');
}