'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface LikeButtonProps {
  buildId?: string;
  partId?: string;
  initialLiked?: boolean;
  initialCount?: number;
  className?: string;
}

export default function LikeButton({ 
  buildId, 
  partId, 
  initialLiked = false, 
  initialCount = 0,
  className = ''
}: LikeButtonProps) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const fetchLikeStatus = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (buildId) params.append('buildId', buildId);
      if (partId) params.append('partId', partId);

      const response = await fetch(`/api/likes?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error('Error fetching like status:', error);
    }
  }, [buildId, partId]);

  useEffect(() => {
    if (buildId || partId) {
      fetchLikeStatus();
    }
  }, [buildId, partId, session, fetchLikeStatus]);

  const handleLike = async () => {
    if (!session) {
      alert('Please sign in to like this content');
      return;
    }

    if (loading) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buildId,
          partId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
        liked 
          ? 'bg-red-50 text-red-600 hover:bg-red-100' 
          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
      } ${className}`}
    >
      <span className={`text-sm ${loading ? 'animate-pulse' : ''}`}>
        {liked ? '❤️' : '🤍'}
      </span>
      <span className="text-sm font-medium">
        {likeCount} {likeCount === 1 ? 'like' : 'likes'}
      </span>
    </button>
  );
}
