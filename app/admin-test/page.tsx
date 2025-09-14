/**
 * Quick test page for admin functionality
 */

import AdminDiagnostic from '@/components/AdminDiagnostic';

export default function AdminTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Admin Panel Test</h1>
        <AdminDiagnostic />
        
        <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Quick Access Links</h2>
          <div className="space-y-2">
            <a 
              href="/admin" 
              className="block w-full text-center bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Admin Dashboard
            </a>
            <p className="text-sm text-gray-600 text-center">
              Make sure you&apos;re logged in as an admin user to access the dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}