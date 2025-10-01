'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database,
  Globe,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Settings,
  ArrowUpDown,
  Download,
  Upload,
  Clock,
  Activity,
  ExternalLink,
  Zap,
  Shield,
  Key
} from 'lucide-react';
import { cacheService } from '@/lib/simple-cache';

interface APIEndpoint {
  id: string;
  name: string;
  url: string;
  provider: string;
  type: 'rest' | 'graphql' | 'websocket';
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync: Date;
  dataTypes: string[];
  authentication: 'none' | 'api-key' | 'oauth' | 'bearer';
  rateLimit: {
    requests: number;
    period: string;
    remaining: number;
  };
  latency: number; // ms
  uptime: number; // percentage
}

interface SyncOperation {
  id: string;
  type: 'import' | 'export' | 'sync';
  source: string;
  target: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  itemsTotal: number;
  itemsProcessed: number;
  startTime: Date;
  endTime?: Date;
  errors: string[];
  dataType: string;
}

interface DataSource {
  id: string;
  name: string;
  type: 'vendor' | 'community' | 'manufacturer' | 'custom';
  description: string;
  endpoints: string[];
  capabilities: string[];
  lastUpdated: Date;
  recordCount: number;
  healthScore: number; // 0-100
}

interface APIIntegrationProps {
  onDataSync?: (data: Record<string, unknown>) => void;
}

export default function APIIntegrationDataSync({ }: APIIntegrationProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints' | 'sync' | 'sources' | 'settings'>('overview');
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [operations, setOperations] = useState<SyncOperation[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isConnected] = useState(true);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const loadAPIData = async () => {
      setLoading(true);
      try {
        // Check cache first
        const cachedData = cacheService.get<{endpoints: APIEndpoint[], operations: SyncOperation[], dataSources: DataSource[]}>('api_integration_data');
        
        if (!cachedData) {
          // Generate mock data
          const mockData = await generateMockAPIData();
          cacheService.set('api_integration_data', mockData, 1800); // 30 min cache
          
          setEndpoints(mockData.endpoints);
          setOperations(mockData.operations);
          setDataSources(mockData.dataSources);
        } else {
          setEndpoints(cachedData.endpoints);
          setOperations(cachedData.operations);
          setDataSources(cachedData.dataSources);
        }
      } catch (error) {
        console.error('Error loading API data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAPIData();
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      updateEndpointStatus();
      updateSyncOperations();
    }, 5000);

    return () => clearInterval(interval);
  }, []);



  const generateMockAPIData = async () => {
    const now = new Date();
    
    return {
      endpoints: [
        {
          id: 'getfpv-api',
          name: 'GetFPV Products API',
          url: 'https://api.getfpv.com/v1',
          provider: 'GetFPV',
          type: 'rest' as const,
          status: 'connected' as const,
          lastSync: new Date(now.getTime() - 3600000),
          dataTypes: ['motors', 'frames', 'batteries', 'props'],
          authentication: 'api-key' as const,
          rateLimit: { requests: 1000, period: 'hour', remaining: 847 },
          latency: 145,
          uptime: 99.8
        },
        {
          id: 'racedayquads-api',
          name: 'RaceDayQuads API',
          url: 'https://api.racedayquads.com/v2',
          provider: 'RaceDayQuads',
          type: 'rest' as const,
          status: 'connected' as const,
          lastSync: new Date(now.getTime() - 1800000),
          dataTypes: ['motors', 'stacks', 'cameras', 'batteries'],
          authentication: 'oauth' as const,
          rateLimit: { requests: 500, period: 'hour', remaining: 423 },
          latency: 98,
          uptime: 99.9
        },
        {
          id: 'banggood-scraper',
          name: 'Banggood Scraper',
          url: 'https://scraper.internal/banggood',
          provider: 'Internal',
          type: 'rest' as const,
          status: 'syncing' as const,
          lastSync: new Date(now.getTime() - 900000),
          dataTypes: ['all-components'],
          authentication: 'bearer' as const,
          rateLimit: { requests: 200, period: 'hour', remaining: 156 },
          latency: 2340,
          uptime: 97.2
        },
        {
          id: 'community-builds',
          name: 'Community Builds WebSocket',
          url: 'wss://community.dronebuilder.io/ws',
          provider: 'Community',
          type: 'websocket' as const,
          status: 'connected' as const,
          lastSync: new Date(now.getTime() - 30000),
          dataTypes: ['builds', 'reviews', 'performance'],
          authentication: 'bearer' as const,
          rateLimit: { requests: 10000, period: 'hour', remaining: 9876 },
          latency: 23,
          uptime: 99.95
        }
      ],
      operations: [
        {
          id: 'sync-motors-getfpv',
          type: 'sync' as const,
          source: 'GetFPV API',
          target: 'Local Database',
          status: 'completed' as const,
          progress: 100,
          itemsTotal: 1247,
          itemsProcessed: 1247,
          startTime: new Date(now.getTime() - 4200000),
          endTime: new Date(now.getTime() - 3900000),
          errors: [],
          dataType: 'Motors'
        },
        {
          id: 'import-community-builds',
          type: 'import' as const,
          source: 'Community API',
          target: 'Local Cache',
          status: 'running' as const,
          progress: 67,
          itemsTotal: 2156,
          itemsProcessed: 1444,
          startTime: new Date(now.getTime() - 600000),
          errors: ['Rate limit exceeded for endpoint /builds/popular'],
          dataType: 'Builds'
        },
        {
          id: 'export-user-builds',
          type: 'export' as const,
          source: 'User Builds',
          target: 'Community API',
          status: 'pending' as const,
          progress: 0,
          itemsTotal: 15,
          itemsProcessed: 0,
          startTime: new Date(),
          errors: [],
          dataType: 'User Builds'
        }
      ],
      dataSources: [
        {
          id: 'vendor-apis',
          name: 'Vendor Product APIs',
          type: 'vendor' as const,
          description: 'Real-time product data from major FPV retailers',
          endpoints: ['getfpv-api', 'racedayquads-api'],
          capabilities: ['pricing', 'inventory', 'specifications', 'reviews'],
          lastUpdated: new Date(now.getTime() - 3600000),
          recordCount: 12847,
          healthScore: 94
        },
        {
          id: 'community-data',
          name: 'Community Contributions',
          type: 'community' as const,
          description: 'User-generated builds, reviews, and performance data',
          endpoints: ['community-builds'],
          capabilities: ['builds', 'reviews', 'ratings', 'discussions'],
          lastUpdated: new Date(now.getTime() - 30000),
          recordCount: 45632,
          healthScore: 98
        },
        {
          id: 'manufacturer-specs',
          name: 'Manufacturer Specifications',
          type: 'manufacturer' as const,
          description: 'Official technical specifications and documentation',
          endpoints: [],
          capabilities: ['specifications', 'manuals', 'compatibility'],
          lastUpdated: new Date(now.getTime() - 86400000),
          recordCount: 5643,
          healthScore: 87
        }
      ]
    };
  };

  const updateEndpointStatus = () => {
    setEndpoints(prev => prev.map(endpoint => ({
      ...endpoint,
      latency: endpoint.latency + (Math.random() - 0.5) * 50,
      rateLimit: {
        ...endpoint.rateLimit,
        remaining: Math.max(0, endpoint.rateLimit.remaining - Math.floor(Math.random() * 5))
      }
    })));
  };

  const updateSyncOperations = () => {
    setOperations(prev => prev.map(op => {
      if (op.status === 'running' && op.progress < 100) {
        const increment = Math.floor(Math.random() * 10) + 1;
        const newProgress = Math.min(100, op.progress + increment);
        const newProcessed = Math.floor((newProgress / 100) * op.itemsTotal);
        
        return {
          ...op,
          progress: newProgress,
          itemsProcessed: newProcessed,
          status: newProgress === 100 ? 'completed' as const : 'running' as const,
          endTime: newProgress === 100 ? new Date() : undefined
        };
      }
      return op;
    }));
  };

  const syncEndpoint = async (endpointId: string) => {
    const endpoint = endpoints.find(e => e.id === endpointId);
    if (!endpoint) return;

    // Update endpoint status
    setEndpoints(prev => prev.map(e => 
      e.id === endpointId ? { ...e, status: 'syncing' } : e
    ));

    // Create new sync operation
    const newOperation: SyncOperation = {
      id: `sync-${endpointId}-${Date.now()}`,
      type: 'sync',
      source: endpoint.name,
      target: 'Local Database',
      status: 'running',
      progress: 0,
      itemsTotal: Math.floor(Math.random() * 1000) + 500,
      itemsProcessed: 0,
      startTime: new Date(),
      errors: [],
      dataType: endpoint.dataTypes.join(', ')
    };

    setOperations(prev => [newOperation, ...prev]);

    // Simulate sync completion after delay
    setTimeout(() => {
      setEndpoints(prev => prev.map(e => 
        e.id === endpointId ? { 
          ...e, 
          status: 'connected', 
          lastSync: new Date() 
        } : e
      ));
    }, 5000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'syncing': return 'text-blue-600 bg-blue-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'disconnected': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'syncing': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      case 'disconnected': return <WifiOff className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">API Integration & Data Sync</h1>
            <p className="opacity-90 mt-1">Real-time synchronization with vendors, community, and manufacturers</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{endpoints.filter(e => e.status === 'connected').length}</div>
              <div className="text-sm opacity-80">Connected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{operations.filter(o => o.status === 'running').length}</div>
              <div className="text-sm opacity-80">Syncing</div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-5 h-5 text-green-300" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-300" />
              )}
              <span className="text-sm">{isConnected ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', name: 'System Overview', icon: <Activity className="w-4 h-4" /> },
            { id: 'endpoints', name: 'API Endpoints', icon: <Globe className="w-4 h-4" /> },
            { id: 'sync', name: 'Sync Operations', icon: <ArrowUpDown className="w-4 h-4" /> },
            { id: 'sources', name: 'Data Sources', icon: <Database className="w-4 h-4" /> },
            { id: 'settings', name: 'Integration Settings', icon: <Settings className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* System Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-green-900">System Health</h3>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-green-900 mb-2">98.2%</div>
                  <p className="text-green-700 text-sm">All systems operational</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-blue-900">Data Freshness</h3>
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-blue-900 mb-2">12min</div>
                  <p className="text-blue-700 text-sm">Average sync delay</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-purple-900">API Calls</h3>
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-3xl font-bold text-purple-900 mb-2">15.2K</div>
                  <p className="text-purple-700 text-sm">Last 24 hours</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sync Activity</h3>
                  <div className="space-y-3">
                    {operations.slice(0, 5).map((operation) => (
                      <div key={operation.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className={`p-2 rounded-full ${
                          operation.status === 'completed' ? 'bg-green-100 text-green-600' :
                          operation.status === 'running' ? 'bg-blue-100 text-blue-600' :
                          operation.status === 'failed' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {operation.type === 'sync' && <ArrowUpDown className="w-4 h-4" />}
                          {operation.type === 'import' && <Download className="w-4 h-4" />}
                          {operation.type === 'export' && <Upload className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {operation.source} → {operation.target}
                          </div>
                          <div className="text-sm text-gray-500">
                            {operation.itemsProcessed}/{operation.itemsTotal} items • {operation.dataType}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{operation.progress}%</div>
                          <div className="text-xs text-gray-500 capitalize">{operation.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Endpoint Status</h3>
                  <div className="space-y-3">
                    {endpoints.map((endpoint) => (
                      <div key={endpoint.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(endpoint.status)}`}>
                            {getStatusIcon(endpoint.status)}
                            {endpoint.status}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{endpoint.name}</div>
                            <div className="text-sm text-gray-500">{endpoint.provider}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-900">{endpoint.latency}ms</div>
                          <div className="text-xs text-gray-500">{endpoint.uptime}% uptime</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API Endpoints */}
          {activeTab === 'endpoints' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Connected API Endpoints</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Add Endpoint
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {endpoints.map((endpoint) => (
                  <div key={endpoint.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(endpoint.status)}`}>
                          {getStatusIcon(endpoint.status)}
                          {endpoint.status}
                        </div>
                        <h4 className="font-semibold text-gray-900">{endpoint.name}</h4>
                      </div>
                      <button
                        onClick={() => syncEndpoint(endpoint.id)}
                        disabled={endpoint.status === 'syncing'}
                        className="text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RefreshCw className={`w-4 h-4 ${endpoint.status === 'syncing' ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Provider:</span>
                        <span className="font-medium">{endpoint.provider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium uppercase">{endpoint.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Latency:</span>
                        <span className="font-medium">{endpoint.latency}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rate Limit:</span>
                        <span className="font-medium">{endpoint.rateLimit.remaining}/{endpoint.rateLimit.requests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Sync:</span>
                        <span className="font-medium">{endpoint.lastSync.toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-600 mb-2">Data Types:</div>
                      <div className="flex gap-1 flex-wrap">
                        {endpoint.dataTypes.map((type, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sync Operations */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Synchronization Operations</h3>
                <div className="flex gap-2">
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Import Data
                  </button>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Export Data
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {operations.map((operation) => (
                  <div key={operation.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          operation.status === 'completed' ? 'bg-green-100 text-green-600' :
                          operation.status === 'running' ? 'bg-blue-100 text-blue-600' :
                          operation.status === 'failed' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {operation.type === 'sync' && <ArrowUpDown className="w-5 h-5" />}
                          {operation.type === 'import' && <Download className="w-5 h-5" />}
                          {operation.type === 'export' && <Upload className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {operation.source} → {operation.target}
                          </h4>
                          <p className="text-sm text-gray-600">{operation.dataType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                          operation.status === 'completed' ? 'bg-green-100 text-green-700' :
                          operation.status === 'running' ? 'bg-blue-100 text-blue-700' :
                          operation.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {operation.status}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress: {operation.itemsProcessed}/{operation.itemsTotal} items</span>
                        <span>{operation.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            operation.status === 'completed' ? 'bg-green-600' :
                            operation.status === 'running' ? 'bg-blue-600' :
                            operation.status === 'failed' ? 'bg-red-600' :
                            'bg-gray-400'
                          }`}
                          style={{ width: `${operation.progress}%` }}
                        ></div>
                      </div>

                      {operation.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-red-700 text-sm font-medium mb-2">
                            <AlertCircle className="w-4 h-4" />
                            Errors ({operation.errors.length})
                          </div>
                          <div className="space-y-1">
                            {operation.errors.map((error, index) => (
                              <p key={index} className="text-red-600 text-xs">{error}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Started: {operation.startTime.toLocaleString()}</span>
                        {operation.endTime && (
                          <span>Completed: {operation.endTime.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Sources */}
          {activeTab === 'sources' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Data Sources</h3>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Add Source
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {dataSources.map((source) => (
                  <div key={source.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">{source.name}</h4>
                      <div className="flex items-center gap-1 text-sm">
                        <div className={`w-2 h-2 rounded-full ${source.healthScore > 90 ? 'bg-green-500' : source.healthScore > 70 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                        <span className="text-gray-600">{source.healthScore}%</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{source.description}</p>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium capitalize">{source.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Records:</span>
                        <span className="font-medium">{source.recordCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium">{source.lastUpdated.toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-600 mb-2">Capabilities:</div>
                      <div className="flex gap-1 flex-wrap">
                        {source.capabilities.map((capability, index) => (
                          <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                            {capability}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Integration Settings</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Security Settings
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">API Key Encryption</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                          <option>AES-256 (Recommended)</option>
                          <option>AES-128</option>
                          <option>RSA-2048</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="secure-storage" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                        <label htmlFor="secure-storage" className="text-sm text-gray-700">Enable secure credential storage</label>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="ssl-only" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                        <label htmlFor="ssl-only" className="text-sm text-gray-700">Require SSL/TLS for all connections</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Sync Scheduling
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Auto-sync Interval</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                          <option>Every 15 minutes</option>
                          <option>Every 30 minutes</option>
                          <option>Every hour</option>
                          <option>Every 6 hours</option>
                          <option>Daily</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="auto-retry" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                        <label htmlFor="auto-retry" className="text-sm text-gray-700">Auto-retry failed operations</label>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id="priority-sync" className="w-4 h-4 text-blue-600 rounded" />
                        <label htmlFor="priority-sync" className="text-sm text-gray-700">Priority sync for price changes</label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      API Credentials
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">GetFPV API Key</label>
                        <div className="flex gap-2">
                          <input 
                            type="password" 
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="••••••••••••••••"
                          />
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Test
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">RaceDayQuads OAuth</label>
                        <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          Connected - Refresh Token
                        </button>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Community API Token</label>
                        <div className="flex gap-2">
                          <input 
                            type="password" 
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="••••••••••••••••"
                          />
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Test
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Data Management
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cache Retention</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                          <option>1 hour</option>
                          <option>6 hours</option>
                          <option>24 hours</option>
                          <option>7 days</option>
                          <option>30 days</option>
                        </select>
                      </div>
                      
                      <div className="flex gap-3">
                        <button className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                          Clear Cache
                        </button>
                        <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Export Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}