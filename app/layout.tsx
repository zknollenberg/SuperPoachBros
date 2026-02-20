import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SuperPoachBros',
  description: 'Arcade-style fraternity dodging game set in Waco.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
