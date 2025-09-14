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
  TrendingUp
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
        return <Activity className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
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
      <div className="flex items-center justify-center p-8">
        <Activity className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6 text-center text-gray-500">
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Real-Time Scraping Dashboard</h2>
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="w-4 h-4 mr-1" />
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Running Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.runningJobs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Database className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Products Found</p>
              <p className="text-2xl font-bold text-gray-900">{totalProductsFound.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New Products</p>
              <p className="text-2xl font-bold text-gray-900">{totalProductsCreated.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.jobs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Running Jobs */}
      {dashboardData.runningJobs.length > 0 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Zap className="w-5 h-5 text-yellow-500 mr-2" />
              Currently Running
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {dashboardData.runningJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    {getStatusIcon(job.status)}
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{job.vendor}</p>
                      <p className="text-sm text-gray-500">
                        Running for {formatDuration(job.startedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
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
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Clock className="w-5 h-5 text-gray-500 mr-2" />
            Recent Jobs
          </h3>
        </div>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.jobs.slice(0, 10).map((job) => (
                <tr key={job.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(job.status)}
                      <span className="ml-3 text-sm font-medium text-gray-900">{job.vendor}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDuration(job.startedAt, job.completedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.productsFound || 0} found, {job.productsCreated || 0} new
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(job.startedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Latest Products */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Download className="w-5 h-5 text-green-500 mr-2" />
            Latest Products Scraped
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.latestProducts.slice(0, 9).map((product) => (
              <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
                      {product.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">{product.category}</p>
                    {product.vendorPrices.length > 0 && (
                      <p className="text-sm font-medium text-green-600 mt-2">
                        ${product.vendorPrices[0].price}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-400">
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
