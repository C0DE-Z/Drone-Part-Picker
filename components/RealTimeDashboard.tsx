import { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  Download, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Zap,
  Package,
  TrendingUp,
  Moon,
  Sun
} from 'lucide-react';

interface ScrapingJob {
  id: string;
  vendor: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  productsFound?: number;
  productsCreated?: number;
  productsUpdated?: number;
  errorMessage?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price?: number;
  createdAt: string;
  vendorPrices: Array<{
    price: number;
    vendor: {
      name: string;
    };
  }>;
}

interface DashboardStats {
  jobs: ScrapingJob[];
  latestProducts: Product[];
  stats: Array<{
    vendor: string;
    status: string;
    _count: { _all: number };
    _sum: {
      productsFound?: number;
      productsCreated?: number;
      productsUpdated?: number;
    };
  }>;
  runningJobs: ScrapingJob[];
  timestamp: string;
}

export default function RealTimeDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [localTheme, setLocalTheme] = useState<'light' | 'dark'>('light');

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

  const fetchData = async () => {
    try {
      const response = await fetch('/api/scraper/status');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return <Activity className={`w-4 h-4 animate-spin ${localTheme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />;
      case 'COMPLETED':
        return <CheckCircle className={`w-4 h-4 ${localTheme === 'dark' ? 'text-green-400' : 'text-green-500'}`} />;
      case 'FAILED':
        return <XCircle className={`w-4 h-4 ${localTheme === 'dark' ? 'text-red-400' : 'text-red-500'}`} />;
      default:
        return <AlertCircle className={`w-4 h-4 ${localTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />;
    }
  };

  const getStatusColor = (status: string) => {
    if (localTheme === 'dark') {
      switch (status) {
        case 'RUNNING':
          return 'bg-blue-900 text-blue-200';
        case 'COMPLETED':
          return 'bg-green-900 text-green-200';
        case 'FAILED':
          return 'bg-red-900 text-red-200';
        default:
          return 'bg-gray-700 text-gray-200';
      }
    } else {
      switch (status) {
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

  const formatDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    
    if (diffMin > 0) {
      return `${diffMin}m ${diffSec % 60}s`;
    } else {
      return `${diffSec}s`;
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${localTheme === 'dark' ? 'bg-gray-900' : ''}`}>
        <Activity className="w-8 h-8 animate-spin text-blue-500" />
        <span className={`ml-2 ${localTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading dashboard...</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={`p-6 text-center ${localTheme === 'dark' ? 'bg-gray-900 text-gray-300' : 'text-gray-500'}`}>
        Failed to load dashboard data
      </div>
    );
  }

  const totalProductsFound = dashboardData.stats.reduce((sum, stat) => 
    sum + (stat._sum.productsFound || 0), 0
  );
  
  const totalProductsCreated = dashboardData.stats.reduce((sum, stat) => 
    sum + (stat._sum.productsCreated || 0), 0
  );

  return (
    <div className={`p-6 space-y-6 ${localTheme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${localTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Real-Time Scraping Dashboard
        </h2>
        <div className="flex items-center">
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full mr-4 ${
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
          <div className={`flex items-center text-sm ${localTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
            <Clock className="w-4 h-4 mr-1" />
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-6 rounded-lg shadow border ${localTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className={`text-sm font-medium ${localTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Running Jobs</p>
              <p className={`text-2xl font-bold ${localTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{dashboardData.runningJobs.length}</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg shadow border ${localTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center">
            <Database className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className={`text-sm font-medium ${localTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Products Found</p>
              <p className={`text-2xl font-bold ${localTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{totalProductsFound.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg shadow border ${localTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center">
            <Package className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <p className={`text-sm font-medium ${localTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>New Products</p>
              <p className={`text-2xl font-bold ${localTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{totalProductsCreated.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg shadow border ${localTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-orange-500" />
            <div className="ml-4">
              <p className={`text-sm font-medium ${localTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Jobs</p>
              <p className={`text-2xl font-bold ${localTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{dashboardData.jobs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Running Jobs */}
      {dashboardData.runningJobs.length > 0 && (
        <div className={`rounded-lg shadow border ${localTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <div className={`px-6 py-4 border-b ${localTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-medium flex items-center ${localTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              <Zap className="w-5 h-5 text-yellow-500 mr-2" />
              Currently Running
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.runningJobs.map((job) => (
                <div key={job.id} className={`flex items-center justify-between p-4 rounded-lg ${
                  localTheme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'
                }`}>
                  <div className="flex items-center">
                    {getStatusIcon(job.status)}
                    <div className="ml-3">
                      <p className={`font-medium ${localTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{job.vendor}</p>
                      <p className={`text-sm ${localTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        Running for {formatDuration(job.startedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      localTheme === 'dark' ? 
                      (job.status === 'RUNNING' ? 'bg-blue-900 text-blue-200' :
                       job.status === 'COMPLETED' ? 'bg-green-900 text-green-200' :
                       job.status === 'FAILED' ? 'bg-red-900 text-red-200' :
                       'bg-gray-700 text-gray-200') :
                      getStatusColor(job.status)
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Jobs */}
      <div className={`rounded-lg shadow border ${localTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b ${localTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-medium flex items-center ${localTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <Clock className={`w-5 h-5 mr-2 ${localTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            Recent Jobs
          </h3>
        </div>
        <div className="overflow-hidden">
          <table className={`min-w-full divide-y ${localTheme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
            <thead className={localTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  localTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Vendor
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  localTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  localTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Duration
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  localTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Products
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  localTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Started
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              localTheme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'
            }`}>
              {dashboardData.jobs.slice(0, 10).map((job) => (
                <tr key={job.id} className={localTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(job.status)}
                      <span className={`ml-3 text-sm font-medium ${
                        localTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{job.vendor}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      localTheme === 'dark' ? 
                      (job.status === 'RUNNING' ? 'bg-blue-900 text-blue-200' :
                       job.status === 'COMPLETED' ? 'bg-green-900 text-green-200' :
                       job.status === 'FAILED' ? 'bg-red-900 text-red-200' :
                       'bg-gray-700 text-gray-200') :
                      getStatusColor(job.status)
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    localTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {formatDuration(job.startedAt, job.completedAt)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    localTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {job.productsFound || 0} found, {job.productsCreated || 0} new
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    localTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {new Date(job.startedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Latest Products */}
      <div className={`rounded-lg shadow border ${localTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b ${localTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-medium flex items-center ${localTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            <Download className="w-5 h-5 text-green-500 mr-2" />
            Latest Products Scraped
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.latestProducts.slice(0, 9).map((product) => (
              <div 
                key={product.id} 
                className={`rounded-lg p-4 hover:shadow-md transition-shadow border ${
                  localTheme === 'dark' ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className={`font-medium text-sm leading-tight line-clamp-2 ${
                      localTheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {product.name}
                    </h4>
                    <p className={`text-xs mt-1 ${
                      localTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                    }`}>{product.category}</p>
                    {product.vendorPrices.length > 0 && (
                      <p className={`text-sm font-medium mt-2 ${
                        localTheme === 'dark' ? 'text-green-400' : 'text-green-600'
                      }`}>
                        ${product.vendorPrices[0].price}
                      </p>
                    )}
                  </div>
                </div>
                <div className={`mt-3 text-xs ${
                  localTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                }`}>
                  {new Date(product.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
