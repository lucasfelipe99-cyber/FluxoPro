import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BarChart3,
  Building2,
  ClipboardList,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  History,
  Pencil,
  Moon,
  Plus,
  Receipt,
  Search,
  Settings,
  Sun,
  Tags,
  Trash2,
  Upload,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api, getToken, setToken, getAdminToken, setAdminToken, clearAdminToken, login, logout, register, me, adminListUsers, adminCountUsers, adminToggleUser, adminAccessUser, billingStatus, billingCheckout } from "./api/client";
import { dateBR, money } from "./lib/format";
import "./styles.css";

const nav = [
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "fornecedores", label: "Fornecedores", icon: Building2 },
  { id: "xml", label: "XML NF-e", icon: Upload },
  { id: "pagar", label: "Contas a Pagar", icon: WalletCards },
  { id: "receber", label: "Contas a Receber", icon: Receipt },
  { id: "fluxo", label: "Fluxo de Caixa", icon: BarChart3 },
  { id: "projetado", label: "Projetado", icon: BarChart3 },
  { id: "categorias", label: "Categorias", icon: Tags },
  { id: "config", label: "Configurações", icon: Settings },
];

function AuthShell({ children }) {
  return (
    <main className="auth-screen">
      <section className="auth-presentation">
        <div className="auth-brand"><BarChart3 size={22} /> Fluxo<span>Pro</span></div>
        <div className="auth-copy">
          <p className="auth-eyebrow">Gestão financeira empresarial</p>
          <h1>Controle caixa, XML NF-e e projeções em uma só operação.</h1>
          <p>Organize contas a pagar, receber, categorias, custo médio e fluxo projetado com visão clara para tomar decisões melhores.</p>
        </div>
        <div className="auth-feature-grid">
          <div><span>XML NF-e</span><strong>Importação</strong></div>
          <div><span>Fluxo</span><strong>Realizado</strong></div>
          <div><span>Projetado</span><strong>12 meses</strong></div>
          <div><span>Admin</span><strong>Suporte</strong></div>
        </div>
        <small>© 2026 FluxoPro</small>
      </section>
      <section className="auth-form-side">{children}</section>
    </main>
  );
}

function Login({ onDone, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthShell>
      <form className="login-panel" onSubmit={submit}>
        <div>
          <strong>Entrar</strong>
          <span>Acesse sua conta.</span>
        </div>
        <label>E-mail<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Senha<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <button disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
        <p className="auth-switch">Não tem conta? <button type="button" className="link-btn" onClick={onRegister}>Criar conta</button></p>
      </form>
    </AuthShell>
  );
}

function Register({ onDone, onLogin }) {
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", password: "", empresa_nome: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  async function submit(event) {
    event.preventDefault();
    if (form.password.length < 8) { setError("A senha deve ter no mínimo 8 caracteres."); return; }
    if (!form.telefone.trim()) { setError("Telefone é obrigatório."); return; }
    setLoading(true);
    try {
      await register(form.nome, form.email, form.telefone, form.password, form.empresa_nome);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthShell>
      <form className="login-panel" onSubmit={submit}>
        <div>
          <strong>Criar conta</strong>
          <span>Criar nova conta</span>
        </div>
        <label>Nome completo<input value={form.nome} onChange={e => set("nome", e.target.value)} required /></label>
        <label>E-mail<input type="email" value={form.email} onChange={e => set("email", e.target.value)} required /></label>
        <label>Telefone<input type="tel" placeholder="(11) 99999-9999" value={form.telefone} onChange={e => set("telefone", e.target.value)} required /></label>
        <label>Senha (mín. 8 caracteres)<input type="password" value={form.password} onChange={e => set("password", e.target.value)} required /></label>
        <label>Nome da empresa<input value={form.empresa_nome} onChange={e => set("empresa_nome", e.target.value)} required /></label>
        {error && <p className="error">{error}</p>}
        <button disabled={loading}>{loading ? "Criando conta..." : "Criar conta"}</button>
        <p className="auth-switch">Já tem conta? <button type="button" className="link-btn" onClick={onLogin}>Entrar</button></p>
      </form>
    </AuthShell>
  );
}

function BillingLock({ status, onLogout }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function pay(plan) {
    setLoading(true);
    setError("");
    try {
      const data = await billingCheckout(plan);
      const url = data.init_point || data.sandbox_init_point;
      if (!url) throw new Error("Link de pagamento nao gerado.");
      window.location.href = url;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-panel">
        <div>
          <strong>Acesso bloqueado</strong>
          <span>Seu período grátis de 30 dias terminou.</span>
        </div>
        <p className="muted">Regularize a assinatura para voltar a acessar lançamentos, XML e fluxo de caixa.</p>
        {status?.active_until && <p className="muted">Acesso liberado até: {dateBR(status.active_until)}</p>}
        <div className="billing-actions">
          <button onClick={() => pay("monthly")} disabled={loading}>{loading ? "Gerando..." : `Mensal ${money(status?.plans?.monthly?.price || 29.9)}`}</button>
          <button onClick={() => pay("annual")} disabled={loading}>{loading ? "Gerando..." : `Anual ${money(status?.plans?.annual?.price || 299.9)}`}</button>
        </div>
        {!status?.payment_configured && <p className="error">Mercado Pago ainda não configurado. Informe o Access Token no servidor.</p>}
        {error && <p className="error">{error}</p>}
        <button className="secondary" onClick={onLogout}>Sair</button>
      </section>
    </main>
  );
}

function Shell({ user, onLogout, onAccessUser, onReturnAdmin, supportMode }) {
  const [page, setPage] = useState(user?.is_admin ? "admin" : "fluxo");
  const [dark, setDark] = useState(false);
  const headerBilling = useResource(user?.is_admin || supportMode ? "/auth/me" : "/billing/status", { active: true, days_remaining: 0 });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);
  const adminArea = user?.is_admin;
  const Active = pages[page] || pages.fluxo;
  const pageTitle = page === "admin" ? "Administração" : nav.find((item) => item.id === page)?.label || "Fluxo de Caixa";
  return (
    <div className={`app-shell ${adminArea ? "admin-shell" : ""}`}>
      <aside>
        <div className="brand">Fluxo<span>Pro</span></div>
        <nav>
          {!adminArea && nav.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => setPage(item.id)} title={item.label}><Icon size={18} /><span>{item.label}</span></button>;
          })}
          {adminArea && <p className="admin-sidebar-note">Área administrativa</p>}
        </nav>
      </aside>
      <section className="workspace">
        <header>
          <div>
            <h1>{pageTitle}</h1>
            <p>Operação financeira, caixa e indicadores em tempo real.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!user?.is_admin && !supportMode && (
              <span className={`license-pill ${headerBilling.data.active ? "" : "expired"}`} title={`Licença até ${dateBR(headerBilling.data.active_until)}`}>
                {headerBilling.data.days_remaining ?? 0} dias
              </span>
            )}
            {supportMode && (
              <button className="admin-btn" title="Voltar para o admin" onClick={onReturnAdmin}>
                ← Voltar Admin
              </button>
            )}
            <span style={{ fontSize: 13, color: "var(--muted)", marginRight: 4 }}>{user?.nome?.split(" ")[0]}</span>
            <button className="icon logout-btn" title="Sair" onClick={onLogout}>Sair</button>
            <button className="icon" title="Alternar tema" onClick={() => setDark(!dark)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          </div>
        </header>
        {page === "admin" ? <AdminPage onAccessUser={onAccessUser} /> : <Active />}
      </section>
    </div>
  );
}

function useResource(path, initial) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await api(path));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [path]);
  return { data, loading, error, reload: load };
}

function Kpi({ label, value }) {
  return <div className="kpi"><span>{label}</span><strong>{money(value)}</strong></div>;
}

function Dashboard() {
  const { data, loading } = useResource("/dashboard", { kpis: {}, resultado_mensal: [], despesas_por_categoria: [], evolucao_caixa: [] });
  if (loading) return <Loading />;
  const mensal = data.resultado_mensal.map((row) => ({ ...row, nome: String(row.mes).padStart(2, "0") }));
  return (
    <div className="stack">
      <div className="kpi-grid">
        <Kpi label="Saldo Atual" value={data.kpis.saldo_atual} />
        <Kpi label="Receitas do Mês" value={data.kpis.receitas_mes} />
        <Kpi label="Despesas do Mês" value={data.kpis.despesas_mes} />
        <Kpi label="Resultado do Mês" value={data.kpis.resultado_mes} />
        <Kpi label="Pagar em Aberto" value={data.kpis.contas_pagar_aberto} />
        <Kpi label="Receber em Aberto" value={data.kpis.contas_receber_aberto} />
      </div>
      <div className="chart-grid">
        <Panel title="Resultado mensal">
          <ResponsiveContainer height={280}><BarChart data={mensal}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="nome" /><YAxis /><Tooltip formatter={(v) => money(v)} /><Bar dataKey="receitas" fill="#2f9e73" /><Bar dataKey="despesas" fill="#d85d5d" /></BarChart></ResponsiveContainer>
        </Panel>
        <Panel title="Evolução do caixa">
          <ResponsiveContainer height={280}><AreaChart data={data.evolucao_caixa}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="data" /><YAxis /><Tooltip formatter={(v) => money(v)} /><Area dataKey="saldo_acumulado" fill="#4f83cc" stroke="#2f66b1" /></AreaChart></ResponsiveContainer>
        </Panel>
        <Panel title="Distribuição das despesas">
          <ResponsiveContainer height={260}><PieChart><Pie data={data.despesas_por_categoria} dataKey="valor" nameKey="categoria" innerRadius={62} outerRadius={96}>{data.despesas_por_categoria.map((_, i) => <Cell key={i} fill={["#2f9e73", "#4f83cc", "#d85d5d", "#d9a441", "#6f61c0"][i % 5]} />)}</Pie><Tooltip formatter={(v) => money(v)} /></PieChart></ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return <section className="panel"><h2>{title}</h2>{children}</section>;
}

function Loading() {
  return <div className="muted">Carregando...</div>;
}

function Truncate({ children, className = "" }) {
  const text = String(children ?? "-");
  return <span className={`truncate ${className}`} title={text}>{text}</span>;
}

function exportToExcel(filename, rows, columns, labels = {}) {
  const escapeHtml = (value) => String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
  const labelFor = (column) => labels[column] || column.replaceAll("_", " ");
  const moneyColumn = (column) => column.includes("valor") || column.includes("saldo") || column.includes("custo");
  const header = columns.map((column) => `<th>${escapeHtml(labelFor(column))}</th>`).join("");
  const body = rows.map((row) => `<tr>${columns.map((column) => {
    const value = moneyColumn(column) ? money(row[column]) : row[column];
    return `<td>${escapeHtml(value)}</td>`;
  }).join("")}</tr>`).join("");
  const html = `<html><head><meta charset="UTF-8" /></head><body><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function PeoplePage({ type }) {
  const path = type === "clientes" ? "/clientes" : "/fornecedores";
  const title = type === "clientes" ? "cliente" : "fornecedor";
  const { data, reload } = useResource(path, []);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nome_razao_social: "", cpf_cnpj: "", email: "", telefone: "" });
  const [formError, setFormError] = useState("");
  const filtered = useMemo(() => data.filter((row) => row.nome_razao_social.toLowerCase().includes(q.toLowerCase())), [data, q]);

  function emptyForm() {
    return { nome_razao_social: "", cpf_cnpj: "", email: "", telefone: "" };
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm());
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(row) {
    setEditingId(row.id);
    setForm({
      nome_razao_social: row.nome_razao_social || "",
      cpf_cnpj: row.cpf_cnpj || "",
      email: row.email || "",
      telefone: row.telefone || "",
    });
    setFormError("");
    setShowForm(true);
  }

  async function submit(event) {
    event.preventDefault();
    setFormError("");
    const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => {
      const normalized = typeof value === "string" ? value.trim() : value;
      return [key, normalized || null];
    }));
    try {
      await api(editingId ? `${path}/${editingId}` : path, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setForm(emptyForm());
      setEditingId(null);
      setShowForm(false);
      await reload();
    } catch (err) {
      setFormError(err.message || `Não foi possível salvar ${title}.`);
    }
  }

  async function deletePerson(row) {
    if (!window.confirm(`Excluir ${title} "${row.nome_razao_social}"?`)) return;
    await api(`${path}/${row.id}`, { method: "DELETE" });
    await reload();
  }

  return (
    <div className="stack">
      <Panel title={`Lista de ${type}`}>
        <div className="panel-actions">
          <button onClick={openCreateForm}><Plus size={16} /> Novo {title}</button>
        </div>
        <div className="filter"><Search size={16} /><input placeholder="Pesquisar" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {!filtered.length ? <p className="muted">Nenhum registro encontrado.</p> : (
          <table className="people-table">
            <thead><tr><th>Nome/Razão Social</th><th>CPF/CNPJ</th><th>E-mail</th><th>Telefone</th><th>Status</th><th></th></tr></thead>
            <tbody>{filtered.map((row) => (
              <tr key={row.id}>
                <td><Truncate>{row.nome_razao_social}</Truncate></td>
                <td><Truncate>{row.cpf_cnpj || "-"}</Truncate></td>
                <td><Truncate>{row.email || "-"}</Truncate></td>
                <td><Truncate>{row.telefone || "-"}</Truncate></td>
                <td><span className="badge">{row.status}</span></td>
                <td>
                  <div className="row-actions">
                    <button className="mini secondary" onClick={() => openEditForm(row)} title="Alterar"><Pencil size={14} /></button>
                    <button className="mini danger" onClick={() => deletePerson(row)} title="Excluir"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Panel>
      {showForm && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel">
            <div className="modal-header">
              <h2>{editingId ? `Alterar ${title}` : `Novo ${title}`}</h2>
              <button className="mini secondary" title="Fechar" onClick={() => { setShowForm(false); setEditingId(null); setFormError(""); }}><X size={16} /></button>
            </div>
            <form className="form" onSubmit={submit}>
              <label>Nome/Razão Social<input placeholder="Nome/Razão Social" value={form.nome_razao_social} onChange={(e) => setForm({ ...form, nome_razao_social: e.target.value })} required /></label>
              <label>CPF/CNPJ<input placeholder="CPF/CNPJ" value={form.cpf_cnpj} onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })} /></label>
              <label>E-mail<input placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label>Telefone<input placeholder="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></label>
              {formError && <p className="error">{formError}</p>}
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => { setShowForm(false); setEditingId(null); setFormError(""); }}>Cancelar</button>
                <button>{editingId ? "Salvar alterações" : `Salvar ${title}`}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function Categories() {
  const { data, reload } = useResource("/categorias", []);
  const [form, setForm] = useState({ nome: "", tipo: "Despesa", ativa: true });
  const [subForm, setSubForm] = useState({});
  const [editingCat, setEditingCat] = useState(null);
  const [editingSub, setEditingSub] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [error, setError] = useState("");
  const grouped = {
    Receita: data.filter((cat) => cat.tipo === "Receita"),
    Despesa: data.filter((cat) => cat.tipo === "Despesa"),
  };

  async function run(action) {
    setError("");
    try {
      await action();
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitCategory(event) {
    event.preventDefault();
    await run(async () => {
      await api("/categorias", { method: "POST", body: JSON.stringify(form) });
      setForm({ nome: "", tipo: "Despesa", ativa: true });
    });
  }

  async function saveCategory(category) {
    await run(async () => {
      await api(`/categorias/${category.id}`, { method: "PUT", body: JSON.stringify(editingCat) });
      setEditingCat(null);
    });
  }

  async function deleteCategory(category) {
    await run(async () => {
      await api(`/categorias/${category.id}`, { method: "DELETE" });
    });
  }

  async function submitSubcategory(category) {
    const name = subForm[category.id] || "";
    if (!name.trim()) return;
    await run(async () => {
      await api("/subcategorias", { method: "POST", body: JSON.stringify({ categoria_id: category.id, nome: name.trim(), ativa: true }) });
      setSubForm((current) => ({ ...current, [category.id]: "" }));
      setExpanded((current) => ({ ...current, [category.id]: true }));
    });
  }

  async function saveSubcategory(sub) {
    await run(async () => {
      await api(`/subcategorias/${sub.id}`, { method: "PUT", body: JSON.stringify(editingSub) });
      setEditingSub(null);
    });
  }

  async function deleteSubcategory(sub) {
    await run(async () => {
      await api(`/subcategorias/${sub.id}`, { method: "DELETE" });
    });
  }

  function startCategoryEdit(category) {
    setEditingCat({ id: category.id, nome: category.nome, tipo: category.tipo, ativa: category.ativa });
  }

  function startSubEdit(sub) {
    setEditingSub({ id: sub.id, nome: sub.nome, ativa: sub.ativa });
  }

  function renderCategoryRow(category) {
    const isOpen = expanded[category.id] ?? true;
    const isEditing = editingCat?.id === category.id;
    return (
      <div className="erp-category" key={category.id}>
        <div className="erp-category-main">
          <button className="mini secondary" title="Expandir" onClick={() => setExpanded((current) => ({ ...current, [category.id]: !isOpen }))}>
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {isEditing ? (
            <>
              <input className="category-name-input" autoFocus placeholder="Nome da categoria" value={editingCat.nome} onChange={(e) => setEditingCat({ ...editingCat, nome: e.target.value })} />
              <select value={editingCat.tipo} onChange={(e) => setEditingCat({ ...editingCat, tipo: e.target.value })}><option>Despesa</option><option>Receita</option></select>
              <label className="toggle-line"><input type="checkbox" checked={editingCat.ativa} onChange={(e) => setEditingCat({ ...editingCat, ativa: e.target.checked })} /> Ativa</label>
              <button className="mini" title="Salvar" onClick={() => saveCategory(category)}><Check size={14} /></button>
              <button className="mini secondary" title="Cancelar" onClick={() => setEditingCat(null)}><X size={14} /></button>
            </>
          ) : (
            <>
              <strong>{category.nome}</strong>
              <span className={`badge ${category.ativa ? "" : "inactive"}`}>{category.ativa ? "Ativa" : "Inativa"}</span>
              <small>{category.subcategorias.length} subcategoria(s)</small>
              <button className="mini secondary" title="Editar categoria" onClick={() => startCategoryEdit(category)}><Settings size={14} /></button>
              <button className="mini danger" title="Excluir categoria" onClick={() => deleteCategory(category)}><Trash2 size={14} /></button>
            </>
          )}
        </div>
        {isOpen && (
          <div className="erp-subtree">
            {category.subcategorias.map((sub) => {
              const subEditing = editingSub?.id === sub.id;
              return (
                <div className="erp-subcategory" key={sub.id}>
                  {subEditing ? (
                    <>
                      <input className="subcategory-name-input" autoFocus placeholder="Nome da subcategoria" value={editingSub.nome} onChange={(e) => setEditingSub({ ...editingSub, nome: e.target.value })} />
                      <label className="toggle-line"><input type="checkbox" checked={editingSub.ativa} onChange={(e) => setEditingSub({ ...editingSub, ativa: e.target.checked })} /> Ativa</label>
                      <button className="mini" title="Salvar" onClick={() => saveSubcategory(sub)}><Check size={14} /></button>
                      <button className="mini secondary" title="Cancelar" onClick={() => setEditingSub(null)}><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <span>{sub.nome}</span>
                      <span className={`badge ${sub.ativa ? "" : "inactive"}`}>{sub.ativa ? "Ativa" : "Inativa"}</span>
                      <button className="mini secondary" title="Editar subcategoria" onClick={() => startSubEdit(sub)}><Settings size={14} /></button>
                      <button className="mini danger" title="Excluir subcategoria" onClick={() => deleteSubcategory(sub)}><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              );
            })}
            <form className="erp-add-sub" onSubmit={(event) => { event.preventDefault(); submitSubcategory(category); }}>
              <input placeholder="Nova subcategoria" value={subForm[category.id] || ""} onChange={(e) => setSubForm((current) => ({ ...current, [category.id]: e.target.value }))} />
              <button className="mini">Adicionar</button>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="two-column">
        <Panel title="Nova categoria">
          <form className="form" onSubmit={submitCategory}>
            <label>Nome<input placeholder="Ex.: Bancos, Impostos, Vendas online" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></label>
            <label>Tipo<select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}><option>Despesa</option><option>Receita</option></select></label>
            <label className="toggle-line"><input type="checkbox" checked={form.ativa} onChange={(e) => setForm({ ...form, ativa: e.target.checked })} /> Categoria ativa</label>
            <button>Salvar categoria</button>
            {error && <p className="error">{error}</p>}
          </form>
        </Panel>
        <Panel title="Resumo do plano">
          <div className="category-summary">
            <div className="kpi"><span>Categorias</span><strong>{data.length}</strong></div>
            <div className="kpi"><span>Subcategorias</span><strong>{data.reduce((sum, cat) => sum + cat.subcategorias.length, 0)}</strong></div>
          </div>
        </Panel>
      </div>
      <Panel title="Plano de contas">
        <div className="erp-plan">
          {["Receita", "Despesa"].map((type) => (
            <section key={type} className="erp-group">
              <h3>{type}</h3>
              {grouped[type].length ? grouped[type].map((category) => renderCategoryRow(category)) : <p className="muted">Nenhuma categoria cadastrada.</p>}
            </section>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PayablesPage() {
  const { data, reload } = useResource("/contas-pagar", { items: [], summary: {} });
  const fornecedores = useResource("/fornecedores", []);
  const categorias = useResource("/categorias", []);
  const notas = useResource("/notas-fiscais", []);
  const despesaCategorias = categorias.data.filter((c) => c.tipo === "Despesa" && c.ativa);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);
  const [baixaTarget, setBaixaTarget] = useState(null);
  const [form, setForm] = useState({
    fornecedor_id: "",
    categoria_id: "",
    subcategoria_id: "",
    nota_fiscal_id: "",
    data_vencimento: new Date().toISOString().slice(0, 10),
    data_competencia: new Date().toISOString().slice(0, 10),
    descricao: "",
    valor: "",
  });
  const [baixaForm, setBaixaForm] = useState({
    data_baixa: new Date().toISOString().slice(0, 10),
    valor: "",
    observacao: "",
  });

  const categoriaSelecionada = despesaCategorias.find((cat) => String(cat.id) === String(form.categoria_id));
  const subcategorias = (categoriaSelecionada?.subcategorias || []).filter((sub) => sub.ativa);

  function emptyPayableForm() {
    return {
      fornecedor_id: fornecedores.data[0] ? String(fornecedores.data[0].id) : "",
      categoria_id: despesaCategorias[0] ? String(despesaCategorias[0].id) : "",
      subcategoria_id: despesaCategorias[0]?.subcategorias?.filter((sub) => sub.ativa)?.[0] ? String(despesaCategorias[0].subcategorias.filter((sub) => sub.ativa)[0].id) : "",
      nota_fiscal_id: "",
      data_vencimento: new Date().toISOString().slice(0, 10),
      data_competencia: new Date().toISOString().slice(0, 10),
      descricao: "",
      valor: "",
    };
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyPayableForm());
    setShowForm(true);
  }

  function openEditForm(row) {
    setEditingId(row.id);
    setForm({
      fornecedor_id: row.fornecedor_id ? String(row.fornecedor_id) : "",
      categoria_id: row.categoria_id ? String(row.categoria_id) : "",
      subcategoria_id: row.subcategoria_id ? String(row.subcategoria_id) : "",
      nota_fiscal_id: row.nota_fiscal_id ? String(row.nota_fiscal_id) : "",
      data_vencimento: row.data_vencimento,
      data_competencia: row.data_competencia,
      descricao: row.descricao,
      valor: String(row.valor),
    });
    setShowForm(true);
  }

  useEffect(() => {
    if (!form.fornecedor_id && fornecedores.data[0]) setForm((current) => ({ ...current, fornecedor_id: String(fornecedores.data[0].id) }));
  }, [fornecedores.data]);

  useEffect(() => {
    if (!form.categoria_id && despesaCategorias[0]) {
      const first = despesaCategorias[0];
      setForm((current) => ({ ...current, categoria_id: String(first.id), subcategoria_id: String(first.subcategorias?.filter((sub) => sub.ativa)?.[0]?.id || "") }));
    }
  }, [despesaCategorias]);

  async function loadDetail(id) {
    setSelected(id);
    const response = await api(`/contas-pagar/${id}`);
    setDetail(response);
    setBaixaForm({
      data_baixa: new Date().toISOString().slice(0, 10),
      valor: String(response.saldo_restante || ""),
      observacao: "",
    });
  }

  async function submit(event) {
    event.preventDefault();
    const payload = {
      ...form,
      fornecedor_id: form.fornecedor_id ? Number(form.fornecedor_id) : null,
      categoria_id: Number(form.categoria_id),
      subcategoria_id: Number(form.subcategoria_id),
      nota_fiscal_id: form.nota_fiscal_id ? Number(form.nota_fiscal_id) : null,
      valor: Number(form.valor),
    };
    await api(editingId ? `/contas-pagar/${editingId}` : "/contas-pagar", {
      method: editingId ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    setForm((current) => ({ ...current, descricao: "", valor: "", nota_fiscal_id: "" }));
    setEditingId(null);
    setShowForm(false);
    await reload();
    if (detail?.id === editingId) await loadDetail(editingId);
  }

  async function deletePayable(row) {
    if (!window.confirm(`Excluir o lançamento "${row.descricao}"?`)) return;
    await api(`/contas-pagar/${row.id}`, { method: "DELETE" });
    if (detail?.id === row.id) setDetail(null);
    await reload();
  }

  async function ensureClientFromInvoice(row) {
    if (!row.nota_fiscal_id) return;
    await api(`/notas-fiscais/${row.nota_fiscal_id}/cliente`, { method: "POST" });
    await reload();
    if (detail?.id === row.id) await loadDetail(row.id);
  }

  async function baixar(event) {
    event.preventDefault();
    const target = baixaTarget || detail;
    if (!target) return;
    await api(`/contas-pagar/${target.id}/baixas`, {
      method: "POST",
      body: JSON.stringify({ ...baixaForm, valor: Number(baixaForm.valor) }),
    });
    setBaixaTarget(null);
    await reload();
    if (detail?.id === target.id) await loadDetail(target.id);
  }

  function openBaixaModal(row) {
    setBaixaTarget(row);
    setBaixaForm({
      data_baixa: new Date().toISOString().slice(0, 10),
      valor: String(row.saldo_restante || ""),
      observacao: "",
    });
  }

  const payableExportColumns = ["data_vencimento", "data_competencia", "fornecedor_nome", "cliente_nf_nome", "numero_nf", "numero_boleto", "numero_parcela", "total_parcelas", "descricao", "valor", "saldo_restante", "status"];
  const payableExportLabels = {
    data_vencimento: "Vencimento",
    data_competencia: "Competência",
    fornecedor_nome: "Fornecedor",
    cliente_nf_nome: "Cliente NF",
    numero_nf: "NF",
    numero_boleto: "Boleto",
    numero_parcela: "Parcela",
    total_parcelas: "Total parcelas",
    descricao: "Descrição",
    valor: "Valor",
    saldo_restante: "Saldo",
    status: "Status",
  };
  const payableExportRows = data.items.map((row) => ({
    ...row,
    fornecedor_nome: row.fornecedor_nome || "-",
    cliente_nf_nome: row.cliente_nf_nome || "-",
  }));

  return (
    <div className="stack">
      <div className="kpi-grid compact">{Object.entries(data.summary || {}).map(([k, v]) => <Kpi key={k} label={k.replaceAll("_", " ")} value={v} />)}</div>
      <div className="payable-grid full">
        <Panel title="Lançamentos">
          <div className="panel-actions">
            <button className="secondary" onClick={() => exportToExcel("contas-a-pagar", payableExportRows, payableExportColumns, payableExportLabels)}>Excel</button>
            <button onClick={openCreateForm}><Plus size={16} /> Novo lançamento</button>
          </div>
          {!data.items.length ? <p className="muted">Nenhum lançamento encontrado.</p> : (
            <table className="payables-table">
              <thead><tr><th>Vencimento</th><th>Competência</th><th>Fornecedor</th><th>Cliente NF</th><th>NF</th><th>Boleto</th><th>Parcela</th><th>Descrição</th><th>Valor</th><th>Saldo</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>{data.items.map((row) => <tr key={row.id} className={new Date(row.data_vencimento) < new Date() && !String(row.status).includes("Pago") ? "overdue" : ""}>
                <td>{dateBR(row.data_vencimento)}</td>
                <td>{dateBR(row.data_competencia)}</td>
                <td><Truncate className="col-party">{row.fornecedor_nome || "-"}</Truncate></td>
                <td>{row.cliente_nf_id ? <span className="badge truncate col-party" title={row.cliente_nf_nome}>{row.cliente_nf_nome}</span> : row.nota_fiscal_id ? <button className="mini secondary" onClick={() => ensureClientFromInvoice(row)}>Adicionar</button> : "-"}</td>
                <td>{row.numero_nf || "-"}</td>
                <td>{row.numero_boleto || "-"}</td>
                <td>{row.total_parcelas ? `${row.numero_parcela}/${row.total_parcelas}` : "-"}</td>
                <td><Truncate className="col-description">{row.descricao}</Truncate></td>
                <td>{money(row.valor)}</td>
                <td>{money(row.saldo_restante)}</td>
                <td><span className="badge">{row.status}</span></td>
                <td>
                  <div className="action-cell">
                    <button className="mini secondary" onClick={() => setActionMenuId(actionMenuId === row.id ? null : row.id)}>Ações</button>
                    {actionMenuId === row.id && (
                      <div className="action-menu">
                        <button onClick={() => { setActionMenuId(null); loadDetail(row.id); }}><Eye size={14} /> Ver</button>
                        <button onClick={() => { setActionMenuId(null); openBaixaModal(row); }}><Check size={14} /> Baixar</button>
                        <button onClick={() => { setActionMenuId(null); openEditForm(row); }}><Pencil size={14} /> Editar</button>
                        <button className="danger-text" onClick={() => { setActionMenuId(null); deletePayable(row); }}><Trash2 size={14} /> Excluir</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>)}</tbody>
            </table>
          )}
        </Panel>
      </div>

      {showForm && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel">
            <div className="modal-header">
              <h2>{editingId ? "Alterar lançamento" : "Novo lançamento"}</h2>
              <button className="mini secondary" title="Fechar" onClick={() => { setShowForm(false); setEditingId(null); }}><X size={16} /></button>
            </div>
            <form className="form" onSubmit={submit}>
              <label>Fornecedor<select value={form.fornecedor_id} onChange={(e) => setForm({ ...form, fornecedor_id: e.target.value })}>{fornecedores.data.map((item) => <option key={item.id} value={item.id}>{item.nome_razao_social}</option>)}</select></label>
              <label>Categoria<select value={form.categoria_id} onChange={(e) => {
                const next = despesaCategorias.find((cat) => String(cat.id) === e.target.value);
                setForm({ ...form, categoria_id: e.target.value, subcategoria_id: String(next?.subcategorias?.filter((sub) => sub.ativa)?.[0]?.id || "") });
              }}>{despesaCategorias.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
              <label>Subcategoria<select value={form.subcategoria_id} onChange={(e) => setForm({ ...form, subcategoria_id: e.target.value })}>{subcategorias.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
              <label>Nota fiscal<select value={form.nota_fiscal_id} onChange={(e) => setForm({ ...form, nota_fiscal_id: e.target.value })}><option value="">Sem vínculo</option>{notas.data.map((nota) => <option key={nota.id} value={nota.id}>NF {nota.numero_nf || nota.id} - {money(nota.valor_total)}</option>)}</select></label>
              <label>Descrição<input placeholder="Descrição do lançamento" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required /></label>
              <div className="split-fields">
                <label>Vencimento<input type="date" value={form.data_vencimento} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })} /></label>
                <label>Competência<input type="date" value={form.data_competencia} onChange={(e) => setForm({ ...form, data_competencia: e.target.value })} /></label>
              </div>
              <label>Valor<input type="number" step="0.01" placeholder="0,00" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} required /></label>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</button>
                <button disabled={!form.categoria_id || !form.subcategoria_id}>{editingId ? "Salvar alterações" : "Salvar conta a pagar"}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {baixaTarget && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel">
            <div className="modal-header">
              <h2>Baixar pagamento</h2>
              <button className="mini secondary" title="Fechar" onClick={() => setBaixaTarget(null)}><X size={16} /></button>
            </div>
            <form className="form" onSubmit={baixar}>
              <label>Lançamento<input value={baixaTarget.descricao} readOnly /></label>
              <div className="split-fields">
                <label>Data da baixa<input type="date" value={baixaForm.data_baixa} onChange={(e) => setBaixaForm({ ...baixaForm, data_baixa: e.target.value })} /></label>
                <label>Valor<input type="number" step="0.01" value={baixaForm.valor} onChange={(e) => setBaixaForm({ ...baixaForm, valor: e.target.value })} /></label>
              </div>
              <label>Observação<input placeholder="Observação" value={baixaForm.observacao} onChange={(e) => setBaixaForm({ ...baixaForm, observacao: e.target.value })} /></label>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setBaixaTarget(null)}>Cancelar</button>
                <button>Confirmar baixa</button>
              </div>
            </form>
          </section>
        </div>
      )}

      <Panel title="Histórico do lançamento">
        {!detail ? <p className="muted">Selecione uma conta a pagar para ver nota fiscal, baixas e alterações.</p> : (
          <div className="detail-grid">
            <div className="detail-card">
              <h3><ClipboardList size={16} /> Dados financeiros</h3>
              <dl>
                <dt>Descrição</dt><dd>{detail.descricao}</dd>
                <dt>Fornecedor</dt><dd>{detail.fornecedor_nome || "-"}</dd>
                <dt>Cliente NF</dt><dd>{detail.cliente_nf_nome || (detail.nota_fiscal_id ? "Pendente" : "Sem NF")}</dd>
                <dt>Nota fiscal</dt><dd>{detail.numero_nf || "Sem vínculo"}</dd>
                <dt>Boleto</dt><dd>{detail.numero_boleto || "-"}</dd>
                <dt>Parcela</dt><dd>{detail.total_parcelas ? `${detail.numero_parcela}/${detail.total_parcelas}` : "-"}</dd>
                <dt>Vencimento</dt><dd>{dateBR(detail.data_vencimento)}</dd>
                <dt>Competência</dt><dd>{dateBR(detail.data_competencia)}</dd>
                <dt>Valor</dt><dd>{money(detail.valor)}</dd>
                <dt>Pago</dt><dd>{money(detail.valor_pago)}</dd>
                <dt>Saldo</dt><dd>{money(detail.saldo_restante)}</dd>
              </dl>
            </div>
            <div className="detail-card">
              <h3><Receipt size={16} /> Baixar conta</h3>
              <form className="form" onSubmit={baixar}>
                <input type="date" value={baixaForm.data_baixa} onChange={(e) => setBaixaForm({ ...baixaForm, data_baixa: e.target.value })} />
                <input type="number" step="0.01" value={baixaForm.valor} onChange={(e) => setBaixaForm({ ...baixaForm, valor: e.target.value })} />
                <input placeholder="Observação" value={baixaForm.observacao} onChange={(e) => setBaixaForm({ ...baixaForm, observacao: e.target.value })} />
                <button disabled={Number(detail.saldo_restante) <= 0}>Registrar baixa</button>
              </form>
            </div>
            <div className="detail-card">
              <h3><History size={16} /> Baixas financeiras</h3>
              <div className="timeline">{detail.baixas.length ? detail.baixas.map((item) => <div key={item.id}><strong>{dateBR(item.data_baixa)} · {money(item.valor)}</strong><span>{item.observacao || "Baixa registrada"}</span></div>) : <p className="muted">Nenhuma baixa registrada.</p>}</div>
            </div>
            <div className="detail-card">
              <h3><History size={16} /> Alterações</h3>
              <div className="timeline">{detail.historico.length ? detail.historico.map((item) => <div key={item.id}><strong>{item.acao}</strong><span>{item.dados || "-"}</span></div>) : <p className="muted">Nenhuma alteração registrada.</p>}</div>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}

function Accounts({ kind }) {
  const isPay = kind === "pagar";
  const endpoint = isPay ? "/contas-pagar" : "/contas-receber";
  const peopleEndpoint = isPay ? "/fornecedores" : "/clientes";
  const { data, reload } = useResource(endpoint, { items: [], summary: {} });
  const people = useResource(peopleEndpoint, []);
  const categories = useResource("/categorias", []);
  const usableCategories = categories.data.filter((c) => c.tipo === (isPay ? "Despesa" : "Receita") && c.ativa);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    pessoa_id: "",
    categoria_id: "",
    subcategoria_id: "",
    descricao: "",
    valor: "",
    data_vencimento: new Date().toISOString().slice(0, 10),
    data_competencia: new Date().toISOString().slice(0, 10),
  });
  const selectedCategory = usableCategories.find((cat) => String(cat.id) === String(form.categoria_id));
  const subcategories = (selectedCategory?.subcategorias || []).filter((sub) => sub.ativa);
  const peopleById = useMemo(() => Object.fromEntries(people.data.map((item) => [item.id, item.nome_razao_social])), [people.data]);

  function emptyAccountForm() {
    const firstCategory = usableCategories[0];
    return {
      pessoa_id: people.data[0] ? String(people.data[0].id) : "",
      categoria_id: firstCategory ? String(firstCategory.id) : "",
      subcategoria_id: firstCategory?.subcategorias?.filter((sub) => sub.ativa)?.[0] ? String(firstCategory.subcategorias.filter((sub) => sub.ativa)[0].id) : "",
      descricao: "",
      valor: "",
      data_vencimento: new Date().toISOString().slice(0, 10),
      data_competencia: new Date().toISOString().slice(0, 10),
    };
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyAccountForm());
    setShowForm(true);
  }

  function openEditForm(row) {
    setEditingId(row.id);
    setForm({
      pessoa_id: String(isPay ? row.fornecedor_id || "" : row.cliente_id || ""),
      categoria_id: row.categoria_id ? String(row.categoria_id) : "",
      subcategoria_id: row.subcategoria_id ? String(row.subcategoria_id) : "",
      descricao: row.descricao || "",
      valor: String(row.valor || ""),
      data_vencimento: row.data_vencimento,
      data_competencia: row.data_competencia,
    });
    setShowForm(true);
  }

  async function submit(event) {
    event.preventDefault();
    const payload = {
      descricao: form.descricao,
      data_vencimento: form.data_vencimento,
      data_competencia: form.data_competencia,
      valor: Number(form.valor),
      [isPay ? "fornecedor_id" : "cliente_id"]: form.pessoa_id ? Number(form.pessoa_id) : null,
      categoria_id: Number(form.categoria_id),
      subcategoria_id: Number(form.subcategoria_id),
    };
    await api(editingId ? `${endpoint}/${editingId}` : endpoint, {
      method: editingId ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    setEditingId(null);
    setShowForm(false);
    setForm(emptyAccountForm());
    await reload();
  }

  async function baixa(row) {
    await api(`${endpoint}/${row.id}/baixas`, { method: "POST", body: JSON.stringify({ data_baixa: new Date().toISOString().slice(0, 10), valor: Number(row.valor) - Number(row.valor_pago || row.valor_recebido || 0), observacao: "Baixa pela interface" }) });
    await reload();
  }

  async function deleteAccount(row) {
    if (!window.confirm(`Excluir o lançamento "${row.descricao}"?`)) return;
    await api(`${endpoint}/${row.id}`, { method: "DELETE" });
    await reload();
  }

  const accountExportColumns = ["data_vencimento", "data_competencia", "pessoa_nome", "descricao", "valor", "status"];
  const accountExportLabels = {
    data_vencimento: "Vencimento",
    data_competencia: "Competência",
    pessoa_nome: isPay ? "Fornecedor" : "Cliente",
    descricao: "Descrição",
    valor: "Valor",
    status: "Status",
  };
  const accountExportRows = data.items.map((row) => ({
    ...row,
    pessoa_nome: peopleById[isPay ? row.fornecedor_id : row.cliente_id] || "-",
  }));

  return (
    <div className="stack">
      <div className="kpi-grid compact">{Object.entries(data.summary || {}).map(([k, v]) => <Kpi key={k} label={k.replaceAll("_", " ")} value={v} />)}</div>
      <div className="payable-grid full">
        <Panel title="Lançamentos">
          <div className="panel-actions">
            <button className="secondary" onClick={() => exportToExcel(isPay ? "contas-a-pagar" : "contas-a-receber", accountExportRows, accountExportColumns, accountExportLabels)}>Excel</button>
            <button onClick={openCreateForm}><Plus size={16} /> Novo lançamento</button>
          </div>
          <table><thead><tr><th>Vencimento</th><th>Competência</th><th>{isPay ? "Fornecedor" : "Cliente"}</th><th>Descrição</th><th>Valor</th><th>Status</th><th></th></tr></thead><tbody>{data.items.map((row) => <tr key={row.id} className={new Date(row.data_vencimento) < new Date() && !String(row.status).includes("Pago") && !String(row.status).includes("Recebido") ? "overdue" : ""}>
            <td>{dateBR(row.data_vencimento)}</td>
            <td>{dateBR(row.data_competencia)}</td>
            <td>{peopleById[isPay ? row.fornecedor_id : row.cliente_id] || "-"}</td>
            <td>{row.descricao}</td>
            <td>{money(row.valor)}</td>
            <td><span className="badge">{row.status}</span></td>
            <td>
              <div className="row-actions">
                <button className="mini" onClick={() => baixa(row)}>Baixar</button>
                <button className="mini secondary" onClick={() => openEditForm(row)} title="Alterar"><Pencil size={14} /></button>
                <button className="mini danger" onClick={() => deleteAccount(row)} title="Excluir"><Trash2 size={14} /></button>
              </div>
            </td>
          </tr>)}</tbody></table>
        </Panel>
      </div>
      {showForm && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel">
            <div className="modal-header">
              <h2>{editingId ? "Alterar lançamento" : `Nova conta a ${isPay ? "pagar" : "receber"}`}</h2>
              <button className="mini secondary" title="Fechar" onClick={() => { setShowForm(false); setEditingId(null); }}><X size={16} /></button>
            </div>
            <form className="form" onSubmit={submit}>
              <label>{isPay ? "Fornecedor" : "Cliente"}<select value={form.pessoa_id} onChange={(e) => setForm({ ...form, pessoa_id: e.target.value })}>{people.data.map((item) => <option key={item.id} value={item.id}>{item.nome_razao_social}</option>)}</select></label>
              <label>Categoria<select value={form.categoria_id} onChange={(e) => {
                const next = usableCategories.find((cat) => String(cat.id) === e.target.value);
                setForm({ ...form, categoria_id: e.target.value, subcategoria_id: String(next?.subcategorias?.filter((sub) => sub.ativa)?.[0]?.id || "") });
              }}>{usableCategories.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
              <label>Subcategoria<select value={form.subcategoria_id} onChange={(e) => setForm({ ...form, subcategoria_id: e.target.value })}>{subcategories.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
              <label>Descrição<input placeholder="Descrição do lançamento" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required /></label>
              <div className="split-fields">
                <label>Vencimento<input type="date" value={form.data_vencimento} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })} /></label>
                <label>Competência<input type="date" value={form.data_competencia} onChange={(e) => setForm({ ...form, data_competencia: e.target.value })} /></label>
              </div>
              <label>Valor<input type="number" step="0.01" placeholder="0,00" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} required /></label>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</button>
                <button disabled={!form.categoria_id || !form.subcategoria_id}>{editingId ? "Salvar alterações" : `Salvar conta a ${isPay ? "pagar" : "receber"}`}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
function XmlPage() {
  const [message, setMessage] = useState("");
  const [view, setView] = useState("notas");
  const [expanded, setExpanded] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [pendingXmlFile, setPendingXmlFile] = useState(null);
  const [xmlProducts, setXmlProducts] = useState([]);
  const [xmlAssignments, setXmlAssignments] = useState([]);
  const [categoryEditNota, setCategoryEditNota] = useState(null);
  const [categoryEditAssignments, setCategoryEditAssignments] = useState([]);
  const notas = useResource("/notas-fiscais", []);
  const categories = useResource("/categorias", []);
  const despesaCategories = categories.data.filter((cat) => cat.tipo === "Despesa" && cat.ativa);
  const defaultXmlCategory = despesaCategories.find((cat) => cat.nome === "Compras") || despesaCategories[0];
  const defaultXmlSubcategory = (defaultXmlCategory?.subcategorias || []).filter((sub) => sub.ativa).find((sub) => sub.nome === "Produtos") || (defaultXmlCategory?.subcategorias || []).filter((sub) => sub.ativa)[0];
  const categoryNameById = useMemo(() => Object.fromEntries(categories.data.map((cat) => [cat.id, cat.nome])), [categories.data]);
  const subcategoryNameById = useMemo(() => Object.fromEntries(categories.data.flatMap((cat) => (cat.subcategorias || []).map((sub) => [sub.id, sub.nome]))), [categories.data]);
  const availableMonths = useMemo(() => Array.from(new Set(notas.data.map((nota) => nota.data_emissao ? nota.data_emissao.slice(0, 7) : "-"))).filter((mes) => mes !== "-").sort().reverse(), [notas.data]);
  const filteredNotas = useMemo(() => selectedMonth ? notas.data.filter((nota) => nota.data_emissao?.slice(0, 7) === selectedMonth) : notas.data, [notas.data, selectedMonth]);
  const itemRows = useMemo(() => notas.data.flatMap((nota) => (nota.produtos || []).map((produto) => ({
    ...produto,
    categoria: categoryNameById[produto.categoria_id] || "-",
    subcategoria: subcategoryNameById[produto.subcategoria_id] || "-",
    nota_id: nota.id,
    numero_nf: nota.numero_nf,
    fornecedor: nota.nome_emitente,
    data_emissao: nota.data_emissao,
    mes: nota.data_emissao ? nota.data_emissao.slice(0, 7) : "-",
  }))), [notas.data, categoryNameById, subcategoryNameById]);
  const filteredItemRows = useMemo(() => selectedMonth ? itemRows.filter((item) => item.mes === selectedMonth) : itemRows, [itemRows, selectedMonth]);
  const monthlyCosts = useMemo(() => {
    const rows = new Map();
    for (const item of filteredItemRows) {
      const key = `${item.mes}|${item.descricao}`;
      const current = rows.get(key) || { mes: item.mes, descricao: item.descricao, quantidade: 0, valor_total: 0 };
      current.quantidade += Number(item.quantidade || 0);
      current.valor_total += Number(item.valor_total || 0);
      rows.set(key, current);
    }
    return Array.from(rows.values()).map((row) => ({ ...row, custo_medio: row.quantidade ? row.valor_total / row.quantidade : 0 }));
  }, [filteredItemRows]);

  function parseXmlProducts(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, "text/xml");
    const byLocalName = (node, name) => Array.from(node.getElementsByTagName("*")).filter((item) => item.localName === name);
    return byLocalName(doc, "det").map((det, index) => {
      const prod = byLocalName(det, "prod")[0];
      const read = (tag) => byLocalName(prod || det, tag)[0]?.textContent?.trim() || "";
      return {
        index,
        codigo: read("cProd"),
        descricao: read("xProd") || `Produto ${index + 1}`,
        quantidade: read("qCom"),
        valor_total: read("vProd"),
      };
    });
  }

  async function upload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const xmlText = await file.text();
    const products = parseXmlProducts(xmlText);
    setPendingXmlFile(file);
    setXmlProducts(products);
    setXmlAssignments(products.map(() => ({
      categoria_id: defaultXmlCategory ? String(defaultXmlCategory.id) : "",
      subcategoria_id: defaultXmlSubcategory ? String(defaultXmlSubcategory.id) : "",
    })));
    event.target.value = "";
  }

  async function confirmXmlImport(event) {
    event.preventDefault();
    if (!pendingXmlFile) return;
    const form = new FormData();
    form.append("file", pendingXmlFile);
    form.append("item_categories", JSON.stringify(xmlAssignments));
    const data = await api("/xml-nfe/importar", { method: "POST", body: form });
    setMessage(`NF-e ${data.numero_nf || data.id} importada com ${data.parcelas || 1} conta(s) a pagar.`);
    setPendingXmlFile(null);
    setXmlProducts([]);
    setXmlAssignments([]);
    notas.reload();
  }

  function updateXmlAssignment(index, changes) {
    setXmlAssignments((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item));
  }

  function openCategoryEdit(nota) {
    setCategoryEditNota(nota);
    setCategoryEditAssignments((nota.produtos || []).map((produto) => ({
      produto_id: produto.id,
      categoria_id: produto.categoria_id ? String(produto.categoria_id) : (defaultXmlCategory ? String(defaultXmlCategory.id) : ""),
      subcategoria_id: produto.subcategoria_id ? String(produto.subcategoria_id) : (defaultXmlSubcategory ? String(defaultXmlSubcategory.id) : ""),
    })));
  }

  function updateCategoryEditAssignment(index, changes) {
    setCategoryEditAssignments((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item));
  }

  async function saveCategoryEdit(event) {
    event.preventDefault();
    if (!categoryEditNota) return;
    await api(`/notas-fiscais/${categoryEditNota.id}/categorias`, {
      method: "PUT",
      body: JSON.stringify({
        produtos: categoryEditAssignments.map((item) => ({
          produto_id: Number(item.produto_id),
          categoria_id: Number(item.categoria_id),
          subcategoria_id: Number(item.subcategoria_id),
        })),
      }),
    });
    setMessage(`Categorias da NF ${categoryEditNota.numero_nf || categoryEditNota.id} atualizadas e contas a pagar recalculadas.`);
    setCategoryEditNota(null);
    setCategoryEditAssignments([]);
    await notas.reload();
  }

  async function deleteInvoice(nota) {
    if (!window.confirm(`Excluir a NF ${nota.numero_nf || nota.id} e os lançamentos em aberto vinculados?`)) return;
    await api(`/notas-fiscais/${nota.id}`, { method: "DELETE" });
    await notas.reload();
  }

  function moneyNumber(value) {
    return money(Number(value || 0));
  }

  return (
    <div className="stack">
      <Panel title="Importar XML NF-e">
        <input type="file" accept=".xml" onChange={upload} />
        {message && <p className="success">{message}</p>}
      </Panel>
      {pendingXmlFile && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel wide">
            <div className="modal-header">
              <h2>Categorias dos produtos da NF</h2>
              <button className="mini secondary" title="Fechar" onClick={() => { setPendingXmlFile(null); setXmlProducts([]); setXmlAssignments([]); }}><X size={16} /></button>
            </div>
            <form className="form" onSubmit={confirmXmlImport}>
              <div className="xml-category-list">
                <table>
                  <thead><tr><th>Produto</th><th>Qtd.</th><th>Valor</th><th>Categoria</th><th>Subcategoria</th></tr></thead>
                  <tbody>{xmlProducts.map((product, index) => {
                    const assignment = xmlAssignments[index] || {};
                    const selectedCategory = despesaCategories.find((cat) => String(cat.id) === String(assignment.categoria_id));
                    const subcategories = (selectedCategory?.subcategorias || []).filter((sub) => sub.ativa);
                    return (
                      <tr key={`${product.codigo}-${index}`}>
                        <td><Truncate className="col-description">{product.descricao}</Truncate></td>
                        <td>{Number(product.quantidade || 0).toLocaleString("pt-BR")}</td>
                        <td>{money(Number(product.valor_total || 0))}</td>
                        <td><select value={assignment.categoria_id || ""} onChange={(event) => {
                          const next = despesaCategories.find((cat) => String(cat.id) === event.target.value);
                          const nextSub = (next?.subcategorias || []).filter((sub) => sub.ativa)[0];
                          updateXmlAssignment(index, { categoria_id: event.target.value, subcategoria_id: nextSub ? String(nextSub.id) : "" });
                        }}>{despesaCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}</select></td>
                        <td><select value={assignment.subcategoria_id || ""} onChange={(event) => updateXmlAssignment(index, { subcategoria_id: event.target.value })}>{subcategories.map((sub) => <option key={sub.id} value={sub.id}>{sub.nome}</option>)}</select></td>
                      </tr>
                    );
                  })}</tbody>
                </table>
                {!xmlProducts.length && <p className="muted">Nenhum produto encontrado no XML. A NF será lançada em Compras / Produtos.</p>}
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => { setPendingXmlFile(null); setXmlProducts([]); setXmlAssignments([]); }}>Cancelar</button>
                <button disabled={xmlProducts.some((_, index) => !xmlAssignments[index]?.categoria_id || !xmlAssignments[index]?.subcategoria_id)}>Importar NF-e</button>
              </div>
            </form>
          </section>
        </div>
      )}
      {categoryEditNota && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-panel wide">
            <div className="modal-header">
              <h2>Alterar categorias da NF {categoryEditNota.numero_nf || categoryEditNota.id}</h2>
              <button className="mini secondary" title="Fechar" onClick={() => { setCategoryEditNota(null); setCategoryEditAssignments([]); }}><X size={16} /></button>
            </div>
            <form className="form" onSubmit={saveCategoryEdit}>
              <div className="xml-category-list">
                <table>
                  <thead><tr><th>Produto</th><th>Qtd.</th><th>Valor</th><th>Categoria</th><th>Subcategoria</th></tr></thead>
                  <tbody>{(categoryEditNota.produtos || []).map((product, index) => {
                    const assignment = categoryEditAssignments[index] || {};
                    const selectedCategory = despesaCategories.find((cat) => String(cat.id) === String(assignment.categoria_id));
                    const subcategories = (selectedCategory?.subcategorias || []).filter((sub) => sub.ativa);
                    return (
                      <tr key={product.id}>
                        <td><Truncate className="col-description">{product.descricao}</Truncate></td>
                        <td>{Number(product.quantidade || 0).toLocaleString("pt-BR")}</td>
                        <td>{money(Number(product.valor_total || 0))}</td>
                        <td><select value={assignment.categoria_id || ""} onChange={(event) => {
                          const next = despesaCategories.find((cat) => String(cat.id) === event.target.value);
                          const nextSub = (next?.subcategorias || []).filter((sub) => sub.ativa)[0];
                          updateCategoryEditAssignment(index, { categoria_id: event.target.value, subcategoria_id: nextSub ? String(nextSub.id) : "" });
                        }}>{despesaCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}</select></td>
                        <td><select value={assignment.subcategoria_id || ""} onChange={(event) => updateCategoryEditAssignment(index, { subcategoria_id: event.target.value })}>{subcategories.map((sub) => <option key={sub.id} value={sub.id}>{sub.nome}</option>)}</select></td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => { setCategoryEditNota(null); setCategoryEditAssignments([]); }}>Cancelar</button>
                <button disabled={categoryEditAssignments.some((item) => !item.categoria_id || !item.subcategoria_id)}>Salvar e recalcular</button>
              </div>
            </form>
          </section>
        </div>
      )}
      <div className="segmented">
        <button className={view === "notas" ? "active" : ""} onClick={() => setView("notas")}>XML NF-e</button>
        <button className={view === "itens" ? "active" : ""} onClick={() => setView("itens")}>XML entradas por item</button>
        <button className={view === "custos" ? "active" : ""} onClick={() => setView("custos")}>Custo médio mensal</button>
      </div>
      <Panel title="Filtro">
        <div className="report-toolbar">
          <label>Mês<select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="">Todos</option>
            {availableMonths.map((mes) => <option key={mes} value={mes}>{mes}</option>)}
          </select></label>
        </div>
      </Panel>

      {view === "notas" && (
        <Panel title="Notas importadas">
          {!filteredNotas.length ? <p className="muted">Nenhuma nota importada para o mês selecionado.</p> : (
            <table>
              <thead><tr><th></th><th>Número NF</th><th>Chave acesso</th><th>Nome emitente</th><th>Valor total</th><th>Ações</th></tr></thead>
              <tbody>{filteredNotas.map((nota) => (
                <React.Fragment key={nota.id}>
                  <tr>
                    <td><button className="mini secondary" title="Ver itens" onClick={() => setExpanded((current) => ({ ...current, [nota.id]: !current[nota.id] }))}>{expanded[nota.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button></td>
                    <td>{nota.numero_nf || nota.id}</td>
                    <td>{nota.chave_acesso || "-"}</td>
                    <td>{nota.nome_emitente || "-"}</td>
                    <td>{moneyNumber(nota.valor_total)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="mini secondary" onClick={() => openCategoryEdit(nota)}>Categorias</button>
                        <button className="mini danger" title="Excluir NF" onClick={() => deleteInvoice(nota)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                  {expanded[nota.id] && (nota.produtos || []).map((produto) => (
                    <tr className="sub-row" key={produto.id}>
                      <td></td>
                      <td>NF {nota.numero_nf || nota.id}</td>
                      <td colSpan="2">{nota.nome_emitente || "-"} - {produto.descricao}</td>
                      <td>{moneyNumber(produto.valor_total)}</td>
                      <td>{Number(produto.quantidade || 0).toLocaleString("pt-BR")} un. · {categoryNameById[produto.categoria_id] || "-"} / {subcategoryNameById[produto.subcategoria_id] || "-"}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}</tbody>
            </table>
          )}
        </Panel>
      )}

      {view === "itens" && (
        <Panel title="XML entradas por item">
          <Table rows={filteredItemRows} columns={["numero_nf", "fornecedor", "descricao", "categoria", "subcategoria", "quantidade", "valor_unitario", "valor_total"]} />
        </Panel>
      )}

      {view === "custos" && (
        <Panel title="Custo médio mensal">
          <Table rows={monthlyCosts} columns={["mes", "descricao", "quantidade", "valor_total", "custo_medio"]} />
        </Panel>
      )}
    </div>
  );
}

function Flow({ projected }) {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [expandedFlowCategories, setExpandedFlowCategories] = useState({});
  const [year, month] = selectedMonth.split("-").map(Number);
  const monthly = useResource(`/fluxo-caixa/mensal?year=${year}&month=${month}`, { resumo: [], lancamentos: [] });
  const annual = useResource(`/fluxo-caixa/projetado-anual?year=${selectedYear}`, { saldo_inicial: 0, resumo: [], totais: { entradas: [], saidas: [], liquido: [], saldo_final: [] } });
  const monthLabels = Array.from({ length: 12 }, (_, idx) => new Date(selectedYear, idx, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase());
  const lancamentoColumns = ["data", "descricao", "categoria", "subcategoria", "tipo", "valor", "baixado", "saldo", "status_fluxo"];
  const lancamentoLabels = {
    data: "Data",
    descricao: "Descrição",
    categoria: "Categoria",
    subcategoria: "Subcategoria",
    tipo: "Tipo",
    valor: "Valor",
    baixado: "Baixado",
    saldo: "Saldo",
    status_fluxo: "Status",
  };

  const totalPrevisto = monthly.data.resumo.reduce((sum, row) => sum + Number(row.valor || 0), 0);
  const totalBaixado = monthly.data.lancamentos.reduce((sum, row) => sum + Number(row.baixado || 0), 0);
  const totalSaldo = monthly.data.lancamentos.reduce((sum, row) => sum + Number(row.saldo || 0), 0);
  const saldoInicial = Number(monthly.data.saldo_inicial || 0);
  const tipoCategoria = (value) => String(value || "").toLowerCase();
  const entradaRows = monthly.data.resumo.filter((row) => tipoCategoria(row.tipo_categoria).includes("receita"));
  const saidaRows = monthly.data.resumo.filter((row) => tipoCategoria(row.tipo_categoria).includes("despesa"));
  const totalEntradas = entradaRows.reduce((sum, row) => sum + Number(row.valor || 0), 0);
  const totalSaidas = saidaRows.reduce((sum, row) => sum + Number(row.valor || 0), 0);
  const saldoFinal = saldoInicial + totalEntradas + totalSaidas;
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "").toUpperCase();
  const flowValue = (value, { dashZero = true } = {}) => {
    const number = Number(value || 0);
    if (dashZero && Math.abs(number) < 0.005) return "—";
    return money(number);
  };
  const groupFlowRows = (rows, section) => rows.reduce((groups, row) => {
    const key = `${section}-${row.categoria_id}`;
    if (!groups[key]) {
      groups[key] = {
        key,
        categoria: row.categoria,
        valor: 0,
        subcategorias: [],
      };
    }
    groups[key].valor += Number(row.valor || 0);
    groups[key].subcategorias.push(row);
    return groups;
  }, {});
  const toggleFlowCategory = (key) => {
    setExpandedFlowCategories((current) => ({ ...current, [key]: !current[key] }));
  };
  const renderFlowGroups = (rows, section) => Object.values(groupFlowRows(rows, section)).map((group) => {
    const isExpanded = Boolean(expandedFlowCategories[group.key]);
    return (
      <React.Fragment key={group.key}>
        <tr className={`category-row ${Math.abs(group.valor) < 0.005 ? "zero-row" : ""}`}>
          <td title={group.categoria}>
            <button type="button" className="flow-toggle" data-flow-key={group.key} onClick={() => toggleFlowCategory(group.key)} title={isExpanded ? "Recolher" : "Abrir"}>
              {isExpanded ? "⌄" : "›"}
            </button>
            <strong>{group.categoria}</strong>
          </td>
          <td className={group.valor < 0 ? "negative" : "positive"}>{flowValue(group.valor)}</td>
        </tr>
        {isExpanded && group.subcategorias.map((row) => (
          <tr key={`${group.key}-${row.subcategoria_id}`} className={`subcategory-row ${Number(row.valor || 0) === 0 ? "zero-row" : ""}`}>
            <td title={`${row.categoria} - ${row.subcategoria}`}>
              <span>{row.subcategoria}</span>
            </td>
            <td className={Number(row.valor || 0) < 0 ? "negative" : "positive"}>{flowValue(row.valor)}</td>
          </tr>
        ))}
      </React.Fragment>
    );
  });
  const groupAnnualRows = (rows, section) => rows.reduce((groups, row) => {
    const key = `${section}-${row.categoria_id}`;
    if (!groups[key]) {
      groups[key] = {
        key,
        categoria: row.categoria,
        meses: Array(12).fill(0),
        subcategorias: [],
      };
    }
    (row.meses || []).forEach((value, idx) => {
      groups[key].meses[idx] += Number(value || 0);
    });
    groups[key].subcategorias.push(row);
    return groups;
  }, {});
  const cellClass = (value) => Number(value || 0) < 0 ? "negative" : "positive";
  const renderAnnualCells = (values, options = { dashZero: false }) => monthLabels.map((label, idx) => (
    <td key={label} className={cellClass(values?.[idx])}>{flowValue(values?.[idx], options)}</td>
  ));
  const renderAnnualGroups = (rows, section) => Object.values(groupAnnualRows(rows, section)).map((group) => {
    const isExpanded = Boolean(expandedFlowCategories[group.key]);
    const total = group.meses.reduce((sum, value) => sum + Number(value || 0), 0);
    return (
      <React.Fragment key={group.key}>
        <tr className={`category-row ${Math.abs(total) < 0.005 ? "zero-row" : ""}`}>
          <td title={group.categoria}>
            <button type="button" className="flow-toggle" data-flow-key={group.key} onClick={() => toggleFlowCategory(group.key)} title={isExpanded ? "Recolher" : "Abrir"}>
              {isExpanded ? "⌄" : "›"}
            </button>
            <strong>{group.categoria}</strong>
          </td>
          {renderAnnualCells(group.meses)}
        </tr>
        {isExpanded && group.subcategorias.map((row) => (
          <tr key={`${group.key}-${row.subcategoria_id}`} className={`subcategory-row ${(row.meses || []).every((value) => Math.abs(Number(value || 0)) < 0.005) ? "zero-row" : ""}`}>
            <td title={`${row.categoria} - ${row.subcategoria}`}><span>{row.subcategoria}</span></td>
            {renderAnnualCells(row.meses)}
          </tr>
        ))}
      </React.Fragment>
    );
  });
  const annualEntradaRows = annual.data.resumo.filter((row) => tipoCategoria(row.tipo_categoria).includes("receita"));
  const annualSaidaRows = annual.data.resumo.filter((row) => tipoCategoria(row.tipo_categoria).includes("despesa"));
  const annualExportRows = annual.data.resumo.map((row) => ({
    categoria: row.categoria,
    subcategoria: row.subcategoria,
    ...Object.fromEntries(monthLabels.map((label, idx) => [label, row.meses?.[idx] || 0])),
    total: row.total || 0,
  }));
  const annualExportColumns = ["categoria", "subcategoria", ...monthLabels, "total"];
  const annualExportLabels = { categoria: "Categoria", subcategoria: "Subcategoria", total: "Total" };

  if (projected) {
    return (
      <div className="stack">
        <Panel title="Filtro">
          <div className="report-toolbar">
            <label>Ano<input type="number" value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value) || today.getFullYear())} /></label>
          </div>
        </Panel>
        <Panel title="Fluxo projetado anual">
          <div className="panel-actions">
            <button className="secondary" onClick={() => exportToExcel(`fluxo-projetado-${selectedYear}`, annualExportRows, annualExportColumns, annualExportLabels)}>Excel</button>
          </div>
          <table className="cashflow-statement annual">
            <thead>
              <tr>
                <th>Categoria / Subcategoria</th>
                {monthLabels.map((label) => <th key={label}>{label}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr className="balance-row">
                <td>Saldo Inicial</td>
                {monthLabels.map((label, idx) => <td key={label} className={cellClass(idx === 0 ? annual.data.saldo_inicial : annual.data.totais?.saldo_final?.[idx - 1])}>{flowValue(idx === 0 ? annual.data.saldo_inicial : annual.data.totais?.saldo_final?.[idx - 1], { dashZero: false })}</td>)}
              </tr>
              <tr className="section-row"><td colSpan="13">Entradas</td></tr>
              {renderAnnualGroups(annualEntradaRows, "projetado-entradas")}
              <tr className="total-row entries">
                <td>Total Entradas</td>
                {renderAnnualCells(annual.data.totais?.entradas, { dashZero: false })}
              </tr>
              <tr className="section-row"><td colSpan="13">Saídas</td></tr>
              {renderAnnualGroups(annualSaidaRows, "projetado-saidas")}
              <tr className="total-row exits">
                <td>Total Saídas</td>
                {renderAnnualCells(annual.data.totais?.saidas, { dashZero: false })}
              </tr>
              <tr className="net-row">
                <td>Fluxo de Caixa Líquido</td>
                {renderAnnualCells(annual.data.totais?.liquido, { dashZero: false })}
              </tr>
              <tr className="final-row">
                <td>Saldo Final</td>
                {renderAnnualCells(annual.data.totais?.saldo_final, { dashZero: false })}
              </tr>
            </tbody>
          </table>
        </Panel>
      </div>
    );
  }

  return (
    <div className="stack">
      <Panel title="Filtro">
        <div className="report-toolbar">
          <label>Mês<input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} /></label>
        </div>
      </Panel>
      <Panel title="Fluxo mensal">
        <div className="panel-actions">
          <button className="secondary" onClick={() => exportToExcel(`fluxo-categorias-${selectedMonth}`, monthly.data.resumo, ["categoria", "subcategoria", "valor"])}>Excel</button>
        </div>
        <table className="cashflow-statement">
          <thead>
            <tr>
              <th>Categoria / Subcategoria</th>
              <th>{monthLabel}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="balance-row">
              <td>Saldo Inicial</td>
              <td>{flowValue(saldoInicial, { dashZero: false })}</td>
            </tr>
            <tr className="section-row"><td colSpan="2">Entradas</td></tr>
            {renderFlowGroups(entradaRows, "entradas")}
            <tr className="total-row entries">
              <td>Total Entradas</td>
              <td>{flowValue(totalEntradas, { dashZero: false })}</td>
            </tr>
            <tr className="section-row"><td colSpan="2">Saídas</td></tr>
            {renderFlowGroups(saidaRows, "saidas")}
            <tr className="total-row exits">
              <td>Total Saídas</td>
              <td>{flowValue(totalSaidas, { dashZero: false })}</td>
            </tr>
            <tr className="net-row">
              <td>Fluxo de Caixa Líquido</td>
              <td className={totalPrevisto < 0 ? "negative" : "positive"}>{flowValue(totalPrevisto, { dashZero: false })}</td>
            </tr>
            <tr className="final-row">
              <td>Saldo Final</td>
              <td className={saldoFinal < 0 ? "negative" : "positive"}>{flowValue(saldoFinal, { dashZero: false })}</td>
            </tr>
          </tbody>
        </table>
      </Panel>
      <Panel title="Lançamentos do mês">
        <div className="panel-actions">
          <button className="secondary" onClick={() => exportToExcel(`fluxo-lancamentos-${selectedMonth}`, monthly.data.lancamentos, lancamentoColumns, lancamentoLabels)}>Excel</button>
        </div>
        {!monthly.data.lancamentos.length ? <p className="muted">Nenhum lançamento para o mês selecionado.</p> : (
          <table className="flow-table">
            <thead><tr>{lancamentoColumns.map((col) => <th key={col}>{lancamentoLabels[col]}</th>)}</tr></thead>
            <tbody>{monthly.data.lancamentos.map((row) => (
              <tr key={`${row.tipo}-${row.id}`}>
                <td>{dateBR(row.data)}</td>
                <td><Truncate className="col-description">{row.descricao}</Truncate></td>
                <td>{row.categoria}</td>
                <td>{row.subcategoria}</td>
                <td>{row.tipo}</td>
                <td>{money(row.valor)}</td>
                <td>{money(row.baixado)}</td>
                <td>{money(row.saldo)}</td>
                <td><span className="badge">{row.status_fluxo}</span></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

function Reports() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const { data } = useResource(`/relatorios/mensal?year=${year}&month=${month}`, {});
  const receitas = data.receitas || {};
  const despesas = data.despesas || {};
  const resultado = Number(receitas.recebido || 0) - Number(despesas.total_pago || 0);
  const competencia = `${String(month).padStart(2, "0")}/${year}`;
  const rows = [
    { grupo: "Receitas", indicador: "Total aberto", valor: receitas.total_aberto || 0 },
    { grupo: "Receitas", indicador: "Recebido", valor: receitas.recebido || 0 },
    { grupo: "Receitas", indicador: "Vencido", valor: receitas.vencido || 0 },
    { grupo: "Receitas", indicador: "A receber", valor: receitas.a_receber || 0 },
    { grupo: "Despesas", indicador: "Total aberto", valor: despesas.total_aberto || 0 },
    { grupo: "Despesas", indicador: "Total pago", valor: despesas.total_pago || 0 },
    { grupo: "Despesas", indicador: "Vencido", valor: despesas.vencido || 0 },
    { grupo: "Despesas", indicador: "A vencer", valor: despesas.a_vencer || 0 },
  ];

  return (
    <div className="stack">
      <Panel title="Filtros do relatório">
        <div className="report-toolbar">
          <label>Mês<select value={month} onChange={(e) => setMonth(Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => i + 1).map((value) => <option key={value} value={value}>{String(value).padStart(2, "0")}</option>)}</select></label>
          <label>Ano<input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /></label>
          <div className="actions">
            <a href={`http://localhost:8000/api/relatorios/mensal.xlsx?year=${year}&month=${month}`}>Excel</a>
            <a href={`http://localhost:8000/api/relatorios/mensal.pdf?year=${year}&month=${month}`}>PDF</a>
          </div>
        </div>
      </Panel>
      <div className="kpi-grid compact">
        <Kpi label={`Recebido ${competencia}`} value={receitas.recebido || 0} />
        <Kpi label={`A receber ${competencia}`} value={receitas.a_receber || 0} />
        <Kpi label={`Pago ${competencia}`} value={despesas.total_pago || 0} />
        <Kpi label={`Resultado ${competencia}`} value={resultado} />
      </div>
      <Panel title="Relatório mensal">
        <table>
          <thead><tr><th>Grupo</th><th>Indicador</th><th>Valor</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={`${row.grupo}-${row.indicador}`}><td>{row.grupo}</td><td>{row.indicador}</td><td>{money(row.valor)}</td></tr>)}</tbody>
        </table>
      </Panel>
    </div>
  );
}

function Config() {
  const today = new Date();
  const [mes, setMes] = useState(today.toISOString().slice(0, 7));
  const [valor, setValor] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState("");
  const caixa = useResource(`/configuracoes/caixa-inicial?mes=${mes}`, { mes, valor: 0 });
  const billing = useResource("/billing/status", { active: true, days_remaining: 0, plans: {} });

  useEffect(() => {
    setValor(String(caixa.data.valor ?? 0));
  }, [caixa.data.valor]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const normalized = Number(String(valor).replace(",", ".") || 0);
      await api("/configuracoes/caixa-inicial", {
        method: "PUT",
        body: JSON.stringify({ mes, valor: normalized }),
      });
      setMessage("Caixa inicial salvo.");
      caixa.reload();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function hire(plan) {
    setPaying(plan);
    setMessage("");
    try {
      const data = await billingCheckout(plan);
      const url = data.init_point || data.sandbox_init_point;
      if (!url) throw new Error("Link de pagamento nao gerado.");
      window.location.href = url;
    } catch (err) {
      setMessage(err.message);
    } finally {
      setPaying("");
    }
  }

  return (
    <div className="stack">
      <Panel title="Caixa inicial">
        <form className="form settings-form" onSubmit={save}>
          <label>Mês do caixa inicial<input type="month" value={mes} onChange={(event) => setMes(event.target.value)} required /></label>
          <label>Caixa inicial<input type="number" step="0.01" value={valor} onChange={(event) => setValor(event.target.value)} required /></label>
          <button disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
        </form>
        <p className="muted">Esse valor entra como saldo inicial do mês antes da conciliação do fluxo de caixa.</p>
        <div className="billing-footer">
          <div>
            <strong>Contratação</strong>
            <p className="muted">Licença válida até {dateBR(billing.data.active_until)}.</p>
          </div>
          <div className="billing-actions settings-billing-actions">
            <button onClick={() => hire("monthly")} disabled={Boolean(paying)}>{paying === "monthly" ? "Gerando..." : `Mensal ${money(billing.data.plans?.monthly?.price || 29.9)}`}</button>
            <button onClick={() => hire("annual")} disabled={Boolean(paying)}>{paying === "annual" ? "Gerando..." : `Anual ${money(billing.data.plans?.annual?.price || 299.9)}`}</button>
          </div>
          {!billing.data.payment_configured && <p className="error">Pagamento ainda nao configurado no servidor.</p>}
        </div>
        {message && <p className={message.includes("salvo") ? "success" : "error"}>{message}</p>}
      </Panel>
    </div>
  );
}

function AdminPage({ onAccessUser }) {
  const PAGE_SIZE = 10;
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(q, p) {
    setLoading(true);
    setError("");
    try {
      const [list, count] = await Promise.all([adminListUsers(q, p), adminCountUsers(q)]);
      setUsers(list);
      setTotal(count.total);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(search, page); }, [search, page]);

  async function toggle(id) {
    try {
      await adminToggleUser(id);
      await load(search, page);
    } catch (e) { alert(e.message); }
  }

  async function accessUser(id) {
    try {
      await onAccessUser(id);
    } catch (e) {
      alert(e.message);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="stack">
      <Panel title="Usuários cadastrados">
        <div className="panel-actions" style={{ gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <input className="search-input-admin" placeholder="Buscar por nome ou e-mail..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { setPage(1); setSearch(query); } }} />
            <button onClick={() => { setPage(1); setSearch(query); }}>Buscar</button>
          </div>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>{total} usuário{total !== 1 ? "s" : ""}</span>
        </div>
        {error && <p className="error">{error}</p>}
        {loading ? <p className="muted">Carregando...</p> : (
          <table>
            <thead><tr><th>Nome</th><th>Empresa</th><th>E-mail</th><th>Telefone</th><th>Licença</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {!users.length ? <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--muted)", padding: 24 }}>Nenhum usuário.</td></tr>
                : users.map(u => (
                  <tr key={u.id}>
                    <td>{u.nome}{u.is_admin && <span className="badge" style={{ marginLeft: 6 }}>Admin</span>}</td>
                    <td>{u.empresa_nome || "-"}</td>
                    <td>{u.email}</td>
                    <td>{u.telefone || "—"}</td>
                    <td>
                      {u.is_admin ? "—" : (
                        <span className={u.licenca_ativa ? "success" : "error"}>
                          {u.dias_restantes ?? 0} dia{Number(u.dias_restantes) === 1 ? "" : "s"} · até {dateBR(u.licenca_ate)}
                        </span>
                      )}
                    </td>
                    <td><span className={`badge ${u.ativo ? "" : "inactive"}`}>{u.ativo ? "Ativo" : "Inativo"}</span></td>
                    <td>
                      {!u.is_admin && <div className="row-actions">
                        <button className="mini secondary" disabled={!u.ativo} onClick={() => accessUser(u.id)}>Acessar área</button>
                        <button className={`mini ${u.ativo ? "danger" : ""}`} onClick={() => toggle(u.id)}>{u.ativo ? "Desativar" : "Ativar"}</button>
                      </div>}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
        {totalPages > 1 && (
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            <button className="mini secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`mini ${p === page ? "" : "secondary"}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="mini secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        )}
      </Panel>
    </div>
  );
}

function Table({ rows = [], columns = [] }) {
  if (!rows.length) return <p className="muted">Nenhum registro encontrado.</p>;
  return <table><thead><tr>{columns.map((col) => <th key={col}>{col.replaceAll("_", " ")}</th>)}</tr></thead><tbody>{rows.map((row, idx) => <tr key={row.id || idx}>{columns.map((col) => <td key={col}>{col.includes("valor") || col.includes("saldo") || col.includes("custo") ? money(row[col]) : String(row[col] ?? "-")}</td>)}</tr>)}</tbody></table>;
}

const pages = {
  clientes: () => <PeoplePage type="clientes" />,
  fornecedores: () => <PeoplePage type="fornecedores" />,
  xml: XmlPage,
  pagar: PayablesPage,
  receber: () => <Accounts kind="receber" />,
  fluxo: () => <Flow />,
  projetado: () => <Flow projected />,
  categorias: Categories,
  config: Config,
  admin: AdminPage,
};

function App() {
  const [user, setUser] = useState(null);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [authPage, setAuthPage] = useState("login");
  const [supportMode, setSupportMode] = useState(Boolean(getAdminToken()));

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    me().then(async (u) => {
      setUser(u);
      if (!u.is_admin && !getAdminToken()) setBilling(await billingStatus());
    }).catch(() => { logout(); }).finally(() => setLoading(false));
  }, []);

  function handleDone() {
    me().then(async (u) => {
      setUser(u);
      setBilling(!u.is_admin ? await billingStatus() : null);
    });
  }
  function handleLogout() {
    logout();
    setUser(null);
    setBilling(null);
    setSupportMode(false);
    setAuthPage("login");
  }

  async function handleAccessUser(userId) {
    const adminToken = getToken();
    const data = await adminAccessUser(userId);
    setAdminToken(adminToken);
    setToken(data.access_token);
    setSupportMode(true);
    setBilling(null);
    setUser(await me());
  }

  async function handleReturnAdmin() {
    const adminToken = getAdminToken();
    if (!adminToken) return;
    setToken(adminToken);
    clearAdminToken();
    setSupportMode(false);
    setBilling(null);
    setUser(await me());
  }

  if (loading) return <div style={{ padding: 40, color: "#888" }}>Carregando...</div>;
  if (!user) return authPage === "login"
    ? <Login onDone={handleDone} onRegister={() => setAuthPage("register")} />
    : <Register onDone={handleDone} onLogin={() => setAuthPage("login")} />;
  if (!user.is_admin && !supportMode && billing && !billing.active) return <BillingLock status={billing} onLogout={handleLogout} />;
  return <Shell user={user} onLogout={handleLogout} onAccessUser={handleAccessUser} onReturnAdmin={handleReturnAdmin} supportMode={supportMode} />;
}

createRoot(document.getElementById("root")).render(<App />);
