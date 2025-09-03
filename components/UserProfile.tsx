'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import Badge, { BadgeData } from './Badge';
import { User, Calendar, MapPin, Globe, Github, Twitter } from 'lucide-react';

interface UserProfileData {
  id: string;
  username: string;
  name?: string;
  email?: string;
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  twitter?: string;
  image?: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  badges: BadgeData[];
  createdAt: string;
  _count: {
    droneBuilds: number;
    followers: number;
    following: number;
    likes: number;
  };
}

interface UserProfileProps {
  username: string;
  isOwnProfile?: boolean;
}

export default function UserProfile({ username, isOwnProfile = false }: UserProfileProps) {
  const { data: session } = useSession();
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${username}`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        
        // Check if current user is following this user
        if (session && !isOwnProfile) {
          const followResponse = await fetch(`/api/users/${username}/follow-status`);
          if (followResponse.ok) {
            const { isFollowing } = await followResponse.json();
            setIsFollowing(isFollowing);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  }, [username, session, isOwnProfile]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleFollow = async () => {
    if (!session || isOwnProfile) return;
    
    setFollowLoading(true);
    try {
      const response = await fetch(`/api/users/${username}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      });
      
      if (response.ok) {
        setIsFollowing(!isFollowing);
        // Update follower count
        if (user) {
          setUser({
            ...user,
            _count: {
              ...user._count,
              followers: user._count.followers + (isFollowing ? -1 : 1)
            }
          });
        }
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <p className="text-gray-600 mb-8">The user you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Cover */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-48 relative">
        <div className="absolute inset-0 bg-black opacity-20"></div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gray-300 flex items-center justify-center border-4 border-white shadow-lg">
                  {user.image ? (
                    <Image 
                      src={user.image} 
                      alt={user.username} 
                      width={128}
                      height={128}
                      className="w-full h-full rounded-full object-cover" 
                    />
                  ) : (
                    <User className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600" />
                  )}
                </div>
                
                {/* Role indicator */}
                {user.role !== 'USER' && (
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                    <Badge 
                      badge={{
                        id: user.role,
                        name: user.role === 'ADMIN' ? 'Admin' : 'Moderator',
                        type: user.role,
                        icon: user.role === 'ADMIN' ? '👑' : '🛡️',
                        color: user.role === 'ADMIN' ? '#DC2626' : '#7C3AED',
                        rarity: user.role === 'ADMIN' ? 'legendary' : 'epic'
                      }}
                      size="sm"
                    />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                      {user.name || user.username}
                    </h1>
                    <p className="text-gray-600 text-lg">@{user.username}</p>
                    
                    {/* Badges */}
                    {user.badges && user.badges.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {user.badges.map((badge) => (
                          <Badge key={badge.id} badge={badge} size="md" />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {!isOwnProfile && session && (
                      <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                          isFollowing
                            ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        } disabled:opacity-50`}
                      >
                        {followLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
                      </button>
                    )}
                    
                    {isOwnProfile && (
                      <Link
                        href="/settings/profile"
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                      >
                        Edit Profile
                      </Link>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {user.bio && (
                  <p className="text-gray-700 mt-4 text-base leading-relaxed">{user.bio}</p>
                )}

                {/* Profile Details */}
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                  
                  {user.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  
                  {user.website && (
                    <a 
                      href={user.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Website</span>
                    </a>
                  )}
                  
                  {user.github && (
                    <a 
                      href={`https://github.com/${user.github}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      <Github className="w-4 h-4" />
                      <span>GitHub</span>
                    </a>
                  )}
                  
                  {user.twitter && (
                    <a 
                      href={`https://twitter.com/${user.twitter}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                      <span>Twitter</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user._count.droneBuilds}</div>
                <div className="text-sm text-gray-600">Builds</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user._count.likes}</div>
                <div className="text-sm text-gray-600">Likes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user._count.followers}</div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{user._count.following}</div>
                <div className="text-sm text-gray-600">Following</div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Builds Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {isOwnProfile ? 'Your Builds' : `${user.username}'s Builds`}
          </h2>
          
          {/* This will be populated with actual builds */}
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🚁</div>
            <p>No builds to display yet.</p>
            {isOwnProfile && (
              <Link 
                href="/" 
                className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Build
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
