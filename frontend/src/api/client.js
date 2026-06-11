const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function getToken() {
  return localStorage.getItem("finance_token");
}

export function setToken(token) {
  localStorage.setItem("finance_token", token);
}

export function getAdminToken() {
  return localStorage.getItem("finance_admin_token");
}

export function setAdminToken(token) {
  localStorage.setItem("finance_admin_token", token);
}

export function clearAdminToken() {
  localStorage.removeItem("finance_admin_token");
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/login") {
      localStorage.removeItem("finance_token");
      window.location.reload();
    }
    const error = await response.json().catch(() => ({ detail: "Erro de comunicação" }));
    throw new Error(error.detail || "Erro de comunicação");
  }
  return response.json();
}

export function logout() {
  localStorage.removeItem("finance_token");
  localStorage.removeItem("finance_admin_token");
}

export async function login(email, password) {
  const data = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data;
}

export async function register(nome, email, telefone, password, empresa_nome) {
  const data = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({ nome, email, telefone, password, empresa_nome }),
  });
  setToken(data.access_token);
  return data;
}

export async function me() {
  return api("/auth/me");
}

export async function adminListUsers(q, page) {
  const params = new URLSearchParams({ page: page || 1 });
  if (q) params.set("q", q);
  return api(`/admin/usuarios?${params}`);
}

export async function adminCountUsers(q) {
  return api(`/admin/usuarios/count${q ? `?q=${encodeURIComponent(q)}` : ""}`);
}

export async function adminToggleUser(id) {
  return api(`/admin/usuarios/${id}/toggle`, { method: "PUT" });
}

export async function adminAccessUser(id) {
  return api(`/admin/usuarios/${id}/access`, { method: "POST" });
}

export async function billingStatus() {
  return api("/billing/status");
}

export async function billingCheckout(plan) {
  return api("/billing/checkout", { method: "POST", body: JSON.stringify({ plan }) });
}
