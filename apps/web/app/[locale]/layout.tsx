import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { routing } from "@/i18n/rounting";
import { Toaster } from "sonner";
import { CookieConsent } from "@/components/cookie-consent";
import { readConsent } from "@/lib/consent";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Restart",
  description: "Restart – Schulverwaltung",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // SSR-seitiges Lesen des Consent-Cookies — verhindert Banner-Flicker
  // beim Hydration und ermöglicht es, PostHog gar nicht erst zu laden,
  // wenn der User abgelehnt hat.
  const cookieStore = await cookies();
  const initialConsent = readConsent(cookieStore.toString());

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider>
          <CookieConsent initialConsent={initialConsent}>
            {children}
            <Toaster richColors position="top-right" />
          </CookieConsent>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
