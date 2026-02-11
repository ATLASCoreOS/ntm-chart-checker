import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "NtM Chart Correction Checker",
  description:
    "Check the latest UKHO Weekly Notices to Mariners against your chart folio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <div className="min-h-screen bg-slate-100">
            <main className="max-w-[900px] mx-auto px-4 py-4">{children}</main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
