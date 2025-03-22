import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ApolloWrapper } from '@/lib/apolloWrapper';
import type { Metadata } from 'next';
import { ViewTransitions } from 'next-view-transitions';
import localFont from 'next/font/local';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
  preload: true,
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
  preload: true,
});

export const metadata: Metadata = {
  title: 'Target Discovery Platform',
  description: 'Drug Target Discovery Platform for Homosapiens',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ApolloWrapper>
          <NextTopLoader showSpinner={false} color='teal' />
          <ViewTransitions>
            <TooltipProvider delayDuration={100}>{children}</TooltipProvider>
          </ViewTransitions>
          <Toaster />
        </ApolloWrapper>
      </body>
    </html>
  );
}
