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
  ChevronLeft,
  LogOut,
  DollarSign,
  Shield,
  Route,
} from 'lucide-react';

function App() {
  const {
    currentView,
    setCurrentView,
    dashboardTab,
    setDashboardTab,
    selectedEmployeeId,
    setSelectedEmployeeId,
    dateRange,
    setDateRange,
  } = useAppStore();

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (currentView === 'timeclock') {
    return (
      <>
        <Toaster position="top-right" />
        <TimeClock />
      </>
    );
  }

  const sidebarItems = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'hours' as const, label: 'Analytics', icon: BarChart3 },
    { id: 'approvals' as const, label: 'Approvals', icon: FileCheck },
    { id: 'import' as const, label: 'Import', icon: Upload },
    { id: 'routes' as const, label: 'Route Planning', icon: Route },
    { id: 'settings' as const, label: 'Settings', icon: SettingsIcon },
  ];

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
      case 'import':
        return <Import />;
      case 'routes':
        return <RoutePlanning />;
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

        <nav className="flex-1 px-3 py-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive =
              dashboardTab === item.id ||
              (item.id === 'hours' &&
                ['hours', 'attendance', 'labor-cost', 'projects', 'employees'].includes(dashboardTab));
            return (
              <button
                key={item.id}
                onClick={() => setDashboardTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}

          {/* Project Details Link */}
          <button
            onClick={() => navigate('/costs')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Shield className="w-5 h-5" />
            Project Details
          </button>
        </nav>

        <div className="px-3 py-2 border-t border-white/10">
          <button
            onClick={() => setCurrentView('timeclock')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Clock className="w-5 h-5" />
            Time Clock
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-3 py-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-4 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: user.avatar }}
              >
                {user.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{user.name}</div>
                <div className="text-xs text-white/50 truncate">{user.email}</div>
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
            <button
              onClick={() => setCurrentView('timeclock')}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <Wrench className="w-6 h-6 text-primary-500" style={{ transform: 'rotate(-90deg)' }} />
              <span className="font-bold text-secondary-500">ServiceCore</span>
            </div>
            <h2 className="hidden lg:block text-lg font-semibold text-secondary-500">
              Payroll Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
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
          {sidebarItems.map((item) => {
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
          <button
            onClick={() => navigate('/costs')}
            className="flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase whitespace-nowrap border-b-2 border-transparent text-gray-400 hover:text-gray-600 transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            Costs
          </button>
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
