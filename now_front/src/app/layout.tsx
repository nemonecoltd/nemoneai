import type { Metadata } from "next";
import "./globals.css";
import Provider from "./Provider";
import Script from "next/script";

export const metadata: Metadata = {
  title: {
    default: "NOW HERE | Real-time Seoul Guide",
    template: "%s | NOW HERE"
  },
  description: "AI-driven real-time guide for Seongsu and Hongdae's hottest pop-ups and hidden gems.",
  alternates: {
    canonical: 'https://now.nemoneai.com',
    languages: {
      'ko-KR': '/ko',
      'en-US': '/en',
    },
  },
  openGraph: {
    title: 'NOW HERE: Seongsu & Hongdae Live',
    description: 'Stop wasting time searching. Get your AI-powered local itinerary now.',
    images: ['/og-image.png'],
    type: 'website',
  },
  verification: {
    google: 'eHAc5WBdeiR9-l5T2HvCw1v4XTdjKghnA3JCCSz-YAk',
    other: {
      'naver-site-verification': 'ca36f2387b65666b52d99f160ee37bbb17b38f8a',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
        {/* Google AdSense Optimized */}
        <Script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4274957638983041"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}
