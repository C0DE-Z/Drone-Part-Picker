'use client';

import React, { useState } from 'react';
import { AdvancedSettings, defaultAdvancedSettings } from '../types/advancedSettings';

interface AdvancedSettingsProps {
  settings: AdvancedSettings;
  onSettingsChange: (settings: AdvancedSettings) => void;
  isOpen: boolean;
  onToggle: () => void;
  throttleMapUpload?: React.ReactNode;
  theme?: 'dark' | 'light';
}

export default function AdvancedSettingsComponent({
  settings,
  onSettingsChange,
  isOpen,
  onToggle,
  throttleMapUpload,
  theme = 'light'
}: AdvancedSettingsProps) {
  const [activeTab, setActiveTab] = useState<string>('environment');

  const handleNumberChange = (path: string, value: number) => {
    const pathArray = path.split('.');
    const newSettings: AdvancedSettings = JSON.parse(JSON.stringify(settings));
    let cursor: unknown = newSettings;
    for (let i = 0; i < pathArray.length - 1; i++) {
      const key = pathArray[i];
      if (typeof cursor === 'object' && cursor !== null && key in (cursor as Record<string, unknown>)) {
        cursor = (cursor as Record<string, unknown>)[key];
      }
    }
    const lastKey = pathArray[pathArray.length - 1];
    if (typeof cursor === 'object' && cursor !== null) {
      (cursor as Record<string, unknown>)[lastKey] = value as unknown as never;
    }
    onSettingsChange(newSettings);
  };

  const resetToDefaults = () => {
    onSettingsChange(defaultAdvancedSettings);
  };

  const NumberInput = ({ label, path, min = 0, max = 1, step = 0.01, unit = '' }: {
    label: string;
    path: string;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
  }) => {
    const getValue = (obj: AdvancedSettings, path: string): number => {
      try {
        return path.split('.').reduce((current: unknown, key: string) => {
          if (current && typeof current === 'object' && key in current) {
            return (current as Record<string, unknown>)[key];
          }
          return 0;
        }, obj) as number;
      } catch {
        return 0;
      }
    };

    const value = getValue(settings, path);

    return (
      <div className="flex flex-col space-y-1">
        <label className={`text-xs sm:text-sm font-medium ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {label} {unit && <span className={`${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>({unit})</span>}
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => handleNumberChange(path, parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          className={`w-full px-2 py-2 sm:px-3 sm:py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-gray-100'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        />
      </div>
    );
  };

  const tabs = [
    { id: 'environment', name: 'Environment', icon: '🌍' },
    { id: 'battery', name: 'Battery', icon: '🔋' },
    { id: 'motor', name: 'Motor', icon: '⚙️' },
    { id: 'propeller', name: 'Propeller', icon: '🚁' },
    { id: 'flight', name: 'Flight Style', icon: '🎯' },
    { id: 'system', name: 'System', icon: '⚡' },
    { id: 'limits', name: 'Limits', icon: '⚠️' }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className={`fixed bottom-4 left-4 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow-lg transition-colors duration-200 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base z-40 ${
          theme === 'dark' ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        <span>⚙️</span>
        <span className="hidden sm:inline">Advanced Settings</span>
        <span className="sm:hidden">Settings</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className={`border rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b ${
          theme === 'dark'
            ? 'border-gray-700 bg-gray-800'
            : 'border-gray-200 bg-white'
        }`}>
          <h2 className={`text-lg sm:text-2xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Advanced Settings</h2>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={resetToDefaults}
              className={`px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <span className="hidden sm:inline">Reset to Defaults</span>
              <span className="sm:hidden">Reset</span>
            </button>
            <button
              onClick={onToggle}
              className={`text-xl sm:text-2xl p-1 ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-gray-200'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
        {throttleMapUpload}

        {/* Tabs */}
        <div className={`flex border-b overflow-x-auto ${
          theme === 'dark'
            ? 'border-gray-700 bg-gray-700'
            : 'border-gray-200 bg-gray-50'
        }`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors min-w-0 ${
                activeTab === tab.id
                  ? theme === 'dark'
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                    : 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : theme === 'dark'
                    ? 'text-gray-300 hover:text-gray-100'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                <span className="text-sm sm:text-base">{tab.icon}</span>
                <span className="hidden sm:inline whitespace-nowrap">{tab.name}</span>
                <span className="sm:hidden text-xs whitespace-nowrap">{tab.name.split(' ')[0]}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={`flex-1 p-4 sm:p-6 overflow-y-auto ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          {activeTab === 'environment' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className={`text-base sm:text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Environmental Conditions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <NumberInput label="Altitude" path="environment.altitude" min={-500} max={5000} step={100} unit="meters" />
                <NumberInput label="Temperature" path="environment.temperature" min={-20} max={50} step={1} unit="°C" />
                <NumberInput label="Wind Speed" path="environment.windSpeed" min={0} max={50} step={1} unit="km/h" />
                <NumberInput label="Humidity" path="environment.humidity" min={0} max={100} step={5} unit="%" />
                <NumberInput label="Air Pressure" path="environment.airPressure" min={800} max={1100} step={10} unit="hPa" />
              </div>
            </div>
          )}

          {activeTab === 'battery' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className={`text-base sm:text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Battery Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <NumberInput label="Usable Capacity Factor" path="battery.usableCapacityFactor" min={0.5} max={1.0} step={0.01} />
                <NumberInput label="Age Factor" path="battery.ageFactor" min={0.5} max={1.0} step={0.01} />
                <NumberInput label="Internal Resistance (mΩ)" path="battery.internalResistance" min={10} max={200} step={5} unit="mΩ" />
                <NumberInput label="Chemistry Factor" path="battery.chemistryFactor" min={0.8} max={1.2} step={0.01} />
              </div>
              <h4 className={`text-sm sm:text-md font-medium ${
                theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
              }`}>Temperature Efficiency</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <NumberInput label="Freezing (<0°C)" path="battery.temperatureEfficiency.freezing" min={0.5} max={1.0} step={0.01} />
                <NumberInput label="Cold (0-10°C)" path="battery.temperatureEfficiency.cold" min={0.7} max={1.0} step={0.01} />
                <NumberInput label="Optimal (20-25°C)" path="battery.temperatureEfficiency.optimal" min={0.95} max={1.0} step={0.01} />
                <NumberInput label="Hot (>35°C)" path="battery.temperatureEfficiency.hot" min={0.8} max={1.0} step={0.01} />
              </div>
            </div>
          )}

          {activeTab === 'motor' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className={`text-base sm:text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Motor Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <NumberInput label="Peak Efficiency" path="motor.efficiency.peak" min={0.7} max={0.95} step={0.01} />
                <NumberInput label="Cruise Efficiency" path="motor.efficiency.cruise" min={0.6} max={0.9} step={0.01} />
                <NumberInput label="Low Load Efficiency" path="motor.efficiency.lowLoad" min={0.4} max={0.8} step={0.01} />
                <NumberInput label="High Load Efficiency" path="motor.efficiency.highLoad" min={0.5} max={0.85} step={0.01} />
                <NumberInput label="Temperature Coefficient" path="motor.temperatureCoefficient" min={0.001} max={0.01} step={0.001} />
                <NumberInput label="Voltage Coefficient" path="motor.voltageCoefficient" min={0.5} max={1.5} step={0.1} />
              </div>
            </div>
          )}

          {activeTab === 'propeller' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className={`text-base sm:text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Propeller Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <NumberInput label="Base Efficiency" path="propeller.baseEfficiency" min={0.6} max={0.9} step={0.01} />
                <NumberInput label="Reynolds Number Factor" path="propeller.reynoldsNumberFactor" min={0.8} max={1.2} step={0.01} />
                <NumberInput label="Tip Speed Factor" path="propeller.tipSpeedFactor" min={0.7} max={1.0} step={0.01} />
                <NumberInput label="Blade Count Factor" path="propeller.bladeCountFactor" min={0.9} max={1.1} step={0.01} />
              </div>
            </div>
          )}

          {activeTab === 'flight' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className={`text-base sm:text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Flight Style Factors</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <NumberInput label="Gentle Flying" path="flightStyle.gentle" min={0.5} max={1.0} step={0.01} />
                <NumberInput label="Cruise Flying" path="flightStyle.cruise" min={0.6} max={0.9} step={0.01} />
                <NumberInput label="Sport Flying" path="flightStyle.sport" min={0.5} max={0.8} step={0.01} />
                <NumberInput label="Aerobatic Flying" path="flightStyle.aerobatic" min={0.4} max={0.7} step={0.01} />
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className={`text-base sm:text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>System Efficiency</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <NumberInput label="ESC Efficiency" path="system.escEfficiency" min={0.85} max={0.98} step={0.01} />
                <NumberInput label="Overall System Efficiency" path="system.overallSystemEfficiency" min={0.75} max={0.95} step={0.01} />
                <NumberInput label="Power Distribution Loss" path="system.powerDistributionLoss" min={0.01} max={0.1} step={0.01} />
                <NumberInput label="Wiring Resistance (mΩ)" path="system.wiringResistance" min={1} max={20} step={1} unit="mΩ" />
              </div>
            </div>
          )}

          {activeTab === 'limits' && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className={`text-base sm:text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Realistic Limits</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <NumberInput label="Maximum Flight Time" path="limits.maxFlightTime" min={10} max={120} step={5} unit="minutes" />
                <NumberInput label="Minimum Flight Time" path="limits.minFlightTime" min={0.1} max={5} step={0.1} unit="minutes" />
                <NumberInput label="Maximum Speed" path="limits.maxSpeed" min={50} max={300} step={10} unit="km/h" />
                <NumberInput label="Maximum Power" path="limits.maxPowerConsumption" min={100} max={2000} step={50} unit="watts" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
