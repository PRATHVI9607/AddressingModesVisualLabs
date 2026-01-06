import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Addressing Modes Visual Lab',
  description: 'Interactive web-based visualizer for teaching addressing modes in assembly language',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-gray-900" suppressHydrationWarning>{children}</body>
    </html>
  );
}
