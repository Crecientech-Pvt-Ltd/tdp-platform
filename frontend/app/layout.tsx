import type { Metadata } from 'next';
import localFont from 'next/font/local';
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ApolloWrapper } from '@/lib/apolloWrapper';
import './globals.css';
import { envURL } from '@/lib/utils';
import { DocsThemeHead } from '@/theme.config';

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

// biome-ignore lint/style/useComponentExportOnlyModules: Next.js convention for metadata export
export const metadata: Metadata = {
  description: 'Drug Target Discovery Platform for Homosapiens',
  title: {
    default: 'Target Discovery Platform',
    template: '%s | Docs - TDP',
  },
  applicationName: 'Target Discovery Platform',
  generator: 'Next.js',
  appleWebApp: {
    capable: true,
    title: 'Target Discovery Platform',
    statusBarStyle: 'black-translucent',
  },
  metadataBase: new URL(envURL(process.env.NEXT_PUBLIC_SITE_URL)),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' dir='ltr' suppressHydrationWarning>
      <DocsThemeHead />
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ApolloWrapper>
          <NextTopLoader showSpinner={false} color='teal' />
          <TooltipProvider delayDuration={100}>{children}</TooltipProvider>
          <Toaster />
        </ApolloWrapper>
      </body>
    </html>
  );
}
