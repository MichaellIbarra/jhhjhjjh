import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { Providers } from '@/lib/providers';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'EduAssist',
  description: 'Asistencia y notas para instituciones educativas.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
