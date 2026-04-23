import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';

const MOODS = [
  { rating: 1, emoji: '😔', label: 'Very low' },
  { rating: 2, emoji: '😟', label: 'Low' },
  { rating: 3, emoji: '😐', label: 'Okay' },
  { rating: 4, emoji: '🙂', label: 'Good' },
  { rating: 5, emoji: '😄', label: 'Great' },
];

export default function MoodPage() {
  const [rating, setRating] = useState(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const { authFetch } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!rating) {
      setError('Please select a mood rating.');
      return;
    }

    setLoading(true);

    try {
      const res = await authFetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setResult(data);
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Crisis panel
  if (result?.isCrisis) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🆘</span>
            <h2 className="text-xl font-bold text-red-800">
              Immediate Support Available
            </h2>
          </div>
          <p className="text-red-700 mb-6">
            It sounds like you're going through a really difficult time. You
            don't have to face this alone — please reach out right now.
          </p>
          <ul className="space-y-3 mb-6">
            {[
              {
                label: 'Samaritans',
                detail: '116 123 — free, 24/7',
                href: 'tel:116123',
              },
              {
                label: 'NHS Urgent Mental Health',
                detail: '111 then option 2',
                href: 'tel:111',
              },
              {
                label: 'Cardiff Met Wellbeing',
                detail: 'cardiffmet.ac.uk/wellbeing',
                href: 'https://www.cardiffmet.ac.uk/wellbeing',
              },
            ].map((c) => (
              <li
                key={c.label}
                className="flex items-center gap-3 bg-white border border-red-200 rounded-xl px-4 py-3"
              >
                <span className="text-red-500 text-lg">📞</span>
                <div>
                  <span className="font-semibold text-slate-800">
                    {c.label}
                  </span>
                  <span className="text-slate-500 text-sm ml-2">
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {c.detail}
                    </a>
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setResult(null)}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            I understand — show me resources
          </button>
        </div>
      </div>
    );
  }

  // Results view
  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">
            ✓
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Mood logged</h2>
            <p className="text-sm text-slate-500">
              Here are some resources that might help today.
            </p>
          </div>
        </div>

        {result.resources?.length > 0 ? (
          <div className="space-y-4 mb-6">
            {result.resources.map((resource) => (
              <div
                key={resource.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-800 mb-1">
                  {resource.title}
                </h3>
                <p className="text-sm text-slate-500 mb-3">
                  {resource.description}
                </p>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Visit resource →
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 mb-6">
            No specific resources at this time.
          </p>
        )}

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-colors"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  // Mood input form
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          How are you feeling?
        </h1>
        <p className="text-slate-500 mt-1">
          Take a moment to check in with yourself.
        </p>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Mood selector */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-5">
          <label className="block text-sm font-semibold text-slate-700 mb-4">
            Select your mood
          </label>
          <div className="grid grid-cols-5 gap-3">
            {MOODS.map(({ rating: r, emoji, label }) => (
              <button
                key={r}
                type="button"
                onClick={() => setRating(r)}
                className={`flex flex-col items-center gap-1.5 py-4 rounded-xl border-2 transition-all ${
                  rating === r
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-3xl">{emoji}</span>
                <span
                  className={`text-xs font-medium ${rating === r ? 'text-indigo-600' : 'text-slate-500'}`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Anything you'd like to add?{' '}
            <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="What's on your mind today?"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
        >
          {loading ? 'Saving…' : 'Submit mood'}
        </button>
      </form>

      <button
        onClick={() => navigate('/dashboard')}
        className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        ← Back to dashboard
      </button>
    </div>
  );
}
