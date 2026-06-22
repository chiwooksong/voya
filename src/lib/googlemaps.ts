import { Place, RouteStep } from "@/types";

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

export async function getDirections(
  places: Place[]
): Promise<RouteStep[]> {
  if (places.length < 2) return [];

  const steps: RouteStep[] = [];

  for (let i = 0; i < places.length - 1; i++) {
    const origin = `${places[i].lat},${places[i].lng}`;
    const destination = `${places[i + 1].lat},${places[i + 1].lng}`;

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=transit&key=${MAPS_API_KEY}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes?.length > 0) {
        const leg = data.routes[0].legs[0];
        steps.push({
          from: places[i].name,
          to: places[i + 1].name,
          mode: "transit",
          durationMinutes: Math.round(leg.duration.value / 60),
          distanceKm: Math.round((leg.distance.value / 1000) * 10) / 10,
        });
      } else {
        // Fallback: estimate based on coordinates
        const dist = haversineKm(
          places[i].lat, places[i].lng,
          places[i + 1].lat, places[i + 1].lng
        );
        steps.push({
          from: places[i].name,
          to: places[i + 1].name,
          mode: dist < 1 ? "walking" : "transit",
          durationMinutes: Math.round(dist < 1 ? dist * 15 : dist * 3),
          distanceKm: dist,
        });
      }
    } catch {
      const dist = haversineKm(
        places[i].lat, places[i].lng,
        places[i + 1].lat, places[i + 1].lng
      );
      steps.push({
        from: places[i].name,
        to: places[i + 1].name,
        mode: dist < 1 ? "walking" : "transit",
        durationMinutes: Math.round(dist < 1 ? dist * 15 : dist * 3),
        distanceKm: dist,
      });
    }
  }

  return steps;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export function buildMapUrl(places: Place[]): string {
  if (places.length === 0) return "";
  const waypoints = places
    .slice(1, -1)
    .map((p) => `${p.lat},${p.lng}`)
    .join("|");
  const origin = `${places[0].lat},${places[0].lng}`;
  const destination = `${places[places.length - 1].lat},${places[places.length - 1].lng}`;
  const base = "https://www.google.com/maps/embed/v1/directions";
  const params = new URLSearchParams({
    key: MAPS_API_KEY,
    origin,
    destination,
    ...(waypoints && { waypoints }),
    mode: "transit",
  });
  return `${base}?${params}`;
}
