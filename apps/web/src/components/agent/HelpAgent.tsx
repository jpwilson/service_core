import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, MessageSquare, BookOpen, ScrollText, Info, Search, ChevronDown, ChevronRight, Map, ExternalLink, Truck, Navigation } from 'lucide-react';
import { ChatBot } from './ChatBot';
import { GuidedTour } from './GuidedTour';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../auth/AuthContext';

type Tab = 'chat' | 'glossary' | 'changelog' | 'info';

// ── Glossary Data ──────────────────────────────────────────────────────
const GLOSSARY_TERMS = [
  { term: 'Porta-John', definition: 'Standard portable restroom unit' },
  { term: 'Hand Wash Station', definition: 'Standalone hand washing unit with foot pump' },
  { term: 'Restroom Trailer', definition: 'Premium mobile restroom on a trailer' },
  { term: 'Pump Truck', definition: 'Vacuum truck used to service/empty portable units' },
  { term: 'Service Route', definition: 'Daily planned sequence of locations to service' },
  { term: 'Drop/Pickup', definition: 'Delivering or retrieving units from a job site' },
  { term: 'Time Entry', definition: 'A recorded period of employee work (clock in to clock out)' },
  { term: 'Timesheet', definition: 'Collection of time entries for a pay period, submitted for approval' },
  { term: 'Pay Period', definition: 'Duration for payroll calculation (weekly, bi-weekly, semi-monthly)' },
  { term: 'Overtime (OT)', definition: 'Hours exceeding 8/day or 40/week, paid at 1.5x rate' },
  { term: 'Double Time', definition: 'Hours exceeding daily/weekly thresholds, paid at 2x rate' },
  { term: 'Geofence', definition: 'GPS boundary around a job site for location verification' },
  { term: 'Dispatch Board', definition: 'Weekly grid showing crew assignments to job sites' },
  { term: 'Anomaly Detection', definition: 'AI system flagging suspicious patterns (buddy punching, ghost shifts)' },
  { term: 'Buddy Punching', definition: 'One employee clocking in/out for another (fraudulent)' },
  { term: 'Ghost Shift', definition: 'Time entry with no corresponding GPS or activity data' },
  { term: 'RLS (Row Level Security)', definition: 'Database-level access control per user role' },
  { term: 'OCR (Optical Character Recognition)', definition: 'Scanning paper timesheets to extract data digitally' },
  { term: 'OSRM', definition: 'Open Source Routing Machine — free road routing API' },
];

// ── Changelog Data ─────────────────────────────────────────────────────
type ChangelogCategory = 'Feature' | 'Fix' | 'Improvement';

interface ChangelogEntry {
  date: string;
  category: ChangelogCategory;
  description: string;
}

const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  { date: '2026-03-22', category: 'Feature', description: '3D data visualization graph with Three.js force-directed layout' },
  { date: '2026-03-22', category: 'Improvement', description: 'Route changed from /costs to /project-details' },
  { date: '2026-03-22', category: 'Feature', description: 'Experimental Tools section with data visualization banner' },
  { date: '2026-03-22', category: 'Improvement', description: 'LLM Models section with purpose labels' },
  { date: '2026-03-22', category: 'Feature', description: 'Role-based access: drivers see limited sidebar (4 tabs)' },
  { date: '2026-03-22', category: 'Improvement', description: 'Time Clock integrated into dashboard sidebar' },
  { date: '2026-03-22', category: 'Improvement', description: 'Landing page revamped with 12 feature cards and workflow timeline' },
  { date: '2026-03-22', category: 'Fix', description: 'Route Planning data moved from Tucson to Colorado (data coherence)' },
  { date: '2026-03-22', category: 'Improvement', description: 'Guided tour expanded to 15 steps with correct tab navigation' },
  { date: '2026-03-22', category: 'Feature', description: 'Route Planning: 50 locations, OSRM road routing, traffic simulation' },
  { date: '2026-03-21', category: 'Feature', description: 'Scheduling: weekly dispatch board with 7x7 grid' },
  { date: '2026-03-21', category: 'Feature', description: 'Customers: CRM with 8 Colorado customers' },
  { date: '2026-03-21', category: 'Feature', description: 'Equipment: 20 tracked units (porta-johns, trailers, hand wash stations)' },
  { date: '2026-03-21', category: 'Feature', description: 'Invoices: generate from time entries with tax and PDF download' },
  { date: '2026-03-21', category: 'Feature', description: 'Accounting: QuickBooks/Xero/ADP CSV exports' },
  { date: '2026-03-21', category: 'Feature', description: 'Audit Log: 25 events timeline with type filtering' },
  { date: '2026-03-21', category: 'Feature', description: 'Predictive OT alerts and AI anomaly detection' },
  { date: '2026-03-21', category: 'Improvement', description: 'Code splitting: 2,424KB to 827KB (66% reduction)' },
  { date: '2026-03-20', category: 'Feature', description: 'AI Help chatbot with jailbreak-hardened system prompt' },
  { date: '2026-03-20', category: 'Feature', description: 'Guided tour (interactive walkthrough)' },
  { date: '2026-03-19', category: 'Feature', description: 'Route Planning with Leaflet map' },
  { date: '2026-03-19', category: 'Feature', description: 'PDF OCR import and unified import drop zone' },
  { date: '2026-03-18', category: 'Feature', description: 'Analytics: 5 sub-tabs (Hours, Attendance, Labor, Projects, Employees)' },
  { date: '2026-03-18', category: 'Feature', description: 'Timesheet approvals with bulk approve' },
  { date: '2026-03-17', category: 'Feature', description: 'Time Clock with Simple and Advanced modes' },
  { date: '2026-03-17', category: 'Feature', description: 'Dashboard Overview with KPI cards' },
  { date: '2026-03-16', category: 'Feature', description: 'Landing page and login with 3 demo users' },
  { date: '2026-03-15', category: 'Feature', description: 'Initial monorepo setup with pnpm + Turborepo' },
];

const CATEGORY_STYLES: Record<ChangelogCategory, string> = {
  Feature: 'bg-blue-100 text-blue-700',
  Fix: 'bg-green-100 text-green-700',
  Improvement: 'bg-purple-100 text-purple-700',
};

// ── Spec Requirements ──────────────────────────────────────────────────
const SPEC_REQUIREMENTS = [
  'Employee time tracking with clock in/out, breaks, and GPS verification',
  'Payroll calculations with configurable overtime rules (daily/weekly thresholds)',
  'Manager approval workflow for timesheets with anomaly flagging',
  'Multi-format data import (Excel, CSV, PDF OCR, paper scan)',
  'Analytics dashboards with hours, attendance, labor costs, and employee views',
  'Route planning and crew scheduling for field service operations',
];

const LLM_MODELS = [
  { name: 'Claude Sonnet 4', purpose: 'AI Help chatbot (domain-restricted)' },
  { name: 'Claude Haiku 3.5', purpose: 'Anomaly detection scoring' },
  { name: 'Claude Sonnet 4', purpose: 'Predictive overtime alerts' },
];

const INFRA_ITEMS = [
  { label: 'Hosting', value: 'Vercel' },
  { label: 'Backend', value: 'Supabase (Postgres + Auth + Edge Functions)' },
  { label: 'AI Routing', value: 'OpenRouter' },
  { label: 'Tracing', value: 'Langfuse' },
];

// ── Tab Components ─────────────────────────────────────────────────────

function GlossaryTab() {
  const [search, setSearch] = useState('');

  const filtered = GLOSSARY_TERMS.filter(
    (item) =>
      item.term.toLowerCase().includes(search.toLowerCase()) ||
      item.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search terms..."
            className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 scrollbar-thin">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No matching terms found.</p>
        )}
        {filtered.map((item) => (
          <div key={item.term} className="py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm font-semibold text-secondary-500">{item.term}</span>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.definition}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChangelogTab() {
  const [filter, setFilter] = useState<'All' | ChangelogCategory>('All');

  const filtered =
    filter === 'All'
      ? CHANGELOG_ENTRIES
      : CHANGELOG_ENTRIES.filter((e) => e.category === filter);

  const filters: Array<'All' | ChangelogCategory> = ['All', 'Feature', 'Fix', 'Improvement'];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 flex gap-1.5">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
              filter === f
                ? 'bg-secondary-500 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 scrollbar-thin">
        {filtered.map((entry, i) => (
          <div key={i} className="flex items-start gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap mt-0.5">{entry.date}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${CATEGORY_STYLES[entry.category]} whitespace-nowrap`}>
              {entry.category}
            </span>
            <span className="text-xs text-gray-700 leading-relaxed">{entry.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoTab({ onStartTour }: { onStartTour: () => void }) {
  const { user } = useAuth();
  const isDriver = user?.role === 'driver';
  const [specOpen, setSpecOpen] = useState(false);

  if (isDriver) {
    return (
      <div className="flex flex-col h-full overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin">
        <div>
          <h4 className="text-sm font-bold text-secondary-500 mb-3">Driver Portal</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
              <Truck className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-800">Assigned Equipment</p>
                <p className="text-xs text-blue-600">View your assigned units in the Equipment tab</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-green-50 rounded-lg p-3">
              <Navigation className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-green-800">Today&apos;s Route</p>
                <p className="text-xs text-green-600">Check your pre-assigned route in Route Planning</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tour Button */}
        <div className="pt-2">
          <button
            onClick={onStartTour}
            className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors"
          >
            <Map className="w-4 h-4" />
            Take Guided Tour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin">
      {/* Spec */}
      <div>
        <button
          onClick={() => setSpecOpen(!specOpen)}
          className="flex items-center gap-1.5 w-full text-left"
        >
          {specOpen ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-sm font-bold text-secondary-500">Spec Requirements</span>
        </button>
        {specOpen && (
          <div className="mt-2 ml-6 space-y-1.5">
            <p className="text-xs text-gray-500 leading-relaxed">
              ServiceCore is a multi-platform employee time tracking and payroll dashboard
              for portable sanitation / field service companies.
            </p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              {SPEC_REQUIREMENTS.map((req, i) => (
                <li key={i} className="text-xs text-gray-600 leading-relaxed">{req}</li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* LLM Models */}
      <div>
        <h4 className="text-sm font-bold text-secondary-500 mb-1.5">LLM Models</h4>
        <div className="space-y-1">
          {LLM_MODELS.map((model, i) => (
            <div key={i} className="flex items-baseline gap-2">
              <span className="text-xs font-semibold text-gray-700">{model.name}</span>
              <span className="text-[10px] text-gray-400">-</span>
              <span className="text-xs text-gray-500">{model.purpose}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Infrastructure */}
      <div>
        <h4 className="text-sm font-bold text-secondary-500 mb-1.5">Infrastructure</h4>
        <div className="space-y-1">
          {INFRA_ITEMS.map((item, i) => (
            <div key={i} className="flex items-baseline gap-2">
              <span className="text-xs font-semibold text-gray-700">{item.label}:</span>
              <span className="text-xs text-gray-500">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div>
        <h4 className="text-sm font-bold text-secondary-500 mb-1.5">Links</h4>
        <div className="space-y-1">
          <a
            href="https://github.com/jpwilson/service_core"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            GitHub Repository
          </a>
          <a
            href="/dashboard?tab=overview"
            className="flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Project Details
          </a>
        </div>
      </div>

      {/* Tour Button */}
      <div className="pt-2">
        <button
          onClick={onStartTour}
          className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors"
        >
          <Map className="w-4 h-4" />
          Take Guided Tour
        </button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; Icon: typeof MessageSquare }[] = [
  { id: 'chat', label: 'Chat', Icon: MessageSquare },
  { id: 'glossary', label: 'Glossary', Icon: BookOpen },
  { id: 'changelog', label: 'Changelog', Icon: ScrollText },
  { id: 'info', label: 'Info', Icon: Info },
];

export function HelpAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const { showGuidedTour, setShowGuidedTour } = useAppStore();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const bubble = document.getElementById('help-bubble');
        if (bubble && bubble.contains(e.target as Node)) return;
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const startTour = () => {
    setIsOpen(false);
    setShowGuidedTour(true);
  };

  return (
    <>
      {/* Tour Overlay */}
      {showGuidedTour && <GuidedTour onClose={() => setShowGuidedTour(false)} />}

      {/* Popup Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-24 right-6 w-[420px] h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-[9990] flex flex-col overflow-hidden animate-slide-up"
        >
          {/* Header */}
          <div className="bg-secondary-500 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary-500" />
              <span className="font-bold text-sm">ServiceCore Help</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Bar */}
          <div className="flex border-b border-gray-100">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeTab === id
                    ? 'text-primary-500 border-b-2 border-primary-500'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' && <ChatBot />}
            {activeTab === 'glossary' && <GlossaryTab />}
            {activeTab === 'changelog' && <ChangelogTab />}
            {activeTab === 'info' && <InfoTab onStartTour={startTour} />}
          </div>
        </div>
      )}

      {/* Floating Bubble */}
      {!showGuidedTour && (
        <button
          id="help-bubble"
          onClick={() => setIsOpen(!isOpen)}
          className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-[9991] transition-all duration-200 ${
            isOpen
              ? 'bg-gray-600 hover:bg-gray-700 rotate-90'
              : 'bg-primary-500 hover:bg-primary-600 animate-bounce-gentle'
          }`}
          title="Help & AI Assistant"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <HelpCircle className="w-7 h-7 text-white" />
          )}
        </button>
      )}
    </>
  );
}
