import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ErrorBanner from '@/components/ErrorBanner';

// ─── Edit Name Form ──────────────────────────────────────────────────────────

function EditNameForm({ authFetch, currentName, onSaved }) {
  const [name, setName] = useState(currentName ?? '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await authFetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSuccess('Name updated.');
      onSaved(data.user.name);
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-800 mb-5">
        Display name
      </h2>
      <ErrorBanner message={error} className="mb-4" />
      {success && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700"
        >
          ✓ {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          maxLength={100}
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Save'}
        </Button>
      </form>
    </Card>
  );
}

// ─── Change Password Form ────────────────────────────────────────────────────

function ChangePasswordForm({ authFetch }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (next !== confirm) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch('/api/users/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSuccess('Password updated successfully.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-800 mb-5">
        Change password
      </h2>
      <ErrorBanner message={error} className="mb-4" />
      {success && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700"
        >
          ✓ {success}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="current-password"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            New password
          </label>
          <input
            id="new-password"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Min 8 chars, include a letter and a number"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </Card>
  );
}

// ─── Delete Account Section ──────────────────────────────────────────────────

function DeleteAccountSection({ authFetch, logout }) {
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleDelete() {
    if (!password) {
      setError('Please enter your password to confirm deletion.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/users/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }
      logout();
      navigate('/login');
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-red-100">
      <h2 className="text-lg font-semibold text-red-700 mb-2">
        Delete account
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Permanently deletes your account and anonymises all mood data. This
        cannot be undone.
      </p>
      <ErrorBanner message={error} className="mb-4" />
      {!confirming ? (
        <Button variant="danger" onClick={() => setConfirming(true)}>
          Delete my account
        </Button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-red-700">
            Are you sure? This action is irreversible.
          </p>
          <div>
            <label
              htmlFor="delete-password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Enter your password to confirm
            </label>
            <input
              id="delete-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Your current password"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="danger" disabled={loading} onClick={handleDelete}>
              {loading ? 'Deleting…' : 'Yes, delete my account'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirming(false);
                setPassword('');
                setError('');
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Profile Page ────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, authFetch, logout } = useAuth();
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState('');
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await authFetch('/api/users/me');
        if (res.ok) {
          const data = await res.json();
          setProfileData(data.user);
        }
      } catch {
        // silently ignore — we still show JWT-based info
      }
    }
    fetchProfile();
  }, [authFetch]);

  async function handleExport() {
    setExportLoading(true);
    setExportError('');
    try {
      const res = await authFetch('/api/users/me/export');
      if (!res.ok) {
        const data = await res.json();
        setExportError(data.error);
        return;
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mindspace-my-data.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Could not export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  }

  const joinedDate = profileData?.created_at
    ? new Date(
        String(profileData.created_at).replace(' ', 'T')
      ).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Your profile</h1>
        <p className="text-slate-500 mt-1">Manage your account settings.</p>
      </div>

      {/* Two-column grid on md+, single column on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* ── Left column: account info + edit name ── */}
        <div className="space-y-6">
          {/* Account details */}
          <Card>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Account details
            </h2>
            <dl className="space-y-3">
              {profileData?.name && (
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-slate-500">Name</dt>
                  <dd className="text-sm text-slate-800">{profileData.name}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-sm font-medium text-slate-500">Email</dt>
                <dd className="text-sm text-slate-800">{user?.email ?? '—'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm font-medium text-slate-500">Role</dt>
                <dd>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      user?.role === 'admin'
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {user?.role ?? 'user'}
                  </span>
                </dd>
              </div>
              {joinedDate && (
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-slate-500">
                    Member since
                  </dt>
                  <dd className="text-sm text-slate-800">{joinedDate}</dd>
                </div>
              )}
            </dl>

            {/* Export data */}
            <div className="mt-5 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Export my data
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Download all your data (GDPR right to portability).
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={exportLoading}
                  onClick={handleExport}
                >
                  {exportLoading ? 'Exporting…' : 'Download JSON'}
                </Button>
              </div>
              {exportError && (
                <ErrorBanner message={exportError} className="mt-3" />
              )}
            </div>
          </Card>

          {/* Edit name */}
          <EditNameForm
            authFetch={authFetch}
            currentName={profileData?.name}
            onSaved={(newName) =>
              setProfileData((prev) => ({ ...prev, name: newName }))
            }
          />
        </div>

        {/* ── Right column: change password + delete account ── */}
        <div className="space-y-6">
          <ChangePasswordForm authFetch={authFetch} />
          <DeleteAccountSection authFetch={authFetch} logout={logout} />
        </div>
      </div>
    </div>
  );
}
