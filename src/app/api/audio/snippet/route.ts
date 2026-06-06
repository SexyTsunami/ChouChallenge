import { NextRequest, NextResponse } from "next/server";
import {
  createSnippetStream,
  nodeStreamToWebStream,
  SNIPPET_DURATION_SEC,
  SNIPPET_START_SEC,
} from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json({ error: "Invalid videoId" }, { status: 400 });
  }

  try {
    const nodeStream = createSnippetStream(videoId);
    const webStream = nodeStreamToWebStream(nodeStream);

    return new Response(webStream, {
      headers: {
        "Content-Type": "audio/webm",
        "Cache-Control": "private, max-age=3600",
        "X-Snippet-Start": String(SNIPPET_START_SEC),
        "X-Snippet-Duration": String(SNIPPET_DURATION_SEC),
      },
    });
  } catch (err) {
    console.error("Audio snippet failed:", err);
    return NextResponse.json({ error: "Failed to load audio snippet" }, { status: 500 });
  }
}
