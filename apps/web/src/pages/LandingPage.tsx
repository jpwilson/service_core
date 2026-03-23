import { useNavigate } from 'react-router-dom';
import {
  Clock,
  BarChart3,
  Shield,
  Users,
  FileCheck,
  ArrowRight,
  Wrench,
  CheckCircle,
  Phone,
  CalendarDays,
  Route,
  Container,
  Receipt,
  FileOutput,
  Sparkles,
  Upload,
  Sun,
  MapPin,
  Truck,
  ClipboardCheck,
  Moon,
  LogIn,
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-display">
      {/* Top Bar */}
      <div className="bg-secondary-500 text-white text-sm py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> SALES <strong>1-888-PMP-CREW</strong>
            </span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:flex items-center gap-1">
              <Phone className="w-3 h-3" /> SUPPORT <strong>1-800-GOT-JONS</strong>
            </span>
          </div>
          <span className="text-xs text-white/50">Available 24/7</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="text-2xl font-black tracking-tight">
                <span className="text-secondary-500">Serv</span>
                <span className="inline-block relative w-5 text-center">
                  <Wrench className="inline w-5 h-5 text-primary-500" style={{ transform: 'rotate(-90deg) translateY(-1px)' }} />
                </span>
                <span className="text-secondary-500">ce</span>
                <span className="text-primary-500">Core</span>
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-gray-700 hover:text-primary-500 uppercase tracking-wide">
              How It Works
            </a>
            <a href="#pricing" className="text-sm font-semibold text-gray-700 hover:text-primary-500 uppercase tracking-wide">
              Plans
            </a>
            <a href="#about" className="text-sm font-semibold text-gray-700 hover:text-primary-500 uppercase tracking-wide">
              About Us
            </a>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-colors flex items-center gap-2"
          >
            See ServiceCore in Action!
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-secondary-500 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary-500/95 to-secondary-500/80" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase leading-tight mb-6">
              <span className="text-primary-500">The Complete</span>
              <br />
              Operations Platform
              <br />
              <span className="text-primary-500">for Portable Sanitation</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
              The complete operations platform for portable sanitation companies.
              Track employee hours, plan service routes, manage equipment, invoice
              customers, and run payroll — all from one dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/login')}
                className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2"
              >
                See ServiceCore in Action!
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="#features"
                className="border-2 border-white/30 hover:border-white/60 text-white px-8 py-4 rounded-lg text-lg font-bold uppercase tracking-wide transition-colors text-center"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-primary-500 py-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '4-6 hrs', label: 'Saved Weekly' },
            { value: '50+', label: 'Service Locations' },
            { value: '20', label: 'Units Tracked' },
            { value: 'Real-Time', label: 'Routes' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-white">{stat.value}</div>
              <div className="text-sm text-white/80 font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Customer Login CTA */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <p className="text-sm text-gray-500">Already a ServiceCore customer?</p>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-6 py-2.5 border-2 border-secondary-500 text-secondary-500 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-secondary-500 hover:text-white transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Customer Login
          </button>
        </div>
      </section>

      {/* Your Day, Simplified */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-secondary-500 uppercase mb-4">
              Your Day, Simplified
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From first dispatch to final export, ServiceCore handles every step
              of your portable sanitation operation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Sun,
                time: 'Morning',
                title: 'Dispatch Crews',
                desc: 'Assign drivers and service techs from the weekly scheduling board. See who is available, drag to assign jobs across all your sites.',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                icon: Route,
                time: 'Route',
                title: 'Optimize Service Routes',
                desc: 'Plan the fastest path across 50+ service locations. Real-time maps show actual drive times so your trucks spend less time on the road.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: Truck,
                time: 'Field',
                title: 'Track Drivers',
                desc: 'Drivers clock in and out with GPS tracking. Automatic break deductions, mileage logging, and project tagging happen in real time.',
                color: 'bg-green-50 text-green-600',
              },
              {
                icon: Container,
                time: 'Service',
                title: 'Monitor Equipment',
                desc: 'Track every porta-john, hand wash station, and restroom trailer. Know which units need servicing, which are deployed, and where.',
                color: 'bg-purple-50 text-purple-600',
              },
              {
                icon: ClipboardCheck,
                time: 'Office',
                title: 'Approve & Invoice',
                desc: 'Managers review and approve timesheets with one click. Generate invoices from completed service hours, add tax, and send as PDF.',
                color: 'bg-rose-50 text-rose-600',
              },
              {
                icon: Moon,
                time: 'End of Day',
                title: 'Export & Analyze',
                desc: 'Export payroll to QuickBooks, Xero, or ADP. Review analytics dashboards for labor costs, attendance patterns, and overtime trends.',
                color: 'bg-indigo-50 text-indigo-600',
              },
            ].map((step) => (
              <div key={step.title} className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 ${step.color} rounded-lg flex items-center justify-center`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary-500">{step.time}</span>
                </div>
                <h3 className="text-xl font-bold text-secondary-500 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — How It Works */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-secondary-500 uppercase mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              12 integrated tools built specifically for portable sanitation companies.
              No more juggling spreadsheets, paper timesheets, and disconnected apps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: 'Time Clock',
                desc: 'Simple clock in/out with GPS location tracking. Automatic break deductions, project tagging, and mileage logging for every driver and service tech.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: CalendarDays,
                title: 'Scheduling',
                desc: 'Weekly dispatch board for assigning crews to job sites. Drag-and-drop scheduling across color-coded construction sites, events, and municipal routes.',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                icon: Route,
                title: 'Route Planning',
                desc: 'Plan optimized service routes across 50+ locations. Real-time road routing shows actual drive times and distances between every stop on the route.',
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                icon: Container,
                title: 'Equipment Tracking',
                desc: 'Track every porta-john, hand wash station, and restroom trailer. Monitor condition, service dates, and deployment across all job sites.',
                color: 'bg-purple-50 text-purple-600',
              },
              {
                icon: Users,
                title: 'Customer Management',
                desc: 'Manage construction companies, event planners, and municipal contracts. Track service history and job sites for each customer.',
                color: 'bg-pink-50 text-pink-600',
              },
              {
                icon: Receipt,
                title: 'Invoicing',
                desc: 'Generate invoices directly from completed time entries. Add line items, calculate tax, and download professional PDF invoices for each customer.',
                color: 'bg-teal-50 text-teal-600',
              },
              {
                icon: FileCheck,
                title: 'Timesheet Approvals',
                desc: 'Streamlined manager approval workflow for every timesheet. Review, approve, or reject submissions with anomaly flags for unusual entries.',
                color: 'bg-green-50 text-green-600',
              },
              {
                icon: BarChart3,
                title: 'Analytics',
                desc: 'Five reporting views: hours breakdown, attendance patterns, labor costs by project, project allocation, and per-employee performance dashboards.',
                color: 'bg-violet-50 text-violet-600',
              },
              {
                icon: Shield,
                title: 'Payroll Reports',
                desc: 'Generate PDF payroll reports with per-employee breakdowns and overtime calculations. Export to Excel for your accountant or payroll provider.',
                color: 'bg-cyan-50 text-cyan-600',
              },
              {
                icon: FileOutput,
                title: 'Accounting Export',
                desc: 'One-click export to QuickBooks, Xero, or ADP. Track sync status, view export history, and generate CSV files formatted for your accounting software.',
                color: 'bg-orange-50 text-orange-600',
              },
              {
                icon: Sparkles,
                title: 'AI Insights',
                desc: 'Anomaly detection flags buddy punching, ghost shifts, and overtime gaming. Predictive alerts warn about overtime projections and budget overruns before they happen.',
                color: 'bg-fuchsia-50 text-fuchsia-600',
              },
              {
                icon: Upload,
                title: 'Import',
                desc: 'Drag-and-drop import for Excel spreadsheets, CSV files, scanned PDFs, and even photos of paper timesheets. OCR automatically extracts hours and employee data.',
                color: 'bg-red-50 text-red-600',
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-secondary-500 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark Feature Section — Automate Payroll */}
      <section className="bg-secondary-500 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-primary-500 uppercase mb-4">
                Automate Payroll
              </h2>
              <h3 className="text-2xl font-bold text-white uppercase mb-6">
                Get Paid Faster Without Manual Spreadsheets
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed mb-8">
                Do you spend hours (or days) processing payroll each month?
                With ServiceCore you can cut all that time down to 5 minutes.
                Generate payroll reports, track overtime, and export everything
                with just a few clicks — all without leaving ServiceCore.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-bold uppercase tracking-wide transition-colors flex items-center gap-2"
              >
                Learn More
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-white/5 rounded-xl p-8 border border-white/10">
              <div className="space-y-4">
                {[
                  'Automatic overtime calculation (1.5x and 2x rates)',
                  'PDF payroll reports with hours breakdown',
                  'Excel export for QuickBooks compatibility',
                  'Real-time labor cost tracking by project',
                  'OCR paper timesheet scanner',
                  'Configurable pay periods (weekly, bi-weekly, semi-monthly)',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span className="text-white">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Built for Field Service */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-secondary-500 uppercase mb-4">
            Built for Field Service Teams
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
            From drivers to office staff, ServiceCore handles operations for your entire portable sanitation crew.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                count: '18',
                label: 'Employees',
                desc: 'Drivers, service techs, and office staff all managed in one system',
              },
              {
                icon: MapPin,
                count: '50',
                label: 'Service Locations',
                desc: 'Construction sites, events, municipal contracts, and recurring routes',
              },
              {
                icon: Container,
                count: '20',
                label: 'Equipment Units',
                desc: 'Porta-johns, hand wash stations, and restroom trailers tracked and serviced',
              },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <item.icon className="w-10 h-10 text-primary-500 mx-auto mb-4" />
                <div className="text-3xl font-black text-secondary-500 mb-1">{item.count}</div>
                <div className="text-sm font-bold text-primary-500 uppercase mb-2">{item.label}</div>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-500 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-white p-2 rounded-lg">
              <Wrench className="w-8 h-8 text-primary-500" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase mb-4">
            Ready to Get Started with ServiceCore?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Try our live demo with pre-loaded data. No signup required.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-white hover:bg-gray-50 text-primary-600 px-10 py-4 rounded-lg text-lg font-bold uppercase tracking-wide transition-colors inline-flex items-center gap-2"
          >
            See ServiceCore in Action!
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-500 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Wrench className="w-6 h-6 text-primary-500" style={{ transform: 'rotate(-90deg)' }} />
              <span className="text-lg font-bold text-white">ServiceCore</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">
                Demo Login
              </button>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#about" className="hover:text-white transition-colors">About</a>
            </div>
            <p className="text-sm text-gray-500">
              &copy; 2026 ServiceCore. Demo Application.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
