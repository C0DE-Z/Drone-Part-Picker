import React from 'react';
import { PerformanceEstimate } from '@/types/drone';

interface PerformancePanelProps {
  performance: PerformanceEstimate;
}

export default function PerformancePanel({ performance }: PerformancePanelProps) {
  const getTWRDescription = (twr: number) => {
    if (twr >= 3.5) return 'Outstanding - Professional racing performance';
    if (twr >= 3.0) return 'Excellent - Great for racing and advanced acrobatics';
    if (twr >= 2.5) return 'Very Good - Solid freestyle and sport flying';
    if (twr >= 2.0) return 'Good - Suitable for casual flying and learning';
    if (twr >= 1.5) return 'Fair - Basic performance, adequate for beginners';
    return 'Poor - May struggle with responsive flight';
  };

  const getFlightClassification = () => {
    const { thrustToWeightRatio, estimatedTopSpeed } = performance;
    
    if (thrustToWeightRatio >= 3.0 && estimatedTopSpeed >= 100) return { class: 'Racing', color: 'bg-red-500', description: 'High-performance racing quad' };
    if (thrustToWeightRatio >= 2.5 && estimatedTopSpeed >= 80) return { class: 'Freestyle', color: 'bg-purple-500', description: 'Acrobatic and freestyle flying' };
    if (thrustToWeightRatio >= 2.0 && estimatedTopSpeed >= 60) return { class: 'Sport', color: 'bg-blue-500', description: 'Recreational sport flying' };
    if (thrustToWeightRatio >= 1.8) return { class: 'Cinematic', color: 'bg-green-500', description: 'Smooth cinematic footage' };
    return { class: 'Trainer', color: 'bg-gray-500', description: 'Learning and basic flying' };
  };

  const flightClass = getFlightClassification();

  const StatCard = ({ title, value, unit, subtitle, icon, color = "text-gray-900" }: {
    title: string;
    value: string | number;
    unit?: string;
    subtitle?: string;
    icon: string;
    color?: string;
  }) => (
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${color} mb-1`}>
        {value}{unit && <span className="text-lg text-gray-500 ml-1">{unit}</span>}
      </div>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );

  const ProgressBar = ({ label, value, max, color = "bg-blue-500", unit = "" }: {
    label: string;
    value: number;
    max: number;
    color?: string;
    unit?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{value}{unit}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color} transition-all duration-300`}
          style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Flight Classification Banner */}
      <div className={`${flightClass.color} rounded-xl p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">{flightClass.class} Quad</h2>
            <p className="text-white/90">{flightClass.description}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold mb-1">{performance.thrustToWeightRatio.toFixed(2)}:1</div>
            <div className="text-white/90 text-sm">Thrust-to-Weight</div>
          </div>
        </div>
      </div>

      {/* Primary Flight Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        <StatCard
          title="Max Thrust"
          value={performance.maxThrust}
          unit="kg"
          subtitle={`${performance.maxThrustGrams}g total`}
          icon="🚀"
          color="text-red-600"
        />
        <StatCard
          title="Total Weight"
          value={performance.totalWeight}
          unit="g"
          subtitle={`${(performance.totalWeight / 1000).toFixed(2)}kg`}
          icon="⚖️"
          color="text-blue-600"
        />
        <StatCard
          title="Top Speed"
          value={performance.estimatedTopSpeed}
          unit="km/h"
          subtitle={`${Math.round(performance.estimatedTopSpeed * 0.621)} mph`}
          icon="💨"
          color="text-purple-600"
        />
        <StatCard
          title="Flight Time"
          value={performance.hovering.hoverTime}
          unit="min"
          icon="⏱️"
          color="text-green-600"
        />
      </div>

      {/* Detailed Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Power & Performance */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            ⚡ Power & Performance
          </h3>
          <div className="space-y-4">
            <StatCard
              title="Power Draw"
              value={performance.powerConsumption}
              unit="A"
              subtitle="Full throttle estimate"
              icon="🔋"
              color="text-orange-600"
            />
            <StatCard
              title="Hover Throttle"
              value={performance.hovering.throttlePercentage}
              unit="%"
              subtitle={`${performance.hovering.currentDraw}A draw`}
              icon="🎯"
              color="text-indigo-600"
            />
          </div>
        </div>

        {/* Motor & Propulsion */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            🔄 Motor & Propulsion
          </h3>
          <div className="space-y-4">
            <StatCard
              title="Motor KV"
              value={performance.motors.kv}
              unit="rpm/V"
              subtitle={`${performance.motors.estimatedRPM.toLocaleString()} RPM @ ${performance.motors.voltage}V`}
              icon="⚙️"
              color="text-cyan-600"
            />
            <StatCard
              title="Propeller"
              value={performance.motors.propSize}
              subtitle="Diameter x Pitch"
              icon="🌀"
              color="text-teal-600"
            />
          </div>
        </div>
      </div>

      {/* Battery Information */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          🔋 Battery Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard
            title="Voltage"
            value={`${performance.battery.cells}S`}
            subtitle={`${performance.battery.voltage}V nominal`}
            icon="⚡"
            color="text-yellow-600"
          />
          <StatCard
            title="Capacity"
            value={performance.battery.capacity}
            unit="mAh"
            subtitle={`${(performance.battery.capacity / 1000).toFixed(1)}Ah`}
            icon="🔋"
            color="text-green-600"
          />
          <StatCard
            title="Max Discharge"
            value={performance.battery.dischargeRate}
            unit="A"
            subtitle="Continuous rating"
            icon="⚡"
            color="text-red-600"
          />
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          📊 Performance Analysis
        </h3>
        <div className="space-y-4">
          <ProgressBar
            label="Speed Potential"
            value={performance.estimatedTopSpeed}
            max={150}
            color="bg-purple-500"
            unit=" km/h"
          />
          <ProgressBar
            label="Flight Endurance"
            value={performance.hovering.hoverTime}
            max={15}
            color="bg-green-500"
            unit=" min"
          />
        </div>
      </div>

      {/* Compatibility Check */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          🔧 Compatibility Check
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries({
            'Motor & Prop': performance.compatibility.propMotorMatch,
            'Voltage Match': performance.compatibility.voltageMatch,
            'Stack Mounting': performance.compatibility.mountingMatch,
            'Frame & Props': performance.compatibility.frameStackMatch
          }).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">{key}</span>
              <span className={`text-lg ${value ? 'text-green-600' : 'text-red-600'}`}>
                {value ? '✅' : '❌'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pilot Notes & Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          💡 Pilot Notes & Recommendations
        </h3>
        <div className="space-y-2">
          {/* TWR Analysis */}
          <div className="flex items-start space-x-2">
            <span className="text-blue-600 mt-1">•</span>
            <p className="text-sm text-gray-700">
              <strong>Performance:</strong> {getTWRDescription(performance.thrustToWeightRatio)}
            </p>
          </div>
          
          {/* Power Analysis */}
          {performance.battery.dischargeRate < performance.powerConsumption * 1.2 && (
            <div className="flex items-start space-x-2">
              <span className="text-orange-500 mt-1">⚠️</span>
              <p className="text-sm text-gray-700">
                <strong>Power Warning:</strong> Battery discharge rate is close to power requirements. Consider higher C-rating battery.
              </p>
            </div>
          )}
          
          {/* Flight Time Analysis */}
          {performance.estimatedFlightTime < 4 && (
            <div className="flex items-start space-x-2">
              <span className="text-yellow-600 mt-1">•</span>
              <p className="text-sm text-gray-700">
                <strong>Flight Time:</strong> Consider higher capacity battery or more efficient components for longer flights.
              </p>
            </div>
          )}
          
          {/* Compatibility Issues */}
          {!performance.compatibility.propMotorMatch && (
            <div className="flex items-start space-x-2">
              <span className="text-red-600 mt-1">⚠️</span>
              <p className="text-sm text-gray-700">
                <strong>Compatibility:</strong> Motor and propeller combination may not be optimal for performance.
              </p>
            </div>
          )}
          
          {/* Positive Feedback */}
          {performance.thrustToWeightRatio > 3.0 && performance.estimatedFlightTime > 5 && (
            <div className="flex items-start space-x-2">
              <span className="text-green-600 mt-1">🎉</span>
              <p className="text-sm text-gray-700">
                <strong>Excellent Build:</strong> Great balance of performance and flight time. Perfect for advanced flying!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
