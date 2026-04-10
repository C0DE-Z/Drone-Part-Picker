import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from '@/components/SessionProvider';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Analytics } from "@vercel/analytics/next"
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Drone Part Picker",
  description: "Build and share your FPV drone configurations",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-slate-900`}
      >
        <Analytics />
        <SessionProvider session={session}>
          <div className="relative min-h-screen">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-blue-200/30 via-sky-100/20 to-transparent"
            />
            <div className="relative z-10">{children}</div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
