import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useAuth } from '@/context';
import Card from '@/components/Card';
import ErrorBanner from '@/components/ErrorBanner';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';
import { useNavigate } from 'react-router-dom';

const MOOD_EMOJI = { 1: '😔', 2: '😟', 3: '😐', 4: '🙂', 5: '😄' };
const MOOD_LABEL = {
  1: 'Very low',
  2: 'Low',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

// Custom tooltip for the chart
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const rating = payload[0].value;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-medium text-slate-700">{label}</p>
      <p className="text-indigo-600 font-semibold">
        {MOOD_EMOJI[rating]} {MOOD_LABEL[rating]} ({rating}/5)
      </p>
    </div>
  );
}

export default function MoodHistoryPage() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await authFetch('/api/mood/history');
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Failed to load mood history.');
          return;
        }
        const data = await res.json();
        setLogs(data.logs ?? []);
      } catch {
        setError('Could not connect to server. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [authFetch]);

  // Prepare chart data — last 30 entries oldest→newest
  const chartData = [...logs]
    .slice(0, 30)
    .reverse()
    .map((log) => ({
      date: formatDate(log.created_at),
      rating: log.rating,
    }));

  if (loading) return <LoadingSpinner message="Loading your mood history…" />;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mood history</h1>
          <p className="text-slate-500 mt-1">
            Your last 30 check-ins at a glance.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/mood')}>
          + Log mood
        </Button>
      </div>

      <ErrorBanner message={error} className="mb-6" />

      {logs.length === 0 && !error ? (
        <EmptyState
          icon="📊"
          title="No mood logs yet"
          message="Start tracking your mood to see your history here."
          action={
            <Button onClick={() => navigate('/mood')}>
              Log your first mood
            </Button>
          }
        />
      ) : (
        <>
          {/* Trend chart */}
          {chartData.length > 1 && (
            <Card className="mb-6">
              <h2 className="text-base font-semibold text-slate-700 mb-4">
                30-day trend
              </h2>
              <div aria-label="Line chart of mood ratings over time">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 4, right: 8, bottom: 4, left: -20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[1, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="rating"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#4f46e5', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Log list */}
          <div className="space-y-3">
            {logs.map((log) => (
              <Card key={log.id} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl">
                  {MOOD_EMOJI[log.rating]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-800">
                      {MOOD_LABEL[log.rating]}
                      <span className="ml-1 text-slate-400 font-normal">
                        ({log.rating}/5)
                      </span>
                    </span>
                    <span className="text-xs text-slate-400 shrink-0">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  {log.description && (
                    <p className="mt-1 text-sm text-slate-500 truncate">
                      {log.description}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
