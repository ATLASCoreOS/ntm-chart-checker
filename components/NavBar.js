"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function NavBar({ activePage }) {
  const { data: session } = useSession();

  return (
    <nav className="bg-navy-900 mb-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 pt-5 pb-3">
          <svg className="w-7 h-7 text-brass flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L12 22" />
            <path d="M12 5.5C12 5.5 16 7.5 16 11C16 14.5 12 16.5 12 16.5" />
            <path d="M12 5.5C12 5.5 8 7.5 8 11C8 14.5 12 16.5 12 16.5" />
            <path d="M8 22h8" />
            <path d="M6 2h12" />
            <circle cx="12" cy="2" r="0.5" fill="currentColor" />
          </svg>
          <h1 className="font-heading text-2xl font-bold text-parchment tracking-tight">
            NtM Chart Correction Checker
          </h1>
        </div>

        <div className="gold-line" />

        {session?.user && (
          <div className="flex flex-wrap items-center gap-4 py-3 text-sm">
            <Link
              href="/"
              className={`transition-colors ${
                activePage === "dashboard"
                  ? "text-brass font-semibold"
                  : "text-parchment-muted hover:text-parchment"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/history"
              className={`transition-colors ${
                activePage === "history"
                  ? "text-brass font-semibold"
                  : "text-parchment-muted hover:text-parchment"
              }`}
            >
              History
            </Link>
            <span className="text-sea-slate text-xs ml-auto">
              {session.user.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-parchment-muted hover:text-signal-red text-xs transition-colors"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
