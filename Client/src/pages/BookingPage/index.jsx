import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ErrorBanner from '@/components/ErrorBanner';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

const SLOT_FILTERS = ['all', 'morning', 'afternoon', 'evening'];

const TIME_ICONS = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌙',
};

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  declined: 'bg-red-50 text-red-700 border-red-200',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  // Ensure MySQL "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS" parse correctly
  const safe = String(dateStr).replace(' ', 'T');
  const date = new Date(safe);
  if (isNaN(date)) return '—';
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const display = hour > 12 ? hour - 12 : hour || 12;
  return `${display}:${m} ${ampm}`;
}

// ─── Book a Session tab ───────────────────────────────────────────────────────

function BookingTab({ authFetch, onBooked }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);

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
      onBooked(data);
    } catch {
      setError('Could not submit booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const filteredSlots =
    filter === 'all' ? slots : slots.filter((s) => s.time_of_day === filter);

  if (loading) return <LoadingSpinner message="Loading available slots…" />;

  return (
    <>
      <ErrorBanner message={error} className="mb-6" />

      {/* Time-of-day filter chips */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {SLOT_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
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

      {filteredSlots.length === 0 ? (
        <EmptyState
          icon="📭"
          title="No slots available"
          message="No slots available for this time period. Try a different filter."
        />
      ) : (
        <div className="space-y-3">
          {filteredSlots.map((slot) => (
            <Card
              key={slot.id}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-xl shrink-0">
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
              <Button
                size="sm"
                onClick={() => handleBook(slot.id)}
                disabled={submitting}
              >
                {submitting ? 'Booking…' : 'Request'}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

// ─── My Bookings tab ─────────────────────────────────────────────────────────

function MyBookingsTab({ authFetch }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await authFetch('/api/booking/my');
        const data = await res.json();
        if (!res.ok) {
          setError(data.error);
          return;
        }
        setBookings(data.bookings ?? []);
      } catch {
        setError('Could not load your bookings.');
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, [authFetch]);

  async function handleCancel(id) {
    setCancellingId(id);
    setError('');
    try {
      const res = await authFetch(`/api/booking/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== id));
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch {
      setError('Could not cancel booking. Please try again.');
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) return <LoadingSpinner message="Loading your bookings…" />;

  return (
    <>
      <ErrorBanner message={error} className="mb-6" />
      {bookings.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No bookings yet"
          message="Your booked therapy sessions will appear here once you've made a request."
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card
              key={booking.id}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-xl shrink-0">
                  {TIME_ICONS[booking.time_of_day] || '📅'}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {formatDate(booking.slot_date)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatTime(booking.slot_time)} ·{' '}
                    <span className="capitalize">{booking.time_of_day}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${
                    STATUS_STYLES[booking.status] ??
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {booking.status}
                </span>
                {booking.status === 'pending' && (
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={cancellingId === booking.id}
                    onClick={() => handleCancel(booking.id)}
                  >
                    {cancellingId === booking.id ? 'Cancelling…' : 'Cancel'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BookingPage() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('book');
  const [bookingStatus, setBookingStatus] = useState(null);

  // Booking confirmation screen
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
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => {
              setBookingStatus(null);
              setTab('my');
            }}
          >
            View my bookings
          </Button>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Therapy Sessions</h1>
        <p className="text-slate-500 mt-1">
          Book an appointment with the Cardiff Met wellbeing team.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {[
          { key: 'book', label: '📅 Book a session' },
          { key: 'my', label: '🗂 My bookings' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'book' ? (
        <BookingTab authFetch={authFetch} onBooked={setBookingStatus} />
      ) : (
        <MyBookingsTab authFetch={authFetch} />
      )}
    </div>
  );
}
