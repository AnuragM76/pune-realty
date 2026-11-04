'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Building2, PlusCircle, User, LogOut, ShieldCheck, Heart, Menu, X, PhoneCall } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & City Badge */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">
                  Pune<span className="text-emerald-600">Realty</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mt-0.5">
                  Direct Broker Listings
                </span>
              </div>
            </Link>

            {/* Pune Locked Badge */}
            <div className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Pune, MH Only</span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-700">
            <Link href="/search?listingType=Buy" className="hover:text-emerald-600 transition">
              Properties for Sale
            </Link>
            <Link href="/search?listingType=Rent" className="hover:text-emerald-600 transition">
              Properties for Rent
            </Link>
            <Link href="/search" className="hover:text-emerald-600 transition">
              Explore Localities
            </Link>
          </nav>

          {/* Actions & User state */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/listings/new"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Post Listing Free</span>
            </Link>

            {user ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
                {user.role === 'admin' ? (
                  <Link
                    href="/admin"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition"
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Broker Portal</span>
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  >
                    <User className="w-4 h-4" />
                    <span>My Dashboard</span>
                  </Link>
                )}

                <Link
                  href="/dashboard?tab=saved"
                  title="Saved Properties"
                  className="p-2 text-slate-600 hover:text-red-500 hover:bg-slate-50 rounded-lg transition"
                >
                  <Heart className="w-5 h-5" />
                </Link>

                <button
                  onClick={() => logout()}
                  title="Log out"
                  className="p-2 text-slate-500 hover:text-slate-800 rounded-lg transition"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <Link
                  href="/login"
                  className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-3.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="flex items-center space-x-2 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-medium text-slate-500">Region Locked to Pune, Maharashtra</span>
          </div>

          <div className="flex flex-col space-y-2 pt-2 border-t border-slate-100">
            <Link
              href="/search?listingType=Buy"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Properties for Sale
            </Link>
            <Link
              href="/search?listingType=Rent"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Properties for Rent
            </Link>
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              All Listings
            </Link>
            <Link
              href="/listings/new"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white text-center"
            >
              + Post Listing Free
            </Link>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2">
            {user ? (
              <>
                <div className="text-xs font-semibold text-slate-400 px-3">Signed in as {user.name}</div>
                {user.role === 'admin' ? (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 text-sm font-semibold text-purple-700 bg-purple-50 rounded-md"
                  >
                    Admin Broker Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 text-sm font-medium text-slate-800 bg-slate-50 rounded-md"
                  >
                    User Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 bg-emerald-600 text-white rounded-md text-sm font-medium"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
