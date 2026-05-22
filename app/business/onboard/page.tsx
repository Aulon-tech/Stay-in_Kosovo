"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { DATASET_CATEGORIES, DATASET_VIBE_TAGS } from "@/lib/dataset";

const PickLocationMap = dynamic(
  () => import("@/components/business/PickLocationMap"),
  { ssr: false }
);

const STEPS = ["Business info", "Category & vibes", "Location", "ARBK & contact", "Photos"];

export default function BusinessOnboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    description: "",
    category: "restaurant",
    placeCategory: "restaurant",
    vibes: [] as string[],
    lat: 42.6629,
    lng: 21.1655,
    address: "",
    city: "Prishtina",
    priceLevel: 2,
    arbkNumber: "",
    website: "",
    phone: "",
    images: [] as string[],
  });

  function update(p: Partial<typeof form>) {
    setForm((f) => ({ ...f, ...p }));
  }

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/business/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) router.push("/business/dashboard");
    else alert("Onboarding failed");
  }

  if (!session) {
    return (
      <div className="kg-shell p-6 text-center">
        <p className="kg-brand mb-4 block">SHOQ1</p>
        <Link href="/login?type=business" className="text-kg-primary underline">
          Sign in as a business
        </Link>
      </div>
    );
  }

  return (
    <div className="kg-shell px-4 pb-8 pt-4">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/profile" className="text-kg-muted" aria-label="Close">
          ✕
        </Link>
        <span className="kg-brand">SHOQ1</span>
        <div className="w-6" />
      </header>

      <h1 className="kg-page-title text-center">Get discovered.</h1>
      <p className="kg-subtitle mt-2 text-center">
        Add your place and reach visitors planning their day.
      </p>
      <p className="mb-6 mt-4 text-center text-xs text-kg-muted">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      {step === 0 && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-kg-neutral">Business name</span>
            <input
              className="input-kg mt-1 !rounded-kg"
              placeholder="e.g. Soma Book Station"
              value={form.businessName}
              onChange={(e) => update({ businessName: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-kg-neutral">Description</span>
            <textarea
              className="mt-1 w-full rounded-kg border border-kg-border p-3 text-sm"
              placeholder="Tell visitors what makes your place special..."
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </label>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-kg-neutral">Category</span>
            <select
              className="input-kg mt-1 !rounded-kg"
              value={form.placeCategory}
              onChange={(e) =>
                update({ placeCategory: e.target.value, category: e.target.value })
              }
            >
              {DATASET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm font-semibold text-kg-neutral">Vibe tags</p>
          <div className="flex flex-wrap gap-2">
            {DATASET_VIBE_TAGS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() =>
                  update({
                    vibes: form.vibes.includes(v)
                      ? form.vibes.filter((x) => x !== v)
                      : [...form.vibes, v],
                  })
                }
                className={`chip capitalize ${form.vibes.includes(v) ? "chip-active" : "chip-inactive"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <PickLocationMap
            lat={form.lat}
            lng={form.lng}
            onPick={(lat, lng) => update({ lat, lng })}
          />
          <input
            className="input-kg !rounded-kg"
            placeholder="Neighborhood / address"
            value={form.address}
            onChange={(e) => update({ address: e.target.value })}
          />
          <input
            className="input-kg !rounded-kg"
            placeholder="City"
            value={form.city}
            onChange={(e) => update({ city: e.target.value })}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <input
            className="input-kg !rounded-kg"
            placeholder="ARBK registration number"
            value={form.arbkNumber}
            onChange={(e) => update({ arbkNumber: e.target.value })}
          />
          <input
            className="input-kg !rounded-kg"
            placeholder="Website"
            value={form.website}
            onChange={(e) => update({ website: e.target.value })}
          />
          <input
            className="input-kg !rounded-kg"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => update({ phone: e.target.value })}
          />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="flex flex-col items-center rounded-kg border-2 border-dashed border-kg-border bg-white p-8 text-center">
            <span className="text-2xl text-kg-primary">📷</span>
            <p className="mt-2 text-sm font-medium text-kg-primary">Upload high-quality photos</p>
            <p className="text-xs text-kg-muted">Paste image URLs below (one per line)</p>
          </div>
          <textarea
            className="h-32 w-full rounded-kg border border-kg-border p-3 text-sm"
            placeholder="https://..."
            onChange={(e) =>
              update({
                images: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
      )}

      <div className="mt-8 flex gap-2">
        {step > 0 && (
          <button type="button" className="btn-secondary flex-1" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn-teal flex-1" onClick={() => setStep(step + 1)}>
            Next →
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            className="btn-primary flex-1"
            onClick={submit}
          >
            {loading ? "Submitting…" : "Submit business →"}
          </button>
        )}
      </div>
    </div>
  );
}
