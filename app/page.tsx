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

  if (status === 'loading') {
    return (
      <div className="rounded-lg border border-slate-200/80 bg-white/90 px-3 py-1.5 text-sm text-slate-500 shadow-sm">
        Loading account...
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg border border-slate-300/70 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
        >
          My Builds
        </Link>
        {userProfile?.username && (
          <>
            <Link
              href={`/profile/${userProfile.username}`}
              className="hidden rounded-lg border border-slate-300/70 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700 md:inline-flex"
            >
              Profile
            </Link>
            <span className="hidden max-w-[160px] truncate text-sm text-slate-600 lg:block">Hi, {userProfile.username}</span>
          </>
        )}
        {isAdmin && (
          <Link 
            href="/admin" 
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
          >
            Admin
          </Link>
        )}
        <button
          onClick={() => signOut()}
          className="rounded-lg border border-slate-300/80 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-100"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Link
        href="/auth/signin"
        className="rounded-lg border border-slate-300/80 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
      >
        Sign In
      </Link>
      <Link
        href="/auth/signup"
        className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700"
      >
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

  const tabs: { key: keyof DroneComponents; label: string; short: string }[] = [
    { key: 'Motors', label: 'Motors', short: 'Motors' },
    { key: 'Frames', label: 'Frames', short: 'Frames' },
    { key: 'Stacks', label: 'Flight Controllers', short: 'Stacks' },
    { key: 'Camera', label: 'Cameras', short: 'Camera' },
    { key: 'Props', label: 'Propellers', short: 'Props' },
    { key: 'Batteries', label: 'Batteries', short: 'Battery' },
    { key: 'Simple Weight', label: 'Simple Weight', short: 'Weight' }
  ];

  const checkComponentCompatibility = () => true;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link
                href="/"
                className="text-xl font-semibold tracking-tight text-slate-900 transition-colors hover:text-blue-700 sm:text-2xl"
              >
                DronePartPicker
              </Link>
              {isLoadingBuild && (
                <div className="flex items-center space-x-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-xs font-semibold sm:text-sm">Loading build...</span>
                </div>
              )}
              <nav className="hidden md:flex items-center space-x-2">
                <Link href="/builds/public" className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-blue-700">
                  Builds
                </Link>
                <Link href="/parts/custom" className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-blue-700">
                  Custom Parts
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
                  className="rounded-lg border border-slate-300/80 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
                  aria-label="Toggle advanced settings"
                >
                  Settings
                </button>
              </div>
              <AuthControls />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-3 gap-6">
          {/* Component Selection */}
          <div className="xl:col-span-2 lg:col-span-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-lg shadow-slate-900/5 backdrop-blur-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-slate-900/10">
              <div className="border-b border-slate-200 bg-white/80 p-5">
                <h3 className="text-xl font-semibold tracking-tight text-slate-900">Select Components</h3>
                <p className="mt-1 text-sm text-slate-600">Configure your build with validated part data.</p>
              </div>

              {/* Component Tabs */}
              <div className="relative border-b border-slate-200 bg-slate-50/80">
                {/* Scroll indicators with arrows */}
                <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 flex w-8 items-center bg-gradient-to-r from-slate-100 via-slate-100/80 to-transparent">
                  <div className="ml-1 text-xs text-slate-400">‹</div>
                </div>
                <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 flex w-8 items-center justify-end bg-gradient-to-l from-slate-100 via-slate-100/80 to-transparent">
                  <div className="mr-1 text-xs text-slate-400">›</div>
                </div>
                
                <nav className="flex overflow-x-auto px-2 pt-2 pb-3 scroll-smooth custom-scrollbar" style={{ scrollBehavior: 'smooth' }}>
                  {tabs.map((tab) => (
                    <button
                      key={String(tab.key)}
                      onClick={() => setActiveTab(tab.key)}
                      className={`mx-1 flex items-center gap-1 whitespace-nowrap rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200 sm:gap-2 sm:px-4 sm:text-[15px] ${
            activeTab === tab.key
                          ? 'scale-[1.02] border-blue-300 bg-blue-600 text-white shadow-md shadow-blue-600/25'
                          : 'border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900 hover:shadow-sm'
            }`}
                      style={{ 
                        minWidth: 'fit-content',
                      }}
                    >
                      <span className="hidden sm:inline font-medium">{tab.label}</span>
                      <span className="sm:hidden text-xs font-medium">{tab.short}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Search */}
              <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:gap-4">
                <input
                  type="text"
                  placeholder={`Search ${tabs.find(t => t.key === activeTab)?.label.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300/80 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:text-base"
                />
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="whitespace-nowrap rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 sm:text-base"
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
            <div className="transition-all duration-300 ease-out hover:translate-y-[-1px]">
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
        className="group flex cursor-pointer items-center gap-2 rounded-full border border-slate-200/90 bg-white/95 p-3 shadow-lg shadow-slate-900/10 backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:shadow-xl sm:gap-3 sm:p-4"
              style={{ 
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.2)' 
              }}
            >
        <div className="hidden text-xs font-semibold text-slate-700 transition-colors duration-200 group-hover:text-emerald-700 sm:block sm:text-sm">
                Check Performance
              </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 transition-all duration-200 group-hover:bg-emerald-200 group-hover:shadow-sm sm:h-8 sm:w-8">
                <div className="text-xs font-semibold text-emerald-700 sm:text-sm">View</div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Panel */}
        {performance && (
          <div className="mt-6 transition-all duration-700 ease-out animate-in" data-section="performance">
            <h2 className="mb-4 text-2xl font-semibold tracking-tight text-slate-900 transition-all duration-500">Performance Analysis</h2>
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
          theme="light" // Default to light theme for now
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
          message="Build configuration complete. Open the performance analysis section."
          type="success"
          isVisible={showBuildCompleteToast}
          onClose={() => setShowBuildCompleteToast(false)}
          action={{
            label: "Open analysis",
            onClick: () => {
              scrollToPerformance();
              setShowBuildCompleteToast(false);
            }
          }}
        />

        <Toast
          message="Build loaded successfully."
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