import { redirect } from "next/navigation";

/** Legacy route: id may be place id — redirect to public business profile when possible */
export default function BusinessLegacyRedirect({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/place/${params.id}`);
}
