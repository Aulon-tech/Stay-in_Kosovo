"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "BUSINESS">("USER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }
    const sign = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (sign?.error) {
      router.push("/login");
      return;
    }
    if (role === "BUSINESS") {
      router.push("/business/onboard");
    } else {
      router.push("/onboarding/vibe-quiz");
    }
  }

  return (
    <div className="kg-shell flex min-h-screen flex-col justify-center p-6">
      <h1 className="kg-brand mb-2 text-center text-2xl">KosovoGo</h1>
      <p className="kg-subtitle mb-6 text-center">Create account</p>
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={role === "USER"}
              onChange={() => setRole("USER")}
            />
            Traveler
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={role === "BUSINESS"}
              onChange={() => setRole("BUSINESS")}
            />
            Business
          </label>
        </div>
        {error && <p className="text-sm text-kg-primary">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Creating…" : "Register"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-kg-primary font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
