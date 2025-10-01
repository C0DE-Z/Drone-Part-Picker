'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  SlidersHorizontal,
  X,
  Star,
  Zap,
  Target,
  Sparkles,
  History,
  Eye,
  Brain,
  GridIcon,
  List
} from 'lucide-react';
import { cacheService } from '@/lib/simple-cache';

interface SearchResult {
  id: string;
  type: 'component' | 'build' | 'user' | 'article';
  name: string;
  description: string;
  category?: string;
  brand?: string;
  price?: number;
  rating?: number;
  image?: string;
  tags: string[];
  compatibility?: string[];
  metadata: Record<string, unknown>;
  relevanceScore: number;
  featured?: boolean;
}

interface SearchFilters {
  categories: string[];
  priceRange: [number, number];
  brands: string[];
  rating: number;
  compatibility: string[];
  dateRange: 'any' | '1d' | '1w' | '1m' | '3m' | '1y';
  sortBy: 'relevance' | 'price' | 'rating' | 'newest' | 'popular';
  resultType: 'all' | 'components' | 'builds' | 'users' | 'articles';
}

interface SmartSuggestion {
  id: string;
  type: 'search' | 'filter' | 'component' | 'build';
  title: string;
  description: string;
  action: string;
  confidence: number;
}

interface AdvancedSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  initialQuery?: string;
}

export default function AdvancedSearch({ onResultSelect, initialQuery = '' }: AdvancedSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    priceRange: [0, 1000],
    brands: [],
    rating: 0,
    compatibility: [],
    dateRange: 'any',
    sortBy: 'relevance',
    resultType: 'all'
  });

  useEffect(() => {
    if (query.length > 2) {
      const timeoutId = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
    }
  }, [query, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadRecentSearches();
    generateSmartSuggestions();
  }, []);

  const loadRecentSearches = () => {
    const saved = cacheService.get<string[]>('recent_searches') || [];
    setRecentSearches(saved.slice(0, 5));
  };

  const saveSearch = (searchQuery: string) => {
    if (searchQuery.length < 2) return;
    
    const recent = cacheService.get<string[]>('recent_searches') || [];
    const updated = [searchQuery, ...recent.filter(s => s !== searchQuery)].slice(0, 10);
    cacheService.set('recent_searches', updated, 86400); // Cache for 24 hours
    setRecentSearches(updated.slice(0, 5));
  };

  const performSearch = useCallback(async () => {
    if (query.length < 2) return;
    
    setLoading(true);
    try {
      const cacheKey = `search:${query}:${JSON.stringify(filters)}`;
      let searchResults = cacheService.get<SearchResult[]>(cacheKey);
      
      if (!searchResults) {
        searchResults = await generateSearchResults(query, filters);
        cacheService.set(cacheKey, searchResults, 300); // Cache for 5 minutes
      }
      
      setResults(searchResults);
      saveSearch(query);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  const generateSearchResults = async (searchQuery: string, searchFilters: SearchFilters): Promise<SearchResult[]> => {
    // Mock intelligent search results with AI-powered ranking
    const mockResults: SearchResult[] = [
      {
        id: 'comp-1',
        type: 'component',
        name: 'EMAX RS2205 2300KV Motor',
        description: 'High-performance brushless motor perfect for racing and freestyle builds',
        category: 'Motors',
        brand: 'EMAX',
        price: 89.99,
        rating: 4.7,
        image: '/api/placeholder/200/150',
        tags: ['brushless', 'high-performance', 'racing', 'freestyle'],
        compatibility: ['5-inch frames', '4S-6S batteries'],
        metadata: {
          kv: 2300,
          weight: 32,
          shaft: '5mm',
          voltage: '14.8-22.2V'
        },
        relevanceScore: 95,
        featured: true
      },
      {
        id: 'build-1',
        type: 'build',
        name: 'Lightning Strike Racing Build',
        description: 'Ultra-fast racing quad with sub-4-minute flight times',
        category: 'Racing',
        price: 387.50,
        rating: 4.9,
        image: '/api/placeholder/200/150',
        tags: ['racing', 'fast', 'lightweight', 'competition'],
        compatibility: ['racing tracks', 'experienced pilots'],
        metadata: {
          flightTime: 3.8,
          topSpeed: 125.5,
          weight: 485,
          author: 'SpeedDemon'
        },
        relevanceScore: 88,
        featured: false
      },
      {
        id: 'comp-2',
        type: 'component',
        name: 'Armattan Chameleon 5" Frame',
        description: 'Durable carbon fiber frame designed for freestyle and racing',
        category: 'Frames',
        brand: 'Armattan',
        price: 49.99,
        rating: 4.8,
        image: '/api/placeholder/200/150',
        tags: ['carbon-fiber', 'durable', 'freestyle', 'racing'],
        compatibility: ['5-inch props', 'standard motors'],
        metadata: {
          material: 'Carbon Fiber',
          thickness: '4mm',
          weight: 85,
          propSize: '5 inch'
        },
        relevanceScore: 82,
        featured: false
      },
      {
        id: 'user-1',
        type: 'user',
        name: 'FreestyleKing',
        description: 'Professional FPV pilot and build expert with 50+ builds',
        tags: ['expert', 'freestyle', 'professional'],
        metadata: {
          builds: 52,
          followers: 2100,
          verified: true,
          speciality: 'Freestyle'
        },
        relevanceScore: 76,
        featured: true
      },
      {
        id: 'article-1',
        type: 'article',
        name: 'Choosing the Right Motor for Racing',
        description: 'Complete guide to selecting motors for competitive racing builds',
        category: 'Guides',
        tags: ['guide', 'motors', 'racing', 'tutorial'],
        metadata: {
          author: 'TechGuru',
          readTime: '8 min',
          views: 12500,
          publishDate: '2023-09-15'
        },
        relevanceScore: 70,
        featured: false
      }
    ];

    // Apply filters and search logic
    const filtered = mockResults.filter(result => {
      if (searchFilters.resultType !== 'all' && result.type !== searchFilters.resultType.slice(0, -1)) {
        return false;
      }
      
      if (searchFilters.categories.length > 0 && result.category && 
          !searchFilters.categories.includes(result.category)) {
        return false;
      }
      
      if (result.price && (result.price < searchFilters.priceRange[0] || 
          result.price > searchFilters.priceRange[1])) {
        return false;
      }
      
      if (searchFilters.rating > 0 && (!result.rating || result.rating < searchFilters.rating)) {
        return false;
      }
      
      if (searchFilters.brands.length > 0 && result.brand && 
          !searchFilters.brands.includes(result.brand)) {
        return false;
      }
      
      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (searchFilters.sortBy) {
        case 'price':
          return (a.price || 0) - (b.price || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'popular':
          return b.relevanceScore - a.relevanceScore;
        case 'newest':
          return Math.random() - 0.5; // Mock random for demo
        default: // relevance
          return b.relevanceScore - a.relevanceScore;
      }
    });

    return filtered;
  };

  const generateSmartSuggestions = () => {
    const mockSuggestions: SmartSuggestion[] = [
      {
        id: 'sug-1',
        type: 'search',
        title: 'Popular Racing Motors',
        description: 'High-KV motors perfect for racing builds',
        action: 'racing motors 2300kv',
        confidence: 92
      },
      {
        id: 'sug-2',
        type: 'filter',
        title: 'Budget Builds Under $300',
        description: 'Complete builds within budget constraints',
        action: 'filter:price:0-300',
        confidence: 87
      },
      {
        id: 'sug-3',
        type: 'component',
        title: 'Trending: Carbon Fiber Frames',
        description: 'Latest lightweight frame designs',
        action: 'carbon fiber frames',
        confidence: 84
      }
    ];
    
    setSuggestions(mockSuggestions);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'component': return <Target className="w-4 h-4" />;
      case 'build': return <Zap className="w-4 h-4" />;
      case 'user': return <Eye className="w-4 h-4" />;
      case 'article': return <Brain className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'component': return 'bg-blue-100 text-blue-700';
      case 'build': return 'bg-green-100 text-green-700';
      case 'user': return 'bg-purple-100 text-purple-700';
      case 'article': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">AI-Powered Search</h1>
            <p className="opacity-90">Discover components, builds, and knowledge with intelligent recommendations</p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="relative mb-4">
          <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for components, builds, users, or articles..."
            className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
            
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as SearchFilters['sortBy'] }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="relevance">Most Relevant</option>
              <option value="price">Price: Low to High</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
            </select>
            
            <select
              value={filters.resultType}
              onChange={(e) => setFilters(prev => ({ ...prev, resultType: e.target.value as SearchFilters['resultType'] }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Results</option>
              <option value="components">Components</option>
              <option value="builds">Builds</option>
              <option value="users">Users</option>
              <option value="articles">Articles</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <GridIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceRange[0]}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      priceRange: [parseInt(e.target.value) || 0, prev.priceRange[1]]
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceRange[1]}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      priceRange: [prev.priceRange[0], parseInt(e.target.value) || 1000]
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
                <select
                  value={filters.rating}
                  onChange={(e) => setFilters(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value={0}>Any Rating</option>
                  <option value={4.5}>4.5+ Stars</option>
                  <option value={4.0}>4.0+ Stars</option>
                  <option value={3.5}>3.5+ Stars</option>
                  <option value={3.0}>3.0+ Stars</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as SearchFilters['dateRange'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="any">Any Time</option>
                  <option value="1d">Past 24 Hours</option>
                  <option value="1w">Past Week</option>
                  <option value="1m">Past Month</option>
                  <option value="3m">Past 3 Months</option>
                  <option value="1y">Past Year</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Smart Suggestions */}
      {query.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Smart Suggestions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                onClick={() => setQuery(suggestion.action.replace('filter:', '').replace(/:/g, ' '))}
                className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-gray-900">{suggestion.title}</span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    {suggestion.confidence}%
                  </span>
                </div>
                <p className="text-sm text-gray-600">{suggestion.description}</p>
              </div>
            ))}
          </div>
          
          {recentSearches.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                Recent Searches
              </h4>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(search)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Results */}
      {(loading || results.length > 0) && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {loading ? 'Searching...' : `${results.length} results for "${query}"`}
              </h3>
              {results.length > 0 && (
                <div className="text-sm text-gray-600">
                  Showing {Math.min(results.length, 10)} of {results.length} results
                </div>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing and ranking results...</p>
            </div>
          ) : (
            <div className="p-6">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => onResultSelect?.(result)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getTypeColor(result.type)}`}>
                          {getTypeIcon(result.type)}
                          {result.type}
                        </div>
                        {result.featured && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                            Featured
                          </span>
                        )}
                      </div>
                      
                      <h4 className="font-semibold text-gray-900 mb-2">{result.name}</h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{result.description}</p>
                      
                      {result.rating && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            {getRatingStars(result.rating)}
                          </div>
                          <span className="text-sm text-gray-600">({result.rating})</span>
                        </div>
                      )}
                      
                      {result.price && (
                        <div className="text-lg font-bold text-green-600 mb-2">
                          {formatPrice(result.price)}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {result.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Relevance: {result.relevanceScore}%</span>
                        {result.brand && <span>{result.brand}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => onResultSelect?.(result)}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                    >
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {getTypeIcon(result.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{result.name}</h4>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getTypeColor(result.type)}`}>
                            {result.type}
                          </div>
                          {result.featured && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                              Featured
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{result.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {result.rating && (
                            <div className="flex items-center gap-1">
                              {getRatingStars(result.rating)}
                              <span>({result.rating})</span>
                            </div>
                          )}
                          {result.brand && <span>{result.brand}</span>}
                          <span>Match: {result.relevanceScore}%</span>
                        </div>
                      </div>
                      
                      {result.price && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {formatPrice(result.price)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
