import SessionProvider from "@/components/SessionProvider";
import ToasterProvider from "@/components/ToasterProvider";
import StoreProvider from "@/redux/StoreProvider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kensho",
  description: "Sync data from any API to your Notion databases.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <StoreProvider>
            <div className="min-h-screen bg-white">
              <ToasterProvider />
              <main className="min-h-screen">{children}</main>
            </div>
          </StoreProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
