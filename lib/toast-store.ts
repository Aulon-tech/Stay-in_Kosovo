import { create } from "zustand";

export type Toast = {
  id: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
};

type ToastState = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { ...t, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` },
      ].slice(-3),
    })),
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));
