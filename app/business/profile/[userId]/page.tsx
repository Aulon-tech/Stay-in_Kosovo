"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { formatCategoryLabel } from "@/lib/business/constants";

const MiniMap = dynamic(() => import("@/components/map/MiniPlaceMap"), {
  ssr: false,
});

export default function PublicBusinessProfilePage() {
  const { userId } = useParams<{ userId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["business-public", userId],
    queryFn: async () => {
      const res = await fetch(`/api/business/public/${userId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md p-6 text-sm text-kg-muted">Loading…</div>
    );
  }
  if (error || !data?.profile) {
    return (
      <div className="mx-auto max-w-md p-6">
        <p className="text-kg-primary">Business not found</p>
        <Link href="/discover" className="text-kg-primary underline">
          Discover
        </Link>
      </div>
    );
  }

  const { profile, place, reviews, events } = data;
  const photos =
    profile.photos?.length > 0 ? profile.photos : place?.images ?? [];
  const status = profile.verificationStatus;

  return (
    <div className="mx-auto max-w-md pb-10">
      <div className="relative h-48 bg-kg-surface">
        {photos[0] ? (
          <Image
            src={photos[0]}
            alt={profile.businessName}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">
            🏢
          </div>
        )}
        {profile.logo && (
          <div className="absolute -bottom-8 left-4 h-16 w-16 overflow-hidden rounded-full border-4 border-white bg-white shadow">
            <Image
              src={profile.logo}
              alt="Logo"
              width={64}
              height={64}
              className="object-cover"
              unoptimized
            />
          </div>
        )}
      </div>

      <div className="px-4 pt-10">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="kg-page-title">{profile.businessName}</h1>
            <p className="text-sm text-kg-muted capitalize">
              {formatCategoryLabel(profile.category)}
            </p>
          </div>
          {status === "verified" && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              Verified
            </span>
          )}
          {status === "pending" && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
              Pending
            </span>
          )}
        </div>

        {place && (
          <p className="mt-1 text-sm">
            ★ {place.avgRating.toFixed(1)} ({place.ratingCount} reviews)
          </p>
        )}

        <p className="mt-4 text-sm leading-relaxed">{profile.description}</p>

        {profile.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.tags.map((t: string) => (
              <span key={t} className="chip chip-inactive capitalize">
                {t}
              </span>
            ))}
          </div>
        )}

        {profile.services?.length > 0 && (
          <div className="kg-card-pad mt-4">
            <h2 className="text-sm font-semibold">Services & offers</h2>
            <ul className="mt-2 list-inside list-disc text-sm text-kg-muted">
              {profile.services.map((s: string) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="kg-card-pad mt-4 space-y-2 text-sm">
          {profile.address && (
            <p>
              📍 {profile.address}
              {profile.city ? `, ${profile.city}` : ""}
            </p>
          )}
          {profile.contactEmail && (
            <p>
              ✉️{" "}
              <a href={`mailto:${profile.contactEmail}`} className="underline">
                {profile.contactEmail}
              </a>
            </p>
          )}
          {profile.phone && <p>📞 {profile.phone}</p>}
          {profile.website && (
            <p>
              🌐{" "}
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Website
              </a>
            </p>
          )}
          {Object.keys(profile.openingHours || {}).length > 0 && (
            <div>
              <p className="font-semibold">Opening hours</p>
              {Object.entries(profile.openingHours).map(([day, hours]) => (
                <p key={day} className="text-kg-muted capitalize">
                  {day}: {String(hours)}
                </p>
              ))}
            </div>
          )}
          {profile.priceRange && (
            <p>Price: {profile.priceRange}</p>
          )}
        </div>

        {place && (
          <div className="mt-4 h-40 overflow-hidden rounded-kg">
            <MiniMap lat={place.lat} lng={place.lng} name={place.name} />
          </div>
        )}

        {photos.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {photos.slice(1).map((url: string, i: number) => (
              <div
                key={url + i}
                className="relative h-24 w-32 shrink-0 overflow-hidden rounded-kg"
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}

        {events?.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold">Upcoming events</h2>
            <ul className="mt-2 space-y-2">
              {events.map(
                (ev: {
                  id: string;
                  name: string;
                  startTime: string;
                  description: string;
                }) => (
                  <li key={ev.id} className="kg-card-pad text-sm">
                    <p className="font-medium">{ev.name}</p>
                    <p className="text-xs text-kg-muted">
                      {new Date(ev.startTime).toLocaleString()}
                    </p>
                  </li>
                )
              )}
            </ul>
          </section>
        )}

        <section className="mt-6">
          <h2 className="text-sm font-semibold">Posts & promotions</h2>
          <p className="mt-2 text-sm text-kg-muted">
            Offers and posts from this business will appear here soon.
          </p>
        </section>

        {reviews?.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold">Reviews</h2>
            <ul className="mt-2 space-y-3">
              {reviews.map(
                (r: {
                  id: string;
                  rating: number;
                  comment: string | null;
                  userName: string | null;
                }) => (
                  <li key={r.id} className="kg-card-pad text-sm">
                    <p className="font-medium">
                      {"★".repeat(r.rating)} {r.userName || "Guest"}
                    </p>
                    {r.comment && (
                      <p className="mt-1 text-kg-muted">{r.comment}</p>
                    )}
                  </li>
                )
              )}
            </ul>
          </section>
        )}

        {place && (
          <Link
            href={`/place/${place.id}`}
            className="btn-secondary mt-6 block text-center"
          >
            View on map & add to plan
          </Link>
        )}
      </div>
    </div>
  );
}
