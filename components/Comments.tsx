'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

interface Comment {
  id: string;
  content: string;
  user: {
    username: string;
    image?: string | null;
  };
  createdAt: string;
  replies?: Comment[];
}

interface CommentsProps {
  buildId?: string;
  partId?: string;
  className?: string;
}

export default function Comments({ buildId, partId, className = '' }: CommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (buildId) params.append('buildId', buildId);
      if (partId) params.append('partId', partId);

      const response = await fetch(`/api/comments?${params}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [buildId, partId]);

  useEffect(() => {
    if (buildId || partId) {
      fetchComments();
    }
  }, [buildId, partId, fetchComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      alert('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          buildId,
          partId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className="flex gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
          {comment.user.image ? (
            <Image src={comment.user.image} alt={comment.user.username} width={32} height={32} className="w-8 h-8 rounded-full" />
          ) : (
            comment.user.username?.[0]?.toUpperCase() || 'U'
          )}
        </div>
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-gray-900">{comment.user.username}</span>
              <span className="text-xs text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
            </div>
            <p className="text-gray-700 text-sm">{comment.content}</p>
          </div>
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8 text-gray-500">Loading comments...</div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Comments ({comments.length})
        </h3>

        {/* Add Comment Form */}
        {session ? (
          <form onSubmit={handleSubmitComment} className="mb-6">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                {session.user?.image ? (
                  <Image src={session.user.image} alt="Your avatar" width={32} height={32} className="w-8 h-8 rounded-full" />
                ) : (
                  'U'
                )}
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submitting}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg mb-6">
            <p>Please sign in to add comments</p>
          </div>
        )}

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
