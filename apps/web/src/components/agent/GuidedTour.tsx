import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface TourStep {
  title: string;
  description: string;
  tabId?: string; // which sidebar button to point at (matches dashboardTab id)
  navigate?: () => void;
}

interface GuidedTourProps {
  onClose: () => void;
}

export function GuidedTour({ onClose }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [tooltipTop, setTooltipTop] = useState<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { setDashboardTab } = useAppStore();

  const TOUR_STEPS: TourStep[] = [
    {
      title: 'Welcome to ServiceCore!',
      description:
        'This tour walks you through every feature of your portable sanitation operations platform. Use arrow keys or buttons to navigate. Press Escape to exit anytime.',
    },
    {
      title: 'Time Clock',
      description:
        'Drivers and crew clock in/out here. Simple mode is a one-tap punch; Advanced mode adds project selection, GPS tracking, break logging, and mileage.',
      tabId: 'timeclock',
      navigate: () => setDashboardTab('timeclock'),
    },
    {
      title: 'Operations Dashboard',
      description:
        'Your command center. KPI cards show active employees, total hours, overtime, estimated payroll, and attendance rate. Predictive OT alerts and AI anomaly detection below.',
      tabId: 'overview',
      navigate: () => setDashboardTab('overview'),
    },
    {
      title: 'Crew Scheduling',
      description:
        'Weekly dispatch board. Assign drivers and service crew to job sites across a 7-day grid. Color-coded by site, with gap detection so no route goes unserviced.',
      tabId: 'scheduling',
      navigate: () => setDashboardTab('scheduling'),
    },
    {
      title: 'Route Planning',
      description:
        'Build daily service routes from 50+ locations. Search and filter by type and priority. Routes use real road data via OSRM with drive times and simulated traffic.',
      tabId: 'routes',
      navigate: () => setDashboardTab('routes'),
    },
    {
      title: 'Analytics',
      description:
        'Five reporting views: Hours (daily/weekly trends), Attendance (on-time rates), Labor Costs (by project), Projects (budget tracking), and Employees (individual performance).',
      tabId: 'hours',
      navigate: () => setDashboardTab('hours'),
    },
    {
      title: 'Timesheet Approvals',
      description:
        'Managers review, approve, or reject submitted timesheets. Each entry shows hours worked, overtime flags, late arrivals, and employee notes. Bulk approve for speed.',
      tabId: 'approvals',
      navigate: () => setDashboardTab('approvals'),
    },
    {
      title: 'Customer Management',
      description:
        'Your CRM for construction companies, event planners, and municipal contracts. View service history, job sites, and contact details for each customer.',
      tabId: 'customers',
      navigate: () => setDashboardTab('customers'),
    },
    {
      title: 'Equipment Tracking',
      description:
        'Track every porta-john, hand wash station, and restroom trailer. Monitor condition, next service dates, and deployment status across all job sites.',
      tabId: 'equipment',
      navigate: () => setDashboardTab('equipment'),
    },
    {
      title: 'Invoicing',
      description:
        'Generate invoices from time entries per customer. Add line items, apply tax, and download as PDF. Track invoice status and payment history.',
      tabId: 'invoices',
      navigate: () => setDashboardTab('invoices'),
    },
    {
      title: 'Data Import',
      description:
        'Drag and drop to import from Excel, CSV/Kronos, PDF, or scanned paper timesheets (OCR). Auto-detects format and shows import history with outcomes.',
      tabId: 'import',
      navigate: () => setDashboardTab('import'),
    },
    {
      title: 'Accounting Export',
      description:
        'Export formatted data for QuickBooks, Xero, or ADP. One-click CSV generation with sync status tracking and export history.',
      tabId: 'quickbooks',
      navigate: () => setDashboardTab('quickbooks'),
    },
    {
      title: 'Audit Log',
      description:
        'Complete activity trail — approvals, edits, system flags, and imports. Filter by event type and search to track who changed what and when.',
      tabId: 'audit',
      navigate: () => setDashboardTab('audit'),
    },
    {
      title: 'Settings',
      description:
        'Configure pay periods (weekly, bi-weekly, semi-monthly), overtime rules (daily/weekly thresholds, multipliers), automatic break deductions, and departments.',
      tabId: 'settings',
      navigate: () => setDashboardTab('settings'),
    },
    {
      title: 'Tour Complete!',
      description:
        "You've explored all the features! Use the AI chatbot (bottom-right bubble) to ask questions, or start exploring on your own. Click the help button anytime to restart.",
      navigate: () => setDashboardTab('overview'),
    },
  ];

  const totalSteps = TOUR_STEPS.length;
  const step = TOUR_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const isCenter = !step.tabId;

  // Find the sidebar button position for the current step
  const updateTooltipPosition = useCallback(() => {
    if (!step.tabId) {
      setTooltipTop(null);
      return;
    }

    // Find the active sidebar button by looking for the highlighted one
    const sidebar = document.querySelector('aside');
    if (!sidebar) {
      setTooltipTop(null);
      return;
    }

    const buttons = sidebar.querySelectorAll('button');
    let targetButton: Element | null = null;

    for (const btn of buttons) {
      // The active button has bg-white/10 class
      if (btn.classList.contains('bg-white/10') || btn.className.includes('bg-white/10')) {
        targetButton = btn;
        break;
      }
    }

    if (targetButton) {
      const rect = targetButton.getBoundingClientRect();
      const tooltipHeight = tooltipRef.current?.offsetHeight || 300;
      // Center the tooltip vertically with the sidebar button
      let top = rect.top + rect.height / 2 - tooltipHeight / 2;
      // Clamp so it doesn't go off screen
      top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));
      setTooltipTop(top);
    } else {
      setTooltipTop(null);
    }
  }, [step.tabId]);

  useEffect(() => {
    // Wait for navigation to render, then position
    const timer = setTimeout(updateTooltipPosition, 200);
    return () => clearTimeout(timer);
  }, [currentStep, updateTooltipPosition]);

  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalSteps || isTransitioning) return;

      setIsTransitioning(true);

      const target = TOUR_STEPS[index];
      if (target.navigate) {
        target.navigate();
      }

      setTimeout(() => {
        setCurrentStep(index);
        setIsTransitioning(false);
      }, 200);
    },
    [totalSteps, isTransitioning, TOUR_STEPS]
  );

  const next = useCallback(() => {
    if (isLast) {
      onClose();
    } else {
      goToStep(currentStep + 1);
    }
  }, [isLast, currentStep, goToStep, onClose]);

  const prev = useCallback(() => {
    if (!isFirst) {
      goToStep(currentStep - 1);
    }
  }, [isFirst, currentStep, goToStep]);

  useEffect(() => {
    const target = TOUR_STEPS[0];
    if (target.navigate) {
      target.navigate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        next();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [next, prev, onClose]);

  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  // Sidebar is 256px (w-64). Position tooltip just to the right of it.
  const sidebarWidth = 256;

  return (
    <div className="fixed inset-0 z-[9998]" role="dialog" aria-modal="true" aria-label="Guided tour">
      <div
        className="absolute inset-0 bg-black/30 transition-opacity duration-300"
        onClick={onClose}
      />

      <div
        ref={tooltipRef}
        className={`absolute z-[9999] w-full max-w-md transition-all duration-300 ease-out ${
          isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
        style={
          isCenter
            ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
            : {
                top: tooltipTop != null ? `${tooltipTop}px` : '50%',
                left: `${sidebarWidth + 24}px`,
                ...(tooltipTop == null ? { transform: 'translateY(-50%)' } : {}),
              }
        }
      >
        {/* Left-pointing triangle for sidebar-anchored steps */}
        {!isCenter && (
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[6px]"
          >
            <div className="w-3 h-3 bg-white border-l border-b border-gray-200/50 rotate-45 shadow-sm" />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-2xl border border-gray-200/50 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 bg-secondary-500">
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
              {currentStep + 1} of {totalSteps}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close tour"
            >
              <X className="w-4 h-4 text-white/80" />
            </button>
          </div>

          <div className="w-full h-1 bg-gray-100">
            <div
              className="h-full bg-primary-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="px-6 py-5">
            <h3 className="text-lg font-bold text-secondary-500 mb-2">{step.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <button
              onClick={prev}
              disabled={isFirst || isTransitioning}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                isFirst || isTransitioning
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:text-secondary-500'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToStep(i)}
                  disabled={isTransitioning}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? 'bg-primary-500 w-4'
                      : i < currentStep
                      ? 'bg-primary-300'
                      : 'bg-gray-200'
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              disabled={isTransitioning}
              className="flex items-center gap-1 text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
            >
              {isLast ? 'Finish' : 'Next'}
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
