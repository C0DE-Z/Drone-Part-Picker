'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import Badge, { BadgeData } from './Badge';
import { User, Calendar, MapPin, Globe, Github, Twitter, FolderOpen } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-lg shadow-slate-900/5 backdrop-blur-sm">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white/90 p-8 text-center shadow-lg shadow-slate-900/5 backdrop-blur-sm">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">User Not Found</h1>
          <p className="mt-3 text-slate-600">The user you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 sm:h-56">
        <div className="absolute inset-0 bg-[radial-gradient(650px_220px_at_15%_-20%,rgba(255,255,255,0.2),transparent),radial-gradient(700px_260px_at_90%_0%,rgba(59,130,246,0.35),transparent)]" />
      </div>

      <div className="relative z-10 mx-auto -mt-24 w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 shadow-xl shadow-slate-900/10 backdrop-blur-sm">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-lg ring-1 ring-slate-200 sm:h-32 sm:w-32">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.username}
                      width={128}
                      height={128}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-slate-500 sm:h-16 sm:w-16" />
                  )}
                </div>

                {user.role !== 'USER' && (
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 shadow-md">
                    <Badge
                      badge={{
                        id: user.role,
                        name: user.role === 'ADMIN' ? 'Admin' : 'Moderator',
                        type: user.role,
                        icon: user.role === 'ADMIN' ? '' : 'MOD',
                        color: user.role === 'ADMIN' ? '#DC2626' : '#7C3AED',
                        rarity: user.role === 'ADMIN' ? 'legendary' : 'epic'
                      }}
                      size="sm"
                    />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                      {user.name || user.username}
                    </h1>
                    <p className="text-base text-slate-600 sm:text-lg">@{user.username}</p>

                    {user.badges && user.badges.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {user.badges.map((badge) => (
                          <Badge key={badge.id} badge={badge} size="md" />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {!isOwnProfile && session && (
                      <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                          isFollowing
                            ? 'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-100'
                            : 'bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {followLoading ? 'Please wait...' : isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}

                    {isOwnProfile && (
                      <Link
                        href={`/profile/${username}/edit`}
                        className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
                      >
                        Edit Profile
                      </Link>
                    )}
                  </div>
                </div>

                {user.bio && (
                  <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm leading-relaxed text-slate-700 sm:text-base">
                    {user.bio}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  {user.location && (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{user.location}</span>
                    </div>
                  )}

                  {user.website && (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 transition-colors hover:border-blue-300 hover:text-blue-700"
                    >
                      <Globe className="h-4 w-4" />
                      <span>Website</span>
                    </a>
                  )}

                  {user.github && (
                    <a
                      href={`https://github.com/${user.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 transition-colors hover:border-blue-300 hover:text-blue-700"
                    >
                      <Github className="h-4 w-4" />
                      <span>GitHub</span>
                    </a>
                  )}

                  {user.twitter && (
                    <a
                      href={`https://twitter.com/${user.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 transition-colors hover:border-blue-300 hover:text-blue-700"
                    >
                      <Twitter className="h-4 w-4" />
                      <span>Twitter</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 border-t border-slate-200 pt-6 sm:grid-cols-4 sm:gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                <div className="text-2xl font-semibold tracking-tight text-slate-900">{user._count.droneBuilds}</div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Builds</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                <div className="text-2xl font-semibold tracking-tight text-slate-900">{user._count.likes}</div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Likes</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                <div className="text-2xl font-semibold tracking-tight text-slate-900">{user._count.followers}</div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Followers</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                <div className="text-2xl font-semibold tracking-tight text-slate-900">{user._count.following}</div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Following</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-sm">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            {isOwnProfile ? 'Your Builds' : `${user.username}'s Builds`}
          </h2>

          <div className="py-12 text-center text-slate-500">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
              <FolderOpen className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm sm:text-base">No builds to display yet.</p>
            {isOwnProfile && (
              <Link
                href="/"
                className="mt-4 inline-flex rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700"
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
