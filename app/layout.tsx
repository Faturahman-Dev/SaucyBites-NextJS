import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'SaucyBites • Ruang Tim',
  description: 'Satu tempat untuk resep, HPP, penjualan, dan keuangan tim SaucyBites.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
