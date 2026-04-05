import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapPickerProps {
  center: [number, number];
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  markers?: Array<{
    position: [number, number];
    label: string;
    color?: string;
    badge?: string | number;
  }>;
  showRoute?: boolean;
  routeColor?: string;
  routes?: Array<{
    points: [number, number][];
    color?: string;
    weight?: number;
    opacity?: number;
  }>;
  height?: string;
}

// Create custom colored marker icons
const createColoredIcon = (color: string, badge?: string | number) => {
  const badgeText = badge ?? '';
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 14px;
        ">${badgeText}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export const InteractiveMap: React.FC<MapPickerProps> = ({
  center,
  zoom = 13,
  onLocationSelect,
  markers = [],
  showRoute = false,
  routeColor = '#2563EB',
  routes = [],
  height = '400px',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylinesRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add click handler for location selection
    if (onLocationSelect) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData, index) => {
      const marker = L.marker(markerData.position, {
        icon: createColoredIcon(markerData.color || '#2563EB', markerData.badge ?? index + 1),
      }).addTo(mapInstanceRef.current!);

      marker.bindPopup(`
        <div style="padding: 8px;">
          <p style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${markerData.label}</p>
          <p style="font-size: 12px; color: #666;">
            ${markerData.position[0].toFixed(6)}, ${markerData.position[1].toFixed(6)}
          </p>
        </div>
      `);

      markersRef.current.push(marker);
    });
  }, [markers]);

  // Update route line(s)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove old polylines
    polylinesRef.current.forEach((polyline) => polyline.remove());
    polylinesRef.current = [];

    // Draw provided route paths first (real street geometry)
    if (routes.length > 0) {
      routes.forEach((route, idx) => {
        if (!route.points || route.points.length < 2) return;

        const polyline = L.polyline(route.points as L.LatLngExpression[], {
          color: route.color || routeColor,
          weight: route.weight ?? 4,
          opacity: route.opacity ?? 0.85,
        }).addTo(mapInstanceRef.current!);

        polylinesRef.current.push(polyline);
      });

      return;
    }

    // Fallback straight line using marker sequence
    if (showRoute && markers.length > 1) {
      const positions = markers.map(m => m.position as L.LatLngExpression);
      const polyline = L.polyline(positions, {
        color: routeColor,
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10',
      }).addTo(mapInstanceRef.current);

      polylinesRef.current.push(polyline);
    }
  }, [markers, showRoute, routeColor, routes]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height, 
        width: '100%', 
        borderRadius: '8px', 
        overflow: 'hidden', 
        border: '2px solid #e5e7eb',
        zIndex: 0,
      }} 
    />
  );
};
