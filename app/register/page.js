"use client";

import RegisterForm from "@/components/RegisterForm";
import Footer from "@/components/Footer";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            NtM Checker
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create your account
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <RegisterForm />
        </div>

        <p className="text-2xs text-slate-400 text-center mt-4 px-4 leading-relaxed">
          Your email and check history are stored securely. Contact the administrator to request data deletion.
        </p>
      </div>

      <div className="mt-auto pt-12">
        <Footer />
      </div>
    </div>
  );
}
