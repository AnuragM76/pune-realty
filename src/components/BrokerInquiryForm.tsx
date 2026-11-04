'use client';

import React, { useState } from 'react';
import { Send, CheckCircle, PhoneCall, ShieldCheck, User, Mail, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface BrokerInquiryFormProps {
  listingId: number;
  listingTitle: string;
  brokerPhone?: string;
  brokerName?: string;
}

export default function BrokerInquiryForm({
  listingId,
  listingTitle,
  brokerPhone = '+91 98220 12345',
  brokerName = 'Pune Prime Properties (Broker Admin)',
}: BrokerInquiryFormProps) {
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState(
    `Hello, I am interested in "${listingTitle}". Please arrange a site inspection and share details.`
  );
  const [preferredVisitTime, setPreferredVisitTime] = useState('Weekend Morning (10 AM - 1 PM)');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      // Must be logged in as per specification
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    if (!name || !phone || !email || !message) {
      setError('Please fill in all inquiry fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          name,
          phone,
          email,
          message,
          preferredVisitTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send inquiry.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error occurred while contacting broker.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="inquire" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
      {/* Official Broker Banner */}
      <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-100">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
            Official Broker
          </span>
          <h4 className="text-base font-bold text-slate-900 mt-1">{brokerName}</h4>
          <p className="text-xs text-slate-500 mt-0.5">Licensed Real Estate Brokerage in Pune</p>
        </div>
        <a
          href={`tel:${brokerPhone}`}
          className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 shadow-sm transition shrink-0"
          title="Direct Broker Call"
        >
          <PhoneCall className="w-5 h-5" />
        </a>
      </div>

      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-5 flex items-center space-x-2 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Owner details are protected. Broker coordinates all visits and offers.</span>
      </div>

      {success ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900">Inquiry Sent to Broker!</h4>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            The broker has received your inquiry for this property and will reach out to you at {phone}.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="text-xs font-semibold text-emerald-600 hover:underline pt-2"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
              {error}
            </div>
          )}

          {!user && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center justify-between">
              <span>Sign in required to contact broker.</span>
              <a href="/login" className="font-bold underline">
                Sign in
              </a>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit number"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Preferred Visit Schedule
            </label>
            <select
              value={preferredVisitTime}
              onChange={(e) => setPreferredVisitTime(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
            >
              <option>Weekend Morning (10 AM - 1 PM)</option>
              <option>Weekend Afternoon (2 PM - 5 PM)</option>
              <option>Weekday Evening (5 PM - 7 PM)</option>
              <option>Immediate / Today</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Message to Broker</label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Submitting...' : 'Send Inquiry to Broker (Free)'}</span>
          </button>
        </form>
      )}

      {/* Broker Call Strip */}
      <div className="mt-4 pt-3 border-t border-slate-100 text-center">
        <a
          href={`tel:${brokerPhone}`}
          className="text-xs font-semibold text-slate-700 hover:text-emerald-700 inline-flex items-center space-x-1"
        >
          <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
          <span>Or call broker directly: {brokerPhone}</span>
        </a>
      </div>
    </div>
  );
}
