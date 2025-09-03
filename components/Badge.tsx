'use client';

import React from 'react';

export interface BadgeData {
  id: string;
  name: string;
  description?: string;
  type: 'ADMIN' | 'MODERATOR' | 'VERIFIED' | 'EARLY_USER' | 'TOP_CONTRIBUTOR' | 'DRONE_EXPERT' | 'CUSTOM';
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface BadgeProps {
  badge: BadgeData;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const rarityStyles = {
  common: {
    border: 'border-gray-300',
    glow: 'hover:shadow-gray-200',
    gradient: 'from-gray-50 to-gray-100'
  },
  rare: {
    border: 'border-blue-300',
    glow: 'hover:shadow-blue-200',
    gradient: 'from-blue-50 to-blue-100'
  },
  epic: {
    border: 'border-purple-300',
    glow: 'hover:shadow-purple-200',
    gradient: 'from-purple-50 to-purple-100'
  },
  legendary: {
    border: 'border-yellow-400',
    glow: 'hover:shadow-yellow-200',
    gradient: 'from-yellow-50 to-yellow-100'
  }
};

const sizeStyles = {
  sm: {
    container: 'w-6 h-6 text-xs',
    icon: 'text-xs',
    tooltip: 'text-xs'
  },
  md: {
    container: 'w-8 h-8 text-sm',
    icon: 'text-sm',
    tooltip: 'text-sm'
  },
  lg: {
    container: 'w-10 h-10 text-base',
    icon: 'text-base',
    tooltip: 'text-sm'
  }
};

export default function Badge({ 
  badge, 
  size = 'md', 
  showTooltip = true, 
  className = '' 
}: BadgeProps) {
  const rarity = rarityStyles[badge.rarity];
  const sizeStyle = sizeStyles[size];

  return (
    <div className={`relative group inline-block ${className}`}>
      <div 
        className={`
          ${sizeStyle.container}
          ${rarity.border}
          ${rarity.glow}
          bg-gradient-to-br ${rarity.gradient}
          border-2 rounded-full 
          flex items-center justify-center 
          transition-all duration-300 
          hover:scale-110 hover:shadow-lg
          cursor-pointer
          ${badge.rarity === 'legendary' ? 'animate-pulse' : ''}
        `}
        style={{ 
          backgroundColor: badge.color + '20',
          borderColor: badge.color
        }}
      >
        <span className={`${sizeStyle.icon}`} style={{ color: badge.color }}>
          {badge.icon}
        </span>
      </div>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          <div 
            className={`
              ${sizeStyle.tooltip}
              bg-gray-900 text-white 
              px-3 py-2 rounded-lg 
              whitespace-nowrap 
              shadow-lg border
              ${rarity.border}
            `}
          >
            <div className="font-medium">{badge.name}</div>
            {badge.description && (
              <div className="text-gray-300 text-xs mt-1">{badge.description}</div>
            )}
            <div className="text-xs text-gray-400 mt-1 capitalize">{badge.rarity}</div>
          </div>
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"
            style={{ marginTop: '-4px' }}
          />
        </div>
      )}
    </div>
  );
}

// Pre-defined badge types for easy use
export const BADGE_TYPES = {
  ADMIN: {
    name: 'Admin',
    description: 'Site Administrator',
    icon: '👑',
    color: '#DC2626',
    rarity: 'legendary' as const
  },
  MODERATOR: {
    name: 'Moderator',
    description: 'Community Moderator',
    icon: '🛡️',
    color: '#7C3AED',
    rarity: 'epic' as const
  },
  VERIFIED: {
    name: 'Verified',
    description: 'Verified Account',
    icon: '✅',
    color: '#059669',
    rarity: 'rare' as const
  },
  EARLY_USER: {
    name: 'Early User',
    description: 'Beta Tester',
    icon: '🚀',
    color: '#2563EB',
    rarity: 'rare' as const
  },
  TOP_CONTRIBUTOR: {
    name: 'Top Contributor',
    description: 'Highly Active Community Member',
    icon: '⭐',
    color: '#F59E0B',
    rarity: 'epic' as const
  },
  DRONE_EXPERT: {
    name: 'Drone Expert',
    description: 'Recognized Drone Building Expert',
    icon: '🔧',
    color: '#10B981',
    rarity: 'epic' as const
  }
};
