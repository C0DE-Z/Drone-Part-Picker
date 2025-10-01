'use client';

import React, { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, DollarSign, Clock, Zap, AlertTriangle, CheckCircle, Target, Plus } from 'lucide-react';
import { PerformanceEstimate } from '@/types/drone';

interface OptimizationSuggestion {
  id: string;
  type: 'performance' | 'cost' | 'efficiency' | 'compatibility';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  currentValue?: number;
  potentialValue?: number;
  component: string;
  suggestion: string;
  estimatedCost?: number;
  difficulty: 'easy' | 'moderate' | 'advanced';
}

interface BuildOptimizationProps {
  performance?: PerformanceEstimate;
  components: Record<string, unknown>;
  goals?: {
    prioritizeFlightTime?: boolean;
    prioritizeSpeed?: boolean;
    prioritizeCost?: boolean;
    targetBudget?: number;
  };
}

export default function BuildOptimizationAssistant({ 
  performance, 
  components, 
  goals = {} 
}: BuildOptimizationProps) {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'performance' | 'cost' | 'efficiency'>('all');


  useEffect(() => {
    const generateOptimizationSuggestions = () => {
    const newSuggestions: OptimizationSuggestion[] = [];

    // Performance optimizations
    if (performance) {
      // Flight time optimization
      if (performance.estimatedFlightTime < 8) {
        newSuggestions.push({
          id: 'battery-upgrade',
          type: 'performance',
          priority: 'high',
          title: 'Upgrade to Higher Capacity Battery',
          description: 'Your current flight time is below optimal for this build class.',
          impact: 'Increase flight time by 2-4 minutes',
          currentValue: performance.estimatedFlightTime,
          potentialValue: performance.estimatedFlightTime + 3.2,
          component: 'Battery',
          suggestion: 'Consider a 25-30% higher capacity battery with similar C-rating',
          estimatedCost: 45,
          difficulty: 'easy'
        });
      }

      // Thrust-to-weight optimization
      if (performance.thrustToWeightRatio < 2.5) {
        newSuggestions.push({
          id: 'motor-upgrade',
          type: 'performance',
          priority: 'medium',
          title: 'Increase Motor Power',
          description: 'Low thrust-to-weight ratio may limit agility and response.',
          impact: 'Improve acceleration and climbing ability',
          currentValue: performance.thrustToWeightRatio,
          potentialValue: performance.thrustToWeightRatio + 0.8,
          component: 'Motor',
          suggestion: 'Upgrade to higher KV motors or larger prop size',
          estimatedCost: 80,
          difficulty: 'moderate'
        });
      }

      // Efficiency optimization
      if (performance.powerConsumption > 800) {
        newSuggestions.push({
          id: 'efficiency-props',
          type: 'efficiency',
          priority: 'medium',
          title: 'Optimize Propeller Selection',
          description: 'High power consumption suggests prop inefficiency.',
          impact: 'Reduce power by 10-15% while maintaining performance',
          currentValue: performance.powerConsumption,
          potentialValue: performance.powerConsumption * 0.85,
          component: 'Propeller',
          suggestion: 'Try lower pitch or more efficient prop design',
          estimatedCost: 20,
          difficulty: 'easy'
        });
      }

      // Weight optimization
      if (performance.totalWeight > 650) {
        newSuggestions.push({
          id: 'weight-reduction',
          type: 'performance',
          priority: 'low',
          title: 'Reduce Overall Weight',
          description: 'Heavy build may impact flight time and agility.',
          impact: 'Improve flight time and responsiveness',
          currentValue: performance.totalWeight,
          potentialValue: performance.totalWeight - 50,
          component: 'Frame/Components',
          suggestion: 'Consider carbon fiber frame or lighter stack',
          estimatedCost: 120,
          difficulty: 'advanced'
        });
      }
    }

    // Component compatibility checks
    if (components.motor && components.prop) {
      // Example compatibility check - this would be more sophisticated in real implementation
      const motorData = components.motor as { kv?: number };
      const propData = components.prop as { diameter?: number };
      const motorKV = motorData.kv || 2300;
      const propSize = propData.diameter || 5;
      
      if (motorKV > 2500 && propSize > 5.1) {
        newSuggestions.push({
          id: 'motor-prop-mismatch',
          type: 'compatibility',
          priority: 'high',
          title: 'Motor-Prop Compatibility Issue',
          description: 'High KV motor with large props may cause overheating.',
          impact: 'Prevent motor damage and improve reliability',
          component: 'Motor/Prop',
          suggestion: 'Use smaller props (5" or less) or lower KV motor',
          estimatedCost: 25,
          difficulty: 'easy'
        });
      }
    }

    // Cost optimizations
    if (goals.prioritizeCost || goals.targetBudget) {
      newSuggestions.push({
        id: 'budget-motor',
        type: 'cost',
        priority: 'medium',
        title: 'Consider Value Motors',
        description: 'Premium motors offer diminishing returns for recreational use.',
        impact: 'Save $40-60 with minimal performance loss',
        component: 'Motor',
        suggestion: 'Switch to proven budget motors like EMAX RS series',
        estimatedCost: -50,
        difficulty: 'easy'
      });
    }

    // Goal-specific suggestions
    if (goals.prioritizeFlightTime) {
      newSuggestions.push({
        id: 'efficiency-tune',
        type: 'efficiency',
        priority: 'high',
        title: 'Efficiency-Focused Tuning',
        description: 'Optimize for maximum flight time over raw performance.',
        impact: 'Increase flight time by 15-25%',
        component: 'Tuning/Props',
        suggestion: 'Use lower pitch props and efficiency-focused PID tuning',
        estimatedCost: 15,
        difficulty: 'moderate'
      });
    }

    if (goals.prioritizeSpeed) {
      newSuggestions.push({
        id: 'speed-optimization',
        type: 'performance',
        priority: 'high',
        title: 'Maximum Speed Configuration',
        description: 'Optimize build for top speed performance.',
        impact: 'Increase top speed by 10-20 km/h',
        component: 'Motor/Props',
        suggestion: 'Higher KV motors with aggressive prop pitch',
        estimatedCost: 65,
        difficulty: 'moderate'
      });
    }

    setSuggestions(newSuggestions);
  };

    if (performance && components) {
      generateOptimizationSuggestions();
    }
  }, [performance, components, goals]);

  const toggleSuggestion = (suggestionId: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestionId) 
        ? prev.filter(id => id !== suggestionId)
        : [...prev, suggestionId]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <TrendingUp className="w-5 h-5" />;
      case 'cost': return <DollarSign className="w-5 h-5" />;
      case 'efficiency': return <Zap className="w-5 h-5" />;
      case 'compatibility': return <AlertTriangle className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'advanced': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredSuggestions = suggestions.filter(suggestion => 
    activeFilter === 'all' || suggestion.type === activeFilter
  );

  const totalPotentialSavings = selectedSuggestions.reduce((total, id) => {
    const suggestion = suggestions.find(s => s.id === id);
    return total + (suggestion?.estimatedCost || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Build Optimization</h2>
            <p className="text-gray-600">AI-powered suggestions to improve your drone build</p>
          </div>
        </div>
        
        {selectedSuggestions.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <div className="text-sm font-medium text-green-800">
              {selectedSuggestions.length} optimizations selected
            </div>
            <div className="text-xs text-green-600">
              Estimated impact: {totalPotentialSavings >= 0 ? '+' : ''}${Math.abs(totalPotentialSavings)}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All Suggestions', icon: Lightbulb },
          { key: 'performance', label: 'Performance', icon: TrendingUp },
          { key: 'cost', label: 'Cost', icon: DollarSign },
          { key: 'efficiency', label: 'Efficiency', icon: Zap }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key as 'all' | 'performance' | 'cost' | 'efficiency')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === key
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span className="bg-white px-2 py-0.5 rounded-full text-xs">
              {key === 'all' ? suggestions.length : suggestions.filter(s => s.type === key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Optimization Goals */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">🎯 Optimization Goals</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-medium text-gray-900">Flight Time</div>
              <div className="text-sm text-gray-600">
                {goals.prioritizeFlightTime ? 'Priority: High' : 'Priority: Normal'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-medium text-gray-900">Performance</div>
              <div className="text-sm text-gray-600">
                {goals.prioritizeSpeed ? 'Priority: High' : 'Priority: Normal'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-yellow-600" />
            <div>
              <div className="font-medium text-gray-900">Budget</div>
              <div className="text-sm text-gray-600">
                {goals.targetBudget ? `Target: $${goals.targetBudget}` : 'No limit set'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {filteredSuggestions.map((suggestion) => (
          <div 
            key={suggestion.id}
            className={`bg-white border rounded-lg p-6 transition-all duration-200 ${
              selectedSuggestions.includes(suggestion.id)
                ? 'border-purple-300 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    {getTypeIcon(suggestion.type)}
                    <span className="font-medium">{suggestion.title}</span>
                  </div>
                  
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(suggestion.priority)}`}>
                    {suggestion.priority} priority
                  </span>
                  
                  <span className={`text-xs font-medium ${getDifficultyColor(suggestion.difficulty)}`}>
                    {suggestion.difficulty}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3">{suggestion.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 mb-1">Impact</div>
                    <div className="text-sm text-green-600">{suggestion.impact}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 mb-1">Suggestion</div>
                    <div className="text-sm text-gray-600">{suggestion.suggestion}</div>
                  </div>
                </div>
                
                {(suggestion.currentValue !== undefined && suggestion.potentialValue !== undefined) && (
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Current: </span>
                      <span className="font-medium">{suggestion.currentValue.toFixed(1)}</span>
                    </div>
                    <div className="text-gray-400">→</div>
                    <div>
                      <span className="text-gray-600">Potential: </span>
                      <span className="font-medium text-green-600">{suggestion.potentialValue.toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="ml-6 text-right">
                {suggestion.estimatedCost !== undefined && (
                  <div className="mb-3">
                    <div className="text-sm text-gray-600">Cost Impact</div>
                    <div className={`text-lg font-bold ${
                      suggestion.estimatedCost >= 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {suggestion.estimatedCost >= 0 ? '+' : ''}${suggestion.estimatedCost}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => toggleSuggestion(suggestion.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedSuggestions.includes(suggestion.id)
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {selectedSuggestions.includes(suggestion.id) ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Selected
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Select
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSuggestions.length === 0 && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Great job!</h3>
          <p className="text-gray-600">
            Your build looks well-optimized. No major improvements detected for the current filter.
          </p>
        </div>
      )}

      {/* Action Summary */}
      {selectedSuggestions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Implementation Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{selectedSuggestions.length}</div>
              <div className="text-sm text-gray-600">Optimizations</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${totalPotentialSavings >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {totalPotentialSavings >= 0 ? '+' : ''}${Math.abs(totalPotentialSavings)}
              </div>
              <div className="text-sm text-gray-600">Cost Impact</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {selectedSuggestions.filter(id => 
                  suggestions.find(s => s.id === id)?.difficulty === 'easy'
                ).length}
              </div>
              <div className="text-sm text-gray-600">Easy Changes</div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Generate Shopping List
            </button>
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Save Optimization Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}