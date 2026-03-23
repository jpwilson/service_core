import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Truck,
  CheckCircle,
  AlertTriangle,
  Package,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

type EquipmentStatus = 'deployed' | 'available' | 'maintenance' | 'retired';
type EquipmentType = 'Standard Unit' | 'Deluxe Unit' | 'Hand Wash Station' | 'ADA Unit' | 'Restroom Trailer' | 'Holding Tank';

interface EquipmentItem {
  id: string;
  type: EquipmentType;
  serialNumber: string;
  status: EquipmentStatus;
  currentSite: string;
  lastServiceDate: string;
  nextServiceDue: string;
  condition: number;
  assignedTo: string | null; // employee ID of assigned driver
}

// Seeded random for deterministic generation
function createSeededRandom(s: number) {
  let seed = s;
  return () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const SITES = [
  'I-25 Corridor Project',
  'Union Station Expansion',
  'Ralston Creek Subdivision',
  'Boulder Creek Festival Grounds',
  'Chautauqua Park Amphitheater',
  'City Park Restrooms',
  'Memorial Park Festival Area',
  'Roosevelt Park',
  'Garden of the Gods Visitor Area',
  'Water Treatment Facility',
  'County Fairgrounds',
  'Denver Metro Construction Site',
  'Fort Collins Municipal',
  'Colorado Springs Festival',
  'RiNo Development Phase 3',
  'DIA Terminal Expansion',
  'Arvada Olde Town',
  'Cherry Creek Arts Festival',
  'Red Rocks Concert Area',
  'Coors Field Service Area',
];

const DRIVER_IDS = ['emp-001', 'emp-002', 'emp-003', 'emp-004', 'emp-005', 'emp-006'];

function generateEquipment(): EquipmentItem[] {
  const rand = createSeededRandom(12345);
  const items: EquipmentItem[] = [];

  const specs: { type: EquipmentType; prefix: string; count: number }[] = [
    { type: 'Standard Unit', prefix: 'SC-STD', count: 40 },
    { type: 'Deluxe Unit', prefix: 'SC-DLX', count: 15 },
    { type: 'ADA Unit', prefix: 'SC-ADA', count: 10 },
    { type: 'Hand Wash Station', prefix: 'SC-HWS', count: 8 },
    { type: 'Restroom Trailer', prefix: 'SC-TRL', count: 4 },
    { type: 'Holding Tank', prefix: 'SC-TNK', count: 3 },
  ];

  let idCounter = 1;

  for (const spec of specs) {
    for (let i = 1; i <= spec.count; i++) {
      const r = rand();
      let status: EquipmentStatus;
      if (r < 0.60) status = 'deployed';
      else if (r < 0.85) status = 'available';
      else if (r < 0.95) status = 'maintenance';
      else status = 'retired';

      const condition = status === 'retired'
        ? Math.max(1, Math.floor(rand() * 3))
        : status === 'maintenance'
          ? Math.max(2, Math.floor(rand() * 5) + 1)
          : Math.floor(rand() * 5) + 6; // 6-10 for deployed/available

      const site = status === 'deployed'
        ? SITES[Math.floor(rand() * SITES.length)]
        : 'Yard';

      // Generate service dates
      const dayOffset = Math.floor(rand() * 10);
      const lastServiceDate = `2026-03-${String(Math.max(1, 22 - dayOffset)).padStart(2, '0')}`;

      let nextServiceDue: string;
      if (status === 'retired') {
        nextServiceDue = '-';
      } else {
        const nextDay = 22 + Math.floor(rand() * 21); // up to 3 weeks out
        const nextMonth = nextDay > 31 ? '04' : '03';
        const nextDayStr = nextDay > 31 ? String(nextDay - 31).padStart(2, '0') : String(nextDay).padStart(2, '0');
        nextServiceDue = `2026-${nextMonth}-${nextDayStr}`;
      }

      // Assign deployed units to drivers roughly evenly
      let assignedTo: string | null = null;
      if (status === 'deployed') {
        assignedTo = DRIVER_IDS[Math.floor(rand() * DRIVER_IDS.length)];
      }

      items.push({
        id: `eq-${String(idCounter).padStart(2, '0')}`,
        type: spec.type,
        serialNumber: `${spec.prefix}-${String(i).padStart(3, '0')}`,
        status,
        currentSite: site,
        lastServiceDate,
        nextServiceDue,
        condition,
        assignedTo,
      });
      idCounter++;
    }
  }

  return items;
}

const allEquipment = generateEquipment();

const statusConfig: Record<EquipmentStatus, { label: string; bg: string; text: string }> = {
  deployed: { label: 'Deployed', bg: 'bg-blue-100', text: 'text-blue-700' },
  available: { label: 'Available', bg: 'bg-green-100', text: 'text-green-700' },
  maintenance: { label: 'Maintenance', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  retired: { label: 'Retired', bg: 'bg-gray-100', text: 'text-gray-500' },
};

function conditionColor(value: number): string {
  if (value > 7) return 'bg-green-500';
  if (value >= 4) return 'bg-yellow-500';
  return 'bg-red-500';
}

function formatDate(dateStr: string): string {
  if (dateStr === '-') return '-';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function Equipment() {
  const { user } = useAuth();
  const isDriver = user?.role === 'driver';

  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<EquipmentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // For drivers, only show equipment assigned to them
  const baseEquipment = useMemo(() => {
    if (isDriver && user?.employeeId) {
      return allEquipment.filter((eq) => eq.assignedTo === user.employeeId);
    }
    return allEquipment;
  }, [isDriver, user?.employeeId]);

  const types = useMemo(() => {
    const set = new Set(baseEquipment.map((e) => e.type));
    return Array.from(set).sort();
  }, [baseEquipment]);

  const filtered = useMemo(() => {
    return baseEquipment.filter((eq) => {
      const matchesStatus = statusFilter === 'all' || eq.status === statusFilter;
      const matchesType = typeFilter === 'all' || eq.type === typeFilter;
      const matchesSearch =
        !searchQuery ||
        eq.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.currentSite.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [statusFilter, typeFilter, searchQuery, baseEquipment]);

  const stats = useMemo(() => {
    const total = baseEquipment.length;
    const deployed = baseEquipment.filter((e) => e.status === 'deployed').length;
    const available = baseEquipment.filter((e) => e.status === 'available').length;
    const needsService = baseEquipment.filter(
      (e) => e.status !== 'retired' && e.nextServiceDue !== '-' && e.nextServiceDue <= '2026-03-22'
    ).length;
    return { total, deployed, available, needsService };
  }, [baseEquipment]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-500">
          {isDriver ? 'My Equipment' : 'Equipment'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isDriver
            ? 'Units assigned to your route'
            : 'Track units, trailers, and accessories across all job sites'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Units', value: stats.total, icon: Package, color: 'text-secondary-500 bg-gray-100' },
          { label: 'Deployed', value: stats.deployed, icon: Truck, color: 'text-blue-600 bg-blue-50' },
          { label: 'Available', value: stats.available, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Needs Service', value: stats.needsService, icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-50' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                <p className="text-xl font-bold text-secondary-500">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by serial#, type, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | 'all')}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="deployed">Deployed</option>
            <option value="available">Available</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as EquipmentType | 'all')}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-secondary-500">Serial #</th>
                <th className="text-left px-4 py-3 font-semibold text-secondary-500">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-secondary-500">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-secondary-500">Location</th>
                <th className="text-left px-4 py-3 font-semibold text-secondary-500 w-32">Condition</th>
                <th className="text-left px-4 py-3 font-semibold text-secondary-500">Next Service</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((eq) => {
                const sc = statusConfig[eq.status];
                const isOverdue = eq.nextServiceDue !== '-' && eq.nextServiceDue <= '2026-03-22' && eq.status !== 'retired';
                return (
                  <tr key={eq.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-secondary-500">{eq.serialNumber}</td>
                    <td className="px-4 py-3 text-gray-700">{eq.type}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {eq.currentSite}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${conditionColor(eq.condition)}`}
                            style={{ width: `${eq.condition * 10}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-5 text-right">{eq.condition}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                          {formatDate(eq.nextServiceDue)}
                          {isOverdue && (
                            <span className="ml-1 text-xs text-red-500">(due)</span>
                          )}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-2" />
            <p>No equipment matches your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
