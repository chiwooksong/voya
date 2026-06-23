"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TripInput, FixedEvent, TravelStyle, FlightInfo } from "@/types";
import { TMEvent } from "@/lib/ticketmaster";
import EventSearch from "@/components/EventSearch";
import {
  MapPin,
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  Plane,
  ChevronRight,
  Ticket,
  Search,
} from "lucide-react";

const STYLE_OPTIONS = {
  intensity: [
    { value: "packed", label: "빡빡하게", emoji: "⚡", desc: "하루 5-7개 일정" },
    { value: "relaxed", label: "여유롭게", emoji: "☕", desc: "하루 3-4개 일정" },
  ],
  theme: [
    { value: "food", label: "미식 중심", emoji: "🍽️" },
    { value: "sightseeing", label: "관광 중심", emoji: "🏛️" },
    { value: "activity", label: "액티비티", emoji: "🏄" },
    { value: "relaxation", label: "휴양 중심", emoji: "🌴" },
  ],
  companion: [
    { value: "solo", label: "혼자", emoji: "🧍" },
    { value: "couple", label: "커플", emoji: "💑" },
    { value: "family", label: "가족", emoji: "👨‍👩‍👧" },
    { value: "friends", label: "친구", emoji: "👯" },
  ],
} as const;

const POPULAR_CITIES = [
  "도쿄", "오사카", "뉴욕", "파리", "방콕", "싱가포르", "런던", "바르셀로나",
];

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cities, setCities] = useState<string[]>([""]);
  const [fixedEvents, setFixedEvents] = useState<FixedEvent[]>([]);
  const [showEventSearch, setShowEventSearch] = useState(false);
  const [budgetPerNight, setBudgetPerNight] = useState<number | "">("");
  const [budgetCurrency, setBudgetCurrency] = useState<"USD" | "KRW" | "JPY">("USD");
  const [flight, setFlight] = useState<Partial<FlightInfo>>({});
  const [showFlight, setShowFlight] = useState(false);
  const [style, setStyle] = useState<TravelStyle>({
    intensity: "relaxed",
    theme: "sightseeing",
    companion: "couple",
  });

  const today = new Date().toISOString().split("T")[0];

  const addCity = () => {
    if (cities.length < 2) setCities([...cities, ""]);
  };
  const updateCity = (i: number, v: string) => {
    const next = [...cities];
    next[i] = v;
    setCities(next);
  };
  const removeCity = (i: number) => setCities(cities.filter((_, idx) => idx !== i));

  const addFixedEvent = () => {
    setFixedEvents([...fixedEvents, { date: startDate || today, title: "" }]);
  };
  const updateFixedEvent = (i: number, field: keyof FixedEvent, v: string) => {
    const next = [...fixedEvents];
    next[i] = { ...next[i], [field]: v };
    setFixedEvents(next);
  };
  const removeFixedEvent = (i: number) =>
    setFixedEvents(fixedEvents.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validCities = cities.filter((c) => c.trim());
    if (!startDate || !endDate || validCities.length === 0) {
      setError("날짜와 도시를 입력해주세요.");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError("종료일은 시작일보다 이후여야 합니다.");
      return;
    }

    const input: TripInput = {
      startDate,
      endDate,
      cities: validCities,
      fixedEvents: fixedEvents.filter((e) => e.title.trim()),
      style,
      budget: budgetPerNight ? { perNight: Number(budgetPerNight), currency: budgetCurrency } : undefined,
      flight: (flight.arrivalTime && flight.returnDepartureTime)
        ? { departureAirport: flight.departureAirport || "ICN", arrivalAirport: flight.arrivalAirport || cities[0], arrivalTime: flight.arrivalTime, returnDepartureTime: flight.returnDepartureTime }
        : undefined,
    };

    setLoading(true);
    try {
      const res = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error("일정 생성에 실패했습니다.");
      const itinerary = await res.json();

      sessionStorage.setItem("voya-itinerary", JSON.stringify(itinerary));
      router.push("/plan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-indigo-900">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Plane className="w-6 h-6 text-white" />
          <span className="text-white text-xl font-bold tracking-tight">voya</span>
        </div>
        {session ? (
          <div className="flex items-center gap-3">
            {session.user?.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name || ""}
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-white/80 text-sm">{session.user?.name}</span>
          </div>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-full transition"
          >
            Google로 로그인
          </button>
        )}
      </nav>

      {/* Hero */}
      <div className="text-center pt-12 pb-10 px-4">
        <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-sm px-4 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          AI 기반 여행 일정 자동 생성
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
          조건만 입력하면<br />
          <span className="text-brand-300">AI가 완벽한 일정</span>을 만들어줘요
        </h1>
        <p className="text-white/60 text-lg">
          최적 동선 계산 · 예약 바로 연결 · 대화로 수정
        </p>
      </div>

      {/* Form Card */}
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Dates */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-brand-600" />
              <h2 className="font-semibold text-gray-800">여행 날짜</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">출발일</label>
                <input
                  type="date"
                  min={today}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">귀국일</label>
                <input
                  type="date"
                  min={startDate || today}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Cities */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-600" />
                <h2 className="font-semibold text-gray-800">여행 도시</h2>
                <span className="text-xs text-gray-400">최대 2곳</span>
              </div>
              {cities.length < 2 && (
                <button
                  type="button"
                  onClick={addCity}
                  className="text-brand-600 text-xs flex items-center gap-1 hover:text-brand-700"
                >
                  <Plus className="w-3.5 h-3.5" /> 도시 추가
                </button>
              )}
            </div>
            <div className="space-y-2">
              {cities.map((city, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`도시명 입력 (예: 도쿄, Tokyo)`}
                    value={city}
                    onChange={(e) => updateCity(i, e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    required={i === 0}
                  />
                  {cities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCity(i)}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    const emptyIdx = cities.findIndex((v) => !v);
                    if (emptyIdx >= 0) updateCity(emptyIdx, c);
                    else if (cities.length < 2) setCities([...cities, c]);
                    else updateCity(0, c);
                  }}
                  className="text-xs bg-gray-100 hover:bg-brand-50 hover:text-brand-700 text-gray-600 px-3 py-1 rounded-full transition"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Fixed Events */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-800">고정 이벤트 <span className="text-gray-400 font-normal text-sm">선택</span></h2>
                <p className="text-xs text-gray-400 mt-0.5">NBA 경기, 뮤지컬 등 날짜가 정해진 일정</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEventSearch(true)}
                  disabled={!startDate || !endDate}
                  className="text-brand-600 text-xs flex items-center gap-1 hover:text-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Search className="w-3.5 h-3.5" /> Ticketmaster 검색
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={addFixedEvent}
                  className="text-gray-500 text-xs flex items-center gap-1 hover:text-gray-700"
                >
                  <Plus className="w-3.5 h-3.5" /> 직접 입력
                </button>
              </div>
            </div>
            {fixedEvents.length === 0 && (
              <div className="text-center py-4 text-gray-300 text-sm">
                고정 이벤트가 없으면 AI가 자유롭게 일정을 짭니다
              </div>
            )}
            <div className="space-y-3">
              {fixedEvents.map((evt, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1">
                    {evt.tmEventId ? (
                      // Ticketmaster에서 가져온 이벤트
                      <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-3 py-2.5">
                        <Ticket className="w-4 h-4 text-brand-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-brand-800 truncate">{evt.title}</p>
                          <p className="text-xs text-brand-600">
                            {evt.date}{evt.time ? ` ${evt.time}` : ""} · {evt.venue}
                          </p>
                        </div>
                        {evt.ticketUrl && (
                          <a
                            href={evt.ticketUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-600 underline flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            티켓
                          </a>
                        )}
                      </div>
                    ) : (
                      // 직접 입력 이벤트
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="date"
                          value={evt.date}
                          min={startDate || today}
                          max={endDate}
                          onChange={(e) => updateFixedEvent(i, "date", e.target.value)}
                          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="이벤트명"
                          value={evt.title}
                          onChange={(e) => updateFixedEvent(i, "title", e.target.value)}
                          className="col-span-2 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFixedEvent(i)}
                    className="text-gray-400 hover:text-red-500 mt-2 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Ticketmaster Search Modal */}
          {showEventSearch && (
            <EventSearch
              cities={cities.filter(Boolean)}
              startDate={startDate}
              endDate={endDate}
              onSelect={(event: TMEvent) => {
                const newEvent: FixedEvent = {
                  date: event.date,
                  title: event.name,
                  time: event.time,
                  venue: event.venue,
                  location: `${event.venue}, ${event.city}`,
                  ticketUrl: event.url,
                  lat: event.lat,
                  lng: event.lng,
                  tmEventId: event.id,
                };
                setFixedEvents([...fixedEvents, newEvent]);
                setShowEventSearch(false);
              }}
              onClose={() => setShowEventSearch(false)}
            />
          )}

          {/* Budget */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">💰</span>
              <h2 className="font-semibold text-gray-800">1박 숙소 예산 <span className="text-gray-400 font-normal text-sm">선택</span></h2>
            </div>
            <div className="flex gap-2">
              <select
                value={budgetCurrency}
                onChange={(e) => setBudgetCurrency(e.target.value as "USD" | "KRW" | "JPY")}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="USD">USD ($)</option>
                <option value="KRW">KRW (₩)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
              <input
                type="number"
                min={0}
                placeholder="예: 100"
                value={budgetPerNight}
                onChange={(e) => setBudgetPerNight(e.target.value === "" ? "" : Number(e.target.value))}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {budgetCurrency === "USD" && [50, 100, 150, 200, 300].map(v => (
                <button key={v} type="button" onClick={() => setBudgetPerNight(v)}
                  className={`text-xs px-3 py-1 rounded-full border transition ${budgetPerNight === v ? "bg-brand-600 text-white border-brand-600" : "border-gray-200 text-gray-500 hover:border-brand-400"}`}>
                  ${v}
                </button>
              ))}
              {budgetCurrency === "KRW" && [50000, 100000, 150000, 200000, 300000].map(v => (
                <button key={v} type="button" onClick={() => setBudgetPerNight(v)}
                  className={`text-xs px-3 py-1 rounded-full border transition ${budgetPerNight === v ? "bg-brand-600 text-white border-brand-600" : "border-gray-200 text-gray-500 hover:border-brand-400"}`}>
                  ₩{v.toLocaleString()}
                </button>
              ))}
              {budgetCurrency === "JPY" && [5000, 10000, 15000, 20000, 30000].map(v => (
                <button key={v} type="button" onClick={() => setBudgetPerNight(v)}
                  className={`text-xs px-3 py-1 rounded-full border transition ${budgetPerNight === v ? "bg-brand-600 text-white border-brand-600" : "border-gray-200 text-gray-500 hover:border-brand-400"}`}>
                  ¥{v.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Flight Info */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-brand-600" />
                <h2 className="font-semibold text-gray-800">항공편 정보 <span className="text-gray-400 font-normal text-sm">선택</span></h2>
              </div>
              <button
                type="button"
                onClick={() => setShowFlight(!showFlight)}
                className="text-xs text-brand-600 hover:text-brand-700"
              >
                {showFlight ? "접기" : "입력하기"}
              </button>
            </div>
            {!showFlight && (
              <p className="text-xs text-gray-400">입력하면 첫날/마지막날 일정이 비행 시간에 맞게 조정돼요</p>
            )}
            {showFlight && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">출발 공항</label>
                    <input
                      type="text"
                      placeholder="예: ICN, 인천"
                      value={flight.departureAirport || ""}
                      onChange={(e) => setFlight({ ...flight, departureAirport: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">도착 공항</label>
                    <input
                      type="text"
                      placeholder="예: NRT, 나리타"
                      value={flight.arrivalAirport || ""}
                      onChange={(e) => setFlight({ ...flight, arrivalAirport: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">현지 도착 시간 (첫날)</label>
                    <input
                      type="time"
                      value={flight.arrivalTime || ""}
                      onChange={(e) => setFlight({ ...flight, arrivalTime: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">귀국 출발 시간 (마지막날)</label>
                    <input
                      type="time"
                      value={flight.returnDepartureTime || ""}
                      onChange={(e) => setFlight({ ...flight, returnDepartureTime: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                </div>
                {startDate && endDate && flight.departureAirport && (
                  <a
                    href={`https://www.google.com/flights#search;f=${encodeURIComponent(flight.departureAirport)};t=${encodeURIComponent(flight.arrivalAirport || cities[0] || "")};d=${startDate};r=${endDate}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-brand-600 hover:text-brand-700 mt-1"
                  >
                    <Plane className="w-3.5 h-3.5" />
                    Google Flights에서 항공권 검색 →
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Travel Style */}
          <div className="p-6">
            <h2 className="font-semibold text-gray-800 mb-4">여행 스타일</h2>

            {/* Intensity */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">일정 강도</p>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_OPTIONS.intensity.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStyle({ ...style, intensity: opt.value as TravelStyle["intensity"] })}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm transition ${
                      style.intensity === opt.value
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-xs text-gray-400">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">테마</p>
              <div className="grid grid-cols-4 gap-2">
                {STYLE_OPTIONS.theme.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStyle({ ...style, theme: opt.value as TravelStyle["theme"] })}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm transition ${
                      style.theme === opt.value
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Companion */}
            <div>
              <p className="text-xs text-gray-500 mb-2">동행</p>
              <div className="grid grid-cols-4 gap-2">
                {STYLE_OPTIONS.companion.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStyle({ ...style, companion: opt.value as TravelStyle["companion"] })}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm transition ${
                      style.companion === opt.value
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="px-6 pb-6">
            {error && (
              <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl transition flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI가 일정을 생성하는 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  AI 일정 생성하기
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
            {!session && (
              <p className="text-center text-xs text-gray-400 mt-3">
                Google Calendar 저장을 위해{" "}
                <button
                  type="button"
                  onClick={() => signIn("google")}
                  className="text-brand-600 underline"
                >
                  로그인
                </button>
                이 필요합니다
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
