'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  BarChart3,
  Settings
} from 'lucide-react';
import RealTimeDashboard from './RealTimeDashboard';

interface ScrapingJob {
  id: string;
  vendor: string;
  category?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  productsFound: number;
  productsUpdated: number;
  productsCreated: number;
  createdAt: string;
}

interface ScheduleStatus {
  isRunning: boolean;
  scheduledJobs: Array<{
    name: string;
    exists: boolean;
  }>;
}

interface ScraperManagementProps {
  theme: 'light' | 'dark';
}

export default function ScraperManagement({ theme }: ScraperManagementProps) {
  const [activeTab, setActiveTab] = useState('scraper');
  const [jobs, setJobs] = useState<ScrapingJob[]>([]);
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [usePuppeteer] = useState(false);
  const [useDeploymentFriendly, setUseDeploymentFriendly] = useState(true);
  const [crawlerVendors, setCrawlerVendors] = useState<string[]>([]);
  const [maxPages, setMaxPages] = useState('500');
  const [maxProducts, setMaxProducts] = useState('500');
  const [sitemapVendors, setSitemapVendors] = useState<string[]>([]);

  const vendors = [
    { value: '', label: 'All Vendors' },
    { value: 'GetFPV', label: 'GetFPV' },
    { value: 'RDQ', label: 'Race Day Quads' }
  ];

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'motors', label: 'Motors' },
    { value: 'frames', label: 'Frames' },
    { value: 'flight_controllers', label: 'Flight Controllers' },
    { value: 'cameras', label: 'Cameras' },
    { value: 'propellers', label: 'Propellers' },
    { value: 'batteries', label: 'Batteries' }
  ];

  useEffect(() => {
    loadJobs();
    loadScheduleStatus();
    loadSitemapVendors();
    loadCrawlerVendors();
  }, []);

  const loadJobs = async () => {
    try {
      const response = await fetch('/api/scraper');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const loadScheduleStatus = async () => {
    try {
      const response = await fetch('/api/scraper/schedule');
      const data = await response.json();
      setScheduleStatus(data);
    } catch (error) {
      console.error('Error loading schedule status:', error);
    }
  };

  const loadSitemapVendors = async () => {
    try {
      const response = await fetch('/api/scraper/sitemap');
      const data = await response.json();
      setSitemapVendors(data.availableVendors || []);
    } catch (error) {
      console.error('Error loading sitemap vendors:', error);
    }
  };

  const loadCrawlerVendors = async () => {
    try {
      const response = await fetch('/api/scraper/crawler');
      const data = await response.json();
      setCrawlerVendors(data.vendors || []);
    } catch (error) {
      console.error('Error loading crawler vendors:', error);
    }
  };

  const startScraping = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendor: selectedVendor || undefined,
          category: selectedCategory || undefined,
          usePuppeteer: useDeploymentFriendly ? false : usePuppeteer
        })
      });

      if (response.ok) {
        await loadJobs();
      }
    } catch (error) {
      console.error('Error starting scraping:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSitemapScraping = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scraper/sitemap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendor: selectedVendor,
          maxProducts: parseInt(maxProducts)
        })
      });

      if (response.ok) {
        await loadJobs();
      }
    } catch (error) {
      console.error('Error starting sitemap scraping:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCrawling = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scraper/crawler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendor: selectedVendor,
          maxPages: parseInt(maxPages)
        }),
      });

      if (response.ok) {
        await loadJobs();
      }
    } catch (error) {
      console.error('Error starting crawler:', error);
    } finally {
      setLoading(false);
    }
  };

  const manageSchedule = async (action: string) => {
    try {
      const response = await fetch('/api/scraper/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        await loadScheduleStatus();
      }
    } catch (error) {
      console.error('Error managing schedule:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'RUNNING':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    if (theme === 'dark') {
      switch (status) {
        case 'PENDING':
          return 'bg-yellow-900 text-yellow-200';
        case 'RUNNING':
          return 'bg-blue-900 text-blue-200';
        case 'COMPLETED':
          return 'bg-green-900 text-green-200';
        case 'FAILED':
          return 'bg-red-900 text-red-200';
        default:
          return 'bg-gray-700 text-gray-300';
      }
    } else {
      switch (status) {
        case 'PENDING':
          return 'bg-yellow-100 text-yellow-800';
        case 'RUNNING':
          return 'bg-blue-100 text-blue-800';
        case 'COMPLETED':
          return 'bg-green-100 text-green-800';
        case 'FAILED':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffHour > 0) {
      return `${diffHour}h ${diffMin % 60}m`;
    } else if (diffMin > 0) {
      return `${diffMin}m ${diffSec % 60}s`;
    } else {
      return `${diffSec}s`;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Web Scraper Management
        </h1>
        <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
          Manage web scraping jobs and monitor price updates from drone retailers.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : theme === 'dark'
                  ? 'border-transparent text-gray-300 hover:text-gray-100 hover:border-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Real-Time Dashboard
          </button>
          <button
            onClick={() => setActiveTab('scraper')}
            className={`${
              activeTab === 'scraper'
                ? 'border-blue-500 text-blue-600'
                : theme === 'dark'
                  ? 'border-transparent text-gray-300 hover:text-gray-100 hover:border-gray-300'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Scraper Controls
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' ? (
        <RealTimeDashboard />
      ) : (
        <>
          {/* Existing scraper management content */}

      {/* Schedule Management */}
      <div className={`rounded-lg shadow-md p-6 mb-6 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h2 className={`text-xl font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Scheduled Jobs</h2>
        
        {scheduleStatus && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                scheduleStatus.isRunning 
                  ? theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                  : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
              }`}>
                {scheduleStatus.isRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
            
            <div className={`text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Scheduled jobs: {scheduleStatus.scheduledJobs.map(job => job.name).join(', ')}
            </div>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={() => manageSchedule('start')}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Start Schedule</span>
          </button>
          
          <button
            onClick={() => manageSchedule('stop')}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Pause className="w-4 h-4" />
            <span>Stop Schedule</span>
          </button>
          
          <button
            onClick={() => manageSchedule('trigger-full')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Trigger Full Scrape</span>
          </button>
          
          <button
            onClick={() => manageSchedule('trigger-price-update')}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Trigger Price Update</span>
          </button>
        </div>
      </div>

      {/* Manual Scraping */}
      <div className={`rounded-lg shadow-md p-6 mb-6 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h2 className={`text-xl font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Manual Scraping (Category-based)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              theme === 'dark' 
                ? 'bg-gray-700 text-white border-gray-600' 
                : 'bg-white text-gray-900 border-gray-300'
            }`}
          >
            {vendors.map(vendor => (
              <option key={vendor.value} value={vendor.value}>{vendor.label}</option>
            ))}
          </select>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              theme === 'dark' 
                ? 'bg-gray-700 text-white border-gray-600' 
                : 'bg-white text-gray-900 border-gray-300'
            }`}
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={startScraping}
              disabled={loading}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>Start Scraping</span>
            </button>
            
            <label className={`flex items-center space-x-2 text-sm ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <input
                type="checkbox"
                checked={useDeploymentFriendly}
                onChange={(e) => setUseDeploymentFriendly(e.target.checked)}
                className={`rounded focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                }`}
              />
              <span>Production Mode (no browser)</span>
            </label>
          </div>
        </div>
        
        {useDeploymentFriendly && (
          <div className={`mt-4 p-4 rounded-lg ${
            theme === 'dark' 
              ? 'bg-green-900/20 border border-green-800' 
              : 'bg-green-50 border border-green-200'
          }`}>
            <h3 className={`text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-green-300' : 'text-green-800'
            }`}>Production Mode Test</h3>
            <p className={`text-xs mb-3 ${
              theme === 'dark' ? 'text-green-400' : 'text-green-700'
            }`}>
              Test the deployment-friendly scraper without browser dependencies.
            </p>
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const response = await fetch('/api/scraper/test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      vendor: selectedVendor || 'getfpv',
                      category: selectedCategory || 'motors'
                    })
                  });
                  const result = await response.json();
                  console.log('Test result:', result);
                } catch (error) {
                  console.error('Test failed:', error);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
            >
              Test Production Scraper
            </button>
          </div>
        )}
      </div>

      {/* Sitemap-based Scraping */}
      <div className={`rounded-lg shadow-md p-6 mb-6 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h2 className={`text-xl font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>🗺️ Sitemap-based Scraping (Recommended)</h2>
        <p className={`mb-4 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Automatically discovers all products from vendor sitemaps. Handles URL modifications like .html extensions.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              theme === 'dark' 
                ? 'bg-gray-700 text-white border-gray-600' 
                : 'bg-white text-gray-900 border-gray-300'
            }`}
          >
            <option value="">Select Vendor</option>
            {sitemapVendors.map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>
          
          <input
            type="number"
            value={maxProducts}
            onChange={(e) => setMaxProducts(e.target.value)}
            placeholder="Max products (500)"
            min="50"
            max="2000"
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              theme === 'dark' 
                ? 'bg-gray-700 text-white border-gray-600' 
                : 'bg-white text-gray-900 border-gray-300'
            }`}
          />
          
          <button
            onClick={startSitemapScraping}
            disabled={loading || !selectedVendor}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Activity className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            <span>Start Sitemap Scraping</span>
          </button>
        </div>
        
        <div className={`text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <p>• Automatically finds all product URLs from sitemap</p>
          <p>• Handles GetFPV .html extension requirement</p>
          <p>• Discovers products across all categories</p>
          <p>• More comprehensive than category-based scraping</p>
        </div>
      </div>

      {/* Web Crawler */}
      <div className={`rounded-lg shadow-md p-6 mb-6 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h2 className={`text-xl font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>🕷️ Web Crawler (For sites without sitemaps)</h2>
        <p className={`mb-4 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Crawls websites by following links from category pages. Works for sites without sitemaps or with incomplete sitemaps.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              theme === 'dark' 
                ? 'bg-gray-700 text-white border-gray-600' 
                : 'bg-white text-gray-900 border-gray-300'
            }`}
          >
            <option value="">Select Vendor</option>
            {crawlerVendors.map(vendor => (
              <option key={vendor} value={vendor}>{vendor}</option>
            ))}
          </select>
          
          <input
            type="number"
            value={maxPages}
            onChange={(e) => setMaxPages(e.target.value)}
            placeholder="Max pages (500)"
            min="50"
            max="2000"
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              theme === 'dark' 
                ? 'bg-gray-700 text-white border-gray-600' 
                : 'bg-white text-gray-900 border-gray-300'
            }`}
          />
          
          <button
            onClick={startCrawling}
            disabled={loading || !selectedVendor}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Activity className="w-4 h-4 animate-spin" />
            ) : (
              <Activity className="w-4 h-4" />
            )}
            <span>Start Web Crawling</span>
          </button>
        </div>
        
        <div className={`text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <p>• Starts from category pages and follows links</p>
          <p>• Discovers product pages automatically</p>
          <p>• Works for sites without complete sitemaps</p>
          <p>• Respects rate limits and robots.txt</p>
        </div>
      </div>

      {/* Job History */}
      <div className={`rounded-lg shadow-md p-6 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Scraping Jobs</h2>
          <button
            onClick={loadJobs}
            className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'text-blue-400 hover:bg-gray-700' 
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <th className={`text-left py-3 px-4 font-medium ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                }`}>Status</th>
                <th className={`text-left py-3 px-4 font-medium ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                }`}>Vendor</th>
                <th className={`text-left py-3 px-4 font-medium ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                }`}>Category</th>
                <th className={`text-left py-3 px-4 font-medium ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                }`}>Started</th>
                <th className={`text-left py-3 px-4 font-medium ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                }`}>Duration</th>
                <th className={`text-left py-3 px-4 font-medium ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                }`}>Results</th>
                <th className={`text-left py-3 px-4 font-medium ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                }`}>Error</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id} className={`border-b ${
                  theme === 'dark' 
                    ? 'border-gray-700 hover:bg-gray-700' 
                    : 'border-gray-100 hover:bg-gray-50'
                }`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(job.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                  </td>
                  <td className={`py-3 px-4 font-medium ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                  }`}>{job.vendor}</td>
                  <td className={`py-3 px-4 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                  }`}>{job.category || 'All'}</td>
                  <td className={`py-3 px-4 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                  }`}>
                    {job.startedAt ? formatDate(job.startedAt) : '-'}
                  </td>
                  <td className={`py-3 px-4 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                  }`}>
                    {job.startedAt ? formatDuration(job.startedAt, job.completedAt) : '-'}
                  </td>
                  <td className={`py-3 px-4 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-800'
                  }`}>
                    <div className="text-xs">
                      <div>Found: {job.productsFound}</div>
                      <div>Created: {job.productsCreated}</div>
                      <div>Updated: {job.productsUpdated}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {job.errorMessage && (
                      <div className={`text-xs max-w-xs truncate ${
                        theme === 'dark' ? 'text-red-400' : 'text-red-600'
                      }`} title={job.errorMessage}>
                        {job.errorMessage}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {jobs.length === 0 && (
          <div className={`text-center py-8 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            No scraping jobs found.
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
