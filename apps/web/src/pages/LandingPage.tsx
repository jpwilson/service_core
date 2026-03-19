import { useNavigate } from 'react-router-dom';
import {
  Clock,
  BarChart3,
  Shield,
  Users,
  FileCheck,
  Zap,
  ArrowRight,
  Wrench,
  CheckCircle,
  Phone,
  Mail,
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
          <button
            onClick={() => navigate('/login')}
            className="border border-primary-500 text-primary-500 px-4 py-1 rounded text-xs font-bold uppercase hover:bg-primary-500 hover:text-white transition-colors"
          >
            Customer Login
          </button>
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
              <span className="text-primary-500">The Ultimate</span>
              <br />
              Employee Time Tracking
              <br />
              <span className="text-primary-500">Software</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
              Make your portable toilet, septic, or roll-off business more efficient.
              Cut wasted time on payroll, manage employee hours, automate overtime calculations,
              and generate reports. All with one tool built for field service companies.
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
            { value: '4-6 hrs', label: 'Saved Weekly on Payroll' },
            { value: '99.9%', label: 'Calculation Accuracy' },
            { value: '18', label: 'Employees Managed' },
            { value: '24/7', label: 'Real-Time Visibility' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-white">{stat.value}</div>
              <div className="text-sm text-white/80 font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-secondary-500 uppercase mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ServiceCore automates your entire employee time tracking and payroll workflow,
              saving hours of manual spreadsheet work every week.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: 'Employee Time Clock',
                desc: 'Simple clock in/out with project and task selection. GPS location tracking and automatic break deductions.',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                icon: Zap,
                title: 'Automatic Overtime',
                desc: 'Calculates overtime based on your 40-hour work week rules. Daily and weekly thresholds with configurable multipliers.',
                color: 'bg-orange-50 text-orange-600',
              },
              {
                icon: FileCheck,
                title: 'Manager Approvals',
                desc: 'Streamlined timesheet approval workflow. Managers review, approve, or reject submissions with one click.',
                color: 'bg-green-50 text-green-600',
              },
              {
                icon: BarChart3,
                title: 'Real-Time Dashboard',
                desc: 'See current logged hours, project time allocation, attendance patterns, and labor costs at a glance.',
                color: 'bg-purple-50 text-purple-600',
              },
              {
                icon: Mail,
                title: 'Email Reminders',
                desc: 'Automated reminders for timesheet submissions. Never chase employees for their hours again.',
                color: 'bg-red-50 text-red-600',
              },
              {
                icon: Shield,
                title: 'Payroll Reports',
                desc: 'Generate PDF reports with hours breakdown and gross pay calculations. Export to Excel for your accountant.',
                color: 'bg-cyan-50 text-cyan-600',
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

      {/* Dark Feature Section */}
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

      {/* Team Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-secondary-500 uppercase mb-4">
            Built for Field Service Teams
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
            From drivers to office staff, ServiceCore handles time tracking for your entire crew.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                count: '18',
                label: 'Employees Tracked',
                desc: 'Drivers, service crew, and office staff all in one system',
              },
              {
                icon: BarChart3,
                count: '7',
                label: 'Active Projects',
                desc: 'Construction sites, events, municipal contracts, and more',
              },
              {
                icon: Clock,
                count: '30 days',
                label: 'Historical Data',
                desc: 'Full month of time entries with attendance patterns',
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
