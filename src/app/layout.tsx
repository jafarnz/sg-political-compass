import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Singapore Political Compass 2025 | GE2025 Quiz",
  description: "Discover where you stand on Singapore's political spectrum based on real 2025 party manifestos. Compare your views with PAP, Workers' Party, PSP, and SDP on economic and social issues.",
  keywords: ["Singapore politics", "GE2025", "political compass", "PAP", "Workers Party", "SDP", "PSP", "election quiz", "Singapore election 2025"],
  authors: [{ name: "SG Political Compass" }],
  openGraph: {
    title: "Singapore Political Compass 2025",
    description: "Find out which Singapore political party aligns with your views based on real 2025 manifesto positions.",
    type: "website",
    locale: "en_SG",
    siteName: "SG Political Compass",
  },
  twitter: {
    card: "summary_large_image",
    title: "Singapore Political Compass 2025",
    description: "Find out which Singapore political party aligns with your views.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
