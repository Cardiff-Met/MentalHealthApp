import { useState, useCallback, useMemo } from 'react';
import { AuthContext } from './authContext';

/** Decode a JWT payload without verifying the signature (client-side only). */
function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem('accessToken') || null
  );

  // Derived user object from the JWT payload (userId, email, role)
  const user = useMemo(() => decodeToken(accessToken), [accessToken]);

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
        credentials: 'include',
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

  // Wrapper around fetch that auto-refreshes on 403
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
    <AuthContext.Provider
      value={{ accessToken, user, login, logout, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}
