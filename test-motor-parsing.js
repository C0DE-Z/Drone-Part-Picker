// Test script to verify motor KV parsing fix
import { WebCrawlerService } from './services/WebCrawlerService.js';

const testMotors = [
  {
    name: "EMAX E3 Series 2808 Motor - 1500KV",
    description: "High-performance brushless motor for racing drones with 2808 stator size and 1500KV rating"
  },
  {
    name: "T-Motor F40 Pro III 2400KV",
    description: "Professional racing motor with 2207 stator configuration"
  },
  {
    name: "iFlight XING2 2207 1800KV",
    description: "Premium brushless motor with 2207 stator and 1800KV for racing"
  }
];

console.log('Testing Motor KV/Stator Parsing Fix:');
console.log('=' .repeat(50));

testMotors.forEach((motor, index) => {
  console.log(`\nTest ${index + 1}: ${motor.name}`);
  console.log(`Description: ${motor.description}`);
  
  try {
    const specs = WebCrawlerService.extractMotorSpecs(motor.name, motor.description);
    console.log('Extracted specs:', specs);
    
    // Validate the results
    if (motor.name.includes('1500KV') && specs.kv !== 1500) {
      console.log('❌ FAILED: Expected KV 1500, got', specs.kv);
    } else if (motor.name.includes('2400KV') && specs.kv !== 2400) {
      console.log('❌ FAILED: Expected KV 2400, got', specs.kv);
    } else if (motor.name.includes('1800KV') && specs.kv !== 1800) {
      console.log('❌ FAILED: Expected KV 1800, got', specs.kv);
    } else {
      console.log('✅ PASSED: KV extraction correct');
    }
    
    // Check stator size
    if (motor.name.includes('2808') && specs.statorSize !== '2808') {
      console.log('❌ FAILED: Expected stator 2808, got', specs.statorSize);
    } else if (motor.name.includes('2207') && specs.statorSize !== '2207') {
      console.log('❌ FAILED: Expected stator 2207, got', specs.statorSize);
    } else {
      console.log('✅ PASSED: Stator extraction correct');
    }
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
});

console.log('\n' + '=' .repeat(50));
console.log('Motor parsing test completed!');