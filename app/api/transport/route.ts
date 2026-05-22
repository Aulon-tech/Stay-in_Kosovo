import { NextRequest, NextResponse } from "next/server";
import { calculateTransportOptions } from "@/lib/transport";
import { isValidCoord } from "@/lib/geo";
import { getDefaultOrigin } from "@/lib/geo";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const fromLat = Number(sp.get("fromLat"));
  const fromLng = Number(sp.get("fromLng"));
  const toLat = Number(sp.get("toLat"));
  const toLng = Number(sp.get("toLng"));

  if (!isValidCoord(toLat, toLng)) {
    return NextResponse.json({ error: "Invalid destination" }, { status: 400 });
  }

  const fallback = getDefaultOrigin();
  const userLat = isValidCoord(fromLat, fromLng) ? fromLat : fallback.lat;
  const userLng = isValidCoord(fromLat, fromLng) ? fromLng : fallback.lng;

  const result = calculateTransportOptions(userLat, userLng, toLat, toLng);
  return NextResponse.json(result);
}
