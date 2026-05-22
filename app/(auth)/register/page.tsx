"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";
import {
  AccountTypeTabs,
  AUTH_COPY,
  type AccountKind,
} from "@/components/auth/AccountTypeTabs";
import {
  BusinessRegisterForm,
  type BusinessRegisterPayload,
} from "@/components/auth/BusinessRegisterForm";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType =
    searchParams.get("type") === "business" ? "business" : "individual";
  const [accountKind, setAccountKind] = useState<AccountKind>(initialType);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("type") === "business") {
      setAccountKind("business");
    }
  }, [searchParams]);

  async function signInAfterRegister(
    loginEmail: string,
    loginPassword: string
  ): Promise<{ ok: boolean; error?: string }> {
    const sign = await signIn("credentials", {
      email: loginEmail.trim().toLowerCase(),
      password: loginPassword,
      redirect: false,
    });
    if (sign?.error) {
      return {
        ok: false,
        error:
          "Account was created but sign-in failed. Go to Login → Business and try your email and password.",
      };
    }
    return { ok: true };
  }

  async function handleIndividualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email.trim().toLowerCase(),
          password,
          role: "USER",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }
      const signResult = await signInAfterRegister(email, password);
      setLoading(false);
      if (!signResult.ok) {
        setError(signResult.error || "Sign-in failed");
        return;
      }
      router.push("/onboarding/vibe-quiz");
    } catch {
      setLoading(false);
      setError("Network error — check your connection and try again.");
    }
  }

  async function handleBusinessRegister(payload: BusinessRegisterPayload) {
    setLoading(true);
    setError("");
    setFieldErrors({});
    try {
      const res = await fetch("/api/auth/register-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setFieldErrors(data.fieldErrors || {});
        setLoading(false);
        return;
      }
      const signResult = await signInAfterRegister(
        payload.email,
        payload.password
      );
      setLoading(false);
      if (!signResult.ok) {
        setError(signResult.error || "Sign-in failed");
        router.push("/login?type=business");
        return;
      }
      router.push("/business/dashboard");
    } catch {
      setLoading(false);
      setError("Network error — check your connection and try again.");
    }
  }

  const loginHref =
    accountKind === "business" ? "/login?type=business" : "/login";

  return (
    <div className="kg-shell flex min-h-screen flex-col justify-center p-6">
      <h1 className="kg-brand mb-2 text-center text-2xl">SHOQ1</h1>
      <p className="kg-subtitle mb-2 text-center">Create account</p>

      <AccountTypeTabs value={accountKind} onChange={setAccountKind} />
      <p className="mb-4 text-center text-sm text-kg-muted">
        {AUTH_COPY[accountKind].register}
      </p>

      {error && accountKind === "individual" && (
        <div
          className="mb-4 rounded-kg border border-kg-primary/30 bg-red-50 px-3 py-2 text-sm text-kg-primary"
          role="alert"
        >
          {error}
        </div>
      )}

      {accountKind === "individual" ? (
        <form onSubmit={handleIndividualSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Name"
            className="input-kg !rounded-kg"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            required
            className="input-kg !rounded-kg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            required
            minLength={6}
            className="input-kg !rounded-kg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating…" : "Register as Individual"}
          </button>
        </form>
      ) : (
        <BusinessRegisterForm
          onSubmit={handleBusinessRegister}
          loading={loading}
          fieldErrors={fieldErrors}
          submitError={error}
        />
      )}

      <p className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <Link href={loginHref} className="font-medium text-kg-primary">
          {accountKind === "business"
            ? "Sign in as Business"
            : "Sign in as Individual"}
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="kg-shell p-6 text-center text-sm text-kg-muted">
          Loading…
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
