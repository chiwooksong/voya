import Anthropic from "@anthropic-ai/sdk";
import { TripInput, Itinerary, DayPlan } from "@/types";
import { format, eachDayOfInterval, parseISO } from "date-fns";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

function buildSystemPrompt(): string {
  return `You are Voya, an expert AI travel planner. You create detailed, optimized travel itineraries.

When generating itineraries:
- Arrange places in geographically efficient order to minimize travel time
- For packed intensity: 4-5 activities/day. For relaxed: 3 activities/day
- Food theme: prioritize acclaimed restaurants and food markets
- Sightseeing theme: major landmarks and cultural sites
- Activity theme: tours, sports, outdoor adventures
- Relaxation theme: spas, beaches, cafes, parks
- Solo: budget-friendly, social venues, co-working spots
- Couple: romantic restaurants, scenic spots, intimate venues
- Family: kid-friendly, easy logistics, shorter distances
- Friends: nightlife, group activities, shareable experiences
- Always anchor fixed events on their specified dates and plan around them
- Include realistic opening hours and visit duration estimates
- Suggest hotel areas strategically based on the itinerary

Respond ONLY with valid JSON matching this exact TypeScript type:
{
  summary: string,
  days: Array<{
    date: string, // YYYY-MM-DD
    city: string,
    places: Array<{
      id: string, // unique slug like "day1-place1"
      name: string,
      address: string,
      category: "attraction" | "restaurant" | "hotel" | "event" | "transport",
      lat: number,
      lng: number,
      duration: number, // minutes
      bookingUrl: string | null,
      bookingType: "agoda" | "klook" | "ticketmaster" | "google" | null,
      notes: string, // time suggestion + tip
      reason: string // 1-2 sentences: why this place fits this traveler's style/theme
    }>,
    hotelRecommendation: { name: string, bookingUrl: string } | null
  }>
}`;
}

function buildUserPrompt(input: TripInput): string {
  const days = eachDayOfInterval({
    start: parseISO(input.startDate),
    end: parseISO(input.endDate),
  });

  const fixedEventsText =
    input.fixedEvents.length > 0
      ? `\nFixed events (must be placed on exact dates, do not change):\n${input.fixedEvents
          .map(
            (e) =>
              `- ${e.date}${e.time ? ` at ${e.time}` : ""}: ${e.title}${e.venue ? ` @ ${e.venue}` : ""}${e.location ? ` (${e.location})` : ""}${e.ticketUrl ? ` [ticket: ${e.ticketUrl}]` : ""}${e.lat ? ` [coords: ${e.lat},${e.lng}]` : ""}`
          )
          .join("\n")}`
      : "";

  return `Create a ${days.length}-day travel itinerary with these details:

Dates: ${input.startDate} to ${input.endDate} (${days.length} days)
Cities: ${input.cities.join(", ")}
Travel intensity: ${input.style.intensity === "packed" ? "Packed (busy schedule)" : "Relaxed (leisurely pace)"}
Theme: ${input.style.theme}
Traveling with: ${input.style.companion}${fixedEventsText}

For booking URLs, use these patterns:
- Hotels: https://www.agoda.com/search#/search?city=CITYNAME (replace CITYNAME)
- Activities: https://www.klook.com/en-US/search/?query=ACTIVITYNAME (replace ACTIVITYNAME)
- Events: https://www.ticketmaster.com/search?q=EVENTNAME (replace EVENTNAME)
- Restaurants: https://www.google.com/maps/search/RESTAURANTNAME+CITY (replace with actual names)

Use real, well-known places with accurate approximate coordinates. Make the itinerary practical and exciting.`;
}

export async function generateItinerary(input: TripInput): Promise<Itinerary> {
  const message = await getClient().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(input),
      },
    ],
    system: buildSystemPrompt(),
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  // Extract JSON - find first { to last } to handle any surrounding text
  const raw = content.text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in response");
  const jsonText = raw.slice(start, end + 1);
  const parsed = JSON.parse(jsonText) as { summary: string; days: DayPlan[] };

  return {
    id: crypto.randomUUID(),
    tripInput: input,
    days: parsed.days,
    summary: parsed.summary,
    createdAt: new Date().toISOString(),
  };
}

export async function modifyItinerary(
  itinerary: Itinerary,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string
): Promise<{ itinerary: Itinerary; reply: string }> {
  const conversationMessages = [
    ...messages,
    { role: "user" as const, content: userMessage },
  ];

  const systemPrompt = `${buildSystemPrompt()}

The user wants to modify an existing itinerary. Current itinerary:
${JSON.stringify(itinerary.days, null, 2)}

When modifying, respond with JSON in this format:
{
  "reply": "brief conversational response explaining the changes",
  "days": [...] // full updated days array, same structure as before
}

If the user asks a question without requesting changes, set "days" to null and just provide a "reply".`;

  const message = await getClient().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8192,
    system: systemPrompt,
    messages: conversationMessages,
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const jsonText = content.text.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(jsonText) as {
    reply: string;
    days: DayPlan[] | null;
  };

  const updatedItinerary = parsed.days
    ? { ...itinerary, days: parsed.days }
    : itinerary;

  return { itinerary: updatedItinerary, reply: parsed.reply };
}
