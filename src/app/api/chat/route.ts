import { NextRequest, NextResponse } from "next/server";
import { modifyItinerary } from "@/lib/claude";
import { getDirections } from "@/lib/googlemaps";
import { Itinerary, ChatMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      itinerary: Itinerary;
      messages: ChatMessage[];
      userMessage: string;
    };

    const { itinerary, reply } = await modifyItinerary(
      body.itinerary,
      body.messages,
      body.userMessage
    );

    // Re-enrich routes if days changed
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

    return NextResponse.json({
      itinerary: { ...itinerary, days: enrichedDays },
      reply,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
