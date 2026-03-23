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
  Plus,
  X,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

// ─── Types ────────────────────────────────────────────────────────

interface ServiceLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'construction' | 'event' | 'park' | 'commercial' | 'residential' | 'municipal' | 'industrial';
  units: number; // how many units on-site
  lastService: string; // relative description
  priority: 'high' | 'medium' | 'low';
}

interface RouteStop extends ServiceLocation {
  legDistance?: number; // meters from previous stop (from OSRM)
  legDuration?: number; // seconds from previous stop (from OSRM)
  trafficLevel?: 'low' | 'moderate' | 'heavy'; // simulated
}

interface RouteGeometry {
  coordinates: [number, number][]; // [lng, lat] pairs from OSRM
}

// ─── 50 Service Locations (Colorado Front Range) ──────────────────

const SERVICE_LOCATIONS: ServiceLocation[] = [
  // Construction Sites (12)
  { id: 'loc-01', name: 'I-70 Bridge Replacement', address: '2400 I-70 Frontage Rd, Idaho Springs, CO', lat: 39.7425, lng: -105.5134, type: 'construction', units: 4, lastService: '2 days ago', priority: 'high' },
  { id: 'loc-02', name: 'DIA Terminal Expansion', address: '8500 Pena Blvd, Denver, CO', lat: 39.8561, lng: -104.6737, type: 'construction', units: 6, lastService: 'yesterday', priority: 'high' },
  { id: 'loc-03', name: 'RiNo Development Phase 3', address: '3500 Brighton Blvd, Denver, CO', lat: 39.7710, lng: -104.9780, type: 'construction', units: 8, lastService: '3 days ago', priority: 'high' },
  { id: 'loc-04', name: 'Boulder Flatirons Trailhead Rebuild', address: '1800 Table Mesa Dr, Boulder, CO', lat: 39.9878, lng: -105.2810, type: 'construction', units: 3, lastService: 'yesterday', priority: 'medium' },
  { id: 'loc-05', name: 'Colorado Springs Switchbacks Stadium', address: '6100 Tutt Blvd, Colorado Springs, CO', lat: 38.8876, lng: -104.7598, type: 'construction', units: 5, lastService: '4 days ago', priority: 'high' },
  { id: 'loc-06', name: 'I-25 South Gap Project', address: '1000 I-25 Frontage Rd, Castle Rock, CO', lat: 39.3722, lng: -104.8608, type: 'construction', units: 2, lastService: 'today', priority: 'low' },
  { id: 'loc-07', name: 'Fort Collins Mulberry Bridge', address: '2200 E Mulberry St, Fort Collins, CO', lat: 40.5853, lng: -105.0445, type: 'construction', units: 3, lastService: '2 days ago', priority: 'medium' },
  { id: 'loc-08', name: 'Greeley West Subdivision', address: '5500 W 29th St, Greeley, CO', lat: 40.4150, lng: -104.7530, type: 'construction', units: 4, lastService: '5 days ago', priority: 'high' },
  { id: 'loc-09', name: 'Pueblo Riverwalk Expansion', address: '101 S Union Ave, Pueblo, CO', lat: 38.2650, lng: -104.6120, type: 'construction', units: 2, lastService: 'yesterday', priority: 'medium' },
  { id: 'loc-10', name: 'Arvada Olde Town Redevelopment', address: '7300 Grandview Ave, Arvada, CO', lat: 39.8028, lng: -105.0875, type: 'construction', units: 10, lastService: '3 days ago', priority: 'high' },
  { id: 'loc-11', name: 'Longmont Main St Renovation', address: '350 Main St, Longmont, CO', lat: 40.1672, lng: -105.1019, type: 'construction', units: 6, lastService: '2 days ago', priority: 'medium' },
  { id: 'loc-12', name: 'Loveland Outlet Mall Build', address: '5800 McWhinney Blvd, Loveland, CO', lat: 40.4125, lng: -105.0530, type: 'construction', units: 3, lastService: 'yesterday', priority: 'low' },

  // Events (10)
  { id: 'loc-13', name: 'Red Rocks Concert Season', address: '18300 W Alameda Pkwy, Morrison, CO', lat: 39.6654, lng: -105.2057, type: 'event', units: 12, lastService: 'today', priority: 'high' },
  { id: 'loc-14', name: 'Coors Field Service Area', address: '2001 Blake St, Denver, CO', lat: 39.7559, lng: -104.9942, type: 'event', units: 20, lastService: 'today', priority: 'high' },
  { id: 'loc-15', name: 'Cherry Creek Arts Festival', address: '2500 E 1st Ave, Denver, CO', lat: 39.7185, lng: -104.9535, type: 'event', units: 15, lastService: 'today', priority: 'high' },
  { id: 'loc-16', name: 'Empower Field at Mile High', address: '1701 Bryant St, Denver, CO', lat: 39.7439, lng: -105.0201, type: 'event', units: 8, lastService: '2 days ago', priority: 'medium' },
  { id: 'loc-17', name: 'Boulder Creek Festival', address: '1200 Canyon Blvd, Boulder, CO', lat: 40.0176, lng: -105.2797, type: 'event', units: 10, lastService: '3 days ago', priority: 'medium' },
  { id: 'loc-18', name: 'Colorado State Fair', address: '1001 Beulah Ave, Pueblo, CO', lat: 38.2575, lng: -104.6285, type: 'event', units: 18, lastService: 'yesterday', priority: 'high' },
  { id: 'loc-19', name: 'Greeley Stampede Grounds', address: '501 N 14th Ave, Greeley, CO', lat: 40.4300, lng: -104.6920, type: 'event', units: 8, lastService: '4 days ago', priority: 'low' },
  { id: 'loc-20', name: 'DICK\'s Sporting Goods Park', address: '6000 Victory Way, Commerce City, CO', lat: 39.8056, lng: -104.8917, type: 'event', units: 14, lastService: 'yesterday', priority: 'medium' },
  { id: 'loc-21', name: 'Colorado Convention Center', address: '700 14th St, Denver, CO', lat: 39.7427, lng: -104.9958, type: 'event', units: 10, lastService: 'today', priority: 'high' },
  { id: 'loc-22', name: 'Larimer County Fair', address: '5280 Arena Cir, Loveland, CO', lat: 40.3980, lng: -105.0750, type: 'event', units: 6, lastService: '5 days ago', priority: 'low' },

  // Parks & Recreation (8)
  { id: 'loc-23', name: 'Washington Park', address: '701 S Franklin St, Denver, CO', lat: 39.6975, lng: -104.9725, type: 'park', units: 4, lastService: '3 days ago', priority: 'medium' },
  { id: 'loc-24', name: 'Chatfield State Park', address: '11500 N Roxborough Park Rd, Littleton, CO', lat: 39.5326, lng: -105.0707, type: 'park', units: 6, lastService: '4 days ago', priority: 'medium' },
  { id: 'loc-25', name: 'Garden of the Gods', address: '1805 N 30th St, Colorado Springs, CO', lat: 38.8786, lng: -104.8698, type: 'park', units: 4, lastService: '5 days ago', priority: 'low' },
  { id: 'loc-26', name: 'Cherry Creek State Park', address: '4201 S Parker Rd, Aurora, CO', lat: 39.6397, lng: -104.8520, type: 'park', units: 3, lastService: '2 days ago', priority: 'medium' },
  { id: 'loc-27', name: 'Boyd Lake State Park', address: '3720 N County Rd 11C, Loveland, CO', lat: 40.4300, lng: -105.0450, type: 'park', units: 2, lastService: 'yesterday', priority: 'low' },
  { id: 'loc-28', name: 'Lory State Park', address: '708 Lodgepole Dr, Bellvue, CO', lat: 40.5850, lng: -105.1730, type: 'park', units: 3, lastService: '3 days ago', priority: 'medium' },
  { id: 'loc-29', name: 'Roxborough State Park', address: '4751 E Roxborough Dr, Littleton, CO', lat: 39.4312, lng: -105.0690, type: 'park', units: 2, lastService: '6 days ago', priority: 'high' },
  { id: 'loc-30', name: 'Standley Lake Regional Park', address: '10300 W 88th Ave, Westminster, CO', lat: 39.8370, lng: -105.1200, type: 'park', units: 2, lastService: '4 days ago', priority: 'low' },

  // Commercial (8)
  { id: 'loc-31', name: 'Park Meadows Mall', address: '8401 Park Meadows Center Dr, Lone Tree, CO', lat: 39.5633, lng: -104.8838, type: 'commercial', units: 2, lastService: 'yesterday', priority: 'low' },
  { id: 'loc-32', name: 'Cherry Creek Shopping Center', address: '3000 E 1st Ave, Denver, CO', lat: 39.7178, lng: -104.9530, type: 'commercial', units: 2, lastService: '2 days ago', priority: 'low' },
  { id: 'loc-33', name: 'Flatiron Crossing Mall', address: '1 W Flatiron Crossing Dr, Broomfield, CO', lat: 39.9317, lng: -105.1310, type: 'commercial', units: 4, lastService: '3 days ago', priority: 'medium' },
  { id: 'loc-34', name: 'Colorado Mills Outlet', address: '14500 W Colfax Ave, Lakewood, CO', lat: 39.7385, lng: -105.1658, type: 'commercial', units: 2, lastService: 'yesterday', priority: 'low' },
  { id: 'loc-35', name: 'Southlands Lifestyle Center', address: '6155 S Main St, Aurora, CO', lat: 39.5792, lng: -104.7140, type: 'commercial', units: 1, lastService: '2 days ago', priority: 'low' },
  { id: 'loc-36', name: 'The Promenade Shops at Centerra', address: '5971 Sky Pond Dr, Loveland, CO', lat: 40.4045, lng: -105.0285, type: 'commercial', units: 3, lastService: '4 days ago', priority: 'medium' },
  { id: 'loc-37', name: 'Belmar Shopping District', address: '464 S Teller St, Lakewood, CO', lat: 39.7100, lng: -105.0810, type: 'commercial', units: 2, lastService: 'yesterday', priority: 'low' },
  { id: 'loc-38', name: 'The Shops at Northfield', address: '8340 Northfield Blvd, Denver, CO', lat: 39.7830, lng: -104.8980, type: 'commercial', units: 2, lastService: '3 days ago', priority: 'low' },

  // Residential Communities (6)
  { id: 'loc-39', name: 'Stapleton Community', address: '7350 E 29th Ave, Denver, CO', lat: 39.7730, lng: -104.8950, type: 'residential', units: 4, lastService: '2 days ago', priority: 'medium' },
  { id: 'loc-40', name: 'Green Valley Ranch', address: '4900 Himalaya Rd, Denver, CO', lat: 39.7835, lng: -104.7850, type: 'residential', units: 6, lastService: '3 days ago', priority: 'medium' },
  { id: 'loc-41', name: 'Highlands Ranch Community', address: '62 W Plaza Dr, Highlands Ranch, CO', lat: 39.5536, lng: -104.9696, type: 'residential', units: 4, lastService: '5 days ago', priority: 'low' },
  { id: 'loc-42', name: 'Erie New Homes Development', address: '900 Briggs St, Erie, CO', lat: 40.0503, lng: -105.0500, type: 'residential', units: 3, lastService: '4 days ago', priority: 'medium' },
  { id: 'loc-43', name: 'Castle Pines Village', address: '688 Happy Canyon Rd, Castle Pines, CO', lat: 39.4700, lng: -104.8935, type: 'residential', units: 2, lastService: '6 days ago', priority: 'low' },
  { id: 'loc-44', name: 'Timnath Ranch Estates', address: '4400 Timnath Dr, Timnath, CO', lat: 40.5283, lng: -104.9860, type: 'residential', units: 4, lastService: '3 days ago', priority: 'medium' },

  // Municipal (3)
  { id: 'loc-45', name: 'Denver City Hall', address: '1437 Bannock St, Denver, CO', lat: 39.7392, lng: -104.9870, type: 'municipal', units: 2, lastService: 'yesterday', priority: 'low' },
  { id: 'loc-46', name: 'Boulder County Courthouse', address: '1325 Pearl St, Boulder, CO', lat: 40.0190, lng: -105.2768, type: 'municipal', units: 2, lastService: '2 days ago', priority: 'low' },
  { id: 'loc-47', name: 'Fort Collins City Hall', address: '300 Laporte Ave, Fort Collins, CO', lat: 40.5878, lng: -105.0770, type: 'municipal', units: 3, lastService: '3 days ago', priority: 'medium' },

  // Industrial (3)
  { id: 'loc-48', name: 'Commerce City Recycling', address: '6200 Quebec St, Commerce City, CO', lat: 39.8230, lng: -104.9085, type: 'industrial', units: 4, lastService: '2 days ago', priority: 'medium' },
  { id: 'loc-49', name: 'DIA Cargo Area', address: '26500 E 75th Ave, Denver, CO', lat: 39.8400, lng: -104.6750, type: 'industrial', units: 5, lastService: '3 days ago', priority: 'medium' },
  { id: 'loc-50', name: 'Pueblo Steel Mill Complex', address: '100 W B St, Pueblo, CO', lat: 38.2780, lng: -104.6180, type: 'industrial', units: 3, lastService: '4 days ago', priority: 'low' },
];

const DEPOT: ServiceLocation = {
  id: 'depot',
  name: 'ServiceCore Yard & Depot',
  address: '4500 E 46th Ave, Denver, CO 80216',
  lat: 39.7780,
  lng: -104.9450,
  type: 'industrial',
  units: 0,
  lastService: '',
  priority: 'low',
};

const TYPE_LABELS: Record<ServiceLocation['type'], string> = {
  construction: 'Construction',
  event: 'Event',
  park: 'Park',
  commercial: 'Commercial',
  residential: 'Residential',
  municipal: 'Municipal',
  industrial: 'Industrial',
};

const TYPE_COLORS: Record<ServiceLocation['type'], string> = {
  construction: 'bg-yellow-100 text-yellow-800',
  event: 'bg-purple-100 text-purple-800',
  park: 'bg-green-100 text-green-800',
  commercial: 'bg-blue-100 text-blue-800',
  residential: 'bg-pink-100 text-pink-800',
  municipal: 'bg-gray-100 text-gray-800',
  industrial: 'bg-orange-100 text-orange-800',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-600',
  medium: 'text-yellow-600',
  low: 'text-green-600',
};

const MAX_ROUTE_STOPS = 15;

// ─── Helpers ──────────────────────────────────────────────────────

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

function createPoolIcon(type: ServiceLocation['type']) {
  const colors: Record<string, string> = {
    construction: '#EAB308',
    event: '#A855F7',
    park: '#22C55E',
    commercial: '#3B82F6',
    residential: '#EC4899',
    municipal: '#6B7280',
    industrial: '#F97316',
  };
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${colors[type] || '#999'};
      color: white;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      opacity: 0.6;
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestNeighborOptimize(stops: RouteStop[]): RouteStop[] {
  if (stops.length <= 2) return [...stops];
  // Keep depot as first stop
  const result: RouteStop[] = [stops[0]];
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

// Simulate traffic levels based on time of day and road segments
function simulateTraffic(): 'low' | 'moderate' | 'heavy' {
  const rand = Math.random();
  if (rand < 0.5) return 'low';
  if (rand < 0.85) return 'moderate';
  return 'heavy';
}

const TRAFFIC_COLORS = {
  low: '#22C55E',
  moderate: '#EAB308',
  heavy: '#EF4444',
};

// ─── OSRM Integration ────────────────────────────────────────────

async function fetchOSRMRoute(stops: RouteStop[]): Promise<{
  geometry: RouteGeometry;
  legs: { distance: number; duration: number }[];
  totalDistance: number;
  totalDuration: number;
} | null> {
  if (stops.length < 2) return null;

  const coords = stops.map((s) => `${s.lng},${s.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;

    const route = data.routes[0];
    return {
      geometry: route.geometry,
      legs: route.legs.map((leg: { distance: number; duration: number }) => ({
        distance: leg.distance,
        duration: leg.duration,
      })),
      totalDistance: route.distance,
      totalDuration: route.duration,
    };
  } catch {
    return null;
  }
}

// ─── Map sub-components ───────────────────────────────────────────

function FitBounds({ stops, poolLocations, showPool }: { stops: RouteStop[]; poolLocations: ServiceLocation[]; showPool: boolean }) {
  const map = useMap();
  useEffect(() => {
    const allPoints = [...stops];
    if (showPool) {
      allPoints.push(...(poolLocations as RouteStop[]));
    }
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints.map((s) => [s.lat, s.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [stops, poolLocations, showPool, map]);
  return null;
}

// ─── Main Component ───────────────────────────────────────────────

// Denver-area cluster for driver pre-assigned route (geographically close stops)
const DRIVER_ROUTE_IDS = ['loc-03', 'loc-14', 'loc-15', 'loc-21', 'loc-23', 'loc-39', 'loc-38'];

function getDriverPreloadedStops(): RouteStop[] {
  const depot: RouteStop = { ...DEPOT };
  const stops = DRIVER_ROUTE_IDS
    .map((id) => SERVICE_LOCATIONS.find((loc) => loc.id === id))
    .filter((loc): loc is ServiceLocation => loc != null)
    .map((loc) => ({ ...loc } as RouteStop));
  return [depot, ...stops];
}

export function RoutePlanning() {
  const { user } = useAuth();
  const isDriver = user?.role === 'driver';

  // Route state — starts with just the depot (or pre-loaded for drivers)
  const [routeStops, setRouteStops] = useState<RouteStop[]>(() =>
    isDriver ? getDriverPreloadedStops() : [{ ...DEPOT }]
  );
  const [completedStops, setCompletedStops] = useState<Set<string>>(new Set());
  const [optimized, setOptimized] = useState(false);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);
  const [legTraffic, setLegTraffic] = useState<('low' | 'moderate' | 'heavy')[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);

  // Pool state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ServiceLocation['type'] | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  // Which locations are already in the route?
  const routeIds = new Set(routeStops.map((s) => s.id));

  // Filter pool locations
  const filteredPool = SERVICE_LOCATIONS.filter((loc) => {
    if (routeIds.has(loc.id)) return false;
    if (typeFilter !== 'all' && loc.type !== typeFilter) return false;
    if (priorityFilter !== 'all' && loc.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return loc.name.toLowerCase().includes(q) || loc.address.toLowerCase().includes(q);
    }
    return true;
  });

  // Route stats
  const totalRouteDist = routeStops.reduce((sum, s) => sum + (s.legDistance || 0), 0);
  const totalRouteDuration = routeStops.reduce((sum, s) => sum + (s.legDuration || 0), 0);
  const stopsCount = routeStops.length - 1; // exclude depot

  // Fallback: haversine total if no OSRM data
  const haversineDist = (() => {
    let d = 0;
    for (let i = 1; i < routeStops.length; i++) {
      d += haversineDistance(routeStops[i - 1].lat, routeStops[i - 1].lng, routeStops[i].lat, routeStops[i].lng);
    }
    return d;
  })();

  const displayDist = totalRouteDist > 0 ? (totalRouteDist / 1609.34) : haversineDist;
  const displayTime = totalRouteDuration > 0 ? Math.round(totalRouteDuration / 60) : Math.round((haversineDist / 30) * 60);

  // Fetch OSRM route whenever stops change
  useEffect(() => {
    if (routeStops.length < 2) {
      setRouteGeometry(null);
      setLegTraffic([]);
      return;
    }

    let cancelled = false;
    setRouteLoading(true);

    fetchOSRMRoute(routeStops).then((result) => {
      if (cancelled) return;
      setRouteLoading(false);

      if (result) {
        // Real road geometry
        setRouteGeometry(result.geometry.coordinates.map(([lng, lat]) => [lat, lng]));

        // Update stops with leg data
        const traffic: ('low' | 'moderate' | 'heavy')[] = [];
        setRouteStops((prev) => {
          const updated = prev.map((stop, idx) => {
            if (idx === 0) return { ...stop, legDistance: 0, legDuration: 0 };
            const leg = result.legs[idx - 1];
            const t = simulateTraffic();
            traffic.push(t);
            return {
              ...stop,
              legDistance: leg?.distance || 0,
              legDuration: leg?.duration || 0,
              trafficLevel: t,
            };
          });
          return updated;
        });
        setLegTraffic(traffic);
      } else {
        // Fallback: straight lines
        setRouteGeometry(routeStops.map((s) => [s.lat, s.lng]));
        setLegTraffic([]);
      }
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeStops.map((s) => s.id).join(',')]);

  // ─── Handlers ─────────────────────────────────────────────────

  const addToRoute = useCallback((loc: ServiceLocation) => {
    if (routeStops.length >= MAX_ROUTE_STOPS + 1) return; // +1 for depot
    setRouteStops((prev) => [...prev, { ...loc }]);
    setOptimized(false);
  }, [routeStops.length]);

  const removeFromRoute = useCallback((id: string) => {
    if (id === 'depot') return;
    setRouteStops((prev) => prev.filter((s) => s.id !== id));
    setOptimized(false);
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    if (idx === 0) return; // can't drag depot
    setDragIndex(idx);
    dragNode.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      if (dragNode.current) dragNode.current.style.opacity = '0.4';
    }, 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (idx === 0) return; // can't drop on depot
    e.dataTransfer.dropEffect = 'move';
    setOverIndex(idx);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIdx: number) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === dropIdx || dropIdx === 0) return;
      const newStops = [...routeStops];
      const [moved] = newStops.splice(dragIndex, 1);
      newStops.splice(dropIdx, 0, moved);
      setRouteStops(newStops);
      setOptimized(false);
    },
    [dragIndex, routeStops],
  );

  const handleDragEnd = useCallback(() => {
    if (dragNode.current) dragNode.current.style.opacity = '1';
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  const handleOptimize = () => {
    setRouteStops(nearestNeighborOptimize(routeStops));
    setOptimized(true);
  };

  const handleClearRoute = () => {
    setRouteStops([{ ...DEPOT }]);
    setOptimized(false);
    setRouteGeometry(null);
    setLegTraffic([]);
  };

  // Build segmented polylines for traffic coloring
  const trafficSegments: { positions: [number, number][]; color: string }[] = [];
  if (routeGeometry && routeGeometry.length > 1 && legTraffic.length > 0) {
    // Split the geometry proportionally across legs
    const numLegs = legTraffic.length;
    const pointsPerLeg = Math.max(2, Math.floor(routeGeometry.length / numLegs));

    for (let i = 0; i < numLegs; i++) {
      const start = i * pointsPerLeg;
      const end = i === numLegs - 1 ? routeGeometry.length : (i + 1) * pointsPerLeg + 1;
      const segment = routeGeometry.slice(start, Math.min(end, routeGeometry.length));
      if (segment.length >= 2) {
        trafficSegments.push({
          positions: segment,
          color: TRAFFIC_COLORS[legTraffic[i]],
        });
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-secondary-500">Route Planning</h2>
          <p className="text-sm text-gray-500">
            {isDriver
              ? 'Your assigned route for today'
              : `Build today\u0027s route from your ${SERVICE_LOCATIONS.length} service locations (max ${MAX_ROUTE_STOPS} stops)`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isDriver && (
            <button
              onClick={handleClearRoute}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Clear Route
            </button>
          )}
          <button
            onClick={handleOptimize}
            disabled={routeStops.length < 3}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            Optimize Route
          </button>
        </div>
      </div>

      {/* Route Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Stops</span>
          </div>
          <p className="text-2xl font-bold text-secondary-500">
            {stopsCount}
            <span className="text-sm font-normal text-gray-400">/{MAX_ROUTE_STOPS}</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Truck className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Distance</span>
          </div>
          <p className="text-2xl font-bold text-secondary-500">
            {displayDist.toFixed(1)} mi
          </p>
          {totalRouteDist > 0 && (
            <p className="text-xs text-gray-400">via roads (OSRM)</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Drive Time</span>
          </div>
          <p className="text-2xl font-bold text-secondary-500">
            {displayTime >= 60 ? `${Math.floor(displayTime / 60)}h ${displayTime % 60}m` : `${displayTime}m`}
          </p>
          {routeLoading && <p className="text-xs text-primary-500">Calculating...</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Traffic</span>
          </div>
          {legTraffic.length > 0 ? (
            <div className="flex items-center gap-2 mt-1">
              {(['low', 'moderate', 'heavy'] as const).map((level) => {
                const count = legTraffic.filter((t) => t === level).length;
                if (count === 0) return null;
                return (
                  <span key={level} className="flex items-center gap-1 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ background: TRAFFIC_COLORS[level] }} />
                    {count}
                  </span>
                );
              })}
              <span className="text-xs text-gray-400 ml-1">(simulated)</span>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mt-1">No route yet</p>
          )}
        </div>
      </div>

      {optimized && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <Zap className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700">
            <strong>Route optimized!</strong> Nearest-neighbor algorithm from depot. Drag stops to fine-tune.
          </p>
        </div>
      )}

      {/* Main Layout: Map + Route + Pool */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map (spans 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ minHeight: 550 }}>
          <MapContainer
            center={[39.7392, -104.9903]}
            zoom={9}
            style={{ height: '100%', width: '100%', minHeight: 550 }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds stops={routeStops} poolLocations={filteredPool} showPool={stopsCount === 0} />

            {/* Traffic-colored route segments */}
            {trafficSegments.length > 0
              ? trafficSegments.map((seg, idx) => (
                  <Polyline
                    key={`seg-${idx}`}
                    positions={seg.positions}
                    pathOptions={{ color: seg.color, weight: 4, opacity: 0.9 }}
                  />
                ))
              : routeGeometry && (
                  <Polyline
                    positions={routeGeometry}
                    pathOptions={{ color: '#f89020', weight: 3, opacity: 0.8, dashArray: '8, 6' }}
                  />
                )
            }

            {/* Pool location dots (unselected) */}
            {filteredPool.map((loc) => (
              <Marker
                key={loc.id}
                position={[loc.lat, loc.lng]}
                icon={createPoolIcon(loc.type)}
              >
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <strong>{loc.name}</strong>
                    <br />
                    <span style={{ fontSize: 11, color: '#666' }}>{loc.address}</span>
                    <br />
                    <span style={{ fontSize: 11 }}>
                      {loc.units} unit{loc.units !== 1 ? 's' : ''} &middot; {TYPE_LABELS[loc.type]} &middot; Last: {loc.lastService}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Route stop markers */}
            {routeStops.map((stop, idx) => (
              <Marker
                key={stop.id}
                position={[stop.lat, stop.lng]}
                icon={createNumberedIcon(idx, idx === 0)}
              >
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <strong>{idx === 0 ? 'Depot' : `Stop ${idx}`}: {stop.name}</strong>
                    <br />
                    <span style={{ fontSize: 11, color: '#666' }}>{stop.address}</span>
                    {stop.legDistance != null && stop.legDistance > 0 && (
                      <>
                        <br />
                        <span style={{ fontSize: 11, color: '#f89020', fontWeight: 600 }}>
                          {(stop.legDistance / 1609.34).toFixed(1)} mi &middot;{' '}
                          {Math.round((stop.legDuration || 0) / 60)} min from prev
                        </span>
                        {stop.trafficLevel && (
                          <>
                            <br />
                            <span style={{
                              fontSize: 11,
                              color: TRAFFIC_COLORS[stop.trafficLevel],
                              fontWeight: 600,
                            }}>
                              Traffic: {stop.trafficLevel}
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Right Panel: Route Stops + Service Pool */}
        <div className="space-y-4 flex flex-col" style={{ maxHeight: 550, minHeight: 550 }}>
          {/* Today's Route */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col" style={{ flex: isDriver ? '1 1 100%' : '1 1 50%', minHeight: 0 }}>
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2 flex-shrink-0">
              <Navigation className="w-4 h-4 text-primary-500" />
              <h3 className="text-sm font-bold text-secondary-500 uppercase">Today&apos;s Route</h3>
              <span className="text-xs text-gray-400 ml-auto">{stopsCount} stop{stopsCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
              {routeStops.map((stop, idx) => (
                <div
                  key={stop.id}
                  draggable={idx !== 0}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 px-3 py-2 transition-colors ${
                    idx === 0 ? 'bg-secondary-50' : ''
                  } ${
                    overIndex === idx && dragIndex !== idx && idx !== 0
                      ? 'bg-primary-50 border-l-4 border-l-primary-500'
                      : idx !== 0 ? 'hover:bg-gray-50 cursor-grab active:cursor-grabbing' : ''
                  }`}
                >
                  {idx !== 0 && <GripVertical className="w-3 h-3 text-gray-300 flex-shrink-0" />}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      idx === 0
                        ? 'bg-secondary-500 text-white'
                        : 'bg-primary-100 text-primary-700'
                    }`}
                  >
                    {idx === 0 ? <MapPin className="w-3 h-3" /> : idx}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-semibold text-secondary-500 truncate">{stop.name}</p>
                      {completedStops.has(stop.id) && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          <CheckCircle className="w-2.5 h-2.5" /> Done
                        </span>
                      )}
                    </div>
                    {idx > 0 && stop.legDistance != null && stop.legDistance > 0 && (
                      <p className="text-[10px] text-gray-400">
                        {(stop.legDistance / 1609.34).toFixed(1)} mi &middot; {Math.round((stop.legDuration || 0) / 60)} min
                        {stop.trafficLevel && (
                          <span style={{ color: TRAFFIC_COLORS[stop.trafficLevel] }}>
                            {' '}&middot; {stop.trafficLevel}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  {idx !== 0 && isDriver && (
                    <button
                      onClick={() => setCompletedStops((prev) => {
                        const next = new Set(prev);
                        if (next.has(stop.id)) next.delete(stop.id);
                        else next.add(stop.id);
                        return next;
                      })}
                      className={`p-1 transition-colors flex-shrink-0 ${
                        completedStops.has(stop.id)
                          ? 'text-green-500'
                          : 'text-gray-300 hover:text-green-500'
                      }`}
                      title={completedStops.has(stop.id) ? 'Completed' : 'Mark Complete'}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {idx !== 0 && !isDriver && (
                    <button
                      onClick={() => removeFromRoute(stop.id)}
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {stopsCount === 0 && (
                <div className="px-4 py-6 text-center text-xs text-gray-400">
                  <MapPin className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                  Add stops from the service pool below
                </div>
              )}
            </div>
          </div>

          {/* Service Location Pool (admin/manager only) */}
          {!isDriver && <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col" style={{ flex: '1 1 50%', minHeight: 0 }}>
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-bold text-secondary-500 uppercase">Service Locations</h3>
                <span className="text-xs text-gray-400 ml-auto">{filteredPool.length} available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-1.5 border rounded-lg transition-colors ${showFilters ? 'bg-primary-50 border-primary-300 text-primary-600' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                >
                  <Filter className="w-3.5 h-3.5" />
                </button>
              </div>
              {showFilters && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {(['all', 'construction', 'event', 'park', 'commercial', 'residential', 'municipal', 'industrial'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`px-2 py-0.5 text-[10px] font-medium rounded-full transition-colors ${
                        typeFilter === t
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t === 'all' ? 'All Types' : TYPE_LABELS[t]}
                    </button>
                  ))}
                  <span className="w-px bg-gray-200 mx-1" />
                  {(['all', 'high', 'medium', 'low'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriorityFilter(p)}
                      className={`px-2 py-0.5 text-[10px] font-medium rounded-full transition-colors ${
                        priorityFilter === p
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {p === 'all' ? 'All Priority' : p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
              {filteredPool.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-secondary-500 truncate">{loc.name}</p>
                      <span className={`text-[9px] font-bold ${PRIORITY_COLORS[loc.priority]}`}>
                        {loc.priority === 'high' ? '!!!' : loc.priority === 'medium' ? '!!' : '!'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[9px] px-1.5 py-0 rounded-full font-medium ${TYPE_COLORS[loc.type]}`}>
                        {TYPE_LABELS[loc.type]}
                      </span>
                      <span className="text-[10px] text-gray-400">{loc.units} units</span>
                      <span className="text-[10px] text-gray-400">&middot; {loc.lastService}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => addToRoute(loc)}
                    disabled={routeStops.length >= MAX_ROUTE_STOPS + 1}
                    className="p-1 text-gray-300 hover:text-primary-500 group-hover:text-primary-400 transition-colors disabled:opacity-30 flex-shrink-0"
                    title="Add to route"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {filteredPool.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-gray-400">
                  {searchQuery || typeFilter !== 'all' || priorityFilter !== 'all'
                    ? 'No matching locations'
                    : 'All locations are on the route'}
                </div>
              )}
            </div>
          </div>}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-gray-500">
        <span className="font-semibold text-gray-600">Traffic:</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1 rounded" style={{ background: TRAFFIC_COLORS.low }} /> Low</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1 rounded" style={{ background: TRAFFIC_COLORS.moderate }} /> Moderate</span>
        <span className="flex items-center gap-1"><span className="w-3 h-1 rounded" style={{ background: TRAFFIC_COLORS.heavy }} /> Heavy</span>
        <span className="text-gray-400 ml-2">(Traffic data is simulated)</span>
        <span className="ml-auto text-gray-400">Route powered by OSRM (real road routing)</span>
      </div>
    </div>
  );
}
