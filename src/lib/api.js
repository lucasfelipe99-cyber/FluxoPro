const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Erro desconhecido');
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  register: (nome, email, telefone, password, empresa_nome) =>
    api.post('/auth/register', { nome, email, telefone, password, empresa_nome }),

  me: () => api.get('/auth/me'),

  // Admin
  adminUsuarios: (q, page) =>
    api.get(`/admin/usuarios?${new URLSearchParams({ ...(q && { q }), page: page || 1 })}`),
  adminCount: (q) =>
    api.get(`/admin/usuarios/count${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  adminToggle: (id) => api.put(`/admin/usuarios/${id}/toggle`),

  // Finance
  dashboard: () => api.get('/finance/dashboard'),
  contasPagar: () => api.get('/contas-pagar'),
  contasReceber: () => api.get('/contas-receber'),
};
