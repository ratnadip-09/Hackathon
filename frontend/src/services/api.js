const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
export const getToken = () => localStorage.getItem("edith_token");
export const setToken = (t) =>
  t
    ? localStorage.setItem("edith_token", t)
    : localStorage.removeItem("edith_token");

async function request(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the API. Check that the backend is running.");
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && getToken()) {
    setToken(null);
    window.location.reload();
  }
  if (!res.ok) throw new Error(data.message || "Request failed.");
  return data;
}

export const api = {
  register: (b) => request("/auth/register", { method: "POST", body: b }),
  login: (b) => request("/auth/login", { method: "POST", body: b }),
  me: () => request("/auth/me"),
  apps: () => request("/apps"),
  seed: () => request("/apps/seed", { method: "POST" }),
  setPermission: (id, resource, granted) =>
    request(`/apps/${id}/permissions`, {
      method: "PATCH",
      body: { resource, granted },
    }),
  resetApp: (id) => request(`/apps/${id}/events`, { method: "DELETE" }),
  simulate: (scenario, appId) =>
    request("/simulate", { method: "POST", body: { scenario, appId } }),
  events: () => request("/events?limit=100"),
  alerts: () => request("/alerts"),
  dashboard: () => request("/dashboard"),
};
