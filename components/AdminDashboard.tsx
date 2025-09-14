'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import AdminActionMenu from './AdminActionMenu';
import ScraperManagement from './ScraperManagement';
import ProductResortPanel from './ProductResortPanel';
import AdminProductManager from './AdminProductManager';
import ProductVariantManager from './ProductVariantManager';

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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You do not have admin permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 transition-colors">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {session?.user?.email}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'users', name: 'Users', icon: '👥' },
                { id: 'reports', name: 'Reports', icon: '🚨' },
                { id: 'products', name: 'Manage Products', icon: '📦' },
                { id: 'variants', name: 'Split Variants', icon: '🔀' },
                { id: 'resort', name: 'Product Resort', icon: '🔄' },
                { id: 'scraper', name: 'Web Scraper', icon: '🕷️' },
                { id: 'settings', name: 'Settings', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
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
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-blue-600">{users.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Reports</h3>
              <p className="text-3xl font-bold text-red-600">
                {reports.filter(r => r.status === 'PENDING').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Actions Today</h3>
              <p className="text-3xl font-bold text-green-600">0</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900"
                        >
                          <option value="USER">User</option>
                          <option value="MODERATOR">Moderator</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Content Reports</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {reports.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-gray-500">No reports yet.</p>
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            report.status === 'PENDING' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : report.status === 'RESOLVED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {report.status}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {report.type} Report
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Reason:</strong> {report.reason}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Description:</strong> {report.description}
                        </p>
                        <p className="text-xs text-gray-500">
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

        {activeTab === 'scraper' && (
          <ScraperManagement />
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Settings</h3>
            <div className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Database Status
                </label>
                <div className={`text-sm ${databaseStatus?.color || 'text-gray-600'}`}>
                  {databaseStatus?.message || '🔄 Checking database status...'}
                </div>
                {databaseStatus?.details && (
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
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
    </div>
  );
}
