"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function NavBar({ activePage }) {
  const { data: session } = useSession();

  return (
    <div className="bg-gradient-to-r from-[#1A2332] to-[#2A4A6B] rounded-2xl p-5 mb-4 text-white">
      <h1 className="text-xl font-bold">NtM Chart Correction Checker</h1>
      {session?.user && (
        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
          <Link
            href="/"
            className={`hover:underline ${activePage === "dashboard" ? "font-bold underline" : "opacity-75"}`}
          >
            Dashboard
          </Link>
          <Link
            href="/history"
            className={`hover:underline ${activePage === "history" ? "font-bold underline" : "opacity-75"}`}
          >
            History
          </Link>
          <span className="opacity-60 text-xs ml-auto">{session.user.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="hover:underline opacity-75"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
