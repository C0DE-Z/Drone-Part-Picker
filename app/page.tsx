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
    if (session?.user?.email) {
      // Generate username for the user
      fetch('/api/users/generate-username', { method: 'POST' })
        .then(res => res.json())
        .then(data => setUserProfile({ username: data.username }))
        .catch(err => console.error('Error:', err));
    }
  }, [session]);

  if (status === 'loading') return <div>Loading...</div>;

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
          My Builds
        </Link>
        {userProfile?.username && (
          <>
            <Link href={`/profile/${userProfile.username}`} className="text-gray-600 hover:text-gray-900">
              Profile
            </Link>
            <span className="text-gray-600">Hi, {userProfile.username}</span>
          </>
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
      <Link href="/auth/signin" className="px-4 py-2 text-gray-600 hover:text-gray-900">
        Sign In
      </Link>
      <Link href="/auth/signup" className="px-4 py-2 bg-black text-white rounded">
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

  const handleAddCustomComponent = (category: string, name: string, specs: Record<string, string | number>) => {
    setCustomComponents(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof DroneComponents],
        [name]: specs
      }
    }));
  };

  // Update performance when components change
  useEffect(() => {
    setPerformance(DroneCalculator.calculatePerformance(selectedComponents, advancedSettings));
  }, [selectedComponents, advancedSettings]);

  // Load build from URL if present
  useEffect(() => {
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
      alert('Please sign in to save builds');
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
      alert('Failed to save build. Please try again.');
    }
  };

  // Merge regular and custom components
  const getAllComponents = (category: keyof DroneComponents) => {
    return { ...componentData[category], ...customComponents[category] };
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">DronePartPicker</h1>
            <AuthControls />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Performance Panel */}
        {performance && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Performance Analysis</h2>
            <PerformancePanel performance={performance} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Component Selection */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow border">
              <div className="p-4 border-b">
                <h3 className="text-xl font-bold">Component Selection</h3>
              </div>

              {/* Component Tabs */}
              <div className="border-b bg-gray-50">
                <nav className="flex overflow-x-auto p-2">
                  {tabs.map((tab) => (
                    <button
                      key={String(tab.key)}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 px-4 py-3 mx-1 rounded-lg transition-colors ${
                        activeTab === tab.key
                          ? 'bg-black text-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Search */}
              <div className="p-4 border-b flex gap-4">
                <input
                  type="text"
                  placeholder={`Search ${tabs.find(t => t.key === activeTab)?.label.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-50 border rounded-lg"
                />
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black"
                >
                  + Add Custom
                </button>
              </div>

              {/* Component Grid */}
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <div className="text-gray-300 text-4xl mb-4">🔍</div>
                    <p className="text-gray-500">No components found matching &quot;{searchTerm}&quot;</p>
                  </div>
                )}
              </div>
            </div>
          </div>




          {/* Sidebar */}
          <div className="lg:col-span-1">
            <BuildSummary
              selectedComponents={selectedComponents}
              onClearBuild={handleClearBuild}
              onSaveBuild={handleSaveBuild}
            />
          </div>
        </div>

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
          onAdd={handleAddCustomComponent}
        />

        <Footer />
      </div>
    </div>
  );
}