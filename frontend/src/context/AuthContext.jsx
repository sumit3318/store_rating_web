import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check a saved token

  // On page load, if a token is saved, ask the backend who it belongs to.
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => setUser(res.user))
      .catch((err) => {
        // Only a 401 means the token is bad. A network error or a 500 must not log the user out.
        if (err.response?.status === 401) localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  function saveSession({ token, user: loggedInUser }) {
    localStorage.setItem('token', token);
    setUser(loggedInUser);
    return loggedInUser;
  }

  const login = async (credentials) => saveSession(await authApi.login(credentials));
  const signup = async (details) => saveSession(await authApi.signup(details));

  async function logout() {
    try {
      await authApi.logout();
    } catch (err) {
      // Even if the call fails we still log the user out locally.
    }
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
