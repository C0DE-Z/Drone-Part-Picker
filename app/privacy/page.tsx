'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
              <p className="text-gray-600">Last updated: 2025-08-04</p>
            </div>

            <div className="prose prose-gray max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Who I Am</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  I&apos;m an individual developer building DronePartPicker as a personal project. This Privacy Policy explains how I handle any data collected through the website.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. What I Collect</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  This site may collect basic data such as:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Email and username (if you sign up)</li>
                  <li>Build configurations you create</li>
                  <li>Browser and usage data (like IP, clicks, or page views)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Why I Collect It</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  I only use this information to:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                  <li>Improve the website</li>
                  <li>Let users save and share builds</li>
                  <li>Fix bugs or track usage</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How It&apos;s Stored</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Your data is stored securely and is not shared or sold. I&apos;m using standard tools (like a database or analytics platform) that may store some information to make the site work better.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Your Choices</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You can contact me anytime to ask what data I have, or to request that your information be deleted. Just send me an email.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Contact</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you have questions about this Privacy Policy or your data, reach out at:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">Email: c0dez3y@gmail.com</p>
                </div>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
