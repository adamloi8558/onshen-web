import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/navbar";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-noto-sans-thai",
});

export const metadata: Metadata = {
  title: {
    default: "Ronglakorn - ดูหนังออนไลน์ คุณภาพ HD",
    template: "%s | Ronglakorn",
  },
  description: "ดูหนังและซีรี่ย์ออนไลน์คุณภาพ HD ครบครันทุกหมวดหมู่ สมาชิก VIP เพียง 39 บาทต่อเดือน",
  keywords: ["หนังออนไลน์", "ซีรี่ย์", "Ronglakorn", "ดูหนัง", "HD", "VIP"],
  authors: [{ name: "Ronglakorn Team" }],
  creator: "Ronglakorn",
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "Ronglakorn - ดูหนังออนไลน์ คุณภาพ HD",
    description: "ดูหนังและซีรี่ย์ออนไลน์คุณภาพ HD ครบครันทุกหมวดหมู่ สมาชิก VIP เพียง 39 บาทต่อเดือน",
    siteName: "Ronglakorn",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Ronglakorn",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ronglakorn - ดูหนังออนไลน์ คุณภาพ HD",
    description: "ดูหนังและซีรี่ย์ออนไลน์คุณภาพ HD ครบครันทุกหมวดหมู่ สมาชิก VIP เพียง 39 บาทต่อเดือน",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="th" className={notoSansThai.variable}>
      <body className="min-h-screen bg-background font-noto-sans-thai antialiased">
        <Navbar user={user} />
        <main className="pt-16">
          {children}
        </main>
        <Toaster position="bottom-right" richColors />
        {/* Turnstile is now handled by react-turnstile library */}
      </body>
    </html>
  );
}