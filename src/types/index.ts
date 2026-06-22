export type TravelStyle = {
  intensity: "packed" | "relaxed";
  theme: "food" | "sightseeing" | "activity" | "relaxation";
  companion: "solo" | "couple" | "family" | "friends";
};

export type FixedEvent = {
  date: string; // YYYY-MM-DD
  title: string;
  time?: string; // HH:MM
  location?: string;
  venue?: string;
  ticketUrl?: string;
  lat?: number;
  lng?: number;
  tmEventId?: string; // Ticketmaster event ID
};

export type TripInput = {
  startDate: string;
  endDate: string;
  cities: string[];
  fixedEvents: FixedEvent[];
  style: TravelStyle;
};

export type Place = {
  id: string;
  name: string;
  address: string;
  category: "attraction" | "restaurant" | "hotel" | "event" | "transport";
  lat: number;
  lng: number;
  duration?: number; // minutes
  bookingUrl?: string;
  bookingType?: "agoda" | "klook" | "ticketmaster" | "google";
  notes?: string;
  reason?: string; // AI 추천 이유
  imageUrl?: string;
};

export type RouteStep = {
  from: string;
  to: string;
  mode: "walking" | "transit" | "driving";
  durationMinutes: number;
  distanceKm: number;
};

export type DayPlan = {
  date: string; // YYYY-MM-DD
  city: string;
  places: Place[];
  route?: RouteStep[];
  hotelRecommendation?: {
    name: string;
    bookingUrl: string;
  };
};

export type Itinerary = {
  id: string;
  tripInput: TripInput;
  days: DayPlan[];
  summary: string;
  createdAt: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
