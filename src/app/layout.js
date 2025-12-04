import { Inter } from "next/font/google";
import "./globals.css";

import { getTerms } from "@/lib/storage";


const inter = Inter({ subsets: ["latin"] });

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const terms = await getTerms();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
    title: terms.metaTitle || "Auto Audition | 自動面接システム",
    description: terms.metaDescription || "候補者スクリーニングのための自動ビデオ面接プラットフォーム",
    keywords: terms.metaKeywords,
    openGraph: {
      title: terms.ogTitle || terms.metaTitle || "Auto Audition",
      description: terms.ogDescription || terms.metaDescription,
      images: terms.ogImageUrl ? [terms.ogImageUrl] : [],
    },
    twitter: {
      card: terms.twitterCard || "summary_large_image",
      title: terms.ogTitle || terms.metaTitle || "Auto Audition",
      description: terms.ogDescription || terms.metaDescription,
      images: terms.ogImageUrl ? [terms.ogImageUrl] : [],
    },
    icons: {
      icon: terms.faviconUrl || '/favicon.ico',
      apple: terms.faviconUrl || '/favicon.ico',
    },
  };
}

export default async function RootLayout({ children }) {
  const terms = await getTerms();
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <header className="sticky top-0 z-50 py-6 border-b border-white/10 bg-black/20 backdrop-blur-md w-full">
          <div className="container flex items-center justify-between">
            <div className="font-bold text-xl tracking-tight flex items-center gap-3">
              {terms.logoUrl && (
                <img src={terms.logoUrl} alt="Logo" className="h-8 object-contain" />
              )}
              <span>{terms.metaTitle || "Auto Audition"}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col relative pb-16 pt-8">
          {children}
          <footer className="absolute bottom-4 w-full text-center text-sm text-muted-foreground">
            {(terms.footerText || "&copy; {year} Auto Audition System").replace("{year}", new Date().getFullYear())}
          </footer>
        </main>
      </body>
    </html>
  );
}
