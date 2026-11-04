'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AdminListing } from '@/lib/serializers';
import {
  ShieldCheck,
  Building,
  Users,
  Send,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  Sliders,
  Settings,
  AlertTriangle,
  PhoneCall,
  Lock,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'overview' | 'listings' | 'inquiries' | 'users' | 'settings'>('overview');

  // Stats & Overview
  const [stats, setStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  // Listings state (AdminListing contains PRIVATE owner details)
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [listingFilter, setListingFilter] = useState('all');

  // Inquiries state
  const [inquiries, setInquiries] = useState<any[]>([]);

  // Users state
  const [usersList, setUsersList] = useState<any[]>([]);

  // Settings
  const [brokerSettings, setBrokerSettings] = useState({
    broker_name: 'Pune Prime Properties (Broker Admin)',
    broker_phone: '+91 98220 12345',
    broker_email: 'contact@puneprimeproperties.in',
    broker_office: 'FC Road, Deccan Gymkhana, Pune 411004',
    site_name: 'PuneRealty',
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Selected Listing Modal for viewing Private Owner Details
  const [selectedListing, setSelectedListing] = useState<AdminListing | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    if (user && user.role === 'admin') {
      loadAllAdminData();
    }
  }, [user]);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [resOverview, resListings, resInquiries, resUsers] = await Promise.all([
        fetch('/api/admin/overview'),
        fetch('/api/listings?limit=50'),
        fetch('/api/inquiries'),
        fetch('/api/admin/users'),
      ]);

      if (resOverview.ok) {
        const d = await resOverview.json();
        setStats(d.stats);
        setRecentLogs(d.recentLogs || []);
      }
      if (resListings.ok) {
        const d = await resListings.json();
        setListings(d.data || []);
      }
      if (resInquiries.ok) {
        const d = await resInquiries.json();
        setInquiries(d.data || []);
      }
      if (resUsers.ok) {
        const d = await resUsers.json();
        setUsersList(d.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleListingStatus = async (id: number, status: string, rejectionReason?: string) => {
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason }),
      });
      if (res.ok) {
        setListings((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status, rejectionReason: rejectionReason || null } : item))
        );
        if (selectedListing && selectedListing.id === id) {
          setSelectedListing((prev) => (prev ? { ...prev, status } : null));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInquiryStatus = async (id: number, status: string, brokerNotes?: string) => {
    try {
      const res = await fetch('/api/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, brokerNotes }),
      });
      if (res.ok) {
        setInquiries((prev) =>
          prev.map((inq) => (inq.id === id ? { ...inq, status, broker_notes: brokerNotes || inq.broker_notes } : inq))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserActive = async (userId: number, currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !currentActive }),
      });
      if (res.ok) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, is_active: !currentActive } : u))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: brokerSettings }),
      });
      if (res.ok) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredListings = listings.filter((item) => {
    if (listingFilter === 'all') return true;
    return item.status === listingFilter;
  });

  return (
    <div className="py-8 space-y-6">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Broker Administrator Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Pune Broker Operations Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Moderation, Private Landlord Contacts, Lead Routing, and Platform Controls.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="/api/admin/export?type=inquiries"
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Inquiries CSV</span>
          </a>
          <a
            href="/api/admin/export?type=listings&includeOwner=true"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Master Listings</span>
          </a>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 flex items-center space-x-1.5 whitespace-nowrap transition ${
            activeTab === 'overview' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-3 flex items-center space-x-1.5 whitespace-nowrap transition ${
            activeTab === 'listings' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Listings & Approvals ({listings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`pb-3 flex items-center space-x-1.5 whitespace-nowrap transition ${
            activeTab === 'inquiries' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Broker Leads & Inquiries ({inquiries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 flex items-center space-x-1.5 whitespace-nowrap transition ${
            activeTab === 'users' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Registered Users ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 flex items-center space-x-1.5 whitespace-nowrap transition ${
            activeTab === 'settings' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Broker Settings & Public Contact</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Pune Listings
              </span>
              <span className="text-3xl font-black text-slate-900 mt-1 block">
                {stats?.totalListings || 0}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider block">
                Pending Approvals
              </span>
              <span className="text-3xl font-black text-amber-600 mt-1 block">
                {stats?.pendingApprovals || 0}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                Broker Leads Today
              </span>
              <span className="text-3xl font-black text-emerald-600 mt-1 block">
                {stats?.todayInquiries || 0}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Users
              </span>
              <span className="text-3xl font-black text-slate-900 mt-1 block">
                {stats?.activeUsers || 0}
              </span>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Admin Broker Audit Logs
            </h3>
            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-400">No admin events recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {recentLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <span className="text-slate-500 ml-2">on {log.entity_type} #{log.entity_id || ''}</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Listings Moderation & PRIVATE OWNER VIEW */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center space-x-2 pb-2">
            {['all', 'pending', 'approved', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setListingFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                  listingFilter === st
                    ? 'bg-purple-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Property</th>
                  <th className="p-4">Locality</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Private Owner (Broker Only)</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredListings.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 line-clamp-1">{prop.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {prop.propertyCategory} • {prop.bhk || ''} • {prop.carpetAreaSqft} sq.ft
                      </div>
                      {prop.hasContactLeakFlag && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Contact detected in description</span>
                        </span>
                      )}
                    </td>

                    <td className="p-4 whitespace-nowrap font-medium text-slate-700">
                      {prop.locality}, Pune ({prop.pincode})
                    </td>

                    <td className="p-4 whitespace-nowrap font-bold text-slate-900">
                      ₹{prop.price.toLocaleString('en-IN')} {prop.listingType === 'Rent' ? '/mo' : ''}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          prop.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : prop.status === 'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {prop.status}
                      </span>
                    </td>

                    {/* STRICTLY PRIVATE OWNER DETAILS - Only visible here to Admin */}
                    <td className="p-4">
                      <div className="bg-purple-50/70 p-2 rounded-lg border border-purple-100 max-w-xs">
                        <div className="font-bold text-purple-900 flex items-center space-x-1">
                          <Lock className="w-3 h-3 text-purple-700" />
                          <span>{prop.ownerDetails?.ownerName || 'Unknown Landlord'}</span>
                        </div>
                        <div className="text-[11px] text-purple-800 font-mono mt-0.5">
                          📞 {prop.ownerDetails?.ownerPhone || 'No Phone'}
                        </div>
                        {prop.ownerDetails?.notes && (
                          <div className="text-[10px] text-slate-600 italic mt-1 line-clamp-1">
                            Notes: {prop.ownerDetails.notes}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedListing(prop)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                      >
                        Inspect
                      </button>

                      {prop.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleListingStatus(prop.id, 'approved')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Rejection reason:');
                              if (reason) handleListingStatus(prop.id, 'rejected', reason);
                            }}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Broker Leads & Inquiries */}
      {activeTab === 'inquiries' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">Lead Contact</th>
                <th className="p-4">Property</th>
                <th className="p-4">Message / Time</th>
                <th className="p-4">Status</th>
                <th className="p-4">Broker Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{inq.name}</div>
                    <div className="text-slate-600 font-mono">📞 {inq.phone}</div>
                    <div className="text-[11px] text-slate-400">✉ {inq.email}</div>
                  </td>

                  <td className="p-4">
                    <div className="font-semibold text-slate-900 line-clamp-1">{inq.property_title}</div>
                    <div className="text-[11px] text-slate-500">{inq.property_locality}, Pune</div>
                  </td>

                  <td className="p-4">
                    <p className="text-xs text-slate-700 italic">"{inq.message}"</p>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Preferred: <strong>{inq.preferred_visit_time || 'Anytime'}</strong>
                    </div>
                  </td>

                  <td className="p-4">
                    <select
                      value={inq.status}
                      onChange={(e) => handleInquiryStatus(inq.id, e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold"
                    >
                      <option value="new">New Lead</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed / Deal Done</option>
                    </select>
                  </td>

                  <td className="p-4">
                    <button
                      onClick={() => {
                        const note = prompt('Add broker internal notes:', inq.broker_notes || '');
                        if (note !== null) handleInquiryStatus(inq.id, inq.status, note);
                      }}
                      className="text-xs font-semibold text-purple-700 hover:underline"
                    >
                      {inq.broker_notes ? 'Edit Notes' : '+ Add Note'}
                    </button>
                    {inq.broker_notes && (
                      <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                        Note: {inq.broker_notes}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Registered Users */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Role</th>
                <th className="p-4">Listings</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{u.name}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="p-4 font-mono">{u.phone}</td>
                  <td className="p-4 uppercase font-bold text-[10px]">{u.role}</td>
                  <td className="p-4 font-semibold">{u.listing_count} listings</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleUserActive(u.id, u.is_active)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold ${
                          u.is_active
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Settings (Broker Public Contact details) */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 max-w-xl shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-2 pb-2 border-b border-slate-100">
            Broker Public Profile Settings
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            This contact number and name is displayed on ALL property listings and cards across PuneRealty.
          </p>

          {settingsSaved && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
              ✓ Settings updated successfully!
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brokerage Agency Name</label>
              <input
                type="text"
                required
                value={brokerSettings.broker_name}
                onChange={(e) => setBrokerSettings({ ...brokerSettings, broker_name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Public Broker Phone (Shown on every listing card & detail page)
              </label>
              <input
                type="text"
                required
                value={brokerSettings.broker_phone}
                onChange={(e) => setBrokerSettings({ ...brokerSettings, broker_phone: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Broker Email (Inquiries Route Here)</label>
              <input
                type="email"
                required
                value={brokerSettings.broker_email}
                onChange={(e) => setBrokerSettings({ ...brokerSettings, broker_email: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pune Broker Office Address</label>
              <input
                type="text"
                required
                value={brokerSettings.broker_office}
                onChange={(e) => setBrokerSettings({ ...brokerSettings, broker_office: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              Save Broker Settings
            </button>
          </form>
        </div>
      )}

      {/* Inspect Property & Landlord Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Property & Private Landlord Details #{selectedListing.id}
              </h3>
              <button
                onClick={() => setSelectedListing(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900">{selectedListing.title}</h4>
              <p className="text-xs text-slate-600">{selectedListing.description}</p>
            </div>

            {/* STRICTLY PRIVATE OWNER RECORD (Visible strictly in broker portal) */}
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 space-y-2">
              <div className="flex items-center space-x-2 text-purple-900 font-bold text-xs">
                <Lock className="w-4 h-4 text-purple-700" />
                <span>CONFIDENTIAL OWNER RECORD (PROTECTED FROM PUBLIC)</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-500 block">Owner Name:</span>
                  <span className="font-bold text-slate-900">{selectedListing.ownerDetails?.ownerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Owner Contact Number:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedListing.ownerDetails?.ownerPhone}</span>
                </div>
                {selectedListing.ownerDetails?.ownerEmail && (
                  <div>
                    <span className="text-slate-500 block">Owner Email:</span>
                    <span className="text-slate-900">{selectedListing.ownerDetails.ownerEmail}</span>
                  </div>
                )}
                {selectedListing.ownerDetails?.notes && (
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Internal Broker Notes:</span>
                    <span className="text-slate-800 italic">{selectedListing.ownerDetails.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                onClick={() => setSelectedListing(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
              {selectedListing.status === 'pending' && (
                <button
                  onClick={() => {
                    handleListingStatus(selectedListing.id, 'approved');
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Approve Listing
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
