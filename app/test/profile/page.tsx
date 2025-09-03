'use client';

import React from 'react';
import Link from 'next/link';
import Badge, { BADGE_TYPES } from '@/components/Badge';

export default function TestProfilePage() {
  // Sample user data for testing
  const sampleUser = {
    id: 'test-user',
    username: 'demo_user',
    name: 'Demo User',
    bio: 'Passionate drone builder and FPV enthusiast. Building custom racing quads since 2020.',
    location: 'San Francisco, CA',
    website: 'https://example.com',
    github: 'demo_user',
    twitter: 'demo_user',
    image: null,
    role: 'ADMIN',
    badges: [
      { id: 'admin', ...BADGE_TYPES.ADMIN, type: 'ADMIN' as const },
      { id: 'verified', ...BADGE_TYPES.VERIFIED, type: 'VERIFIED' as const },
      { id: 'expert', ...BADGE_TYPES.DRONE_EXPERT, type: 'DRONE_EXPERT' as const }
    ],
    _count: {
      droneBuilds: 15,
      customParts: 8,
      followers: 234,
      following: 89,
      likes: 456
    },
    createdAt: '2023-01-15T10:30:00Z'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700">
                DronePartPicker
              </Link>
              <span className="text-gray-400">|</span>
              <h2 className="text-xl font-semibold text-gray-700">Test Profile</h2>
            </div>
            <Link 
              href="/demo/badges"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Badge Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Cover Image */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-32 relative">
            <div className="absolute inset-0 bg-black opacity-20"></div>
          </div>

          <div className="p-6 sm:p-8 -mt-16 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-lg text-white text-2xl sm:text-3xl font-bold">
                  {sampleUser.name[0]}
                </div>
                
                {/* Role indicator */}
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                  <Badge 
                    badge={{
                      id: 'admin',
                      name: 'Admin',
                      type: 'ADMIN',
                      icon: '👑',
                      color: '#DC2626',
                      rarity: 'legendary'
                    }}
                    size="sm"
                  />
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                      {sampleUser.name}
                    </h1>
                    <p className="text-gray-600 text-lg">@{sampleUser.username}</p>
                    
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {sampleUser.badges.map((badge) => (
                        <Badge key={badge.id} badge={badge} size="md" />
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Follow
                    </button>
                    <button className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium">
                      Message
                    </button>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-gray-700 mt-4 text-base leading-relaxed">{sampleUser.bio}</p>

                {/* Profile Details */}
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span>📅</span>
                    <span>Joined {new Date(sampleUser.createdAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📍</span>
                    <span>{sampleUser.location}</span>
                  </div>
                  <a 
                    href={sampleUser.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                  >
                    <span>🌐</span>
                    <span>Website</span>
                  </a>
                  <a 
                    href={`https://github.com/${sampleUser.github}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                  >
                    <span>🐙</span>
                    <span>GitHub</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{sampleUser._count.droneBuilds}</div>
                <div className="text-sm text-gray-600">Builds</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{sampleUser._count.likes}</div>
                <div className="text-sm text-gray-600">Likes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{sampleUser._count.followers}</div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{sampleUser._count.following}</div>
                <div className="text-sm text-gray-600">Following</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚁</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Profile System Working!</h3>
            <p className="text-gray-600 mb-6">
              The badge system and user profiles are now functional. Users can display their achievements and roles!
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                href="/demo/badges"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Badge Demo
              </Link>
              <Link 
                href="/"
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Main App
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
