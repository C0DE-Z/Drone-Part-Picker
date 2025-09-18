'use client';

import React, { useState, useEffect } from 'react';

// Simple Card Components
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow border p-4 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>
    {children}
  </div>
);

// Simple Status Badge Component
const StatusBadge = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

// Simple Tabs Components
const Tabs = ({ children }: { children: React.ReactNode }) => (
  <div>
    {children}
  </div>
);

const TabsList = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex border-b border-gray-200 dark:border-gray-700 mb-6 ${className}`}>
    {children}
  </div>
);

const TabsTrigger = ({ children, value, isActive, onClick }: { 
  children: React.ReactNode; 
  value: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      isActive 
        ? 'text-blue-600 border-blue-600' 
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-transparent hover:border-blue-500'
    }`}
  >
    {children}
  </button>
);

const TabsContent = ({ children, value, activeValue, className = '' }: { 
  children: React.ReactNode; 
  value: string;
  activeValue: string;
  className?: string;
}) => (
  <div className={`${value === activeValue ? 'block' : 'hidden'} ${className}`}>
    {children}
  </div>
);

interface SystemMetrics {
  classification: {
    totalClassifications: number;
    accuracyRate: number;
    averageConfidence: number;
    recentErrors: number;
  };
  learning: {
    patternsLearned: number;
    feedbackEntries: number;
    accuracyImprovement: number;
    lastLearningCycle: Date;
  };
  duplicateDetection: {
    duplicatesFound: number;
    autoMerged: number;
    requiresReview: number;
    mergingAccuracy: number;
  };
  predictiveAnalytics: {
    trendsAnalyzed: number;
    priceForecasts: number;
    marketInsights: number;
    predictionAccuracy: number;
  };
  imageClassification: {
    imagesProcessed: number;
    visualAccuracy: number;
    averageProcessingTime: number;
    featuresExtracted: number;
  };
}

interface SystemStatus {
  service: string;
  status: 'healthy' | 'warning' | 'error' | 'maintenance';
  uptime: string;
  lastCheck: Date;
  metrics: {
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
  issues?: string[];
}

interface AdminAction {
  id: string;
  action: string;
  description: string;
  category: 'optimization' | 'maintenance' | 'analysis' | 'configuration';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: string;
  requiresConfirmation: boolean;
}

interface OptimizationRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  category: string;
  potentialImprovement: string;
  actions: string[];
}

export default function AdvancedAdminDashboard() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [systemStatuses, setSystemStatuses] = useState<SystemStatus[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [adminActions] = useState<AdminAction[]>([
    {
      id: 'retrain-models',
      action: 'Retrain Classification Models',
      description: 'Trigger a complete retraining of all classification models with latest data',
      category: 'optimization',
      urgency: 'medium',
      estimatedTime: '45 minutes',
      requiresConfirmation: true
    },
    {
      id: 'run-duplicate-scan',
      action: 'Full Duplicate Scan',
      description: 'Perform comprehensive duplicate detection across entire product catalog',
      category: 'maintenance',
      urgency: 'low',
      estimatedTime: '2 hours',
      requiresConfirmation: true
    },
    {
      id: 'optimize-cache',
      action: 'Optimize Classification Cache',
      description: 'Clear and rebuild classification cache with optimized parameters',
      category: 'optimization',
      urgency: 'low',
      estimatedTime: '15 minutes',
      requiresConfirmation: false
    },
    {
      id: 'export-learning-data',
      action: 'Export Learning Data',
      description: 'Export all learning patterns and feedback data for analysis',
      category: 'analysis',
      urgency: 'low',
      estimatedTime: '5 minutes',
      requiresConfirmation: false
    }
  ]);

  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Simulate loading system metrics
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSystemMetrics({
        classification: {
          totalClassifications: 45782,
          accuracyRate: 0.984,
          averageConfidence: 0.91,
          recentErrors: 23
        },
        learning: {
          patternsLearned: 156,
          feedbackEntries: 892,
          accuracyImprovement: 0.078,
          lastLearningCycle: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        duplicateDetection: {
          duplicatesFound: 342,
          autoMerged: 278,
          requiresReview: 64,
          mergingAccuracy: 0.932
        },
        predictiveAnalytics: {
          trendsAnalyzed: 48,
          priceForecasts: 1247,
          marketInsights: 15,
          predictionAccuracy: 0.867
        },
        imageClassification: {
          imagesProcessed: 8934,
          visualAccuracy: 0.912,
          averageProcessingTime: 1250,
          featuresExtracted: 67892
        }
      });

      setSystemStatuses([
        {
          service: 'Classification Engine',
          status: 'healthy',
          uptime: '15d 4h 32m',
          lastCheck: new Date(),
          metrics: {
            responseTime: 89,
            errorRate: 0.008,
            throughput: 1247
          }
        },
        {
          service: 'Learning System',
          status: 'healthy',
          uptime: '15d 4h 32m',
          lastCheck: new Date(),
          metrics: {
            responseTime: 156,
            errorRate: 0.002,
            throughput: 456
          }
        },
        {
          service: 'Duplicate Detection',
          status: 'warning',
          uptime: '2d 18h 14m',
          lastCheck: new Date(),
          metrics: {
            responseTime: 2341,
            errorRate: 0.015,
            throughput: 89
          },
          issues: ['High memory usage during large batch processing']
        },
        {
          service: 'Predictive Analytics',
          status: 'healthy',
          uptime: '7d 12h 56m',
          lastCheck: new Date(),
          metrics: {
            responseTime: 445,
            errorRate: 0.003,
            throughput: 234
          }
        },
        {
          service: 'Image Classification',
          status: 'healthy',
          uptime: '12d 8h 21m',
          lastCheck: new Date(),
          metrics: {
            responseTime: 1250,
            errorRate: 0.012,
            throughput: 167
          }
        }
      ]);

      setRecommendations([
        {
          id: 'improve-battery-classification',
          title: 'Improve Battery Classification Accuracy',
          description: 'Battery classification shows lower accuracy (89.2%) compared to other categories. Additional training patterns needed.',
          impact: 'high',
          effort: 'medium',
          category: 'Classification',
          potentialImprovement: '+5.8% accuracy',
          actions: [
            'Analyze failed battery classifications',
            'Add more battery-specific patterns',
            'Retrain with focused battery dataset'
          ]
        },
        {
          id: 'optimize-duplicate-performance',
          title: 'Optimize Duplicate Detection Performance',
          description: 'Duplicate detection is experiencing slower response times during peak usage periods.',
          impact: 'medium',
          effort: 'low',
          category: 'Performance',
          potentialImprovement: '-60% response time',
          actions: [
            'Implement batch processing optimizations',
            'Add caching layer for similarity calculations',
            'Optimize database queries'
          ]
        },
        {
          id: 'expand-learning-patterns',
          title: 'Expand Learning Pattern Coverage',
          description: 'Some product categories have limited learned patterns, reducing system adaptability.',
          impact: 'medium',
          effort: 'high',
          category: 'Learning',
          potentialImprovement: '+12% pattern coverage',
          actions: [
            'Collect more feedback for underrepresented categories',
            'Implement active learning for pattern discovery',
            'Add domain-specific pattern extraction'
          ]
        }
      ]);

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setIsLoading(false);
    }
  };

  const executeAdminAction = async (actionId: string) => {
    const action = adminActions.find(a => a.id === actionId);
    if (!action) return;

    if (action.requiresConfirmation) {
      if (!confirm(`Are you sure you want to ${action.action}?\n\nThis will take approximately ${action.estimatedTime}.`)) {
        return;
      }
    }

    try {
      // Simulate action execution
      console.log(`Executing action: ${action.action}`);
      
      // In a real implementation, this would make API calls
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`${action.action} completed successfully!`);
      
      // Refresh data after action
      loadDashboardData();
    } catch (error) {
      console.error('Action failed:', error);
      alert(`Failed to execute ${action.action}: ${error}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '💡';
      default: return '📊';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading admin dashboard...</span>
      </div>
    );
  }

  if (!systemMetrics) {
    return (
      <div className="p-6 text-center text-gray-500">
        Failed to load dashboard data
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Advanced Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive system management and optimization center
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <StatusBadge className="bg-green-100 text-green-800">
            All Systems Operational
          </StatusBadge>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {systemStatuses.map((status) => (
          <Card key={status.service}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                  {status.service}
                </CardTitle>
                <StatusBadge className={getStatusColor(status.status)}>
                  {status.status}
                </StatusBadge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-xs text-gray-500">
                  Uptime: {status.uptime}
                </div>
                <div className="text-xs text-gray-500">
                  Response: {status.metrics.responseTime}ms
                </div>
                <div className="text-xs text-gray-500">
                  Error Rate: {(status.metrics.errorRate * 100).toFixed(2)}%
                </div>
                {status.issues && status.issues.length > 0 && (
                  <div className="text-xs text-yellow-600 mt-2">
                    ⚠️ {status.issues[0]}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger 
            value="overview"
            isActive={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="classification"
            isActive={activeTab === 'classification'}
            onClick={() => setActiveTab('classification')}
          >
            Classification
          </TabsTrigger>
          <TabsTrigger 
            value="learning"
            isActive={activeTab === 'learning'}
            onClick={() => setActiveTab('learning')}
          >
            Learning System
          </TabsTrigger>
          <TabsTrigger 
            value="analytics"
            isActive={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </TabsTrigger>
          <TabsTrigger 
            value="actions"
            isActive={activeTab === 'actions'}
            onClick={() => setActiveTab('actions')}
          >
            Admin Actions
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" activeValue={activeTab} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 dark:text-gray-400">
                  Total Classifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {systemMetrics.classification.totalClassifications.toLocaleString()}
                </div>
                <p className="text-sm text-green-600 mt-1">
                  {(systemMetrics.classification.accuracyRate * 100).toFixed(1)}% accuracy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 dark:text-gray-400">
                  Patterns Learned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {systemMetrics.learning.patternsLearned}
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  +{(systemMetrics.learning.accuracyImprovement * 100).toFixed(1)}% improvement
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 dark:text-gray-400">
                  Duplicates Processed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {systemMetrics.duplicateDetection.duplicatesFound}
                </div>
                <p className="text-sm text-green-600 mt-1">
                  {systemMetrics.duplicateDetection.autoMerged} auto-merged
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-gray-600 dark:text-gray-400">
                  Market Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {systemMetrics.predictiveAnalytics.marketInsights}
                </div>
                <p className="text-sm text-purple-600 mt-1">
                  {(systemMetrics.predictiveAnalytics.predictionAccuracy * 100).toFixed(1)}% accurate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Optimization Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-xl">{getImpactIcon(rec.impact)}</span>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {rec.title}
                        </h4>
                        <StatusBadge className={`${rec.impact === 'high' ? 'bg-red-100 text-red-800' : 
                                          rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                          'bg-green-100 text-green-800'}`}>
                          {rec.impact} impact
                        </StatusBadge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {rec.description}
                      </p>
                      <div className="text-sm text-green-600 font-medium">
                        Potential improvement: {rec.potentialImprovement}
                      </div>
                    </div>
                    <button className="ml-4 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classification Tab */}
        <TabsContent value="classification" activeValue={activeTab} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Classification Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Overall Accuracy</span>
                    <span className="font-semibold">{(systemMetrics.classification.accuracyRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Confidence</span>
                    <span className="font-semibold">{(systemMetrics.classification.averageConfidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recent Errors</span>
                    <span className="font-semibold text-red-600">{systemMetrics.classification.recentErrors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Processed</span>
                    <span className="font-semibold">{systemMetrics.classification.totalClassifications.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Image Classification Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Images Processed</span>
                    <span className="font-semibold">{systemMetrics.imageClassification.imagesProcessed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Visual Accuracy</span>
                    <span className="font-semibold">{(systemMetrics.imageClassification.visualAccuracy * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Processing Time</span>
                    <span className="font-semibold">{systemMetrics.imageClassification.averageProcessingTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Features Extracted</span>
                    <span className="font-semibold">{systemMetrics.imageClassification.featuresExtracted.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Learning System Tab */}
        <TabsContent value="learning" activeValue={activeTab} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Patterns Learned</span>
                    <span className="font-semibold">{systemMetrics.learning.patternsLearned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Feedback Entries</span>
                    <span className="font-semibold">{systemMetrics.learning.feedbackEntries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accuracy Improvement</span>
                    <span className="font-semibold text-green-600">+{(systemMetrics.learning.accuracyImprovement * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Learning Cycle</span>
                    <span className="font-semibold">{systemMetrics.learning.lastLearningCycle.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Duplicate Detection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Duplicates Found</span>
                    <span className="font-semibold">{systemMetrics.duplicateDetection.duplicatesFound}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto Merged</span>
                    <span className="font-semibold text-green-600">{systemMetrics.duplicateDetection.autoMerged}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Requires Review</span>
                    <span className="font-semibold text-yellow-600">{systemMetrics.duplicateDetection.requiresReview}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Merging Accuracy</span>
                    <span className="font-semibold">{(systemMetrics.duplicateDetection.mergingAccuracy * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" activeValue={activeTab} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Analytics Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {systemMetrics.predictiveAnalytics.trendsAnalyzed}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Trends Analyzed
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {systemMetrics.predictiveAnalytics.priceForecasts}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Price Forecasts
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {systemMetrics.predictiveAnalytics.marketInsights}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Market Insights
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(systemMetrics.predictiveAnalytics.predictionAccuracy * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Prediction Accuracy
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Actions Tab */}
        <TabsContent value="actions" activeValue={activeTab} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adminActions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {action.action}
                        </h4>
                        <StatusBadge className={getUrgencyColor(action.urgency)}>
                          {action.urgency}
                        </StatusBadge>
                        <StatusBadge className="bg-gray-100 text-gray-800">
                          {action.category}
                        </StatusBadge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {action.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        Estimated time: {action.estimatedTime}
                      </p>
                    </div>
                    <button
                      onClick={() => executeAdminAction(action.id)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Execute
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}