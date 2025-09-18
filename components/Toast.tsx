'use client';

import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  isVisible: boolean;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function Toast({ 
  message, 
  type = 'info', 
  duration = 5000, 
  isVisible, 
  onClose,
  action 
}: ToastProps) {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsShowing(true);
      const timer = setTimeout(() => {
        setIsShowing(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-br from-emerald-500/20 to-green-600/30 border-emerald-400/30 text-emerald-50';
      case 'warning':
        return 'bg-gradient-to-br from-amber-500/20 to-yellow-600/30 border-amber-400/30 text-amber-50';
      case 'error':
        return 'bg-gradient-to-br from-red-500/20 to-rose-600/30 border-red-400/30 text-red-50';
      default:
        return 'bg-gradient-to-br from-blue-500/20 to-indigo-600/30 border-blue-400/30 text-blue-50';
    }
  };


  const getIcon = () => {
    // Only show icon if message doesn't already start with a checkmark or icon
    if (type === 'success' && message.trim().startsWith('✅')) return null;
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-500 ease-out ${
      isShowing ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
    }`}>
      <div className={`${getToastStyle()} backdrop-blur-xl border rounded-2xl shadow-2xl p-5 min-w-[320px] max-w-[500px] 
                      relative overflow-hidden before:absolute before:inset-0 before:bg-white/5 before:rounded-2xl 
                      before:backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl
                      ring-1 ring-white/10`}>
        {/* Liquid glass shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                        transform -skew-x-12 translate-x-[-100%] animate-shimmer opacity-60"></div>
        
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {getIcon() && (
              <span className="text-xl flex-shrink-0 drop-shadow-lg animate-pulse">
                {getIcon()}
              </span>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium leading-relaxed drop-shadow-sm">{message}</p>
              {action && (
                <button
                  onClick={action.onClick}
                  className="mt-3 text-sm underline hover:no-underline opacity-90 hover:opacity-100 
                           transition-all duration-200 hover:scale-105 font-medium"
                >
                  {action.label}
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setIsShowing(false);
              setTimeout(onClose, 300);
            }}
            className="text-current hover:bg-white/20 ml-3 flex-shrink-0 w-6 h-6 rounded-full 
                     flex items-center justify-center transition-all duration-200 hover:scale-110 
                     hover:rotate-90 backdrop-blur-sm"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
