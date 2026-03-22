import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

type TooltipPosition = 'center' | 'bottom';

interface TourStep {
  title: string;
  description: string;
  position: TooltipPosition;
  navigate?: () => void;
}

interface GuidedTourProps {
  onClose: () => void;
}

export function GuidedTour({ onClose }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { setDashboardTab } = useAppStore();

  const TOUR_STEPS: TourStep[] = [
    {
      title: 'Welcome to ServiceCore!',
      description:
        'This tour walks you through every feature of your portable sanitation operations platform. Use arrow keys or buttons to navigate. Press Escape to exit anytime.',
      position: 'center',
    },
    {
      title: 'Time Clock',
      description:
        'Drivers and crew clock in/out here. Simple mode is a one-tap punch; Advanced mode adds project selection, GPS tracking, break logging, and mileage. Toggle between modes with the switch.',
      position: 'bottom',
      navigate: () => setDashboardTab('timeclock'),
    },
    {
      title: 'Operations Dashboard',
      description:
        'Your command center. KPI cards show active employees, total hours, overtime, estimated payroll, and attendance rate. Below: predictive OT alerts and AI anomaly detection flag buddy punching, ghost shifts, and more.',
      position: 'bottom',
      navigate: () => setDashboardTab('overview'),
    },
    {
      title: 'Crew Scheduling',
      description:
        'Weekly dispatch board. Assign drivers and service crew to job sites across a 7-day grid. Color-coded by site, with gap detection so no route goes unserviced.',
      position: 'bottom',
      navigate: () => setDashboardTab('scheduling'),
    },
    {
      title: 'Route Planning',
      description:
        'Build daily service routes from 50+ locations. Search and filter by type (construction, events, parks) and priority. Routes use real road data via OSRM with drive times and simulated traffic.',
      position: 'bottom',
      navigate: () => setDashboardTab('routes'),
    },
    {
      title: 'Equipment Tracking',
      description:
        'Track every porta-john, hand wash station, and restroom trailer. Monitor condition, next service dates, and deployment status. 20 units across all your job sites.',
      position: 'bottom',
      navigate: () => setDashboardTab('equipment'),
    },
    {
      title: 'Customer Management',
      description:
        'Your CRM for construction companies, event planners, and municipal contracts. View service history, job sites, and contact details for each customer.',
      position: 'bottom',
      navigate: () => setDashboardTab('customers'),
    },
    {
      title: 'Timesheet Approvals',
      description:
        'Managers review, approve, or reject submitted timesheets. Each entry shows hours worked, overtime flags, late arrivals, and employee notes. Bulk approve for speed.',
      position: 'bottom',
      navigate: () => setDashboardTab('approvals'),
    },
    {
      title: 'Analytics',
      description:
        'Five reporting views: Hours (daily/weekly trends), Attendance (on-time rates), Labor Costs (by project), Projects (budget tracking), and Employees (individual performance).',
      position: 'bottom',
      navigate: () => setDashboardTab('hours'),
    },
    {
      title: 'Invoicing',
      description:
        'Generate invoices from time entries per customer. Add line items, apply tax (configurable rate), and download as PDF. Track invoice status and payment history.',
      position: 'bottom',
      navigate: () => setDashboardTab('invoices'),
    },
    {
      title: 'Accounting Export',
      description:
        'Export formatted data for QuickBooks, Xero, or ADP. One-click CSV generation with sync status tracking and export history.',
      position: 'bottom',
      navigate: () => setDashboardTab('quickbooks'),
    },
    {
      title: 'Data Import',
      description:
        'Drag and drop to import from Excel, CSV/Kronos, PDF, or scanned paper timesheets (OCR). Auto-detects format and shows import history with outcomes.',
      position: 'bottom',
      navigate: () => setDashboardTab('import'),
    },
    {
      title: 'Audit Log',
      description:
        'Complete activity trail — approvals, edits, system flags, and imports. Filter by event type and search to track who changed what and when.',
      position: 'bottom',
      navigate: () => setDashboardTab('audit'),
    },
    {
      title: 'Settings',
      description:
        'Configure pay periods (weekly, bi-weekly, semi-monthly), overtime rules (daily/weekly thresholds, multipliers), automatic break deductions, and department management.',
      position: 'bottom',
      navigate: () => setDashboardTab('settings'),
    },
    {
      title: 'Tour Complete!',
      description:
        "You've explored all the features! Use the AI chatbot (bottom-right bubble) to ask questions about your data, or start exploring on your own. Click the help button anytime to restart this tour.",
      position: 'center',
      navigate: () => setDashboardTab('overview'),
    },
  ];

  const totalSteps = TOUR_STEPS.length;
  const step = TOUR_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

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
      }, 150);
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
  const isCenter = step.position === 'center';

  return (
    <div className="fixed inset-0 z-[9998]" role="dialog" aria-modal="true" aria-label="Guided tour">
      <div
        className="absolute inset-0 bg-black/30 transition-opacity duration-300"
        onClick={onClose}
      />

      <div
        className={`absolute z-[9999] left-1/2 -translate-x-1/2 w-full max-w-lg px-4 transition-all duration-300 ease-out ${
          isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        } ${isCenter ? 'top-1/2 -translate-y-1/2' : 'bottom-8'}`}
      >
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

          {!isCenter && (
            <div className="px-6 pb-2">
              <div className="flex items-center gap-2 text-xs text-primary-500 font-medium">
                <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Look at the page content above
              </div>
            </div>
          )}

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

        {!isCenter && (
          <div className="flex justify-center -mt-px">
            <div className="w-3 h-3 bg-white border-b border-r border-gray-200/50 rotate-45 transform translate-y-[-6px]" />
          </div>
        )}
      </div>
    </div>
  );
}
