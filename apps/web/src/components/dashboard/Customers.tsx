import { useState, useMemo } from 'react';
import {
  Search,
  Users,
  MapPin,
  DollarSign,
  AlertCircle,
  Plus,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  Filter,
} from 'lucide-react';

interface ServiceHistoryEntry {
  date: string;
  serviceType: string;
  amount: number;
}

interface JobSite {
  name: string;
  address: string;
  unitsDeployed: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  activeJobSites: number;
  totalBilled: number;
  outstandingBalance: number;
  status: 'active' | 'inactive';
  lastServiceDate: string;
  serviceHistory: ServiceHistoryEntry[];
  jobSites: JobSite[];
}

const mockCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: 'Metro Denver Construction Co',
    email: 'ops@metrodenver.com',
    phone: '(303) 555-0142',
    address: '1200 Blake St, Denver, CO 80202',
    activeJobSites: 5,
    totalBilled: 48750.00,
    outstandingBalance: 3200.00,
    status: 'active',
    lastServiceDate: '2026-03-18',
    serviceHistory: [
      { date: '2026-03-18', serviceType: 'Weekly Service — 12 Units', amount: 2400.00 },
      { date: '2026-03-11', serviceType: 'Weekly Service — 12 Units', amount: 2400.00 },
      { date: '2026-03-04', serviceType: 'Delivery — 3 Standard Units', amount: 750.00 },
      { date: '2026-02-25', serviceType: 'Weekly Service — 9 Units', amount: 1800.00 },
      { date: '2026-02-18', serviceType: 'Pickup — 2 Units', amount: 300.00 },
    ],
    jobSites: [
      { name: 'I-25 Corridor Project', address: '4500 I-25, Denver, CO', unitsDeployed: 4 },
      { name: 'Union Station Expansion', address: '1701 Wynkoop St, Denver, CO', unitsDeployed: 3 },
      { name: 'RiNo Development Phase 2', address: '3600 Brighton Blvd, Denver, CO', unitsDeployed: 2 },
      { name: 'Stapleton Residential Lot 9', address: '8200 E 49th Ave, Denver, CO', unitsDeployed: 2 },
      { name: 'Sloan\'s Lake Tower', address: '1600 Raleigh St, Denver, CO', unitsDeployed: 1 },
    ],
  },
  {
    id: 'cust-002',
    name: 'Boulder Events LLC',
    email: 'events@boulderevents.co',
    phone: '(303) 555-0278',
    address: '2020 Pearl St, Boulder, CO 80302',
    activeJobSites: 3,
    totalBilled: 22400.00,
    outstandingBalance: 0,
    status: 'active',
    lastServiceDate: '2026-03-15',
    serviceHistory: [
      { date: '2026-03-15', serviceType: 'Event Setup — 8 Deluxe Units', amount: 3200.00 },
      { date: '2026-03-08', serviceType: 'Event Pickup — 8 Deluxe Units', amount: 800.00 },
      { date: '2026-02-28', serviceType: 'Event Setup — 6 Standard Units', amount: 1200.00 },
      { date: '2026-02-20', serviceType: 'Hand Wash Delivery — 4 Stations', amount: 600.00 },
      { date: '2026-02-14', serviceType: 'Event Setup — 10 Units + ADA', amount: 2800.00 },
    ],
    jobSites: [
      { name: 'Chautauqua Park Amphitheater', address: '900 Baseline Rd, Boulder, CO', unitsDeployed: 4 },
      { name: 'Boulder Creek Festival Grounds', address: '1200 Canyon Blvd, Boulder, CO', unitsDeployed: 6 },
      { name: 'CU Event Center Lot', address: '950 Regent Dr, Boulder, CO', unitsDeployed: 3 },
    ],
  },
  {
    id: 'cust-003',
    name: 'Fort Collins Municipal',
    email: 'facilities@fcgov.com',
    phone: '(970) 555-0391',
    address: '300 Laporte Ave, Fort Collins, CO 80521',
    activeJobSites: 7,
    totalBilled: 61200.00,
    outstandingBalance: 5400.00,
    status: 'active',
    lastServiceDate: '2026-03-19',
    serviceHistory: [
      { date: '2026-03-19', serviceType: 'Weekly Service — 18 Units', amount: 3600.00 },
      { date: '2026-03-12', serviceType: 'Weekly Service — 18 Units', amount: 3600.00 },
      { date: '2026-03-05', serviceType: 'ADA Unit Delivery — 2 Units', amount: 800.00 },
      { date: '2026-02-26', serviceType: 'Weekly Service — 16 Units', amount: 3200.00 },
      { date: '2026-02-19', serviceType: 'Holding Tank Pump-out', amount: 450.00 },
    ],
    jobSites: [
      { name: 'City Park Restrooms', address: '1500 W Oak St, Fort Collins, CO', unitsDeployed: 4 },
      { name: 'Spring Creek Trail', address: '800 E Stuart St, Fort Collins, CO', unitsDeployed: 2 },
      { name: 'Downtown Construction Zone', address: '200 S College Ave, Fort Collins, CO', unitsDeployed: 3 },
      { name: 'Water Treatment Facility', address: '6500 Strauss Cabin Rd, Fort Collins, CO', unitsDeployed: 2 },
      { name: 'Poudre Trail Extension', address: 'N Shields St & Vine Dr, Fort Collins, CO', unitsDeployed: 3 },
      { name: 'Soccer Complex', address: '1200 Fossil Creek Pkwy, Fort Collins, CO', unitsDeployed: 2 },
      { name: 'New Library Site', address: '301 E Olive St, Fort Collins, CO', unitsDeployed: 2 },
    ],
  },
  {
    id: 'cust-004',
    name: 'Colorado Springs Festival Assoc',
    email: 'info@csfestivals.org',
    phone: '(719) 555-0456',
    address: '515 S Cascade Ave, Colorado Springs, CO 80903',
    activeJobSites: 2,
    totalBilled: 18900.00,
    outstandingBalance: 1800.00,
    status: 'active',
    lastServiceDate: '2026-03-10',
    serviceHistory: [
      { date: '2026-03-10', serviceType: 'Event Setup — 15 Mixed Units', amount: 4500.00 },
      { date: '2026-03-02', serviceType: 'Event Pickup — 10 Units', amount: 1000.00 },
      { date: '2026-02-22', serviceType: 'Trailer Delivery — 1 (8-Unit)', amount: 2200.00 },
      { date: '2026-02-15', serviceType: 'Event Setup — 8 Standard Units', amount: 1600.00 },
      { date: '2026-02-08', serviceType: 'Hand Wash Stations — 6', amount: 900.00 },
    ],
    jobSites: [
      { name: 'Memorial Park Festival Area', address: '1605 E Pikes Peak Ave, Colorado Springs, CO', unitsDeployed: 10 },
      { name: 'Garden of the Gods Visitor Area', address: '1805 N 30th St, Colorado Springs, CO', unitsDeployed: 5 },
    ],
  },
  {
    id: 'cust-005',
    name: 'Arvada Residential Dev',
    email: 'office@arvadadev.com',
    phone: '(720) 555-0512',
    address: '7505 Grandview Ave, Arvada, CO 80002',
    activeJobSites: 4,
    totalBilled: 34600.00,
    outstandingBalance: 2100.00,
    status: 'active',
    lastServiceDate: '2026-03-17',
    serviceHistory: [
      { date: '2026-03-17', serviceType: 'Weekly Service — 8 Units', amount: 1600.00 },
      { date: '2026-03-10', serviceType: 'Weekly Service — 8 Units', amount: 1600.00 },
      { date: '2026-03-03', serviceType: 'Delivery — 2 Standard Units', amount: 500.00 },
      { date: '2026-02-24', serviceType: 'Weekly Service — 6 Units', amount: 1200.00 },
      { date: '2026-02-17', serviceType: 'Holding Tank Service', amount: 350.00 },
    ],
    jobSites: [
      { name: 'Ralston Creek Subdivision', address: '6200 Ralston Rd, Arvada, CO', unitsDeployed: 3 },
      { name: 'Olde Town Lofts', address: '5700 Olde Wadsworth Blvd, Arvada, CO', unitsDeployed: 2 },
      { name: 'West Woods Homes Phase 3', address: '8800 W 64th Ave, Arvada, CO', unitsDeployed: 2 },
      { name: 'Arvada Ridge Commercial', address: '7200 W 56th Ave, Arvada, CO', unitsDeployed: 1 },
    ],
  },
  {
    id: 'cust-006',
    name: 'Greeley Agricultural Co-op',
    email: 'admin@greeleyagcoop.com',
    phone: '(970) 555-0634',
    address: '902 7th Ave, Greeley, CO 80631',
    activeJobSites: 2,
    totalBilled: 12800.00,
    outstandingBalance: 0,
    status: 'active',
    lastServiceDate: '2026-03-14',
    serviceHistory: [
      { date: '2026-03-14', serviceType: 'Bi-weekly Service — 6 Units', amount: 1200.00 },
      { date: '2026-02-28', serviceType: 'Bi-weekly Service — 6 Units', amount: 1200.00 },
      { date: '2026-02-14', serviceType: 'Delivery — 4 Standard Units', amount: 1000.00 },
      { date: '2026-01-31', serviceType: 'Bi-weekly Service — 2 Units', amount: 400.00 },
      { date: '2026-01-17', serviceType: 'Initial Setup — 2 Units', amount: 600.00 },
    ],
    jobSites: [
      { name: 'County Fairgrounds', address: '501 N 14th Ave, Greeley, CO', unitsDeployed: 4 },
      { name: 'Harvest Processing Facility', address: '3200 W 10th St, Greeley, CO', unitsDeployed: 2 },
    ],
  },
  {
    id: 'cust-007',
    name: 'Longmont Parks & Rec',
    email: 'parks@longmontco.gov',
    phone: '(303) 555-0789',
    address: '350 Kimbark St, Longmont, CO 80501',
    activeJobSites: 6,
    totalBilled: 41500.00,
    outstandingBalance: 3750.00,
    status: 'active',
    lastServiceDate: '2026-03-19',
    serviceHistory: [
      { date: '2026-03-19', serviceType: 'Weekly Service — 14 Units', amount: 2800.00 },
      { date: '2026-03-12', serviceType: 'Weekly Service — 14 Units', amount: 2800.00 },
      { date: '2026-03-05', serviceType: 'ADA Unit Swap', amount: 400.00 },
      { date: '2026-02-26', serviceType: 'Weekly Service — 12 Units', amount: 2400.00 },
      { date: '2026-02-19', serviceType: 'Delivery — 2 Deluxe Units', amount: 700.00 },
    ],
    jobSites: [
      { name: 'Union Reservoir Park', address: '3800 N County Rd 26, Longmont, CO', unitsDeployed: 3 },
      { name: 'Roosevelt Park', address: '700 Longs Peak Ave, Longmont, CO', unitsDeployed: 2 },
      { name: 'Sandstone Ranch', address: '2200 E County Line Rd, Longmont, CO', unitsDeployed: 3 },
      { name: 'St. Vrain Greenway Trail', address: '600 S Main St, Longmont, CO', unitsDeployed: 2 },
      { name: 'McIntosh Lake', address: '1400 Lashley St, Longmont, CO', unitsDeployed: 2 },
      { name: 'Dry Creek Community Park', address: '1700 Dry Creek Dr, Longmont, CO', unitsDeployed: 2 },
    ],
  },
  {
    id: 'cust-008',
    name: 'Front Range Builders',
    email: 'dispatch@frontrangebuild.com',
    phone: '(303) 555-0845',
    address: '4880 W 29th Ave, Denver, CO 80212',
    activeJobSites: 0,
    totalBilled: 9200.00,
    outstandingBalance: 950.00,
    status: 'inactive',
    lastServiceDate: '2026-01-20',
    serviceHistory: [
      { date: '2026-01-20', serviceType: 'Final Pickup — 4 Units', amount: 400.00 },
      { date: '2026-01-13', serviceType: 'Weekly Service — 4 Units', amount: 800.00 },
      { date: '2026-01-06', serviceType: 'Weekly Service — 4 Units', amount: 800.00 },
      { date: '2025-12-30', serviceType: 'Weekly Service — 4 Units', amount: 800.00 },
      { date: '2025-12-23', serviceType: 'Delivery — 4 Standard Units', amount: 1000.00 },
    ],
    jobSites: [],
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function Customers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return mockCustomers.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      totalCustomers: mockCustomers.length,
      activeSites: mockCustomers.reduce((sum, c) => sum + c.activeJobSites, 0),
      revenueThisMonth: mockCustomers.reduce((sum, c) => {
        const monthRevenue = c.serviceHistory
          .filter((s) => s.date >= '2026-03-01')
          .reduce((a, s) => a + s.amount, 0);
        return sum + monthRevenue;
      }, 0),
      outstandingBalance: mockCustomers.reduce((sum, c) => sum + c.outstandingBalance, 0),
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-secondary-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-500">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your customer accounts and job sites</p>
        </div>
        <button
          onClick={() => showToast('Coming soon')}
          className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active Sites', value: stats.activeSites, icon: MapPin, color: 'text-green-600 bg-green-50' },
          { label: 'Revenue This Month', value: formatCurrency(stats.revenueThisMonth), icon: DollarSign, color: 'text-primary-500 bg-orange-50' },
          { label: 'Outstanding Balance', value: formatCurrency(stats.outstandingBalance), icon: AlertCircle, color: 'text-red-600 bg-red-50' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                <p className="text-lg font-bold text-secondary-500">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search / Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name, email, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((customer) => {
          const isExpanded = expandedId === customer.id;
          return (
            <div
              key={customer.id}
              className="rounded-xl border border-gray-200 bg-white overflow-hidden transition-shadow hover:shadow-md"
            >
              {/* Card Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : customer.id)}
                className="w-full text-left p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-gray-100 shrink-0">
                      <Building2 className="w-5 h-5 text-secondary-500" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-secondary-500 truncate">{customer.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        customer.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {customer.status}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Quick stats row */}
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className="flex items-center gap-1 text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    {customer.activeJobSites} site{customer.activeJobSites !== 1 ? 's' : ''}
                  </span>
                  <span className="text-gray-600">
                    Billed: <span className="font-medium text-secondary-500">{formatCurrency(customer.totalBilled)}</span>
                  </span>
                  {customer.outstandingBalance > 0 && (
                    <span className="text-red-600 font-medium">
                      Owed: {formatCurrency(customer.outstandingBalance)}
                    </span>
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
                  {/* Contact Details */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contact Details</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><span className="font-medium">Address:</span> {customer.address}</p>
                      <p><span className="font-medium">Phone:</span> {customer.phone}</p>
                      <p><span className="font-medium">Email:</span> {customer.email}</p>
                      <p><span className="font-medium">Last Service:</span> {formatDate(customer.lastServiceDate)}</p>
                    </div>
                  </div>

                  {/* Job Sites */}
                  {customer.jobSites.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Job Sites ({customer.jobSites.length})
                      </h4>
                      <div className="space-y-1">
                        {customer.jobSites.map((site) => (
                          <div
                            key={site.name}
                            className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-gray-100"
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-gray-700">{site.name}</span>
                            </div>
                            <span className="text-xs text-gray-500">{site.unitsDeployed} units</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Service History */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent Service History</h4>
                    <div className="space-y-1">
                      {customer.serviceHistory.map((entry, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-gray-100"
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-500 w-24 shrink-0">{formatDate(entry.date)}</span>
                            <span className="text-gray-700">{entry.serviceType}</span>
                          </div>
                          <span className="font-medium text-secondary-500">{formatCurrency(entry.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-2" />
          <p>No customers match your search.</p>
        </div>
      )}
    </div>
  );
}
