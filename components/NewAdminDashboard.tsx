'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import AdminProductManager from './AdminProductManager';
import ProductResortPanel from './ProductResortPanel';
import ProductVariantManager from './ProductVariantManager';
import ScraperManagement from './ScraperManagement';
import ClassificationGameModal from './ClassificationGameModal';

// Types
interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  createdAt: string;
  _count?: {
    droneBuilds: number;
    customParts: number;
    comments: number;
    likes: number;
  };
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

interface SystemMetrics {
  totalClassifications: number;
  totalUsers: number;
  pendingReports: number;
  adminActions: number;
  activeSubscribers: number;
  totalProducts: number;
}

interface CustomPart {
  id: string;
  name: string;
  description?: string;
  category: string;
  specifications: Record<string, string | number>;
  isPublic: boolean;
  viewCount?: number;
  user: {
    username: string;
    email: string;
  };
  createdAt: string;
}

// Simple Card components
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
    {children}
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300';
      case 'resolved': return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300';
      case 'reviewed': return 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300';
      case 'admin': return 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300';
      case 'moderator': return 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300';
      case 'user': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};

export default function NewAdminDashboard() {
  const { data: session } = useSession();
  
  // Light-only: always remove dark mode
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalClassifications: 0,
    totalUsers: 0,
    pendingReports: 0,
    adminActions: 0,
    activeSubscribers: 0,
    totalProducts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [classificationGameOpen, setClassificationGameOpen] = useState(false);
  const [customParts, setCustomParts] = useState<CustomPart[]>([]);
  const [customPartsLoading, setCustomPartsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sampleProducts] = useState([
    { id: '1', name: 'EMAX E3 Series 2808 Motor - 1500KV', description: 'High-performance brushless motor for racing drones', price: 29.99, currentCategory: 'motor' },
    { id: '2', name: 'Holybro Tekko32 F3 Metal 45A 4-in-1 ESC', description: '4-in-1 electronic speed controller with current sensor', price: 79.99, currentCategory: 'stack' },
    { id: '3', name: 'GEPRC Mark4 HD5 Frame Kit', description: '5-inch carbon fiber frame for FPV racing', price: 45.00, currentCategory: 'frame' },
    { id: '4', name: 'RunCam Phoenix 2 FPV Camera', description: '1000TVL micro FPV camera with OSD', price: 35.99, currentCategory: 'camera' },
    { id: '5', name: 'Gemfan 5152S Propellers (Set of 4)', description: 'Tri-blade propellers for 5-inch racing quads', price: 12.99, currentCategory: 'prop' },
    { id: '6', name: 'CNHL 1300mAh 4S 100C LiPo Battery', description: 'High discharge rate lithium polymer battery', price: 28.50, currentCategory: 'battery' }
  ]);

  useEffect(() => {
    const checkAdminAndLoadData = async () => {
      if (!session?.user?.email) return;

      try {
        // Check admin status
        const adminResponse = await fetch('/api/auth/check-admin');
        const adminData = await adminResponse.json();
        setIsAdmin(adminData.isAdmin);

        if (adminData.isAdmin) {
          loadDashboardData();
        }
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAndLoadData();
  }, [session]);

  const loadDashboardData = async () => {
    try {
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

      // Set system metrics based on the data we've loaded
      setSystemMetrics({
        totalClassifications: 45782, // Sample data
        totalUsers: usersData.data?.length || 0,
        pendingReports: (reportsData.data || []).filter((r: Report) => r.status === 'PENDING').length,
        adminActions: 24, // Sample data
        activeSubscribers: Math.floor((usersData.data?.length || 0) * 0.4), // Sample calculation
        totalProducts: 1247, // Sample data
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadCustomParts = useCallback(async () => {
    setCustomPartsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }
      params.append('public', 'true');

      const response = await fetch(`/api/parts/custom?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCustomParts(data.customParts || []);
      }
    } catch (error) {
      console.error('Error fetching custom parts:', error);
    } finally {
      setCustomPartsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (activeTab === 'custom-parts' && isAdmin) {
      loadCustomParts();
    }
  }, [activeTab, selectedCategory, isAdmin, loadCustomParts]);

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
        
        // Update metrics
        setSystemMetrics({
          ...systemMetrics,
          pendingReports: reports.filter(r => r.status === 'PENDING' && r.id !== reportId).length
        });
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">You do not have admin permissions to access this dashboard.</p>
          <Link href="/" className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', name: 'Dashboard', icon: '📊' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'reports', name: 'Reports', icon: '🚨', badge: reports.filter(r => r.status === 'PENDING').length },
    { id: 'products', name: 'Products', icon: '📦' },
    { id: 'variants', name: 'Variants', icon: '🔀' },
    { id: 'resort', name: 'Resort', icon: '🔄' },
    { id: 'classification', name: 'Classification', icon: '🤖' },
    { id: 'scraper', name: 'Scraper', icon: '🕷️' },
    { id: 'custom-parts', name: 'Custom Parts', icon: '🔧' },
    { id: 'settings', name: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 transition-colors">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {session?.user?.email}
              </div>
              <StatusBadge status="Admin" />
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-2 overflow-x-auto">
              {navItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`$
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  } whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
        <div className="space-y-6">
          {/* Dashboard Overview */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Total Users</h3>
                      <div className="flex items-baseline">
                        <p className="text-3xl font-bold text-blue-600">{systemMetrics.totalUsers}</p>
                        <p className="text-sm text-green-600 ml-2">+12% this month</p>
                      </div>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Pending Reports</h3>
                      <div className="flex items-baseline">
                        <p className="text-3xl font-bold text-yellow-600">{systemMetrics.pendingReports}</p>
                        <p className="text-sm text-yellow-600 ml-2">Require attention</p>
                      </div>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">AI Classifications</h3>
                      <div className="flex items-baseline">
                        <p className="text-3xl font-bold text-purple-600">{systemMetrics.totalClassifications.toLocaleString()}</p>
                        <p className="text-sm text-green-600 ml-2">98.4% accuracy</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Dashboard Quick Stats</h3>
                  <button className="px-3 py-1 bg-white text-blue-600 rounded-md text-sm font-medium hover:bg-gray-50 transition-all">
                    Full Report
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-blue-100 mb-1">Total Products</h4>
                    <p className="text-2xl font-bold">{systemMetrics.totalProducts.toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-100 mb-1">Admin Actions</h4>
                    <p className="text-2xl font-bold">{systemMetrics.adminActions}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-100 mb-1">Active Subscribers</h4>
                    <p className="text-2xl font-bold">{systemMetrics.activeSubscribers}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-100 mb-1">System Status</h4>
                    <p className="text-lg font-bold flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      All Systems Operational
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      <span className="bg-green-100 text-green-600 p-2 rounded-full inline-flex">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        New product added: <span className="font-semibold">T-Motor F60 Pro V</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        2 hours ago by Admin
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      <span className="bg-red-100 text-red-600 p-2 rounded-full inline-flex">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Product deleted: <span className="font-semibold">DYS Samguk Series Shu</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        5 hours ago by Moderator
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      <span className="bg-blue-100 text-blue-600 p-2 rounded-full inline-flex">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Categories updated: <span className="font-semibold">Motors & ESCs</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Yesterday by Admin
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      <span className="bg-yellow-100 text-yellow-600 p-2 rounded-full inline-flex">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        Report resolved: <span className="font-semibold">Inappropriate comment</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        2 days ago by Moderator
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}
          
          {/* Users Tab */}
          {activeTab === 'users' && (
            <Card>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                    Export
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-500 font-medium">
                                {(user.username || user.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.username || 'No Username'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
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
                          <div className="flex space-x-2">
                            <button 
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                              onClick={() => console.log('View user details', user.id)}
                            >
                              View
                            </button>
                            <button 
                              className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 text-sm"
                              onClick={() => console.log('Edit user', user.id)}
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium">{users.length}</span> users
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 border border-gray-300 bg-white rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="px-3 py-1 border border-gray-300 bg-white rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            </Card>
          )}
          
          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <Card>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Content Reports</h3>
                <div className="flex space-x-2">
                  <select className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white">
                    <option value="all">All Reports</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <div className="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No reports</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      There are no content reports to review at this time.
                    </p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <div key={report.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <StatusBadge status={report.status} />
                            <h4 className="text-sm font-medium text-gray-900">
                              {report.type} Report
                            </h4>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-900">Reason:</span> 
                              <span className="text-gray-600 ml-2">{report.reason}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">Description:</span>
                              <div className="text-gray-600 mt-1 bg-gray-50 p-3 rounded-md border border-gray-200">
                                {report.description}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              Reported by <span className="font-medium">{report.reportedBy}</span> on {new Date(report.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {report.status === 'PENDING' && (
                          <div className="flex space-x-2 mt-4 lg:mt-0 lg:ml-4">
                            <button
                              onClick={() => handleReportAction(report.id, 'resolve')}
                              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => handleReportAction(report.id, 'dismiss')}
                              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
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
            </Card>
          )}
          
          {/* Products Tab */}
          {activeTab === 'products' && <AdminProductManager />}
          
          {/* Variants Tab */}
          {activeTab === 'variants' && <ProductVariantManager />}
          
          {/* Resort Tab */}
          {activeTab === 'resort' && <ProductResortPanel />}
          
          {/* Classification Tab */}
          {activeTab === 'classification' && (
            <div className="space-y-6">
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">AI Classification System</h3>
                    <p className="text-gray-600 mt-1">
                      Train and monitor our machine learning classification system for drone parts
                    </p>
                  </div>
                  <button
                    onClick={() => setClassificationGameOpen(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  >
                    <span className="text-xl">🎮</span>
                    Start Training Game
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">🎯</span>
                      <h4 className="font-semibold text-gray-900">Accuracy Focused</h4>
                    </div>
                    <p className="text-gray-700 text-sm">
                      Our AI analyzes product names, descriptions, and technical specifications to categorize components accurately.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border-l-4 border-green-500 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">📊</span>
                      <h4 className="font-semibold text-gray-900">Multi-Method Analysis</h4>
                    </div>
                    <p className="text-gray-700 text-sm">
                      Combines pattern matching, keyword analysis, feature detection, and brand recognition for best results.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">🧠</span>
                      <h4 className="font-semibold text-gray-900">Continuous Learning</h4>
                    </div>
                    <p className="text-gray-700 text-sm">
                      Our system gets smarter over time as it processes more products and receives feedback from users and admins.
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="font-semibold text-lg text-gray-900 mb-4">Classification Performance</h4>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 grid grid-cols-2 md:grid-cols-4">
                      <div className="text-center px-4">
                        <div className="text-sm text-gray-600 mb-1">Accuracy</div>
                        <div className="text-2xl font-bold text-green-600">98.4%</div>
                      </div>
                      <div className="text-center px-4">
                        <div className="text-sm text-gray-600 mb-1">Processed</div>
                        <div className="text-2xl font-bold text-blue-600">45,782</div>
                      </div>
                      <div className="text-center px-4">
                        <div className="text-sm text-gray-600 mb-1">Categories</div>
                        <div className="text-2xl font-bold text-purple-600">8</div>
                      </div>
                      <div className="text-center px-4">
                        <div className="text-sm text-gray-600 mb-1">Learning Rate</div>
                        <div className="text-2xl font-bold text-orange-600">+7.8%</div>
                      </div>
                    </div>
                    
                    <div className="px-6 py-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Category Accuracy</h5>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <span className="text-xs font-medium w-16 text-gray-700">Motors</span>
                          <div className="flex-1 mx-2">
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div className="h-2 bg-green-500 rounded-full" style={{ width: '99.2%' }}></div>
                            </div>
                          </div>
                          <span className="text-xs font-medium w-12 text-gray-700">99.2%</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs font-medium w-16 text-gray-700">Props</span>
                          <div className="flex-1 mx-2">
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div className="h-2 bg-green-500 rounded-full" style={{ width: '98.7%' }}></div>
                            </div>
                          </div>
                          <span className="text-xs font-medium w-12 text-gray-700">98.7%</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs font-medium w-16 text-gray-700">Frames</span>
                          <div className="flex-1 mx-2">
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div className="h-2 bg-green-500 rounded-full" style={{ width: '98.1%' }}></div>
                            </div>
                          </div>
                          <span className="text-xs font-medium w-12 text-gray-700">98.1%</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs font-medium w-16 text-gray-700">Batteries</span>
                          <div className="flex-1 mx-2">
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div className="h-2 bg-green-500 rounded-full" style={{ width: '97.5%' }}></div>
                            </div>
                          </div>
                          <span className="text-xs font-medium w-12 text-gray-700">97.5%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
          
          {/* Scraper Tab */}
          {activeTab === 'scraper' && <ScraperManagement theme="light" />}
          
          {/* Custom Parts Tab */}
          {activeTab === 'custom-parts' && (
            <div className="space-y-6">
              <Card>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Community Custom Parts</h3>
                  <div className="flex space-x-2">
                    <select 
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                    >
                      <option value="All">All Categories</option>
                      <option value="Motors">Motors</option>
                      <option value="Frames">Frames</option>
                      <option value="Stacks">Stacks</option>
                      <option value="Camera">Camera</option>
                      <option value="Props">Props</option>
                      <option value="Batteries">Batteries</option>
                      <option value="Simple Weight">Simple Weight</option>
                    </select>
                    <button 
                      onClick={loadCustomParts}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search custom parts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {customPartsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading custom parts...</p>
                  </div>
                ) : customParts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-300 text-6xl mb-4">🔧</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      No custom parts found
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm || selectedCategory !== 'All' ? 'Try adjusting your search or filters.' : 'No community custom parts have been shared yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {customParts
                      .filter(part =>
                        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        part.description?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((part) => (
                        <div key={part.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 mb-1">{part.name}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {part.category}
                                </span>
                                <span className="text-sm text-gray-500">
                                  by {part.user.username}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {part.description && (
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{part.description}</p>
                          )}

                          {/* Specifications */}
                          <div className="space-y-2 mb-4">
                            <h5 className="text-sm font-medium text-gray-900">Specifications</h5>
                            <div className="space-y-1">
                              {Object.entries(part.specifications).slice(0, 3).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm">
                                  <span className="text-gray-600 capitalize">{key}:</span>
                                  <span className="text-gray-900 font-medium">
                                    {typeof value === 'string' ? value : `${value}`}
                                  </span>
                                </div>
                              ))}
                              {Object.keys(part.specifications).length > 3 && (
                                <div className="text-xs text-gray-500">
                                  +{Object.keys(part.specifications).length - 3} more specs
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{part.viewCount || 0} views</span>
                              <span>{new Date(part.createdAt).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="flex gap-2 mt-3">
                              <button className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors text-sm font-medium">
                                View Details
                              </button>
                              <button className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm font-medium">
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </Card>
            </div>
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Admin Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">System Preferences</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Email Notifications</div>
                        <div className="text-xs text-gray-500">Get notified about important system events</div>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Auto-Moderate Comments</div>
                        <div className="text-xs text-gray-500">Let AI filter inappropriate content</div>
                      </div>
                      <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Security Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Two-Factor Authentication</label>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Enabled</span>
                        <button className="text-sm text-blue-600 hover:text-blue-800">Configure</button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">API Access</label>
                      <div className="flex items-center space-x-4">
                        <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 text-gray-900 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                          <option>Full Access</option>
                          <option>Read Only</option>
                          <option>No Access</option>
                        </select>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">Generate API Key</button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Database Management</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Database Backup</div>
                        <div className="text-xs text-gray-500">Last backup: 3 days ago</div>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">Run Backup</button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Clear Cache</div>
                        <div className="text-xs text-gray-500">Cached items: 2,341</div>
                      </div>
                      <button className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm">Clear Now</button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
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