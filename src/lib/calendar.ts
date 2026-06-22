import { Itinerary, DayPlan, Place } from "@/types";

function formatGoogleCalendarDate(dateStr: string, timeStr?: string): string {
  if (timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date(`${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
    return d.toISOString().replace(/[-:]/g, "").replace(".000", "");
  }
  return dateStr.replace(/-/g, "");
}

export function buildCalendarEventUrl(
  title: string,
  date: string,
  duration: number,
  location: string,
  details: string
): string {
  const start = formatGoogleCalendarDate(date, "09:00");
  const endDate = new Date(`${date}T09:00:00`);
  endDate.setMinutes(endDate.getMinutes() + duration);
  const end = endDate
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(".000", "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    location,
    details,
  });

  return `https://calendar.google.com/calendar/render?${params}`;
}

export function buildFullItineraryCalendarUrl(itinerary: Itinerary): string {
  // For multi-event export, we link to the first day and user can add rest manually
  // Google Calendar doesn't support bulk event creation via URL
  const firstDay = itinerary.days[0];
  if (!firstDay) return "https://calendar.google.com";

  const title = `Voya Trip: ${itinerary.tripInput.cities.join(" & ")}`;
  const details = itinerary.days
    .map(
      (d: DayPlan) =>
        `${d.date} (${d.city}):\n${d.places.map((p: Place) => `• ${p.name}`).join("\n")}`
    )
    .join("\n\n");

  return buildCalendarEventUrl(
    title,
    firstDay.date,
    (itinerary.days.length * 8 * 60),
    itinerary.tripInput.cities[0],
    details
  );
}
