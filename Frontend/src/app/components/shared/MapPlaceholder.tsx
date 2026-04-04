import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

interface MapPlaceholderProps {
  stops?: Array<{
    id: string;
    order: number;
    location: string;
    latitude: number;
    longitude: number;
  }>;
  height?: string;
  showRoute?: boolean;
  className?: string;
}

export const MapPlaceholder: React.FC<MapPlaceholderProps> = ({
  stops = [],
  height = '400px',
  showRoute = true,
  className = '',
}) => {
  return (
    <Card className={className}>
      <CardContent className="p-0 overflow-hidden">
        <div
          className="relative bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center"
          style={{ height }}
        >
          {/* Map Grid Background */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%">
              <defs>
                <pattern
                  id="grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Route Line */}
          {showRoute && stops.length > 1 && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 1 }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#2563EB" />
                </marker>
              </defs>
              {stops.map((stop, index) => {
                if (index < stops.length - 1) {
                  const x1 = ((index + 1) / (stops.length + 1)) * 100;
                  const y1 = 30 + Math.sin(index) * 10;
                  const x2 = ((index + 2) / (stops.length + 1)) * 100;
                  const y2 = 30 + Math.sin(index + 1) * 10;
                  return (
                    <line
                      key={`line-${index}`}
                      x1={`${x1}%`}
                      y1={`${y1}%`}
                      x2={`${x2}%`}
                      y2={`${y2}%`}
                      stroke="#2563EB"
                      strokeWidth="3"
                      strokeDasharray="5,5"
                      markerEnd="url(#arrowhead)"
                    />
                  );
                }
                return null;
              })}
            </svg>
          )}

          {/* Stop Markers */}
          {stops.length > 0 ? (
            <div className="relative w-full h-full">
              {stops.map((stop, index) => {
                const x = ((index + 1) / (stops.length + 1)) * 100;
                const y = 30 + Math.sin(index) * 10;
                return (
                  <div
                    key={stop.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <div className="relative group">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold shadow-lg border-2 border-white">
                        {stop.order}
                      </div>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
                        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                          {stop.location}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center z-10">
              <div className="bg-white rounded-full p-4 inline-flex mb-3 shadow-md">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-600 font-medium">Interactive Map View</p>
              <p className="text-sm text-gray-400 mt-1">Route will be displayed here</p>
            </div>
          )}

          {/* Compass */}
          <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md z-10">
            <Navigation className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
