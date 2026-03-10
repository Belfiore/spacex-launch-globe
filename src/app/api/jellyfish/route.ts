import { NextResponse } from "next/server";

/**
 * Proxy for the Jellyfish visibility predictor API.
 * Fetches upcoming launch jellyfish predictions from
 * https://jellyfish.johnkrausphotos.com/api/v2/upcoming
 * and returns a simplified mapping of mission name → label.
 */
export async function GET() {
  try {
    const res = await fetch(
      "https://jellyfish.johnkrausphotos.com/api/v2/upcoming",
      {
        next: { revalidate: 900 }, // cache for 15 minutes
        headers: { Accept: "application/json" },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Jellyfish API unavailable" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const missions: Array<{
      mission: string;
      label: string;
      score: number;
      launchTime: string;
    }> = [];

    for (const m of data.upcoming ?? []) {
      missions.push({
        mission: m.mission ?? "",
        label: m.jellyfish_label ?? "Unknown",
        score: m.heatmap_peak_score_01 ?? 0,
        launchTime: m.launch_time_utc ?? "",
      });
    }

    return NextResponse.json({ missions });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch jellyfish data" },
      { status: 500 }
    );
  }
}
