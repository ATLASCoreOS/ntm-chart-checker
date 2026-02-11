import { Inter, Playfair_Display } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700"],
});

export const metadata = {
  title: "NtM Chart Correction Checker",
  description:
    "Check the latest UKHO Weekly Notices to Mariners against your chart folio",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className={inter.className}>
        <SessionProvider>
          <div className="min-h-screen bg-navy-950">
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
