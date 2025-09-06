'use client';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import UserProfile from '@/components/UserProfile';

export default function ProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const username = params.username as string;
  const [userProfile, setUserProfile] = useState<{username?: string} | null>(null);
  
  // Get current user's username to compare
  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/users/generate-username', { method: 'POST' })
        .then(res => res.json())
        .then(data => setUserProfile({ username: data.username }))
        .catch(err => console.error('Error:', err));
    }
  }, [session]);
  
  // Check if this is the user's own profile by comparing usernames
  const isOwnProfile = userProfile?.username === username;

  return (
    <div>
      <UserProfile username={username} isOwnProfile={isOwnProfile} />
    </div>
  );
}
