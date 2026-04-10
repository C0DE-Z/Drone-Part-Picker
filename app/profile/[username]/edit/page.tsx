'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';
import { ArrowLeft, Link2, Loader2, Save, UserCircle2 } from 'lucide-react';

interface UserProfile {
  id: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  twitter?: string;
  image?: string;
  isOwnProfile: boolean;
}

interface ProfileEditPageProps {
  params: Promise<{
    username: string;
  }>;
}

export default function ProfileEditPage({ params }: ProfileEditPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Resolve params Promise
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setUsername(resolvedParams.username);
    };
    resolveParams();
  }, [params]);
  const [formData, setFormData] = useState({
    bio: '',
    location: '',
    website: '',
    github: '',
    twitter: '',
    username: ''
  });

  const sectionClass = 'rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-sm';
  const labelClass = 'mb-2 block text-sm font-medium text-slate-700';
  const inputClass = 'w-full rounded-xl border border-slate-300/90 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100';

  useEffect(() => {
    const fetchUser = async () => {
      if (!username) return; // Wait for username to be resolved
      
      try {
        const response = await fetch(`/api/users/${username}`);
        if (response.ok) {
          const userData = await response.json();
          if (userData && typeof userData === 'object') {
            setUser(userData);
            setFormData({
              bio: userData.bio || '',
              location: userData.location || '',
              website: userData.website || '',
              github: userData.github || '',
              twitter: userData.twitter || '',
              username: userData.username || ''
            });
          } else {
            console.error('Invalid user data received');
          }
        } else {
          console.error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/users/${username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        // If username was changed, redirect to new username URL
        const newUsername = data.profile.username || username;
        setShowSuccessToast(true);
        setTimeout(() => {
          router.push(`/profile/${newUsername}`);
        }, 1500);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to update profile');
        setShowErrorToast(true);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('Failed to update profile. Please try again.');
      setShowErrorToast(true);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-8 text-center shadow-lg shadow-slate-900/5 backdrop-blur-sm">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-slate-600">Loading profile editor...</p>
        </div>
      </div>
    );
  }

  if (!session || !user?.isOwnProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white/90 p-8 text-center shadow-lg shadow-slate-900/5 backdrop-blur-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Access Denied</h1>
          <p className="mt-2 text-slate-600">You can only edit your own profile.</p>
          <button
            onClick={() => router.back()}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-10">
      <div className="mx-auto w-full max-w-3xl px-4">
        {/* Header */}
        <div className={`${sectionClass} mb-8`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Edit Profile</h1>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">Update your public profile information</p>
            </div>
            <button
              onClick={() => router.push(`/profile/${username}`)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className={sectionClass}>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-slate-900">
              <UserCircle2 className="h-5 w-5 text-blue-600" />
              Basic Information
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className={labelClass}>
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={inputClass}
                  placeholder="Enter your username"
                />
                <p className="mt-1 text-xs text-slate-500">Your username will be used in your profile URL.</p>
              </div>

              <div>
                <label className={labelClass}>
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={inputClass}
                  placeholder="Where are you based?"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                  className={`${inputClass} resize-none`}
                  placeholder="Tell others about your flying style, build goals, and experience."
                />
                <p className="mt-1 text-xs text-slate-500">This appears on your public profile.</p>
              </div>
            </div>
          </div>

          <div className={sectionClass}>
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-slate-900">
              <Link2 className="h-5 w-5 text-blue-600" />
              Social Links
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className={labelClass}>
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className={inputClass}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div>
                <label className={labelClass}>
                  GitHub Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">github.com/</span>
                  <input
                    type="text"
                    value={formData.github}
                    onChange={(e) => handleInputChange('github', e.target.value)}
                    className={`${inputClass} pl-24`}
                    placeholder="username"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Twitter Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">twitter.com/</span>
                  <input
                    type="text"
                    value={formData.twitter}
                    onChange={(e) => handleInputChange('twitter', e.target.value)}
                    className={`${inputClass} pl-24`}
                    placeholder="username"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push(`/profile/${username}`)}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>

        <Toast
          message="Profile updated successfully."
          type="success"
          isVisible={showSuccessToast}
          onClose={() => setShowSuccessToast(false)}
        />

        <Toast
          message={errorMessage}
          type="error"
          isVisible={showErrorToast}
          onClose={() => setShowErrorToast(false)}
        />
      </div>
    </div>
  );
}
