# FluxoPro

Sistema financeiro empresarial em Python + React para fluxo de caixa, contas a pagar, contas a receber, XML de NF-e, categorias, plano de contas, assinaturas e area administrativa.

## Stack

- Backend: FastAPI, SQLAlchemy, Pydantic, JWT
- Frontend: React, Vite, Recharts
- Banco: SQLite em desenvolvimento, PostgreSQL em producao
- Pagamentos: Mercado Pago Checkout Pro
- Deploy sugerido: Supabase + Render + GitHub

## Rodar local

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

A API fica em `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

A interface fica em `http://localhost:5173`.

As credenciais de administrador ficam em `backend/.env` e nao devem ser publicadas no repositorio.

## Producao

### Supabase

Crie um projeto no Supabase e use a connection string PostgreSQL no `DATABASE_URL` do backend. Exemplo:

```env
DATABASE_URL=postgresql+psycopg://postgres:SENHA@HOST:6543/postgres
```

### Render

O arquivo `render.yaml` cria dois servicos:

- `fluxopro-api`: backend FastAPI
- `fluxopro-web`: frontend React/Vite estatico

Variaveis obrigatorias no Render:

```env
DATABASE_URL=postgresql+psycopg://...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
MERCADO_PAGO_ACCESS_TOKEN=...
```

Variaveis de dominio:

```env
CORS_ORIGINS=https://fluxopro.com.br,https://www.fluxopro.com.br
APP_BASE_URL=https://fluxopro.com.br
API_BASE_URL=https://api.fluxopro.com.br/api
VITE_API_URL=https://api.fluxopro.com.br/api
```

### Dominio

Recomendacao:

- `fluxopro.com.br` e `www.fluxopro.com.br` apontam para o frontend.
- `api.fluxopro.com.br` aponta para o backend.

No Mercado Pago, configure o webhook para:

```text
https://api.fluxopro.com.br/api/billing/webhook
```

## Estrutura

```text
backend/
  app/
    core/
    db/
    models/
    repositories/
    routes/
    schemas/
    services/
frontend/
  src/
    api/
    lib/
    main.jsx
    styles.css
```

## Pendencias recomendadas antes de escala

- Adicionar Alembic para migrations versionadas.
- Configurar backup automatico do Supabase.
- Criar ambiente separado de staging.
- Adicionar testes automatizados de login, assinatura e importacao XML.
