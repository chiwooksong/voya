"use client";

import { DayPlan, Place } from "@/types";
import {
  MapPin,
  Clock,
  ExternalLink,
  Hotel,
  Utensils,
  Landmark,
  Ticket,
  ArrowRight,
  Train,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { useEffect, useState } from "react";

interface ItineraryCardProps {
  day: DayPlan;
  dayIndex: number;
  onPlaceHover?: (place: Place | null) => void;
}

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  attraction: <Landmark className="w-3.5 h-3.5" />,
  restaurant: <Utensils className="w-3.5 h-3.5" />,
  hotel: <Hotel className="w-3.5 h-3.5" />,
  event: <Ticket className="w-3.5 h-3.5" />,
  transport: <Train className="w-3.5 h-3.5" />,
};

const CATEGORY_COLOR: Record<string, string> = {
  attraction: "bg-blue-100 text-blue-700",
  restaurant: "bg-amber-100 text-amber-700",
  hotel: "bg-emerald-100 text-emerald-700",
  event: "bg-red-100 text-red-700",
  transport: "bg-purple-100 text-purple-700",
};

const BOOKING_LABEL: Record<string, string> = {
  agoda: "아고다",
  klook: "클룩",
  ticketmaster: "Ticketmaster",
  google: "구글",
};

function BookingButton({ place }: { place: Place }) {
  if (!place.bookingUrl) return null;
  const label =
    place.bookingType ? BOOKING_LABEL[place.bookingType] : "예약";
  const colors: Record<string, string> = {
    agoda: "bg-[#FF6B35] hover:bg-[#e85f2a]",
    klook: "bg-[#FF5722] hover:bg-[#e54b1e]",
    ticketmaster: "bg-[#026CDF] hover:bg-[#0260c9]",
    google: "bg-gray-700 hover:bg-gray-800",
  };
  const color = place.bookingType ? colors[place.bookingType] : "bg-brand-600 hover:bg-brand-700";

  return (
    <a
      href={place.bookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-white text-xs px-2.5 py-1 rounded-lg transition ${color}`}
    >
      {label}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

export default function ItineraryCard({
  day,
  dayIndex,
  onPlaceHover,
}: ItineraryCardProps) {
  const dateLabel = format(parseISO(day.date), "M월 d일 (EEE)", { locale: ko });
  const [hotelWebsite, setHotelWebsite] = useState<string | null>(
    day.hotelRecommendation?.websiteUrl ?? null
  );

  useEffect(() => {
    if (!day.hotelRecommendation || hotelWebsite) return;
    fetch(
      `/api/hotel-website?name=${encodeURIComponent(day.hotelRecommendation.name)}&city=${encodeURIComponent(day.city)}`
    )
      .then((r) => r.json())
      .then((data) => { if (data.websiteUrl) setHotelWebsite(data.websiteUrl); })
      .catch(() => {});
  }, [day.hotelRecommendation, day.city, hotelWebsite]);
  const totalDuration = day.places.reduce(
    (s, p) => s + (p.duration || 60),
    0
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Day Header */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-3.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-brand-200 text-xs font-medium">DAY {dayIndex + 1}</span>
            <h3 className="text-white font-bold text-base">{dateLabel}</h3>
          </div>
          <div className="text-right">
            <div className="text-white font-semibold">{day.city}</div>
            <div className="text-brand-200 text-xs">
              총 {Math.round(totalDuration / 60)}시간 예상
            </div>
          </div>
        </div>
      </div>

      {/* Places */}
      <div className="divide-y divide-gray-50">
        {day.places.map((place, idx) => (
          <div key={place.id}>
            <div
              className="flex gap-3 p-4 hover:bg-gray-50 transition cursor-pointer group"
              onMouseEnter={() => onPlaceHover?.(place)}
              onMouseLeave={() => onPlaceHover?.(null)}
            >
              {/* Number */}
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                {idx + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-gray-800 text-sm">
                        {place.name}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLOR[place.category] || "bg-gray-100 text-gray-600"}`}
                      >
                        {CATEGORY_ICON[place.category]}
                        {place.category === "attraction" ? "명소" :
                         place.category === "restaurant" ? "식당" :
                         place.category === "hotel" ? "숙소" :
                         place.category === "event" ? "이벤트" : "이동"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{place.address}</span>
                    </div>
                    {place.reason && (
                      <p className="text-xs text-brand-600 bg-brand-50 rounded-lg px-2.5 py-1.5 mt-1.5">
                        💡 {place.reason}
                      </p>
                    )}
                    {place.notes && (
                      <p className="text-xs text-gray-500 mt-1">{place.notes}</p>
                    )}
                  </div>
                  <BookingButton place={place} />
                </div>

                {place.duration && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{place.duration}분</span>
                  </div>
                )}
              </div>
            </div>

            {/* Transit info between places */}
            {idx < day.places.length - 1 && day.route?.[idx] && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-xs text-gray-500">
                <div className="w-6 flex justify-center">
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                </div>
                <Train className="w-3 h-3 text-gray-400" />
                <span>
                  이동 {day.route[idx].durationMinutes}분
                  {day.route[idx].distanceKm > 0 &&
                    ` · ${day.route[idx].distanceKm}km`}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hotel Recommendation */}
      {day.hotelRecommendation && (
        <div className="p-4 bg-emerald-50 border-t border-emerald-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hotel className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-xs text-emerald-700 font-medium">추천 숙소</p>
                <p className="text-sm font-semibold text-emerald-900">
                  {day.hotelRecommendation.name}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {hotelWebsite && (
                <a
                  href={hotelWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                >
                  공식 홈페이지 <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <a
                href={day.hotelRecommendation.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-[#003580] hover:bg-[#002a6b] text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1"
              >
                Booking.com <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
