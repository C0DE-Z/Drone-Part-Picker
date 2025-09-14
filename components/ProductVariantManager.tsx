'use client';

import { useState, useEffect } from 'react';
import { Loader2, Split, Package, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ProductWithVariants {
  id: string;
  name: string;
  category: string;
  detected: {
    original: string;
    variants: string[];
    baseName: string;
    variantType: string;
    unit: string;
  };
}

interface VariantStats {
  totalProducts: number;
  productsWithVariants: number;
  detectedVariants: Array<{
    name: string;
    variantCount: number;
    variantType: string;
  }>;
}

interface SplitResult {
  originalProduct: string;
  createdProducts: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  message: string;
}

interface BatchSplitResult {
  totalProcessed: number;
  totalSplit: number;
  totalCreated: number;
  results: Array<{
    id: string;
    success: boolean;
    originalName?: string;
    createdCount?: number;
    createdProducts?: string[];
    error?: string;
  }>;
}

export default function ProductVariantManager() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<VariantStats | null>(null);
  const [productsWithVariants, setProductsWithVariants] = useState<ProductWithVariants[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [splitResults, setSplitResults] = useState<SplitResult | BatchSplitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/variants?action=stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || 'Failed to load stats');
      }
    } catch {
      setError('Network error while loading stats');
    } finally {
      setIsLoading(false);
    }
  };

  const detectVariants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/variants?action=detect');
      const data = await response.json();
      
      if (data.success) {
        setProductsWithVariants(data.data.products);
        setActiveTab('detected');
      } else {
        setError(data.error || 'Failed to detect variants');
      }
    } catch {
      setError('Network error while detecting variants');
    } finally {
      setIsLoading(false);
    }
  };

  const splitSingleProduct = async (productId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'split-single', productId })
      });

      const data = await response.json();
      
      if (data.success) {
        setSplitResults(data.data);
        // Remove the split product from the list
        setProductsWithVariants(prev => prev.filter(p => p.id !== productId));
        setActiveTab('results');
      } else {
        setError(data.error || 'Failed to split product');
      }
    } catch {
      setError('Network error while splitting product');
    } finally {
      setIsLoading(false);
    }
  };

  const splitBatchProducts = async () => {
    if (selectedProducts.length === 0) {
      setError('Please select products to split');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'split-batch', productIds: selectedProducts })
      });

      const data = await response.json();
      
      if (data.success) {
        setSplitResults(data.data);
        // Remove split products from the list
        setProductsWithVariants(prev => 
          prev.filter(p => !selectedProducts.includes(p.id))
        );
        setSelectedProducts([]);
        setActiveTab('results');
      } else {
        setError(data.error || 'Failed to split products');
      }
    } catch {
      setError('Network error while splitting products');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    setSelectedProducts(productsWithVariants.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  useEffect(() => {
    loadStats();
  }, []);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      motor: 'bg-blue-100 text-blue-800',
      prop: 'bg-green-100 text-green-800',
      battery: 'bg-yellow-100 text-yellow-800',
      stack: 'bg-purple-100 text-purple-800',
      frame: 'bg-red-100 text-red-800',
      camera: 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Variant Manager</h2>
          <p className="text-gray-600">
            Detect and split products with multiple variants (KV ratings, capacities, etc.)
          </p>
        </div>
        <button
          onClick={detectVariants}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Split className="mr-2 h-4 w-4" />
          Detect Variants
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

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'detected', 'results'].map((tab) => (
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

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold">Total Products</h3>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalProducts}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center">
                  <Split className="h-8 w-8 text-orange-500 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold">With Variants</h3>
                    <p className="text-3xl font-bold text-orange-600">{stats.productsWithVariants}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border rounded-lg p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold">Potential Splits</h3>
                    <p className="text-3xl font-bold text-green-600">
                      {stats.detectedVariants.reduce((sum, item) => sum + item.variantCount, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">What Are Product Variants?</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p className="flex items-start">
                <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                <span>
                  <strong>Motor Variants:</strong> Products like &quot;Badass 2 - 2207.5 Motor - 1400KV/1900KV/2400KV&quot; 
                  contain multiple KV ratings and should be split into separate products.
                </span>
              </p>
              <p className="flex items-start">
                <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                <span>
                  <strong>Battery Variants:</strong> Products with multiple capacities like &quot;1300mAh/1550mAh/1800mAh&quot; 
                  or cell counts like &quot;3S/4S/6S&quot;.
                </span>
              </p>
              <p className="flex items-start">
                <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                <span>
                  <strong>ESC Variants:</strong> Products with multiple amp ratings like &quot;25A/35A/45A ESC&quot;.
                </span>
              </p>
              <p className="flex items-start">
                <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                <span>
                  <strong>Prop Variants:</strong> Products with multiple sizes like &quot;5x4x3/5x4.5x3/5x5x3&quot;.
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'detected' && (
        <div className="space-y-4">
          {productsWithVariants.length > 0 ? (
            <>
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {productsWithVariants.length} products with variants detected
                  </span>
                  <span className="text-sm text-gray-600">
                    ({selectedProducts.length} selected)
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={selectAllProducts}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1 text-sm bg-gray-400 text-white rounded hover:bg-gray-500"
                  >
                    Clear
                  </button>
                  <button
                    onClick={splitBatchProducts}
                    disabled={selectedProducts.length === 0 || isLoading}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `Split Selected (${selectedProducts.length})`
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {productsWithVariants.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">{product.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(product.category)}`}>
                              {product.category}
                            </span>
                            <span>{product.detected.variantType}</span>
                            <span>{product.detected.variants.length} variants</span>
                          </div>
                          <div className="bg-gray-50 p-3 rounded text-sm">
                            <p className="font-medium mb-1">Will be split into:</p>
                            <div className="space-y-1">
                              {product.detected.variants.map((variant, index) => (
                                <div key={index} className="text-gray-700">
                                  • {product.detected.baseName} - {variant.toUpperCase()}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => splitSingleProduct(product.id)}
                        disabled={isLoading}
                        className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Split className="h-4 w-4 mr-1" />
                            Split
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="border rounded-lg p-10 text-center bg-white">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No products with variants detected</p>
              <p className="text-sm text-gray-500 mt-1">
                Click &quot;Detect Variants&quot; to scan for products that can be split
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-4">
          {splitResults ? (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                Split Results
              </h3>
              
              {('results' in splitResults) ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{splitResults.totalProcessed}</div>
                      <div className="text-sm text-gray-600">Products Processed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{splitResults.totalSplit}</div>
                      <div className="text-sm text-gray-600">Successfully Split</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{splitResults.totalCreated}</div>
                      <div className="text-sm text-gray-600">New Products Created</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {splitResults.results.map((result, index) => (
                      <div key={index} className={`p-3 rounded border ${
                        result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        {result.success ? (
                          <div>
                            <p className="font-medium text-green-800">
                              {result.originalName} → {result.createdCount} products
                            </p>
                            <div className="text-sm text-green-600 mt-1">
                              {result.createdProducts?.join(', ')}
                            </div>
                          </div>
                        ) : (
                          <p className="text-red-800">{result.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-green-700 mb-3">{splitResults.message}</p>
                  <div className="space-y-2">
                    {splitResults.createdProducts.map((product) => (
                      <div key={product.id} className="bg-green-50 p-3 rounded border border-green-200">
                        <p className="font-medium text-green-800">{product.name}</p>
                        <p className="text-sm text-green-600">{product.category} • ID: {product.id}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="border rounded-lg p-10 text-center bg-white">
              <Split className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">Split results will appear here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}