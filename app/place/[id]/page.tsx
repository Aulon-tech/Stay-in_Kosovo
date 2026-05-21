"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useGeolocation } from "@/components/geo/useGeolocation";
import { useAppStore } from "@/lib/store";
import { VIBES } from "@/lib/utils";
import { DirectionLinks } from "@/components/directions/DirectionLinks";
import { useToastStore } from "@/lib/toast-store";
import { useTranslation } from "@/lib/hooks/useTranslation";

const MiniMap = dynamic(
  () => import("@/components/map/MiniPlaceMap"),
  { ssr: false }
);

export default function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  useGeolocation();
  const { lat, lng, addPendingStop } = useAppStore();
  const { data: session } = useSession();
  const qc = useQueryClient();
  const pushToast = useToastStore((s) => s.push);
  const { t } = useTranslation();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);

  const { data: place, isLoading, error } = useQuery({
    queryKey: ["place", id],
    queryFn: async () => {
      const res = await fetch(`/api/places/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const { data: transport } = useQuery({
    queryKey: ["transport", id, lat, lng],
    enabled: !!place,
    queryFn: async () => {
      const res = await fetch(
        `/api/transport?fromLat=${lat}&fromLng=${lng}&toLat=${place.lat}&toLng=${place.lng}`
      );
      return res.json();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: id,
          rating,
          comment,
          vibeTags,
          photoBase64: photo,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["place", id] });
      setComment("");
      setVibeTags([]);
      setPhoto(null);
    },
  });

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md p-6 text-sm text-gray-500">Loading…</div>
    );
  }
  if (error || !place) {
    return (
      <div className="mx-auto max-w-md p-6">
        <p className="text-red-600">Place not found</p>
        <Link href="/discover" className="text-blue-600">
          Back
        </Link>
      </div>
    );
  }

  const img = place.images?.[0] || "https://images.unsplash.com/photo-1501339847302-ac826a4a87f3?w=800";

  return (
    <div className="mx-auto max-w-md pb-8">
      <div className="relative h-48 w-full bg-gray-100">
        <Image src={img} alt={place.name} fill className="object-cover" unoptimized />
      </div>
      <div className="p-4">
        <Link href="/discover" className="text-sm text-blue-600">
          ← Discover
        </Link>
        <h1 className="mt-2 text-xl font-bold">{place.name}</h1>
        <p className="text-sm text-gray-500">
          {place.category} · {"€".repeat(place.priceLevel)} · ★ {place.avgRating}
        </p>
        {place.feelsLike && (
          <p className="mt-2 italic text-sm text-gray-700">{place.feelsLike}</p>
        )}
        <p className="mt-3 text-sm">{place.description}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {place.vibes?.map((v: string) => (
            <span key={v} className="rounded bg-gray-100 px-2 py-0.5 text-xs">
              {v}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {place.address}, {place.city}
        </p>

        <div className="mt-4 h-40 overflow-hidden rounded">
          <MiniMap lat={place.lat} lng={place.lng} name={place.name} />
        </div>

        <h2 className="mt-4 font-semibold">{t("directions")}</h2>
        <div className="mt-2 mb-3">
          <DirectionLinks lat={place.lat} lng={place.lng} name={place.name} />
        </div>
        <div className="space-y-1">
          {transport?.map(
            (tr: { mode: string; label: string }) => (
              <div
                key={tr.mode}
                className="rounded border bg-white px-3 py-2 text-sm"
              >
                {tr.label}
              </div>
            )
          )}
        </div>

        {session ? (
          <button
            type="button"
            className="mt-4 w-full rounded-xl bg-red-600 py-2 text-white"
            onClick={() => {
              addPendingStop(place.id, place.name);
              pushToast({
                message: `${t("addedItinerary")}: ${place.name}`,
                actionLabel: t("goToPlan"),
                actionHref: "/itinerary",
              });
            }}
          >
            Add to itinerary
          </button>
        ) : (
          <Link
            href="/login"
            className="mt-4 block w-full rounded border py-2 text-center text-sm"
          >
            Sign in to add to itinerary
          </Link>
        )}

        <h2 className="mt-6 font-semibold">Reviews</h2>
        {place.reviews?.length === 0 && (
          <p className="text-sm text-gray-500">No reviews yet.</p>
        )}
        {place.reviews?.map(
          (r: {
            id: string;
            rating: number;
            comment: string | null;
            vibeTags: string[];
            user: { name: string | null };
          }) => (
            <div key={r.id} className="mt-2 rounded border bg-white p-3">
              <p className="text-sm font-medium">
                ★ {r.rating} · {r.user?.name || "User"}
              </p>
              {r.comment && <p className="text-sm">{r.comment}</p>}
              <div className="mt-1 flex flex-wrap gap-1">
                {r.vibeTags?.map((t: string) => (
                  <span key={t} className="text-xs text-gray-500">
                    felt {t}
                  </span>
                ))}
              </div>
            </div>
          )
        )}

        {session && (
          <div className="mt-4 rounded border bg-gray-50 p-3">
            <p className="mb-2 text-sm font-medium">Write a review</p>
            <select
              className="mb-2 w-full rounded border p-2 text-sm"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
            <textarea
              className="mb-2 w-full rounded border p-2 text-sm"
              placeholder="Your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="mb-2 flex flex-wrap gap-1">
              {VIBES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() =>
                    setVibeTags((prev) =>
                      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
                    )
                  }
                  className={`rounded px-2 py-0.5 text-xs ${
                    vibeTags.includes(v) ? "bg-blue-600 text-white" : "bg-gray-200"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <input type="file" accept="image/*" onChange={handlePhoto} className="mb-2 text-xs" />
            <button
              type="button"
              disabled={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate()}
              className="w-full rounded bg-blue-600 py-2 text-sm text-white"
            >
              Submit review
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
