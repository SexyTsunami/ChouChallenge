import { NextResponse } from "next/server";
import { getJayChouTracks } from "@/lib/youtube";

export async function GET() {
  const tracks = getJayChouTracks();
  return NextResponse.json({
    count: tracks.length,
    tracks: tracks.map(({ id, name }) => ({ id, name })),
  });
}
