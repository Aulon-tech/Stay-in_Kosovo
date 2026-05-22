"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  BUSINESS_CATEGORIES,
  BUSINESS_TAG_SUGGESTIONS,
  formatCategoryLabel,
} from "@/lib/business/constants";
import { normalizePhotoUrls } from "@/lib/business/normalize-register";
import { validateBusinessRegisterClient } from "@/lib/business/validate-register-client";

const PickLocationMap = dynamic(
  () => import("@/components/business/PickLocationMap"),
  { ssr: false }
);

export type BusinessRegisterPayload = {
  email: string;
  password: string;
  role: "BUSINESS";
  ownerName: string;
  contactEmail: string;
  businessName: string;
  category: string;
  description: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  photos: string[];
  logo?: string;
  website?: string;
  phone?: string;
  priceRange?: string;
  priceLevel?: number;
  openingHours?: Record<string, string>;
  socialLinks?: { instagram?: string; facebook?: string; tiktok?: string };
  services?: string[];
  tags?: string[];
};

const defaultHours: Record<string, string> = {
  mon: "09:00–22:00",
  tue: "09:00–22:00",
  wed: "09:00–22:00",
  thu: "09:00–22:00",
  fri: "09:00–23:00",
  sat: "10:00–23:00",
  sun: "10:00–20:00",
};

export function BusinessRegisterForm({
  onSubmit,
  loading,
  fieldErrors,
  submitError,
}: {
  onSubmit: (payload: BusinessRegisterPayload) => void | Promise<void>;
  loading: boolean;
  fieldErrors: Record<string, string>;
  submitError?: string;
}) {
  const [step, setStep] = useState(0);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    email: "",
    password: "",
    ownerName: "",
    contactEmail: "",
    businessName: "",
    category: "restaurant",
    description: "",
    address: "",
    city: "Prishtina",
    lat: 42.6629,
    lng: 21.1655,
    website: "",
    phone: "",
    priceRange: "$$",
    priceLevel: 2,
    photoUrls: "",
    logo: "",
    servicesText: "",
    tags: [] as string[],
    instagram: "",
    facebook: "",
    openingHours: defaultHours,
  });

  const errors = { ...localErrors, ...fieldErrors };

  function err(key: string) {
    return errors[key] ? (
      <p className="mt-1 text-xs font-medium text-kg-primary">{errors[key]}</p>
    ) : null;
  }

  function buildPayload(): BusinessRegisterPayload {
    const rawPhotos = form.photoUrls
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const photos = normalizePhotoUrls(rawPhotos);
    const services = form.servicesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      email: form.email.trim(),
      password: form.password,
      role: "BUSINESS",
      ownerName: form.ownerName.trim(),
      contactEmail: form.contactEmail.trim(),
      businessName: form.businessName.trim(),
      category: form.category,
      description: form.description.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      lat: form.lat,
      lng: form.lng,
      photos,
      logo: form.logo.trim() || undefined,
      website: form.website.trim() || undefined,
      phone: form.phone.trim() || undefined,
      priceRange: form.priceRange || undefined,
      priceLevel: form.priceLevel,
      openingHours: form.openingHours,
      services,
      tags: form.tags,
      socialLinks: {
        instagram: form.instagram.trim() || undefined,
        facebook: form.facebook.trim() || undefined,
      },
    };
  }

  function handleCreateClick() {
    setLocalErrors({});
    const payload = buildPayload();
    const check = validateBusinessRegisterClient(payload);
    if (!check.ok) {
      setLocalErrors(check.errors);
      setStep(check.firstStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    void onSubmit(payload);
  }

  const steps = ["Account", "Business", "Location", "Photos & tags"];

  return (
    <div>
      {(submitError || errors.form) && (
        <div
          className="mb-4 rounded-kg border border-kg-primary/30 bg-red-50 px-3 py-2 text-sm text-kg-primary"
          role="alert"
        >
          {submitError || errors.form}
        </div>
      )}

      <p className="mb-4 text-center text-xs text-kg-muted">
        Step {step + 1} of {steps.length}: {steps[step]}
      </p>

      {step === 0 && (
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Your name (owner)</span>
            <input
              className="input-kg mt-1 !rounded-kg"
              value={form.ownerName}
              onChange={(e) =>
                setForm((f) => ({ ...f, ownerName: e.target.value }))
              }
            />
            {err("ownerName")}
          </label>
          <label className="block">
            <span className="text-sm font-medium">Login email</span>
            <input
              type="email"
              className="input-kg mt-1 !rounded-kg"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            {err("email")}
          </label>
          <label className="block">
            <span className="text-sm font-medium">Password (min 6 characters)</span>
            <input
              type="password"
              minLength={6}
              className="input-kg mt-1 !rounded-kg"
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
            />
            {err("password")}
          </label>
          <label className="block">
            <span className="text-sm font-medium">Business contact email</span>
            <input
              type="email"
              className="input-kg mt-1 !rounded-kg"
              value={form.contactEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, contactEmail: e.target.value }))
              }
            />
            {err("contactEmail")}
          </label>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Business name</span>
            <input
              className="input-kg mt-1 !rounded-kg"
              value={form.businessName}
              onChange={(e) =>
                setForm((f) => ({ ...f, businessName: e.target.value }))
              }
            />
            {err("businessName")}
          </label>
          <label className="block">
            <span className="text-sm font-medium">Category</span>
            <select
              className="input-kg mt-1 !rounded-kg"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
            >
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {formatCategoryLabel(c)}
                </option>
              ))}
            </select>
            {err("category")}
          </label>
          <label className="block">
            <span className="text-sm font-medium">Description (min 10 characters)</span>
            <textarea
              className="mt-1 w-full rounded-kg border border-kg-border p-3 text-sm"
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
            {err("description")}
          </label>
          <label className="block">
            <span className="text-sm font-medium">Services / offers (optional)</span>
            <textarea
              className="mt-1 w-full rounded-kg border border-kg-border p-3 text-sm"
              placeholder="One per line: happy hour, student discount…"
              value={form.servicesText}
              onChange={(e) =>
                setForm((f) => ({ ...f, servicesText: e.target.value }))
              }
            />
          </label>
          <input
            className="input-kg !rounded-kg"
            placeholder="Website (optional, e.g. https://yoursite.com)"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          />
          {err("website")}
          <input
            className="input-kg !rounded-kg"
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <input
            className="input-kg !rounded-kg"
            placeholder="Price range e.g. $, $$, $$$"
            value={form.priceRange}
            onChange={(e) =>
              setForm((f) => ({ ...f, priceRange: e.target.value }))
            }
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <PickLocationMap
            lat={form.lat}
            lng={form.lng}
            onPick={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))}
          />
          <input
            className="input-kg !rounded-kg"
            placeholder="Street address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
          {err("address")}
          <input
            className="input-kg !rounded-kg"
            placeholder="City / region"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
          {err("city")}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium">
              Photo URLs (optional — one per line)
            </span>
            <p className="text-xs text-kg-muted">
              Paste links starting with https://. If you skip this, we use a
              placeholder until you add photos in your dashboard.
            </p>
            <textarea
              className="mt-1 h-28 w-full rounded-kg border border-kg-border p-3 text-sm"
              placeholder="https://example.com/photo.jpg"
              value={form.photoUrls}
              onChange={(e) =>
                setForm((f) => ({ ...f, photoUrls: e.target.value }))
              }
            />
            {err("photos")}
          </label>
          <input
            className="input-kg !rounded-kg"
            placeholder="Logo URL (optional)"
            value={form.logo}
            onChange={(e) => setForm((f) => ({ ...f, logo: e.target.value }))}
          />
          {err("logo")}
          <p className="text-sm font-medium">Tags / vibe</p>
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
          <input
            className="input-kg !rounded-kg"
            placeholder="Instagram (optional)"
            value={form.instagram}
            onChange={(e) =>
              setForm((f) => ({ ...f, instagram: e.target.value }))
            }
          />
        </div>
      )}

      <div className="mt-6 flex gap-2">
        {step > 0 && (
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={() => setStep(step - 1)}
          >
            Back
          </button>
        )}
        {step < steps.length - 1 ? (
          <button
            type="button"
            className="btn-primary flex-1"
            onClick={() => setStep(step + 1)}
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            className="btn-primary flex-1 disabled:opacity-50"
            onClick={handleCreateClick}
          >
            {loading ? "Creating account…" : "Create business account"}
          </button>
        )}
      </div>
    </div>
  );
}
