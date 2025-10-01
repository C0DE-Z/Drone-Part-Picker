'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Smartphone, Wifi, WifiOff, Download, Share2, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface MobileOptimizedProps {
  children: React.ReactNode;
  enableOffline?: boolean;
  enableSwipeGestures?: boolean;
}

interface OfflineData {
  builds: Record<string, unknown>[];
  components: Record<string, unknown>[];
  lastSync: Date;
}

export default function MobileOptimizedWrapper({ 
  children, 
  enableOffline = true, 
  enableSwipeGestures = true 
}: MobileOptimizedProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineData, setOfflineData] = useState<OfflineData | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  useEffect(() => {
    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOnline(navigator.onLine);

    // PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Load offline data if available
    if (enableOffline) {
      const stored = localStorage.getItem('drone-picker-offline');
      if (stored) {
        setOfflineData(JSON.parse(stored));
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [enableOffline]);

  // Touch gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipeGestures) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!enableSwipeGestures) return;
    touchEndX.current = e.changedTouches[0].clientX;
    handleSwipeGesture();
  };

  const handleSwipeGesture = () => {
    const swipeThreshold = 50;
    const swipeDistance = touchStartX.current - touchEndX.current;

    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0) {
        // Swiped left - could trigger next action
        console.log('Swiped left');
      } else {
        // Swiped right - could trigger back action
        console.log('Swiped right');
      }
    }
  };

  const installPWA = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setInstallPrompt(null);
    }
  };

  const saveOfflineData = async () => {
    try {
      // In a real implementation, this would fetch and cache critical data
      const mockData: OfflineData = {
        builds: [], // User's builds
        components: [], // Essential component data
        lastSync: new Date()
      };
      
      localStorage.setItem('drone-picker-offline', JSON.stringify(mockData));
      setOfflineData(mockData);
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  };

  const shareCurrentBuild = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Drone Build',
          text: 'Check out my custom drone build!',
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div 
      className="min-h-screen bg-gray-50"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-4 z-50 lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5" />
              <div>
                <div className="font-medium text-sm">Install Drone Part Picker</div>
                <div className="text-xs opacity-90">Get the full app experience</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={installPWA}
                className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium"
              >
                Install
              </button>
              <button
                onClick={() => setShowInstallBanner(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status Bar */}
      <div className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        showInstallBanner ? 'top-16' : 'top-0'
      } lg:hidden`}>
        <div className={`px-4 py-2 text-sm font-medium transition-colors ${
          isOnline 
            ? 'bg-green-50 text-green-700 border-b border-green-200' 
            : 'bg-red-50 text-red-700 border-b border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>Offline Mode</span>
                  {offlineData && (
                    <span className="text-xs opacity-75">
                      • Last sync: {offlineData.lastSync.toLocaleDateString()}
                    </span>
                  )}
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {enableOffline && (
                <button
                  onClick={saveOfflineData}
                  className="p-1 hover:bg-white/20 rounded"
                  disabled={!isOnline}
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={shareCurrentBuild}
                className="p-1 hover:bg-white/20 rounded"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-1 hover:bg-white/20 rounded"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
          <div className="fixed right-0 top-0 h-full w-80 max-w-[80vw] bg-white shadow-xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Navigation</h3>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <Link
                href="/"
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg"
                onClick={() => setShowMobileMenu(false)}
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  🔧
                </div>
                <div>
                  <div className="font-medium">Build Creator</div>
                  <div className="text-sm text-gray-600">Create new builds</div>
                </div>
              </Link>
              
              <Link
                href="/builds/public"
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg"
                onClick={() => setShowMobileMenu(false)}
              >
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  🌍
                </div>
                <div>
                  <div className="font-medium">Public Builds</div>
                  <div className="text-sm text-gray-600">Browse community</div>
                </div>
              </Link>
              
              <Link
                href="/dashboard"
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg"
                onClick={() => setShowMobileMenu(false)}
              >
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  📊
                </div>
                <div>
                  <div className="font-medium">My Dashboard</div>
                  <div className="text-sm text-gray-600">Your builds & stats</div>
                </div>
              </Link>
              
              <Link
                href="/parts/custom"
                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg"
                onClick={() => setShowMobileMenu(false)}
              >
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  🎯
                </div>
                <div>
                  <div className="font-medium">Custom Parts</div>
                  <div className="text-sm text-gray-600">Add custom components</div>
                </div>
              </Link>
            </div>

            {/* Offline Data Status */}
            {enableOffline && (
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Offline Mode</span>
                  <button
                    onClick={saveOfflineData}
                    disabled={!isOnline}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isOnline 
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isOnline ? 'Sync Now' : 'Offline'}
                  </button>
                </div>
                {offlineData && (
                  <div className="text-xs text-gray-500 mt-1">
                    {offlineData.builds.length} builds • {offlineData.components.length} components cached
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content with Mobile Spacing */}
      <div className={`transition-all duration-300 ${
        showInstallBanner ? 'pt-24' : 'pt-12'
      } lg:pt-0`}>
        {children}
      </div>

      {/* Mobile-Specific Touch Helpers */}
      <div className="lg:hidden">
        {/* Swipe Indicators - shown briefly on first visit */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 opacity-0 animate-pulse">
            <ChevronLeft className="w-4 h-4" />
            <span>Swipe to navigate</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* iOS Safari Bottom Bar Spacing */}
      <div className="h-6 lg:hidden" />
    </div>
  );
}

// Hook for detecting mobile device
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const ios = /iphone|ipad|ipod/i.test(userAgent);
      const android = /android/i.test(userAgent);
      
      setIsMobile(mobile);
      setIsIOS(ios);
      setIsAndroid(android);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile, isIOS, isAndroid };
};

// Touch-optimized input component
export const TouchOptimizedInput = ({ 
  className = '', 
  ...props 
}: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      {...props}
      className={`
        ${className}
        touch-manipulation
        text-base
        min-h-[44px]
        px-4
        py-3
        border
        border-gray-300
        rounded-lg
        focus:ring-2
        focus:ring-blue-500
        focus:border-blue-500
        lg:text-sm
        lg:min-h-0
        lg:py-2
      `}
    />
  );
};

// Touch-optimized button component
export const TouchOptimizedButton = ({ 
  children, 
  className = '', 
  variant = 'primary',
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) => {
  const baseClasses = `
    touch-manipulation
    min-h-[44px]
    px-6
    py-3
    rounded-lg
    font-medium
    transition-colors
    active:scale-95
    lg:min-h-0
    lg:py-2
    lg:px-4
  `;
  
  const variantClasses = variant === 'primary' 
    ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
    : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900';

  return (
    <button
      {...props}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {children}
    </button>
  );
};