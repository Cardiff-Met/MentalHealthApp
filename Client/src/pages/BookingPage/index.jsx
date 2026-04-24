import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ErrorBanner from '@/components/ErrorBanner';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

// 1-hour slots: 09–11 morning, 14–16 afternoon
const MORNING_SLOTS = ['09:00', '10:00', '11:00'];
const AFTERNOON_SLOTS = ['14:00', '15:00', '16:00'];
const ALL_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  declined: 'bg-red-50 text-red-700 border-red-200',
};

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

/** Monday of the week containing `date`. */
function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Array of the 5 weekday Dates for the week starting at `monday`. */
function weekDates(monday) {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDayHeader(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatBookingDate(dateStr) {
  if (!dateStr) return '—';
  const safe = String(dateStr).replace(' ', 'T');
  const d = new Date(safe);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function displayTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const display = h > 12 ? h - 12 : h;
  return `${display}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ─── Calendar booking tab ─────────────────────────────────────────────────────

function BookingTab({ authFetch, onBooked }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(null); // slot id being booked
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    async function fetchSlots() {
      try {
        const res = await authFetch('/api/booking/slots');
        const data = await res.json();
        if (!res.ok) {
          setError(data.error);
          return;
        }
        setSlots(data.slots ?? []);
      } catch {
        setError('Could not load available slots.');
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, [authFetch]);

  async function handleBook(slot) {
    setSubmitting(slot.id);
    setError('');
    try {
      const res = await authFetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: slot.id }),
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
      setSubmitting(null);
    }
  }

  if (loading) return <LoadingSpinner message="Loading available slots…" />;

  // Build lookup: dateKey → { "HH:MM": slot }
  const slotMap = {};
  for (const slot of slots) {
    const dateKey = String(slot.slot_date).slice(0, 10);
    if (!slotMap[dateKey]) slotMap[dateKey] = {};
    const timeKey = String(slot.slot_time).slice(0, 5); // "HH:MM"
    slotMap[dateKey][timeKey] = slot;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = mondayOf(today);
  monday.setDate(monday.getDate() + weekOffset * 7);
  const days = weekDates(monday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() - 7);
  const canGoPrev = weekOffset > 0;

  return (
    <>
      <ErrorBanner message={error} className="mb-6" />

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          disabled={!canGoPrev}
          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous week"
        >
          ←
        </button>
        <span className="text-sm font-medium text-slate-600">
          {formatDayHeader(days[0])} – {formatDayHeader(days[4])}
        </span>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:border-slate-300 transition-colors"
          aria-label="Next week"
        >
          →
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Day headers */}
        <div className="grid grid-cols-6 border-b border-slate-100">
          <div className="py-3 px-3 text-xs font-medium text-slate-400" />
          {days.map((d, i) => {
            const isToday = toDateKey(d) === toDateKey(today);
            return (
              <div
                key={i}
                className="py-3 text-center border-l border-slate-100"
              >
                <p
                  className={`text-xs font-semibold ${isToday ? 'text-indigo-600' : 'text-slate-500'}`}
                >
                  {DAY_LABELS[i]}
                </p>
                <p
                  className={`text-sm font-bold mt-0.5 ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}
                >
                  {d.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Time rows */}
        {ALL_SLOTS.map((time, idx) => {
          const isMorningEnd = idx === MORNING_SLOTS.length - 1;
          return (
            <>
              <div
                key={time}
                className={`grid grid-cols-6 ${isMorningEnd ? '' : 'border-b border-slate-50'}`}
              >
                <div className="py-3 px-3 flex items-center">
                  <span className="text-xs text-slate-400 font-medium tabular-nums">
                    {displayTime(time)}
                  </span>
                </div>
                {days.map((d, di) => {
                  const dateKey = toDateKey(d);
                  const slot = slotMap[dateKey]?.[time];
                  const isPast = d < today;
                  return (
                    <div
                      key={di}
                      className="py-2 px-1.5 border-l border-slate-100 flex items-center justify-center"
                    >
                      {slot && !isPast ? (
                        <button
                          onClick={() => handleBook(slot)}
                          disabled={submitting !== null}
                          title={
                            slot.therapist_email
                              ? `With ${slot.therapist_email}`
                              : undefined
                          }
                          className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            submitting === slot.id
                              ? 'bg-indigo-200 text-indigo-500 cursor-wait'
                              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white'
                          }`}
                        >
                          {submitting === slot.id ? '…' : 'Book'}
                        </button>
                      ) : (
                        <span className="w-full py-1.5 rounded-lg text-xs text-center text-slate-200 select-none">
                          —
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Gap between morning and afternoon */}
              {isMorningEnd && (
                <div
                  key="gap"
                  className="grid grid-cols-6 border-t-2 border-b-2 border-slate-100 bg-slate-50"
                >
                  <div className="py-1.5 px-3">
                    <span className="text-xs text-slate-400">Lunch</span>
                  </div>
                  {days.map((_, di) => (
                    <div
                      key={di}
                      className="border-l border-slate-100 py-1.5"
                    />
                  ))}
                </div>
              )}
            </>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 mt-3 text-center">
        Each session is 1 hour · Mon–Fri only
      </p>
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
          {bookings.map((booking) => {
            const timeKey = String(booking.slot_time).slice(0, 5);
            return (
              <Card
                key={booking.id}
                className="flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-slate-800">
                    {formatBookingDate(booking.slot_date)}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {displayTime(timeKey)} –{' '}
                    {displayTime(
                      `${String(parseInt(timeKey.split(':')[0], 10) + 1).padStart(2, '0')}:00`
                    )}
                    {booking.therapist_email && (
                      <span className="ml-2 text-slate-400">
                        · {booking.therapist_email}
                      </span>
                    )}
                  </p>
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
            );
          })}
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Therapy Sessions</h1>
        <p className="text-slate-500 mt-1">
          Book a 1-hour appointment with the Cardiff Met wellbeing team.
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
