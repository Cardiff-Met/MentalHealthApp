import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function BookingPage() {
    const [slots, setSlots] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [filter, setFilter] = useState('all')
    const [bookingStatus, setBookingStatus] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    const { token } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        async function fetchSlots() {
            try {
                const res = await fetch('/api/booking/slots', {
                    headers: { Authorization: `Bearer ${token}` },
                })
                const data = await res.json()
                if (!res.ok) {
                    setError(data.error)
                    return
                }
                setSlots(data.slots)
            } catch (err) {
                setError('Could not load available slots.')
            } finally {
                setLoading(false)
            }
        }
        fetchSlots()
    }, [token])

    async function handleBook(slotId) {
        setSubmitting(true)
        setError('')
        try {
            const res = await fetch('/api/booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ slotId }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error)
                return
            }
            setBookingStatus(data)
        } catch (err) {
            setError('Could not submit booking. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const filteredSlots = filter === 'all'
        ? slots
        : slots.filter(slot => slot.time_of_day === filter)

    // Show booking confirmation
    if (bookingStatus) {
        return (
            <div style={{ maxWidth: '600px', margin: '50px auto', padding: '2rem' }}>
                <h2>Booking Request Submitted ✓</h2>
                <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1.5rem', marginTop: '1rem' }}>
                    <p><strong>Status:</strong> <span style={{ color: 'orange' }}>Pending</span></p>
                    <p>We will notify you when your booking is confirmed.</p>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', cursor: 'pointer' }}
                >
                    Back to Dashboard
                </button>
            </div>
        )
    }

    if (loading) return <p style={{ margin: '50px auto', maxWidth: '600px' }}>Loading available slots...</p>

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', padding: '2rem' }}>
            <h1>Book a Therapy Session</h1>
            <p>Select an available slot below to request an appointment.</p>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {/* Time of day filter */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {['all', 'morning', 'afternoon', 'evening'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            background: filter === f ? '#4f46e5' : '#e5e7eb',
                            color: filter === f ? 'white' : 'black',
                            border: 'none',
                            borderRadius: '4px',
                        }}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {filteredSlots.length === 0 ? (
                <p>No slots available for this time period. Try a different filter.</p>
            ) : (
                filteredSlots.map(slot => (
                    <div key={slot.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p><strong>{slot.slot_date}</strong> at {slot.slot_time}</p>
                            <p style={{ color: '#666', fontSize: '0.9rem' }}>{slot.time_of_day}</p>
                        </div>
                        <button
                            onClick={() => handleBook(slot.id)}
                            disabled={submitting}
                            style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px' }}
                        >
                            {submitting ? 'Booking...' : 'Request'}
                        </button>
                    </div>
                ))
            )}

            <button
                onClick={() => navigate('/dashboard')}
                style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
            >
                ← Back to Dashboard
            </button>
        </div>
    )
}