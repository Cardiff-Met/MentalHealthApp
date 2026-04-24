import { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null); // "dateKey|HH:MM" being toggled
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    async function fetchSlots() {
      try {
        const res = await authFetch('/api/therapist/slots');
        const data = await res.json();
        if (!res.ok) {
          setError(data.error);
          return;
        }
        setSlots(data.slots ?? []);
      } catch {
        setError('Could not load your slots.');
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, [authFetch]);

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

      {/* Legend */}
      <div className="flex items-center gap-5 mb-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded bg-teal-100 border border-teal-300" />
          Available (click to remove)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded bg-amber-100 border border-amber-300" />
          Booked — cannot remove
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
                    const isPast = d < today;
                    const slot = slotMap[dateKey]?.[time];
                    const busyKey = `${dateKey}|${time}`;
                    const isBusy = busy === busyKey;
                    const isBooked = slot && slot.status !== 'available';

                    let cellClass =
                      'w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ';
                    if (isBusy) {
                      cellClass += 'bg-slate-100 text-slate-400 cursor-wait';
                    } else if (isPast) {
                      cellClass += 'text-slate-200 cursor-default';
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
                          disabled={isPast || isBooked || isBusy}
                          onClick={() => toggleSlot(d, time, slot ?? null)}
                          className={cellClass}
                          title={
                            isBooked
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
      </div>

      <p className="text-xs text-slate-400 mt-3 text-center">
        Each session is 1 hour · Mon–Fri only
      </p>
    </div>
  );
}
