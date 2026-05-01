import { useNavigate } from 'react-router-dom';
import Card from '@/components/Card';
import Button from '@/components/Button';

const features = [
  {
    icon: '😊',
    title: 'Record Your Mood',
    description:
      'Track how you feel each day and get personalised resource recommendations based on your mood.',
    action: '/mood',
    label: 'Log mood',
    colour: 'bg-indigo-50 border-indigo-100',
    iconBg: 'bg-indigo-100',
    btnVariant: 'primary',
  },
  {
    icon: '📚',
    title: 'Browse Resources',
    description:
      'Explore free, confidential mental health resources curated for Cardiff Met students.',
    action: '/resources',
    label: 'View resources',
    colour: 'bg-teal-50 border-teal-100',
    iconBg: 'bg-teal-100',
    btnVariant: 'teal',
  },
  {
    icon: '📅',
    title: 'Book a Session',
    description:
      'Request a therapy appointment with the Cardiff Met student wellbeing team.',
    action: '/booking',
    label: 'Book now',
    colour: 'bg-purple-50 border-purple-100',
    iconBg: 'bg-purple-100',
    btnVariant: 'purple',
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
        <p className="text-slate-500 mt-1">How can we support you today?</p>
      </div>

      {/* Crisis banner */}
      <div
        role="alert"
        className="mb-8 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4"
      >
        <span className="text-xl mt-0.5" aria-hidden="true">
          🆘
        </span>
        <div>
          <p className="text-sm font-semibold text-red-800">
            In crisis right now?
          </p>
          <p className="text-sm text-red-700 mt-0.5">
            Call <strong>Samaritans 116 123</strong> (free, 24/7) · NHS 111
            option 2 ·{' '}
            <a
              href="https://www.cardiffmet.ac.uk/wellbeing"
              target="_blank"
              rel="noreferrer"
              className="underline font-medium"
            >
              Cardiff Met Wellbeing
            </a>
          </p>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {features.map((f) => (
          <div
            key={f.title}
            className={`rounded-2xl border p-6 flex flex-col ${f.colour}`}
          >
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-2xl mb-4 ${f.iconBg}`}
              aria-hidden="true"
            >
              {f.icon}
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              {f.title}
            </h2>
            <p className="text-sm text-slate-600 flex-1">{f.description}</p>
            <Button
              onClick={() => navigate(f.action)}
              className="mt-5 w-full"
              variant={f.btnVariant}
            >
              {f.label}
            </Button>
          </div>
        ))}
      </div>

      {/* Mood history link */}
      <div className="mt-8 text-center">
        <button
          onClick={() => navigate('/mood/history')}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium underline-offset-2 hover:underline transition-colors"
        >
          View your mood history →
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 mt-6">
        All information you share is kept private and secure.
      </p>
    </div>
  );
}
