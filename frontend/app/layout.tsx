import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Scribe Notes',
  description: 'AI Scribe Notes Management Tool for home healthcare',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="logo">
              AI Scribe Notes
            </Link>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
