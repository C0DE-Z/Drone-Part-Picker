'use client';

import React, { useState, useEffect } from 'react';
import { 
  Brain,
  Target,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Award,
  Lightbulb,
  Cpu,
  Database,
  Settings,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowRight,
  Gauge
} from 'lucide-react';
import { cacheService } from '@/lib/simple-cache';

interface CompatibilityPrediction {
  componentA: string;
  componentB: string;
  compatibilityScore: number;
  confidence: number;
  issues: Array<{
    type: 'physical' | 'electrical' | 'performance' | 'software';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    solution?: string;
  }>;
  recommendations: string[];
}

interface PerformancePrediction {
  buildId: string;
  buildName: string;
  predictions: {
    flightTime: { value: number; confidence: number; range: [number, number] };
    topSpeed: { value: number; confidence: number; range: [number, number] };
    thrust: { value: number; confidence: number; range: [number, number] };
    efficiency: { value: number; confidence: number; range: [number, number] };
    stability: { value: number; confidence: number; range: [number, number] };
  };
  recommendations: Array<{
    category: 'performance' | 'efficiency' | 'durability' | 'cost';
    suggestion: string;
    impact: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  riskFactors: Array<{
    factor: string;
    probability: number;
    impact: string;
  }>;
}

interface UsagePattern {
  userId: string;
  patterns: {
    preferredCategories: Array<{ category: string; frequency: number }>;
    budgetRange: { min: number; max: number; average: number };
    buildFrequency: number;
    seasonality: Array<{ month: string; activity: number }>;
    componentPreferences: Array<{ brand: string; preference: number }>;
  };
  predictions: {
    nextPurchase: { category: string; probability: number; timeframe: string };
    budgetGrowth: { trend: 'increasing' | 'decreasing' | 'stable'; rate: number };
    skillLevel: { current: number; projected: number; timeframe: string };
  };
  recommendations: Array<{
    type: 'component' | 'build' | 'upgrade' | 'education';
    title: string;
    description: string;
    priority: number;
    reasoning: string;
  }>;
}

interface MLModel {
  id: string;
  name: string;
  type: 'compatibility' | 'performance' | 'usage' | 'market';
  status: 'training' | 'ready' | 'updating' | 'error';
  accuracy: number;
  lastUpdated: string;
  trainingData: {
    samples: number;
    features: number;
    coverage: number;
  };
  performance: {
    precision: number;
    recall: number;
    f1Score: number;
  };
}

interface AnalyticsData {
  compatibility: CompatibilityPrediction[];
  performance: PerformancePrediction[];
  usage: UsagePattern[];
  models: MLModel[];
  insights: Array<{
    id: string;
    type: 'trend' | 'anomaly' | 'prediction' | 'recommendation';
    title: string;
    description: string;
    confidence: number;
    impact: 'low' | 'medium' | 'high';
    category: string;
    data: Record<string, unknown>;
  }>;
}

interface AdvancedAnalyticsProps {
  userId?: string;
  buildId?: string;
  showCompact?: boolean;
}

export default function AdvancedAnalytics({ userId, buildId, showCompact = false }: AdvancedAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'compatibility' | 'performance' | 'usage' | 'models'>('overview');
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [processingMode, setProcessingMode] = useState<'realtime' | 'batch'>('realtime');
  const [selectedInsights, setSelectedInsights] = useState<string[]>([]);

  useEffect(() => {
    loadAnalyticsData();
    
    // Set up real-time model updates
    const interval = setInterval(() => {
      if (processingMode === 'realtime') {
        updateModelsRealtime();
      }
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [userId, buildId, processingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const cacheKey = `analytics:${userId || 'global'}:${buildId || 'all'}`;
      let data = cacheService.get<AnalyticsData>(cacheKey);
      
      if (!data) {
        data = await generateAnalyticsData();
        cacheService.set(cacheKey, data, 600); // Cache for 10 minutes
      }
      
      setAnalyticsData(data);
      if (data.models.length > 0) {
        setSelectedModel(data.models[0]);
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalyticsData = async (): Promise<AnalyticsData> => {
    // Generate comprehensive ML analytics data
    const compatibility: CompatibilityPrediction[] = [
      {
        componentA: 'EMAX RS2205 Motor',
        componentB: 'HQProp 5x4.3x3 Propeller',
        compatibilityScore: 95,
        confidence: 88,
        issues: [],
        recommendations: [
          'Optimal combination for racing performance',
          'Consider 5x4.5x3 for higher efficiency'
        ]
      },
      {
        componentA: 'Tattu 4S 1550mAh Battery',
        componentB: 'EMAX RS2205 Motor Setup',
        compatibilityScore: 72,
        confidence: 91,
        issues: [
          {
            type: 'performance',
            severity: 'medium',
            description: 'Battery capacity may limit flight time with high-KV motors',
            solution: 'Consider 1800mAh or 2200mAh for longer flights'
          }
        ],
        recommendations: [
          'Upgrade to higher capacity battery for extended flight time',
          'Monitor voltage sag under high throttle'
        ]
      }
    ];

    const performance: PerformancePrediction[] = [
      {
        buildId: 'racing-build-001',
        buildName: 'Lightning Strike Racer',
        predictions: {
          flightTime: { value: 4.2, confidence: 85, range: [3.8, 4.6] },
          topSpeed: { value: 145.5, confidence: 78, range: [135, 156] },
          thrust: { value: 2850, confidence: 92, range: [2750, 2950] },
          efficiency: { value: 78, confidence: 81, range: [72, 84] },
          stability: { value: 88, confidence: 89, range: [85, 91] }
        },
        recommendations: [
          {
            category: 'performance',
            suggestion: 'Reduce prop pitch for better acceleration',
            impact: 15,
            difficulty: 'easy'
          },
          {
            category: 'efficiency',
            suggestion: 'Upgrade to higher C-rating battery',
            impact: 22,
            difficulty: 'medium'
          }
        ],
        riskFactors: [
          {
            factor: 'Motor overheating',
            probability: 0.15,
            impact: 'Performance degradation and potential failure'
          },
          {
            factor: 'ESC voltage sag',
            probability: 0.08,
            impact: 'Reduced throttle response'
          }
        ]
      }
    ];

    const usage: UsagePattern[] = [
      {
        userId: userId || 'user-123',
        patterns: {
          preferredCategories: [
            { category: 'Motors', frequency: 0.35 },
            { category: 'Frames', frequency: 0.28 },
            { category: 'Batteries', frequency: 0.22 },
            { category: 'Props', frequency: 0.15 }
          ],
          budgetRange: { min: 50, max: 300, average: 125 },
          buildFrequency: 2.3,
          seasonality: [
            { month: 'Jan', activity: 0.8 },
            { month: 'Feb', activity: 0.9 },
            { month: 'Mar', activity: 1.2 },
            { month: 'Apr', activity: 1.4 },
            { month: 'May', activity: 1.1 },
            { month: 'Jun', activity: 0.9 }
          ],
          componentPreferences: [
            { brand: 'EMAX', preference: 0.85 },
            { brand: 'Tattu', preference: 0.72 },
            { brand: 'HQProp', preference: 0.68 }
          ]
        },
        predictions: {
          nextPurchase: { category: 'Motors', probability: 0.73, timeframe: '2-3 weeks' },
          budgetGrowth: { trend: 'increasing', rate: 0.15 },
          skillLevel: { current: 7.2, projected: 8.1, timeframe: '6 months' }
        },
        recommendations: [
          {
            type: 'component',
            title: 'Upgrade Motor Collection',
            description: 'Based on your racing focus, consider higher KV motors',
            priority: 85,
            reasoning: 'High motor purchase frequency and racing build history'
          },
          {
            type: 'education',
            title: 'ESC Tuning Workshop',
            description: 'Learn advanced ESC configuration for better performance',
            priority: 72,
            reasoning: 'Skill progression indicates readiness for advanced topics'
          }
        ]
      }
    ];

    const models: MLModel[] = [
      {
        id: 'compatibility-model-v2',
        name: 'Component Compatibility Predictor',
        type: 'compatibility',
        status: 'ready',
        accuracy: 91.5,
        lastUpdated: new Date().toISOString(),
        trainingData: {
          samples: 125000,
          features: 247,
          coverage: 89.2
        },
        performance: {
          precision: 0.89,
          recall: 0.94,
          f1Score: 0.91
        }
      },
      {
        id: 'performance-model-v3',
        name: 'Flight Performance Estimator',
        type: 'performance',
        status: 'ready',
        accuracy: 87.3,
        lastUpdated: new Date().toISOString(),
        trainingData: {
          samples: 89000,
          features: 156,
          coverage: 92.1
        },
        performance: {
          precision: 0.85,
          recall: 0.90,
          f1Score: 0.87
        }
      },
      {
        id: 'usage-model-v1',
        name: 'User Behavior Analyzer',
        type: 'usage',
        status: 'training',
        accuracy: 83.7,
        lastUpdated: new Date().toISOString(),
        trainingData: {
          samples: 67000,
          features: 89,
          coverage: 76.4
        },
        performance: {
          precision: 0.81,
          recall: 0.87,
          f1Score: 0.84
        }
      }
    ];

    const insights = [
      {
        id: 'insight-1',
        type: 'trend' as const,
        title: 'Rising Motor KV Preferences',
        description: 'Users are increasingly choosing higher KV motors (2400+ KV) for racing builds',
        confidence: 89,
        impact: 'high' as const,
        category: 'Market Trends',
        data: { growth: 0.23, timeframe: '3 months' }
      },
      {
        id: 'insight-2',
        type: 'anomaly' as const,
        title: 'Unusual Battery Voltage Patterns',
        description: 'Detected 15% increase in 6S battery adoption, unusual for typical user base',
        confidence: 76,
        impact: 'medium' as const,
        category: 'Usage Patterns',
        data: { deviation: 0.15, significance: 0.03 }
      },
      {
        id: 'insight-3',
        type: 'prediction' as const,
        title: 'Component Price Forecast',
        description: 'ML models predict 8% price decrease in motor category over next quarter',
        confidence: 82,
        impact: 'high' as const,
        category: 'Market Predictions',
        data: { priceChange: -0.08, timeframe: 'Q4 2025' }
      }
    ];

    return {
      compatibility,
      performance,
      usage,
      models,
      insights
    };
  };

  const updateModelsRealtime = () => {
    if (!analyticsData) return;
    
    // Simulate real-time model updates
    setAnalyticsData(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        models: prev.models.map(model => ({
          ...model,
          accuracy: Math.max(0, Math.min(100, model.accuracy + (Math.random() - 0.5) * 2)),
          lastUpdated: new Date().toISOString()
        }))
      };
    });
  };

  const runModelTraining = async (modelId: string) => {
    if (!analyticsData) return;
    
    setAnalyticsData(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        models: prev.models.map(model =>
          model.id === modelId
            ? { ...model, status: 'training', lastUpdated: new Date().toISOString() }
            : model
        )
      };
    });
    
    // Simulate training process
    setTimeout(() => {
      setAnalyticsData(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          models: prev.models.map(model =>
            model.id === modelId
              ? { ...model, status: 'ready', accuracy: Math.min(100, model.accuracy + Math.random() * 5) }
              : model
          )
        };
      });
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-700';
      case 'training': return 'bg-yellow-100 text-yellow-700';
      case 'updating': return 'bg-blue-100 text-blue-700';
      case 'error': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'critical': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatMetric = (value: number, unit: string) => {
    return `${value.toFixed(1)}${unit}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Brain className="w-8 h-8 animate-pulse text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Analyzing data with ML models...</p>
          </div>
        </div>
      </div>
    );
  }

  if (showCompact || !analyticsData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Analytics
          </h3>
          <div className="text-sm text-gray-600">
            {analyticsData?.models.filter(m => m.status === 'ready').length || 0} models active
          </div>
        </div>
        
        {analyticsData && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {analyticsData.compatibility.length}
                </div>
                <div className="text-xs text-gray-600">Compatibility Checks</div>
              </div>
              
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData.insights.length}
                </div>
                <div className="text-xs text-gray-600">AI Insights</div>
              </div>
            </div>
            
            <div className="text-sm space-y-2">
              {analyticsData.insights.slice(0, 2).map((insight) => (
                <div key={insight.id} className="p-2 bg-gray-50 rounded text-xs">
                  <div className="font-medium text-gray-900">{insight.title}</div>
                  <div className="text-gray-600">{insight.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Advanced Analytics & ML Models</h1>
            <p className="opacity-90">Predictive insights powered by machine learning</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-4 h-4" />
              <span className="text-sm font-medium">Active Models</span>
            </div>
            <span className="text-2xl font-bold">
              {analyticsData.models.filter(m => m.status === 'ready').length}
            </span>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Avg Accuracy</span>
            </div>
            <span className="text-2xl font-bold">
              {(analyticsData.models.reduce((acc, m) => acc + m.accuracy, 0) / analyticsData.models.length).toFixed(1)}%
            </span>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-4 h-4" />
              <span className="text-sm font-medium">Training Samples</span>
            </div>
            <span className="text-2xl font-bold">
              {(analyticsData.models.reduce((acc, m) => acc + m.trainingData.samples, 0) / 1000).toFixed(0)}K
            </span>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4" />
              <span className="text-sm font-medium">Insights</span>
            </div>
            <span className="text-2xl font-bold">{analyticsData.insights.length}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <div className="flex space-x-8">
              {['overview', 'compatibility', 'performance', 'usage', 'models'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={`py-2 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Processing:</span>
                <select
                  value={processingMode}
                  onChange={(e) => setProcessingMode(e.target.value as 'realtime' | 'batch')}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="realtime">Real-time</option>
                  <option value="batch">Batch</option>
                </select>
              </div>
              
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`p-2 rounded transition-colors ${
                  showAdvanced ? 'bg-purple-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Insights */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Generated Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analyticsData.insights.map((insight) => (
                    <div key={insight.id} className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                          insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {insight.type.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">{insight.confidence}% confidence</span>
                      </div>
                      
                      <h4 className="font-semibold text-gray-900 mb-2">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{insight.category}</span>
                        <button
                          onClick={() => {
                            if (selectedInsights.includes(insight.id)) {
                              setSelectedInsights(prev => prev.filter(id => id !== insight.id));
                            } else {
                              setSelectedInsights(prev => [...prev, insight.id]);
                            }
                          }}
                          className={`p-1 rounded ${
                            selectedInsights.includes(insight.id)
                              ? 'bg-purple-100 text-purple-600'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {selectedInsights.includes(insight.id) ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {analyticsData.models.map((model) => (
                    <div key={model.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900 text-sm">{model.name}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(model.status)}`}>
                          {model.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Accuracy:</span>
                          <span className="font-medium">{model.accuracy.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Samples:</span>
                          <span className="font-medium">{(model.trainingData.samples / 1000).toFixed(0)}K</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">F1 Score:</span>
                          <span className="font-medium">{model.performance.f1Score.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      {model.status === 'ready' && (
                        <button
                          onClick={() => runModelTraining(model.id)}
                          className="w-full mt-3 px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                        >
                          Retrain Model
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compatibility' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Compatibility Analysis</h3>
                <span className="text-sm text-gray-600">
                  {analyticsData.compatibility.length} compatibility checks
                </span>
              </div>
              
              <div className="space-y-4">
                {analyticsData.compatibility.map((comp, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{comp.componentA}</span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{comp.componentB}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getCompatibilityColor(comp.compatibilityScore)}`}>
                            {comp.compatibilityScore}%
                          </div>
                          <div className="text-xs text-gray-600">
                            {comp.confidence}% confidence
                          </div>
                        </div>
                        
                        <div className={`w-3 h-3 rounded-full ${
                          comp.compatibilityScore >= 90 ? 'bg-green-500' :
                          comp.compatibilityScore >= 70 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`} />
                      </div>
                    </div>
                    
                    {comp.issues.length > 0 && (
                      <div className="mb-3">
                        <h5 className="font-medium text-gray-900 mb-2">Issues Detected:</h5>
                        <div className="space-y-2">
                          {comp.issues.map((issue, issueIndex) => (
                            <div key={issueIndex} className="flex items-start gap-3 p-3 bg-white rounded">
                              <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900 text-sm">{issue.description}</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                                    {issue.severity}
                                  </span>
                                </div>
                                {issue.solution && (
                                  <div className="text-sm text-gray-600">
                                    <strong>Solution:</strong> {issue.solution}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {comp.recommendations.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Recommendations:</h5>
                        <ul className="space-y-1">
                          {comp.recommendations.map((rec, recIndex) => (
                            <li key={recIndex} className="text-sm text-gray-600 flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Performance Predictions</h3>
              
              {analyticsData.performance.map((perf) => (
                <div key={perf.buildId} className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">{perf.buildName}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    {Object.entries(perf.predictions).map(([key, pred]) => (
                      <div key={key} className="bg-white rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Gauge className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        </div>
                        
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {formatMetric(pred.value, 
                            key === 'flightTime' ? 'min' :
                            key === 'topSpeed' ? 'mph' :
                            key === 'thrust' ? 'g' :
                            '%'
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-600">
                          <div>Range: {formatMetric(pred.range[0], '')} - {formatMetric(pred.range[1], '')}</div>
                          <div>Confidence: {pred.confidence}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3">Optimization Recommendations</h5>
                      <div className="space-y-3">
                        {perf.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-white rounded">
                            <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900 text-sm">{rec.suggestion}</span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  rec.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                  rec.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {rec.difficulty}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Expected impact: +{rec.impact}% {rec.category}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3">Risk Factors</h5>
                      <div className="space-y-3">
                        {perf.riskFactors.map((risk, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-white rounded">
                            <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900 text-sm">{risk.factor}</span>
                                <span className="text-xs text-gray-600">
                                  {(risk.probability * 100).toFixed(0)}% probability
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">{risk.impact}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Usage Pattern Analysis</h3>
              
              {analyticsData.usage.map((usage) => (
                <div key={usage.userId} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Category Preferences</h4>
                      <div className="space-y-2">
                        {usage.patterns.preferredCategories.map((cat) => (
                          <div key={cat.category} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{cat.category}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-gray-200 rounded-full">
                                <div
                                  className="h-2 bg-purple-500 rounded-full"
                                  style={{ width: `${cat.frequency * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600">
                                {(cat.frequency * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Predictions</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-white rounded">
                          <Target className="w-4 h-4 text-blue-600" />
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Next Purchase</div>
                            <div className="text-sm text-gray-600">
                              {usage.predictions.nextPurchase.category} ({usage.predictions.nextPurchase.probability * 100}% confidence)
                            </div>
                            <div className="text-xs text-gray-500">
                              Expected in {usage.predictions.nextPurchase.timeframe}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-white rounded">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <div>
                            <div className="font-medium text-gray-900 text-sm">Skill Progression</div>
                            <div className="text-sm text-gray-600">
                              {usage.predictions.skillLevel.current}/10 → {usage.predictions.skillLevel.projected}/10
                            </div>
                            <div className="text-xs text-gray-500">
                              In {usage.predictions.skillLevel.timeframe}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Personalized Recommendations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {usage.recommendations.map((rec, index) => (
                        <div key={index} className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-gray-900">{rec.title}</span>
                            </div>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              {rec.priority}% match
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                          <p className="text-xs text-gray-500">{rec.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'models' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">ML Model Management</h3>
                <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
                  Deploy New Model
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Model Overview</h4>
                  <div className="space-y-3">
                    {analyticsData.models.map((model) => (
                      <div
                        key={model.id}
                        onClick={() => setSelectedModel(model)}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          selectedModel?.id === model.id
                            ? 'bg-purple-50 border-purple-200'
                            : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                        } border`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{model.name}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(model.status)}`}>
                            {model.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Accuracy:</span>
                            <div className="font-medium">{model.accuracy.toFixed(1)}%</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Samples:</span>
                            <div className="font-medium">{(model.trainingData.samples / 1000).toFixed(0)}K</div>
                          </div>
                          <div>
                            <span className="text-gray-600">F1:</span>
                            <div className="font-medium">{model.performance.f1Score.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  {selectedModel && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        {selectedModel.name} Details
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Type:</span>
                            <div className="font-medium capitalize">{selectedModel.type}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <div className="font-medium capitalize">{selectedModel.status}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Accuracy:</span>
                            <div className="font-medium">{selectedModel.accuracy.toFixed(2)}%</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Last Updated:</span>
                            <div className="font-medium">
                              {new Date(selectedModel.lastUpdated).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Training Data</h5>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Samples:</span>
                              <div className="font-medium">{selectedModel.trainingData.samples.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Features:</span>
                              <div className="font-medium">{selectedModel.trainingData.features}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Coverage:</span>
                              <div className="font-medium">{selectedModel.trainingData.coverage.toFixed(1)}%</div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Performance Metrics</h5>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Precision:</span>
                              <div className="font-medium">{selectedModel.performance.precision.toFixed(3)}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Recall:</span>
                              <div className="font-medium">{selectedModel.performance.recall.toFixed(3)}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">F1 Score:</span>
                              <div className="font-medium">{selectedModel.performance.f1Score.toFixed(3)}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-4">
                          <button
                            onClick={() => runModelTraining(selectedModel.id)}
                            disabled={selectedModel.status === 'training'}
                            className="flex-1 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 transition-colors"
                          >
                            {selectedModel.status === 'training' ? (
                              <div className="flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Training...
                              </div>
                            ) : (
                              'Retrain Model'
                            )}
                          </button>
                          
                          <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                            Export
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}