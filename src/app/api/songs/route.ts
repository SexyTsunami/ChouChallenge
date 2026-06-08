import { NextResponse } from "next/server";
import { getJayChouSongList } from "@/lib/jayChouSongs";

export async function GET() {
  const tracks = getJayChouSongList();
  return NextResponse.json({
    count: tracks.length,
    tracks: tracks.map(({ id, name }) => ({ id, name })),
  });
}
