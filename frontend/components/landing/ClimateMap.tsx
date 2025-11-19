"use client";

import React, { useEffect, useRef } from "react";
import L, { Map as LeafletMap, Marker as LeafletMarker, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";

interface StaticLocation {
  id: string;
  name: string;
  lat: string;
  lon: string;
}

interface ClimateMapProps {
  lat: string;
  lon: string;
  setLat: (value: string) => void;
  setLon: (value: string) => void;
  selectedLocation: string;
  setSelectedLocation: (value: string) => void;
  STATIC_LOCATIONS: StaticLocation[];
}

const ClimateMap: React.FC<ClimateMapProps> = ({
  lat,
  lon,
  setLat,
  setLon,
  selectedLocation,
  setSelectedLocation,
  STATIC_LOCATIONS,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const currentMarkerRef = useRef<LeafletMarker | null>(null);
  const staticLayerRef = useRef<LayerGroup | null>(null);

  const currentLocationIcon = L.divIcon({
    html:
      '<div style="width:18px;height:18px;border-radius:9999px;background:#2563eb;border:2px solid white;box-shadow:0 0 6px rgba(0,0,0,0.45);"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    className: "",
  });

  const staticLocationIcon = L.divIcon({
    html:
      '<div style="width:14px;height:14px;border-radius:9999px;background:#6b7280;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.35);"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    className: "",
  });

  // Initialize map once on mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const latNum = parseFloat(lat) || 28.6139;
    const lonNum = parseFloat(lon) || 77.2090;

    const map = L.map(containerRef.current).setView([latNum, lonNum], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    map.on("click", (e: any) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      setLat(clickLat.toFixed(4));
      setLon(clickLng.toFixed(4));
      setSelectedLocation("custom");
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      currentMarkerRef.current = null;
      staticLayerRef.current = null;
    };
  }, []);

  // Update view and current marker when lat/lon change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    if (Number.isNaN(latNum) || Number.isNaN(lonNum)) return;

    map.setView([latNum, lonNum]);

    if (!currentMarkerRef.current) {
      currentMarkerRef.current = L.marker([latNum, lonNum], {
        icon: currentLocationIcon,
      }).addTo(map);
    } else {
      currentMarkerRef.current.setLatLng([latNum, lonNum]);
    }
  }, [lat, lon]);

  // Initialize static preset markers once
  useEffect(() => {
    const map = mapRef.current;
    if (!map || staticLayerRef.current) return;

    const group = L.layerGroup().addTo(map);

    STATIC_LOCATIONS.filter((loc) => loc.lat && loc.lon).forEach((loc) => {
      const latNum = parseFloat(loc.lat);
      const lonNum = parseFloat(loc.lon);
      if (Number.isNaN(latNum) || Number.isNaN(lonNum)) return;

      const marker = L.marker([latNum, lonNum], {
        icon: staticLocationIcon,
      }).addTo(group);

      marker.on("click", () => {
        setLat(loc.lat);
        setLon(loc.lon);
        setSelectedLocation(loc.id);
      });
    });

    staticLayerRef.current = group;
  }, [STATIC_LOCATIONS, setLat, setLon, setSelectedLocation]);

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
};

export default ClimateMap;
