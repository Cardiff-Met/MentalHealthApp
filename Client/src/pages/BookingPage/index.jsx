import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';

const FILTERS = ['all', 'morning', 'afternoon', 'evening'];

const TIME_ICONS = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌙',
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const display = hour > 12 ? hour - 12 : hour || 12;
  return `${display}:${m} ${ampm}`;
}

export default function BookingPage() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [bookingStatus, setBookingStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { authFetch } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSlots() {
      try {
        const res = await authFetch('/api/booking/slots');
        const data = await res.json();
        if (!res.ok) {
          setError(data.error);
          return;
        }
        setSlots(data.slots);
      } catch {
        setError('Could not load available slots.');
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, [authFetch]);

  async function handleBook(slotId) {
    setSubmitting(true);
    setError('');
    try {
      const res = await authFetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setBookingStatus(data);
    } catch {
      setError('Could not submit booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredSlots =
    filter === 'all' ? slots : slots.filter((s) => s.time_of_day === filter);

  // Booking confirmation
  if (bookingStatus) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-5">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Booking request submitted
        </h2>
        <p className="text-slate-500 mb-8">
          Your request is now{' '}
          <span className="font-semibold text-amber-600">pending</span>. We'll
          notify you once it's confirmed by the wellbeing team.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-800 mb-8">
          Please check your email for updates on your appointment.
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-colors"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading available slots…</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Book a Therapy Session
        </h1>
        <p className="text-slate-500 mt-1">
          Select an available slot to request an appointment.
        </p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {f !== 'all' && <span className="mr-1.5">{TIME_ICONS[f]}</span>}
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Slot list */}
      {filteredSlots.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">No slots available for this time period.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSlots.map((slot) => (
            <div
              key={slot.id}
              className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-xl">
                  {TIME_ICONS[slot.time_of_day] || '📅'}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {formatDate(slot.slot_date)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatTime(slot.slot_time)} ·{' '}
                    <span className="capitalize">{slot.time_of_day}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleBook(slot.id)}
                disabled={submitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {submitting ? 'Booking…' : 'Request'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
