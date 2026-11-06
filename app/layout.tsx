import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getRequestOrigin } from "@/lib/request";

export async function generateMetadata(): Promise<Metadata> {
  const origin = await getRequestOrigin();

  return {
    metadataBase: new URL(origin),
    title: {
      default: "Lyfter Badges",
      template: "%s · Lyfter Badges",
    },
    description: "Collect badges, earn XP, and level up at Lyfter events.",
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Navbar />

        <main>{children}</main>

        <Footer />
      </body>
    </html>
  );
}
