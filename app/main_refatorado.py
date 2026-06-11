"""
MUDANÇAS em relação ao main.py original:
- Substituído @app.on_event("startup") pelo lifespan context manager
  (on_event foi deprecado no FastAPI 0.93 e será removido em versão futura).
- A lógica de startup permanece idêntica; apenas o mecanismo de registro muda.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.init_db import ensure_sqlite_schema, seed_database
from app.db.session import Base, SessionLocal, engine
from app.models import entities  # noqa: F401
from app.routes import auth, crud, finance

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- startup ---
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ensure_sqlite_schema(db)
        seed_database(db)
    finally:
        db.close()
    yield
    # --- shutdown (adicionar lógica aqui se necessário) ---


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router, prefix="/api")
app.include_router(crud.router, prefix="/api")
app.include_router(finance.router, prefix="/api")
