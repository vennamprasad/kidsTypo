import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

const APP_URL = "https://kiddlr.web.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Kiddlr – Fun Learning for Kids",
    template: "%s | Kiddlr",
  },
  description:
    "Kiddlr is a magical, interactive typing and creativity app for kids aged 2–10. Play keyboard games, draw, pop bubbles, catch stars, and learn to spell!",
  keywords: [
    "kids typing app",
    "learning to type",
    "kids game",
    "preschool app",
    "keyboard practice",
    "educational kids app",
    "Kiddlr",
  ],
  authors: [{ name: "Kiddlr" }],
  creator: "Kiddlr",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "Kiddlr",
    title: "Kiddlr – Fun Learning for Kids",
    description:
      "A magical interactive typing and creativity app for kids aged 2–10. Music, games, drawing, and more!",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kiddlr – Fun Learning for Kids",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kiddlr – Fun Learning for Kids",
    description:
      "A magical interactive typing and creativity app for kids aged 2–10.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
    shortcut: "/icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kiddlr",
  },
};

import { RemoteConfigProvider } from "@/components/providers/RemoteConfigProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import { MaintenanceOverlay } from "@/components/MaintenanceOverlay";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`dark h-full overflow-hidden ${nunito.variable}`}>
      <body
        suppressHydrationWarning
        className={`${nunito.className} h-full overflow-hidden bg-black text-white antialiased`}
      >
        <RemoteConfigProvider>
          <MaintenanceOverlay>
            <AuthProvider>
              <AnalyticsProvider>{children}</AnalyticsProvider>
            </AuthProvider>
          </MaintenanceOverlay>
        </RemoteConfigProvider>
      </body>
    </html>
  );
}
