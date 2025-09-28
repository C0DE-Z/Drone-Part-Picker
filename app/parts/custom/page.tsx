'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Search, Download, Upload, Plus, Grid3X3, List, Eye, Box, Shield, Zap, Brain, AlertTriangle } from 'lucide-react';
import LikeButton from '@/components/LikeButton';
import AdminActionMenu from '@/components/AdminActionMenu';
import ReportModal from '@/components/ReportModal';
import CustomPartForm from '@/components/CustomPartForm';
import FeedbackModal from '@/components/FeedbackModal';
import SecurityUtils from '@/lib/security-utils';
import DroneAnalytics from '@/services/DroneAnalytics';

interface CustomPart {
  id: string;
  name: string;
  description?: string;
  category: string;
  specifications: Record<string, unknown>;
  isPublic: boolean;
  viewCount?: number;
  modelFile?: string;
  modelFormat?: string;
  modelSize?: number;
  creator: {
    username: string;
    email: string;
  };
  stats: {
    likes: number;
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
}

const categories = [
  'All',
  'Motors',
  'Frames', 
  'Stacks',
  'Camera',
  'Props',
  'Batteries',
  'Simple Weight',
  'Antennas',
  'Tools',
  'Electronics',
  'Other'
];

export default function CustomParts() {
  const { data: session } = useSession();
  const [parts, setParts] = useState<CustomPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular' | 'name'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reportModal, setReportModal] = useState<{ isOpen: boolean; partId: string; partName: string }>({
    isOpen: false,
    partId: '',
    partName: ''
  });
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: false
  });
  const [aiRecommendations, setAiRecommendations] = useState<Array<{part: CustomPart; reason: string; compatibility: number; category: 'missing' | 'upgrade' | 'alternative' | 'complement'}>>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState<string[]>([]);
  const [performancePrediction, setPerformancePrediction] = useState<{estimatedPerformance: Record<string, number>; confidence: number; limitations: string[]; recommendations: string[]; predictionId?: string} | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [currentPredictionId, setCurrentPredictionId] = useState<string | null>(null);

  const fetchCustomParts = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        category: selectedCategory === 'All' ? '' : selectedCategory,
        sortBy,
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        public: 'true'
      });

      const response = await fetch(`/api/parts/custom?${params}`);
      if (response.ok) {
        const data = await response.json();
        setParts(data.parts || []);
        setPagination(prev => ({
          ...prev,
          total: data.total || 0,
          hasMore: data.hasMore || false
        }));
      }
    } catch (error) {
      console.error('Error fetching custom parts:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm, sortBy, pagination.limit, pagination.offset]);

  useEffect(() => {
    fetchCustomParts();
  }, [fetchCustomParts]);

  useEffect(() => {
    if (parts.length > 0) {
      generateAIRecommendations();
      // Classify parts for better categorization
      parts.forEach(part => classifyPart(part));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parts]);

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/parts/import-export?format=${format}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `custom-parts.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleImport = async (file: File) => {
    try {
      // Security validation
      if (!session?.user) {
        alert('Please sign in to import parts');
        return;
      }

      // Rate limiting check
      if (!SecurityUtils.rateLimitTracking.trackAction('importData', session.user.email || '')) {
        alert('Import limit exceeded. Please try again later.');
        return;
      }

      // File security validation
      const fileValidation = await SecurityUtils.FileSecurityValidator.validateFile(file);
      if (!fileValidation.valid) {
        alert(`File validation failed: ${fileValidation.error}`);
        return;
      }

      // Threat analysis
      const threatAnalysis = await SecurityUtils.ContentModerationService.analyzeFileForThreats(file);
      if (!threatAnalysis.safe) {
        alert(`Security threat detected: ${threatAnalysis.threats.join(', ')}`);
        SecurityUtils.SecurityAuditLogger.logSecurityEvent({
          type: 'suspicious_activity',
          userId: session.user.email || session.user.id || 'unknown',
          details: { fileName: file.name, threats: threatAnalysis.threats },
        });
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parts/import-export', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      const result = await response.json();
      alert(`Import successful! ${result.imported} parts imported, ${result.skipped} skipped.`);
      
      // Log security event
      SecurityUtils.SecurityAuditLogger.logSecurityEvent({
        type: 'import_export',
        userId: session.user.email || session.user.id || 'unknown',
        details: { action: 'import', fileName: file.name, imported: result.imported },
      });
      
      fetchCustomParts(); // Refresh the list
      
      // Trigger AI analysis for new parts
      generateAIRecommendations();
    } catch (error) {
      console.error('Import error:', error);
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const loadMore = () => {
    if (!pagination.hasMore) return;
    setPagination(prev => ({
      ...prev,
      offset: prev.offset + prev.limit
    }));
  };

  const generateAIRecommendations = useCallback(async () => {
    try {
      if (parts.length === 0) return;
      
      const recommendations = await DroneAnalytics.SmartRecommendations.getRecommendations(parts, parts);
      setAiRecommendations(recommendations.recommendations);
      
      // Generate performance prediction if we have enough parts
      if (parts.length >= 3) {
        const prediction = await DroneAnalytics.PerformancePredictor.predictPerformance(parts);
        const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        setPerformancePrediction({
          ...prediction,
          predictionId
        });
        setCurrentPredictionId(predictionId);
      }
    } catch (error) {
      console.error('Recommendation error:', error);
    }
  }, [parts]);

  const classifyPart = useCallback(async (part: CustomPart) => {
    try {
      const classification = await DroneAnalytics.PartClassificationService.classifyPart({
        name: part.name,
        description: part.description,
        specifications: part.specifications,
      });
      
      if (classification.confidence > 0.7 && classification.suggestedCategory !== part.category.toLowerCase()) {
        setSecurityAlerts(prev => [...prev, `AI suggests '${part.name}' might be better categorized as '${classification.suggestedCategory}'`]);
      }
    } catch (error) {
      console.error('Classification error:', error);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700">
                DronePartPicker
              </Link>
              <span className="text-gray-400">|</span>
              <h2 className="text-xl font-semibold text-gray-700">Custom Parts</h2>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/builds/public"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Public Builds
              </Link>
              {session && (
                <>
                  <Link 
                    href="/dashboard"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    My Builds
                  </Link>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Plus size={16} />
                    Add Part
                  </button>
                </>
              )}
              <Link
                href="/"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Build Now
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 justify-between">
              {/* Search and Category Filter */}
              <div className="flex flex-1 gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search custom parts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px]"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'popular' | 'name')}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="popular">Most Popular</option>
                  <option value="name">Name</option>
                </select>

                {/* View Mode */}
                <div className="flex border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
                    title="Grid view"
                  >
                    <Grid3X3 size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 border-l border-gray-200 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
                    title="List view"
                  >
                    <List size={16} />
                  </button>
                </div>

                {/* AI Panel Toggle */}
                {session && parts.length > 0 && (
                  <button
                    onClick={() => setShowAiPanel(!showAiPanel)}
                    className={`flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm transition-colors ${
                      showAiPanel ? 'bg-purple-100 text-purple-600 border-purple-200' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    title="Performance Analysis"
                  >
                    <Brain size={16} />
                    Analytics
                  </button>
                )}

                {/* Security Status */}
                {securityAlerts.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm">
                    <Shield size={16} />
                    {securityAlerts.length} Alert{securityAlerts.length !== 1 ? 's' : ''}
                  </div>
                )}

                {/* Import/Export */}
                {session && (
                  <>
                    <div className="relative">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
                      >
                        <Download size={16} />
                        Export
                      </button>
                      {showFilters && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                          <button
                            onClick={() => {
                              handleExport('json');
                              setShowFilters(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                          >
                            JSON
                          </button>
                          <button
                            onClick={() => {
                              handleExport('csv');
                              setShowFilters(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-t border-gray-100"
                          >
                            CSV
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm"
                    >
                      <Upload size={16} />
                      Import
                    </button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,.csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImport(file);
                          e.target.value = ''; // Reset input
                        }
                      }}
                      className="hidden"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading custom parts...</div>
          </div>
        ) : parts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-300 text-6xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm || selectedCategory !== 'All' ? 'No parts found' : 'No custom parts yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {session 
                ? 'Be the first to create and share a custom part!'
                : 'Sign in to create and share custom parts with the community.'
              }
            </p>
            {session ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Create Custom Part
              </button>
            ) : (
              <Link
                href="/auth/signin"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-block"
              >
                Sign In
              </Link>
            )}
          </div>
        ) : (
          <div>
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
              {parts.map((part: CustomPart) => (
                <div key={part.id} className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${viewMode === 'list' ? 'flex gap-6 p-4' : 'p-6'}`}>
                  {viewMode === 'grid' ? (
                    <>
                      {/* Grid View */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900">{part.name}</h3>
                                {part.modelFile && (
                                  <div title="Has 3D Model">
                                    <Box size={16} className="text-blue-600" />
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {part.category}
                                </span>
                                <span className="text-sm text-gray-500">
                                  by {part.creator.username}
                                </span>
                                {part.modelFile && (
                                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                    3D Model
                                  </span>
                                )}
                              </div>
                            </div>
                            {session?.user && (
                              <AdminActionMenu 
                                itemType="part" 
                                itemId={part.id} 
                                itemName={part.name}
                                onDelete={fetchCustomParts}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {part.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{part.description}</p>
                      )}

                      {/* Specifications */}
                      <div className="space-y-2 mb-4">
                        <h4 className="text-sm font-medium text-gray-900">Specifications</h4>
                        <div className="space-y-1">
                          {Object.entries(part.specifications).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-gray-600 capitalize">{key}:</span>
                              <span className="text-gray-900 font-medium">
                                {typeof value === 'string' ? value : `${value}`}
                              </span>
                            </div>
                          ))}
                          {Object.keys(part.specifications).length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{Object.keys(part.specifications).length - 3} more specs
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <LikeButton 
                            partId={part.id}
                            className="text-xs"
                          />
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{part.stats.likes} likes</span>
                            <span>{part.viewCount || 0} views</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1">
                            <Eye size={14} />
                            View Details
                          </button>
                          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
                            Use in Build
                          </button>
                          <button 
                            onClick={() => setReportModal({ isOpen: true, partId: part.id, partName: part.name })}
                            className="px-3 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                            title="Report this part"
                          >
                            ⚠️
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* List View */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900">{part.name}</h3>
                              {part.modelFile && (
                                <div title="Has 3D Model">
                                  <Box size={16} className="text-blue-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {part.category}
                              </span>
                              <span className="text-sm text-gray-500">
                                by {part.creator.username}
                              </span>
                              {part.modelFile && (
                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                  3D Model ({part.modelFormat?.toUpperCase()})
                                </span>
                              )}
                            </div>
                            {part.description && (
                              <p className="text-gray-600 text-sm line-clamp-1">{part.description}</p>
                            )}
                          </div>
                          {session?.user && (
                            <AdminActionMenu 
                              itemType="part" 
                              itemId={part.id} 
                              itemName={part.name}
                              onDelete={fetchCustomParts}
                            />
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <LikeButton 
                              partId={part.id}
                              className="text-xs"
                            />
                            <span>{part.stats.likes} likes</span>
                            <span>{part.viewCount || 0} views</span>
                            <span>{Object.keys(part.specifications).length} specs</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium flex items-center gap-1">
                              <Eye size={14} />
                              View
                            </button>
                            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
                              Use in Build
                            </button>
                            <button 
                              onClick={() => setReportModal({ isOpen: true, partId: part.id, partName: part.name })}
                              className="px-2 py-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                              title="Report this part"
                            >
                              ⚠️
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            
            {/* Load More / Pagination */}
            {!loading && parts.length > 0 && pagination.hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Load More Parts
                </button>
              </div>
            )}
            
            {/* Results Summary */}
            {!loading && parts.length > 0 && (
              <div className="mt-6 text-center text-sm text-gray-500">
                Showing {parts.length} of {pagination.total} parts
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Recommendations Panel */}
      {session && parts.length > 0 && (
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="text-purple-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-900">Performance Analysis</h3>
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                    BETA
                  </span>
                </div>
                <button
                  onClick={() => setShowAiPanel(!showAiPanel)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {showAiPanel ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            
            {showAiPanel && (
              <div className="p-6 space-y-4">
                {performancePrediction && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="text-blue-600" size={16} />
                      <h4 className="font-semibold text-blue-900">Performance Prediction</h4>
                      <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded">
                        {Math.round(performancePrediction.confidence * 100)}% confidence
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {Object.entries(performancePrediction.estimatedPerformance).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="text-blue-600 font-bold text-lg">{value}</div>
                          <div className="text-blue-700 capitalize">{key.replace('_', ' ')}</div>
                        </div>
                      ))}
                    </div>
                    {performancePrediction.recommendations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="text-blue-900 font-medium mb-2">Recommendations:</div>
                        <ul className="text-blue-800 text-sm space-y-1">
                          {performancePrediction.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span>•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-3 border-t border-blue-200">
                      <button
                        onClick={() => setShowFeedbackModal(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Rate Prediction Accuracy →
                      </button>
                    </div>
                  </div>
                )}

                {aiRecommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Smart Part Suggestions</h4>
                    <div className="grid gap-3">
                      {aiRecommendations.slice(0, 3).map((rec, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{rec.part.name}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                rec.category === 'missing' ? 'bg-red-100 text-red-600' :
                                rec.category === 'upgrade' ? 'bg-green-100 text-green-600' :
                                rec.category === 'alternative' ? 'bg-blue-100 text-blue-600' :
                                'bg-yellow-100 text-yellow-600'
                              }`}>
                                {rec.category}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-1">{rec.reason}</div>
                            <div className="text-xs text-gray-500">
                              Compatibility: {Math.round(rec.compatibility * 100)}%
                            </div>
                          </div>
                          <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiRecommendations.length === 0 && !performancePrediction && (
                  <div className="text-center py-8 text-gray-500">
                    <Brain size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>Add more parts to get AI-powered recommendations</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Alerts Panel */}
      {securityAlerts.length > 0 && (
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-red-200">
            <div className="px-6 py-4 border-b border-red-200 bg-red-50">
              <div className="flex items-center gap-3">
                <Shield className="text-red-600" size={20} />
                <h3 className="text-lg font-semibold text-red-900">Security Alerts</h3>
                <span className="text-xs bg-red-200 text-red-700 px-2 py-1 rounded">
                  {securityAlerts.length} alert{securityAlerts.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {securityAlerts.map((alert, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="text-red-600 mt-0.5 flex-shrink-0" size={16} />
                    <div className="flex-1">
                      <div className="text-red-900 font-medium">Security Warning</div>
                      <div className="text-red-800 text-sm">{alert}</div>
                    </div>
                    <button
                      onClick={() => setSecurityAlerts(alerts => alerts.filter((_, i) => i !== idx))}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Part Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create Custom Part</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-semibold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <CustomPartForm
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                  setShowCreateModal(false);
                  fetchCustomParts();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModal.isOpen && (
        <ReportModal
          isOpen={reportModal.isOpen}
          onClose={() => setReportModal({ isOpen: false, partId: '', partName: '' })}
          targetType="part"
          targetId={reportModal.partId}
          targetName={reportModal.partName}
        />
      )}
      
      {/* Feedback Modal */}
      {showFeedbackModal && performancePrediction && currentPredictionId && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          predictionData={{
            predictionId: currentPredictionId,
            estimatedPerformance: {
              thrust: performancePrediction.estimatedPerformance.thrust || 0,
              flightTime: performancePrediction.estimatedPerformance.flightTime || 0,
              topSpeed: performancePrediction.estimatedPerformance.topSpeed || 0,
              powerConsumption: performancePrediction.estimatedPerformance.powerConsumption || 0,
              thrustToWeight: performancePrediction.estimatedPerformance.thrustToWeight || 0,
              totalWeight: performancePrediction.estimatedPerformance.totalWeight || 0,
            }
          }}
          buildParts={parts}
          userId={session?.user?.email || undefined}
        />
      )}
    </div>
  );
}