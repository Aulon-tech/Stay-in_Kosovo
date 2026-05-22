"use client";

import { Suspense } from "react";
import { signIn, signOut, getSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  AccountTypeTabs,
  AUTH_COPY,
  type AccountKind,
} from "@/components/auth/AccountTypeTabs";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [accountKind, setAccountKind] = useState<AccountKind>(
    params.get("type") === "business" ? "business" : "individual"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    if (res?.error) {
      setLoading(false);
      setError("Invalid email or password");
      return;
    }

    const session = await getSession();
    const role = session?.user?.role;
    const wantsBusiness = accountKind === "business";

    if (wantsBusiness && role !== "BUSINESS") {
      await signOut({ redirect: false });
      setLoading(false);
      setError(
        "This email is an individual account. Switch to Individual or register a business."
      );
      return;
    }
    if (!wantsBusiness && role === "BUSINESS") {
      await signOut({ redirect: false });
      setLoading(false);
      setError(
        "This email is a business account. Switch to Business to sign in."
      );
      return;
    }

    setLoading(false);
    const callback = params.get("callbackUrl");
    if (callback) {
      router.push(callback);
      return;
    }
    if (role === "BUSINESS") {
      router.push("/business/dashboard");
    } else {
      router.push("/itinerary");
    }
  }

  const registerHref =
    accountKind === "business" ? "/register?type=business" : "/register";

  return (
    <>
      <AccountTypeTabs value={accountKind} onChange={setAccountKind} />
      <p className="mb-4 text-center text-sm text-kg-muted">
        {AUTH_COPY[accountKind].login}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="input-kg !rounded-kg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          className="input-kg !rounded-kg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-kg-primary">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50"
        >
          {loading
            ? "Signing in…"
            : accountKind === "business"
              ? "Sign in as Business"
              : "Sign in as Individual"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        No account?{" "}
        <Link href={registerHref} className="font-medium text-kg-primary">
          {accountKind === "business"
            ? "Register as Business"
            : "Register as Individual"}
        </Link>
      </p>
      {accountKind === "individual" && (
        <p className="mt-2 text-center text-xs text-gray-400">
          Demo: demo@stay.kosovo / password123
        </p>
      )}
      {accountKind === "business" && (
        <p className="mt-2 text-center text-xs text-gray-400">
          Demo: business1@stay.kosovo / password123
        </p>
      )}
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="kg-shell flex min-h-screen flex-col justify-center p-6">
      <h1 className="kg-brand mb-2 text-center text-2xl">SHOQ1</h1>
      <p className="kg-subtitle mb-2 text-center">Welcome back</p>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
