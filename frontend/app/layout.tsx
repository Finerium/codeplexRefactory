import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Codeplex Chronicle',
  description:
    'YOUR CODEBASE, ALIVE. AI-resident development environment that transforms production codebase into a 3D city.',
  authors: [{ name: 'Tim Duopoly' }],
};

export const viewport: Viewport = {
  themeColor: '#05070d',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
