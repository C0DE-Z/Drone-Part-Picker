'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

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

interface DroneBuild {
  id: string;
  name: string;
  components: {
    motor?: ComponentData;
    frame?: ComponentData;
    stack?: ComponentData;
    camera?: ComponentData;
    prop?: ComponentData;
    battery?: ComponentData;
  };
  performance: PerformanceData;
  createdAt: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [builds, setBuilds] = useState<DroneBuild[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchBuilds();
    }
  }, [session]);

  const fetchBuilds = async () => {
    try {
      const response = await fetch('/api/builds');
      if (response.ok) {
        const data = await response.json();
        setBuilds(data.builds);
      }
    } catch (error) {
      console.error('Error fetching builds:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
          <Link
            href="/auth/signin"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

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
              <h2 className="text-xl font-semibold text-gray-700">My Builds</h2>
            </div>
            <div className="text-gray-600">
              Welcome, {session.user?.email}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading your builds...</div>
          </div>
        ) : builds.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🚁</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No builds yet</h3>
            <p className="text-gray-500 mb-6">Create your first drone build to see it here</p>
            <Link
              href="/"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Start Building
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {builds.map((build) => (
              <div key={build.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{build.name}</h3>
                <div className="text-sm text-gray-500 mb-4">
                  Created: {new Date(build.createdAt).toLocaleDateString()}
                </div>
                
                {/* Component Summary */}
                <div className="space-y-2 mb-4">
                  {Object.entries(build.components)
                    .filter(([, component]) => component !== null && component !== undefined)
                    .map(([type, component]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">{type}:</span>
                      <span className="text-gray-900 font-medium truncate ml-2">
                        {component?.name || 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Performance Summary */}
                {build.performance && (
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Flight Time:</span>
                      <span className="text-gray-900 font-medium">
                        {build.performance.flightTime?.toFixed(1)}min
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">TWR:</span>
                      <span className="text-gray-900 font-medium">
                        {build.performance.thrustToWeightRatio?.toFixed(1)}:1
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Weight:</span>
                      <span className="text-gray-900 font-medium">
                        {build.performance.totalWeight?.toFixed(0)}g
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                  <Link 
                    href={`/?loadBuild=${build.id}`}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium text-center"
                  >
                    Load Build
                  </Link>
                  <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
