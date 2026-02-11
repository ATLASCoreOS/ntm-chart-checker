"use client";

import LoginForm from "@/components/LoginForm";
import Footer from "@/components/Footer";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          NtM Chart Correction Checker
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          UKHO Weekly Notices to Mariners
        </p>
      </div>

      <div className="max-w-sm w-full">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <LoginForm />
        </div>
      </div>

      <div className="mt-auto pt-8">
        <Footer />
      </div>
    </div>
  );
}
