/**
 * Product Resort Panel
 * Admin interface for reclassifying products in the database
 */

'use client';

import { useState } from 'react';
import { Loader2, RefreshCw, BarChart3, Package, AlertTriangle } from 'lucide-react';

interface ResortChange {
  id: string;
  name: string;
  oldCategory: string;
  newCategory: string;
  reason: string;
}

interface ResortResult {
  totalProcessed: number;
  reclassified: number;
  changes: ResortChange[];
}

interface ResortReport {
  categoryDistribution: Record<string, number>;
  brandBreakdown: Record<string, Record<string, number>>;
  potentialMisclassifications: Array<{
    id: string;
    name: string;
    category: string;
    reason: string;
  }>;
}

export default function ProductResortPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResortResult | null>(null);
  const [report, setReport] = useState<ResortReport | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const categories = ['motor', 'prop', 'battery', 'stack', 'frame', 'camera'];

  const generateReport = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/resort?action=report');
      const data = await response.json();
      
      if (data.success) {
        setReport(data.data);
        setActiveTab('report');
      } else {
        setError(data.error || 'Failed to generate report');
      }
    } catch {
      setError('Network error while generating report');
    } finally {
      setIsLoading(false);
    }
  };

  const resortProducts = async (type: 'all' | 'category' | 'brand') => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const body: { action: string; category?: string; brand?: string } = { action: `resort-${type}` };
      if (type === 'category') body.category = selectedCategory;
      if (type === 'brand') body.brand = selectedBrand;
      
      const response = await fetch('/api/admin/resort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
        setActiveTab('results');
      } else {
        setError(data.error || 'Failed to resort products');
      }
    } catch {
      setError('Network error while resorting products');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      motor: 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs',
      prop: 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs',
      battery: 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs',
      stack: 'bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs',
      frame: 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs',
      camera: 'bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Resort Center</h2>
          <p className="text-gray-600">
            Reclassify products using improved detection logic
          </p>
        </div>
        <button
          onClick={generateReport}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Generate Report
        </button>
      </div>

      {error && (
        <div className="border border-red-300 bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'report', 'results'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Resort All Products */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="flex items-center text-lg font-semibold">
                <Package className="mr-2 h-5 w-5" />
                Resort All Products
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Reclassify all products in the database using current detection logic
              </p>
            </div>
            <button
              onClick={() => resortProducts('all')}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Resort All Products
            </button>
          </div>

          {/* Resort by Category */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Resort by Category</h3>
              <p className="text-gray-600 text-sm mt-1">
                Reclassify products currently in a specific category
              </p>
            </div>
            <div className="space-y-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => resortProducts('category')}
                disabled={isLoading || !selectedCategory}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Resort Category
              </button>
            </div>
          </div>

          {/* Resort by Brand */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Resort by Brand</h3>
              <p className="text-gray-600 text-sm mt-1">
                Reclassify products from a specific brand
              </p>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter brand name (e.g., T-Motor)"
                value={selectedBrand}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => resortProducts('brand')}
                disabled={isLoading || !selectedBrand.trim()}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Resort Brand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Tab */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {report ? (
            <div className="space-y-6">
              {/* Category Distribution */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
                <p className="text-gray-600 text-sm mb-4">Current distribution of products by category</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(report.categoryDistribution).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className={getCategoryColor(category)}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Potential Misclassifications */}
              {report.potentialMisclassifications.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="flex items-center text-lg font-semibold mb-4">
                    <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
                    Potential Misclassifications
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Products that might be in the wrong category ({report.potentialMisclassifications.length} found)
                  </p>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {report.potentialMisclassifications.slice(0, 20).map((item) => (
                      <div key={item.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{item.name}</h5>
                            <p className="text-xs text-gray-600 mt-1">{item.reason}</p>
                          </div>
                          <span className={getCategoryColor(item.category)}>
                            {item.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-10 text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">Click &quot;Generate Report&quot; to analyze the current state of products</p>
            </div>
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {result ? (
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Resort Results</h3>
                <p className="text-gray-600 text-sm mb-4">Summary of the reclassification process</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{result.totalProcessed}</div>
                    <div className="text-sm text-gray-600">Products Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{result.reclassified}</div>
                    <div className="text-sm text-gray-600">Reclassified</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-600">
                      {result.totalProcessed - result.reclassified}
                    </div>
                    <div className="text-sm text-gray-600">Already Correct</div>
                  </div>
                </div>
              </div>

              {result.changes.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Changes Made</h3>
                  <p className="text-gray-600 text-sm mb-4">Products that were reclassified</p>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {result.changes.map((change) => (
                      <div key={change.id} className="border rounded-lg p-4">
                        <h5 className="font-medium mb-2">{change.name}</h5>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">From:</span>
                            <span className={getCategoryColor(change.oldCategory)}>
                              {change.oldCategory}
                            </span>
                          </div>
                          <span className="text-gray-600">→</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">To:</span>
                            <span className={getCategoryColor(change.newCategory)}>
                              {change.newCategory}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">{change.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-10 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">Run a resort operation to see results here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}