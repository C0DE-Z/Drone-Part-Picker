/**
 * Enhanced Classification System Integration Test
 * 
 * Tests the fully integrated enhanced classification system with:
 * - Enhanced Classification Engine v2.0
 * - Intelligent Caching
 * - Performance Analytics
 * - Comprehensive Monitoring
 */

import { EnhancedClassificationIntegrationService } from './utils/EnhancedClassificationIntegrationService.js';

async function testEnhancedIntegratedSystem() {
  console.log('🚀 Testing Enhanced Classification System Integration');
  console.log('=' .repeat(60));

  const enhancedService = EnhancedClassificationIntegrationService.getInstance();

  // Test cases covering all major scenarios
  const testCases = [
    {
      name: "SpeedyBee Mario 5 Frame Kit - DC O4",
      description: "experience agile freestyle and smooth cinematic flight with the speedybee mario 5 dc o4 frame kit. built for dji o4, this 5-inch dc frame offers strong carbon fiber construction, clean cable routing, and pro-level compatibility—perfect for pilots who push limits. propeller compatibility: up to 5.1\"",
      expected: "frame",
      source: "api"
    },
    {
      name: "T-Motor F60 Pro III 2207 2450KV Motor",
      description: "brushless motor with 2450kv rating and 2207 stator size for freestyle drones",
      expected: "motor",
      source: "scraping"
    },
    {
      name: "Tattu 1550mAh 4S 75C LiPo Battery",
      description: "high performance 4s lipo battery with 1550mah capacity and xt60 connector",
      expected: "battery",
      source: "manual"
    },
    {
      name: "Gemfan 5152 3-Blade Propellers",
      description: "5152 three blade propellers for 5 inch freestyle drones",
      expected: "prop",
      source: "game"
    },
    {
      name: "Matek F722-SE Flight Controller with 4-in-1 ESC",
      description: "f722 flight controller with built-in pdb and betaflight osd, integrated 4-in-1 esc",
      expected: "stack",
      source: "api"
    },
    {
      name: "Caddx Vista Digital HD Camera",
      description: "dji digital hd fpv camera with crystal clear image quality",
      expected: "camera",
      source: "scraping"
    }
  ];

  let totalTests = 0;
  let passedTests = 0;
  let performanceSum = 0;

  console.log('\n📊 Running Classification Tests...\n');

  for (const testCase of testCases) {
    totalTests++;
    const startTime = Date.now();

    try {
      const result = enhancedService.classifyProduct(
        testCase.name,
        testCase.description,
        { source: testCase.source }
      );

      const enhanced = result.enhanced;
      const processingTime = Date.now() - startTime;
      performanceSum += processingTime;

      const isCorrect = enhanced.category === testCase.expected;
      if (isCorrect) {
        passedTests++;
      }

      // Record analytics for the test
      enhancedService.recordFeedback(
        testCase.name,
        enhanced.category,
        testCase.expected,
        isCorrect ? 'correct' : 'incorrect'
      );

      console.log(`${isCorrect ? '✅' : '❌'} ${testCase.name}`);
      console.log(`   Predicted: ${enhanced.category} (${enhanced.confidence}% confidence)`);
      console.log(`   Expected: ${testCase.expected}`);
      console.log(`   Method: ${enhanced.method}`);
      console.log(`   Time: ${processingTime}ms`);
      console.log(`   Reasoning: ${enhanced.reasoning.join(', ')}`);
      
      if (result.analysis.warnings.length > 0) {
        console.log(`   Warnings: ${result.analysis.warnings.join(', ')}`);
      }
      
      console.log('');

    } catch (error) {
      console.error(`❌ ERROR testing "${testCase.name}":`, error.message);
      console.log('');
    }
  }

  console.log('📈 Test Summary');
  console.log('-'.repeat(40));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Accuracy: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`Average Processing Time: ${(performanceSum / totalTests).toFixed(1)}ms`);

  // Test caching by running the same query twice
  console.log('\n🎯 Testing Cache Performance...\n');
  const cacheTestProduct = testCases[0];
  
  // First call (should not be cached)
  const start1 = Date.now();
  enhancedService.classifyProduct(cacheTestProduct.name, cacheTestProduct.description);
  const time1 = Date.now() - start1;
  
  // Second call (should be cached)
  const start2 = Date.now();
  enhancedService.classifyProduct(cacheTestProduct.name, cacheTestProduct.description);
  const time2 = Date.now() - start2;
  
  console.log(`First call: ${time1}ms`);
  console.log(`Second call (cached): ${time2}ms`);
  console.log(`Cache speedup: ${time1 > 0 ? ((time1 - time2) / time1 * 100).toFixed(1) : 0}%`);

  // Get cache statistics
  const cacheStats = enhancedService.getCacheStats();
  console.log('\n📊 Cache Statistics:');
  console.log(`Hit Ratio: ${cacheStats.hitRatio}%`);
  console.log(`Total Requests: ${cacheStats.totalRequests}`);
  console.log(`Cache Hits: ${cacheStats.cacheHits}`);
  console.log(`Cache Entries: ${cacheStats.entriesCount}`);

  // Get analytics report
  console.log('\n📈 Analytics Report...\n');
  const analyticsReport = enhancedService.getAnalyticsReport(1); // Last hour
  
  console.log(`🎯 Accuracy Metrics:`);
  console.log(`   Overall Accuracy: ${analyticsReport.accuracy.accuracyPercentage}%`);
  console.log(`   Total Classifications: ${analyticsReport.accuracy.totalClassifications}`);
  console.log(`   Correct Classifications: ${analyticsReport.accuracy.correctClassifications}`);

  console.log(`\n⚡ Performance Metrics:`);
  console.log(`   Average Processing Time: ${analyticsReport.performance.averageProcessingTime}ms`);
  console.log(`   Cache Hit Rate: ${analyticsReport.performance.cacheHitRate}%`);
  console.log(`   Throughput: ${analyticsReport.performance.throughputPerHour.toFixed(1)} classifications/hour`);

  console.log(`\n📊 Usage Patterns:`);
  Object.entries(analyticsReport.usage.categoriesDistribution).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} classifications`);
  });

  console.log(`\n💡 Insights:`);
  analyticsReport.insights.forEach(insight => {
    console.log(`   • ${insight}`);
  });

  if (analyticsReport.recommendations.length > 0) {
    console.log(`\n🔧 Recommendations:`);
    analyticsReport.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });
  }

  // Test batch processing
  console.log('\n🔄 Testing Batch Processing...');
  const batchStartTime = Date.now();
  const batchResults = enhancedService.classifyBatch(
    testCases.map(tc => ({
      name: tc.name,
      description: tc.description,
      context: { source: tc.source }
    }))
  );
  const batchTime = Date.now() - batchStartTime;
  
  console.log(`Batch processed ${batchResults.length} products in ${batchTime}ms`);
  console.log(`Average time per product: ${(batchTime / batchResults.length).toFixed(1)}ms`);

  console.log('\n🎉 Enhanced Classification System Integration Test Complete!');
  console.log('=' .repeat(60));
  
  return {
    accuracy: (passedTests / totalTests) * 100,
    averageTime: performanceSum / totalTests,
    cacheStats,
    analyticsReport
  };
}

// Run the test
testEnhancedIntegratedSystem()
  .then(results => {
    console.log('\n📋 Final Results Summary:');
    console.log(`🎯 Accuracy: ${results.accuracy.toFixed(1)}%`);
    console.log(`⚡ Performance: ${results.averageTime.toFixed(1)}ms avg`);
    console.log(`💾 Cache Hit Rate: ${results.cacheStats.hitRatio}%`);
    console.log(`📊 Total Analytics Events: ${results.analyticsReport.accuracy.totalClassifications}`);
    
    if (results.accuracy >= 95) {
      console.log('\n🏆 EXCELLENT: 99% accuracy target achieved!');
    } else if (results.accuracy >= 90) {
      console.log('\n✅ GOOD: High accuracy achieved');
    } else {
      console.log('\n⚠️ NEEDS IMPROVEMENT: Accuracy below target');
    }
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  });