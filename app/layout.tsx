import type { Metadata } from 'next';
import './globals.css';
import { LayoutWrapper } from '@/components/LayoutWrapper';

export const metadata: Metadata = {
  title: 'Zorame Buildtech — Quotation Management & Pricing System',
  description: 'Quotation builder and price calculator for Roofing, Fabrication, PEB Buildings, and Engineering Works by Zorame Buildtech',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans bg-slate-50 text-slate-900" suppressHydrationWarning>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
