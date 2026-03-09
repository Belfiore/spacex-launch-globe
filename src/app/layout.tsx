import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://rocketmanifest.com";

export const metadata: Metadata = {
  title: "Rocket Manifest — SpaceX Launch Explorer",
  description:
    "Explore every SpaceX rocket launch in stunning 3D. Watch Falcon 9, Falcon Heavy, and Starship missions animate across an interactive globe with real trajectory data, booster landings, and mission playback.",
  keywords: [
    "SpaceX",
    "rocket launch",
    "Falcon 9",
    "Falcon Heavy",
    "Starship",
    "3D globe",
    "launch visualization",
    "booster landing",
    "space exploration",
  ],
  authors: [{ name: "Rocket Manifest" }],
  icons: {
    icon: [{ url: "/rocket-favicon.svg", type: "image/svg+xml" }],
    apple: "/apple-touch-icon.svg",
  },
  openGraph: {
    title: "Rocket Manifest — SpaceX Launch Explorer",
    description:
      "Explore every SpaceX rocket launch in stunning 3D. Real trajectory data, booster landings, and mission playback on an interactive globe.",
    url: siteUrl,
    siteName: "Rocket Manifest",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rocket Manifest — SpaceX Launch Explorer",
    description:
      "Explore every SpaceX rocket launch in stunning 3D. Real trajectory data, booster landings, and mission playback.",
  },
  metadataBase: new URL(siteUrl),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ background: "#0a0e1a", color: "#e2e8f0" }}
      >
        {children}
      </body>
    </html>
  );
}
