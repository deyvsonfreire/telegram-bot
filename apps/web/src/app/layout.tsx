import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { QueryProvider } from '@/lib/query-provider';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Telegram Manager',
  description: 'Gerencie seu Telegram de forma eficiente',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full bg-gray-50">
      <body className={`${inter.className} h-full`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
