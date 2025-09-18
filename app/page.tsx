'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { DroneComponents, SelectedComponents, PerformanceEstimate, Motor, Frame, Stack, Camera, Prop, Battery, CustomWeight } from '@/types/drone';
import { DronePerformanceService } from '@/services/DronePerformanceService';
import EnhancedComponentGrid from '@/components/EnhancedComponentGrid';
import PerformancePanel from '@/components/PerformancePanel';
import BuildSummary from '@/components/BuildSummary';
import AddComponentModal from '@/components/AddComponentModal';
import Footer from '@/components/Footer';
import Toast from '@/components/Toast';
import AdvancedSettingsComponent from '@/components/AdvancedSettings';
import { AdvancedSettings, defaultAdvancedSettings } from '@/types/advancedSettings';

function AuthControls() {
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState<{username?: string} | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/users/generate-username', { method: 'POST' })
        .then(res => res.json())
        .then(data => setUserProfile({ username: data.username }))
        .catch(err => console.error('Error:', err));

      fetch('/api/auth/check-admin')
        .then(res => res.json())
        .then(data => setIsAdmin(data.isAdmin))
        .catch(err => console.error('Error checking admin status:', err));
    }
  }, [session]);

  if (status === 'loading') return <div>Loading...</div>;

  if (session) {
    return (
      <div className="flex items-center gap-4">
  <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
          My Builds
        </Link>
        {userProfile?.username && (
          <>
            <Link href={`/profile/${userProfile.username}`} className="text-gray-700 hover:text-gray-900">
              Profile
            </Link>
            <span className="text-gray-700">Hi, {userProfile.username}</span>
          </>
        )}
        {isAdmin && (
          <Link 
            href="/admin" 
            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 font-medium"
          >
            Admin
          </Link>
        )}
        <button
          onClick={() => signOut()}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
  <Link href="/auth/signin" className="px-4 py-2 text-gray-700 hover:text-gray-900">
        Sign In
      </Link>
  <Link href="/auth/signup" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
        Sign Up
      </Link>
    </div>
  );
}

export default function Home() {
  const { data: session } = useSession();
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponents>({});
  const [performance, setPerformance] = useState<PerformanceEstimate | null>(null);
  const [activeTab, setActiveTab] = useState<keyof DroneComponents>('Motors');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>(defaultAdvancedSettings);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
  
  // Toast state
  const [showBuildCompleteToast, setShowBuildCompleteToast] = useState(false);
  const [previousBuildComplete, setPreviousBuildComplete] = useState(false);
  const [showPerformanceIndicator, setShowPerformanceIndicator] = useState(true);
  
  // Loading and error states for build loading
  const [isLoadingBuild, setIsLoadingBuild] = useState(false);
  const [showLoadSuccessToast, setShowLoadSuccessToast] = useState(false);
  const [showLoadErrorToast, setShowLoadErrorToast] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');
  
  // Save build toast states
  const [showSaveErrorToast, setShowSaveErrorToast] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState('');

  // Load saved advanced settings from localStorage
  useEffect(() => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('dronepartpicker-advanced-settings');
      if (savedSettings) {
        try {
          setAdvancedSettings(JSON.parse(savedSettings));
        } catch (error) {
          console.error('Failed to load saved settings:', error);
        }
      }
    }
  }, []);

  // Save advanced settings to localStorage when they change
  useEffect(() => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      localStorage.setItem('dronepartpicker-advanced-settings', JSON.stringify(advancedSettings));
    }
  }, [advancedSettings]);

  // Update performance when components change
  useEffect(() => {
    setPerformance(DronePerformanceService.calculatePerformance(selectedComponents, advancedSettings));
  }, [selectedComponents, advancedSettings]);

  // Check if build is complete and show toast
  useEffect(() => {
    const requiredComponents = ['Motors', 'Frames', 'Stacks', 'Props', 'Batteries'];
    const isCurrentlyComplete = requiredComponents.every(component => 
      selectedComponents[component as keyof SelectedComponents]
    );
    
    // Show toast only when build becomes complete (not on initial load)
    if (isCurrentlyComplete && !previousBuildComplete && Object.keys(selectedComponents).length > 0) {
      setShowBuildCompleteToast(true);
    }
    
    setPreviousBuildComplete(isCurrentlyComplete);
  }, [selectedComponents, previousBuildComplete]);

  const loadBuild = useCallback(async (buildId: string) => {
    // Prevent double loading
    if (isLoadingBuild) return;
    
    setIsLoadingBuild(true);
    setShowLoadErrorToast(false);
    setShowLoadSuccessToast(false);
    
    try {
      const response = await fetch(`/api/builds/${buildId}`);
      if (response.ok) {
        console.log("Fetch response received");
        const data = await response.json();
        console.log("Response data:", data);
        
        // The API returns { build: {...} }, so we need to access data.build
        const build = data.build;
        console.log("Build data:", build);
        
        if (build && build.components) {
          console.log(`Loading Build: ${build.name || 'Unnamed Build'}`);
          setSelectedComponents(build.components);
          setShowLoadSuccessToast(true);
        } else {
          throw new Error('Invalid build data structure');
        }
      } else {
        console.log('Build not found response');
        throw new Error('Build not found');
      }
    } catch (error) {
      console.error('Error loading build:', error);
      setLoadErrorMessage('Failed to load build. Please make sure the build exists and try again.');
      setShowLoadErrorToast(true);
    } finally {
      setIsLoadingBuild(false);
    }
  }, [isLoadingBuild]);

  // Load build from URL if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const buildId = urlParams.get('loadBuild');
    console.log('URL Params:', urlParams.toString());
    if (buildId && !isLoadingBuild) {
      loadBuild(buildId);
      console.log("Loading build from URL:", buildId);
      // Remove the loadBuild parameter from URL after loading
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [loadBuild, isLoadingBuild]);

  // Function to scroll to performance section
  const scrollToPerformance = () => {
    const performanceSection = document.querySelector('[data-section="performance"]');
    if (performanceSection) {
      performanceSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      setShowPerformanceIndicator(false);
    }
  };

  // Check if performance section is in view
  useEffect(() => {
    const handleScroll = () => {
      const performanceSection = document.querySelector('[data-section="performance"]');
      if (performanceSection) {
        const rect = performanceSection.getBoundingClientRect();
        const isInView = rect.top <= window.innerHeight && rect.bottom >= 0;
        setShowPerformanceIndicator(!isInView);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleComponentSelect = (
    type: 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery' | 'customWeight',
    name: string,
    data: Motor | Frame | Stack | Camera | Prop | Battery | CustomWeight
  ) => {
    if (type === 'customWeight') {
      setSelectedComponents(prev => {
        const existing = prev.customWeights || [];
        const isSelected = existing.some(w => w.name === name);
        if (isSelected) {
          return { ...prev, customWeights: existing.filter(w => w.name !== name) };
        } else {
          return { ...prev, customWeights: [...existing, { name, data: data as CustomWeight }] };
        }
      });
    } else {
      setSelectedComponents(prev => ({ ...prev, [type]: { name, data } }));
    }
  };

  const handleClearBuild = () => {
    setSelectedComponents({});
  };

  const handleSaveBuild = async (buildName: string, description: string, isPublic: boolean, tags: string[]) => {
    if (!session) {
      setSaveErrorMessage('Please sign in to save builds');
      setShowSaveErrorToast(true);
      return;
    }
    
    try {
      const response = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: buildName,
          description: description || null,
          components: selectedComponents,
          performance,
          isPublic,
          tags
        })
      });

      if (response.ok) {
        window.location.href = `/dashboard`;
      } else {
        throw new Error('Failed to save build');
      }
    } catch (error) {
      console.error('Error saving build:', error);
      setSaveErrorMessage('Failed to save build. Please try again.');
      setShowSaveErrorToast(true);
    }
  };

  const tabs: { key: keyof DroneComponents; label: string; icon: string }[] = [
    { key: 'Motors', label: 'Motors', icon: '⚡' },
    { key: 'Frames', label: 'Frames', icon: '🔧' },
    { key: 'Stacks', label: 'Flight Controllers', icon: '💻' },
    { key: 'Camera', label: 'Cameras', icon: '📹' },
    { key: 'Props', label: 'Propellers', icon: '🌀' },
    { key: 'Batteries', label: 'Batteries', icon: '🔋' },
    { key: 'Simple Weight', label: 'Simple Weight', icon: '⚖️' }
  ];

  const checkComponentCompatibility = () => true;

  return (
  <div className="min-h-screen bg-gray-50 transition-colors">
      {/* Header */}
  <header className="bg-white border-b border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-all duration-300 transform hover:scale-105">
                DronePartPicker
              </Link>
              {isLoadingBuild && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm font-medium">Loading build...</span>
                </div>
              )}
              <nav className="hidden md:flex space-x-6">
                <Link href="/builds/public" className="text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 hover:scale-105">
                  Public Builds
                </Link>
                <Link href="/parts/custom" className="text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 hover:scale-105">
                  Custom Parts
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
                  className="text-gray-700 hover:text-gray-900 p-2 transition-all duration-200 hover:scale-110"
                >
                  ⚙️
                </button>
              </div>
              <AuthControls />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-3 gap-6">
          {/* Component Selection */}
          <div className="xl:col-span-2 lg:col-span-2">
            <div className="bg-white rounded-lg shadow border border-gray-200 transition-all duration-300 hover:shadow-lg">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Component Selection</h3>
              </div>

              {/* Component Tabs */}
              <div className="border-b border-gray-200 bg-gray-50 relative">
                {/* Scroll indicators with arrows */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 via-gray-50/80 to-transparent z-10 pointer-events-none flex items-center">
                  <div className="text-gray-600 text-xs ml-1">‹</div>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 via-gray-50/80 to-transparent z-10 pointer-events-none flex items-center justify-end">
                  <div className="text-gray-600 text-xs mr-1">›</div>
                </div>
                
                <nav className="flex overflow-x-auto px-2 pt-2 pb-3 scroll-smooth custom-scrollbar" style={{ scrollBehavior: 'smooth' }}>
                  {tabs.map((tab) => (
                    <button
                      key={String(tab.key)}
                      onClick={() => setActiveTab(tab.key)}
      className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-3 mx-1 rounded-lg transition-all duration-300 ease-in-out whitespace-nowrap text-sm sm:text-base transform hover:scale-105 ${
            activeTab === tab.key
        ? 'bg-blue-600 text-white shadow-lg scale-105'
              : 'text-gray-700 hover:text-gray-900 hover:bg-white hover:shadow-md'
            }`}
                      style={{ 
                        minWidth: 'fit-content',
                      }}
                    >
                      <span className="text-sm sm:text-base transition-transform duration-200">{tab.icon}</span>
                      <span className="hidden sm:inline font-medium">{tab.label}</span>
                      <span className="sm:hidden text-xs font-medium">{tab.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <input
                  type="text"
                  placeholder={`Search ${tabs.find(t => t.key === activeTab)?.label.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg text-sm sm:text-base transition-all duration-300 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:bg-white"
                />
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg whitespace-nowrap text-sm sm:text-base transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95"
                >
                  <span className="sm:hidden">+ Add</span>
                  <span className="hidden sm:inline">+ Add Custom</span>
                </button>
              </div>

              {/* Enhanced Component Grid with scraped products */}
              <EnhancedComponentGrid
                activeTab={activeTab}
                searchTerm={searchTerm}
                selectedComponents={selectedComponents}
                onComponentSelect={handleComponentSelect}
                checkCompatibility={checkComponentCompatibility}
              />
            </div>
          </div>




          {/* Sidebar */}
          <div className="xl:col-span-1 lg:col-span-1">
            <div className="transition-all duration-500 ease-out transform hover:scale-102">
              <BuildSummary
                selectedComponents={selectedComponents}
                onClearBuild={handleClearBuild}
                onSaveBuild={handleSaveBuild}
              />
            </div>
          </div>
        </div>

        {/* Modern Fixed Performance Indicator */}
        {showPerformanceIndicator && 
         performance && 
         selectedComponents.motor && 
         selectedComponents.frame && 
         selectedComponents.stack && 
         selectedComponents.prop && 
         selectedComponents.battery && (
      <div className="fixed bottom-6 right-6 z-50 animate-in">
            <div 
              onClick={scrollToPerformance}
        className="group bg-white/95 backdrop-blur-md border border-gray-200/60 rounded-full p-3 sm:p-4 shadow-lg hover:shadow-xl cursor-pointer transition-all duration-300 hover:scale-105 flex items-center gap-2 sm:gap-3 hover:bg-white"
              style={{ 
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2)' 
              }}
            >
        <div className="text-gray-700 text-xs sm:text-sm font-medium hidden sm:block group-hover:text-green-600 transition-colors duration-200">
                View Performance
              </div>
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-all duration-200 group-hover:shadow-sm">
                <div className="text-green-600 text-base sm:text-lg animate-bounce-arrow">📊</div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Panel */}
        {performance && (
          <div className="mt-6 transition-all duration-700 ease-out animate-in" data-section="performance">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 transition-all duration-500">Performance Analysis</h2>
            <div className="transition-all duration-700 ease-out transform">
              <PerformancePanel performance={performance} />
            </div>
          </div>
        )}

        {/* Advanced Settings */}
  <AdvancedSettingsComponent
          settings={advancedSettings}
          onSettingsChange={setAdvancedSettings}
          isOpen={isAdvancedSettingsOpen}
          onToggle={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
        />

        {/*  Component Modal */}
        <AddComponentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={(category: string, name: string, specs: Record<string, string | number>) => {
            console.log('Custom component added:', { category, name, specs });
            // TODO: Save to database instead of local state
            setIsAddModalOpen(false);
          }}
        />

        <Toast
          message="🎉 Your drone build is complete! Check out the performance analysis below."
          type="success"
          isVisible={showBuildCompleteToast}
          onClose={() => setShowBuildCompleteToast(false)}
          action={{
            label: "View Performance →",
            onClick: () => {
              scrollToPerformance();
              setShowBuildCompleteToast(false);
            }
          }}
        />

        <Toast
          message="✅ Build loaded successfully!"
          type="success"
          isVisible={showLoadSuccessToast}
          onClose={() => setShowLoadSuccessToast(false)}
        />

        <Toast
          message={loadErrorMessage}
          type="error"
          isVisible={showLoadErrorToast}
          onClose={() => setShowLoadErrorToast(false)}
        />

        <Toast
          message={saveErrorMessage}
          type="error"
          isVisible={showSaveErrorToast}
          onClose={() => setShowSaveErrorToast(false)}
        />

        <Footer />
      </div>
    </div>
  );
}