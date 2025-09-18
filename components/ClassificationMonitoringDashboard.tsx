'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './Badge';

interface ClassificationMetrics {
  totalClassifications: number;
  accuracyRate: number;
  averageConfidence: number;
  categoriesProcessed: { [key: string]: number };
  recentActivity: ActivityEntry[];
  systemHealth: SystemHealth;
  performanceMetrics: PerformanceMetrics;
  hourlyStats: HourlyStats[];
}

interface ActivityEntry {
  id: string;
  timestamp: Date;
  productName: string;
  category: string;
  confidence: number;
  processingTime: number;
  source: 'scraper' | 'manual' | 'api';
  status: 'success' | 'warning' | 'error';
}

interface SystemHealth {
  cacheHitRate: number;
  averageResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  activeConnections: number;
  queueLength: number;
}

interface PerformanceMetrics {
  classificationsPerSecond: number;
  peakClassificationsPerMinute: number;
  averageProcessingTime: number;
  cacheEfficiency: number;
  apiResponseTime: number;
}

interface HourlyStats {
  hour: string;
  classifications: number;
  accuracy: number;
  errors: number;
}

export default function ClassificationMonitoringDashboard() {
  const [metrics, setMetrics] = useState<ClassificationMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const simulateRealTimeData = React.useCallback(() => {
    // Simulate real-time classification events
    const updateMetrics = () => {
      const baseMetrics: ClassificationMetrics = {
        totalClassifications: Math.floor(Math.random() * 10000) + 5000,
        accuracyRate: 0.97 + Math.random() * 0.03,
        averageConfidence: 0.85 + Math.random() * 0.15,
        categoriesProcessed: {
          frame: Math.floor(Math.random() * 500) + 200,
          motor: Math.floor(Math.random() * 300) + 150,
          propeller: Math.floor(Math.random() * 400) + 180,
          battery: Math.floor(Math.random() * 250) + 100,
          camera: Math.floor(Math.random() * 200) + 80,
          stack: Math.floor(Math.random() * 150) + 60
        },
        recentActivity: generateRecentActivity(),
        systemHealth: {
          cacheHitRate: 0.75 + Math.random() * 0.2,
          averageResponseTime: 50 + Math.random() * 100,
          errorRate: Math.random() * 0.05,
          memoryUsage: 0.3 + Math.random() * 0.4,
          activeConnections: Math.floor(Math.random() * 50) + 10,
          queueLength: Math.floor(Math.random() * 20)
        },
        performanceMetrics: {
          classificationsPerSecond: Math.random() * 10 + 2,
          peakClassificationsPerMinute: Math.floor(Math.random() * 300) + 100,
          averageProcessingTime: 80 + Math.random() * 40,
          cacheEfficiency: 0.8 + Math.random() * 0.2,
          apiResponseTime: 40 + Math.random() * 30
        },
        hourlyStats: generateHourlyStats()
      };
      
      setMetrics(baseMetrics);
    };

    updateMetrics();
    const updateInterval = setInterval(updateMetrics, 2000); // Update every 2 seconds
    return updateInterval;
  }, []);

  useEffect(() => {
    let updateInterval: NodeJS.Timeout | null = null;

    const connectWebSocket = () => {
      try {
        // In production, this would connect to a WebSocket server
        // For now, we'll simulate real-time updates
        setIsConnected(true);
        updateInterval = simulateRealTimeData();
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        setIsConnected(false);
      }
    };

    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/classification/analytics?timeRange=${selectedTimeRange}`);
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    if (autoRefresh) {
      // WebSocket connection for real-time updates
      connectWebSocket();
      
      // Fallback polling every 5 seconds
      intervalRef.current = setInterval(fetchMetrics, 5000);
    }

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, selectedTimeRange, simulateRealTimeData]);

  const generateRecentActivity = (): ActivityEntry[] => {
    const activities: ActivityEntry[] = [];
    const categories = ['frame', 'motor', 'propeller', 'battery', 'camera', 'stack'];
    const sources: ('scraper' | 'manual' | 'api')[] = ['scraper', 'manual', 'api'];
    const statuses: ('success' | 'warning' | 'error')[] = ['success', 'success', 'success', 'warning', 'error'];
    
    for (let i = 0; i < 10; i++) {
      activities.push({
        id: `activity-${Date.now()}-${i}`,
        timestamp: new Date(Date.now() - Math.random() * 300000), // Within last 5 minutes
        productName: `Product ${Math.floor(Math.random() * 1000)}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        confidence: 0.6 + Math.random() * 0.4,
        processingTime: 50 + Math.random() * 200,
        source: sources[Math.floor(Math.random() * sources.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)]
      });
    }
    
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const generateHourlyStats = (): HourlyStats[] => {
    const stats: HourlyStats[] = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 3600000);
      stats.push({
        hour: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        classifications: Math.floor(Math.random() * 200) + 50,
        accuracy: 0.9 + Math.random() * 0.1,
        errors: Math.floor(Math.random() * 5)
      });
    }
    
    return stats;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading real-time metrics...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Classification Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Live monitoring of AI classification system performance
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-1 border rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              autoRefresh 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Classifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {metrics.totalClassifications.toLocaleString()}
            </div>
            <p className="text-sm text-green-600 mt-1">
              +{Math.floor(Math.random() * 50) + 10} in last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Accuracy Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {(metrics.accuracyRate * 100).toFixed(1)}%
            </div>
            <p className="text-sm text-green-600 mt-1">
              Above target (95%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Avg Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {(metrics.averageConfidence * 100).toFixed(1)}%
            </div>
            <p className="text-sm text-blue-600 mt-1">
              High confidence level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {metrics.systemHealth.averageResponseTime.toFixed(0)}ms
            </div>
            <p className={`text-sm mt-1 ${getHealthStatus(200 - metrics.systemHealth.averageResponseTime, { good: 100, warning: 50 })}`}>
              {metrics.systemHealth.averageResponseTime < 100 ? 'Excellent' : 
               metrics.systemHealth.averageResponseTime < 200 ? 'Good' : 'Needs attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Cache Hit Rate</div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  {(metrics.systemHealth.cacheHitRate * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Error Rate</div>
                <div className={`text-xl font-semibold ${getHealthStatus(5 - metrics.systemHealth.errorRate * 100, { good: 4, warning: 2 })}`}>
                  {(metrics.systemHealth.errorRate * 100).toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</div>
                <div className={`text-xl font-semibold ${getHealthStatus(100 - metrics.systemHealth.memoryUsage * 100, { good: 30, warning: 20 })}`}>
                  {(metrics.systemHealth.memoryUsage * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Queue Length</div>
                <div className={`text-xl font-semibold ${getHealthStatus(50 - metrics.systemHealth.queueLength, { good: 40, warning: 30 })}`}>
                  {metrics.systemHealth.queueLength}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.categoriesProcessed).map(([category, count]) => {
                const total = Object.values(metrics.categoriesProcessed).reduce((a, b) => a + b, 0);
                const percentage = (count / total) * 100;
                return (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary" className="capitalize">
                        {category}
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {count} items
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Classification Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {activity.productName}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {activity.category} • {activity.source} • {activity.confidence.toFixed(0)}% confidence
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {activity.timestamp.toLocaleTimeString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {activity.processingTime}ms
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>24-Hour Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">Performance Chart</div>
              <div className="text-sm">
                Shows classifications per hour, accuracy trends, and error rates
              </div>
              <div className="text-xs mt-2 opacity-75">
                Chart visualization would be implemented with a charting library like Chart.js or D3
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}