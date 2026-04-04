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
  }>;
  showRoute?: boolean;
  height?: string;
}

// Create custom colored marker icons
const createColoredIcon = (color: string, number?: number) => {
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
        ">${number || ''}</span>
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
  height = '400px',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);

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
        icon: createColoredIcon(markerData.color || '#2563EB', index + 1),
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

  // Update route line
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove old polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    // Add new polyline if needed
    if (showRoute && markers.length > 1) {
      const positions = markers.map(m => m.position as L.LatLngExpression);
      const polyline = L.polyline(positions, {
        color: '#2563EB',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10',
      }).addTo(mapInstanceRef.current);
      
      polylineRef.current = polyline;
    }
  }, [markers, showRoute]);

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
