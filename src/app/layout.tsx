
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import TimerPopup from "@/components/timer/TimerPopup";
import AosClientWrapper from "@/components/layout/AosAnimation";
import { Toaster } from 'sonner'
import { AppProvider } from "@/context/AppContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://todolife.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "TodoLife — Personal Task & Life Management",
    template: "%s · TodoLife",
  },
  description:
    "TodoLife helps you organize tasks, track productivity, set study timers, annotate PDFs, remove image backgrounds, take idea notes, and manage your life — all in one free app.",
  keywords: [
    "todo app", "task manager", "productivity app", "study timer",
    "life management", "task tracker", "PDF annotator", "idea notes",
    "background remover", "AI assistant", "free todo list",
  ],
  authors: [{ name: "TouXY", url: BASE_URL }],
  creator: "TouXY",
  publisher: "TodoLife",
  category: "Productivity",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "TodoLife",
    title: "TodoLife — Personal Task & Life Management",
    description:
      "Organize tasks, track productivity, set study timers, annotate PDFs, and manage your life — all in one free app.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "TodoLife — Task & Life Management App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TodoLife — Personal Task & Life Management",
    description:
      "Organize tasks, track productivity, set timers, annotate PDFs, and manage your life.",
    images: ["/icon-512.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TodoLife",
  },
  icons: {
    icon: "/logotodolist-01.png",
    apple: "/logotodolist-01.png",
    shortcut: "/logotodolist-01.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "TodoLife",
  url: BASE_URL,
  description:
    "A free personal task and life management app with study timers, PDF annotation, AI assistant, idea notes, and background removal.",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires JavaScript. Requires a modern browser.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: "TouXY",
  },
  featureList: [
    "Task management",
    "Study timer",
    "PDF annotator",
    "Idea notes",
    "AI productivity assistant",
    "Background image removal",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#f59e0b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TodoLife" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="canonical" href={BASE_URL} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AosClientWrapper>
          <AppProvider>
            <Header />
            <Sidebar />
            <main className="md:ml-45 min-h-screen">
              {children}
            </main>
            <Toaster richColors position="top-right" />
            <TimerPopup />
          </AppProvider>
        </AosClientWrapper>
      </body>
    </html>
  );
}
