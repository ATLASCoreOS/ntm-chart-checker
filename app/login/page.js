"use client";

import LoginForm from "@/components/LoginForm";
import Footer from "@/components/Footer";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            NtM Checker
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            UKHO Weekly Notices to Mariners
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <LoginForm />
        </div>
      </div>

      <div className="mt-auto pt-12">
        <Footer />
      </div>
    </div>
  );
}
