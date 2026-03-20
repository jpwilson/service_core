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

type EquipmentStatus = 'deployed' | 'available' | 'maintenance' | 'retired';
type EquipmentType = 'Standard Unit' | 'Deluxe Unit' | 'Hand Wash Station' | 'ADA Unit' | 'Trailer (8-unit)' | 'Holding Tank';

interface EquipmentItem {
  id: string;
  type: EquipmentType;
  serialNumber: string;
  status: EquipmentStatus;
  currentSite: string;
  lastServiceDate: string;
  nextServiceDue: string;
  condition: number;
}

const mockEquipment: EquipmentItem[] = [
  { id: 'eq-01', type: 'Standard Unit', serialNumber: 'SC-STD-001', status: 'deployed', currentSite: 'I-25 Corridor Project', lastServiceDate: '2026-03-18', nextServiceDue: '2026-03-25', condition: 8 },
  { id: 'eq-02', type: 'Standard Unit', serialNumber: 'SC-STD-002', status: 'deployed', currentSite: 'Union Station Expansion', lastServiceDate: '2026-03-17', nextServiceDue: '2026-03-24', condition: 7 },
  { id: 'eq-03', type: 'Standard Unit', serialNumber: 'SC-STD-003', status: 'available', currentSite: 'Yard', lastServiceDate: '2026-03-15', nextServiceDue: '2026-04-15', condition: 9 },
  { id: 'eq-04', type: 'Standard Unit', serialNumber: 'SC-STD-004', status: 'maintenance', currentSite: 'Yard', lastServiceDate: '2026-03-10', nextServiceDue: '2026-03-20', condition: 3 },
  { id: 'eq-05', type: 'Standard Unit', serialNumber: 'SC-STD-005', status: 'deployed', currentSite: 'Ralston Creek Subdivision', lastServiceDate: '2026-03-16', nextServiceDue: '2026-03-23', condition: 6 },
  { id: 'eq-06', type: 'Deluxe Unit', serialNumber: 'SC-DLX-001', status: 'deployed', currentSite: 'Boulder Creek Festival Grounds', lastServiceDate: '2026-03-15', nextServiceDue: '2026-03-22', condition: 8 },
  { id: 'eq-07', type: 'Deluxe Unit', serialNumber: 'SC-DLX-002', status: 'available', currentSite: 'Yard', lastServiceDate: '2026-03-12', nextServiceDue: '2026-04-12', condition: 9 },
  { id: 'eq-08', type: 'Deluxe Unit', serialNumber: 'SC-DLX-003', status: 'deployed', currentSite: 'Chautauqua Park Amphitheater', lastServiceDate: '2026-03-18', nextServiceDue: '2026-03-25', condition: 7 },
  { id: 'eq-09', type: 'Hand Wash Station', serialNumber: 'SC-HWS-001', status: 'deployed', currentSite: 'City Park Restrooms', lastServiceDate: '2026-03-19', nextServiceDue: '2026-03-26', condition: 8 },
  { id: 'eq-10', type: 'Hand Wash Station', serialNumber: 'SC-HWS-002', status: 'available', currentSite: 'Yard', lastServiceDate: '2026-03-14', nextServiceDue: '2026-04-14', condition: 10 },
  { id: 'eq-11', type: 'Hand Wash Station', serialNumber: 'SC-HWS-003', status: 'maintenance', currentSite: 'Yard', lastServiceDate: '2026-03-08', nextServiceDue: '2026-03-20', condition: 2 },
  { id: 'eq-12', type: 'ADA Unit', serialNumber: 'SC-ADA-001', status: 'deployed', currentSite: 'Memorial Park Festival Area', lastServiceDate: '2026-03-17', nextServiceDue: '2026-03-24', condition: 7 },
  { id: 'eq-13', type: 'ADA Unit', serialNumber: 'SC-ADA-002', status: 'deployed', currentSite: 'Roosevelt Park', lastServiceDate: '2026-03-19', nextServiceDue: '2026-03-26', condition: 9 },
  { id: 'eq-14', type: 'ADA Unit', serialNumber: 'SC-ADA-003', status: 'retired', currentSite: 'Yard', lastServiceDate: '2026-01-15', nextServiceDue: '-', condition: 1 },
  { id: 'eq-15', type: 'Trailer (8-unit)', serialNumber: 'SC-TRL-001', status: 'deployed', currentSite: 'Garden of the Gods Visitor Area', lastServiceDate: '2026-03-16', nextServiceDue: '2026-03-23', condition: 6 },
  { id: 'eq-16', type: 'Trailer (8-unit)', serialNumber: 'SC-TRL-002', status: 'available', currentSite: 'Yard', lastServiceDate: '2026-03-10', nextServiceDue: '2026-04-10', condition: 8 },
  { id: 'eq-17', type: 'Holding Tank', serialNumber: 'SC-HLD-001', status: 'deployed', currentSite: 'Water Treatment Facility', lastServiceDate: '2026-03-18', nextServiceDue: '2026-03-25', condition: 5 },
  { id: 'eq-18', type: 'Holding Tank', serialNumber: 'SC-HLD-002', status: 'deployed', currentSite: 'County Fairgrounds', lastServiceDate: '2026-03-14', nextServiceDue: '2026-03-21', condition: 7 },
  { id: 'eq-19', type: 'Standard Unit', serialNumber: 'SC-STD-006', status: 'retired', currentSite: 'Yard', lastServiceDate: '2025-12-01', nextServiceDue: '-', condition: 1 },
  { id: 'eq-20', type: 'Standard Unit', serialNumber: 'SC-STD-007', status: 'available', currentSite: 'Yard', lastServiceDate: '2026-03-13', nextServiceDue: '2026-04-13', condition: 8 },
];

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
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<EquipmentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const types = useMemo(() => {
    const set = new Set(mockEquipment.map((e) => e.type));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    return mockEquipment.filter((eq) => {
      const matchesStatus = statusFilter === 'all' || eq.status === statusFilter;
      const matchesType = typeFilter === 'all' || eq.type === typeFilter;
      const matchesSearch =
        !searchQuery ||
        eq.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.currentSite.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [statusFilter, typeFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = mockEquipment.length;
    const deployed = mockEquipment.filter((e) => e.status === 'deployed').length;
    const available = mockEquipment.filter((e) => e.status === 'available').length;
    const needsService = mockEquipment.filter(
      (e) => e.status !== 'retired' && e.nextServiceDue !== '-' && e.nextServiceDue <= '2026-03-20'
    ).length;
    return { total, deployed, available, needsService };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-500">Equipment</h1>
        <p className="text-sm text-gray-500 mt-1">Track units, trailers, and accessories across all job sites</p>
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
                const isOverdue = eq.nextServiceDue !== '-' && eq.nextServiceDue <= '2026-03-20' && eq.status !== 'retired';
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
