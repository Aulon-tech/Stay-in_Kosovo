"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("demo@stay.kosovo");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push(params.get("callbackUrl") || "/discover");
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="input-kg !rounded-kg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="input-kg !rounded-kg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-kg-primary">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        No account?{" "}
        <Link href="/register" className="text-kg-primary font-medium">
          Register
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-gray-400">
        Demo: demo@stay.kosovo / password123
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="kg-shell flex min-h-screen flex-col justify-center p-6">
      <h1 className="kg-brand mb-2 text-center text-2xl">KosovoGo</h1>
      <p className="kg-subtitle mb-6 text-center">Sign in to plan your day</p>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
