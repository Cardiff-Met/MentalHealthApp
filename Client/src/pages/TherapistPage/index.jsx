import { Fragment, useState, useEffect } from 'react';
import { useAuth } from '@/context';
import ErrorBanner from '@/components/ErrorBanner';
import LoadingSpinner from '@/components/LoadingSpinner';

const MORNING_SLOTS = ['09:00', '10:00', '11:00'];
const AFTERNOON_SLOTS = ['14:00', '15:00', '16:00'];
const ALL_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

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

function displayTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const display = h > 12 ? h - 12 : h;
  return `${display}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function TherapistPage() {
  const { authFetch } = useAuth();
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null); // "dateKey|HH:MM" being toggled
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [slotsRes, bookingsRes] = await Promise.all([
          authFetch('/api/therapist/slots'),
          authFetch('/api/therapist/bookings'),
        ]);
        const slotsData = await slotsRes.json();
        const bookingsData = await bookingsRes.json();
        if (!slotsRes.ok) {
          setError(slotsData.error);
          return;
        }
        setSlots(slotsData.slots ?? []);
        setBookings(bookingsRes.ok ? (bookingsData.bookings ?? []) : []);
      } catch {
        setError('Could not load your data.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [authFetch]);

  async function updateBookingStatus(bookingId, status) {
    setUpdatingBookingId(bookingId);
    setError('');
    try {
      const res = await authFetch(`/api/therapist/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
        );
        // If declined, the slot becomes available again — refetch slots
        if (status === 'declined') {
          const slotsRes = await authFetch('/api/therapist/slots');
          const slotsData = await slotsRes.json();
          if (slotsRes.ok) setSlots(slotsData.slots ?? []);
        }
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch {
      setError('Could not update booking. Please try again.');
    } finally {
      setUpdatingBookingId(null);
    }
  }

  async function toggleSlot(date, time, existingSlot) {
    const key = `${toDateKey(date)}|${time}`;
    setBusy(key);
    setError('');

    if (existingSlot) {
      // Remove
      try {
        const res = await authFetch(`/api/therapist/slots/${existingSlot.id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setSlots((prev) => prev.filter((s) => s.id !== existingSlot.id));
        } else {
          const data = await res.json();
          setError(data.error);
        }
      } catch {
        setError('Could not remove slot. Please try again.');
      }
    } else {
      // Add
      try {
        const res = await authFetch('/api/therapist/slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slot_date: toDateKey(date),
            slot_time: time,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setSlots((prev) => [...prev, data.slot]);
        } else {
          setError(data.error);
        }
      } catch {
        setError('Could not add slot. Please try again.');
      }
    }

    setBusy(null);
  }

  if (loading) return <LoadingSpinner message="Loading your availability…" />;

  // Build lookup: dateKey → { "HH:MM": slot }
  const slotMap = {};
  for (const slot of slots) {
    const dateKey = String(slot.slot_date).slice(0, 10);
    if (!slotMap[dateKey]) slotMap[dateKey] = {};
    const timeKey = String(slot.slot_time).slice(0, 5);
    slotMap[dateKey][timeKey] = slot;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = mondayOf(today);
  monday.setDate(monday.getDate() + weekOffset * 7);
  const days = weekDates(monday);
  const canGoPrev = weekOffset > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Availability</h1>
        <p className="text-slate-500 mt-1">
          Click a cell to add or remove a 1-hour slot. Students can only book
          slots you've made available.
        </p>
      </div>

      <ErrorBanner message={error} className="mb-6" />

      {/* Pending booking requests */}
      {bookings.filter((b) => b.status === 'pending').length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            Booking requests (
            {bookings.filter((b) => b.status === 'pending').length})
          </h2>
          <div className="space-y-3">
            {bookings
              .filter((b) => b.status === 'pending')
              .map((b) => {
                const timeKey = String(b.slot_time).slice(0, 5);
                const isUpdating = updatingBookingId === b.id;
                return (
                  <div
                    key={b.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {new Date(b.slot_date).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        · {displayTime(timeKey)}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Requested by{' '}
                        <span className="font-medium">
                          {b.user_name || b.user_email}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={isUpdating}
                        onClick={() => updateBookingStatus(b.id, 'confirmed')}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white transition-colors"
                      >
                        {isUpdating ? '…' : 'Confirm'}
                      </button>
                      <button
                        disabled={isUpdating}
                        onClick={() => updateBookingStatus(b.id, 'declined')}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:border-red-300 hover:text-red-600 disabled:opacity-50 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded bg-teal-100 border border-teal-300" />
          Yours — available (click to remove)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded bg-amber-100 border border-amber-300" />
          Yours — booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded bg-violet-100 border border-violet-300" />
          Covered by another therapist
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded bg-slate-100 border border-slate-200" />
          Empty (click to add)
        </span>
      </div>

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
      <div className="overflow-x-auto rounded-2xl shadow-sm">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden min-w-[560px]">
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
                    className={`text-xs font-semibold ${isToday ? 'text-teal-600' : 'text-slate-500'}`}
                  >
                    {DAY_LABELS[i]}
                  </p>
                  <p
                    className={`text-sm font-bold mt-0.5 ${isToday ? 'text-teal-600' : 'text-slate-800'}`}
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
              <Fragment key={time}>
                <div
                  className={`grid grid-cols-6 ${isMorningEnd ? '' : 'border-b border-slate-50'}`}
                >
                  <div className="py-3 px-3 flex items-center">
                    <span className="text-xs text-slate-400 font-medium tabular-nums">
                      {displayTime(time)}
                    </span>
                  </div>
                  {days.map((d, di) => {
                    const dateKey = toDateKey(d);
                    const isToday = dateKey === toDateKey(today);
                    const nowHHMM = new Date().toTimeString().slice(0, 5);
                    const isPast = d < today || (isToday && time <= nowHHMM);
                    const slot = slotMap[dateKey]?.[time];
                    const busyKey = `${dateKey}|${time}`;
                    const isBusy = busy === busyKey;
                    const isMine = slot?.is_mine;
                    const isOther = slot && !isMine;
                    const isBooked = isMine && slot.status !== 'available';

                    let cellClass =
                      'w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ';
                    if (isBusy) {
                      cellClass += 'bg-slate-100 text-slate-400 cursor-wait';
                    } else if (isPast) {
                      cellClass += 'text-slate-200 cursor-default';
                    } else if (isOther) {
                      cellClass +=
                        'bg-violet-50 text-violet-600 border border-violet-200 cursor-not-allowed';
                    } else if (isBooked) {
                      cellClass +=
                        'bg-amber-50 text-amber-600 border border-amber-200 cursor-not-allowed';
                    } else if (slot) {
                      cellClass +=
                        'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200';
                    } else {
                      cellClass +=
                        'bg-slate-50 text-slate-300 hover:bg-teal-50 hover:text-teal-600 hover:border hover:border-teal-200';
                    }

                    return (
                      <div
                        key={di}
                        className="py-2 px-1.5 border-l border-slate-100 flex items-center justify-center"
                      >
                        <button
                          disabled={isPast || isOther || isBooked || isBusy}
                          onClick={() => toggleSlot(d, time, slot ?? null)}
                          className={cellClass}
                          title={
                            isOther
                              ? `Covered by ${slot.therapist_name || slot.therapist_email}`
                              : isBooked
                                ? 'Already booked — cannot remove'
                                : slot
                                  ? 'Click to remove this slot'
                                  : isPast
                                    ? 'Past date'
                                    : 'Click to add this slot'
                          }
                        >
                          {isBusy
                            ? '…'
                            : isOther
                              ? (
                                  slot.therapist_name ||
                                  slot.therapist_email ||
                                  ''
                                )
                                  .charAt(0)
                                  .toUpperCase() || '•'
                              : isBooked
                                ? 'Booked'
                                : slot
                                  ? '✓'
                                  : '+'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {isMorningEnd && (
                  <div className="grid grid-cols-6 border-t-2 border-b-2 border-slate-100 bg-slate-50">
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
              </Fragment>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-3 text-center">
        Each session is 1 hour · Mon–Fri only
      </p>
    </div>
  );
}
