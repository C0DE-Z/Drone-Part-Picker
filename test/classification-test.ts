// Test script to verify our product classification logic
// This helps ensure motors stay as motors, cameras as cameras, etc.

// Copy the classification function for testing
function classifyProduct(productName: string, description: string = '', url: string = ''): string {
  const text = `${productName} ${description} ${url}`.toLowerCase()
  
  // Definitive checks with more specific rules
  
  // Stack/Flight Controller has priority over motor (for cases like "T-Motor F7 AIO")
  if (text.includes('flight controller') || text.includes('aio') || text.includes('all-in-one') || 
      (text.includes('stack') && !text.includes('mount') && !text.includes('dampener'))) {
    return 'stack'
  }
  
  // Motor - but exclude mounts and accessories
  if (text.includes('motor') && !text.includes('motor mount') && !text.includes('mount')) {
    return 'motor'
  }
  
  // Frame - but exclude mounts and accessories
  if ((text.includes('frame') || text.includes('chassis')) && 
      !text.includes('mount') && !text.includes('dampener')) {
    return 'frame'
  }
  
  if (text.includes('camera') || text.includes('cam ') || text.includes(' cam')) {
    return 'camera'
  }
  if (text.includes('propeller') || text.includes('props') || text.includes('prop ')) {
    return 'prop'
  }
  if (text.includes('battery') || text.includes('lipo') || text.includes('li-po')) {
    return 'battery'
  }
  if (text.includes('esc') && !text.includes('mount')) {
    return 'stack'
  }
  
  // Scoring-based fallback
  const scores = {
    motor: 0,
    frame: 0,
    camera: 0,
    prop: 0,
    battery: 0,
    stack: 0
  }
  
  // Exclude accessories and mounts from scoring
  if (text.includes('mount') || text.includes('dampener') || text.includes('accessory')) {
    return 'other'
  }
  
  // Motor keywords
  if (text.includes('kv') || text.includes('stator') || text.includes('brushless') || text.includes('2207') || text.includes('2306') || text.includes('2208')) scores.motor += 2
  if (text.includes('motor') && !text.includes('mount')) scores.motor += 1
  
  // Frame keywords
  if (text.includes('frame') || text.includes('chassis') || text.includes('wheelbase') || text.includes('carbon fiber')) scores.frame += 2
  if (text.includes('freestyle') || text.includes('racing') || text.includes('micro')) scores.frame += 1
  
  // Camera keywords  
  if (text.includes('fpv') && (text.includes('camera') || text.includes('cam'))) scores.camera += 2
  if (text.includes('lens') || text.includes('cmos') || text.includes('ccd')) scores.camera += 1
  
  // Prop keywords
  if (text.includes('propeller') || text.includes('props') || text.includes('blades')) scores.prop += 2
  if (text.includes('5inch') || text.includes('6inch') || text.includes('tri-blade')) scores.prop += 1
  
  // Battery keywords
  if (text.includes('battery') || text.includes('lipo') || text.includes('mah') || text.includes('cell')) scores.battery += 2
  if (text.includes('1300mah') || text.includes('1500mah') || text.includes('4s') || text.includes('6s')) scores.battery += 1
  
  // Stack keywords - give priority to flight controller terms
  if (text.includes('flight controller') || text.includes('aio') || text.includes('all-in-one')) scores.stack += 3
  if (text.includes('stack') && !text.includes('mount') && !text.includes('dampener')) scores.stack += 2
  if (text.includes('esc') || text.includes('gyro')) scores.stack += 1
  
  // Find the highest scoring category
  const maxScore = Math.max(...Object.values(scores))
  if (maxScore === 0) return 'other'
  
  const winningEntry = Object.entries(scores).find(([, score]) => score === maxScore)
  return winningEntry ? winningEntry[0] : 'other'
}

// Test cases
const testCases = [
  // Motors
  { name: "TMotor F60 Pro III 2207 2750KV Brushless Motor", expected: "motor" },
  { name: "EMAX ECO II 2306 2400KV Motor", expected: "motor" },
  { name: "Xing2 2208 2450KV Motor", expected: "motor" },
  
  // Frames
  { name: "iFlight Nazgul5 V2 Frame Kit", expected: "frame" },
  { name: "TBS Source One V5 5 Inch FPV Freestyle Frame", expected: "frame" },
  { name: "Carbon Fiber 220mm Wheelbase Racing Frame", expected: "frame" },
  
  // Cameras
  { name: "Caddx Ratel 2 FPV Camera", expected: "camera" },
  { name: "RunCam Phoenix 2 1000TVL FPV Cam", expected: "camera" },
  { name: "Foxeer Arrow Micro Pro 600TVL FPV Camera", expected: "camera" },
  
  // Props
  { name: "GEMFAN 51466 Hurricane 5inch 3-Blade Propeller", expected: "prop" },
  { name: "HQProp DP 5x4.3x3 V1S Propellers", expected: "prop" },
  { name: "Emax Avan Flow 5 Inch Props", expected: "prop" },
  
  // Batteries
  { name: "CNHL 1300mAh 4S 100C Lipo Battery", expected: "battery" },
  { name: "Tattu R-Line 1550mAh 4S 95C Li-Po", expected: "battery" },
  { name: "GNB 1500mAh 6S 120C Battery Pack", expected: "battery" },
  
  // Stacks
  { name: "Mamba F722 MK3 Flight Controller Stack", expected: "stack" },
  { name: "T-Motor F7 HD AIO Flight Controller", expected: "stack" },
  { name: "JHEMCU GHF722AIO 35A 4in1 ESC Stack", expected: "stack" },
  
  // Edge cases that previously got misclassified
  { name: "Motor Mount Carbon Fiber", expected: "other" }, // Should NOT be classified as motor
  { name: "Stack Vibration Dampener", expected: "other" } // Description could confuse it
]

console.log("=== Classification Test Results ===")
let passed = 0
const total = testCases.length

for (const testCase of testCases) {
  const result = classifyProduct(testCase.name)
  const success = result === testCase.expected
  
  if (success) {
    passed++
    console.log(`✅ "${testCase.name}" -> ${result}`)
  } else {
    console.log(`❌ "${testCase.name}" -> ${result} (expected: ${testCase.expected})`)
  }
}

console.log(`\n=== Summary ===`)
console.log(`Passed: ${passed}/${total} (${Math.round(passed/total*100)}%)`)

if (passed === total) {
  console.log("🎉 All tests passed! Classification logic is working correctly.")
} else {
  console.log("⚠️  Some tests failed. Review the classification logic.")
}