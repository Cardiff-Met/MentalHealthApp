import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';

export default function MoodPage() {
  const [rating, setRating] = useState(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const { authFetch } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!rating) {
      setError('Please select a mood rating.');
      return;
    }

    setLoading(true);

    try {
      const res = await authFetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setResult(data);
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Show crisis panel if rating is 1
  if (result?.isCrisis) {
    return (
      <div
        style={{
          maxWidth: '600px',
          margin: '50px auto',
          padding: '2rem',
          border: '2px solid red',
          borderRadius: '8px',
        }}
      >
        <h2 style={{ color: 'red' }}>⚠️ Immediate Support Available</h2>
        <p>
          It sounds like you're going through a really difficult time. Please
          reach out for help right now.
        </p>

        <ul style={{ lineHeight: '2' }}>
          <li>
            <strong>Samaritans:</strong> <a href="tel:116123">116 123</a> —
            free, 24/7
          </li>
          <li>
            <strong>NHS Urgent Mental Health:</strong> <a href="tel:111">111</a>{' '}
            then option 2
          </li>
          <li>
            <strong>Cardiff Met Wellbeing:</strong>{' '}
            <a href="https://www.cardiffmet.ac.uk/wellbeing">
              cardiffmet.ac.uk/wellbeing
            </a>
          </li>
        </ul>

        <button
          onClick={() => setResult(null)}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            cursor: 'pointer',
          }}
        >
          I understand, continue to resources
        </button>
      </div>
    );
  }

  // Show resources after mood is logged
  if (result) {
    return (
      <div style={{ maxWidth: '600px', margin: '50px auto', padding: '2rem' }}>
        <h2>Mood Logged ✓</h2>
        <p>Here are some resources that might help:</p>

        {result.resources.map((resource) => (
          <div
            key={resource.id}
            style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
            }}
          >
            <h3>{resource.title}</h3>
            <p>{resource.description}</p>
            <a href={resource.url} target="_blank" rel="noreferrer">
              Visit resource →
            </a>
          </div>
        ))}

        <button
          onClick={() => navigate('/dashboard')}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            cursor: 'pointer',
          }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Mood input form
  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '2rem' }}>
      <h1>How are you feeling?</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label>Mood Rating</label>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setRating(num)}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  background: rating === num ? '#4f46e5' : '#e5e7eb',
                  color: rating === num ? 'white' : 'black',
                  border: 'none',
                }}
              >
                {num}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#666' }}>
            1 = very low, 5 = great
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label>Description (optional)</label>
          <br />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="How are you feeling today?"
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Saving...' : 'Submit Mood'}
        </button>
      </form>

      <button
        onClick={() => navigate('/dashboard')}
        style={{
          marginTop: '1rem',
          background: 'none',
          border: 'none',
          color: 'blue',
          cursor: 'pointer',
        }}
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}
