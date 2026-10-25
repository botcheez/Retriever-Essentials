import { createContext, useContext, useState } from "react";

// Auth context: a shared "box" holding who is logged in.
// Any component can read it with useAuth(), no passing props down.

const AuthContext = createContext(null);
const STORAGE_KEY = "auth"; // must match api.js

// Read the saved login (if any) so a page refresh doesn't log you out.
function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

// Wrap the app in this (see App.js). Everything inside can use useAuth().
export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadSaved); // { user, token } or null

  function login(user, token) {
    const value = { user, token };
    setAuth(value);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }

  function logout() {
    setAuth(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  const value = {
    user: auth?.user ?? null,
    token: auth?.token ?? null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// The hook pages use: const { user, login, logout } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
