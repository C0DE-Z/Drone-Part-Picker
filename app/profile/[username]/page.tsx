'use client';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import UserProfile from '@/components/UserProfile';

export default function ProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const username = params.username as string;
  
  // Check if this is the user's own profile by comparing usernames
  const isOwnProfile = session?.user && 'username' in session.user 
    ? session.user.username === username 
    : false;

  return (
    <div>
      <UserProfile username={username} isOwnProfile={isOwnProfile} />
    </div>
  );
}
