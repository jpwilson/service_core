import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { useAuth } from './auth/AuthContext';
import TimeClock from './components/time-clock/TimeClock';
import { Overview } from './components/dashboard/Overview';
import { Analytics } from './components/dashboard/Analytics';
import { TimesheetApprovals } from './components/dashboard/TimesheetApprovals';
import { EmployeeDetail } from './components/dashboard/EmployeeDetail';
import { Settings } from './components/dashboard/Settings';
import { Import } from './components/dashboard/Import';
import { RoutePlanning } from './components/dashboard/RoutePlanning';
import { Scheduling } from './components/dashboard/Scheduling';
import { Customers } from './components/dashboard/Customers';
import { Equipment } from './components/dashboard/Equipment';
import { Invoices } from './components/dashboard/Invoices';
import { QuickBooksExport } from './components/dashboard/QuickBooksExport';
import { AuditLog } from './components/dashboard/AuditLog';
import { DateRangePicker } from './components/shared/DateRangePicker';
import { NotificationPanel } from './components/shared/NotificationPanel';
import {
  LayoutDashboard,
  Clock,
  BarChart3,
  FileCheck,
  Settings as SettingsIcon,
  Upload,
  Wrench,
  LogOut,
  Shield,
  Route,
  CalendarDays,
  Users,
  Container,
  Receipt,
  FileOutput,
  ScrollText,
} from 'lucide-react';

type DashboardTab = 'overview' | 'hours' | 'attendance' | 'labor-cost' | 'projects' | 'employees' | 'import' | 'approvals' | 'settings' | 'routes' | 'scheduling' | 'customers' | 'equipment' | 'invoices' | 'quickbooks' | 'audit' | 'timeclock';

type SidebarItem = {
  id: DashboardTab;
  label: string;
  icon: typeof Clock;
};

// Define which sidebar items each role can see
const ALL_SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'timeclock', label: 'Time Clock', icon: Clock },
  { id: 'scheduling', label: 'Scheduling', icon: CalendarDays },
  { id: 'routes', label: 'Route Planning', icon: Route },
  { id: 'hours', label: 'Analytics', icon: BarChart3 },
  { id: 'approvals', label: 'Approvals', icon: FileCheck },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'equipment', label: 'Equipment', icon: Container },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'import', label: 'Import', icon: Upload },
  { id: 'quickbooks', label: 'Accounting', icon: FileOutput },
  { id: 'audit', label: 'Audit Log', icon: ScrollText },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

// Driver sees a focused set of tabs
const DRIVER_TABS = new Set(['timeclock', 'scheduling', 'routes', 'equipment']);

function getSidebarItems(role: string): SidebarItem[] {
  if (role === 'driver') {
    return ALL_SIDEBAR_ITEMS.filter((item) => DRIVER_TABS.has(item.id));
  }
  // admin and manager see everything
  return ALL_SIDEBAR_ITEMS;
}

function getDefaultTab(role: string): DashboardTab {
  return role === 'driver' ? 'timeclock' : 'overview';
}

function getHeaderTitle(tab: string, role: string): string {
  if (role === 'driver') {
    switch (tab) {
      case 'timeclock': return 'Time Clock';
      case 'scheduling': return 'My Schedule';
      case 'routes': return 'Route Planning';
      case 'equipment': return 'Equipment';
      default: return 'ServiceCore';
    }
  }
  switch (tab) {
    case 'overview': return 'Operations Dashboard';
    case 'timeclock': return 'Time Clock';
    case 'hours':
    case 'attendance':
    case 'labor-cost':
    case 'projects':
    case 'employees': return 'Analytics';
    case 'approvals': return 'Timesheet Approvals';
    case 'scheduling': return 'Crew Scheduling';
    case 'routes': return 'Route Planning';
    case 'customers': return 'Customer Management';
    case 'equipment': return 'Equipment Tracking';
    case 'invoices': return 'Invoicing';
    case 'import': return 'Data Import';
    case 'quickbooks': return 'Accounting Export';
    case 'audit': return 'Audit Log';
    case 'settings': return 'Settings';
    default: return 'Operations Dashboard';
  }
}

function App() {
  const {
    dashboardTab,
    setDashboardTab,
    selectedEmployeeId,
    setSelectedEmployeeId,
    dateRange,
    setDateRange,
  } = useAppStore();

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Set default tab based on role on mount
  useEffect(() => {
    if (user) {
      const defaultTab = getDefaultTab(user.role);
      setDashboardTab(defaultTab);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = user?.role || 'admin';
  const sidebarItems = getSidebarItems(role);

  const renderContent = () => {
    if (selectedEmployeeId) {
      return (
        <EmployeeDetail
          employeeId={selectedEmployeeId}
          onClose={() => setSelectedEmployeeId(null)}
        />
      );
    }

    switch (dashboardTab) {
      case 'timeclock':
        return <TimeClock embedded />;
      case 'overview':
        return <Overview />;
      case 'hours':
      case 'attendance':
      case 'labor-cost':
      case 'projects':
      case 'employees':
        return <Analytics />;
      case 'approvals':
        return <TimesheetApprovals />;
      case 'scheduling':
        return <Scheduling />;
      case 'import':
        return <Import />;
      case 'routes':
        return <RoutePlanning />;
      case 'customers':
        return <Customers />;
      case 'equipment':
        return <Equipment />;
      case 'invoices':
        return <Invoices />;
      case 'quickbooks':
        return <QuickBooksExport />;
      case 'audit':
        return <AuditLog />;
      case 'settings':
        return <Settings />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-display">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-secondary-500 text-white">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <Wrench className="w-7 h-7 text-primary-500" style={{ transform: 'rotate(-90deg)' }} />
          <h1 className="text-xl font-bold tracking-tight">ServiceCore</h1>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive =
              dashboardTab === item.id ||
              (item.id === 'hours' &&
                ['hours', 'attendance', 'labor-cost', 'projects', 'employees'].includes(dashboardTab));
            return (
              <button
                key={item.id}
                onClick={() => setDashboardTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}

          {/* Project Details Link — admin/manager only */}
          {role !== 'driver' && (
            <button
              onClick={() => navigate('/project-details')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Shield className="w-4 h-4" />
              Project Details
            </button>
          )}
        </nav>

        {/* User Info */}
        {user && (
          <div className="px-3 py-3 border-t border-white/10">
            <div className="flex items-center gap-3 px-4 mb-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: user.avatar }}
              >
                {user.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{user.name}</div>
                <div className="text-xs text-white/50 truncate">
                  {role === 'driver' ? 'Driver' : role === 'manager' ? 'Manager' : 'Administrator'}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-white/40 hover:bg-white/5 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="lg:hidden flex items-center gap-2">
              <Wrench className="w-6 h-6 text-primary-500" style={{ transform: 'rotate(-90deg)' }} />
              <span className="font-bold text-secondary-500">ServiceCore</span>
            </div>
            <h2 className="hidden lg:block text-lg font-semibold text-secondary-500">
              {getHeaderTitle(dashboardTab, role)}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {role !== 'driver' && !['timeclock', 'routes', 'customers', 'equipment', 'settings', 'scheduling'].includes(dashboardTab) && (
              <div className="hidden md:block">
                <DateRangePicker value={dateRange} onChange={setDateRange} />
              </div>
            )}
            <NotificationPanel />
            {/* Mobile user avatar */}
            {user && (
              <button
                onClick={handleLogout}
                className="lg:hidden"
                title="Sign out"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: user.avatar }}
                >
                  {user.name.split(' ').map((n) => n[0]).join('')}
                </div>
              </button>
            )}
          </div>
        </header>

        {/* Mobile nav */}
        <div className="lg:hidden flex border-b border-gray-200 bg-white px-2 overflow-x-auto">
          {sidebarItems.slice(0, 6).map((item) => {
            const isActive =
              dashboardTab === item.id ||
              (item.id === 'hours' &&
                ['hours', 'attendance', 'labor-cost', 'projects', 'employees'].includes(dashboardTab));
            return (
              <button
                key={item.id}
                onClick={() => setDashboardTab(item.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {renderContent()}
        </main>
      </div>

    </div>
  );
}

export default App;
