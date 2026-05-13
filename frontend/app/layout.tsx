import type { Metadata, Viewport } from 'next';
import './globals.css';
// Manager FINAL Cycle 2 (Persephone Cluster G, STAMP 20260513-0857):
// Global floating "?" tutor button mounts here so it persists across
// /city + /dashboard + /start + landing routes per Manager directive
// item 1 ("persistent across pages").
import { FloatingTutorButton } from '@/components/tutor';

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
      <body className="font-sans antialiased">
        {children}
        <FloatingTutorButton />
      </body>
    </html>
  );
}
