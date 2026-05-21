"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";

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
    category: "FOOD",
    placeCategory: "FOOD",
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
      <div className="mx-auto max-w-md p-6 text-center">
        <a href="/login" className="text-blue-600">
          Sign in as a business
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-4 pb-8">
      <h1 className="text-xl font-bold">Business onboarding</h1>
      <p className="mb-4 text-sm text-gray-500">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      {step === 0 && (
        <div className="space-y-3">
          <input
            className="w-full rounded border p-3"
            placeholder="Business name"
            value={form.businessName}
            onChange={(e) => update({ businessName: e.target.value })}
          />
          <textarea
            className="w-full rounded border p-3"
            placeholder="Description"
            value={form.description}
            onChange={(e) => update({ description: e.target.value })}
          />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <select
            className="w-full rounded border p-3"
            value={form.placeCategory}
            onChange={(e) =>
              update({ placeCategory: e.target.value, category: e.target.value })
            }
          >
            {["FOOD", "CAFE", "CULTURE", "NIGHTLIFE", "NATURE", "SHOPPING"].map(
              (c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              )
            )}
          </select>
          <p className="text-sm">Vibes (pick several)</p>
          <div className="flex flex-wrap gap-2">
            {["cozy", "energetic", "romantic", "traditional", "trendy", "scenic"].map(
              (v) => (
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
                  className={`rounded px-2 py-1 text-sm ${
                    form.vibes.includes(v) ? "bg-blue-600 text-white" : "bg-gray-200"
                  }`}
                >
                  {v}
                </button>
              )
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <PickLocationMap
            lat={form.lat}
            lng={form.lng}
            onPick={(lat, lng) => update({ lat, lng })}
          />
          <input
            className="w-full rounded border p-3"
            placeholder="Address"
            value={form.address}
            onChange={(e) => update({ address: e.target.value })}
          />
          <input
            className="w-full rounded border p-3"
            placeholder="City"
            value={form.city}
            onChange={(e) => update({ city: e.target.value })}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <input
            className="w-full rounded border p-3"
            placeholder="ARBK registration number"
            value={form.arbkNumber}
            onChange={(e) => update({ arbkNumber: e.target.value })}
          />
          <input
            className="w-full rounded border p-3"
            placeholder="Website"
            value={form.website}
            onChange={(e) => update({ website: e.target.value })}
          />
          <input
            className="w-full rounded border p-3"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => update({ phone: e.target.value })}
          />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Add image URLs (one per line) for your listing photos.
          </p>
          <textarea
            className="h-32 w-full rounded border p-3 text-sm"
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
          <p className="text-xs text-gray-500">
            Submission will be reviewed for verification.
          </p>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        {step > 0 && (
          <button
            type="button"
            className="flex-1 rounded border py-2"
            onClick={() => setStep(step - 1)}
          >
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="flex-1 rounded bg-blue-600 py-2 text-white"
            onClick={() => setStep(step + 1)}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            className="flex-1 rounded bg-green-600 py-2 text-white"
            onClick={submit}
          >
            {loading ? "Submitting…" : "Submit for verification"}
          </button>
        )}
      </div>
    </div>
  );
}
