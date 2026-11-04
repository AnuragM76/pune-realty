import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PuneRealty | Pune Properties for Sale & Rent | Direct Broker Listings',
  description:
    'Search flats, villas, plots, and offices for sale and rent in Pune & PCMC. 100% free with direct licensed broker contact and owner privacy protection.',
  keywords: [
    'Pune Real Estate',
    'Flats in Pune',
    'Rent in Hinjewadi',
    'Buy Apartment in Baner',
    'Wakad Properties',
    'Kharadi Real Estate',
  ],
  openGraph: {
    title: 'PuneRealty | Pune Real Estate Platform',
    description: 'Find properties in Pune with zero paywalls and direct broker contact.',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
