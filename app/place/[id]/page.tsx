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
import { TransportOptionList } from "@/components/ui/TransportOptionList";
import { viableTransportOptions } from "@/lib/transport";
import { useToastStore } from "@/lib/toast-store";
import { useTranslation } from "@/lib/hooks/useTranslation";

const MiniMap = dynamic(() => import("@/components/map/MiniPlaceMap"), { ssr: false });

function splitQuote(feelsLike: string | null | undefined) {
  if (!feelsLike) return { main: null, quote: null };
  const m = feelsLike.match(/^(.+?)\.\s*["“](.+?)["”]\s*$/);
  if (m) return { main: m[1], quote: m[2] };
  return { main: feelsLike, quote: null };
}

export default function PlaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  useGeolocation();
  const { lat, lng, loading: geoLoading, addPendingStop } = useAppStore();
  const { data: session } = useSession();
  const qc = useQueryClient();
  const pushToast = useToastStore((s) => s.push);
  const { t } = useTranslation();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const { data: place, isLoading, error } = useQuery({
    queryKey: ["place", id],
    queryFn: async () => {
      const res = await fetch(`/api/places/${id}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const { data: transport } = useQuery({
    queryKey: ["transport", id, lat, lng, place?.lat, place?.lng],
    enabled: !!place && !geoLoading,
    queryFn: async () => {
      const res = await fetch(
        `/api/transport?fromLat=${lat}&fromLng=${lng}&toLat=${place.lat}&toLng=${place.lng}`
      );
      if (!res.ok) throw new Error("Transport failed");
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
          comment: comment.trim() || undefined,
          vibeTags,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["place", id] });
      setComment("");
      setVibeTags([]);
      setRating(5);
      pushToast({ message: "Review submitted — thank you!" });
    },
  });

  const displayRating = hoverRating ?? rating;
  const showPreview = comment.trim().length > 0 || vibeTags.length > 0;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md p-6 text-sm text-kg-muted">Loading…</div>
    );
  }
  if (error || !place) {
    return (
      <div className="mx-auto max-w-md p-6">
        <p className="text-kg-primary">Place not found</p>
        <Link href="/discover" className="text-kg-primary underline">
          Back
        </Link>
      </div>
    );
  }

  const img =
    place.images?.[0] ||
    "https://images.unsplash.com/photo-1501339847302-ac826a4a87f3?w=800";
  const cityLabel = place.displayCity || place.city || "Prishtina";
  const { main: feelsMain, quote: feelsQuote } = splitQuote(place.feelsLike);
  const isRestaurant = place.category?.toLowerCase() === "restaurant";

  return (
    <div className="mx-auto max-w-md bg-kg-surface pb-8">
      <div className="relative h-56 w-full bg-kg-surface">
        <Image src={img} alt={place.name} fill className="object-cover" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
        <Link
          href="/discover"
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-kg-neutral shadow"
          aria-label="Back"
        >
          ←
        </Link>
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h1 className="text-2xl font-bold">{place.name}</h1>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-white/90">
            <span>📍</span> {cityLabel}
          </p>
        </div>
      </div>

      <div className="relative z-10 -mt-6 mx-3 rounded-kg border border-kg-border bg-white p-4 shadow-kg">
        <div className="flex flex-wrap gap-2">
          <span className="tag-teal">{place.category}</span>
          {place.vibes?.slice(0, 3).map((v: string) => (
            <span key={v} className="tag-neutral">
              {v}
            </span>
          ))}
          {isRestaurant && <span className="tag-neutral">Traditional</span>}
        </div>
        <p className="mt-2 text-sm text-kg-neutral">
          ★ {place.avgRating}
          {place.ratingCount ? ` (${place.ratingCount})` : ""}
          <span className="text-kg-muted"> · {"€".repeat(place.priceLevel)}</span>
        </p>
      </div>

      <div className="space-y-4 p-4">
        <section>
          <h2 className="text-base font-bold text-kg-primary">Why you{"'"}d love it</h2>
          <p className="mt-2 text-sm leading-relaxed text-kg-neutral">{place.description}</p>
          {(feelsQuote || feelsMain) && (
            <div className="quote-box mt-3">
              {feelsQuote ? (
                <>
                  <span className="text-2xl text-kg-accent">&ldquo;</span>
                  {feelsQuote}
                </>
              ) : (
                feelsMain
              )}
            </div>
          )}
        </section>

        {(place.website || place.phone || place.googleMapsUrl) && (
          <p className="text-xs text-kg-muted">
            {place.phone && <span>{place.phone} · </span>}
            {place.website && (
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-kg-primary underline"
              >
                Website
              </a>
            )}
            {place.googleMapsUrl && (
              <>
                {" · "}
                <a
                  href={place.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-kg-primary underline"
                >
                  Google Maps
                </a>
              </>
            )}
          </p>
        )}

        <p className="text-xs text-kg-muted">{place.address}</p>

        <div className="h-36 overflow-hidden rounded-kg">
          <MiniMap lat={place.lat} lng={place.lng} name={place.name} />
        </div>

        <section>
          <h2 className="text-base font-bold text-kg-primary">{t("directions")}</h2>
          <div className="mt-2">
            <DirectionLinks lat={place.lat} lng={place.lng} name={place.name} />
          </div>
        </section>

        <section>
          <h2 className="text-base font-bold text-kg-primary">Getting There</h2>
          <div className="mt-3">
            {transport ? (
              <TransportOptionList
                options={viableTransportOptions(transport.options)}
                originLabel={transport.originLabel}
                roadDistanceKm={transport.roadDistanceKm}
                walkNotRecommended={transport.walkNotRecommended}
              />
            ) : (
              <p className="text-sm text-kg-muted">Loading routes…</p>
            )}
          </div>
        </section>

        {session ? (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              addPendingStop(place.id, place.name);
              pushToast({
                message: `${t("addedItinerary")}: ${place.name}`,
                actionLabel: t("goToPlan"),
                actionHref: "/itinerary",
              });
            }}
          >
            Add to my day
          </button>
        ) : (
          <Link href="/login" className="btn-secondary block">
            Sign in to add to my day
          </Link>
        )}

        <section>
          <h2 className="text-base font-bold text-kg-primary">Reviews</h2>
          {place.reviews?.length === 0 && (
            <p className="mt-2 text-sm text-kg-muted">No reviews yet.</p>
          )}
          {place.reviews?.map(
            (r: {
              id: string;
              rating: number;
              comment: string | null;
              vibeTags: string[];
              user: { name: string | null };
            }) => (
              <div key={r.id} className="kg-card-pad mt-2">
                <p className="text-sm font-medium text-kg-neutral">
                  ★ {r.rating} · {r.user?.name || "User"}
                </p>
                {r.comment && <p className="mt-1 text-sm text-kg-muted">{r.comment}</p>}
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.vibeTags?.map((tag: string) => (
                    <span key={tag} className="tag-neutral">
                      felt {tag}
                    </span>
                  ))}
                </div>
              </div>
            )
          )}

          {session && (
            <div className="kg-card-pad mt-4">
              <p className="mb-2 text-sm font-semibold text-kg-primary">Write a review</p>
              <p className="mb-1 text-xs text-kg-muted">Your rating</p>
              <div
                className="mb-3 flex items-center gap-1"
                role="group"
                aria-label="Star rating"
                onMouseLeave={() => setHoverRating(null)}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    className={`text-2xl leading-none transition-transform hover:scale-110 ${
                      n <= displayRating ? "text-kg-accent" : "text-kg-border"
                    }`}
                    aria-label={`${n} star${n === 1 ? "" : "s"}`}
                    aria-pressed={rating === n}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm font-medium text-kg-neutral">
                  {displayRating} / 5
                </span>
              </div>
              <textarea
                className="mb-2 w-full rounded-kg border border-kg-border p-3 text-sm focus:border-kg-primary focus:outline-none focus:ring-2 focus:ring-kg-primary/20"
                placeholder="Your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
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
                    className={`chip text-xs ${vibeTags.includes(v) ? "chip-active" : "chip-inactive"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              {showPreview && (
                <div className="mb-3 rounded-kg border border-kg-border bg-kg-surface p-3">
                  <p className="text-xs font-semibold text-kg-primary">Preview</p>
                  <p className="mt-1 text-sm text-kg-neutral">
                    <span className="text-kg-accent">
                      {"★".repeat(displayRating)}
                      {"☆".repeat(5 - displayRating)}
                    </span>{" "}
                    · {session?.user?.name || "You"}
                  </p>
                  {comment.trim() && (
                    <p className="mt-1 text-sm leading-relaxed text-kg-muted">
                      {comment.trim()}
                    </p>
                  )}
                  {vibeTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {vibeTags.map((tag) => (
                        <span key={tag} className="tag-teal text-xs">
                          felt {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                disabled={reviewMutation.isPending || !comment.trim()}
                onClick={() => reviewMutation.mutate()}
                className="btn-teal w-full disabled:opacity-50"
              >
                {reviewMutation.isPending ? "Submitting…" : "Submit review"}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
