import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }
      login(data.accessToken);
      navigate('/dashboard');
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '2rem' }}>
      <h1>Mental Health Support App</h1>
      <h2>{isRegister ? 'Create Account' : 'Login'}</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Email</label>
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>Password</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '0.75rem' }}
        >
          {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
        </button>
      </form>

      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        {isRegister ? 'Already have an account?' : "Don't have an account?"}
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setError('');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'blue',
            cursor: 'pointer',
          }}
        >
          {isRegister ? ' Login' : ' Register'}
        </button>
      </p>
    </div>
  );
}
