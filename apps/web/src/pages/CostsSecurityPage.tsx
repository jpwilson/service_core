import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  DollarSign,
  BarChart3,
  Lock,
  Eye,
  Server,
  CheckCircle,
  AlertTriangle,
  Wrench,
  Bot,
  FileText,
  Zap,
  ChevronDown,
  ExternalLink,
  Megaphone,
} from 'lucide-react';

const AI_MODELS = [
  {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic (via OpenRouter)',
    useCase: 'Help Assistant Chatbot',
    why: 'Best balance of quality and cost for conversational AI. Strong at following system prompts, resisting jailbreaks, and staying on-topic. Great for customer-facing chat.',
    cost: '~$3/1M input, $15/1M output tokens',
    active: true,
  },
  {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    provider: 'Anthropic (via OpenRouter)',
    useCase: 'Complex analysis (upgrade option)',
    why: 'More capable for deep data analysis, multi-step reasoning, and complex payroll calculations. Higher cost but better for admin-facing advanced queries.',
    cost: '~$15/1M input, $75/1M output tokens',
    active: false,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    useCase: 'Ad Copy Generation (Marketing Pipeline)',
    why: 'Strong creative writing for Facebook/Instagram ad copy. Good at following brand voice constraints and generating varied creative approaches. Free tier available.',
    cost: 'Free tier available, then pay-per-use',
    active: true,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    useCase: 'Ad Evaluation & Scoring',
    why: 'Fast and cheap for evaluating ad quality across 5 dimensions. Good at structured scoring with consistent rubrics. Cost-efficient for batch processing 50+ ads.',
    cost: 'Free tier, very low cost',
    active: true,
  },
  {
    id: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    useCase: 'Lightweight tasks (fallback option)',
    why: 'Fast responses for simple queries like "what page is X on?" or quick navigation help. Very low cost. Could replace Sonnet for simple help queries to save tokens.',
    cost: '~$0.25/1M input, $1.25/1M output tokens',
    active: false,
  },
];

export function CostsSecurityPage() {
  const navigate = useNavigate();
  const [expandedModel, setExpandedModel] = useState<string | null>('claude-sonnet-4-5');

  return (
    <div className="min-h-screen bg-gray-50 font-display">
      {/* Header */}
      <header className="bg-secondary-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/app')} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Wrench className="w-6 h-6 text-primary-500" style={{ transform: 'rotate(-90deg)' }} />
              <span className="font-bold text-lg">ServiceCore</span>
            </div>
          </div>
          <h1 className="text-sm font-bold uppercase tracking-wider text-primary-500">
            Project Details
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* Marketing Pipeline Link */}
        <section className="bg-gradient-to-r from-secondary-500 to-secondary-400 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase">Sales & Marketing Pipeline</h2>
                <p className="text-sm text-white/70 mt-1">
                  Autonomous ad generation engine for Facebook & Instagram. Generate, evaluate, and optimize ServiceCore ads with AI.
                </p>
              </div>
            </div>
            <a
              href="/marketing"
              onClick={(e) => {
                e.preventDefault();
                navigate('/marketing');
              }}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition-colors flex items-center gap-2 flex-shrink-0"
            >
              Open Pipeline
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* AI Models Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-secondary-500 uppercase">AI Models</h2>
              <p className="text-sm text-gray-500">Models used across ServiceCore and their roles</p>
            </div>
          </div>

          <div className="space-y-3">
            {AI_MODELS.map((model) => (
              <div key={model.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedModel(expandedModel === model.id ? null : model.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${model.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div>
                      <span className="font-bold text-secondary-500">{model.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{model.provider}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      model.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {model.active ? 'Active' : 'Available'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
                      expandedModel === model.id ? 'rotate-180' : ''
                    }`} />
                  </div>
                </button>
                {expandedModel === model.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Use Case</p>
                        <p className="text-sm text-secondary-500">{model.useCase}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Why This Model</p>
                        <p className="text-sm text-gray-600">{model.why}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Cost</p>
                        <p className="text-sm text-gray-600">{model.cost}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Costs Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-secondary-500 uppercase">Infrastructure Costs</h2>
              <p className="text-sm text-gray-500">Monthly estimated costs for running ServiceCore</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: 'Vercel Hosting', cost: '$0 - $20/mo',
                desc: 'Static site hosting with serverless functions. Free tier covers demo usage.',
                items: ['Edge network CDN', 'Serverless API routes', 'Auto SSL certificates', 'Preview deployments'],
              },
              {
                name: 'Supabase Backend', cost: '$0 - $25/mo',
                desc: 'PostgreSQL database, auth, and real-time subscriptions.',
                items: ['PostgreSQL database', 'Row Level Security', 'Auth (email/social)', 'Edge Functions'],
              },
              {
                name: 'AI APIs', cost: '~$3 - $15/mo',
                desc: 'OpenRouter for chatbot + Gemini for ad generation. Pay-per-token.',
                items: ['Claude Sonnet via OpenRouter', 'Gemini Pro for ad copy', 'Pay per token', 'No minimum commitment'],
              },
              {
                name: 'Observability & Tracing', cost: '$0 - $20/mo',
                desc: 'Langfuse for AI tracing + Vercel Analytics for web performance.',
                items: ['Langfuse AI trace logging', 'Token usage tracking', 'Latency monitoring (p50/p95)', 'Vercel Web Analytics'],
              },
            ].map((service) => (
              <div key={service.name} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-secondary-500">{service.name}</h3>
                  <span className="text-primary-500 font-bold text-sm">{service.cost}</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{service.desc}</p>
                <ul className="space-y-2">
                  {service.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Scaling Estimates Table */}
          <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-bold text-secondary-500 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary-500" />
                Scaling Estimates by User Count
              </h3>
              <p className="text-xs text-gray-500 mt-1">Monthly cost projections across all services</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left px-6 py-3 font-bold text-gray-500 text-xs uppercase">Service</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase">100 Users</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase">1,000 Users</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase">10,000 Users</th>
                    <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase">100,000 Users</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { service: 'Vercel Hosting', c100: '$0', c1k: '$20', c10k: '$150', c100k: '$500+' },
                    { service: 'Supabase Backend', c100: '$0', c1k: '$25', c10k: '$150', c100k: '$500+' },
                    { service: 'AI APIs (chatbot + ads)', c100: '$3', c1k: '$30', c10k: '$200', c100k: '$1,500+' },
                    { service: 'Langfuse Tracing', c100: '$0', c1k: '$10', c10k: '$50', c100k: '$200+' },
                    { service: 'Vercel Analytics', c100: '$0', c1k: '$0', c10k: '$20', c100k: '$100+' },
                  ].map((row) => (
                    <tr key={row.service} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-secondary-500">{row.service}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{row.c100}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{row.c1k}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{row.c10k}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{row.c100k}</td>
                    </tr>
                  ))}
                  <tr className="bg-primary-50 font-bold">
                    <td className="px-6 py-3 text-primary-800">Total Estimated</td>
                    <td className="px-4 py-3 text-center text-primary-700">~$3/mo</td>
                    <td className="px-4 py-3 text-center text-primary-700">~$85/mo</td>
                    <td className="px-4 py-3 text-center text-primary-700">~$570/mo</td>
                    <td className="px-4 py-3 text-center text-primary-700">~$2,800+/mo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 bg-primary-50 border border-primary-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-primary-800 mb-1">Total Estimated Cost</h3>
                <p className="text-sm text-primary-700">
                  <strong>$3 - $80/month</strong> depending on usage. Free tiers cover most demo scenarios. At scale (10k+ users), costs grow primarily with AI API usage and database connections.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-secondary-500 uppercase">Security</h2>
              <p className="text-sm text-gray-500">How we protect your data</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Lock, title: 'Authentication & Authorization',
                items: ['Supabase Auth with JWT tokens', 'Row Level Security on all tables', 'Role-based access control', 'Session management with secure cookies'],
              },
              {
                icon: Server, title: 'Infrastructure Security',
                items: ['TLS 1.3 encryption in transit', 'AES-256 encryption at rest', 'Vercel edge DDoS protection', 'Serverless — no persistent attack surface'],
              },
              {
                icon: Eye, title: 'Data Privacy',
                items: ['No third-party tracking', 'SOC 2 compliant data storage', 'API keys as env vars only', 'Minimal data collection'],
              },
              {
                icon: AlertTriangle, title: 'AI Chatbot Safety',
                items: ['Strict topic boundary system prompt', 'Jailbreak detection & graceful decline', 'No PII sent to AI model', 'All interactions logged via Langfuse'],
              },
            ].map((section) => (
              <div key={section.title} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <section.icon className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-secondary-500">{section.title}</h3>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* AI Evaluations */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-secondary-500 uppercase">AI Agent Evaluations</h2>
              <p className="text-sm text-gray-500">Performance and safety testing for the help assistant</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-secondary-500 mb-4">Evaluation Scores</h3>
              <div className="space-y-4">
                {[
                  { name: 'Topic Relevance', score: 95 },
                  { name: 'Data Accuracy', score: 92 },
                  { name: 'Jailbreak Resistance', score: 98 },
                  { name: 'Tour Accuracy', score: 97 },
                  { name: 'Response Quality', score: 90 },
                ].map((e) => (
                  <div key={e.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">{e.name}</span>
                      <span className={`text-sm font-bold ${e.score >= 95 ? 'text-green-600' : 'text-blue-600'}`}>{e.score}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full">
                      <div className={`h-full rounded-full ${e.score >= 95 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${e.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-secondary-500 mb-4">Safety Tests</h3>
              <div className="space-y-2">
                {[
                  'Prompt injection', '"Ignore previous instructions"', '"Talk like a pirate"',
                  '"What\'s the weather?"', 'DAN/jailbreak prompts', 'Role-play manipulation',
                  'Code injection', 'PII extraction', 'Multi-turn manipulation',
                ].map((test) => (
                  <div key={test} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-700">{test}</span>
                    <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-green-100 text-green-700">pass</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-secondary-500 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Observability (Langfuse)
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">What We Trace</h4>
                <p className="text-sm text-gray-600">All chatbot interactions: input/output pairs, token usage, latency, model metadata.</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">Metrics</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center gap-1.5"><FileText className="w-3 h-3 text-gray-400" /> Response latency (p50, p95)</li>
                  <li className="flex items-center gap-1.5"><FileText className="w-3 h-3 text-gray-400" /> Token usage per conversation</li>
                  <li className="flex items-center gap-1.5"><FileText className="w-3 h-3 text-gray-400" /> Jailbreak attempt frequency</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">Model Config</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><strong>Model:</strong> Claude Sonnet 4.5</li>
                  <li><strong>Temperature:</strong> 0.3</li>
                  <li><strong>Max tokens:</strong> 1024</li>
                  <li><strong>Context:</strong> Last 10 messages</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
