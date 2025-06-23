import ToasterProvider from "@/components/ToasterProvider";
import StoreProvider from "@/redux/StoreProvider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Notion Syncer",
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
        <StoreProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <ToasterProvider />
            <main className="min-h-screen flex items-center justify-center p-4">
              {children}
            </main>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
