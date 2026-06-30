import type { Metadata } from "next";
import "./globals.css";
import { Playfair_Display, Instrument_Sans } from 'next/font/google'
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import Navbar from "@/components/Navbar";

const playfairDisplay = Playfair_Display({
  subsets: ['cyrillic', 'latin'],
  weight: ['600'],
  variable: '--font-playfair',
})

const instrumentSans = Instrument_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-instrument',
})

export const metadata: Metadata = {
  title: "Plant Shop — Магазин растений",
  description: "Магазин растений",
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌿</text></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${playfairDisplay.variable} ${instrumentSans.variable} antialiased`}>
      <body className="bg-white font-sans">
        <FavoritesProvider>
          <Navbar />
          <main>{children}</main>
        </FavoritesProvider>
      </body>
    </html>
  );
}
