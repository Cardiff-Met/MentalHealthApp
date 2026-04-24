import { useState, useEffect } from 'react';
import { useAuth } from '@/context';
import Card from '@/components/Card';
import ErrorBanner from '@/components/ErrorBanner';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  {
    key: 'crisis',
    label: 'Crisis',
    icon: '🆘',
    chip: 'bg-red-100 text-red-700 border-red-200',
    active: 'bg-red-600 text-white',
  },
  {
    key: 'anxiety',
    label: 'Anxiety',
    icon: '😰',
    chip: 'bg-amber-100 text-amber-700 border-amber-200',
    active: 'bg-amber-500 text-white',
  },
  {
    key: 'self-help',
    label: 'Self-help',
    icon: '📖',
    chip: 'bg-blue-100 text-blue-700 border-blue-200',
    active: 'bg-blue-600 text-white',
  },
  {
    key: 'mindfulness',
    label: 'Mindfulness',
    icon: '🧘',
    chip: 'bg-teal-100 text-teal-700 border-teal-200',
    active: 'bg-teal-600 text-white',
  },
  {
    key: 'general',
    label: 'General',
    icon: '💚',
    chip: 'bg-slate-100 text-slate-600 border-slate-200',
    active: 'bg-slate-600 text-white',
  },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.slice(1).map((c) => [c.key, c]));

function parseCategories(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return [raw];
    }
  }
  return [];
}

function CategoryTag({ cat }) {
  const meta = CAT_MAP[cat];
  if (!meta) return null;
  return (
    <span
      className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${meta.chip}`}
    >
      {meta.icon} {meta.label}
    </span>
  );
}

export default function ResourcesPage() {
  const { authFetch } = useAuth();
  const [resources, setResources] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('all');
  const [showSaved, setShowSaved] = useState(false);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [resAll, resSaved] = await Promise.all([
          authFetch('/api/resources'),
          authFetch('/api/resources/saved'),
        ]);

        if (!resAll.ok) {
          const d = await resAll.json();
          setError(d.error || 'Failed to load resources.');
          return;
        }

        const dataAll = await resAll.json();
        setResources(dataAll.resources ?? []);

        if (resSaved.ok) {
          const dataSaved = await resSaved.json();
          setSavedIds(new Set((dataSaved.resources ?? []).map((r) => r.id)));
        }
      } catch {
        setError('Could not connect to server. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [authFetch]);

  async function toggleSave(id) {
    setSavingId(id);
    const isSaved = savedIds.has(id);
    try {
      const res = await authFetch(`/api/resources/${id}/save`, {
        method: isSaved ? 'DELETE' : 'POST',
      });
      if (res.ok) {
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (isSaved) next.delete(id);
          else next.add(id);
          return next;
        });
      }
    } catch {
      // silently ignore
    } finally {
      setSavingId(null);
    }
  }

  const displayed = resources.filter((r) => {
    if (showSaved && !savedIds.has(r.id)) return false;
    if (category !== 'all') {
      const cats = parseCategories(r.categories);
      if (!cats.includes(category)) return false;
    }
    return true;
  });

  if (loading) return <LoadingSpinner message="Loading resources…" />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Mental Health Resources
        </h1>
        <p className="text-slate-500 mt-1">
          All resources are free and confidential.
        </p>
      </div>

      <ErrorBanner message={error} className="mb-6" />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={() => {
            setCategory('all');
            setShowSaved(false);
          }}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            category === 'all' && !showSaved
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          All
        </button>
        {CATEGORIES.slice(1).map(({ key, label, icon, active }) => (
          <button
            key={key}
            onClick={() => {
              setCategory(key);
              setShowSaved(false);
            }}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              category === key && !showSaved
                ? `${active} border-transparent shadow-sm`
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span className="mr-1">{icon}</span>
            {label}
          </button>
        ))}
        <button
          onClick={() => {
            setShowSaved(true);
            setCategory('all');
          }}
          className={`ml-auto px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            showSaved
              ? 'bg-green-600 text-white border-green-600 shadow-sm'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          🔖 Saved ({savedIds.size})
        </button>
      </div>

      {/* Resource grid */}
      {displayed.length === 0 ? (
        <EmptyState
          icon={showSaved ? '🔖' : '📭'}
          title={showSaved ? 'No saved resources' : 'No resources found'}
          message={
            showSaved
              ? 'Save resources from the list to find them here quickly.'
              : 'Try a different category.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayed.map((resource) => {
            const cats = parseCategories(resource.categories);
            return (
              <Card key={resource.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-800 text-base">
                    {resource.title}
                  </h3>
                </div>
                {cats.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {cats.map((cat) => (
                      <CategoryTag key={cat} cat={cat} />
                    ))}
                  </div>
                )}
                <p className="text-sm text-slate-500 flex-1 mb-4">
                  {resource.description}
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Visit resource
                  </a>
                  <button
                    onClick={() => toggleSave(resource.id)}
                    disabled={savingId === resource.id}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-60 ${
                      savedIds.has(resource.id)
                        ? 'border-green-300 bg-green-50 text-green-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {savedIds.has(resource.id) ? '✓ Saved' : 'Save'}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
