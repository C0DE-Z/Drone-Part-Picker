'use client';

import React, { useState, useEffect } from 'react';
import { 
  User,
  Calendar,
  Target,
  Edit3,
  Share2,
  BarChart3,
  History,
  Heart,
  Trophy,
  Settings,
  Bell,
  Shield,
  Bookmark,
  Camera
} from 'lucide-react';
import Image from 'next/image';
import { cacheService } from '@/lib/simple-cache';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  joinDate: Date;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  primaryUse: 'racing' | 'freestyle' | 'cinematic' | 'longrange';
  preferences: {
    primaryUse: string;
    skillLevel: string;
    budget: { min: number; max: number; currency: string };
    favoriteComponents: string[];
    notifications: {
      priceAlerts: boolean;
      newRecommendations: boolean;
      communityUpdates: boolean;
      systemUpdates: boolean;
    };
    privacy: {
      profileVisible: boolean;
      buildsPublic: boolean;
      showStats: boolean;
    };
  };
  stats: {
    totalBuilds: number;
    publicBuilds: number;
    totalSpent: number;
    averageBuildCost: number;
    favoriteCategory: string;
    longestFlightTime: number;
    fastestSpeed: number;
    achievements: Achievement[];
  };
  builds: UserBuild[];
  favorites: FavoritePart[];
}

interface UserBuild {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  tags: string[];
  components: Record<string, unknown>;
  totalCost: number;
  performance: {
    estimatedFlightTime: number;
    estimatedSpeed: number;
    weight: number;
  };
  images?: string[];
  likes: number;
  views: number;
  comments: number;
  category: 'racing' | 'freestyle' | 'cinematic' | 'longrange';
}

interface FavoritePart {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  dateAdded: Date;
  notes?: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AdvancedUserProfileProps {
  userId?: string;
  onProfileUpdate?: (profile: UserProfile) => void;
}

export default function AdvancedUserProfile({ userId, onProfileUpdate }: AdvancedUserProfileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'builds' | 'favorites' | 'settings' | 'achievements'>('overview');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editProfile, setEditProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      // Check cache first
      const cacheKey = `user_profile:${userId || 'current'}`;
      let userProfile = cacheService.get<UserProfile>(cacheKey);
      
      if (!userProfile) {
        // Generate mock user profile for demonstration
        userProfile = await generateMockProfile();
        cacheService.set(cacheKey, userProfile, 3600); // Cache for 1 hour
      }
      
      setProfile(userProfile);
      setEditProfile(userProfile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockProfile = async (): Promise<UserProfile> => {
    return {
      id: userId || 'user-123',
      username: 'DroneBuilder2024',
      email: 'pilot@example.com',
      avatar: '/api/placeholder/150/150',
      joinDate: new Date('2023-06-15'),
      skillLevel: 'intermediate',
      primaryUse: 'freestyle',
      preferences: {
        primaryUse: 'freestyle',
        skillLevel: 'intermediate',
        budget: { min: 200, max: 800, currency: 'USD' },
        favoriteComponents: ['motor-emax', 'frame-armattan', 'stack-speedybee'],
        notifications: {
          priceAlerts: true,
          newRecommendations: true,
          communityUpdates: false,
          systemUpdates: true
        },
        privacy: {
          profileVisible: true,
          buildsPublic: true,
          showStats: true
        }
      },
      stats: {
        totalBuilds: 12,
        publicBuilds: 8,
        totalSpent: 2450.50,
        averageBuildCost: 204.21,
        favoriteCategory: 'Motors',
        longestFlightTime: 8.5,
        fastestSpeed: 120.5,
        achievements: [
          {
            id: 'first-build',
            name: 'First Build',
            description: 'Completed your first drone build',
            icon: '🏆',
            unlockedAt: new Date('2023-06-20'),
            rarity: 'common'
          },
          {
            id: 'speed-demon',
            name: 'Speed Demon',
            description: 'Built a drone with 100+ mph top speed',
            icon: '⚡',
            unlockedAt: new Date('2023-08-15'),
            rarity: 'rare'
          }
        ]
      },
      builds: [
        {
          id: 'build-1',
          name: 'Lightning Freestyle',
          description: 'High-performance freestyle quad with excellent agility',
          createdAt: new Date('2023-09-01'),
          updatedAt: new Date('2023-09-15'),
          isPublic: true,
          tags: ['freestyle', 'performance', 'lightweight'],
          components: {
            motor: 'EMAX RS2205 2300KV',
            frame: 'Armattan Chameleon',
            stack: 'SpeedyBee F405 V3'
          },
          totalCost: 385.50,
          performance: {
            estimatedFlightTime: 4.5,
            estimatedSpeed: 95.2,
            weight: 485
          },
          likes: 23,
          views: 156,
          comments: 8,
          category: 'freestyle'
        }
      ],
      favorites: [
        {
          id: 'fav-1',
          name: 'EMAX RS2205 2300KV',
          category: 'Motor',
          brand: 'EMAX',
          price: 89.99,
          dateAdded: new Date('2023-07-10'),
          notes: 'Great balance of power and efficiency'
        }
      ]
    };
  };

  const saveProfile = async () => {
    if (!editProfile || !profile) return;
    
    try {
      const cacheKey = `user_profile:${userId || 'current'}`;
      cacheService.set(cacheKey, editProfile, 3600);
      
      setProfile(editProfile);
      setEditing(false);
      onProfileUpdate?.(editProfile);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                {profile.avatar ? (
                  <Image src={profile.avatar} alt="Avatar" width={80} height={80} className="rounded-full object-cover" />
                ) : (
                  <User className="w-10 h-10" />
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Camera className="w-3 h-3" />
              </button>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              <p className="opacity-90">{profile.email}</p>
              <div className="flex items-center gap-4 mt-2 text-sm opacity-80">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {profile.joinDate.toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {profile.preferences.skillLevel} pilot
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
            <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{profile.stats.totalBuilds}</div>
          <div className="text-sm text-gray-600">Total Builds</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(profile.stats.totalSpent)}</div>
          <div className="text-sm text-gray-600">Total Invested</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{profile.stats.longestFlightTime}min</div>
          <div className="text-sm text-gray-600">Longest Flight</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{profile.stats.fastestSpeed}mph</div>
          <div className="text-sm text-gray-600">Top Speed</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', name: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'builds', name: 'My Builds', icon: <History className="w-4 h-4" /> },
            { id: 'favorites', name: 'Favorites', icon: <Heart className="w-4 h-4" /> },
            { id: 'achievements', name: 'Achievements', icon: <Trophy className="w-4 h-4" /> },
            { id: 'settings', name: 'Settings', icon: <Settings className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Edit3 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Updated &ldquo;Lightning Freestyle&rdquo; build</p>
                        <p className="text-xs text-gray-500">2 days ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Heart className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Added motor to favorites</p>
                        <p className="text-xs text-gray-500">1 week ago</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Build Categories</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2">
                      <span className="text-sm">Freestyle</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">7</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2">
                      <span className="text-sm">Racing</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">3</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2">
                      <span className="text-sm">Cinematic</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: '17%' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">2</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Builds Tab */}
          {activeTab === 'builds' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">My Builds ({profile.builds.length})</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  New Build
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.builds.map((build) => (
                  <div key={build.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{build.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${
                        build.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {build.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{build.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {build.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        {build.views}
                      </span>
                      <span>{formatCurrency(build.totalCost)}</span>
                    </div>
                    
                    <div className="flex gap-1 flex-wrap">
                      {build.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Favorite Parts ({profile.favorites.length})</h3>
              
              <div className="space-y-3">
                {profile.favorites.map((favorite) => (
                  <div key={favorite.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Bookmark className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{favorite.name}</h4>
                        <p className="text-sm text-gray-600">{favorite.brand} • {favorite.category}</p>
                        {favorite.notes && (
                          <p className="text-xs text-gray-500 mt-1">{favorite.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">{formatCurrency(favorite.price)}</div>
                      <div className="text-xs text-gray-500">Added {favorite.dateAdded.toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Achievements ({profile.stats.achievements.length})</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.stats.achievements.map((achievement) => (
                  <div key={achievement.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`text-2xl p-2 rounded-lg ${getRarityColor(achievement.rarity)}`}>
                        {achievement.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{achievement.name}</h4>
                        <span className={`px-2 py-1 rounded text-xs capitalize ${getRarityColor(achievement.rarity)}`}>
                          {achievement.rarity}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                    <p className="text-xs text-gray-500">Unlocked {achievement.unlockedAt.toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
                {editing && (
                  <button
                    onClick={saveProfile}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile Information
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      value={editProfile?.username || ''}
                      onChange={(e) => setEditProfile(prev => prev ? ({ ...prev, username: e.target.value }) : null)}
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editProfile?.email || ''}
                      onChange={(e) => setEditProfile(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                      disabled={!editing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Notifications
                  </h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={profile.preferences.notifications.priceAlerts}
                        disabled={!editing}
                        className="w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                      />
                      <span className="text-sm">Price Alerts</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={profile.preferences.notifications.newRecommendations}
                        disabled={!editing}
                        className="w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                      />
                      <span className="text-sm">New Recommendations</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={profile.preferences.notifications.communityUpdates}
                        disabled={!editing}
                        className="w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                      />
                      <span className="text-sm">Community Updates</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={profile.preferences.notifications.systemUpdates}
                        disabled={!editing}
                        className="w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                      />
                      <span className="text-sm">System Updates</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4" />
                  Privacy Settings
                </h4>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={profile.preferences.privacy.profileVisible}
                      disabled={!editing}
                      className="w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                    />
                    <span className="text-sm">Profile Visible</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={profile.preferences.privacy.buildsPublic}
                      disabled={!editing}
                      className="w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                    />
                    <span className="text-sm">Builds Public</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={profile.preferences.privacy.showStats}
                      disabled={!editing}
                      className="w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                    />
                    <span className="text-sm">Show Stats</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}