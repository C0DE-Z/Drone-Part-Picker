'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import LikeButton from '@/components/LikeButton';
import Comments from '@/components/Comments';
import AdminActionMenu from '@/components/AdminActionMenu';
import ReportModal from '@/components/ReportModal';

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

interface BuildDetail {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  user: {
    username: string;
    email: string;
  };
  components?: {
    motor?: ComponentData;
    frame?: ComponentData;
    stack?: ComponentData;
    camera?: ComponentData;
    prop?: ComponentData;
    battery?: ComponentData;
  };
  performance: PerformanceData;
  tags?: string[];
}

export default function BuildDetails({ params }: { params: Promise<{ id: string }> }) {
  const [build, setBuild] = useState<BuildDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchBuild = async () => {
      try {
        const { id } = await params;
        const response = await fetch(`/api/builds/${id}`);
        if (response.ok) {
          const data = await response.json();
          setBuild(data.build);
        }
      } catch (error) {
        console.error('Error fetching build:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBuild();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading build details...</p>
        </div>
      </div>
    );
  }

  if (!build) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Build Not Found</h1>
          <p className="text-gray-600 mb-8">The build you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link
            href="/builds/public"
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            ← Back to Public Builds
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
              <Link href="/builds/public" className="text-gray-600 hover:text-gray-900">
                Public Builds
              </Link>
              <span className="text-gray-400">|</span>
              <h2 className="text-xl font-semibold text-gray-700">{build.name}</h2>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Build Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{build.name}</h1>
                  <p className="text-gray-600 mb-4">{build.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>By {build.user.username}</span>
                    <span>•</span>
                    <span>{new Date(build.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <LikeButton buildId={build.id} />
                  {session?.user && (
                    <AdminActionMenu 
                      itemType="build" 
                      itemId={build.id} 
                      itemName={build.name}
                      onDelete={() => window.location.href = '/builds/public'}
                    />
                  )}
                </div>
              </div>

              {/* Tags */}
              {build.tags && build.tags.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {build.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Components */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Components</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {build.components && Object.entries(build.components).map(([type, component]) => {
                  if (!component) return null;
                  
                  // Define which specs to show for each component type
                  const getRelevantSpecs = (componentType: string, data: Record<string, string | number>) => {
                    const specs: Record<string, string | number> = {};
                    
                    switch (componentType) {
                      case 'motor':
                        if (data.kv) specs['KV'] = data.kv;
                        if (data.statorSize) specs['Stator Size'] = data.statorSize;
                        if (data.maxThrust) specs['Max Thrust'] = data.maxThrust;
                        if (data.weight) specs['Weight'] = data.weight;
                        if (data.voltageCompatibility) specs['Voltage'] = data.voltageCompatibility;
                        break;
                      case 'frame':
                        if (data.wheelbase) specs['Wheelbase'] = data.wheelbase;
                        if (data.weight) specs['Weight'] = data.weight;
                        if (data.material) specs['Material'] = data.material;
                        if (data.propellerSizeCompatibility) specs['Prop Size'] = data.propellerSizeCompatibility;
                        break;
                      case 'stack':
                        if (data.fcProcessor) specs['FC Processor'] = data.fcProcessor;
                        if (data.escCurrentRating) specs['ESC Rating'] = data.escCurrentRating;
                        if (data.mountingSize) specs['Mounting'] = data.mountingSize;
                        if (data.voltageInput) specs['Voltage'] = data.voltageInput;
                        break;
                      case 'camera':
                        if (data.resolution) specs['Resolution'] = data.resolution;
                        if (data.sensor) specs['Sensor'] = data.sensor;
                        if (data.fov) specs['FOV'] = data.fov;
                        if (data.weight) specs['Weight'] = data.weight;
                        break;
                      case 'prop':
                        if (data.size) specs['Size'] = data.size;
                        if (data.pitch) specs['Pitch'] = data.pitch;
                        if (data.blades) specs['Blades'] = data.blades;
                        if (data.material) specs['Material'] = data.material;
                        if (data.weight) specs['Weight'] = data.weight;
                        break;
                      case 'battery':
                        if (data.voltage) specs['Voltage'] = data.voltage;
                        if (data.capacity) specs['Capacity'] = data.capacity;
                        if (data.cRating) specs['C Rating'] = data.cRating;
                        if (data.weight) specs['Weight'] = data.weight;
                        if (data.connector) specs['Connector'] = data.connector;
                        break;
                      default:
                        // For unknown components, show basic info
                        if (data.weight) specs['Weight'] = data.weight;
                        if (data.price) specs['Price'] = `$${data.price}`;
                        break;
                    }
                    
                    return specs;
                  };
                  
                  const relevantSpecs = getRelevantSpecs(type, component.data);
                  
                  return (
                    <div key={type} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 capitalize mb-2">{type}</h3>
                      <p className="text-gray-800 font-medium mb-3">{component.name}</p>
                      {Object.keys(relevantSpecs).length > 0 ? (
                        <div className="space-y-1 text-sm">
                          {Object.entries(relevantSpecs).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-600">{key}:</span>
                              <span className="text-gray-900 font-medium">{value}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No specifications available</p>
                      )}
                    </div>
                  );
                })}
                
                {(!build.components || Object.keys(build.components).length === 0) && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <p>No components configured for this build yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Comments</h2>
              <Comments buildId={build.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">(Est) Performance</h3>
              <div className="space-y-3">
                {build.performance.totalWeight && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Weight:</span>
                    <span className="text-gray-900 font-medium">{build.performance.totalWeight.toFixed(0)}g</span>
                  </div>
                )}
                {build.performance.thrustToWeightRatio && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thrust-to-Weight:</span>
                    <span className="text-gray-900 font-medium">{build.performance.thrustToWeightRatio.toFixed(1)}:1</span>
                  </div>
                )}
                {build.performance.estimatedTopSpeed && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Top Speed:</span>
                    <span className="text-gray-900 font-medium">{build.performance.estimatedTopSpeed}km/h</span>
                  </div>
                )}
                {build.performance.flightTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Flight Time:</span>
                    <span className="text-gray-900 font-medium">{build.performance.flightTime.toFixed(1)} min</span>
                  </div>
                )}
                {build.performance.powerConsumption && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Power Draw:</span>
                    <span className="text-gray-900 font-medium">{build.performance.powerConsumption}A</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => window.location.href = `/?loadBuild=${build.id}`}
                  className="w-full px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
                >
                  Clone This Build
                </button>
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: build.name,
                        text: build.description || `Check out this drone build: ${build.name}`,
                        url: window.location.href
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Build URL copied to clipboard!');
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Share Build
                </button>
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Report Issue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetType="build"
          targetId={build.id}
          targetName={build.name}
        />
      )}
    </div>
  );
}
