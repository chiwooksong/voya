export type TMEvent = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  venue: string;
  city: string;
  country: string;
  url: string;
  imageUrl?: string;
  category: string;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  lat?: number;
  lng?: number;
  status: "onsale" | "offsale" | "cancelled" | "rescheduled" | "unknown";
};

export async function searchEvents(params: {
  keyword: string;
  city?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;
  countryCode?: string;
  size?: number;
}): Promise<TMEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey || apiKey === "your_ticketmaster_api_key") return [];

  const query = new URLSearchParams({
    apikey: apiKey,
    keyword: params.keyword,
    size: String(params.size ?? 5),
    sort: "date,asc",
  });

  if (params.city) query.set("city", params.city);
  if (params.countryCode) query.set("countryCode", params.countryCode);
  if (params.startDate) query.set("startDateTime", `${params.startDate}T00:00:00Z`);
  if (params.endDate) query.set("endDateTime", `${params.endDate}T23:59:59Z`);

  const allRawEvents: TMRawEvent[] = [];
  let page = 0;

  while (true) {
    query.set("page", String(page));
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${query}`;
    if (page === 0) console.log("Ticketmaster URL:", url.replace(apiKey, "***"));

    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();

    if (!res.ok) {
      console.error("Ticketmaster API error:", JSON.stringify(data));
      break;
    }

    const pageEvents: TMRawEvent[] = data._embedded?.events ?? [];
    allRawEvents.push(...pageEvents);

    const totalPages: number = data.page?.totalPages ?? 1;
    console.log(`Ticketmaster page ${page + 1}/${totalPages}: ${pageEvents.length}개`);

    if (page + 1 >= totalPages || page >= 9) break; // 최대 10페이지(2000개)
    page++;
  }

  const events = allRawEvents;
  console.log(`Ticketmaster 전체: ${events.length}개`);

  return events.map((e: TMRawEvent) => {
    const dateInfo = e.dates?.start;
    const venue = e._embedded?.venues?.[0];
    const img = e.images?.find((i: TMImage) => i.ratio === "16_9" && i.width > 500) ?? e.images?.[0];
    const price = e.priceRanges?.[0];

    return {
      id: e.id,
      name: e.name,
      date: dateInfo?.localDate ?? "",
      time: dateInfo?.localTime?.slice(0, 5),
      venue: venue?.name ?? "Unknown Venue",
      city: venue?.city?.name ?? "",
      country: venue?.country?.name ?? "",
      url: e.url,
      imageUrl: img?.url,
      category: e.classifications?.[0]?.segment?.name ?? "Event",
      priceMin: price?.min,
      priceMax: price?.max,
      currency: price?.currency,
      lat: venue?.location?.latitude ? parseFloat(venue.location.latitude) : undefined,
      lng: venue?.location?.longitude ? parseFloat(venue.location.longitude) : undefined,
      status: (e.dates?.status?.code ?? "unknown") as TMEvent["status"],
    };
  });
}

// Raw Ticketmaster API types
type TMImage = { ratio: string; url: string; width: number; height: number };
type TMRawEvent = {
  id: string;
  name: string;
  url: string;
  dates?: {
    start?: { localDate?: string; localTime?: string };
    status?: { code?: string };
  };
  images?: TMImage[];
  classifications?: Array<{ segment?: { name?: string } }>;
  priceRanges?: Array<{ min?: number; max?: number; currency?: string }>;
  _embedded?: {
    venues?: Array<{
      name?: string;
      city?: { name?: string };
      country?: { name?: string };
      location?: { latitude?: string; longitude?: string };
    }>;
  };
};
