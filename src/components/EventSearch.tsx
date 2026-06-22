"use client";

import { useState, useEffect, useRef } from "react";
import { TMEvent } from "@/lib/ticketmaster";
import { Search, Ticket, MapPin, Clock, ExternalLink, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 50;

interface EventSearchProps {
  cities: string[];
  startDate: string;
  endDate: string;
  onSelect: (event: TMEvent) => void;
  onClose: () => void;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  onsale: { label: "예매 가능", color: "text-green-600 bg-green-50" },
  offsale: { label: "판매 종료", color: "text-gray-500 bg-gray-100" },
  cancelled: { label: "취소됨", color: "text-red-600 bg-red-50" },
  rescheduled: { label: "일정 변경", color: "text-amber-600 bg-amber-50" },
  unknown: { label: "", color: "" },
};

export default function EventSearch({ cities, startDate, endDate, onSelect, onClose }: EventSearchProps) {
  const [keyword, setKeyword] = useState("");
  const [events, setEvents] = useState<TMEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!keyword.trim() || keyword.length < 2) {
      setEvents([]);
      setSearched(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(keyword);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const CITY_MAP: Record<string, string> = {
    "뉴욕": "New York", "뉴욕시": "New York", "도쿄": "Tokyo", "오사카": "Osaka",
    "파리": "Paris", "런던": "London", "방콕": "Bangkok", "싱가포르": "Singapore",
    "바르셀로나": "Barcelona", "로스앤젤레스": "Los Angeles", "LA": "Los Angeles",
    "라스베가스": "Las Vegas", "시카고": "Chicago", "시드니": "Sydney",
    "홍콩": "Hong Kong", "마카오": "Macau", "베가스": "Las Vegas",
  };

  const doSearch = async (q: string) => {
    setLoading(true);
    try {
      // 키워드에 도시명 자동 포함 (city 파라미터보다 신뢰도 높음)
      const rawCity = cities[0] ?? "";
      const englishCity = CITY_MAP[rawCity] ?? rawCity;
      const fullKeyword = englishCity ? `${q} ${englishCity}` : q;
      const params = new URLSearchParams({ keyword: fullKeyword });
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (englishCity) params.set("cityFilter", englishCity);
      const res = await fetch(`/api/events?${params}`);
      const data = await res.json();
      setEvents(data.events ?? []);
      setSearched(true);
      setCurrentPage(0);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <Ticket className="w-5 h-5 text-brand-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-gray-800 text-sm">Ticketmaster 이벤트 검색</p>
            <p className="text-xs text-gray-400">
              {cities.filter(Boolean).join(", ")} · {startDate} ~ {endDate}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="NBA, 뮤지컬, 콘서트, 축구..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            )}
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto flex-1 divide-y divide-gray-50">
          {!searched && !loading && (
            <div className="p-8 text-center text-gray-400 text-sm">
              검색어를 입력하면 실제 이벤트를 찾아드려요
            </div>
          )}

          {searched && events.length === 0 && !loading && (
            <div className="p-8 text-center text-gray-400 text-sm">
              해당 기간에 이벤트를 찾을 수 없어요
              <p className="text-xs mt-1">날짜 범위를 넓히거나 다른 키워드로 검색해보세요</p>
            </div>
          )}

          {searched && events.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 text-xs text-gray-400 flex items-center justify-between">
              <span>총 {events.length}개 · 페이지 {currentPage + 1}/{Math.ceil(events.length / PAGE_SIZE)}</span>
              <span>클릭해서 추가</span>
            </div>
          )}

          {events.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE).map((event) => {
            const status = STATUS_LABEL[event.status] ?? STATUS_LABEL.unknown;
            return (
              <button
                key={event.id}
                onClick={() => onSelect(event)}
                className="w-full flex gap-3 p-4 hover:bg-gray-50 transition text-left"
              >
                {event.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.imageUrl}
                    alt={event.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <Ticket className="w-6 h-6 text-brand-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">
                      {event.name}
                    </p>
                    {status.label && (
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${status.color}`}>
                        {status.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{event.date}{event.time ? ` ${event.time}` : ""}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{event.venue}, {event.city}</span>
                  </div>
                  {event.priceMin && (
                    <p className="text-xs text-brand-600 mt-0.5">
                      {event.currency} {event.priceMin.toFixed(0)}~{event.priceMax?.toFixed(0)}
                    </p>
                  )}
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
              </button>
            );
          })}
        </div>

        {/* Pagination */}
        {events.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => {
                setCurrentPage((p) => Math.max(0, p - 1));
                listRef.current?.scrollTo(0, 0);
              }}
              disabled={currentPage === 0}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" /> 이전
            </button>
            <span className="text-xs text-gray-400">
              {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, events.length)} / {events.length}
            </span>
            <button
              onClick={() => {
                setCurrentPage((p) => Math.min(Math.ceil(events.length / PAGE_SIZE) - 1, p + 1));
                listRef.current?.scrollTo(0, 0);
              }}
              disabled={(currentPage + 1) * PAGE_SIZE >= events.length}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              다음 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
