'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { PublicListing } from '@/lib/serializers';
import ListingCard from '@/components/ListingCard';
import Link from 'next/link';
import {
  Building2,
  Heart,
  Send,
  User as UserIcon,
  PlusCircle,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Trash2,
  ExternalLink,
} from 'lucide-react';

function UserDashboardContent() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'listings' | 'saved' | 'inquiries' | 'profile'>(
    (searchParams.get('tab') as any) || 'listings'
  );

  // Data states
  const [myListings, setMyListings] = useState<PublicListing[]>([]);
  const [savedProperties, setSavedProperties] = useState<PublicListing[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    setName(user.name);
    setPhone(user.phone);
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resListings, resSaved, resInquiries] = await Promise.all([
        fetch('/api/user/listings'),
        fetch('/api/saved-properties'),
        fetch('/api/inquiries'),
      ]);

      if (resListings.ok) {
        const d = await resListings.json();
        setMyListings(d.data || []);
      }
      if (resSaved.ok) {
        const d = await resSaved.json();
        setSavedProperties(d.data || []);
      }
      if (resInquiries.ok) {
        const d = await resInquiries.json();
        setInquiries(d.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password: password || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMsg('Profile updated successfully!');
        setPassword('');
        await refreshUser();
      } else {
        setProfileMsg(data.error || 'Failed to update profile.');
      }
    } catch {
      setProfileMsg('Network error updating profile.');
    }
  };

  const handleDeleteListing = async (id: number) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMyListings((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="py-8 space-y-6">
      {/* Dashboard Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            Pune Real Estate Account
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{user?.email} • +91 {user?.phone}</p>
        </div>

        <Link
          href="/listings/new"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post Listing Free</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-3 flex items-center space-x-1.5 transition ${
            activeTab === 'listings'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>My Listings ({myListings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-3 flex items-center space-x-1.5 transition ${
            activeTab === 'saved'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Saved Properties ({savedProperties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`pb-3 flex items-center space-x-1.5 transition ${
            activeTab === 'inquiries'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Inquiries Sent ({inquiries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 flex items-center space-x-1.5 transition ${
            activeTab === 'profile'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profile Settings</span>
        </button>
      </div>

      {/* Tab 1: My Listings */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading your listings...</div>
          ) : myListings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">You haven't posted any listings yet</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Post flats, houses or plots for Sale or Rent in Pune.</p>
              <Link
                href="/listings/new"
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold inline-block"
              >
                + Post First Listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myListings.map((item) => (
                <div key={item.id} className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="aspect-[16/9] w-full bg-slate-100 relative">
                      <img
                        src={item.coverImage || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Status Tag */}
                      <span
                        className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-sm ${
                          item.status === 'approved'
                            ? 'bg-emerald-600 text-white'
                            : item.status === 'pending'
                            ? 'bg-amber-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        Status: {item.status}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{item.title}</h4>
                      <div className="text-xs text-slate-500">{item.locality}, Pune ({item.pincode})</div>
                      <div className="text-xs font-bold text-emerald-700">
                        ₹{item.price.toLocaleString('en-IN')} {item.listingType === 'Rent' ? '/mo' : ''}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                    <Link
                      href={`/listings/${item.slug || item.id}`}
                      className="text-slate-700 hover:text-emerald-700 flex items-center space-x-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View</span>
                    </Link>

                    <button
                      onClick={() => handleDeleteListing(item.id)}
                      className="text-red-600 hover:text-red-700 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Saved Properties */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedProperties.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Heart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No saved properties</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Click the heart icon on any listing to save it here.</p>
              <Link href="/search" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold inline-block">
                Browse Pune Properties
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedProperties.map((item) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  isSavedInitial={true}
                  onSaveToggle={(id, saved) => {
                    if (!saved) {
                      setSavedProperties((prev) => prev.filter((p) => p.id !== id));
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Inquiries Sent to Broker */}
      {activeTab === 'inquiries' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {inquiries.length === 0 ? (
            <div className="p-12 text-center">
              <Send className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No inquiries sent yet</p>
              <p className="text-xs text-slate-500 mt-1">Inquiries sent on property detail pages will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {inquiries.map((inq) => (
                <div key={inq.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{inq.property_title}</span>
                      <span className="text-[10px] text-slate-400">({inq.property_locality}, Pune)</span>
                    </div>
                    <p className="text-xs text-slate-600 italic">"{inq.message}"</p>
                    <div className="text-[11px] text-slate-400">
                      Visit requested: {inq.preferred_visit_time || 'Anytime'} • Sent on {new Date(inq.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        inq.status === 'closed'
                          ? 'bg-slate-100 text-slate-700'
                          : inq.status === 'contacted'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {inq.status}
                    </span>
                    <Link
                      href={`/listings/${inq.property_slug || inq.listing_id}`}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                    >
                      View Property
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Profile Settings */}
      {activeTab === 'profile' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 max-w-xl">
          <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            Edit Your Profile & Password
          </h3>

          {profileMsg && (
            <div className="p-3 mb-4 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold">
              {profileMsg}
            </div>
          )}

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Change Password (leave blank to keep current)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              Save Profile Changes
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function UserDashboard() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading user dashboard...</div>}>
      <UserDashboardContent />
    </React.Suspense>
  );
}
