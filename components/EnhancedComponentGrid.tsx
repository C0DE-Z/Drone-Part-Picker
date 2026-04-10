'use client';

import React, { useState, useEffect } from 'react';
import { DroneComponents, SelectedComponents, Motor, Frame, Stack, Camera, Prop, Battery, CustomWeight } from '@/types/drone';
import { getComponentDataService } from '@/services/ComponentDataService';
import ComponentGrid from './ComponentGrid';

type ComponentType = Motor | Frame | Stack | Camera | Prop | Battery | CustomWeight;

interface EnhancedComponentGridProps {
  activeTab: keyof DroneComponents;
  searchTerm: string;
  selectedComponents: SelectedComponents;
  onComponentSelect: (
    type: 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery' | 'customWeight',
    name: string,
    data: ComponentType
  ) => void;
  checkCompatibility: () => boolean;
}

const componentDataService = getComponentDataService();

export default function EnhancedComponentGrid({
  activeTab,
  searchTerm,
  selectedComponents,
  onComponentSelect,
  checkCompatibility
}: EnhancedComponentGridProps) {
  const [components, setComponents] = useState<Record<string, ComponentType>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadComponents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const componentData = await componentDataService.getComponentsByType(activeTab);
        
        if (isMounted) {
          setComponents(componentData as Record<string, ComponentType>);
        }
      } catch (err) {
        console.error('Failed to load components:', err);
        if (isMounted) {
          setError('Failed to load some components');
          // Fallback to default components
          const defaultComponents = componentDataService.getAllComponentsSync();
          setComponents(defaultComponents[activeTab]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadComponents();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const getFilteredComponents = () => {
    if (!searchTerm) return components;
    
    return Object.fromEntries(
      Object.entries(components).filter(([name]) =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const getComponentType = (tabKey: keyof DroneComponents): 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery' | 'customWeight' => {
    const mapping: Record<keyof DroneComponents, 'motor' | 'frame' | 'stack' | 'camera' | 'prop' | 'battery' | 'customWeight'> = {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <div className="text-sm font-medium text-slate-700">Loading components...</div>
        <div className="mt-1 text-xs text-slate-500">Including real-world pricing and scraped products</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="mb-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">{error}</div>
        <div className="text-xs text-slate-500">Showing default components only</div>
        <ComponentGrid
          components={getFilteredComponents()}
          type={getComponentType(activeTab)}
          selectedComponents={selectedComponents}
          onComponentSelect={onComponentSelect}
          checkCompatibility={checkCompatibility}
          searchTerm={searchTerm}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      {Object.keys(components).length > 0 && (
        <div className="mb-2 text-right">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            {Object.keys(components).length} components available
          </span>
        </div>
      )}
      <ComponentGrid
        components={getFilteredComponents()}
        type={getComponentType(activeTab)}
        selectedComponents={selectedComponents}
        onComponentSelect={onComponentSelect}
        checkCompatibility={checkCompatibility}
        searchTerm={searchTerm}
      />
    </div>
  );
}
