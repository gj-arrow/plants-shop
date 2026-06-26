import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Plant Shop - Магазин растений",
  description: "Современный магазин комнатных растений с доставкой",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <SessionProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
