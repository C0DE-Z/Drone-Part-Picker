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
                🚁 Build epic FPV drones! Find the perfect parts, see how they&apos;ll perform, 
                and share your creations with fellow pilots who get it.
              </p>
              <div className="flex space-x-4">
                <a href="https://github.com/C0DE-Z/Drone-Part-Picker" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors">
                  GitHub
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">🔗 Quick Jumps</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/builds/public" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Builds
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
              <h4 className="text-lg font-semibold mb-4">📋 The Fine Print</h4>
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
                  <a href="mailto:c0dez3y@gmail.com" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Hit Us Up
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 transition-colors">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-600 text-sm">
                © {new Date().getFullYear()} CodeZ. All rights reserved.
              </p>
              <p className="text-gray-600 text-sm mt-2 md:mt-0">
                Made with ❤️ by CodeZ, for drone enthusiasts
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
