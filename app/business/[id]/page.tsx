import { redirect } from "next/navigation";

export default function BusinessRedirect({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/place/${params.id}`);
}
