'use client';

import { useState } from 'react';

export default function AdminDiagnostic() {
  const [resortTest, setResortTest] = useState('');
  const [productsTest, setProductsTest] = useState('');

  const testResortAPI = async () => {
    try {
      setResortTest('Testing...');
      const response = await fetch('/api/admin/resort?action=report');
      const data = await response.json();
      
      if (data.success) {
        setResortTest(`✅ Resort API Working - Found ${Object.keys(data.data.categoryDistribution || {}).length} categories`);
      } else {
        setResortTest(`❌ Resort API Error: ${data.error}`);
      }
    } catch (error) {
      setResortTest(`❌ Resort API Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testProductsAPI = async () => {
    try {
      setProductsTest('Testing...');
      const response = await fetch('/api/admin/products?page=1&limit=5');
      const data = await response.json();
      
      if (data.success) {
        setProductsTest(`✅ Products API Working - Found ${data.data.pagination.total} total products`);
      } else {
        setProductsTest(`❌ Products API Error: ${data.error}`);
      }
    } catch (error) {
      setProductsTest(`❌ Products API Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Admin Panel Diagnostic</h2>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Product Resort API Test</h3>
          <button
            onClick={testResortAPI}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mb-2"
          >
            Test Resort API
          </button>
          <p className="text-sm">{resortTest}</p>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Products Management API Test</h3>
          <button
            onClick={testProductsAPI}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 mb-2"
          >
            Test Products API
          </button>
          <p className="text-sm">{productsTest}</p>
        </div>

        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="font-semibold mb-2">Expected Admin Panel Features</h3>
          <ul className="text-sm space-y-1">
            <li>✅ <strong>Resort Products Tab:</strong> Should allow reclassifying products using the hybrid system</li>
            <li>✅ <strong>Manage Products Tab:</strong> Should allow viewing, searching, editing, and deleting products</li>
            <li>✅ <strong>Search & Filter:</strong> Products can be searched by name/brand and filtered by category</li>
            <li>✅ <strong>Edit Modal:</strong> Click edit on any product to open editing interface</li>
          </ul>
        </div>

        <div className="border rounded-lg p-4 bg-yellow-50">
          <h3 className="font-semibold mb-2">Troubleshooting Tips</h3>
          <ul className="text-sm space-y-1">
            <li>🔍 <strong>Make sure you&apos;re logged in as an admin user</strong></li>
            <li>🔍 <strong>Check browser console for any JavaScript errors</strong></li>
            <li>🔍 <strong>Verify the &quot;Manage Products&quot; and &quot;Product Resort&quot; tabs are visible</strong></li>
            <li>🔍 <strong>Try refreshing the page if components aren&apos;t loading</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
}