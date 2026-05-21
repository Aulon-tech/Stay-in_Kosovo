"use client";

import Link from "next/link";
import { useToastStore } from "@/lib/toast-store";

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (!toasts.length) return null;

  return (
    <div
      className="fixed bottom-20 left-0 right-0 z-[100] mx-auto flex max-w-md flex-col gap-2 px-3"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center justify-between gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm text-white shadow-lg"
        >
          <span>{toast.message}</span>
          <div className="flex shrink-0 gap-2">
            {toast.actionHref && toast.actionLabel && (
              <Link
                href={toast.actionHref}
                className="font-medium text-amber-300"
                onClick={() => dismiss(toast.id)}
              >
                {toast.actionLabel}
              </Link>
            )}
            <button
              type="button"
              className="text-gray-400"
              aria-label="Dismiss"
              onClick={() => dismiss(toast.id)}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
