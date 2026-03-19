import { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  GripVertical,
  Navigation,
  RotateCcw,
  Zap,
  Clock,
  Truck,
} from 'lucide-react';

interface Stop {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const EXAMPLE_STOPS: Stop[] = [
  { id: 's1', name: 'Main Office / Yard', address: '1200 N Alvernon Way, Tucson, AZ 85712', lat: 32.2319, lng: -110.9128 },
  { id: 's2', name: 'Downtown Construction Site', address: '75 E Broadway Blvd, Tucson, AZ 85701', lat: 32.2217, lng: -110.9695 },
  { id: 's3', name: 'University Event Setup', address: '1303 E University Blvd, Tucson, AZ 85719', lat: 32.2319, lng: -110.9501 },
  { id: 's4', name: 'Oro Valley Festival Grounds', address: '11000 N La Cañada Dr, Oro Valley, AZ 85737', lat: 32.3909, lng: -110.9665 },
  { id: 's5', name: 'Marana Regional Park', address: '12300 N Sandario Rd, Marana, AZ 85653', lat: 32.4363, lng: -111.1547 },
  { id: 's6', name: 'Southside Warehouse', address: '4002 S Park Ave, Tucson, AZ 85714', lat: 32.1823, lng: -110.9665 },
  { id: 's7', name: 'Catalina Foothills Residence', address: '6401 N Campbell Ave, Tucson, AZ 85718', lat: 32.2827, lng: -110.9390 },
  { id: 's8', name: 'Rita Ranch Development', address: '8900 S Rita Rd, Tucson, AZ 85747', lat: 32.1127, lng: -110.8421 },
  { id: 's9', name: 'Tucson Mall Service Area', address: '4500 N Oracle Rd, Tucson, AZ 85705', lat: 32.2672, lng: -110.9847 },
  { id: 's10', name: 'Green Valley Retirement Community', address: '1070 S Calle De Las Casitas, Green Valley, AZ 85614', lat: 31.8545, lng: -111.0002 },
];

// Create numbered marker icons
function createNumberedIcon(num: number, isDepot: boolean) {
  const color = isDepot ? '#0a1f44' : '#f89020';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    ">${isDepot ? '&#9679;' : num}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function totalDistance(stops: Stop[]): number {
  let dist = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    dist += haversineDistance(stops[i].lat, stops[i].lng, stops[i + 1].lat, stops[i + 1].lng);
  }
  return dist;
}

function nearestNeighborOptimize(stops: Stop[]): Stop[] {
  if (stops.length <= 2) return [...stops];
  const result: Stop[] = [stops[0]];
  const remaining = stops.slice(1);

  while (remaining.length > 0) {
    const last = result[result.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineDistance(last.lat, last.lng, remaining[i].lat, remaining[i].lng);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    result.push(remaining.splice(nearestIdx, 1)[0]);
  }
  return result;
}

// Component to auto-fit map bounds when stops change
function FitBounds({ stops }: { stops: Stop[] }) {
  const map = useMap();
  useEffect(() => {
    if (stops.length > 0) {
      const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [stops, map]);
  return null;
}

export function RoutePlanning() {
  const [stops, setStops] = useState<Stop[]>(EXAMPLE_STOPS);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [optimized, setOptimized] = useState(false);
  const dragNode = useRef<HTMLDivElement | null>(null);

  const dist = totalDistance(stops);
  const estimatedTime = Math.round((dist / 30) * 60);

  const routeLine: [number, number][] = stops.map((s) => [s.lat, s.lng]);

  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    setDragIndex(idx);
    dragNode.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      if (dragNode.current) dragNode.current.style.opacity = '0.4';
    }, 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIndex(idx);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIdx: number) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === dropIdx) return;
      const newStops = [...stops];
      const [moved] = newStops.splice(dragIndex, 1);
      newStops.splice(dropIdx, 0, moved);
      setStops(newStops);
      setOptimized(false);
    },
    [dragIndex, stops],
  );

  const handleDragEnd = useCallback(() => {
    if (dragNode.current) dragNode.current.style.opacity = '1';
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  const handleOptimize = () => {
    setStops(nearestNeighborOptimize(stops));
    setOptimized(true);
  };

  const handleReset = () => {
    setStops(EXAMPLE_STOPS);
    setOptimized(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-secondary-500">Route Planning</h2>
          <p className="text-sm text-gray-500">Drag and drop stops to reorder, or optimize automatically</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleOptimize}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Zap className="w-4 h-4" />
            Optimize Route
          </button>
        </div>
      </div>

      {/* Route Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Stops</span>
          </div>
          <p className="text-2xl font-bold text-secondary-500">{stops.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Truck className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Total Distance</span>
          </div>
          <p className="text-2xl font-bold text-secondary-500">{dist.toFixed(1)} mi</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Est. Drive Time</span>
          </div>
          <p className="text-2xl font-bold text-secondary-500">
            {Math.floor(estimatedTime / 60)}h {estimatedTime % 60}m
          </p>
        </div>
      </div>

      {optimized && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <Zap className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700">
            <strong>Route optimized!</strong> Using nearest-neighbor algorithm starting from your depot.
          </p>
        </div>
      )}

      {/* Map + Stop List side by side */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Map */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ minHeight: 500 }}>
          <MapContainer
            center={[32.2226, -110.9747]}
            zoom={11}
            style={{ height: '100%', width: '100%', minHeight: 500 }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds stops={stops} />

            {/* Route line */}
            <Polyline
              positions={routeLine}
              pathOptions={{ color: '#f89020', weight: 3, opacity: 0.8, dashArray: '8, 6' }}
            />

            {/* Stop markers */}
            {stops.map((stop, idx) => (
              <Marker
                key={stop.id}
                position={[stop.lat, stop.lng]}
                icon={createNumberedIcon(idx, idx === 0)}
              >
                <Popup>
                  <div style={{ minWidth: 150 }}>
                    <strong>{idx === 0 ? 'Depot' : `Stop ${idx}`}: {stop.name}</strong>
                    <br />
                    <span style={{ fontSize: 12, color: '#666' }}>{stop.address}</span>
                    {idx > 0 && (
                      <>
                        <br />
                        <span style={{ fontSize: 12, color: '#f89020', fontWeight: 600 }}>
                          {haversineDistance(stops[idx - 1].lat, stops[idx - 1].lng, stop.lat, stop.lng).toFixed(1)} mi from previous
                        </span>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Stop List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col" style={{ maxHeight: 500 }}>
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2 flex-shrink-0">
            <Navigation className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-bold text-secondary-500 uppercase">Route Stops</h3>
            <span className="text-xs text-gray-400 ml-auto">Drag to reorder</span>
          </div>
          <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
            {stops.map((stop, idx) => (
              <div
                key={stop.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 px-4 py-3 cursor-grab active:cursor-grabbing transition-colors ${
                  overIndex === idx && dragIndex !== idx
                    ? 'bg-primary-50 border-l-4 border-l-primary-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    idx === 0
                      ? 'bg-secondary-500 text-white'
                      : 'bg-primary-100 text-primary-700'
                  }`}
                >
                  {idx === 0 ? <MapPin className="w-3.5 h-3.5" /> : idx}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-secondary-500 truncate">{stop.name}</p>
                  <p className="text-xs text-gray-400 truncate">{stop.address}</p>
                </div>
                {idx > 0 && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-gray-500">
                      {haversineDistance(stops[idx - 1].lat, stops[idx - 1].lng, stop.lat, stop.lng).toFixed(1)} mi
                    </p>
                    <p className="text-xs text-gray-400">from prev</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
