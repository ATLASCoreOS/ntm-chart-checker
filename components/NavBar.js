"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function NavBar({ activePage }) {
  const { data: session } = useSession();

  return (
    <nav className="bg-navy-950 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-[15px] font-semibold text-white tracking-tight">
              NtM Checker
            </span>
            <span className="hidden sm:inline text-2xs text-navy-400 font-medium border border-navy-700 rounded px-1.5 py-0.5">
              UKHO
            </span>
          </Link>

          {session?.user && (
            <div className="flex items-center gap-1">
              <NavLink href="/" active={activePage === "dashboard"}>
                Dashboard
              </NavLink>
              <NavLink href="/history" active={activePage === "history"}>
                History
              </NavLink>

              <div className="ml-3 pl-3 border-l border-navy-700 flex items-center gap-3">
                <span className="text-2xs text-navy-400 hidden sm:inline truncate max-w-[160px]">
                  {session.user.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-2xs text-navy-400 hover:text-white transition-colors duration-150"
                >
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, active, children }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 text-sm rounded-md transition-colors duration-150 ${
        active
          ? "text-white bg-white/10 font-medium"
          : "text-navy-300 hover:text-white hover:bg-white/5"
      }`}
    >
      {children}
    </Link>
  );
}
