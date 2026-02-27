import { useState, useCallback } from 'react';
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem('accessToken') || null
  );

  function login(newAccessToken) {
    localStorage.setItem('accessToken', newAccessToken);
    setAccessToken(newAccessToken);
  }

  function logout() {
    localStorage.removeItem('accessToken');
    setAccessToken(null);
    // Clear the refresh token cookie on the server
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  }

  const refreshAccessToken = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // sends the httpOnly cookie
      });

      if (!res.ok) {
        logout();
        return null;
      }

      const data = await res.json();
      localStorage.setItem('accessToken', data.accessToken);
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch {
      logout();
      return null;
    }
  }, []);

  // Wrapper around fetch that automatically refreshes token on 403
  const authFetch = useCallback(
    async (url, options = {}) => {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });

      // If token expired, try to refresh and retry the request once
      if (response.status === 403) {
        const newToken = await refreshAccessToken();
        if (!newToken) return response;

        return fetch(url, {
          ...options,
          credentials: 'include',
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      }

      return response;
    },
    [refreshAccessToken]
  );

  return (
    <AuthContext.Provider value={{ accessToken, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}
