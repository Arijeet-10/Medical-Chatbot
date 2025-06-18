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

export const metadata: Metadata = {
  title: "Medical Chatbot | AI Health Assistant",
  description: "Ask health-related questions in English or Bengali and get AI-powered answers instantly.",
  authors: [{ name: "Arijeet Das" }],
  creator: "Arijeet Das",
  metadataBase: new URL("https://medical-chatbot-frontend-static.onrender.com"), // Update this to your domain
  openGraph: {
    title: "Medical Chatbot",
    description: "Your personal AI health assistant supporting English & Bengali.",
    url: "https://medical-chatbot-frontend-static.onrender.com",
    siteName: "Medical Chatbot",
    images: [
      {
        url: "/og-image.png", // Place your Open Graph image in /public
        width: 1200,
        height: 630,
        alt: "Medical Chatbot Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Medical Chatbot",
    description: "Your AI health assistant, now supporting Bengali too!",
    creator: "@yourtwitter", // Optional
    images: ["/og-image.png"],
  },
  themeColor: "#ffffff",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
