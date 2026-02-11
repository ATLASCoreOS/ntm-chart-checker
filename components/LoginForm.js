"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setSubmitting(false);
    } else {
      router.push("/");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="font-heading text-xl font-semibold text-parchment">Log In</h2>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-parchment-muted mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          className="input-maritime"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-parchment-muted mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input-maritime"
        />
      </div>

      {error && (
        <p className="text-signal-red text-sm" role="alert">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-brass w-full py-3"
      >
        {submitting ? "Logging in..." : "Log In"}
      </button>

      <p className="text-sm text-sea-slate text-center">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-brass hover:text-brass-light transition-colors">
          Register
        </Link>
      </p>
    </form>
  );
}
