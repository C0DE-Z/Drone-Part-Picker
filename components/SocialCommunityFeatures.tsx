'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  Star,
  TrendingUp,
  Trophy,
  UserPlus,
  Filter,
  Search,
  Clock,
  Eye,

  Award,
  Target,
  Zap,
  DollarSign
} from 'lucide-react';
import { cacheService } from '@/lib/simple-cache';

interface CommunityBuild {
  id: string;
  name: string;
  description: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
    isVerified: boolean;
    followers: number;
  };
  images: string[];
  components: {
    motor: string;
    frame: string;
    stack: string;
    camera: string;
    props: string;
    battery: string;
  };
  performance: {
    flightTime: number;
    topSpeed: number;
    weight: number;
    cost: number;
  };
  tags: string[];
  category: 'racing' | 'freestyle' | 'cinematic' | 'longrange';
  createdAt: Date;
  likes: number;
  comments: number;
  views: number;
  shares: number;
  rating: number;
  totalRatings: number;
  featured: boolean;
  challenge?: string;
}



interface Challenge {
  id: string;
  title: string;
  description: string;
  rules: string[];
  prize: string;
  deadline: Date;
  participantCount: number;
  category: 'racing' | 'freestyle' | 'cinematic' | 'budget';
  status: 'active' | 'judging' | 'completed';
}

interface SocialCommunityFeaturesProps {
  currentUser?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export default function SocialCommunityFeatures({}: SocialCommunityFeaturesProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'trending' | 'challenges' | 'leaderboard'>('feed');
  const [builds, setBuilds] = useState<CommunityBuild[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<'all' | 'racing' | 'freestyle' | 'cinematic' | 'longrange'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'rating'>('recent');

  useEffect(() => {
    loadCommunityData();
  }, [filter, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCommunityData = async () => {
    setLoading(true);
    try {
      const cacheKey = `community_data:${filter}:${sortBy}`;
      let data = cacheService.get<{ builds: CommunityBuild[], challenges: Challenge[] }>(cacheKey);
      
      if (!data) {
        data = await generateMockCommunityData();
        cacheService.set(cacheKey, data, 600); // Cache for 10 minutes
      }
      
      setBuilds(data.builds);
      setChallenges(data.challenges);
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockCommunityData = async () => {
    const mockBuilds: CommunityBuild[] = [
      {
        id: 'build-1',
        name: 'Lightning Strike',
        description: 'Ultra-lightweight racing quad optimized for speed and agility. Perfect for tight track racing.',
        author: {
          id: 'user-1',
          username: 'SpeedDemon',
          avatar: '/api/placeholder/40/40',
          isVerified: true,
          followers: 1250
        },
        images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
        components: {
          motor: 'EMAX RS2205 2300KV',
          frame: 'Armattan Chameleon 5"',
          stack: 'SpeedyBee F405 V3',
          camera: 'Caddx Ratel 2',
          props: 'HQProp 5x4.3x3',
          battery: 'Tattu R-Line 4S 1550mAh'
        },
        performance: {
          flightTime: 4.2,
          topSpeed: 125.5,
          weight: 485,
          cost: 387.50
        },
        tags: ['racing', 'lightweight', 'fast', 'competition'],
        category: 'racing',
        createdAt: new Date('2023-09-15'),
        likes: 245,
        comments: 32,
        views: 1250,
        shares: 18,
        rating: 4.8,
        totalRatings: 67,
        featured: true,
        challenge: 'Speed Challenge 2023'
      },
      {
        id: 'build-2',
        name: 'Cinematic Beauty',
        description: 'Smooth and stable platform for professional video work. Long flight times and buttery smooth footage.',
        author: {
          id: 'user-2',
          username: 'FilmMaker_Pro',
          avatar: '/api/placeholder/40/40',
          isVerified: false,
          followers: 580
        },
        images: ['/api/placeholder/400/300'],
        components: {
          motor: 'T-Motor F40 Pro II 2400KV',
          frame: 'iFlight Nazgul5 V2',
          stack: 'Mamba F722 MK3',
          camera: 'DJI O3 Air Unit',
          props: 'Gemfan Flash 5152',
          battery: 'GNB 4S 1800mAh'
        },
        performance: {
          flightTime: 8.5,
          topSpeed: 78.2,
          weight: 650,
          cost: 625.00
        },
        tags: ['cinematic', 'smooth', 'professional', 'stable'],
        category: 'cinematic',
        createdAt: new Date('2023-09-10'),
        likes: 189,
        comments: 24,
        views: 890,
        shares: 12,
        rating: 4.6,
        totalRatings: 45,
        featured: false
      },
      {
        id: 'build-3',
        name: 'Freestyle Beast',
        description: 'Durable and powerful freestyle machine built to handle the most extreme tricks and crashes.',
        author: {
          id: 'user-3',
          username: 'FreestyleKing',
          avatar: '/api/placeholder/40/40',
          isVerified: true,
          followers: 2100
        },
        images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
        components: {
          motor: 'BetaFPV 2004 3000KV',
          frame: 'Armattan Badger 5"',
          stack: 'Holybro Kakute F7 HDV',
          camera: 'Foxeer Razer Micro',
          props: 'DAL Cyclone T5146C',
          battery: 'CNHL 4S 1300mAh'
        },
        performance: {
          flightTime: 3.8,
          topSpeed: 105.8,
          weight: 520,
          cost: 445.75
        },
        tags: ['freestyle', 'durable', 'powerful', 'tricks'],
        category: 'freestyle',
        createdAt: new Date('2023-09-08'),
        likes: 312,
        comments: 45,
        views: 1680,
        shares: 28,
        rating: 4.9,
        totalRatings: 89,
        featured: true
      }
    ];

    const mockChallenges: Challenge[] = [
      {
        id: 'challenge-1',
        title: 'Speed Challenge 2023',
        description: 'Build the fastest racing quad under $400. Top speed wins!',
        rules: [
          'Maximum budget: $400',
          'Must be racing category',
          'Submit video proof of top speed',
          'No modifications after submission'
        ],
        prize: '$500 gift card + Featured build',
        deadline: new Date('2023-10-31'),
        participantCount: 47,
        category: 'racing',
        status: 'active'
      },
      {
        id: 'challenge-2',
        title: 'Budget Build Challenge',
        description: 'Create the best performing build for under $200. Innovation over expense!',
        rules: [
          'Maximum budget: $200',
          'Any category allowed',
          'Must provide detailed part list',
          'Performance testing required'
        ],
        prize: '$300 gift card',
        deadline: new Date('2023-11-15'),
        participantCount: 23,
        category: 'budget',
        status: 'active'
      }
    ];

    return { builds: mockBuilds, challenges: mockChallenges };
  };

  const handleLikeBuild = (buildId: string) => {
    setBuilds(prev => prev.map(build => 
      build.id === buildId 
        ? { ...build, likes: build.likes + 1 }
        : build
    ));
  };

  const handleFollowUser = (userId: string) => {
    console.log('Following user:', userId);
    // In real implementation, this would make an API call
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'racing': return 'bg-red-100 text-red-700';
      case 'freestyle': return 'bg-blue-100 text-blue-700';
      case 'cinematic': return 'bg-purple-100 text-purple-700';
      case 'longrange': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Community Hub</h1>
              <p className="opacity-90">Connect, share, and learn from drone builders worldwide</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-white/20 rounded-full text-sm">
              12.5K Members
            </div>
            <div className="px-3 py-1 bg-white/20 rounded-full text-sm">
              2.8K Builds
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'feed', name: 'Community Feed', icon: <Users className="w-4 h-4" /> },
            { id: 'trending', name: 'Trending Builds', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'challenges', name: 'Challenges', icon: <Trophy className="w-4 h-4" /> },
            { id: 'leaderboard', name: 'Leaderboard', icon: <Award className="w-4 h-4" /> }
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

        {/* Filters and Search */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as typeof filter)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="racing">Racing</option>
                  <option value="freestyle">Freestyle</option>
                  <option value="cinematic">Cinematic</option>
                  <option value="longrange">Long Range</option>
                </select>
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search builds..."
                  className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Community Feed */}
          {activeTab === 'feed' && (
            <div className="space-y-6">
              {builds.map((build) => (
                <div key={build.id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                  {/* Build Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{build.author.username}</h3>
                          {build.author.isVerified && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                          <span className="text-sm text-gray-500">{build.author.followers} followers</span>
                        </div>
                        <p className="text-sm text-gray-600">{formatTimeAgo(build.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {build.featured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                          Featured
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getCategoryColor(build.category)}`}>
                        {build.category}
                      </span>
                    </div>
                  </div>

                  {/* Build Content */}
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{build.name}</h2>
                    <p className="text-gray-600 mb-3">{build.description}</p>
                    
                    {build.challenge && (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm mb-3">
                        <Trophy className="w-3 h-3" />
                        Challenge: {build.challenge}
                      </div>
                    )}
                  </div>

                  {/* Performance Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Clock className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                      <div className="text-sm font-medium">{build.performance.flightTime}min</div>
                      <div className="text-xs text-gray-600">Flight Time</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <Zap className="w-4 h-4 mx-auto mb-1 text-green-600" />
                      <div className="text-sm font-medium">{build.performance.topSpeed}mph</div>
                      <div className="text-xs text-gray-600">Top Speed</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <Target className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                      <div className="text-sm font-medium">{build.performance.weight}g</div>
                      <div className="text-xs text-gray-600">Weight</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <DollarSign className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                      <div className="text-sm font-medium">${build.performance.cost}</div>
                      <div className="text-xs text-gray-600">Total Cost</div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex gap-2 mb-4">
                    {build.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      {getRatingStars(build.rating)}
                    </div>
                    <span className="text-sm text-gray-600">
                      {build.rating} ({build.totalRatings} ratings)
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => handleLikeBuild(build.id)}
                        className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <Heart className="w-5 h-5" />
                        <span>{build.likes}</span>
                      </button>
                      
                      <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span>{build.comments}</span>
                      </button>
                      
                      <button className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors">
                        <Share2 className="w-5 h-5" />
                        <span>{build.shares}</span>
                      </button>
                      
                      <div className="flex items-center gap-1 text-gray-500">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">{build.views}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFollowUser(build.author.id)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" />
                        Follow
                      </button>
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm">
                        View Build
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Challenges Tab */}
          {activeTab === 'challenges' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Active Challenges</h3>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Create Challenge
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {challenges.map((challenge) => (
                  <div key={challenge.id} className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">{challenge.title}</h4>
                        <p className="text-gray-600 text-sm mb-3">{challenge.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                        challenge.status === 'active' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {challenge.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <h5 className="font-medium text-gray-900">Rules:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {challenge.rules.map((rule, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-purple-50 p-3 rounded-lg mb-4">
                      <div className="font-medium text-purple-900 mb-1">Prize</div>
                      <div className="text-sm text-purple-700">{challenge.prize}</div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span>{challenge.participantCount} participants</span>
                      <span>Ends {challenge.deadline.toLocaleDateString()}</span>
                    </div>
                    
                    <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      Join Challenge
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Top Builders This Month</h3>
              
              <div className="space-y-4">
                {[
                  { rank: 1, username: 'FreestyleKing', builds: 8, likes: 2450, followers: 2100, badge: '🏆' },
                  { rank: 2, username: 'SpeedDemon', builds: 6, likes: 1890, followers: 1250, badge: '🥈' },
                  { rank: 3, username: 'FilmMaker_Pro', builds: 4, likes: 1456, followers: 580, badge: '🥉' },
                  { rank: 4, username: 'TechGuru', builds: 5, likes: 1234, followers: 890, badge: null },
                  { rank: 5, username: 'BuildMaster', builds: 7, likes: 1122, followers: 765, badge: null }
                ].map((user) => (
                  <div key={user.rank} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">#{user.rank}</span>
                        {user.badge && <span className="text-xl">{user.badge}</span>}
                      </div>
                      
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-600" />
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900">{user.username}</h4>
                        <p className="text-sm text-gray-600">{user.followers} followers</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{user.builds}</div>
                        <div>Builds</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">{user.likes}</div>
                        <div>Likes</div>
                      </div>
                      <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                        Follow
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}