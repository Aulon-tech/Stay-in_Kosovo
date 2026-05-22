"use client";

export type AccountKind = "individual" | "business";

export function AccountTypeTabs({
  value,
  onChange,
}: {
  value: AccountKind;
  onChange: (v: AccountKind) => void;
}) {
  return (
    <div
      className="mb-6 flex rounded-kg border border-kg-border bg-white p-1"
      role="tablist"
      aria-label="Account type"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "individual"}
        className={`flex-1 rounded-kg py-2.5 text-sm font-semibold transition ${
          value === "individual"
            ? "bg-kg-primary text-white shadow-sm"
            : "text-kg-muted"
        }`}
        onClick={() => onChange("individual")}
      >
        Individual
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "business"}
        className={`flex-1 rounded-kg py-2.5 text-sm font-semibold transition ${
          value === "business"
            ? "bg-kg-primary text-white shadow-sm"
            : "text-kg-muted"
        }`}
        onClick={() => onChange("business")}
      >
        Business
      </button>
    </div>
  );
}

export const AUTH_COPY = {
  individual: {
    login:
      "Sign in to discover Kosovo, find your +1, and explore places with people who match your vibe.",
    register:
      "Join SHOQ1 to discover Kosovo, find your +1, and explore places with people who match your vibe.",
  },
  business: {
    login:
      "Sign in to manage your business profile, offers, and visibility to tourists, students, and locals.",
    register:
      "Create a business profile on SHOQ1 to promote your place, events, offers, and experiences to tourists, students, and locals.",
  },
} as const;
