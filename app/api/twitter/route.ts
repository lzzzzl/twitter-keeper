import { extractAndFormatMedia, fetchEmbeddedTweet } from "@/lib/get-tweet";
import { Tweet } from "@/types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    const tweet: Tweet = await fetchEmbeddedTweet(url);
    const media = extractAndFormatMedia(tweet);

    return NextResponse.json(JSON.stringify(media), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=604800",
      },
    });
  } catch (e) {
    console.log("[GET]", e);
    return new NextResponse("Something went wrong", { status: 500 });
  }
}
