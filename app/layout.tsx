import type { Metadata } from "next";
import { Cairo, Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/shared/app-providers";
import { LocaleProvider } from "@/hooks/use-locale";
import { getServerLocale } from "@/lib/i18n/server";
import { localeDirection } from "@/lib/i18n";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Marasim",
    template: "%s | Marasim",
  },
  description: "Digital invitation platform for events, RSVPs, and QR check-in",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  const dir = localeDirection(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col text-center font-sans text-gold-light">
        <LocaleProvider defaultLocale={locale}>
          <AppProviders>{children}</AppProviders>
        </LocaleProvider>
      </body>
    </html>
  );
}
