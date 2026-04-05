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
    variant?: 'office' | 'parking' | 'stop' | 'default';
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

const createPinIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-pin-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 34px;
        height: 34px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid #ffffff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-weight: 800;
          font-size: 12px;
          font-family: system-ui, sans-serif;
        ">${label}</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });
};

const createStopBadgeIcon = (color: string, badge?: string | number) => {
  const badgeText = badge ?? '';
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        border-radius: 999px;
        border: 2px solid #ffffff;
        background: ${color};
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          color: #ffffff;
          font-weight: 700;
          font-size: 11px;
          font-family: system-ui, sans-serif;
          line-height: 1;
        ">${badgeText}</span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
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
  const layersRef = useRef<L.Layer[]>([]);
  const polylinesRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      zoomControl: true,
      preferCanvas: false,
    }).setView(center, zoom);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
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
    layersRef.current.forEach((layer) => layer.remove());
    layersRef.current = [];

    // Add new markers
    markers.forEach((markerData, index) => {
      const color = markerData.color || '#2563EB';
      const variant = markerData.variant || 'default';
      let marker: L.Layer;

      if (variant === 'stop') {
        marker = L.marker(markerData.position, {
          icon: createStopBadgeIcon(color, markerData.badge ?? index + 1),
        }).addTo(mapInstanceRef.current!);
      } else if (variant === 'office') {
        marker = L.marker(markerData.position, {
          icon: createPinIcon('#111111', 'O'),
        }).addTo(mapInstanceRef.current!);
      } else if (variant === 'parking') {
        marker = L.marker(markerData.position, {
          icon: createPinIcon(color, 'C'),
        }).addTo(mapInstanceRef.current!);
      } else {
        marker = L.marker(markerData.position, {
          icon: createPinIcon(color, String(markerData.badge ?? index + 1)),
        }).addTo(mapInstanceRef.current!);
      }

      (marker as L.Marker).bindPopup(`
        <div style="padding: 8px;">
          <p style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${markerData.label}</p>
          <p style="font-size: 12px; color: #666;">
            ${markerData.position[0].toFixed(6)}, ${markerData.position[1].toFixed(6)}
          </p>
        </div>
      `);

      (marker as L.Marker).bindTooltip(markerData.label, { sticky: true });

      layersRef.current.push(marker);
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
          weight: route.weight ?? 3,
          opacity: route.opacity ?? 0.7,
          lineCap: 'round',
          lineJoin: 'round',
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
        weight: 3,
        opacity: 0.7,
        lineCap: 'round',
        lineJoin: 'round',
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
        borderRadius: '6px', 
        overflow: 'hidden', 
        border: '1px solid #cbd5e1',
        zIndex: 0,
      }} 
    />
  );
};
