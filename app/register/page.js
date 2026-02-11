"use client";

import RegisterForm from "@/components/RegisterForm";
import Footer from "@/components/Footer";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="text-center mb-8">
        <svg className="w-10 h-10 text-brass mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
        <div className="gold-line max-w-[200px] mx-auto mt-3 mb-2" />
        <p className="text-sm text-sea-slate">
          UKHO Weekly Notices to Mariners
        </p>
      </div>

      <div className="max-w-sm w-full">
        <div className="card-admiralty p-6">
          <RegisterForm />
        </div>
        <p className="text-xs text-sea-slate/70 text-center mt-4 px-4">
          Your email and check history are stored securely. Contact the administrator to request data deletion.
        </p>
      </div>

      <div className="mt-auto pt-8">
        <Footer />
      </div>
    </div>
  );
}
