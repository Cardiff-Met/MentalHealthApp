import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MoodPage from './pages/MoodPage'
import ResourcesPage from './pages/ResourcesPage'
import BookingPage from './pages/BookingPage'

function ProtectedRoute({ children }) {
    const { token } = useAuth()
    return token ? children : <Navigate to="/login" />
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <DashboardPage />
                </ProtectedRoute>
            } />
            <Route path="/mood" element={
                <ProtectedRoute>
                    <MoodPage />
                </ProtectedRoute>
            } />
            <Route path="/resources" element={
                <ProtectedRoute>
                    <ResourcesPage />
                </ProtectedRoute>
            } />
            <Route path="/booking" element={
                <ProtectedRoute>
                    <BookingPage />
                </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    )
}