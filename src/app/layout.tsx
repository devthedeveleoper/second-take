import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Second Take",
  description: "Don't just remember what you watched. Remember what you saw.",
};

import Link from 'next/link'
import { Camera, Search, BookOpen, Bookmark, User } from 'lucide-react'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground selection:bg-neutral-800 selection:text-white">
        
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur">
          <div className="flex h-16 items-center px-4 md:px-8 max-w-5xl mx-auto w-full justify-between">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <Camera className="w-6 h-6 text-accent" />
              <span className="font-serif text-lg font-medium hidden sm:inline-block">Second Take</span>
            </Link>
            
            <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link href="/search" className="hover:text-foreground subtle-transition flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </Link>
              <Link href="/diary" className="hover:text-foreground subtle-transition flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Diary</span>
              </Link>
              <Link href="/watchlist" className="hover:text-foreground subtle-transition flex items-center gap-2">
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">Watchlist</span>
              </Link>
              <Link href="/profile" className="hover:text-foreground subtle-transition flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 md:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
