import { NextRequest, NextResponse } from "next/server";
import { calculateTransportOptions } from "@/lib/transport";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const fromLat = Number(sp.get("fromLat"));
  const fromLng = Number(sp.get("fromLng"));
  const toLat = Number(sp.get("toLat"));
  const toLng = Number(sp.get("toLng"));

  if ([fromLat, fromLng, toLat, toLng].some((n) => Number.isNaN(n))) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const options = calculateTransportOptions(fromLat, fromLng, toLat, toLng);
  return NextResponse.json(options);
}
