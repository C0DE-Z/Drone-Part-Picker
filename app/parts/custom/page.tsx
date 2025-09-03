'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import LikeButton from '@/components/LikeButton';

interface CustomPart {
  id: string;
  name: string;
  description?: string;
  category: string;
  specifications: Record<string, string | number>;
  isPublic: boolean;
  viewCount?: number;
  user: {
    username: string;
    email: string;
  };
  createdAt: string;
}

const categories = [
  'All',
  'Motors',
  'Frames', 
  'Stacks',
  'Camera',
  'Props',
  'Batteries',
  'Simple Weight'
];

export default function CustomParts() {
  const { data: session } = useSession();
  const [parts, setParts] = useState<CustomPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchCustomParts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }
      params.append('public', 'true');

      const response = await fetch(`/api/parts/custom?${params}`);
      if (response.ok) {
        const data = await response.json();
        setParts(data.customParts);
      }
    } catch (error) {
      console.error('Error fetching custom parts:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchCustomParts();
  }, [selectedCategory, fetchCustomParts]);

  const filteredParts = parts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
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
        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          
          <input
            type="text"
            placeholder="Search custom parts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading custom parts...</div>
          </div>
        ) : filteredParts.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredParts.map((part) => (
              <div key={part.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{part.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {part.category}
                      </span>
                      <span className="text-sm text-gray-500">
                        by {part.user.username}
                      </span>
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
                    <span className="text-xs text-gray-500">
                      {part.viewCount || 0} views
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium">
                      View Details
                    </button>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
                      Use in Build
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Part Modal - Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Create Custom Part</h3>
            <p className="text-gray-600 mb-4">
              Custom part creation coming soon! This feature will allow you to create and share custom drone parts with the community.
            </p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
