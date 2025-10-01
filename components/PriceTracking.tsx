'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Bell,
  BellOff,
  DollarSign,
  Target,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { cacheService } from '@/lib/simple-cache';

interface PricePoint {
  date: string;
  price: number;
  vendor: string;
  inStock: boolean;
  shipping?: number;
  condition: 'new' | 'used' | 'refurbished';
}

interface PriceAlert {
  id: string;
  componentId: string;
  componentName: string;
  targetPrice: number;
  currentPrice: number;
  alertType: 'below' | 'above' | 'change' | 'stock' | 'deal';
  isActive: boolean;
  createdAt: string;
  lastTriggered?: string;
  vendor?: string;
  notificationMethods: ('email' | 'push' | 'sms')[];
  conditions: {
    maxShipping?: number;
    preferredVendors?: string[];
    condition?: ('new' | 'used' | 'refurbished')[];
    minRating?: number;
  };
}

interface PriceHistory {
  componentId: string;
  componentName: string;
  category: string;
  brand: string;
  currentPrice: number;
  priceHistory: PricePoint[];
  vendors: Array<{
    name: string;
    price: number;
    inStock: boolean;
    rating: number;
    shipping: number;
    url: string;
    condition: 'new' | 'used' | 'refurbished';
    lastUpdated: string;
  }>;
  priceAnalysis: {
    lowestPrice: number;
    highestPrice: number;
    averagePrice: number;
    priceChange24h: number;
    priceChange7d: number;
    priceChange30d: number;
    trend: 'up' | 'down' | 'stable';
    dealScore: number;
    recommendation: 'buy' | 'wait' | 'watch';
  };
  predictions: {
    predictedPrice7d: number;
    predictedPrice30d: number;
    confidence: number;
    factors: string[];
  };
}

interface PriceTrackingProps {
  componentId?: string;
  showCompact?: boolean;
  onAlertCreate?: (alert: PriceAlert) => void;
}

export default function PriceTracking({ componentId, showCompact = false, onAlertCreate }: PriceTrackingProps) {
  const [priceData, setPriceData] = useState<PriceHistory[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<PriceHistory | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'deals' | 'analysis'>('overview');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d' | '1y'>('30d');

  const [alertForm, setAlertForm] = useState({
    componentId: '',
    targetPrice: 0,
    alertType: 'below' as PriceAlert['alertType'],
    notificationMethods: ['push'] as ('email' | 'push' | 'sms')[],
    conditions: {
      maxShipping: 0,
      preferredVendors: [] as string[],
      condition: ['new'] as ('new' | 'used' | 'refurbished')[],
      minRating: 4.0
    }
  });

  useEffect(() => {
    loadPriceData();
    loadAlerts();
    
    // Set up real-time price updates
    const interval = setInterval(() => {
      updatePrices();
    }, 300000); // Update every 5 minutes
    
    return () => clearInterval(interval);
  }, [componentId, timeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPriceData = async () => {
    setLoading(true);
    try {
      const cacheKey = `price_data:${componentId || 'all'}:${timeRange}`;
      let data = cacheService.get<PriceHistory[]>(cacheKey);
      
      if (!data) {
        data = await generateMockPriceData();
        cacheService.set(cacheKey, data, 300); // Cache for 5 minutes
      }
      
      setPriceData(data);
      if (!selectedComponent && data.length > 0) {
        setSelectedComponent(data[0]);
      }
    } catch (error) {
      console.error('Failed to load price data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = () => {
    const savedAlerts = cacheService.get<PriceAlert[]>('price_alerts') || [];
    setAlerts(savedAlerts);
  };

  const generateMockPriceData = async (): Promise<PriceHistory[]> => {
    const mockData: PriceHistory[] = [
      {
        componentId: 'motor-rs2205',
        componentName: 'EMAX RS2205 2300KV Motor',
        category: 'Motors',
        brand: 'EMAX',
        currentPrice: 89.99,
        priceHistory: generatePriceHistory(89.99, 30),
        vendors: [
          {
            name: 'GetFPV',
            price: 89.99,
            inStock: true,
            rating: 4.8,
            shipping: 9.99,
            url: 'https://getfpv.com',
            condition: 'new',
            lastUpdated: new Date().toISOString()
          },
          {
            name: 'RaceDayQuads',
            price: 92.50,
            inStock: true,
            rating: 4.7,
            shipping: 7.99,
            url: 'https://racedayquads.com',
            condition: 'new',
            lastUpdated: new Date().toISOString()
          },
          {
            name: 'Amazon',
            price: 95.99,
            inStock: true,
            rating: 4.5,
            shipping: 0,
            url: 'https://amazon.com',
            condition: 'new',
            lastUpdated: new Date().toISOString()
          }
        ],
        priceAnalysis: {
          lowestPrice: 85.99,
          highestPrice: 104.99,
          averagePrice: 92.45,
          priceChange24h: -2.50,
          priceChange7d: -5.00,
          priceChange30d: -8.50,
          trend: 'down',
          dealScore: 85,
          recommendation: 'buy'
        },
        predictions: {
          predictedPrice7d: 87.99,
          predictedPrice30d: 85.50,
          confidence: 78,
          factors: ['Seasonal demand decrease', 'New model release', 'Vendor competition']
        }
      },
      {
        componentId: 'frame-chameleon',
        componentName: 'Armattan Chameleon 5" Frame',
        category: 'Frames',
        brand: 'Armattan',
        currentPrice: 49.99,
        priceHistory: generatePriceHistory(49.99, 30),
        vendors: [
          {
            name: 'Armattan',
            price: 49.99,
            inStock: true,
            rating: 5.0,
            shipping: 12.99,
            url: 'https://armattanproductions.com',
            condition: 'new',
            lastUpdated: new Date().toISOString()
          },
          {
            name: 'PyrodroneFPV',
            price: 52.99,
            inStock: false,
            rating: 4.6,
            shipping: 8.99,
            url: 'https://pyrodronefpv.com',
            condition: 'new',
            lastUpdated: new Date().toISOString()
          }
        ],
        priceAnalysis: {
          lowestPrice: 45.99,
          highestPrice: 59.99,
          averagePrice: 51.20,
          priceChange24h: 0,
          priceChange7d: -2.00,
          priceChange30d: -4.00,
          trend: 'stable',
          dealScore: 72,
          recommendation: 'watch'
        },
        predictions: {
          predictedPrice7d: 49.99,
          predictedPrice30d: 47.99,
          confidence: 65,
          factors: ['Stable demand', 'Limited vendor availability']
        }
      },
      {
        componentId: 'battery-tattu',
        componentName: 'Tattu 1550mAh 4S LiPo',
        category: 'Batteries',
        brand: 'Tattu',
        currentPrice: 28.99,
        priceHistory: generatePriceHistory(28.99, 30),
        vendors: [
          {
            name: 'Tattu Official',
            price: 28.99,
            inStock: true,
            rating: 4.9,
            shipping: 15.99,
            url: 'https://genstattu.com',
            condition: 'new',
            lastUpdated: new Date().toISOString()
          },
          {
            name: 'Battery Mart',
            price: 31.50,
            inStock: true,
            rating: 4.4,
            shipping: 9.99,
            url: 'https://batterymart.com',
            condition: 'new',
            lastUpdated: new Date().toISOString()
          }
        ],
        priceAnalysis: {
          lowestPrice: 26.99,
          highestPrice: 35.99,
          averagePrice: 30.75,
          priceChange24h: +1.00,
          priceChange7d: +3.00,
          priceChange30d: +2.00,
          trend: 'up',
          dealScore: 68,
          recommendation: 'wait'
        },
        predictions: {
          predictedPrice7d: 30.99,
          predictedPrice30d: 32.50,
          confidence: 72,
          factors: ['Shipping cost increases', 'Supply chain issues']
        }
      }
    ];
    
    return mockData;
  };

  const generatePriceHistory = (currentPrice: number, days: number): PricePoint[] => {
    const history: PricePoint[] = [];
    const vendors = ['GetFPV', 'RaceDayQuads', 'Amazon', 'PyrodroneFPV'];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate realistic price fluctuations
      const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
      const price = currentPrice * (1 + variation * Math.sin(i / 7)); // Weekly cycle
      
      history.push({
        date: date.toISOString(),
        price: Math.max(price * 0.8, Math.min(price, price * 1.2)),
        vendor: vendors[Math.floor(Math.random() * vendors.length)],
        inStock: Math.random() > 0.1,
        shipping: Math.random() * 15,
        condition: Math.random() > 0.8 ? 'used' : 'new'
      });
    }
    
    return history;
  };

  const updatePrices = async () => {
    // Simulate real-time price updates
    setPriceData(prev => prev.map(component => ({
      ...component,
      currentPrice: component.currentPrice * (1 + (Math.random() - 0.5) * 0.02), // ±1% change
      vendors: component.vendors.map(vendor => ({
        ...vendor,
        price: vendor.price * (1 + (Math.random() - 0.5) * 0.02),
        lastUpdated: new Date().toISOString()
      }))
    })));
  };

  const createAlert = () => {
    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}`,
      componentId: alertForm.componentId,
      componentName: selectedComponent?.componentName || '',
      targetPrice: alertForm.targetPrice,
      currentPrice: selectedComponent?.currentPrice || 0,
      alertType: alertForm.alertType,
      isActive: true,
      createdAt: new Date().toISOString(),
      notificationMethods: alertForm.notificationMethods,
      conditions: alertForm.conditions
    };
    
    const updatedAlerts = [...alerts, newAlert];
    setAlerts(updatedAlerts);
    cacheService.set('price_alerts', updatedAlerts, 86400); // Cache for 24 hours
    
    setShowAlertModal(false);
    onAlertCreate?.(newAlert);
  };

  const toggleAlert = (alertId: string) => {
    const updatedAlerts = alerts.map(alert =>
      alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert
    );
    setAlerts(updatedAlerts);
    cacheService.set('price_alerts', updatedAlerts, 86400);
  };

  const deleteAlert = (alertId: string) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
    setAlerts(updatedAlerts);
    cacheService.set('price_alerts', updatedAlerts, 86400);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatPriceChange = (change: number) => {
    const isPositive = change > 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        <span>{formatPrice(Math.abs(change))}</span>
        <span className="text-xs">
          ({isPositive ? '+' : ''}{((change / (selectedComponent?.currentPrice || 1)) * 100).toFixed(1)}%)
        </span>
      </div>
    );
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'buy': return 'bg-green-100 text-green-700';
      case 'wait': return 'bg-yellow-100 text-yellow-700';
      case 'watch': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDealScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading price data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (showCompact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Price Tracking</h3>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${getRecommendationColor(selectedComponent?.priceAnalysis.recommendation || 'watch')}`}>
              {selectedComponent?.priceAnalysis.recommendation?.toUpperCase()}
            </span>
          </div>
        </div>
        
        {selectedComponent && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(selectedComponent.currentPrice)}
              </span>
              {formatPriceChange(selectedComponent.priceAnalysis.priceChange24h)}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Lowest:</span>
                <span className="ml-2 font-medium">{formatPrice(selectedComponent.priceAnalysis.lowestPrice)}</span>
              </div>
              <div>
                <span className="text-gray-600">Average:</span>
                <span className="ml-2 font-medium">{formatPrice(selectedComponent.priceAnalysis.averagePrice)}</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowAlertModal(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Set Price Alert
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Price Tracking & Alerts</h1>
            <p className="opacity-90">Monitor prices, set alerts, and never miss a deal</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-4 h-4" />
              <span className="text-sm font-medium">Active Alerts</span>
            </div>
            <span className="text-2xl font-bold">{alerts.filter(a => a.isActive).length}</span>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Tracked Items</span>
            </div>
            <span className="text-2xl font-bold">{priceData.length}</span>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-medium">Deals Found</span>
            </div>
            <span className="text-2xl font-bold">
              {priceData.filter(p => p.priceAnalysis.dealScore >= 80).length}
            </span>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Avg Savings</span>
            </div>
            <span className="text-2xl font-bold">12.3%</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <div className="flex space-x-8">
              {['overview', 'alerts', 'deals', 'analysis'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={`py-2 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as typeof timeRange)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
                <option value="90d">90 Days</option>
                <option value="1y">1 Year</option>
              </select>
              
              <button
                onClick={() => setShowAlertModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                New Alert
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Component List */}
              <div className="lg:col-span-1">
                <h3 className="font-semibold text-gray-900 mb-4">Tracked Components</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {priceData.map((component) => (
                    <div
                      key={component.componentId}
                      onClick={() => setSelectedComponent(component)}
                      className={`p-4 rounded-lg cursor-pointer transition-colors ${
                        selectedComponent?.componentId === component.componentId
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                      } border`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 text-sm">
                          {component.componentName}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRecommendationColor(component.priceAnalysis.recommendation)}`}>
                          {component.priceAnalysis.recommendation.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">
                          {formatPrice(component.currentPrice)}
                        </span>
                        <div className={`text-sm ${component.priceAnalysis.priceChange24h < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {component.priceAnalysis.priceChange24h < 0 ? '↓' : '↑'}
                          {formatPrice(Math.abs(component.priceAnalysis.priceChange24h))}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-600">
                        Deal Score: <span className={getDealScoreColor(component.priceAnalysis.dealScore)}>
                          {component.priceAnalysis.dealScore}/100
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Component Details */}
              <div className="lg:col-span-2">
                {selectedComponent && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {selectedComponent.componentName}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{selectedComponent.brand}</span>
                        <span>•</span>
                        <span>{selectedComponent.category}</span>
                      </div>
                    </div>

                    {/* Current Price & Analysis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Current Price</h4>
                        <div className="space-y-2">
                          <div className="text-3xl font-bold text-gray-900">
                            {formatPrice(selectedComponent.currentPrice)}
                          </div>
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-sm text-gray-600">24h: </span>
                              {formatPriceChange(selectedComponent.priceAnalysis.priceChange24h)}
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">7d: </span>
                              {formatPriceChange(selectedComponent.priceAnalysis.priceChange7d)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Price Analysis</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Lowest:</span>
                            <span className="font-medium">{formatPrice(selectedComponent.priceAnalysis.lowestPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Average:</span>
                            <span className="font-medium">{formatPrice(selectedComponent.priceAnalysis.averagePrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Highest:</span>
                            <span className="font-medium">{formatPrice(selectedComponent.priceAnalysis.highestPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Deal Score:</span>
                            <span className={`font-bold ${getDealScoreColor(selectedComponent.priceAnalysis.dealScore)}`}>
                              {selectedComponent.priceAnalysis.dealScore}/100
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vendors */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Available Vendors</h4>
                      <div className="space-y-3">
                        {selectedComponent.vendors.map((vendor, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-4">
                              <div>
                                <div className="font-medium text-gray-900">{vendor.name}</div>
                                <div className="text-sm text-gray-600">
                                  Rating: {vendor.rating}/5 • {vendor.condition} • 
                                  Shipping: {formatPrice(vendor.shipping)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">
                                  {formatPrice(vendor.price)}
                                </div>
                                <div className={`text-sm ${vendor.inStock ? 'text-green-600' : 'text-red-600'}`}>
                                  {vendor.inStock ? 'In Stock' : 'Out of Stock'}
                                </div>
                              </div>
                              
                              <button
                                onClick={() => window.open(vendor.url, '_blank')}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price Predictions */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Price Predictions</h4>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-sm text-gray-600">7 days:</span>
                          <div className="text-lg font-bold text-blue-600">
                            {formatPrice(selectedComponent.predictions.predictedPrice7d)}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">30 days:</span>
                          <div className="text-lg font-bold text-blue-600">
                            {formatPrice(selectedComponent.predictions.predictedPrice30d)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        <span>Confidence: {selectedComponent.predictions.confidence}%</span>
                        <div className="mt-1">
                          Factors: {selectedComponent.predictions.factors.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Price Alerts</h3>
                <span className="text-sm text-gray-600">
                  {alerts.filter(a => a.isActive).length} of {alerts.length} active
                </span>
              </div>
              
              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No price alerts set up yet</p>
                  <button
                    onClick={() => setShowAlertModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Alert
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${alert.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {alert.isActive ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        </div>
                        
                        <div>
                          <div className="font-medium text-gray-900">{alert.componentName}</div>
                          <div className="text-sm text-gray-600">
                            Alert when price is {alert.alertType} {formatPrice(alert.targetPrice)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Current: {formatPrice(alert.currentPrice)} • Created {new Date(alert.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAlert(alert.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            alert.isActive
                              ? 'text-green-600 hover:bg-green-100'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {alert.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'deals' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Current Deals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {priceData.filter(p => p.priceAnalysis.dealScore >= 70).map((component) => (
                  <div key={component.componentId} className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getDealScoreColor(component.priceAnalysis.dealScore)} bg-white`}>
                        {component.priceAnalysis.dealScore}% Deal
                      </span>
                      <Star className="w-4 h-4 text-yellow-500" />
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 mb-2">{component.componentName}</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Current:</span>
                        <span className="font-bold text-green-600">{formatPrice(component.currentPrice)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Average:</span>
                        <span className="line-through text-gray-500">{formatPrice(component.priceAnalysis.averagePrice)}</span>
                      </div>
                      
                      <div className="text-center mt-3">
                        <span className="text-lg font-bold text-green-600">
                          Save {formatPrice(component.priceAnalysis.averagePrice - component.currentPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900">Market Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">Trending Up</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {priceData.filter(p => p.priceAnalysis.trend === 'up').length}
                  </div>
                  <div className="text-sm text-gray-600">Components</div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">Trending Down</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {priceData.filter(p => p.priceAnalysis.trend === 'down').length}
                  </div>
                  <div className="text-sm text-gray-600">Components</div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-gray-900">Stable</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {priceData.filter(p => p.priceAnalysis.trend === 'stable').length}
                  </div>
                  <div className="text-sm text-gray-600">Components</div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-900">Best Deals</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {priceData.filter(p => p.priceAnalysis.dealScore >= 80).length}
                  </div>
                  <div className="text-sm text-gray-600">Components</div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Market Insights</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Best Time to Buy</div>
                      <div className="text-gray-600">Motor prices are currently 8.5% below average - great buying opportunity</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Price Alert</div>
                      <div className="text-gray-600">Battery prices showing upward trend - consider buying soon</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">Seasonal Pattern</div>
                      <div className="text-gray-600">Prices typically drop 15% in Q4 due to holiday sales</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create Price Alert</h3>
              <button
                onClick={() => setShowAlertModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Component</label>
                <select
                  value={alertForm.componentId}
                  onChange={(e) => setAlertForm(prev => ({ ...prev, componentId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select a component</option>
                  {priceData.map((component) => (
                    <option key={component.componentId} value={component.componentId}>
                      {component.componentName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alert Type</label>
                <select
                  value={alertForm.alertType}
                  onChange={(e) => setAlertForm(prev => ({ ...prev, alertType: e.target.value as PriceAlert['alertType'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="below">Price drops below</option>
                  <option value="above">Price rises above</option>
                  <option value="change">Any price change</option>
                  <option value="stock">Back in stock</option>
                  <option value="deal">Deal detected</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={alertForm.targetPrice}
                  onChange={(e) => setAlertForm(prev => ({ ...prev, targetPrice: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notifications</label>
                <div className="space-y-2">
                  {['email', 'push', 'sms'].map((method) => (
                    <label key={method} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={alertForm.notificationMethods.includes(method as 'email' | 'push' | 'sms')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAlertForm(prev => ({
                              ...prev,
                              notificationMethods: [...prev.notificationMethods, method as 'email' | 'push' | 'sms']
                            }));
                          } else {
                            setAlertForm(prev => ({
                              ...prev,
                              notificationMethods: prev.notificationMethods.filter(m => m !== method)
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">{method}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAlertModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createAlert}
                disabled={!alertForm.componentId || !alertForm.targetPrice}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}