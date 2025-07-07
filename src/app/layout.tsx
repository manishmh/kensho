import SessionProvider from "@/components/SessionProvider";
import ToasterProvider from "@/components/ToasterProvider";
import StoreProvider from "@/redux/StoreProvider";
import type { Metadata } from "next";
import "./globals.css";

// Use system fonts to avoid Google Fonts network issues
const systemFont = {
  className: "font-sans", // This uses Tailwind's default font stack
};

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
      <body className={systemFont.className}>
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
