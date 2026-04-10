'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200/80 bg-white/75 text-slate-700 backdrop-blur-sm">
      <div className="w-full px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="mb-4 text-xl font-semibold tracking-tight text-slate-900">DronePartPicker</h3>
              <p className="mb-5 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Build FPV drones with data-backed component selection, realistic performance estimates,
                and shareable build configurations.
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/C0DE-Z/Drone-Part-Picker"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg border border-slate-300/80 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700"
                >
                  GitHub
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="mb-4 text-base font-semibold text-slate-900">Quick Links</h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/" className="text-sm text-slate-600 hover:text-blue-700">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/builds/public" className="text-sm text-slate-600 hover:text-blue-700">
                    Builds
                  </Link>
                </li>
                <li>
                  <Link href="/parts/custom" className="text-sm text-slate-600 hover:text-blue-700">
                    Custom Parts
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-sm text-slate-600 hover:text-blue-700">
                    My Builds
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="mb-4 text-base font-semibold text-slate-900">Legal</h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/tos" className="text-sm text-slate-600 hover:text-blue-700">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-slate-600 hover:text-blue-700">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <a href="mailto:c0dez3y@gmail.com" className="text-sm text-slate-600 hover:text-blue-700">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-200/80 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-xs font-medium tracking-wide text-slate-500 sm:text-sm">
                © {new Date().getFullYear()} CodeZ. All rights reserved.
              </p>
              <p className="mt-2 text-xs text-slate-500 sm:text-sm md:mt-0">
                Built by CodeZ for the FPV community
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
