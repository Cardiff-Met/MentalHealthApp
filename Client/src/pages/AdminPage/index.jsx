import { useState, useEffect } from 'react';
import { useAuth } from '@/context';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ErrorBanner from '@/components/ErrorBanner';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

const CATEGORIES = ['general', 'crisis', 'anxiety', 'self-help', 'mindfulness'];
const ROLES = ['user', 'therapist', 'admin'];

const ROLE_STYLES = {
  user: 'bg-slate-100 text-slate-600',
  therapist: 'bg-teal-100 text-teal-700',
  admin: 'bg-violet-100 text-violet-700',
};

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  declined: 'bg-red-50 text-red-700 border-red-200',
};

function formatDate(raw) {
  if (!raw) return '—';
  const d = new Date(String(raw).replace(' ', 'T'));
  return isNaN(d)
    ? '—'
    : d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
}

function displayTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = String(hhmm).slice(0, 5).split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  return `${h > 12 ? h - 12 : h}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({ authFetch, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [changingId, setChangingId] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await authFetch('/api/admin/users');
        const data = await res.json();
        if (!res.ok) {
          setError(data.error);
          return;
        }
        setUsers(data.users ?? []);
      } catch {
        setError('Could not load users.');
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [authFetch]);

  async function handleRoleChange(userId, newRole) {
    setChangingId(userId);
    setError('');
    try {
      const res = await authFetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch {
      setError('Could not update role.');
    } finally {
      setChangingId(null);
    }
  }

  if (loading) return <LoadingSpinner message="Loading users…" />;

  return (
    <>
      <ErrorBanner message={error} className="mb-4" />
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-500">
                Email
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">
                Name
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">
                Role
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">
                Joined
              </th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {users.map((u) => (
              <tr key={u.id} className={u.deleted_at ? 'opacity-40' : ''}>
                <td className="px-4 py-3 text-slate-800 font-medium">
                  {u.email}
                </td>
                <td className="px-4 py-3 text-slate-500">{u.name || '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_STYLES[u.role]}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {formatDate(u.created_at)}
                </td>
                <td className="px-4 py-3">
                  {u.deleted_at ? (
                    <span className="text-xs text-red-400 font-medium">
                      Deleted
                    </span>
                  ) : (
                    <span className="text-xs text-green-600 font-medium">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {!u.deleted_at && u.id !== currentUserId && (
                    <select
                      value={u.role}
                      disabled={changingId === u.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <EmptyState
            icon="👤"
            title="No users found"
            message="No accounts have been registered yet."
          />
        )}
      </div>
      <p className="text-xs text-slate-400 mt-2">
        {users.length} account{users.length !== 1 ? 's' : ''} total
      </p>
    </>
  );
}

// ─── Bookings Tab ─────────────────────────────────────────────────────────────

function BookingsTab({ authFetch }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await authFetch('/api/admin/bookings');
        const data = await res.json();
        if (!res.ok) {
          setError(data.error);
          return;
        }
        setBookings(data.bookings ?? []);
      } catch {
        setError('Could not load bookings.');
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, [authFetch]);

  async function handleStatus(bookingId, status) {
    setUpdatingId(bookingId);
    setError('');
    try {
      const res = await authFetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
      );
    } catch {
      setError('Could not update booking.');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) return <LoadingSpinner message="Loading bookings…" />;

  const pending = bookings.filter((b) => b.status === 'pending');
  const rest = bookings.filter((b) => b.status !== 'pending');

  return (
    <>
      <ErrorBanner message={error} className="mb-4" />
      {bookings.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No bookings yet"
          message="No therapy sessions have been requested yet."
        />
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-2">
                Pending ({pending.length})
              </h3>
              <div className="space-y-2">
                {pending.map((b) => (
                  <BookingRow
                    key={b.id}
                    booking={b}
                    updatingId={updatingId}
                    onStatus={handleStatus}
                  />
                ))}
              </div>
            </div>
          )}
          {rest.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-2">
                Past decisions
              </h3>
              <div className="space-y-2">
                {rest.map((b) => (
                  <BookingRow
                    key={b.id}
                    booking={b}
                    updatingId={updatingId}
                    onStatus={handleStatus}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function BookingRow({ booking: b, updatingId, onStatus }) {
  const timeKey = String(b.slot_time).slice(0, 5);
  const [h] = timeKey.split(':').map(Number);
  const endTime = `${String(h + 1).padStart(2, '0')}:00`;
  const busy = updatingId === b.id;

  return (
    <Card className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="font-medium text-slate-800 truncate">{b.user_email}</p>
        <p className="text-sm text-slate-500 mt-0.5">
          {formatDate(b.slot_date)} · {displayTime(timeKey)} –{' '}
          {displayTime(endTime)}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLES[b.status] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}
        >
          {b.status}
        </span>
        {b.status === 'pending' && (
          <>
            <Button
              size="sm"
              disabled={busy}
              onClick={() => onStatus(b.id, 'confirmed')}
            >
              {busy ? '…' : 'Confirm'}
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={busy}
              onClick={() => onStatus(b.id, 'declined')}
            >
              {busy ? '…' : 'Decline'}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

// ─── Resources Tab ────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: '',
  description: '',
  url: '',
  category: 'general',
  min_mood: 1,
  max_mood: 5,
};

function ResourcesTab({ authFetch }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null); // null = new, number = editing
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    async function fetchResources() {
      try {
        const res = await authFetch('/api/admin/resources');
        const data = await res.json();
        if (!res.ok) {
          setError(data.error);
          return;
        }
        setResources(data.resources ?? []);
      } catch {
        setError('Could not load resources.');
      } finally {
        setLoading(false);
      }
    }
    fetchResources();
  }, [authFetch]);

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError('');
  }

  function openEdit(r) {
    setEditingId(r.id);
    setForm({
      title: r.title,
      description: r.description ?? '',
      url: r.url,
      category: r.category,
      min_mood: r.min_mood,
      max_mood: r.max_mood,
    });
    setShowForm(true);
    setError('');
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const isNew = editingId === null;
      const res = await authFetch(
        isNew ? '/api/admin/resources' : `/api/admin/resources/${editingId}`,
        {
          method: isNew ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            min_mood: Number(form.min_mood),
            max_mood: Number(form.max_mood),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      if (isNew) {
        setResources((prev) => [
          ...prev,
          {
            id: data.resourceId,
            ...form,
            min_mood: Number(form.min_mood),
            max_mood: Number(form.max_mood),
          },
        ]);
      } else {
        setResources((prev) =>
          prev.map((r) =>
            r.id === editingId
              ? {
                  ...r,
                  ...form,
                  min_mood: Number(form.min_mood),
                  max_mood: Number(form.max_mood),
                }
              : r
          )
        );
      }
      setShowForm(false);
    } catch {
      setError('Could not save resource.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    setError('');
    try {
      const res = await authFetch(`/api/admin/resources/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError('Could not delete resource.');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <LoadingSpinner message="Loading resources…" />;

  return (
    <>
      <ErrorBanner message={error} className="mb-4" />

      {showForm && (
        <Card className="mb-6 border-indigo-200">
          <h3 className="text-base font-semibold text-slate-800 mb-4">
            {editingId === null ? 'Add resource' : 'Edit resource'}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  required
                  value={form.url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, url: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Min mood
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={form.min_mood}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, min_mood: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Max mood
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={form.max_mood}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, max_mood: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save resource'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-slate-500">
          {resources.length} resource{resources.length !== 1 ? 's' : ''}
        </p>
        {!showForm && (
          <Button size="sm" onClick={openNew}>
            + Add resource
          </Button>
        )}
      </div>

      {resources.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No resources"
          message="Add your first resource using the button above."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Title
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Category
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">
                  Mood range
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {resources.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{r.title}</p>
                    {r.description && (
                      <p className="text-xs text-slate-400 truncate max-w-xs">
                        {r.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full capitalize">
                      {r.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {r.min_mood}–{r.max_mood}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openEdit(r)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={deletingId === r.id}
                        onClick={() => handleDelete(r.id)}
                      >
                        {deletingId === r.id ? '…' : 'Delete'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'users', label: 'Users' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'resources', label: 'Resources' },
];

export default function AdminPage() {
  const { authFetch, user } = useAuth();
  const [tab, setTab] = useState('users');

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Manage users, bookings, and resources.
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === key
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <UsersTab authFetch={authFetch} currentUserId={user?.userId} />
      )}
      {tab === 'bookings' && <BookingsTab authFetch={authFetch} />}
      {tab === 'resources' && <ResourcesTab authFetch={authFetch} />}
    </div>
  );
}
