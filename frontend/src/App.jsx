import { useEffect, useState } from "react";
import { api, getToken, setToken } from "./services/api";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then((r) => setUser(r.user))
      .catch(() => setToken(null))
      .finally(() => setChecking(false));
  }, []);

  const signIn = ({ token, user }) => {
    setToken(token);
    setUser(user);
  };
  const signOut = () => {
    setToken(null);
    setUser(null);
  };

  if (checking) return <p className="p-8 text-mute">Loading…</p>;
  return user ? (
    <Dashboard user={user} onSignOut={signOut} />
  ) : (
    <AuthPage onAuth={signIn} />
  );
}
