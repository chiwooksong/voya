"use client";

import { useEffect, useRef, useState } from "react";
import { Place, RouteStep } from "@/types";
import { Navigation } from "lucide-react";

interface MapViewProps {
  places: Place[];
  route?: RouteStep[];
  apiKey: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  attraction: "#2251ff",
  restaurant: "#f59e0b",
  hotel: "#10b981",
  event: "#ef4444",
  transport: "#8b5cf6",
};

const CATEGORY_LABELS: Record<string, string> = {
  attraction: "명소",
  restaurant: "식당",
  hotel: "숙소",
  event: "이벤트",
  transport: "이동",
};

declare global {
  interface Window {
    google: typeof google;
    initVoyaMap?: () => void;
  }
}

export default function MapView({ places, route, apiKey }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    const scriptId = "google-maps-script";
    if (document.getElementById(scriptId)) return;

    window.initVoyaMap = () => setMapLoaded(true);

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initVoyaMap&libraries=geometry`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, [apiKey]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || places.length === 0) return;

    const center = {
      lat: places.reduce((s, p) => s + p.lat, 0) / places.length,
      lng: places.reduce((s, p) => s + p.lng, 0) / places.length,
    };

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
          { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
          {
            elementType: "labels.text.fill",
            stylers: [{ color: "#616161" }],
          },
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
          {
            featureType: "transit",
            elementType: "geometry",
            stylers: [{ color: "#e5e5e5" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#c9c9c9" }],
          },
        ],
      });
    } else {
      mapInstanceRef.current.setCenter(center);
    }

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    polylineRef.current?.setMap(null);

    // Add markers
    places.forEach((place, idx) => {
      const color = CATEGORY_COLORS[place.category] || "#2251ff";
      const marker = new window.google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map: mapInstanceRef.current!,
        title: place.name,
        label: {
          text: String(idx + 1),
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: "bold",
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 18,
        },
      });

      marker.addListener("click", () => setSelectedPlace(place));
      markersRef.current.push(marker);
    });

    // Draw route polyline
    if (places.length > 1) {
      const path = places.map((p) => ({ lat: p.lat, lng: p.lng }));
      polylineRef.current = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#2251ff",
        strokeOpacity: 0.5,
        strokeWeight: 2,
        icons: [
          {
            icon: {
              path: window.google.maps.SymbolPath.FORWARD_OPEN_ARROW,
              scale: 3,
              strokeColor: "#2251ff",
            },
            offset: "100%",
            repeat: "80px",
          },
        ],
      });
      polylineRef.current.setMap(mapInstanceRef.current!);
    }

    // Fit bounds
    const bounds = new window.google.maps.LatLngBounds();
    places.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    mapInstanceRef.current!.fitBounds(bounds, 60);
  }, [mapLoaded, places]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-2xl" />

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl">
          <div className="text-gray-400 text-sm">지도 로딩 중...</div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-xl shadow p-2.5 text-xs space-y-1">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-gray-600">{CATEGORY_LABELS[cat]}</span>
          </div>
        ))}
      </div>

      {/* Route info */}
      {route && route.length > 0 && (
        <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur rounded-xl shadow p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Navigation className="w-3.5 h-3.5 text-brand-600" />
            <span className="text-xs font-semibold text-gray-700">이동 시간</span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-thin">
            {route.slice(0, 4).map((r, i) => (
              <div
                key={i}
                className="flex-shrink-0 text-xs bg-gray-50 rounded-lg px-2.5 py-1.5"
              >
                <span className="text-gray-500">{i + 1}→{i + 2}</span>
                <span className="font-medium text-gray-800 ml-1.5">
                  {r.durationMinutes}분
                </span>
              </div>
            ))}
            {route.length > 4 && (
              <div className="flex-shrink-0 text-xs text-gray-400 flex items-center px-1">
                +{route.length - 4}개
              </div>
            )}
          </div>
        </div>
      )}

      {/* Place popup */}
      {selectedPlace && (
        <div className="absolute top-3 right-3 bg-white rounded-xl shadow-lg p-3 max-w-xs z-10">
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="font-semibold text-sm text-gray-800">
                {selectedPlace.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedPlace.address}
              </p>
              {selectedPlace.duration && (
                <p className="text-xs text-brand-600 mt-1">
                  예상 소요 {selectedPlace.duration}분
                </p>
              )}
              {selectedPlace.notes && (
                <p className="text-xs text-gray-600 mt-1">{selectedPlace.notes}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedPlace(null)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          </div>
          {selectedPlace.bookingUrl && (
            <a
              href={selectedPlace.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-center text-xs bg-brand-600 text-white py-1.5 rounded-lg hover:bg-brand-700 transition"
            >
              예약하기
            </a>
          )}
        </div>
      )}
    </div>
  );
}
