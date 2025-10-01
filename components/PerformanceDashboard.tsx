'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Monitor, 
  TrendingUp, 
  RefreshCw,
  AlertCircle,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import Badge from './Badge';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  threshold: {
    warning: number;
    critical: number;
  };
  history: Array<{
    timestamp: Date;
    value: number;
  }>;
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  component: string;
  resolved: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface APIEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status: 'online' | 'offline' | 'degraded';
  responseTime: number;
  successRate: number;
  lastChecked: Date;
  errorCount: number;
}

interface UserSession {
  id: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  pageViews: number;
  actions: number;
  device: string;
  browser: string;
  location: string;
  active: boolean;
}

interface PerformanceDashboardProps {
  refreshInterval?: number;
  showAdvanced?: boolean;
  className?: string;
}

export default function PerformanceDashboard({ 
  refreshInterval = 5000,
  showAdvanced = false,
  className = ''
}: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'errors' | 'warnings' | 'info'>('all');

  // Initialize performance monitoring
  useEffect(() => {
    initializeMonitoring();
    const interval = setInterval(() => {
      if (autoRefresh) {
        updateMetrics();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, autoRefresh]);

  const initializeMonitoring = useCallback(async () => {
    setIsLoading(true);
    try {
      // Initialize mock data - in production, this would fetch from monitoring APIs
      const initialMetrics: PerformanceMetric[] = [
        {
          id: 'cpu_usage',
          name: 'CPU Usage',
          value: 45.2,
          unit: '%',
          status: 'healthy',
          trend: 'stable',
          threshold: { warning: 70, critical: 90 },
          history: generateMockHistory(45.2, 100)
        },
        {
          id: 'memory_usage',
          name: 'Memory Usage',
          value: 62.8,
          unit: '%',
          status: 'healthy',
          trend: 'up',
          threshold: { warning: 80, critical: 95 },
          history: generateMockHistory(62.8, 100)
        },
        {
          id: 'disk_usage',
          name: 'Disk Usage',
          value: 34.5,
          unit: '%',
          status: 'healthy',
          trend: 'stable',
          threshold: { warning: 85, critical: 95 },
          history: generateMockHistory(34.5, 100)
        },
        {
          id: 'response_time',
          name: 'Avg Response Time',
          value: 145,
          unit: 'ms',
          status: 'healthy',
          trend: 'down',
          threshold: { warning: 500, critical: 1000 },
          history: generateMockHistory(145, 60)
        },
        {
          id: 'throughput',
          name: 'Requests/sec',
          value: 1250,
          unit: 'req/s',
          status: 'healthy',
          trend: 'up',
          threshold: { warning: 2000, critical: 3000 },
          history: generateMockHistory(1250, 60)
        },
        {
          id: 'error_rate',
          name: 'Error Rate',
          value: 0.3,
          unit: '%',
          status: 'healthy',
          trend: 'stable',
          threshold: { warning: 1, critical: 5 },
          history: generateMockHistory(0.3, 60)
        },
        {
          id: 'active_users',
          name: 'Active Users',
          value: 342,
          unit: 'users',
          status: 'healthy',
          trend: 'up',
          threshold: { warning: 1000, critical: 1500 },
          history: generateMockHistory(342, 60)
        },
        {
          id: 'cache_hit_rate',
          name: 'Cache Hit Rate',
          value: 94.7,
          unit: '%',
          status: 'healthy',
          trend: 'stable',
          threshold: { warning: 80, critical: 60 },
          history: generateMockHistory(94.7, 60)
        }
      ];

      const mockAlerts: SystemAlert[] = [
        {
          id: '1',
          type: 'warning',
          title: 'High Memory Usage Detected',
          message: 'Memory usage has exceeded 80% for the past 5 minutes',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          component: 'Application Server',
          resolved: false,
          severity: 'medium'
        },
        {
          id: '2',
          type: 'info',
          title: 'Cache Performance Optimized',
          message: 'Cache hit rate improved by 15% after recent optimizations',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          component: 'Redis Cache',
          resolved: true,
          severity: 'low'
        },
        {
          id: '3',
          type: 'error',
          title: 'Database Connection Pool Exhausted',
          message: 'All database connections are in use, new requests are queuing',
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
          component: 'Database',
          resolved: false,
          severity: 'high'
        }
      ];

      const mockEndpoints: APIEndpoint[] = [
        {
          id: '1',
          name: 'Parts API',
          url: '/api/parts',
          method: 'GET',
          status: 'online',
          responseTime: 85,
          successRate: 99.8,
          lastChecked: new Date(),
          errorCount: 2
        },
        {
          id: '2',
          name: 'User Authentication',
          url: '/api/auth',
          method: 'POST',
          status: 'online',
          responseTime: 120,
          successRate: 99.9,
          lastChecked: new Date(),
          errorCount: 1
        },
        {
          id: '3',
          name: 'Build Comparison',
          url: '/api/builds/compare',
          method: 'POST',
          status: 'degraded',
          responseTime: 450,
          successRate: 97.2,
          lastChecked: new Date(),
          errorCount: 8
        },
        {
          id: '4',
          name: 'Price Sync',
          url: '/api/prices/sync',
          method: 'GET',
          status: 'online',
          responseTime: 200,
          successRate: 98.5,
          lastChecked: new Date(),
          errorCount: 3
        }
      ];

      const mockSessions: UserSession[] = Array.from({ length: 12 }, (_, i) => ({
        id: `session_${i + 1}`,
        userId: `user_${i + 1}`,
        startTime: new Date(Date.now() - Math.random() * 3600000),
        lastActivity: new Date(Date.now() - Math.random() * 300000),
        pageViews: Math.floor(Math.random() * 20) + 1,
        actions: Math.floor(Math.random() * 50) + 1,
        device: ['Desktop', 'Mobile', 'Tablet'][Math.floor(Math.random() * 3)],
        browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
        location: ['US', 'UK', 'CA', 'AU', 'DE'][Math.floor(Math.random() * 5)],
        active: Math.random() > 0.3
      }));

      setMetrics(initialMetrics);
      setAlerts(mockAlerts);
      setEndpoints(mockEndpoints);
      setSessions(mockSessions);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to initialize monitoring:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateMetrics = useCallback(async () => {
    try {
      // Simulate real-time metric updates
      setMetrics(prevMetrics => 
        prevMetrics.map(metric => ({
          ...metric,
          value: metric.value + (Math.random() - 0.5) * (metric.value * 0.1),
          history: [
            ...metric.history.slice(-59),
            {
              timestamp: new Date(),
              value: metric.value
            }
          ]
        }))
      );
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to update metrics:', error);
    }
  }, []);

  const generateMockHistory = (baseValue: number, points: number) => {
    return Array.from({ length: points }, (_, i) => ({
      timestamp: new Date(Date.now() - (points - i) * 60000),
      value: baseValue + (Math.random() - 0.5) * (baseValue * 0.2)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
      case 'offline':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="w-4 h-4" />;
      case 'critical':
      case 'offline':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (!showResolved && alert.resolved) return false;
      if (filterType === 'all') return true;
      return alert.type === filterType;
    });
  }, [alerts, showResolved, filterType]);

  const systemHealth = useMemo(() => {
    const healthyCount = metrics.filter(m => m.status === 'healthy').length;
    const totalCount = metrics.length;
    const percentage = (healthyCount / totalCount) * 100;
    
    if (percentage >= 90) return { status: 'healthy', label: 'Excellent' };
    if (percentage >= 70) return { status: 'warning', label: 'Good' };
    return { status: 'critical', label: 'Needs Attention' };
  }, [metrics]);

  if (isLoading) {
    return (
      <div className={`bg-gray-50 rounded-lg border border-gray-200 p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-lg font-medium text-gray-600">
            Initializing Performance Dashboard...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Monitor className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Performance Dashboard</h2>
            </div>
            <Badge className={getStatusColor(systemHealth.status)}>
              {getStatusIcon(systemHealth.status)}
              <span className="ml-1">System {systemHealth.label}</span>
            </Badge>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg border ${
                autoRefresh 
                  ? 'bg-blue-50 border-blue-200 text-blue-600' 
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
              title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={updateMetrics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Now
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-8">
        {/* Key Metrics Grid */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric) => (
              <div
                key={metric.id}
                className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedMetric === metric.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedMetric(selectedMetric === metric.id ? null : metric.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">{metric.name}</span>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(metric.trend)}
                    <Badge className={getStatusColor(metric.status)}>
                      {getStatusIcon(metric.status)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-gray-900">
                    {typeof metric.value === 'number' ? metric.value.toFixed(1) : metric.value}
                  </span>
                  <span className="ml-1 text-sm text-gray-500">{metric.unit}</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      metric.status === 'healthy' ? 'bg-green-500' :
                      metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min((metric.value / (metric.threshold.critical * 1.2)) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Endpoints Status */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Endpoints</h3>
          <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-6 gap-4 p-4 bg-gray-100 text-sm font-medium text-gray-600">
              <span>Endpoint</span>
              <span>Method</span>
              <span>Status</span>
              <span>Response Time</span>
              <span>Success Rate</span>
              <span>Errors</span>
            </div>
            {endpoints.map((endpoint) => (
              <div key={endpoint.id} className="grid grid-cols-6 gap-4 p-4 border-t border-gray-200">
                <span className="font-medium text-gray-900">{endpoint.name}</span>
                <Badge className="inline-flex w-fit">
                  {endpoint.method}
                </Badge>
                <Badge className={getStatusColor(endpoint.status)}>
                  {getStatusIcon(endpoint.status)}
                  <span className="ml-1 capitalize">{endpoint.status}</span>
                </Badge>
                <span className="text-gray-600">{endpoint.responseTime}ms</span>
                <span className={`${endpoint.successRate >= 99 ? 'text-green-600' : endpoint.successRate >= 95 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {endpoint.successRate.toFixed(1)}%
                </span>
                <span className={`${endpoint.errorCount === 0 ? 'text-green-600' : endpoint.errorCount < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {endpoint.errorCount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Alerts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowResolved(!showResolved)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  showResolved 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {showResolved ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span className="ml-1">Resolved</span>
              </button>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'errors' | 'warnings' | 'info')}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Types</option>
                <option value="error">Errors</option>
                <option value="warning">Warnings</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>No alerts to display</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.type === 'error' ? 'bg-red-50 border-red-200' :
                    alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  } ${alert.resolved ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`p-1 rounded ${
                        alert.type === 'error' ? 'bg-red-100 text-red-600' :
                        alert.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {getStatusIcon(alert.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Component: {alert.component}</span>
                          <span>Severity: {alert.severity}</span>
                          <span>{alert.timestamp.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {alert.resolved && (
                      <Badge className="bg-green-100 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span className="ml-1">Resolved</span>
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active User Sessions */}
        {showAdvanced && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Active User Sessions ({sessions.filter(s => s.active).length})
            </h3>
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-7 gap-4 p-4 bg-gray-100 text-sm font-medium text-gray-600">
                <span>User ID</span>
                <span>Duration</span>
                <span>Page Views</span>
                <span>Actions</span>
                <span>Device</span>
                <span>Browser</span>
                <span>Location</span>
              </div>
              {sessions.filter(s => s.active).slice(0, 10).map((session) => (
                <div key={session.id} className="grid grid-cols-7 gap-4 p-4 border-t border-gray-200">
                  <span className="font-mono text-sm text-gray-600">{session.userId}</span>
                  <span className="text-gray-600">
                    {Math.floor((Date.now() - session.startTime.getTime()) / 60000)}m
                  </span>
                  <span className="text-gray-600">{session.pageViews}</span>
                  <span className="text-gray-600">{session.actions}</span>
                  <span className="text-gray-600">{session.device}</span>
                  <span className="text-gray-600">{session.browser}</span>
                  <span className="text-gray-600">{session.location}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}