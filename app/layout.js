import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "NtM Checker",
  description:
    "Check UKHO Weekly Notices to Mariners against your chart folio",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <SessionProvider>
          <div className="min-h-screen flex flex-col">{children}</div>
        </SessionProvider>
      </body>
    </html>
  );
}
