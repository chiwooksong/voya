"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import dynamic from "next/dynamic";
import { Itinerary, Place, DayPlan } from "@/types";
import { buildFullItineraryCalendarUrl } from "@/lib/calendar";
import ItineraryCard from "@/components/ItineraryCard";
import ChatPanel from "@/components/ChatPanel";
import {
  Plane,
  Calendar,
  ArrowLeft,
  Share2,
  MapPin,
  Sparkles,
} from "lucide-react";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function PlanPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [activeDay, setActiveDay] = useState(0);
  const [hoveredPlace, setHoveredPlace] = useState<Place | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("voya-itinerary");
    if (!stored) {
      router.push("/");
      return;
    }
    setItinerary(JSON.parse(stored));
  }, [router]);

  useEffect(() => {
    if (itinerary) {
      sessionStorage.setItem("voya-itinerary", JSON.stringify(itinerary));
    }
  }, [itinerary]);

  if (!itinerary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">일정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const currentDay: DayPlan = itinerary.days[activeDay];
  const mapPlaces = hoveredPlace
    ? currentDay.places
    : currentDay.places;

  const calendarUrl = buildFullItineraryCalendarUrl(itinerary);

  const handleShare = async () => {
    const text = `Voya로 만든 ${itinerary.tripInput.cities.join(" & ")} 여행 일정`;
    if (navigator.share) {
      await navigator.share({ title: text, text: itinerary.summary });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("링크가 복사되었습니다!");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-brand-600" />
            <span className="font-bold text-gray-900">voya</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-gray-400 text-sm mx-2">·</span>
            <span className="text-gray-700 text-sm font-medium">
              {itinerary.tripInput.cities.join(" & ")}
            </span>
            <span className="text-gray-400 text-sm ml-2">
              {itinerary.tripInput.startDate} ~ {itinerary.tripInput.endDate}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session ? (
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm px-3 py-1.5 rounded-lg transition"
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">캘린더 저장</span>
            </a>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm px-3 py-1.5 rounded-lg transition"
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">캘린더 저장</span>
            </button>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm px-3 py-1.5 rounded-lg transition"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 shrink-0">
        <div className="max-w-6xl mx-auto flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-brand-200 mt-0.5 flex-shrink-0" />
          <p className="text-white/90 text-sm leading-relaxed">{itinerary.summary}</p>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="bg-white border-b border-gray-100 shrink-0">
        <div className="max-w-6xl mx-auto flex overflow-x-auto scrollbar-thin">
          {itinerary.days.map((day, i) => (
            <button
              key={day.date}
              onClick={() => setActiveDay(i)}
              className={`flex-shrink-0 flex flex-col items-center px-5 py-2.5 border-b-2 transition text-sm ${
                activeDay === i
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="font-medium">Day {i + 1}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                <span className="text-xs">{day.city}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full flex gap-0 lg:gap-4 p-0 lg:p-4">
          {/* Left: Itinerary Cards */}
          <div className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 overflow-y-auto scrollbar-thin p-4 lg:p-0 space-y-3">
            <ItineraryCard
              day={currentDay}
              dayIndex={activeDay}
              onPlaceHover={setHoveredPlace}
            />
          </div>

          {/* Right: Map */}
          <div className="hidden lg:block flex-1 min-h-0">
            <MapView
              places={mapPlaces}
              route={currentDay.route}
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
            />
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <ChatPanel itinerary={itinerary} onItineraryUpdate={setItinerary} />
    </div>
  );
}
