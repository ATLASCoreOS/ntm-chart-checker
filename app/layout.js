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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(!t)t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var c=document.documentElement.classList;c.remove('dark','night');if(t==='dark')c.add('dark');else if(t==='night'){c.add('dark');c.add('night');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={inter.className}>
        <SessionProvider>
          <div className="min-h-screen flex flex-col">{children}</div>
        </SessionProvider>
      </body>
    </html>
  );
}
