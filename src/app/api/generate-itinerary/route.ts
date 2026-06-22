import { NextRequest, NextResponse } from "next/server";
import { generateItinerary } from "@/lib/claude";
import { getDirections } from "@/lib/googlemaps";
import { TripInput } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as TripInput;

    if (!body.startDate || !body.endDate || !body.cities?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const itinerary = await generateItinerary(body);

    // Enrich each day with route data from Google Maps
    const enrichedDays = await Promise.all(
      itinerary.days.map(async (day) => {
        try {
          const route = await getDirections(day.places);
          return { ...day, route };
        } catch {
          return day;
        }
      })
    );

    return NextResponse.json({ ...itinerary, days: enrichedDays });
  } catch (error) {
    console.error("Generate itinerary error:", error);
    return NextResponse.json(
      { error: "Failed to generate itinerary" },
      { status: 500 }
    );
  }
}
