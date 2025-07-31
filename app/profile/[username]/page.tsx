'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

interface UserProfile {
  id: string;
  name: string; // This will now be the username
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  twitter?: string;
  image?: string;
  buildsCount: number;
  partsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
  createdAt: string;
}

interface UserBuild {
  id: string;
  buildName: string;
  description: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
  tags: string[];
}

export default function UserProfile({ params }: { params: Promise<{ username: string }> }) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'builds' | 'parts'>('builds');
  const [userBuilds, setUserBuilds] = useState<UserBuild[]>([]);

  const fetchProfile = useCallback(async () => {
    try {
      const { username } = await params;
      const response = await fetch(`/api/users/${username}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        
        // Fetch user's public builds - now we need to filter by user ID
        const buildsResponse = await fetch(`/api/builds/public`);
        if (buildsResponse.ok) {
          const buildsData = await buildsResponse.json();
          // Filter builds by this user ID instead of email
          const filteredBuilds = buildsData.builds.filter((build: UserBuild) => build.user.id === data.profile.id);
          setUserBuilds(filteredBuilds);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleFollow = async () => {
    if (!session) {
      alert('Please sign in to follow users');
      return;
    }

    setFollowLoading(true);
    try {
      setProfile(prev => prev ? {
        ...prev,
        isFollowing: !prev.isFollowing,
        followersCount: prev.isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
      } : null);
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-300 text-6xl mb-4">👤</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">User not found</h3>
          <Link
            href="/builds/public"
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Browse Public Builds
          </Link>
        </div>
      </div>
    );
  }

  // Check if this is the current user's own profile
  const isOwnProfile = profile?.isOwnProfile || false;

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
              <h2 className="text-xl font-semibold text-gray-700">Profile</h2>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/builds/public"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Public Builds
              </Link>
              <Link 
                href="/parts/custom"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Custom Parts
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-600">
                {profile.image ? (
                  <Image 
                    src={profile.image} 
                    alt={profile.name} 
                    className="w-24 h-24 rounded-full object-cover"
                    width={96}
                    height={96}
                  />
                ) : (
                  profile.name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{profile.name}</h1>
                  {profile.username && (
                    <p className="text-gray-500 mb-2">@{profile.username}</p>
                  )}
                  {profile.bio && (
                    <p className="text-gray-600 mb-4">{profile.bio}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        📍 {profile.location}
                      </div>
                    )}
                    {profile.website && (
                      <a 
                        href={profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      >
                        🌐 Website
                      </a>
                    )}
                    {profile.github && (
                      <a 
                        href={`https://github.com/${profile.github}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      >
                        👨‍💻 GitHub
                      </a>
                    )}
                    {profile.twitter && (
                      <a 
                        href={`https://twitter.com/${profile.twitter}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-gray-700 transition-colors"
                      >
                        🐦 Twitter
                      </a>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3">
                  {!isOwnProfile && session && (
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        profile.isFollowing
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-black text-white hover:bg-gray-800'
                      }`}
                    >
                      {followLoading ? 'Loading...' : profile.isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                  )}
                  {isOwnProfile && (
                    <Link
                      href={`/profile/${profile.username}/edit`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Edit Profile
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-gray-900">{profile.buildsCount}</div>
                <div className="text-sm text-gray-500">Public Builds</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{profile.partsCount}</div>
                <div className="text-sm text-gray-500">Custom Parts</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{profile.followersCount}</div>
                <div className="text-sm text-gray-500">Followers</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{profile.followingCount}</div>
                <div className="text-sm text-gray-500">Following</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button 
                onClick={() => setActiveTab('builds')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'builds' 
                    ? 'text-black border-b-2 border-black' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Public Builds ({profile.buildsCount})
              </button>
              <button 
                onClick={() => setActiveTab('parts')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'parts' 
                    ? 'text-black border-b-2 border-black' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Custom Parts ({profile.partsCount})
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'builds' && (
              <div className="space-y-4">
                {userBuilds.length > 0 ? (
                  userBuilds.map((build) => (
                    <div key={build.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{build.buildName}</h3>
                        <span className="text-sm text-gray-500">
                          {new Date(build.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {build.description && (
                        <p className="text-gray-600 mb-3">{build.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>❤️ {build._count.likes}</span>
                          <span>💬 {build._count.comments}</span>
                        </div>
                        
                        {build.tags && build.tags.length > 0 && (
                          <div className="flex gap-1">
                            {build.tags.map((tag, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-gray-300 text-4xl mb-4">🚁</div>
                    <p>No public builds yet</p>
                    <p className="text-sm mt-2">
                      {isOwnProfile ? "Create your first build!" : "This user hasn't shared any builds yet"}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'parts' && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-gray-300 text-4xl mb-4">⚙️</div>
                <p>Custom parts will be displayed here</p>
                <p className="text-sm mt-2">This feature is coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
