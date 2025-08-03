'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { DroneComponents, SelectedComponents, PerformanceEstimate, Motor, Frame, Stack, Camera, Prop, Battery, CustomWeight } from '@/types/drone';
import { DroneCalculator } from '@/utils/droneCalculator';
import ComponentCard from '@/components/ComponentCard';
import PerformancePanel from '@/components/PerformancePanel';
import BuildSummary from '@/components/BuildSummary';
import AddComponentModal from '@/components/AddComponentModal';
import Footer from '@/components/Footer';
import AdvancedSettingsComponent from '@/components/AdvancedSettings';
import { AdvancedSettings, defaultAdvancedSettings } from '@/types/advancedSettings';
import droneData from '../list.json';

const componentData: DroneComponents = droneData as DroneComponents;

// Auth Controls Component
function AuthControls() {
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState<{username?: string} | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session?.user?.email) {
        try {
          // Generate or get username for the user
          const generateResponse = await fetch('/api/users/generate-username', {
            method: 'POST'
          });
          if (generateResponse.ok) {
            const generateData = await generateResponse.json();
            setUserProfile({ username: generateData.username });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [session]);

  if (status === 'loading') {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard"
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          My Builds
        </Link>
        {userProfile && (
          <Link 
            href={userProfile.username ? `/profile/${userProfile.username}` : '#'}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            My Profile
          </Link>
        )}
        {userProfile?.username && (
          <span className="text-gray-600">Welcome, {userProfile.username}</span>
        )}
        <button
          onClick={() => signOut()}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/auth/signin"
        className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        Sign In
      </Link>
      <Link
        href="/auth/signup"
        className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors"
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
  const [customComponents, setCustomComponents] = useState<DroneComponents>({
    Motors: {},
    Frames: {},
    Stacks: {},
    Camera: {},
    Props: {},
    Batteries: {},
    'Simple Weight': {}
  });

  useEffect(() => {
    setPerformance(DroneCalculator.calculatePerformance(selectedComponents, advancedSettings));
  }, [selectedComponents, advancedSettings]);

  useEffect(() => {
    // Check for loadBuild URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const buildId = urlParams.get('loadBuild');
    if (buildId && session) {
      loadBuild(buildId);
    }
  }, [session]);

  const loadBuild = async (buildId: string) => {
    try {
      const response = await fetch(`/api/builds/${buildId}`);
      if (response.ok) {
        const build = await response.json();
        setSelectedComponents(build.components || {});
        // Clear the URL parameter
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (error) {
      console.error('Error loading build:', error);
      alert('Failed to load build');
    }
  };

  const handleComponentSelect = (
    type: 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery' | 'customWeight',
    name: string,
    data: Motor | Frame | Stack | Camera | Prop | Battery | CustomWeight
  ) => {
    if (type === 'customWeight') {
      // Handle custom weights as an array
      setSelectedComponents(prev => {
        const existingWeights = prev.customWeights || [];
        // Check if this weight is already selected
        const isAlreadySelected = existingWeights.some(w => w.name === name);
        if (isAlreadySelected) {
          return {
            ...prev,
            customWeights: existingWeights.filter(w => w.name !== name)
          };
        } else {
          // Add it to the array
          return {
            ...prev,
            customWeights: [...existingWeights, { name, data: data as CustomWeight }]
          };
        }
      });
    } else {
      setSelectedComponents(prev => ({
        ...prev,
        [type]: { name, data }
      }));
    }
  };

  const handleClearBuild = () => {
    setSelectedComponents({});
  };

  const handleSaveBuild = async (buildName: string, description: string, isPublic: boolean, tags: string[]) => {
    if (!session) {
      alert('Please sign in to save builds');
      return;
    }
    
    try {
      const response = await fetch('/api/builds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        await response.json();
        if (isPublic) {

        } else {
          window.location.href = `/dashboard`;
        }
        // handleClearBuild();
      } else {
        throw new Error('Failed to save build');
      }
    } catch (error) {
      console.error('Error saving build:', error);
      alert('Failed to save build. Please try again.');
    }
  };

  const handleAddCustomComponent = (category: string, name: string, specs: Record<string, string | number>) => {
    setCustomComponents(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof DroneComponents],
        [name]: specs
      }
    }));
  };

  // Merge component data with custom components
  const getAllComponents = (category: keyof DroneComponents) => {
    return {
      ...componentData[category],
      ...customComponents[category]
    };
  };

  const getFilteredComponents = (category: keyof DroneComponents) => {
    const components = getAllComponents(category);
    if (!searchTerm) return components;
    
    return Object.fromEntries(
      Object.entries(components).filter(([name]) =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const checkComponentCompatibility = () => {
    return true;
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

  type TabKey = 'Motors' | 'Frames' | 'Stacks' | 'Camera' | 'Props' | 'Batteries' | 'Simple Weight';

  const getComponentType = (tabKey: TabKey): 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery' | 'customWeight' => {
    const mapping: Record<TabKey, 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery' | 'customWeight'> = {
      'Motors': 'motor',
      'Frames': 'frame',
      'Stacks': 'stack',
      'Camera': 'camera',
      'Props': 'prop',
      'Batteries': 'battery',
      'Simple Weight': 'customWeight'
    };
    return mapping[tabKey];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="shadow-sm border-b border-gray-200 sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-gray-900">DronePartPicker</h1>
              <nav className="hidden md:flex items-center gap-4">
                <Link 
                  href="/builds/public"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Public Builds
                </Link>
                <Link 
                  href="/parts/custom"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Custom Parts
                </Link>
              </nav>
            </div>
            <AuthControls />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Performance Panel */}
        {performance && (
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Drone Performance Analysis
            </h2>
            <PerformancePanel performance={performance} />
          </div>
        )}

       

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Component Selection */}
          <div className="lg:col-span-3">
            {/* Component Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  🔧 Component Selection
                </h3>
                <p className="text-sm text-gray-600">Choose components to build your custom drone configuration</p>
              </div>



 

              {/* Modern Tabs */}
              <div className="border-b border-gray-200 bg-gray-50">
                <nav className="flex overflow-x-auto p-2">
                  {tabs.map((tab) => (
                    <button
                      key={String(tab.key)}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-3 px-6 py-4 text-sm font-medium whitespace-nowrap rounded-xl mx-1 transition-all duration-300 min-w-fit ${
                        activeTab === tab.key
                          ? 'bg-black text-white shadow-lg transform scale-105'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-md'
                      }`}
                    >
                      <span className="text-xl">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>



              {/*  Search */}
              <div className="p-6 border-b border-gray-200 flex gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={`Search ${tabs.find(t => t.key === activeTab)?.label.toLowerCase()}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 focus:bg-white transition-all duration-200"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🔍
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-800 text-white rounded-xl transition-all duration-200 flex items-center gap-3 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <span className="text-lg">+</span>
                  Add Custom
                </button>
              </div>

              {/* Component Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {Object.entries(getFilteredComponents(activeTab)).map(([name, component]) => {
                    const tabKeys: TabKey[] = ['Motors', 'Frames', 'Stacks', 'Camera', 'Props', 'Batteries', 'Simple Weight'];
                    if (!tabKeys.includes(activeTab as TabKey)) return null;
                    const type = getComponentType(activeTab as TabKey);
                    return (
                      <ComponentCard
                        key={name}
                        name={name}
                        component={component}
                        type={type}
                        isSelected={
                          type === 'customWeight' 
                            ? (selectedComponents.customWeights || []).some(w => w.name === name)
                            : selectedComponents[type as keyof Omit<SelectedComponents, 'customWeights'>]?.name === name
                        }
                        onSelect={() => handleComponentSelect(type, name, component)}
                        isCompatible={checkComponentCompatibility()}
                      />
                    );
                  })}
                </div>
                
                {Object.keys(getFilteredComponents(activeTab)).length === 0 && (
                  <div className="text-center py-16">
                    <div className="text-gray-300 text-6xl mb-6">🔍</div>
                    <p className="text-gray-500 font-medium text-lg">No components found matching &quot;{searchTerm}&quot;</p>
                    <p className="text-gray-400 text-sm mt-2">Try adjusting your search terms or browse different categories</p>
                  </div>
                )}
              </div>
            </div>
          </div>




          {/* Compact Sidebar */}
          <div className="lg:col-span-1">
            <BuildSummary
              selectedComponents={selectedComponents}
              onClearBuild={handleClearBuild}
              onSaveBuild={handleSaveBuild}
            />
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <AdvancedSettingsComponent
        settings={advancedSettings}
        onSettingsChange={setAdvancedSettings}
        isOpen={isAdvancedSettingsOpen}
        onToggle={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
      />

      {/* Add Component Modal */}
      <AddComponentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCustomComponent}
      />

      <Footer />
    </div>
  );
}