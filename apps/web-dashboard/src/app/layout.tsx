import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';
import './globals.css';

// CoFHE and Aleo SDK access window/navigator at module init — must be client-only.
// dynamic({ ssr: false }) ensures none of the Web3 provider code runs on the server.
const Web3Provider = dynamic(
  () => import('@/components/providers/Web3Provider').then((m) => ({ default: m.Web3Provider })),
  { ssr: false }
);

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NovaGrid — Privacy-First DePIN',
  description: 'ZK and FHE powered DePIN infrastructure for hardware operators',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
