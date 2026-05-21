"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { VIBES, INTERESTS } from "@/lib/utils";

export default function VibeQuizPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleVibe(v: string) {
    setSelectedVibes((prev) => {
      if (prev.includes(v)) return prev.filter((x) => x !== v);
      if (prev.length >= 5) return prev;
      return [...prev, v];
    });
  }

  function toggleInterest(i: string) {
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  }

  async function submit() {
    if (selectedVibes.length < 3) {
      setError("Pick at least 3 vibes");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/user/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vibes: selectedVibes, interests }),
    });
    if (!res.ok) {
      setError("Failed to save");
      setLoading(false);
      return;
    }
    const { preferences } = await res.json();
    await update({ preferences });
    router.push("/discover");
  }

  if (!session) {
    return (
      <div className="p-6 text-center">
        <p>Please sign in first.</p>
        <a href="/login" className="text-blue-600">
          Login
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-2 text-xl font-bold">What&apos;s your vibe?</h1>
      <p className="mb-4 text-sm text-gray-600">Pick 3–5 moods that match you.</p>
      <div className="mb-6 flex flex-wrap gap-2">
        {VIBES.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => toggleVibe(v)}
            className={`rounded-full px-3 py-1.5 text-sm capitalize ${
              selectedVibes.includes(v)
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <h2 className="mb-2 font-semibold">Interests</h2>
      <div className="mb-6 flex flex-wrap gap-2">
        {INTERESTS.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => toggleInterest(i)}
            className={`rounded-full px-3 py-1.5 text-sm capitalize ${
              interests.includes(i) ? "bg-green-600 text-white" : "bg-gray-200"
            }`}
          >
            {i}
          </button>
        ))}
      </div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="w-full rounded bg-blue-600 py-3 text-white"
      >
        {loading ? "Saving…" : "Continue to Discover"}
      </button>
    </div>
  );
}
