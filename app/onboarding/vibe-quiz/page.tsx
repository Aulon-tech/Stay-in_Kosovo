"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { DATASET_VIBE_TAGS, DATASET_CATEGORIES } from "@/lib/dataset";

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
      <div className="kg-shell p-6 text-center">
        <p className="kg-brand">KosovoGo</p>
        <Link href="/login" className="mt-4 text-kg-primary underline">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="kg-shell p-6">
      <p className="kg-brand text-center">KosovoGo</p>
      <h1 className="kg-page-title mt-4">Let{"'"}s shape your day</h1>
      <p className="kg-subtitle mt-1">Pick 3–5 moods that match you.</p>
      <div className="mb-6 mt-4 flex flex-wrap gap-2">
        {DATASET_VIBE_TAGS.slice(0, 12).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => toggleVibe(v)}
            className={`chip capitalize ${selectedVibes.includes(v) ? "chip-active" : "chip-inactive"}`}
          >
            {v}
          </button>
        ))}
      </div>
      <h2 className="mb-2 font-semibold text-kg-primary">Interests</h2>
      <div className="mb-6 flex flex-wrap gap-2">
        {DATASET_CATEGORIES.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => toggleInterest(i)}
            className={`chip capitalize ${interests.includes(i) ? "chip-active" : "chip-inactive"}`}
          >
            {i}
          </button>
        ))}
      </div>
      {error && <p className="mb-2 text-sm text-kg-primary">{error}</p>}
      <button type="button" onClick={submit} disabled={loading} className="btn-primary">
        {loading ? "Saving…" : "✨ Build my day"}
      </button>
    </div>
  );
}
