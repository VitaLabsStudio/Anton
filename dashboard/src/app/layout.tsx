import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Antone Dashboard',
  description: 'AI Social Media Manager Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
