import { NextRequest, NextResponse } from "next/server";
import { searchEvents } from "@/lib/ticketmaster";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword");
  const city = searchParams.get("city") ?? undefined;
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;

  if (!keyword) {
    return NextResponse.json({ error: "keyword required" }, { status: 400 });
  }

  try {
    const cityFilter = searchParams.get("cityFilter") ?? undefined;
    const events = await searchEvents({ keyword, city, startDate, endDate, size: 200 });

    // 광역 도시 매핑 - 인근 도시도 포함
    const METRO: Record<string, string[]> = {
      "new york": ["new york", "brooklyn", "newark", "elmont", "flushing", "bronx", "queens", "staten island", "east rutherford", "harrison", "uniondale", "hempstead"],
      "los angeles": ["los angeles", "inglewood", "anaheim", "carson", "el segundo", "long beach", "santa monica", "burbank", "glendale", "pasadena"],
      "chicago": ["chicago", "rosemont", "evanston", "aurora"],
      "london": ["london", "wembley", "twickenham", "wimbledon", "stratford", "greenwich"],
      "paris": ["paris", "saint-denis", "versailles", "boulogne"],
      "tokyo": ["tokyo", "shinjuku", "shibuya", "akihabara", "odaiba", "yokohama"],
      "osaka": ["osaka", "namba", "umeda", "kobe"],
      "bangkok": ["bangkok", "pathum thani"],
      "singapore": ["singapore"],
      "barcelona": ["barcelona", "hospitalet"],
      "las vegas": ["las vegas", "henderson", "paradise", "north las vegas"],
      "sydney": ["sydney", "parramatta", "homebush"],
      "hong kong": ["hong kong", "kowloon"],
    };

    const filtered = cityFilter
      ? events.filter((e) => {
          const venueCity = e.city.toLowerCase();
          const key = cityFilter.toLowerCase();
          const metros = METRO[key] ?? [key];
          return metros.some((m) => venueCity.includes(m));
        })
      : events;

    console.log(`Ticketmaster [${keyword}]: ${events.length}개 → 필터 후 ${filtered.length}개`);
    return NextResponse.json({ events: filtered });
  } catch (error) {
    console.error("Ticketmaster search error:", error);
    return NextResponse.json({ events: [] });
  }
}
