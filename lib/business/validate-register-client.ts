import type { BusinessRegisterPayload } from "@/components/auth/BusinessRegisterForm";
import { normalizePhotoUrls } from "@/lib/business/normalize-register";

export type ClientValidationResult = {
  ok: boolean;
  errors: Record<string, string>;
  firstStep: number;
};

export function validateBusinessRegisterClient(
  payload: BusinessRegisterPayload
): ClientValidationResult {
  const errors: Record<string, string> = {};

  if (!payload.ownerName?.trim()) errors.ownerName = "Owner name is required";
  if (!payload.email?.trim()) errors.email = "Login email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
    errors.email = "Enter a valid login email";
  }
  if (!payload.password || payload.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }
  if (!payload.contactEmail?.trim()) {
    errors.contactEmail = "Contact email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.contactEmail.trim())) {
    errors.contactEmail = "Enter a valid contact email";
  }
  if (!payload.businessName?.trim()) {
    errors.businessName = "Business name is required";
  }
  if (!payload.description?.trim() || payload.description.trim().length < 10) {
    errors.description = "Description must be at least 10 characters";
  }
  if (!payload.address?.trim()) errors.address = "Address is required";
  if (!payload.city?.trim()) errors.city = "City is required";

  const photos = normalizePhotoUrls(payload.photos ?? []);
  if (payload.photos?.length && photos.length === 0) {
    errors.photos =
      "Photo links look invalid — use full URLs (https://…) or leave empty for now";
  }

  const stepFor: Record<string, number> = {
    ownerName: 0,
    email: 0,
    password: 0,
    contactEmail: 0,
    businessName: 1,
    description: 1,
    category: 1,
    address: 2,
    city: 2,
    photos: 3,
  };

  const firstKey = Object.keys(errors)[0];
  const firstStep = firstKey ? (stepFor[firstKey] ?? 0) : 0;

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    firstStep,
  };
}
