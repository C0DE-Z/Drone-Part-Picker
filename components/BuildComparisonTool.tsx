'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, TrendingUp, Star, DollarSign } from 'lucide-react';
import { PerformanceEstimate } from '@/types/drone';

interface BuildData {
  id: string;
  name: string;
  components: {
    motor?: { name: string; data: Record<string, unknown> };
    frame?: { name: string; data: Record<string, unknown> };
    stack?: { name: string; data: Record<string, unknown> };
    camera?: { name: string; data: Record<string, unknown> };
    prop?: { name: string; data: Record<string, unknown> };
    battery?: { name: string; data: Record<string, unknown> };
  };
  performance?: PerformanceEstimate;
  estimatedCost?: number;
  tags?: string[];
}

interface ComparisonMetric {
  label: string;
  key: keyof PerformanceEstimate;
  unit: string;
  higherIsBetter: boolean;
  format?: (value: unknown) => string;
}

const comparisonMetrics: ComparisonMetric[] = [
  { label: 'Flight Time', key: 'estimatedFlightTime', unit: 'min', higherIsBetter: true },
  { label: 'Top Speed', key: 'estimatedTopSpeed', unit: 'km/h', higherIsBetter: true },
  { label: 'Thrust-to-Weight', key: 'thrustToWeightRatio', unit: ':1', higherIsBetter: true },
  { label: 'Total Weight', key: 'totalWeight', unit: 'g', higherIsBetter: false },
  { label: 'Power Consumption', key: 'powerConsumption', unit: 'W', higherIsBetter: false },
  { label: 'Max Thrust', key: 'maxThrust', unit: 'kg', higherIsBetter: true },
];

interface BuildComparisonToolProps {
  initialBuilds?: BuildData[];
  onAddBuild?: () => void;
}

export default function BuildComparisonTool({ initialBuilds = [], onAddBuild }: BuildComparisonToolProps) {
  const [builds, setBuilds] = useState<BuildData[]>(initialBuilds);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['estimatedFlightTime', 'thrustToWeightRatio', 'totalWeight']);
  const [comparisonMode, setComparisonMode] = useState<'performance' | 'components' | 'cost'>('performance');

  // Generate mock builds for demonstration
  useEffect(() => {
    if (builds.length === 0) {
      const mockBuilds: BuildData[] = [
        {
          id: '1',
          name: 'Racing Beast',
          components: {
            motor: { name: 'EMAX RS2205 2300KV', data: {} },
            frame: { name: 'TBS Source One V3', data: {} },
            stack: { name: 'Matek F722-SE', data: {} },
            prop: { name: 'HQProp 5x4.3x3', data: {} },
            battery: { name: '4S 1500mAh 100C', data: {} },
          },
          performance: {
            totalWeight: 485,
            thrustToWeightRatio: 2.8,
            maxThrust: 1.36,
            maxThrustGrams: 1360,
            estimatedTopSpeed: 120,
            estimatedFlightTime: 4.2,
            powerConsumption: 280,
            hovering: { throttlePercentage: 35, currentDraw: 12.5, hoverTime: 6.8 },
            motors: { kv: 2300, voltage: 14.8, estimatedRPM: 34040, propSize: '5x4.3' },
            battery: { voltage: 14.8, capacity: 1500, cells: 4, dischargeRate: 100 },
            totalPrice: 385.50,
            priceBreakdown: { motor: 89.99, frame: 45.00, stack: 89.99, prop: 8.99, battery: 55.99 },
            compatibility: { propMotorMatch: true, voltageMatch: true, mountingMatch: true, frameStackMatch: true }
          },
          estimatedCost: 385.50,
          tags: ['racing', 'performance', 'lightweight']
        },
        {
          id: '2',
          name: 'Freestyle Pro',
          components: {
            motor: { name: 'T-Motor F60 Pro IV 2207', data: {} },
            frame: { name: 'iFlight Nazgul5 V2', data: {} },
            stack: { name: 'iFlight SucceX-E F7', data: {} },
            prop: { name: 'Gemfan 51466', data: {} },
            battery: { name: '4S 1800mAh 75C', data: {} },
          },
          performance: {
            totalWeight: 520,
            thrustToWeightRatio: 2.6,
            maxThrust: 1.35,
            maxThrustGrams: 1350,
            estimatedTopSpeed: 115,
            estimatedFlightTime: 5.8,
            powerConsumption: 265,
            hovering: { throttlePercentage: 38, currentDraw: 11.8, hoverTime: 8.2 },
            motors: { kv: 1750, voltage: 14.8, estimatedRPM: 25900, propSize: '5.1x4.6' },
            battery: { voltage: 14.8, capacity: 1800, cells: 4, dischargeRate: 75 },
            totalPrice: 425.75,
            priceBreakdown: { motor: 125.99, frame: 65.00, stack: 95.99, prop: 12.99, battery: 65.99 },
            compatibility: { propMotorMatch: true, voltageMatch: true, mountingMatch: true, frameStackMatch: true }
          },
          estimatedCost: 425.75,
          tags: ['freestyle', 'durable', 'versatile']
        }
      ];
      setBuilds(mockBuilds);
    }
  }, [builds.length]);

  const getMetricColor = (value: unknown, metric: ComparisonMetric, bestValue: number | null) => {
    if (bestValue === null || typeof value !== 'number') return 'text-gray-600';
    
    const isBest = value === bestValue;
    if (isBest) return 'text-green-600 font-semibold';
    
    return 'text-gray-600';
  };

  const getBestValue = (metric: ComparisonMetric): number | null => {
    const values = builds
      .map(build => build.performance?.[metric.key])
      .filter((value): value is number => typeof value === 'number');
    
    if (values.length === 0) return null;
    
    return metric.higherIsBetter ? Math.max(...values) : Math.min(...values);
  };

  const removeBuild = (buildId: string) => {
    setBuilds(builds.filter(build => build.id !== buildId));
  };

  const toggleMetric = (metricKey: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricKey) 
        ? prev.filter(m => m !== metricKey)
        : [...prev, metricKey]
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Build Comparison Tool</h1>
            <p className="text-gray-600 mt-1">Compare drone builds side by side to find the perfect setup</p>
          </div>
          <button
            onClick={onAddBuild}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Build
          </button>
        </div>

        {/* Comparison Mode Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6">
          {[
            { key: 'performance', name: 'Performance', icon: <TrendingUp className="w-4 h-4" /> },
            { key: 'components', name: 'Components', icon: <Star className="w-4 h-4" /> },
            { key: 'cost', name: 'Cost Analysis', icon: <DollarSign className="w-4 h-4" /> }
          ].map((mode) => (
            <button
              key={mode.key}
              onClick={() => setComparisonMode(mode.key as 'performance' | 'components' | 'cost')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                comparisonMode === mode.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {mode.icon}
              {mode.name}
            </button>
          ))}
        </div>
      </div>

      {/* Build Comparison */}
      {builds.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Performance Comparison */}
          {comparisonMode === 'performance' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
                <div className="flex gap-2 flex-wrap">
                  {comparisonMetrics.map((metric) => (
                    <button
                      key={metric.key}
                      onClick={() => toggleMetric(metric.key)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedMetrics.includes(metric.key)
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {metric.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Build</th>
                      {selectedMetrics.map((metricKey) => {
                        const metric = comparisonMetrics.find(m => m.key === metricKey);
                        return (
                          <th key={metricKey} className="text-center py-3 px-4 font-semibold text-gray-900">
                            {metric?.label}
                            <span className="block text-xs font-normal text-gray-500">
                              ({metric?.unit})
                            </span>
                          </th>
                        );
                      })}
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {builds.map((build) => (
                      <tr key={build.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-semibold text-gray-900">{build.name}</div>
                            <div className="text-sm text-gray-500">{build.tags?.join(', ')}</div>
                          </div>
                        </td>
                        {selectedMetrics.map((metricKey) => {
                          const metric = comparisonMetrics.find(m => m.key === metricKey);
                          const value = build.performance?.[metricKey as keyof PerformanceEstimate];
                          const bestValue = getBestValue(metric!);
                          
                          return (
                            <td key={metricKey} className="text-center py-4 px-4">
                              <span className={getMetricColor(value, metric!, bestValue)}>
                                {metric?.format ? metric.format(value) : String(value)}
                              </span>
                            </td>
                          );
                        })}
                        <td className="text-center py-4 px-4">
                          <button
                            onClick={() => removeBuild(build.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Components Comparison */}
          {comparisonMode === 'components' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Component Breakdown</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Component</th>
                      {builds.map((build) => (
                        <th key={build.id} className="text-center py-3 px-4 font-semibold text-gray-900">
                          {build.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {['motor', 'frame', 'stack', 'prop', 'battery'].map((componentType) => (
                      <tr key={componentType} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium text-gray-900 capitalize">
                          {componentType}
                        </td>
                        {builds.map((build) => {
                          const component = build.components[componentType as keyof typeof build.components];
                          return (
                            <td key={build.id} className="text-center py-4 px-4">
                              <div className="text-sm">
                                {component ? component.name : 'Not selected'}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cost Analysis */}
          {comparisonMode === 'cost' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Cost Analysis</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {builds.map((build) => (
                  <div key={build.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">{build.name}</h4>
                      <span className="text-lg font-bold text-green-600">
                        ${build.estimatedCost?.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {build.performance?.priceBreakdown && Object.entries(build.performance.priceBreakdown).map(([component, price]) => (
                        <div key={component} className="flex justify-between">
                          <span className="capitalize text-gray-600">{component}:</span>
                          <span className="font-medium">${price?.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Star className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No builds to compare</h3>
          <p className="text-gray-600 mb-6">Add some builds to start comparing their performance and components</p>
          <button
            onClick={onAddBuild}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Add Your First Build
          </button>
        </div>
      )}
    </div>
  );
}