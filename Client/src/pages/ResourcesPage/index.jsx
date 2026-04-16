import { useState, useEffect } from 'react';
import { useAuth } from '@/context';

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState([]);

  const { authFetch } = useAuth();

  useEffect(() => {
    async function fetchResources() {
      try {
        const res = await authFetch('/api/resources');
        const data = await res.json();
        if (!res.ok) {
          setError(data.error);
          return;
        }
        setResources(data.resources);
      } catch {
        setError('Could not load resources.');
      } finally {
        setLoading(false);
      }
    }
    fetchResources();
  }, [authFetch]);

  function handleSave(id) {
    if (saved.includes(id)) return;
    setSaved([...saved, id]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading resources…</p>
        </div>
      </div>
    );
  }

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

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col"
          >
            <h3 className="font-semibold text-slate-800 text-base mb-2">
              {resource.title}
            </h3>
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
                onClick={() => handleSave(resource.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  saved.includes(resource.id)
                    ? 'border-green-300 bg-green-50 text-green-700'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                }`}
              >
                {saved.includes(resource.id) ? '✓ Saved' : 'Save'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {resources.length === 0 && !error && (
        <p className="text-center text-slate-400 py-16">
          No resources available right now.
        </p>
      )}
    </div>
  );
}
