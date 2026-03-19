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
  const { setCurrentView, setDashboardTab } = useAppStore();

  const TOUR_STEPS: TourStep[] = [
    {
      title: 'Welcome to ServiceCore!',
      description:
        'This guided tour will walk you through every feature of your employee time tracking and payroll dashboard. Use the arrow keys or buttons below to navigate. Press Escape to exit anytime.',
      position: 'center',
    },
    {
      title: 'Time Clock',
      description:
        'The Time Clock is where employees clock in and out with a single tap. The large button shows current status, and stat cards display shift duration and total hours worked today.',
      position: 'center',
      navigate: () => {
        setCurrentView('timeclock');
      },
    },
    {
      title: 'Dashboard Overview',
      description:
        'The Overview shows key metrics at a glance: active employees, total hours, overtime hours, and total payroll. The team activity feed shows real-time clock in/out events.',
      position: 'bottom',
      navigate: () => {
        setCurrentView('dashboard');
        setDashboardTab('overview');
      },
    },
    {
      title: 'Analytics - Hours',
      description:
        'The Hours Analytics section shows daily and weekly hour distributions, top performers, and hour trends over time with interactive charts you can hover and filter.',
      position: 'bottom',
      navigate: () => {
        setDashboardTab('hours');
      },
    },
    {
      title: 'Analytics - Attendance',
      description:
        'Track attendance patterns across your team. See on-time arrival rates, late arrivals, and absence rates broken down by department and time period.',
      position: 'bottom',
      navigate: () => {
        setDashboardTab('attendance');
      },
    },
    {
      title: 'Analytics - Labor Costs',
      description:
        'Monitor labor costs by project, department, and time period. See how overtime impacts your budget and identify opportunities for cost optimization.',
      position: 'bottom',
      navigate: () => {
        setDashboardTab('labor-cost');
      },
    },
    {
      title: 'Timesheet Approvals',
      description:
        'Managers review, approve, or reject pending timesheets here. Each entry shows hours worked, flags for overtime or late arrivals, and employee notes.',
      position: 'bottom',
      navigate: () => {
        setDashboardTab('approvals');
      },
    },
    {
      title: 'Import & OCR Scanner',
      description:
        'Import timesheets from Excel or CSV files, or scan paper timesheets using the built-in OCR scanner. The scanner extracts hours from both printed and handwritten sheets.',
      position: 'bottom',
      navigate: () => {
        setDashboardTab('import');
      },
    },
    {
      title: 'Settings',
      description:
        'Configure your pay period type, overtime rules (daily and weekly thresholds, multipliers), automatic break deduction rules, and data export options.',
      position: 'bottom',
      navigate: () => {
        setDashboardTab('settings');
      },
    },
    {
      title: 'Tour Complete!',
      description:
        "You've explored all the features! Use the AI chatbot at the bottom-right to ask questions about your data, or start exploring on your own. Click the help button anytime to restart this tour.",
      position: 'center',
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

      // Small delay to let navigation render before showing tooltip
      const target = TOUR_STEPS[index];
      if (target.navigate) {
        target.navigate();
      }

      // Allow the view to render before transitioning
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

  // Navigate to the initial step on mount
  useEffect(() => {
    const target = TOUR_STEPS[0];
    if (target.navigate) {
      target.navigate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard navigation
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

  // Center position: card in the middle of the screen
  // Bottom position: card at the bottom of the content area, so user sees page content above
  const isCenter = step.position === 'center';

  return (
    <div className="fixed inset-0 z-[9998]" role="dialog" aria-modal="true" aria-label="Guided tour">
      {/* Semi-transparent backdrop - lets content show through */}
      <div
        className="absolute inset-0 bg-black/30 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Tooltip Card */}
      <div
        className={`absolute z-[9999] left-1/2 -translate-x-1/2 w-full max-w-lg px-4 transition-all duration-300 ease-out ${
          isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        } ${isCenter ? 'top-1/2 -translate-y-1/2' : 'bottom-8'}`}
      >
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200/50 overflow-hidden">
          {/* Header */}
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

          {/* Progress bar */}
          <div className="w-full h-1 bg-gray-100">
            <div
              className="h-full bg-primary-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <h3 className="text-lg font-bold text-secondary-500 mb-2">{step.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
          </div>

          {/* Arrow indicator for non-center steps */}
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

          {/* Footer with navigation */}
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

            {/* Dot indicators */}
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

        {/* Downward-pointing arrow for bottom-positioned cards */}
        {!isCenter && (
          <div className="flex justify-center -mt-px">
            <div className="w-3 h-3 bg-white border-b border-r border-gray-200/50 rotate-45 transform translate-y-[-6px]" />
          </div>
        )}
      </div>
    </div>
  );
}
