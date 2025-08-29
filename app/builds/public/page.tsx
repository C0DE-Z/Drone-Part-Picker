'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import LikeButton from '@/components/LikeButton';

interface ComponentData {
  name: string;
  data: Record<string, string | number>;
}

interface PerformanceData {
  totalWeight?: number;
  thrustToWeightRatio?: number;
  estimatedTopSpeed?: number;
  flightTime?: number;
  powerConsumption?: number;
}

interface PublicBuild {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  tags?: string[];
  viewCount?: number;
  likesCount?: number;
  commentsCount?: number;
  user: {
    username: string;
    email: string;
  };
  components: {
    motor?: ComponentData;
    frame?: ComponentData;
    stack?: ComponentData;
    camera?: ComponentData;
    prop?: ComponentData;
    battery?: ComponentData;
  };
  performance: PerformanceData;
}

export default function PublicBuilds() {
  const { data: session } = useSession();
  const [builds, setBuilds] = useState<PublicBuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');

  const fetchPublicBuilds = useCallback(async () => {
    try {
      const response = await fetch('/api/builds/public');
      
      if (response.ok) {
        const data = await response.json();
        setBuilds(data.builds || []);
      } else {
        console.error('Failed to fetch builds:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching public builds:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicBuilds();
  }, [fetchPublicBuilds]);

  const filteredBuilds = builds.filter(build =>
    build.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    build.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    build.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedBuilds = [...filteredBuilds].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'popular':
        return (b.viewCount || 0) - (a.viewCount || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700">
                DronePartPicker
              </Link>
              <span className="text-gray-400">|</span>
              <h2 className="text-xl font-semibold text-gray-700">Public Builds</h2>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/parts/custom"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Custom Parts
              </Link>
              {session && (
                <>
                  <Link 
                    href="/dashboard"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    My Builds
                  </Link>
                </>
              )}
              <Link
                href="/"
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Build Now
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search builds by name, description, or creator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'popular')}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading public builds...</div>
          </div>
        ) : sortedBuilds.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-6xl mb-4">🚁</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? 'No builds found' : 'No public builds yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Be the first to share a drone build with the community! Create your build and set it to public to see it here.'
              }
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              🚁 Create Your First Build
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedBuilds.map((build) => (
              <div key={build.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{build.name}</h3>
                    <p className="text-sm text-gray-500">
                      by <Link 
                        href={`/profile/${build.user.username}`} 
                        className="hover:text-gray-700 transition-colors"
                      >
                        {build.user.username}
                      </Link> • {new Date(build.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {build.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{build.description}</p>
                )}

                <div className="space-y-2 mb-4">
                  {Object.entries(build.components)
                    .filter(([, component]) => component !== null && component !== undefined)
                    .slice(0, 3)
                    .map(([type, component]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">{type}:</span>
                      <span className="text-gray-900 font-medium truncate ml-2">
                        {component?.name || 'Unknown'}
                      </span>
                    </div>
                  ))}
                  {Object.keys(build.components).filter(key => build.components[key as keyof typeof build.components]).length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{Object.keys(build.components).filter(key => build.components[key as keyof typeof build.components]).length - 3} more components
                    </div>
                  )}
                </div>

                {build.performance && (
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Performance</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {build.performance.flightTime && (
                        <div>
                          <span className="text-gray-600">Flight Time:</span>
                          <span className="text-gray-900 font-medium ml-1">
                            {build.performance.flightTime.toFixed(1)}min
                          </span>
                        </div>
                      )}
                      {build.performance.thrustToWeightRatio && (
                        <div>
                          <span className="text-gray-600">TWR:</span>
                          <span className="text-gray-900 font-medium ml-1">
                            {build.performance.thrustToWeightRatio.toFixed(1)}:1
                          </span>
                        </div>
                      )}
                      {build.performance.totalWeight && (
                        <div>
                          <span className="text-gray-600">Weight:</span>
                          <span className="text-gray-900 font-medium ml-1">
                            {build.performance.totalWeight.toFixed(0)}g
                          </span>
                        </div>
                      )}
                      {build.performance.estimatedTopSpeed && (
                        <div>
                          <span className="text-gray-600">Top Speed:</span>
                          <span className="text-gray-900 font-medium ml-1">
                            {build.performance.estimatedTopSpeed}km/h
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {build.tags && build.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {build.tags.slice(0, 3).map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {build.tags.length > 3 && (
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{build.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <LikeButton 
                      buildId={build.id}
                      className="text-xs"
                    />
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-xs">
                      💬 {build.commentsCount || 0} comments
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link 
                      href={`/?loadBuild=${build.id}`}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium text-center"
                    >
                      Load Build
                    </Link>
                    <Link 
                      href={`/builds/${build.id}`}
                      className="flex-1 px-3 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors text-sm font-medium text-center"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
