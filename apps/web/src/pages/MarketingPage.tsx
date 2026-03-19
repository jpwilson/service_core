import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wrench,
  Megaphone,
  Play,
  RefreshCw,
  Star,
  BarChart3,
  Filter,
  Download,
  Loader2,
  Facebook,
  Instagram,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Target,
  TrendingUp,
  Eye,
} from 'lucide-react';

interface GeneratedAd {
  id: string;
  primaryText: string;
  headline: string;
  description: string;
  cta: string;
  audience: string;
  goal: string;
  scores: {
    clarity: number;
    valueProposition: number;
    callToAction: number;
    brandVoice: number;
    emotionalResonance: number;
  };
  avgScore: number;
  iteration: number;
  platform: 'facebook' | 'instagram';
}

const AUDIENCES = [
  'Small Business Owners (Portable Sanitation)',
  'Operations Managers (Field Service)',
  'HR Directors (Construction/Events)',
  'Fleet Managers',
  'Event Planners',
];

const GOALS = [
  'Brand Awareness',
  'Lead Generation',
  'Free Trial Signups',
  'Demo Requests',
  'Feature Highlight',
];

const SAMPLE_ADS: GeneratedAd[] = [
  {
    id: 'ad-001',
    primaryText: 'Still tracking employee hours on spreadsheets? Your HR team is spending 4-6 hours EVERY WEEK on payroll that ServiceCore handles in 5 minutes. Real-time GPS tracking, automatic overtime calculations, and one-click payroll reports.',
    headline: 'Cut Payroll Time by 90%',
    description: 'Time tracking built for field service teams. Free demo available.',
    cta: 'Get Started',
    audience: 'Small Business Owners (Portable Sanitation)',
    goal: 'Lead Generation',
    scores: { clarity: 9, valueProposition: 9, callToAction: 8, brandVoice: 8, emotionalResonance: 7 },
    avgScore: 8.2,
    iteration: 3,
    platform: 'facebook',
  },
  {
    id: 'ad-002',
    primaryText: '"We used to lose 2 hours every Friday reconciling timesheets. Now it\'s automatic." See why 50+ portable sanitation companies switched to ServiceCore for employee time tracking.',
    headline: 'Your Drivers Deserve Better Than Paper Timesheets',
    description: 'GPS clock-in, overtime alerts, payroll reports. All in one app.',
    cta: 'See It In Action',
    audience: 'Operations Managers (Field Service)',
    goal: 'Demo Requests',
    scores: { clarity: 8, valueProposition: 9, callToAction: 9, brandVoice: 9, emotionalResonance: 8 },
    avgScore: 8.6,
    iteration: 2,
    platform: 'facebook',
  },
  {
    id: 'ad-003',
    primaryText: 'Your field crew clocks in from their phone. GPS confirms they\'re on site. Overtime calculates automatically. Payroll report generates in one click. That\'s ServiceCore.',
    headline: 'Time Tracking That Actually Works in the Field',
    description: 'Built for portable sanitation, septic, and roll-off businesses.',
    cta: 'Start Free Trial',
    audience: 'Small Business Owners (Portable Sanitation)',
    goal: 'Free Trial Signups',
    scores: { clarity: 9, valueProposition: 8, callToAction: 8, brandVoice: 9, emotionalResonance: 7 },
    avgScore: 8.2,
    iteration: 1,
    platform: 'instagram',
  },
  {
    id: 'ad-004',
    primaryText: 'How much is payroll chaos costing you? Late timesheets. Overtime surprises. Manual calculation errors. ServiceCore eliminates all three with automated time tracking built for field service.',
    headline: 'Stop Losing Money on Manual Timesheets',
    description: 'Join companies saving 4+ hours weekly on payroll processing.',
    cta: 'Learn More',
    audience: 'HR Directors (Construction/Events)',
    goal: 'Brand Awareness',
    scores: { clarity: 8, valueProposition: 9, callToAction: 7, brandVoice: 8, emotionalResonance: 9 },
    avgScore: 8.2,
    iteration: 2,
    platform: 'facebook',
  },
];

export function MarketingPage() {
  const navigate = useNavigate();
  const [ads, setAds] = useState<GeneratedAd[]>(SAMPLE_ADS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [filterScore, setFilterScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const qualityThreshold = 7.0;
  const publishableAds = ads.filter((ad) => ad.avgScore >= qualityThreshold);
  const avgQuality = ads.length > 0 ? ads.reduce((sum, ad) => sum + ad.avgScore, 0) / ads.length : 0;

  const generateAds = useCallback(async () => {
    setIsGenerating(true);

    // Simulate AI generation with a delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const audience = selectedAudience || AUDIENCES[Math.floor(Math.random() * AUDIENCES.length)];
    const goal = selectedGoal || GOALS[Math.floor(Math.random() * GOALS.length)];

    const newAds: GeneratedAd[] = [
      {
        id: `ad-${Date.now()}-1`,
        primaryText: `Is your team still using paper timesheets in ${new Date().getFullYear()}? ServiceCore gives your drivers a one-tap mobile clock-in with GPS verification. No more guessing who was where, when. Real-time dashboards show you exactly where your labor dollars go.`,
        headline: 'Ditch the Paper. Track Time Smarter.',
        description: 'Mobile time tracking with GPS, overtime alerts, and instant payroll reports.',
        cta: goal.includes('Trial') ? 'Start Free Trial' : goal.includes('Demo') ? 'Book a Demo' : 'Learn More',
        audience,
        goal,
        scores: {
          clarity: 7 + Math.round(Math.random() * 3),
          valueProposition: 7 + Math.round(Math.random() * 3),
          callToAction: 7 + Math.round(Math.random() * 3),
          brandVoice: 7 + Math.round(Math.random() * 3),
          emotionalResonance: 6 + Math.round(Math.random() * 3),
        },
        avgScore: 0,
        iteration: 1,
        platform: Math.random() > 0.5 ? 'facebook' : 'instagram',
      },
      {
        id: `ad-${Date.now()}-2`,
        primaryText: `"I used to spend my entire Friday on payroll. Now I click one button." ServiceCore automates overtime calculations, break deductions, and payroll reports for portable sanitation companies. Your drivers clock in from the field. You get real-time visibility.`,
        headline: 'Payroll Friday Just Got a Lot Shorter',
        description: 'Automated time tracking and payroll for field service teams.',
        cta: 'See How It Works',
        audience,
        goal,
        scores: {
          clarity: 8 + Math.round(Math.random() * 2),
          valueProposition: 8 + Math.round(Math.random() * 2),
          callToAction: 7 + Math.round(Math.random() * 3),
          brandVoice: 8 + Math.round(Math.random() * 2),
          emotionalResonance: 7 + Math.round(Math.random() * 3),
        },
        avgScore: 0,
        iteration: 1,
        platform: Math.random() > 0.5 ? 'facebook' : 'instagram',
      },
    ];

    // Calculate average scores
    newAds.forEach((ad) => {
      const scores = Object.values(ad.scores);
      ad.avgScore = Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10;
    });

    setAds((prev) => [...newAds, ...prev]);
    setIsGenerating(false);
  }, [selectedAudience, selectedGoal]);

  const filteredAds = ads.filter((ad) => {
    if (filterScore > 0 && ad.avgScore < filterScore) return false;
    if (selectedAudience && ad.audience !== selectedAudience) return false;
    if (selectedGoal && ad.goal !== selectedGoal) return false;
    return true;
  });

  const ScoreBadge = ({ score }: { score: number }) => (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
      score >= 9 ? 'bg-green-100 text-green-700' :
      score >= 7 ? 'bg-blue-100 text-blue-700' :
      'bg-yellow-100 text-yellow-700'
    }`}>
      {score}
    </span>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-display">
      {/* Header */}
      <header className="bg-secondary-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/costs')} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Wrench className="w-6 h-6 text-primary-500" style={{ transform: 'rotate(-90deg)' }} />
              <span className="font-bold text-lg">ServiceCore</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary-500" />
            <h1 className="text-sm font-bold uppercase tracking-wider text-primary-500">
              Ad Generation Pipeline
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Target, label: 'Total Ads', value: ads.length.toString(), color: 'text-blue-600' },
            { icon: Star, label: 'Publishable (7.0+)', value: publishableAds.length.toString(), color: 'text-green-600' },
            { icon: TrendingUp, label: 'Avg Quality', value: avgQuality.toFixed(1), color: 'text-primary-500' },
            { icon: Eye, label: 'Pass Rate', value: `${ads.length > 0 ? Math.round((publishableAds.length / ads.length) * 100) : 0}%`, color: 'text-purple-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-black text-secondary-500">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedAudience}
              onChange={(e) => setSelectedAudience(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Audiences</option>
              {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>

            <select
              value={selectedGoal}
              onChange={(e) => setSelectedGoal(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Goals</option>
              {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <div className="flex-1" />

            <button
              onClick={generateAds}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-5 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-colors disabled:opacity-60"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Play className="w-4 h-4" /> Generate Ads</>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4">
              <label className="text-sm text-gray-600">Min Score:</label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={filterScore}
                onChange={(e) => setFilterScore(Number(e.target.value))}
                className="flex-1 max-w-xs"
              />
              <span className="text-sm font-bold text-secondary-500">{filterScore > 0 ? filterScore.toFixed(1) : 'All'}</span>
            </div>
          )}
        </div>

        {/* Ad Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-secondary-500">{filteredAds.length} Ads</h2>
            <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-secondary-500">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {filteredAds.map((ad) => (
            <div key={ad.id} className={`bg-white rounded-xl border p-5 ${
              ad.avgScore >= qualityThreshold ? 'border-gray-200' : 'border-yellow-300 bg-yellow-50/30'
            }`}>
              <div className="flex items-start justify-between gap-4">
                {/* Ad Preview */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {ad.platform === 'facebook' ? (
                      <Facebook className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Instagram className="w-4 h-4 text-pink-600" />
                    )}
                    <span className="text-xs text-gray-400 uppercase">{ad.platform}</span>
                    <span className="text-xs text-gray-300">|</span>
                    <span className="text-xs text-gray-400">{ad.audience}</span>
                    <span className="text-xs text-gray-300">|</span>
                    <span className="text-xs text-gray-400">{ad.goal}</span>
                    <span className="text-xs text-gray-300">|</span>
                    <span className="text-xs text-gray-400">Iter {ad.iteration}</span>
                  </div>

                  {/* Mock Ad Card */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden max-w-lg">
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                          <Wrench className="w-4 h-4 text-white" style={{ transform: 'rotate(-90deg)' }} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold">ServiceCore</p>
                          <p className="text-[10px] text-gray-400">Sponsored</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed">{ad.primaryText}</p>
                    </div>
                    <div className="bg-gray-100 h-32 flex items-center justify-center text-gray-400 text-sm">
                      [Ad Creative Image]
                    </div>
                    <div className="px-4 py-2 border-t border-gray-200">
                      <p className="font-bold text-sm text-secondary-500">{ad.headline}</p>
                      <p className="text-xs text-gray-500">{ad.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-400">servicecore.com</span>
                        <span className="text-xs font-bold text-primary-500 bg-primary-50 px-3 py-1 rounded">{ad.cta}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scores */}
                <div className="w-48 flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-2xl font-black ${
                      ad.avgScore >= 8.5 ? 'text-green-600' :
                      ad.avgScore >= 7.0 ? 'text-blue-600' : 'text-yellow-600'
                    }`}>
                      {ad.avgScore}
                    </span>
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded hover:bg-green-50"><ThumbsUp className="w-3.5 h-3.5 text-gray-400" /></button>
                      <button className="p-1.5 rounded hover:bg-red-50"><ThumbsDown className="w-3.5 h-3.5 text-gray-400" /></button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Clarity', score: ad.scores.clarity },
                      { label: 'Value Prop', score: ad.scores.valueProposition },
                      { label: 'CTA', score: ad.scores.callToAction },
                      { label: 'Brand Voice', score: ad.scores.brandVoice },
                      { label: 'Emotion', score: ad.scores.emotionalResonance },
                    ].map((dim) => (
                      <div key={dim.label} className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-500">{dim.label}</span>
                        <ScoreBadge score={dim.score} />
                      </div>
                    ))}
                  </div>
                  {ad.avgScore < qualityThreshold && (
                    <button className="mt-3 w-full flex items-center justify-center gap-1 text-xs font-bold text-primary-500 bg-primary-50 py-1.5 rounded-lg hover:bg-primary-100">
                      <RefreshCw className="w-3 h-3" />
                      Regenerate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quality Dimensions Reference */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-secondary-500 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary-500" />
            Quality Scoring Dimensions
          </h3>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { name: 'Clarity', desc: 'Message understandable in <3 seconds' },
              { name: 'Value Proposition', desc: 'Compelling, specific benefit communicated' },
              { name: 'Call to Action', desc: 'Clear, urgent, low-friction next step' },
              { name: 'Brand Voice', desc: 'Sounds like ServiceCore: expert, approachable' },
              { name: 'Emotional Resonance', desc: 'Taps into real pain points and motivations' },
            ].map((d) => (
              <div key={d.name} className="text-center">
                <p className="text-sm font-bold text-secondary-500 mb-1">{d.name}</p>
                <p className="text-xs text-gray-500">{d.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Quality threshold: <strong className="text-primary-500">7.0/10</strong> average to be considered publishable.
              Ads below threshold are flagged for regeneration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
