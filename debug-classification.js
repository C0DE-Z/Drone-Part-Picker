// Debug the specific classification issue with the button battery

// Simulate the actual classification logic from WebCrawlerService
function isDefinitelyBattery(text) {
    // Battery brands are almost 100% definitive
    const batteryBrands = ['tattu', 'gnb', 'cnhl', 'gens ace', 'turnigy', 'zippy', 'ovonic', 'zeee', 'goldbat', 'dinogy'];
    if (batteryBrands.some(brand => text.includes(brand))) {
        console.log(`✅ Battery brand detected`);
        return true;
    }
    // Strong battery indicators
    if ((text.includes('lipo') || text.includes('battery')) && text.includes('mah')) {
        console.log(`✅ Battery: lipo/battery + mAh`);
        return true;
    }
    // Cell count with voltage or battery context
    if (/\d+s.*(?:lipo|battery)|(?:lipo|battery).*\d+s/.test(text)) {
        console.log(`✅ Battery: cell count pattern`);
        return true;
    }
    return false;
}

function isDefinitelyProp(text) {
    // Prop brands are highly definitive
    const propBrands = ['gemfan', 'hqprop', 'hq prop', 'dalprop', 'dal', 'ethix'];
    if (propBrands.some(brand => text.includes(brand))) {
        console.log(`✅ Prop brand detected`);
        return true;
    }
    // Definitive prop indicators
    if (text.includes('propeller') || text.includes('propellers')) {
        console.log(`✅ Prop: propeller keyword`);
        return true;
    }
    // Prop size patterns with blade count
    if (/\d+x\d+x\d+|\d+x\d+\.\d+.*blade|\d{4}.*(?:prop|blade)/.test(text)) {
        console.log(`✅ Prop: size pattern with blades`);
        return true;
    }
    return false;
}

function classifyByRules(text) {
    console.log(`\n=== Classifying: "${text}" ===`);
    
    // Step 1: Check for DEFINITIVE exclusions first
    console.log("Step 1: Checking battery...");
    if (isDefinitelyBattery(text)) {
        console.log("❌ CLASSIFICATION RESULT: battery");
        return 'battery';
    }
    
    console.log("Step 2: Checking prop...");
    if (isDefinitelyProp(text)) {
        console.log("❌ CLASSIFICATION RESULT: prop");
        return 'prop';
    }
    
    console.log("❌ CLASSIFICATION RESULT: fallback");
    return 'other';
}

// Test the exact product that's having issues
const problemProduct = "Koonenda SR521SW 1.5V 10mAh Lithium Button Battery (10-Pack)";
const problemProductLower = problemProduct.toLowerCase();

console.log("=== DEBUGGING BATTERY CLASSIFICATION ISSUE ===");
console.log(`Original: ${problemProduct}`);
console.log(`Lowercase: ${problemProductLower}`);

// Test each step manually
console.log("\n=== MANUAL TESTS ===");
console.log("Battery tests:");
console.log(`  Contains 'battery': ${problemProductLower.includes('battery')}`);
console.log(`  Contains 'mah': ${problemProductLower.includes('mah')}`);
console.log(`  Battery + mAh check: ${(problemProductLower.includes('lipo') || problemProductLower.includes('battery')) && problemProductLower.includes('mah')}`);

console.log("\nProp tests:");
const propBrands = ['gemfan', 'hqprop', 'hq prop', 'dalprop', 'dal', 'ethix'];
console.log(`  Contains any prop brand: ${propBrands.some(brand => problemProductLower.includes(brand))}`);
propBrands.forEach(brand => {
    if (problemProductLower.includes(brand)) {
        console.log(`    ⚠️  Found prop brand: ${brand}`);
    }
});

// Run the actual classification
const result = classifyByRules(problemProductLower);
console.log(`\n=== FINAL RESULT: ${result} ===`);

// Test if there's somehow "gemfan" in the text
console.log("\n=== CHECKING FOR HIDDEN GEMFAN ===");
const gemfanIndex = problemProductLower.indexOf('gemfan');
if (gemfanIndex !== -1) {
    console.log(`❌ Found 'gemfan' at index ${gemfanIndex}`);
    console.log(`Context: "${problemProductLower.substring(Math.max(0, gemfanIndex-10), gemfanIndex+15)}"`);
} else {
    console.log(`✅ No 'gemfan' found in product text`);
}

// Let's also test if this could be a data corruption issue
console.log("\n=== TESTING POSSIBLE SCENARIOS ===");

// Scenario 1: Clean battery should work
const cleanBattery = "1.5v 10mah lithium button battery";
console.log(`\nScenario 1 - Clean battery: "${cleanBattery}"`);
classifyByRules(cleanBattery);

// Scenario 2: What if somehow "gemfan" got appended?
const corruptedProduct = problemProductLower + " gemfan";
console.log(`\nScenario 2 - With gemfan appended: "${corruptedProduct}"`);
classifyByRules(corruptedProduct);

// Scenario 3: What if it's in metadata/description?
const withMetadata = problemProductLower + " description: high quality propeller by gemfan";
console.log(`\nScenario 3 - With gemfan in metadata: "${withMetadata}"`);
classifyByRules(withMetadata);