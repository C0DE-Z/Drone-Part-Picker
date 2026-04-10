'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Menu, X, Search, User, Heart } from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="group flex items-center space-x-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md ring-1 ring-blue-400/30 transition-transform group-hover:scale-[1.04]">
                <span className="text-sm font-bold text-white">DP</span>
              </div>
              <span className="text-lg font-semibold tracking-tight text-slate-900">DronePartPicker</span>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="mx-8 hidden max-w-lg flex-1 md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Find that perfect part..."
                className="w-full rounded-xl border border-slate-300/80 bg-white/90 py-2 pl-10 pr-4 text-sm text-slate-800 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center space-x-6 md:flex">
            <Link href="/builds" className="text-sm font-medium text-slate-600 hover:text-blue-700">
              Builds
            </Link>
            <Link href="/calculator" className="text-sm font-medium text-slate-600 hover:text-blue-700">
              Build Helper
            </Link>
            <Link href="/parts" className="text-sm font-medium text-slate-600 hover:text-blue-700">
              Parts
            </Link>
            <Link href="/prices" className="text-sm font-medium text-slate-600 hover:text-blue-700">
              Price Check
            </Link>

            {session ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/favorites"
                  className="rounded-lg border border-slate-300/80 bg-white px-2.5 py-2 text-slate-600 shadow-sm hover:border-blue-300 hover:text-blue-700"
                >
                  <Heart className="h-4.5 w-4.5" />
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-2 rounded-xl border border-slate-300/80 bg-white px-2 py-1.5 text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="max-w-[160px] truncate text-sm font-medium">
                      {session.user?.name || (session.user?.email ? session.user.email.split('@')[0] : 'Account')}
                    </span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="invisible absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100">
                    <Link href="/profile" className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                      Your Profile
                    </Link>
                    <Link href="/builds" className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                      Your Builds
                    </Link>
                    <Link href="/settings" className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                      Settings
                    </Link>
                    <hr className="my-1 border-slate-200" />
                    <button
                      onClick={() => signOut()}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => signIn()}
                  className="text-sm font-medium text-slate-700 hover:text-blue-700"
                >
                  Sign In
                </button>
                <button
                  onClick={() => signIn()}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
                >
                  Start Building!
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              className="rounded-lg border border-slate-300/80 bg-white p-2 text-slate-700 shadow-sm hover:text-blue-700"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Find that perfect part..."
              className="w-full rounded-xl border border-slate-300/80 bg-white py-2 pl-10 pr-4 text-sm text-slate-800 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            <Link
              href="/builds"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700"
            >
              Builds
            </Link>
            <Link
              href="/calculator"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700"
            >
              Build Helper
            </Link>
            <Link
              href="/parts"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700"
            >
              Parts
            </Link>
            <Link
              href="/prices"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700"
            >
              Price Check
            </Link>
            <Link
              href="/guides"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700"
            >
              How-To Guides
            </Link>
            
            {session ? (
              <>
                <Link
                  href="/profile"
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700"
                >
                  Profile
                </Link>
                <Link
                  href="/favorites"
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700"
                >
                  Favorites
                </Link>
                <button
                  onClick={() => signOut()}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="space-y-2 px-3 py-2">
                <button
                  onClick={() => signIn()}
                  className="w-full text-left text-sm font-medium text-slate-700 hover:text-blue-700"
                >
                  Sign In
                </button>
                <button
                  onClick={() => signIn()}
                  className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700"
                >
                  Start Building!
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
