"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function NavBar({ activePage }) {
  const { data: session } = useSession();

  return (
    <nav className="bg-white border-b border-gray-200 mb-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="text-lg font-semibold text-navy">
            NtM Checker
          </Link>

          {session?.user && (
            <div className="flex items-center gap-5 text-sm">
              <Link
                href="/"
                className={`transition-colors ${
                  activePage === "dashboard"
                    ? "text-navy font-medium"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/history"
                className={`transition-colors ${
                  activePage === "history"
                    ? "text-navy font-medium"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                History
              </Link>
              <span className="text-gray-400 text-xs hidden sm:inline">
                {session.user.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-gray-400 hover:text-red-600 text-xs transition-colors"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
