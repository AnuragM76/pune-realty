'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Shield, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const brokerName = process.env.NEXT_PUBLIC_BROKER_NAME || 'Pune Prime Properties (Broker Admin)';
  const brokerPhone = process.env.NEXT_PUBLIC_BROKER_PHONE || '+91 98220 12345';
  const brokerEmail = process.env.NEXT_PUBLIC_BROKER_EMAIL || 'contact@puneprimeproperties.in';
  const brokerOffice = process.env.NEXT_PUBLIC_BROKER_OFFICE || 'FC Road, Deccan Gymkhana, Pune 411004';

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Brand & Guarantee */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Pune<span className="text-emerald-400">Realty</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dedicated Pune-only real estate brokerage portal. Zero paywalls, zero unlock fees, and strict privacy protection for property owners.
            </p>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Free Platform</span>
            </div>
          </div>

          {/* Quick localities */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Prime Pune Localities
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/search?locality=Baner" className="hover:text-emerald-400 transition">Baner & Balewadi</Link></li>
              <li><Link href="/search?locality=Hinjewadi" className="hover:text-emerald-400 transition">Hinjewadi IT Corridor</Link></li>
              <li><Link href="/search?locality=Wakad" className="hover:text-emerald-400 transition">Wakad & Pimple Saudagar</Link></li>
              <li><Link href="/search?locality=Kothrud" className="hover:text-emerald-400 transition">Kothrud & Karve Nagar</Link></li>
              <li><Link href="/search?locality=Kharadi" className="hover:text-emerald-400 transition">Kharadi & Viman Nagar</Link></li>
              <li><Link href="/search?locality=Aundh" className="hover:text-emerald-400 transition">Aundh & Pashan</Link></li>
            </ul>
          </div>

          {/* Property Types */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Property Categories
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/search?category=Apartment/Flat" className="hover:text-emerald-400 transition">Apartments / Flats</Link></li>
              <li><Link href="/search?category=Independent+House" className="hover:text-emerald-400 transition">Independent Houses</Link></li>
              <li><Link href="/search?category=Villa" className="hover:text-emerald-400 transition">Luxury Villas</Link></li>
              <li><Link href="/search?category=Office" className="hover:text-emerald-400 transition">Commercial Offices</Link></li>
              <li><Link href="/search?category=Shop" className="hover:text-emerald-400 transition">Showrooms & Shops</Link></li>
              <li><Link href="/search?category=Plot/Land" className="hover:text-emerald-400 transition">Residential Plots</Link></li>
            </ul>
          </div>

          {/* Broker Contact Box */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
            <h4 className="text-xs uppercase font-semibold text-emerald-400 tracking-wider mb-3">
              Official Broker Desk
            </h4>
            <p className="text-xs text-slate-300 font-semibold mb-3">
              {brokerName}
            </p>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a href={`tel:${brokerPhone}`} className="hover:text-white transition">{brokerPhone}</a>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a href={`mailto:${brokerEmail}`} className="hover:text-white transition">{brokerEmail}</a>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{brokerOffice}</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
              All inquiries directly routed to licensed broker.
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 PuneRealty. All rights reserved. Exclusively serving Pune & PCMC, Maharashtra.</p>
          <div className="flex items-center space-x-6">
            <span>No Paywalls</span>
            <span>•</span>
            <span>Zero Brokerage to Inquire</span>
            <span>•</span>
            <span>Owner Privacy Assured</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
