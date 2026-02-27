import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';

export default function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '2rem' }}>
      <h1>Welcome to Your Dashboard</h1>
      <p>What would you like to do today?</p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginTop: '2rem',
        }}
      >
        <button
          onClick={() => navigate('/mood')}
          style={{ padding: '1rem', fontSize: '1rem', cursor: 'pointer' }}
        >
          Record My Mood
        </button>

        <button
          onClick={() => navigate('/booking')}
          style={{ padding: '1rem', fontSize: '1rem', cursor: 'pointer' }}
        >
          Book a Therapy Session
        </button>

        <button
          onClick={() => navigate('/resources')}
          style={{ padding: '1rem', fontSize: '1rem', cursor: 'pointer' }}
        >
          Browse Resources
        </button>
      </div>

      <button
        onClick={handleLogout}
        style={{
          marginTop: '3rem',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          color: 'red',
        }}
      >
        Logout
      </button>
    </div>
  );
}
