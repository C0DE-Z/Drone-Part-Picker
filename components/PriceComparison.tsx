'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, ExternalLink, Loader2 } from 'lucide-react';

interface VendorPrice {
  id: string;
  price: number;
  url: string;
  inStock: boolean;
  lastUpdated: string;
  vendor: {
    id: string;
    name: string;
    website: string;
    logoUrl?: string;
  };
}

interface Product {
  id: string;
  name: string;
  category: string;
  brand?: string;
  sku?: string;
  description?: string;
  imageUrl?: string;
  vendorPrices: VendorPrice[];
}

interface PriceComparisonProps {
  searchQuery?: string;
  category?: string;
}

export default function PriceComparison({ searchQuery = '', category = '' }: PriceComparisonProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [inStockOnly, setInStockOnly] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'motor', label: 'Motors' },
    { value: 'frame', label: 'Frames' },
    { value: 'stack', label: 'Flight Controllers/ESCs' },
    { value: 'camera', label: 'Cameras' },
    { value: 'prop', label: 'Propellers' },
    { value: 'battery', label: 'Batteries' }
  ];

  const vendors = [
    { value: '', label: 'All Vendors' },
    { value: 'GetFPV', label: 'GetFPV' },
    { value: 'RDQ', label: 'Race Day Quads' },
    { value: 'PyrodroneFPV', label: 'Pyrodrone' },
    { value: 'HobbyKing', label: 'HobbyKing' }
  ];

  useEffect(() => {
    searchProducts();
  }, [search, selectedCategory, selectedVendor, priceRange, inStockOnly, pagination.page]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (search) params.append('q', search);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedVendor) params.append('vendor', selectedVendor);
      if (priceRange.min) params.append('minPrice', priceRange.min);
      if (priceRange.max) params.append('maxPrice', priceRange.max);
      if (inStockOnly) params.append('inStock', 'true');

      const response = await fetch(`/api/products/search?${params}`);
      const data = await response.json();

      setProducts(data.products);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getLowestPrice = (vendorPrices: VendorPrice[]) => {
    const inStockPrices = vendorPrices.filter(vp => vp.inStock);
    const prices = inStockPrices.length > 0 ? inStockPrices : vendorPrices;
    return Math.min(...prices.map(vp => vp.price));
  };

  const getSavingsPercentage = (currentPrice: number, lowestPrice: number) => {
    if (currentPrice === lowestPrice) return 0;
    return Math.round(((currentPrice - lowestPrice) / currentPrice) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Drone Parts Price Comparison</h1>
        <p className="text-gray-600 mb-6">
          Compare prices from multiple retailers to find the best deals on drone parts.
        </p>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            {/* Vendor Filter */}
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {vendors.map(vendor => (
                <option key={vendor.value} value={vendor.value}>{vendor.label}</option>
              ))}
            </select>

            {/* In Stock Filter */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">In stock only</span>
            </label>
          </div>

          {/* Price Range */}
          <div className="flex items-center space-x-4">
            <label className="text-sm text-gray-700">Price range:</label>
            <input
              type="number"
              placeholder="Min"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              className="w-24 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Max"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              className="w-24 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Showing {products.length} of {pagination.total} products
            </div>

            <div className="space-y-6">
              {products.map(product => {
                const lowestPrice = getLowestPrice(product.vendorPrices);
                
                return (
                  <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {product.name}
                          </h3>
                          
                          {product.brand && (
                            <p className="text-sm text-gray-600 mb-1">Brand: {product.brand}</p>
                          )}
                          
                          {product.sku && (
                            <p className="text-sm text-gray-600 mb-1">SKU: {product.sku}</p>
                          )}
                          
                          <p className="text-sm text-gray-600 capitalize mb-4">
                            Category: {product.category}
                          </p>

                          {/* Vendor Prices */}
                          <div className="space-y-3">
                            {product.vendorPrices
                              .sort((a, b) => a.price - b.price)
                              .map(vendorPrice => {
                                const savings = getSavingsPercentage(vendorPrice.price, lowestPrice);
                                
                                return (
                                  <div
                                    key={vendorPrice.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                                      vendorPrice.price === lowestPrice
                                        ? 'border-green-200 bg-green-50'
                                        : 'border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className="font-medium text-gray-900">
                                        {vendorPrice.vendor.name}
                                      </div>
                                      
                                      <div className="flex items-center space-x-2">
                                        <span className="text-lg font-bold text-gray-900">
                                          {formatPrice(vendorPrice.price)}
                                        </span>
                                        
                                        {vendorPrice.price === lowestPrice && (
                                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                            Best Price
                                          </span>
                                        )}
                                        
                                        {savings > 0 && (
                                          <span className="text-sm text-red-600">
                                            +{savings}%
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3">
                                      <div className="text-right">
                                        <div className={`text-sm font-medium ${
                                          vendorPrice.inStock ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                          {vendorPrice.inStock ? 'In Stock' : 'Out of Stock'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Updated {formatDate(vendorPrice.lastUpdated)}
                                        </div>
                                      </div>
                                      
                                      <a
                                        href={vendorPrice.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                      >
                                        <span>View</span>
                                        <ExternalLink className="w-4 h-4" />
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  <span className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
