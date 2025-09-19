'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AdminActionMenu from './AdminActionMenu';
import ScraperManagement from './ScraperManagement';
import ProductResortPanel from './ProductResortPanel';
import AdminProductManager from './AdminProductManager';
import ProductVariantManager from './ProductVariantManager';
import ClassificationGameModal from './ClassificationGameModal';
import { Moon, Sun } from 'lucide-react';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  createdAt: string;
}

interface Report {
  id: string;
  type: string;
  reason: string;
  description: string;
  reportedBy: string;
  createdAt: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED';
}

interface DatabaseStatus {
  status: string;
  message: string;
  color: string;
  details: {
    badges: { status: string; count: number };
    userBadges: { status: string; count: number };
    partModels: { status: string };
  };
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus | null>(null);
  const [classificationGameOpen, setClassificationGameOpen] = useState(false);
  const [localTheme, setLocalTheme] = useState<'light' | 'dark'>('light');
  const [sampleProducts] = useState([
    // Mock sample products for the classification game
    { id: '1', name: 'EMAX E3 Series 2808 Motor - 1500KV', description: 'High-performance brushless motor for racing drones', price: 29.99, currentCategory: 'motor' },
    { id: '2', name: 'Holybro Tekko32 F3 Metal 45A 4-in-1 ESC', description: '4-in-1 electronic speed controller with current sensor', price: 79.99, currentCategory: 'stack' },
    { id: '3', name: 'GEPRC Mark4 HD5 Frame Kit', description: '5-inch carbon fiber frame for FPV racing', price: 45.00, currentCategory: 'frame' },
    { id: '4', name: 'RunCam Phoenix 2 FPV Camera', description: '1000TVL micro FPV camera with OSD', price: 35.99, currentCategory: 'camera' },
    { id: '5', name: 'Gemfan 5152S Propellers (Set of 4)', description: 'Tri-blade propellers for 5-inch racing quads', price: 12.99, currentCategory: 'prop' },
    { id: '6', name: 'CNHL 1300mAh 4S 100C LiPo Battery', description: 'High discharge rate lithium polymer battery', price: 28.50, currentCategory: 'battery' }
  ]);

  useEffect(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;

    setLocalTheme(initialTheme);

    // Apply theme to document
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  
  // Function to toggle theme
  const toggleTheme = () => {
    const newTheme = localTheme === 'light' ? 'dark' : 'light';
    setLocalTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    const checkAdminAndLoadData = async () => {
      if (!session?.user?.email) return;

      try {
        // Check admin status
        const adminResponse = await fetch('/api/auth/check-admin');
        const adminData = await adminResponse.json();
        setIsAdmin(adminData.isAdmin);

        if (adminData.isAdmin) {
          // Load users
          const usersResponse = await fetch('/api/admin/users');
          const usersData = await usersResponse.json();
          if (usersData.success) {
            setUsers(usersData.data || []);
          }

          // Load reports
          const reportsResponse = await fetch('/api/admin/reports');
          const reportsData = await reportsResponse.json();
          if (reportsData.success) {
            setReports(reportsData.data || []);
          }

          // Load database status
          const statusResponse = await fetch('/api/admin/database-status');
          const statusData = await statusResponse.json();
          if (statusData.success) {
            setDatabaseStatus(statusData);
          }
        }
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAndLoadData();
  }, [session]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });

      const data = await response.json();
      if (data.success) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole as 'USER' | 'MODERATOR' | 'ADMIN' } : user
        ));
      } else {
        alert('Failed to update role: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Role update error:', error);
      alert('Failed to update role');
    }
  };

  const handleReportAction = async (reportId: string, action: 'resolve' | 'dismiss') => {
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action })
      });

      const data = await response.json();
      if (data.success) {
        setReports(reports.map(report => 
          report.id === reportId 
            ? { ...report, status: action === 'resolve' ? 'RESOLVED' : 'REVIEWED' }
            : report
        ));
      } else {
        alert('Failed to update report: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Report action error:', error);
      alert('Failed to update report');
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        localTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
            localTheme === 'dark' ? 'border-blue-400' : 'border-blue-600'
          } mx-auto`}></div>
          <p className={`mt-4 ${
            localTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        localTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <h1 className={`text-2xl font-bold mb-4 ${
            localTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Access Denied</h1>
          <p className={localTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
            You do not have admin permissions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${
      localTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <header className={`shadow-sm border-b ${localTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className={`text-2xl font-bold ${localTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full ${
                  localTheme === 'dark' ? 'bg-gray-700 text-yellow-200' : 'bg-gray-100 text-gray-700'
                }`}
                aria-label="Toggle theme"
              >
                {localTheme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              <div className={`text-sm ${localTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {session?.user?.email}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className={`border-b ${localTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'users', name: 'Users', icon: '👥' },
                { id: 'reports', name: 'Reports', icon: '🚨' },
                { id: 'products', name: 'Manage Products', icon: '📦' },
                { id: 'variants', name: 'Split Variants', icon: '🔀' },
                { id: 'resort', name: 'Product Resort', icon: '🔄' },
                { id: 'classification', name: 'AI Classification', icon: '🤖' },
                { id: 'scraper', name: 'Web Scraper', icon: '🕷️' },
                { id: 'settings', name: 'Settings', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : localTheme === 'dark'
                        ? 'border-transparent text-gray-300 hover:text-gray-100'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                  {tab.id === 'reports' && reports.filter(r => r.status === 'PENDING').length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {reports.filter(r => r.status === 'PENDING').length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`rounded-lg shadow p-6 ${
              localTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h3 className={`text-lg font-semibold mb-2 ${
                localTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Total Users</h3>
              <p className={`text-3xl font-bold ${
                localTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}>{users.length}</p>
            </div>
            <div className={`rounded-lg shadow p-6 ${
              localTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h3 className={`text-lg font-semibold mb-2 ${
                localTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Pending Reports</h3>
              <p className={`text-3xl font-bold ${
                localTheme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`}>
                {reports.filter(r => r.status === 'PENDING').length}
              </p>
            </div>
            <div className={`rounded-lg shadow p-6 ${
              localTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <h3 className={`text-lg font-semibold mb-2 ${
                localTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Admin Actions Today</h3>
              <p className={`text-3xl font-bold ${
                localTheme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`}>0</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className={`rounded-lg shadow ${
            localTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`px-6 py-4 border-b ${
              localTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${
                localTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>User Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className={`min-w-full divide-y ${
                localTheme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
              }`}>
                <thead className={localTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      localTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      User
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      localTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Role
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      localTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Joined
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      localTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  localTheme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'
                }`}>
                  {users.map((user) => (
                    <tr key={user.id} className={localTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className={`text-sm font-medium ${
                            localTheme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {user.username}
                          </div>
                          <div className={`text-sm ${
                            localTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className={`text-sm border rounded px-2 py-1 ${
                            localTheme === 'dark' 
                              ? 'bg-gray-700 text-white border-gray-600' 
                              : 'bg-white text-gray-900 border-gray-300'
                          }`}
                        >
                          <option value="USER">User</option>
                          <option value="MODERATOR">Moderator</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        localTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <AdminActionMenu
                          itemType="comment"
                          itemId={user.id}
                          itemName={user.username}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className={`rounded-lg shadow ${
            localTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`px-6 py-4 border-b ${
              localTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${
                localTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Content Reports</h3>
            </div>
            <div className={`divide-y ${
              localTheme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              {reports.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className={localTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}>No reports yet.</p>
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className={`px-6 py-4 ${
                    localTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            localTheme === 'dark'
                              ? (report.status === 'PENDING'
                                ? 'bg-yellow-900 text-yellow-200'
                                : report.status === 'RESOLVED'
                                ? 'bg-green-900 text-green-200'
                                : 'bg-gray-700 text-gray-200')
                              : (report.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : report.status === 'RESOLVED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800')
                          }`}>
                            {report.status}
                          </span>
                          <span className={`text-sm font-medium ${
                            localTheme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {report.type} Report
                          </span>
                        </div>
                        <p className={`text-sm mb-1 ${
                          localTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <strong>Reason:</strong> {report.reason}
                        </p>
                        <p className={`text-sm mb-2 ${
                          localTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <strong>Description:</strong> {report.description}
                        </p>
                        <p className={`text-xs ${
                          localTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Reported by {report.reportedBy} on {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {report.status === 'PENDING' && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleReportAction(report.id, 'resolve')}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleReportAction(report.id, 'dismiss')}
                            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <AdminProductManager />
        )}

        {activeTab === 'variants' && (
          <ProductVariantManager />
        )}

        {activeTab === 'resort' && (
          <ProductResortPanel />
        )}

        {activeTab === 'classification' && (
          <div className="space-y-6">
            <div className={`shadow rounded-lg p-6 ${
              localTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-xl font-semibold ${
                    localTheme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>AI Classification Training</h2>
                  <p className={`mt-1 ${
                    localTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
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
                <div className={`p-4 rounded-lg border ${
                  localTheme === 'dark' 
                    ? 'bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700'
                    : 'bg-gradient-to-br from-blue-50 to-blue-100'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🎯</span>
                    <h3 className={`font-semibold ${
                      localTheme === 'dark' ? 'text-blue-200' : 'text-blue-800'
                    }`}>Accuracy Focused</h3>
                  </div>
                  <p className={`text-sm ${
                    localTheme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                  }`}>
                    Our AI analyzes product names, descriptions, and technical specifications to categorize components accurately.
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${
                  localTheme === 'dark' 
                    ? 'bg-gradient-to-br from-green-900 to-green-800 border-green-700'
                    : 'bg-gradient-to-br from-green-50 to-green-100'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">📊</span>
                    <h3 className={`font-semibold ${
                      localTheme === 'dark' ? 'text-green-200' : 'text-green-800'
                    }`}>Multi-Method Analysis</h3>
                  </div>
                  <p className={`text-sm ${
                    localTheme === 'dark' ? 'text-green-300' : 'text-green-700'
                  }`}>
                    Combines pattern matching, keyword analysis, feature detection, and brand recognition for best results.
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${
                  localTheme === 'dark' 
                    ? 'bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700'
                    : 'bg-gradient-to-br from-purple-50 to-purple-100'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🎮</span>
                    <h3 className={`font-semibold ${
                      localTheme === 'dark' ? 'text-purple-200' : 'text-purple-800'
                    }`}>Gamified Training</h3>
                  </div>
                  <p className={`text-sm ${
                    localTheme === 'dark' ? 'text-purple-300' : 'text-purple-700'
                  }`}>
                    Interactive card-based game makes training the AI fun while improving classification accuracy.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className={`text-lg font-semibold mb-3 ${
                  localTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Classification Categories</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div className={`flex items-center gap-2 p-2 rounded ${
                    localTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <span>⚡</span>
                    <span className={`text-sm font-medium ${
                      localTheme === 'dark' ? 'text-white' : ''
                    }`}>Motors</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded ${
                    localTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <span>🔗</span>
                    <span className={`text-sm font-medium ${
                      localTheme === 'dark' ? 'text-white' : ''
                    }`}>ESC/FC</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded ${
                    localTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <span>🏗️</span>
                    <span className={`text-sm font-medium ${
                      localTheme === 'dark' ? 'text-white' : ''
                    }`}>Frames</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded ${
                    localTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <span>🌀</span>
                    <span className={`text-sm font-medium ${
                      localTheme === 'dark' ? 'text-white' : ''
                    }`}>Props</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded ${
                    localTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <span>🔋</span>
                    <span className={`text-sm font-medium ${
                      localTheme === 'dark' ? 'text-white' : ''
                    }`}>Batteries</span>
                  </div>
                  <div className={`flex items-center gap-2 p-2 rounded ${
                    localTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <span>📷</span>
                    <span className={`text-sm font-medium ${
                      localTheme === 'dark' ? 'text-white' : ''
                    }`}>Cameras</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scraper' && (
          <ScraperManagement theme={localTheme} />
        )}

        {activeTab === 'settings' && (
          <div className={`rounded-lg shadow p-6 ${
            localTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              localTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Admin Settings</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  localTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Theme
                </label>
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg border flex items-center space-x-2 cursor-pointer ${
                    localTheme === 'light' 
                      ? 'bg-blue-50 border-blue-500 text-blue-600'
                      : localTheme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-gray-300'
                        : 'bg-white border-gray-200 text-gray-700'
                  }`} onClick={() => toggleTheme()}>
                    <span className={`h-4 w-4 rounded-full ${
                      localTheme === 'light' ? 'bg-blue-600' : 'bg-gray-400'
                    }`}></span>
                    <span>Toggle Dark Mode</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  localTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Database Status
                </label>
                <div className={`text-sm ${
                  localTheme === 'dark' 
                    ? databaseStatus?.color?.replace('text-green', 'text-green-400').replace('text-red', 'text-red-400') 
                    : databaseStatus?.color || 'text-gray-600'
                }`}>
                  {databaseStatus?.message || '🔄 Checking database status...'}
                </div>
                {databaseStatus?.details && (
                  <div className={`mt-2 text-xs space-y-1 ${
                    localTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <div>Badges: {databaseStatus.details.badges.count} entries ({databaseStatus.details.badges.status})</div>
                    <div>User Badges: {databaseStatus.details.userBadges.count} entries ({databaseStatus.details.userBadges.status})</div>
                    <div>3D Models: {databaseStatus.details.partModels.status}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

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
