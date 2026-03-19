import type { Metadata } from 'next';
import { Geist, Geist_Mono, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import NProgressBar from '@/components/NProgressBar';
import { AnalyticsProvider, GoogleAnalyticsScript, CookieBanner } from '@/lib/analytics';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
    variable: '--font-jetbrains',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Uni Mannheim Bibliotheks Manager',
    description: 'Überblick über die Auslastung der Universitätsbibliotheken in Mannheim',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="de" suppressHydrationWarning={true}>
            <head>
                <meta name="theme-color" content="#000000" />
                {/* PWA Unterstützung */}
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <link rel="apple-touch-icon" href="/icons/icon-192.png" />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} antialiased`}>
                <GoogleAnalyticsScript />
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
                    <AnalyticsProvider>
                        <NProgressBar />
                        {children}
                        <CookieBanner />
                    </AnalyticsProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
