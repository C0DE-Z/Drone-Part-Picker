'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProductResortPanel from './ProductResortPanel';
import AdminProductManager from './AdminProductManager';
import ClassificationGameModal from './ClassificationGameModal';

interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  role: string;
  createdAt: string;
  _count: {
    droneBuilds: number;
    customParts: number;
    comments: number;
    likes: number;
  };
}

interface Post {
  id: string;
  name?: string;
  content?: string;
  createdAt: string;
  user: {
    email: string;
    username?: string;
  };
  _count?: {
    comments: number;
    likes: number;
  };
}

interface AdminData {
  builds?: Post[];
  parts?: Post[];
  comments?: Post[];
}

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'products' | 'resort' | 'classification'>('posts');
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<AdminData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [classificationGameOpen, setClassificationGameOpen] = useState(false);
  const [sampleProducts] = useState([
    // Mock sample products for the classification game
    { id: '1', name: 'EMAX E3 Series 2808 Motor - 1500KV', description: 'High-performance brushless motor for racing drones', price: 29.99, currentCategory: 'motor' },
    { id: '2', name: 'Holybro Tekko32 F3 Metal 45A 4-in-1 ESC', description: '4-in-1 electronic speed controller with current sensor', price: 79.99, currentCategory: 'stack' },
    { id: '3', name: 'GEPRC Mark4 HD5 Frame Kit', description: '5-inch carbon fiber frame for FPV racing', price: 45.00, currentCategory: 'frame' },
    { id: '4', name: 'RunCam Phoenix 2 FPV Camera', description: '1000TVL micro FPV camera with OSD', price: 35.99, currentCategory: 'camera' },
    { id: '5', name: 'Gemfan 5152S Propellers (Set of 4)', description: 'Tri-blade propellers for 5-inch racing quads', price: 12.99, currentCategory: 'prop' },
    { id: '6', name: 'CNHL 1300mAh 4S 100C LiPo Battery', description: 'High discharge rate lithium polymer battery', price: 28.50, currentCategory: 'battery' }
  ]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: string, name: string} | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin using server-side check
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session?.user?.email) return;

      try {
        const response = await fetch('/api/auth/check-admin');
        const data = await response.json();
        setIsAdmin(data.isAdmin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    if (status !== 'loading') {
      checkAdminStatus();
    }
  }, [session, status]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!isAdmin) return;
    
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchPosts();
    }
  }, [activeTab, status, isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/posts');
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.data);
      } else {
        setError(data.error || 'Failed to fetch posts');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Error fetching posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!itemToDelete || !deleteReason.trim()) return;

    try {
      const response = await fetch('/api/admin/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: itemToDelete.id,
          postType: itemToDelete.type,
          reason: deleteReason
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh posts
        fetchPosts();
        setDeleteModalOpen(false);
        setItemToDelete(null);
        setDeleteReason('');
      } else {
        setError(data.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Error deleting post');
    }
  };

  const openDeleteModal = (id: string, type: string, name: string) => {
    setItemToDelete({ id, type, name });
    setDeleteModalOpen(true);
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!session) {
    return <div className="text-center p-8">Please log in to access admin panel.</div>;
  }

  if (!isAdmin) {
    return <div className="text-center p-8 text-red-600">Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'posts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Manage Posts
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Manage Users
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'products'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Manage Products
          </button>
          <button
            onClick={() => setActiveTab('resort')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'resort'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Product Resort
          </button>
          <button
            onClick={() => setActiveTab('classification')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'classification'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            AI Classification
          </button>
        </nav>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && !loading && (
        <div className="space-y-8">
          {/* Builds */}
          {posts.builds && posts.builds.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Drone Builds</h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {posts.builds.map((build) => (
                    <li key={build.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium">{build.name}</h3>
                          <p className="text-sm text-gray-500">
                            by {build.user.username || build.user.email} • {new Date(build.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {build._count?.likes} likes • {build._count?.comments} comments
                          </p>
                        </div>
                        <button
                          onClick={() => openDeleteModal(build.id, 'build', build.name || 'Unnamed Build')}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Custom Parts */}
          {posts.parts && posts.parts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Custom Parts</h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {posts.parts.map((part) => (
                    <li key={part.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium">{part.name}</h3>
                          <p className="text-sm text-gray-500">
                            by {part.user.username || part.user.email} • {new Date(part.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {part._count?.likes} likes • {part._count?.comments} comments
                          </p>
                        </div>
                        <button
                          onClick={() => openDeleteModal(part.id, 'part', part.name || 'Unnamed Part')}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Comments */}
          {posts.comments && posts.comments.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Comments</h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {posts.comments.map((comment) => (
                    <li key={comment.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm">{comment.content}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            by {comment.user.username || comment.user.email} • {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => openDeleteModal(comment.id, 'comment', comment.content?.substring(0, 30) + '...' || 'Comment')}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && !loading && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Users</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">{user.username || user.name || 'Unnamed User'}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-sm text-gray-500">
                        Role: <span className="font-medium">{user.role}</span> • 
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user._count.droneBuilds} builds • {user._count.customParts} parts • 
                        {user._count.comments} comments • {user._count.likes} likes
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        user.role === 'MODERATOR' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && !loading && (
        <AdminProductManager />
      )}

      {/* Resort Tab */}
      {activeTab === 'resort' && !loading && (
        <ProductResortPanel />
      )}

      {/* AI Classification Tab */}
      {activeTab === 'classification' && !loading && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">AI Classification Training</h2>
                <p className="text-gray-600 mt-1">
                  Help improve our AI by verifying product classifications. Play the classification game to train our machine learning model.
                </p>
              </div>
              <button
                onClick={() => setClassificationGameOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <span className="text-xl">🤖</span>
                Start Classification Game
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🎯</span>
                  <h3 className="font-semibold text-blue-800">Accuracy Focused</h3>
                </div>
                <p className="text-blue-700 text-sm">
                  Our AI analyzes product names, descriptions, and technical specifications to categorize components accurately.
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">📊</span>
                  <h3 className="font-semibold text-green-800">Multi-Method Analysis</h3>
                </div>
                <p className="text-green-700 text-sm">
                  Combines pattern matching, keyword analysis, feature detection, and brand recognition for best results.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🎮</span>
                  <h3 className="font-semibold text-purple-800">Gamified Training</h3>
                </div>
                <p className="text-purple-700 text-sm">
                  Interactive card-based game makes training the AI fun while improving classification accuracy.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Classification Categories</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span>⚡</span>
                  <span className="text-sm font-medium">Motors</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span>🔗</span>
                  <span className="text-sm font-medium">ESC/FC</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span>🏗️</span>
                  <span className="text-sm font-medium">Frames</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span>🌀</span>
                  <span className="text-sm font-medium">Props</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span>🔋</span>
                  <span className="text-sm font-medium">Batteries</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span>📷</span>
                  <span className="text-sm font-medium">Cameras</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete {itemToDelete?.type}: {itemToDelete?.name}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Please provide a reason for deletion. This action cannot be undone.
            </p>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Reason for deletion..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setItemToDelete(null);
                  setDeleteReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePost}
                disabled={!deleteReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Classification Game Modal */}
      <ClassificationGameModal
        isOpen={classificationGameOpen}
        onClose={() => setClassificationGameOpen(false)}
        products={sampleProducts}
        onUpdateCategory={(productId, category, confidence) => {
          console.log(`Product ${productId} classified as ${category} with ${confidence} confidence`);
          // Here you would typically update your database with the verified classification
        }}
      />
    </div>
  );
}
