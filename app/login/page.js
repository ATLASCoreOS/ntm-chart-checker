"use client";

import LoginForm from "@/components/LoginForm";
import Footer from "@/components/Footer";

export default function LoginPage() {
  return (
    <>
      <div className="bg-gradient-to-r from-[#1A2332] to-[#2A4A6B] rounded-2xl p-5 mb-6 text-white">
        <h1 className="text-xl font-bold">NtM Chart Correction Checker</h1>
      </div>

      <div className="max-w-sm mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <LoginForm />
        </div>
      </div>

      <Footer />
    </>
  );
}
