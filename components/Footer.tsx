'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-16 bg-gray-100 text-gray-800">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold mb-4">DronePartPicker</h3>
              <p className="text-gray-600 mb-4">
                The ultimate platform for FPV drone builders. Compare components, 
                estimate performance, and share your builds with the community.
              </p>
              <div className="flex space-x-4">
                <a href="https://github.com/C0DE-Z/Drone-Part-Picker" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors">
                  GitHub
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Discord
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
        <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
          <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
          <Link href="/builds/public" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Public Builds
                  </Link>
                </li>
                <li>
          <Link href="/parts/custom" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Custom Parts
                  </Link>
                </li>
                <li>
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
                    My Builds
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
        <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
          <Link href="/tos" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
          <Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
          <a href="mailto:support@dronepartpicker.com" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

      <div className="border-t border-gray-200 mt-8 pt-8 transition-colors">
            <div className="flex flex-col md:flex-row justify-between items-center">
        <p className="text-gray-600 text-sm">
                © {new Date().getFullYear()} DronePartPicker. All rights reserved.
              </p>
        <p className="text-gray-600 text-sm mt-2 md:mt-0">
                Made with ❤️ for the FPV community
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
