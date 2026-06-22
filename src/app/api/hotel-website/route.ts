import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  const city = searchParams.get("city");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!name || !city || !apiKey) {
    return NextResponse.json({ websiteUrl: null });
  }

  try {
    // Places Text Search로 호텔 검색
    const query = encodeURIComponent(`${name} hotel ${city}`);
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id&key=${apiKey}`,
      { next: { revalidate: 86400 } }
    );
    const searchData = await searchRes.json();
    const placeId = searchData.candidates?.[0]?.place_id;

    if (!placeId) return NextResponse.json({ websiteUrl: null });

    // Place Details로 공식 웹사이트 가져오기
    const detailRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=website&key=${apiKey}`,
      { next: { revalidate: 86400 } }
    );
    const detailData = await detailRes.json();
    const websiteUrl = detailData.result?.website ?? null;

    return NextResponse.json({ websiteUrl });
  } catch {
    return NextResponse.json({ websiteUrl: null });
  }
}
