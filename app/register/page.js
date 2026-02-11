"use client";

import RegisterForm from "@/components/RegisterForm";
import Footer from "@/components/Footer";

export default function RegisterPage() {
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
          <RegisterForm />
        </div>
        <p className="text-xs text-gray-400 text-center mt-4 px-4">
          Your email and check history are stored securely. Contact the administrator to request data deletion.
        </p>
      </div>

      <div className="mt-auto pt-8">
        <Footer />
      </div>
    </div>
  );
}
