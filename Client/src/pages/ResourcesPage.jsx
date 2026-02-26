import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ResourcesPage() {
    const [resources, setResources] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [saved, setSaved] = useState([])

    const { token } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        async function fetchResources() {
            try {
                const res = await fetch('/api/resources', {
                    headers: { Authorization: `Bearer ${token}` },
                })
                const data = await res.json()
                if (!res.ok) {
                    setError(data.error)
                    return
                }
                setResources(data.resources)
            } catch (err) {
                setError('Could not load resources.')
            } finally {
                setLoading(false)
            }
        }
        fetchResources()
    }, [token])

    function handleSave(id) {
        if (saved.includes(id)) return
        setSaved([...saved, id])
    }

    if (loading) return <p style={{ margin: '50px auto', maxWidth: '600px' }}>Loading resources...</p>

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', padding: '2rem' }}>
            <h1>Mental Health Resources</h1>
            <p>Browse resources below. All are free and confidential.</p>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {resources.map(resource => (
                <div key={resource.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                    <h3>{resource.title}</h3>
                    <p>{resource.description}</p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <a href={resource.url} target="_blank" rel="noreferrer">Visit resource →</a>
                        <button
                            onClick={() => handleSave(resource.id)}
                            style={{ background: 'none', border: 'none', color: saved.includes(resource.id) ? 'gray' : 'blue', cursor: 'pointer' }}
                        >
                            {saved.includes(resource.id) ? '✓ Saved' : 'Save'}
                        </button>
                    </div>
                </div>
            ))}

            <button
                onClick={() => navigate('/dashboard')}
                style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'blue', cursor: 'pointer' }}
            >
                ← Back to Dashboard
            </button>
        </div>
    )
}