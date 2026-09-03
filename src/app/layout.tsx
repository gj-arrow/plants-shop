import type { Metadata } from "next";
import "./globals.css";
import { Playfair_Display, Instrument_Sans, Cormorant_Garamond } from 'next/font/google'
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import Navbar from "@/components/Navbar";

const playfairDisplay = Playfair_Display({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
})

const cormorant = Cormorant_Garamond({
  subsets: ['cyrillic', 'latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
})

const instrumentSans = Instrument_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-instrument',
})

export const metadata: Metadata = {
  title: "Зелёная мастерская - растения в Горках",
  description: "Цветы Людмилы - купить саженцы растений в Горках. Гортензии, хвойные, топиарные стрижки и другое. Доставка по Беларуси: Европочта, Белпочта.",
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌿</text></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
  verification: {
    yandex: '2526a37bb4fe8407',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${playfairDisplay.variable} ${cormorant.variable} ${instrumentSans.variable} antialiased`}>
      <body className="bg-[#FDFBF7] font-sans text-[#1A1A1A]">
        <FavoritesProvider>
          <Navbar />
          <main>{children}</main>
        </FavoritesProvider>
      </body>
    </html>
  );
}
