import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import TopBar from '@/components/TopBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AlphaLens - Premium Stock Portfolio',
  description: 'Track your investments with style.',
};

import { LanguageProvider } from '@/components/LanguageProvider';

// ...

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[var(--bg-app)] text-[var(--text-primary)]`}>
        <LanguageProvider>
          <div className="flex flex-col min-h-screen">
            <TopBar />
            <div className="flex-1 w-full max-w-[1600px] mx-auto min-h-screen">
              {children}
            </div>
          </div>
          <div className="fixed bottom-2 right-2 text-xs text-[var(--text-muted)] opacity-50 pointer-events-none">
            v1.2.0 (Auth + TSM)
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
