"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MobileShell } from "@/components/layout/MobileShell";
import {
  BUSINESS_CATEGORIES,
  BUSINESS_TAG_SUGGESTIONS,
  formatCategoryLabel,
} from "@/lib/business/constants";

const PickLocationMap = dynamic(
  () => import("@/components/business/PickLocationMap"),
  { ssr: false }
);

export default function BusinessEditPage() {
  const { data: session } = useSession();
  const { t: tSignOut } = useTranslation();
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    businessName: "",
    category: "restaurant",
    description: "",
    address: "",
    city: "Prishtina",
    contactEmail: "",
    ownerName: "",
    lat: 42.6629,
    lng: 21.1655,
    website: "",
    phone: "",
    priceRange: "",
    photoUrls: "",
    logo: "",
    servicesText: "",
    tags: [] as string[],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["business-profile"],
    queryFn: async () => {
      const res = await fetch("/api/business/profile");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!session?.user?.id && session.user.role === "BUSINESS",
  });

  useEffect(() => {
    const p = data?.profile;
    if (!p) return;
    setForm({
      businessName: p.businessName,
      category: p.category,
      description: p.description,
      address: p.address || "",
      city: p.city || "Prishtina",
      contactEmail: p.contactEmail || "",
      ownerName: p.ownerName || "",
      lat: p.lat ?? 42.6629,
      lng: p.lng ?? 21.1655,
      website: p.website || "",
      phone: p.phone || "",
      priceRange: p.priceRange || "",
      photoUrls: (p.photos || []).join("\n"),
      logo: p.logo || "",
      servicesText: (p.services || []).join("\n"),
      tags: p.tags || [],
    });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const photos = form.photoUrls
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const services = form.servicesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/business/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          photos,
          services,
          logo: form.logo || undefined,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-profile"] });
      qc.invalidateQueries({ queryKey: ["business-stats"] });
      router.push("/business/dashboard");
    },
  });

  if (!session) {
    return (
      <MobileShell>
        <div className="p-6 text-center">
          <Link href="/login" className="btn-primary inline-block">
            Sign in
          </Link>
        </div>
      </MobileShell>
    );
  }

  if (session.user?.role !== "BUSINESS") {
    return (
      <MobileShell>
        <p className="p-6 text-sm">Individual accounts cannot edit business profiles.</p>
      </MobileShell>
    );
  }

  return (
    <MobileShell title="Edit profile">
      <div className="space-y-4 p-4 pb-8">
        {isLoading && <p className="text-sm text-kg-muted">Loading…</p>}
        <label className="block">
          <span className="text-sm font-medium">Business name</span>
          <input
            className="input-kg mt-1 !rounded-kg"
            value={form.businessName}
            onChange={(e) =>
              setForm((f) => ({ ...f, businessName: e.target.value }))
            }
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Category</span>
          <select
            className="input-kg mt-1 !rounded-kg"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {BUSINESS_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {formatCategoryLabel(c)}
              </option>
            ))}
          </select>
        </label>
        <textarea
          className="w-full rounded-kg border border-kg-border p-3 text-sm"
          rows={4}
          placeholder="Description"
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />
        <PickLocationMap
          lat={form.lat}
          lng={form.lng}
          onPick={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))}
        />
        <input
          className="input-kg !rounded-kg"
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        />
        <textarea
          className="h-24 w-full rounded-kg border p-3 text-sm"
          placeholder="Photo URLs, one per line"
          value={form.photoUrls}
          onChange={(e) =>
            setForm((f) => ({ ...f, photoUrls: e.target.value }))
          }
        />
        <div className="flex flex-wrap gap-2">
          {BUSINESS_TAG_SUGGESTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  tags: f.tags.includes(t)
                    ? f.tags.filter((x) => x !== t)
                    : [...f.tags, t],
                }))
              }
              className={`chip capitalize ${form.tags.includes(t) ? "chip-active" : "chip-inactive"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={saveMutation.isPending}
          className="btn-primary w-full"
          onClick={() => saveMutation.mutate()}
        >
          {saveMutation.isPending ? "Saving…" : "Save profile"}
        </button>
        {saveMutation.isError && (
          <p className="text-sm text-kg-primary">Could not save. Check required fields.</p>
        )}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login?type=business" })}
          className="btn-secondary mt-4 w-full text-kg-primary"
          aria-label={tSignOut("signOut")}
        >
          {tSignOut("signOut")}
        </button>
      </div>
    </MobileShell>
  );
}
