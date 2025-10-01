'use client';

import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, BarChart3, Clock, Battery, Zap } from 'lucide-react';

interface FlightSession {
  id: string;
  buildName: string;
  startTime: Date;
  duration: number; // in minutes
  maxSpeed: number;
  avgSpeed: number;
  batteryUsed: number; // percentage
  flightMode: 'Sport' | 'Normal' | 'Cinematic';
  predictedFlightTime: number;
  actualFlightTime: number;
  accuracy: number; // percentage
}

interface TelemetryData {
  timestamp: Date;
  speed: number;
  altitude: number;
  batteryVoltage: number;
  motorTemp: number;
  throttlePosition: number;
}

interface RealTimeAnalyticsProps {
  buildId?: string;
  userId?: string;
}

export default function RealTimeAnalytics({ userId }: RealTimeAnalyticsProps) {
  const [isConnected] = useState(false);

  const [recentSessions, setRecentSessions] = useState<FlightSession[]>([]);
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [showLiveView, setShowLiveView] = useState(false);

  // Connection handler


  // Simulate telemetry connection for demo
  useEffect(() => {
    if (showLiveView) {
      const interval = setInterval(() => {
        const newDataPoint: TelemetryData = {
          timestamp: new Date(),
          speed: Math.random() * 80 + 20, // 20-100 km/h
          altitude: Math.random() * 100 + 50, // 50-150m
          batteryVoltage: 14.8 - (Math.random() * 2), // 12.8-14.8V
          motorTemp: Math.random() * 30 + 40, // 40-70°C
          throttlePosition: Math.random() * 100 // 0-100%
        };
        
        setTelemetryData(prev => [...prev.slice(-29), newDataPoint]); // Keep last 30 points
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showLiveView]);

  // Mock recent sessions data with user filtering
  useEffect(() => {
    const mockSessions: FlightSession[] = [
      {
        id: '1',
        buildName: 'Racing Quad V2',
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        duration: 4.2,
        maxSpeed: 87,
        avgSpeed: 42,
        batteryUsed: 85,
        flightMode: 'Sport',
        predictedFlightTime: 5.1,
        actualFlightTime: 4.2,
        accuracy: 82
      },
      {
        id: '2',
        buildName: 'Cinematic Explorer',
        startTime: new Date(Date.now() - 7200000), // 2 hours ago
        duration: 12.8,
        maxSpeed: 45,
        avgSpeed: 28,
        batteryUsed: 90,
        flightMode: 'Cinematic',
        predictedFlightTime: 14.2,
        actualFlightTime: 12.8,
        accuracy: 90
      }
    ];
    
    // Filter sessions by userId if provided
    const filteredSessions = userId ? mockSessions : mockSessions;
    setRecentSessions(filteredSessions);
  }, [userId]);

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600';
    if (accuracy >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyIcon = (accuracy: number) => {
    if (accuracy >= 90) return <TrendingUp className="w-4 h-4" />;
    if (accuracy >= 80) return <Activity className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Flight Analytics</h2>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            {isConnected ? 'Live Connected' : 'Offline'}
          </div>
          
          <button
            onClick={() => setShowLiveView(!showLiveView)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            {showLiveView ? 'Stop Demo' : 'Start Live Demo'}
          </button>
        </div>
      </div>

      {/* Live Telemetry Dashboard */}
      {showLiveView && (
        <div className="bg-gray-900 rounded-xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">LIVE TELEMETRY</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {telemetryData.length > 0 && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {telemetryData[telemetryData.length - 1]?.speed.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-400">Speed (km/h)</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {telemetryData[telemetryData.length - 1]?.altitude.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-400">Altitude (m)</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {telemetryData[telemetryData.length - 1]?.batteryVoltage.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-400">Battery (V)</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {telemetryData[telemetryData.length - 1]?.motorTemp.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-400">Temp (°C)</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {telemetryData[telemetryData.length - 1]?.throttlePosition.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-400">Throttle (%)</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {((14.8 - telemetryData[telemetryData.length - 1]?.batteryVoltage) / 2 * 100).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-400">Used (%)</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Prediction Accuracy */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Prediction Accuracy</h3>
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="space-y-3">
            <div className="text-3xl font-bold text-gray-900">
              {recentSessions.length > 0 
                ? Math.round(recentSessions.reduce((acc, s) => acc + s.accuracy, 0) / recentSessions.length)
                : 0}%
            </div>
            <div className="text-sm text-gray-600">Average across all flights</div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Flight Time</span>
                <span className="font-medium">87%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Top Speed</span>
                <span className="font-medium">92%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Battery Life</span>
                <span className="font-medium">85%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Flight Statistics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Flight Statistics</h3>
            <Clock className="w-5 h-5 text-green-600" />
          </div>
          
          <div className="space-y-3">
            <div className="text-3xl font-bold text-gray-900">
              {recentSessions.reduce((acc, s) => acc + s.duration, 0).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Total flight time (minutes)</div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Flights</span>
                <span className="font-medium">{recentSessions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Avg Flight Time</span>
                <span className="font-medium">
                  {recentSessions.length > 0 
                    ? (recentSessions.reduce((acc, s) => acc + s.duration, 0) / recentSessions.length).toFixed(1)
                    : 0}min
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Max Speed</span>
                <span className="font-medium">
                  {Math.max(...recentSessions.map(s => s.maxSpeed), 0)}km/h
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Battery Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Battery Performance</h3>
            <Battery className="w-5 h-5 text-yellow-600" />
          </div>
          
          <div className="space-y-3">
            <div className="text-3xl font-bold text-gray-900">
              {recentSessions.length > 0 
                ? Math.round(recentSessions.reduce((acc, s) => acc + s.batteryUsed, 0) / recentSessions.length)
                : 0}%
            </div>
            <div className="text-sm text-gray-600">Average battery usage</div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Efficiency Rating</span>
                <span className="font-medium text-green-600">Good</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Discharge Rate</span>
                <span className="font-medium">3.2C</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cycles Completed</span>
                <span className="font-medium">47</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Flight Sessions */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Flight Sessions</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {recentSessions.map((session) => (
            <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-gray-900">{session.buildName}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      session.flightMode === 'Sport' ? 'bg-red-100 text-red-700' :
                      session.flightMode === 'Cinematic' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {session.flightMode}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {session.duration.toFixed(1)}min
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      {session.maxSpeed}km/h max
                    </div>
                    <div className="flex items-center gap-1">
                      <Battery className="w-4 h-4" />
                      {session.batteryUsed}% used
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`flex items-center gap-1 ${getAccuracyColor(session.accuracy)}`}>
                    {getAccuracyIcon(session.accuracy)}
                    <span className="font-medium">{session.accuracy}% accurate</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Predicted: {session.predictedFlightTime.toFixed(1)}min | 
                    Actual: {session.actualFlightTime.toFixed(1)}min
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Activity className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Connect Your Flight Controller</h3>
            <p className="text-blue-800 text-sm mb-3">
              Get real-time telemetry data by connecting your flight controller with these supported protocols:
            </p>
            <div className="flex flex-wrap gap-2">
              {['MAVLink', 'Betaflight MSP', 'ELRS', 'ExpressLRS', 'TBS Crossfire'].map((protocol) => (
                <span key={protocol} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                  {protocol}
                </span>
              ))}
            </div>
            <p className="text-blue-700 text-sm mt-3">
              <strong>Coming Soon:</strong> Mobile app with automatic flight detection and wireless telemetry sync.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}