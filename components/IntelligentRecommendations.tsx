'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Target, TrendingUp, DollarSign, Clock, Star, Zap, Filter, RefreshCw } from 'lucide-react';
import { cacheService } from '@/lib/simple-cache';

interface UserPreferences {
  primaryUse: 'racing' | 'freestyle' | 'cinematic' | 'longrange' | 'general';
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  budget: {
    min: number;
    max: number;
  };
  priorities: {
    flightTime: number; // 1-5 scale
    speed: number;
    agility: number;
    durability: number;
    cost: number;
  };
  preferredBrands: string[];
  existingComponents?: Record<string, unknown>;
}

interface PartRecommendation {
  id: string;
  name: string;
  category: 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery';
  price: number;
  brand: string;
  score: number;
  matchReason: string[];
  pros: string[];
  cons: string[];
  compatibilityScore: number;
  performanceImpact: {
    flightTime: number;
    speed: number;
    agility: number;
  };
  userRating: number;
  popularityScore: number;
  imageUrl?: string;
  specifications: Record<string, unknown>;
}

interface RecommendationFilters {
  category: 'all' | string;
  priceRange: [number, number];
  minRating: number;
  brandsOnly: boolean;
  sortBy: 'score' | 'price' | 'rating' | 'popularity';
}

interface IntelligentRecommendationsProps {
  currentBuild?: Record<string, unknown>;
  userPreferences?: UserPreferences;
  onRecommendationSelect?: (recommendation: PartRecommendation) => void;
}

export default function IntelligentRecommendations({ 
  currentBuild = {}, 
  userPreferences,
  onRecommendationSelect 
}: IntelligentRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<PartRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(
    userPreferences || {
      primaryUse: 'general',
      skillLevel: 'intermediate',
      budget: { min: 0, max: 1000 },
      priorities: {
        flightTime: 3,
        speed: 3,
        agility: 3,
        durability: 3,
        cost: 3
      },
      preferredBrands: [],
      existingComponents: currentBuild
    }
  );
  const [filters, setFilters] = useState<RecommendationFilters>({
    category: 'all',
    priceRange: [0, 500],
    minRating: 0,
    brandsOnly: false,
    sortBy: 'score'
  });
  const [showPreferencesSetup, setShowPreferencesSetup] = useState(!userPreferences);

  const generateRecommendations = useCallback(async () => {
    setLoading(true);
    
    try {
      // Check cache first
      const cacheKey = `recommendations:${JSON.stringify({ preferences, filters, currentBuild })}`;
      const cached = cacheService.get<PartRecommendation[]>(cacheKey);
      
      if (cached) {
        setRecommendations(cached);
        setLoading(false);
        return;
      }

      // Generate smart recommendations based on user preferences and current build
      const generated = await generateSmartRecommendations(preferences, currentBuild, filters);
      
      // Cache the results for 30 minutes
      cacheService.set(cacheKey, generated, 1800);
      setRecommendations(generated);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setLoading(false);
    }
  }, [preferences, filters, currentBuild]);

  useEffect(() => {
    if (!showPreferencesSetup) {
      generateRecommendations();
    }
  }, [preferences, filters, showPreferencesSetup, generateRecommendations]);

  const generateSmartRecommendations = async (
    prefs: UserPreferences,
    build: Record<string, unknown>,
    filters: RecommendationFilters
  ): Promise<PartRecommendation[]> => {
    // Mock intelligent recommendation generation
    // In a real implementation, this would use ML algorithms, user behavior data, and compatibility matrices
    
    const mockRecommendations: PartRecommendation[] = [
      {
        id: 'motor-1',
        name: 'EMAX RS2205 2300KV',
        category: 'motor',
        price: 89,
        brand: 'EMAX',
        score: 95,
        matchReason: [
          'Perfect KV for your flying style',
          'Excellent price-to-performance ratio',
          'High compatibility with selected frame'
        ],
        pros: [
          'Proven reliability',
          'Great thrust-to-weight ratio',
          'Easy to tune'
        ],
        cons: [
          'Slightly higher current draw',
          'May need specific props for optimal performance'
        ],
        compatibilityScore: 98,
        performanceImpact: {
          flightTime: -5,
          speed: +15,
          agility: +20
        },
        userRating: 4.6,
        popularityScore: 92,
        specifications: {
          kv: 2300,
          maxPower: 310,
          weight: 32,
          shaft: '5mm'
        }
      },
      {
        id: 'battery-1',
        name: 'Tattu R-Line 4S 1550mAh 95C',
        category: 'battery',
        price: 65,
        brand: 'Tattu',
        score: 92,
        matchReason: [
          'Optimal capacity for your flight time goals',
          'High C-rating matches motor requirements',
          'Perfect weight balance for frame'
        ],
        pros: [
          'Consistent power delivery',
          'Long cycle life',
          'Lightweight design'
        ],
        cons: [
          'Premium pricing',
          'Requires specific charger settings'
        ],
        compatibilityScore: 96,
        performanceImpact: {
          flightTime: +25,
          speed: +5,
          agility: -2
        },
        userRating: 4.8,
        popularityScore: 88,
        specifications: {
          voltage: 14.8,
          capacity: 1550,
          cRating: 95,
          weight: 165
        }
      },
      {
        id: 'prop-1',
        name: 'HQProp 5x4.3x3',
        category: 'prop',
        price: 12,
        brand: 'HQProp',
        score: 89,
        matchReason: [
          'Optimized for your motor choice',
          'Great balance of speed and efficiency',
          'Popular among similar builds'
        ],
        pros: [
          'Excellent durability',
          'Smooth flight characteristics',
          'Good value for money'
        ],
        cons: [
          'May lack top-end speed',
          'Limited color options'
        ],
        compatibilityScore: 94,
        performanceImpact: {
          flightTime: +10,
          speed: +8,
          agility: +12
        },
        userRating: 4.4,
        popularityScore: 85,
        specifications: {
          diameter: 5,
          pitch: 4.3,
          blades: 3,
          weight: 4
        }
      }
    ];

    // Apply filters and preferences-based scoring
    let filtered = mockRecommendations.filter(rec => {
      if (filters.category !== 'all' && rec.category !== filters.category) return false;
      if (rec.price < filters.priceRange[0] || rec.price > filters.priceRange[1]) return false;
      if (rec.userRating < filters.minRating) return false;
      if (filters.brandsOnly && !prefs.preferredBrands.includes(rec.brand)) return false;
      return true;
    });

    // Apply preference-based scoring adjustments
    filtered = filtered.map(rec => {
      let adjustedScore = rec.score;
      
      // Adjust based on user priorities
      if (prefs.priorities.cost > 3 && rec.price > prefs.budget.max * 0.8) {
        adjustedScore -= 10;
      }
      if (prefs.priorities.flightTime > 3 && rec.performanceImpact.flightTime > 10) {
        adjustedScore += 5;
      }
      if (prefs.priorities.speed > 3 && rec.performanceImpact.speed > 10) {
        adjustedScore += 5;
      }
      
      // Skill level adjustments
      if (prefs.skillLevel === 'beginner' && rec.pros.includes('Easy to tune')) {
        adjustedScore += 3;
      }
      
      return { ...rec, score: Math.min(100, adjustedScore) };
    });

    // Sort by selected criteria
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price': return a.price - b.price;
        case 'rating': return b.userRating - a.userRating;
        case 'popularity': return b.popularityScore - a.popularityScore;
        default: return b.score - a.score;
      }
    });

    return filtered;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceImpactIcon = (impact: number) => {
    if (impact > 10) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (impact > 0) return <Zap className="w-4 h-4 text-blue-600" />;
    if (impact < -10) return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
    return <div className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Smart Recommendations</h2>
            <p className="text-gray-600">AI-powered part suggestions tailored to your needs</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreferencesSetup(true)}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
          >
            <Target className="w-4 h-4 inline mr-2" />
            Preferences
          </button>
          <button
            onClick={generateRecommendations}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 inline mr-2" />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Preferences Setup Modal */}
      {showPreferencesSetup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Set Your Preferences</h3>
              <p className="text-gray-600 mt-1">Help us recommend the perfect parts for you</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Primary Use */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Use</label>
                <select
                  value={preferences.primaryUse}
                  onChange={(e) => setPreferences(prev => ({ 
                    ...prev, 
                    primaryUse: e.target.value as UserPreferences['primaryUse']
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="racing">Racing</option>
                  <option value="freestyle">Freestyle</option>
                  <option value="cinematic">Cinematic</option>
                  <option value="longrange">Long Range</option>
                  <option value="general">General Purpose</option>
                </select>
              </div>

              {/* Skill Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skill Level</label>
                <select
                  value={preferences.skillLevel}
                  onChange={(e) => setPreferences(prev => ({ 
                    ...prev, 
                    skillLevel: e.target.value as UserPreferences['skillLevel']
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              {/* Budget Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Range: ${preferences.budget.min} - ${preferences.budget.max}
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="2000"
                      step="50"
                      value={preferences.budget.min}
                      onChange={(e) => setPreferences(prev => ({ 
                        ...prev, 
                        budget: { ...prev.budget, min: parseInt(e.target.value) }
                      }))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1">Min: ${preferences.budget.min}</div>
                  </div>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="2000"
                      step="50"
                      value={preferences.budget.max}
                      onChange={(e) => setPreferences(prev => ({ 
                        ...prev, 
                        budget: { ...prev.budget, max: parseInt(e.target.value) }
                      }))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1">Max: ${preferences.budget.max}</div>
                  </div>
                </div>
              </div>

              {/* Priorities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Priorities (1-5 scale)</label>
                <div className="space-y-3">
                  {Object.entries(preferences.priorities).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            onClick={() => setPreferences(prev => ({
                              ...prev,
                              priorities: { ...prev.priorities, [key]: rating }
                            }))}
                            className={`w-8 h-8 rounded-full border-2 transition-colors ${
                              rating <= value
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'border-gray-300 text-gray-400 hover:border-purple-300'
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowPreferencesSetup(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPreferencesSetup(false);
                  generateRecommendations();
                }}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Save & Get Recommendations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">All Categories</option>
            <option value="motor">Motors</option>
            <option value="frame">Frames</option>
            <option value="stack">Stacks</option>
            <option value="camera">Cameras</option>
            <option value="prop">Propellers</option>
            <option value="battery">Batteries</option>
          </select>
          
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as RecommendationFilters['sortBy'] }))}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="score">Best Match</option>
            <option value="price">Price</option>
            <option value="rating">Rating</option>
            <option value="popularity">Popularity</option>
          </select>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Min Rating:</span>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={filters.minRating}
              onChange={(e) => setFilters(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
              className="w-20"
            />
            <span className="text-xs text-gray-600">{filters.minRating}★</span>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Analyzing compatibility and generating recommendations...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-purple-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{rec.name}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm capitalize">
                      {rec.category}
                    </span>
                    <div className={`text-lg font-bold ${getScoreColor(rec.score)}`}>
                      {rec.score}% match
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      ${rec.price}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current text-yellow-500" />
                      {rec.userRating}
                    </span>
                    <span>Brand: {rec.brand}</span>
                    <span>Compatibility: {rec.compatibilityScore}%</span>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Why this matches:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {rec.matchReason.map((reason, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <h5 className="font-medium text-green-700 mb-1">Pros</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {rec.pros.map((pro, index) => (
                          <li key={index}>• {pro}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-red-700 mb-1">Cons</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {rec.cons.map((con, index) => (
                          <li key={index}>• {con}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-blue-700 mb-1">Performance Impact</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Flight Time: {rec.performanceImpact.flightTime > 0 ? '+' : ''}{rec.performanceImpact.flightTime}%
                          {getPerformanceImpactIcon(rec.performanceImpact.flightTime)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Speed: {rec.performanceImpact.speed > 0 ? '+' : ''}{rec.performanceImpact.speed}%
                          {getPerformanceImpactIcon(rec.performanceImpact.speed)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Agility: {rec.performanceImpact.agility > 0 ? '+' : ''}{rec.performanceImpact.agility}%
                          {getPerformanceImpactIcon(rec.performanceImpact.agility)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="ml-6 text-right">
                  <button
                    onClick={() => onRecommendationSelect?.(rec)}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Add to Build
                  </button>
                  <div className="mt-2 text-xs text-gray-500">
                    {rec.popularityScore}% of users chose this
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && recommendations.length === 0 && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your filters or preferences to see more recommendations.
          </p>
          <button
            onClick={() => setShowPreferencesSetup(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Update Preferences
          </button>
        </div>
      )}
    </div>
  );
}