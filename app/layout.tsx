import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AlphaLens - Premium Stock Portfolio',
  description: 'Track your investments with style.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[var(--bg-app)] text-white`}>
        <Sidebar />
        <div className="pl-16 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
