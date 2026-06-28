import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Navbar";
export const metadata: Metadata = {
  title: "Plant Shop — Магазин растений",
  description: "Современный магазин комнатных растений с доставкой",
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
    <html lang="ru" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <FavoritesProvider>
            <CartProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
            </CartProvider>
          </FavoritesProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
