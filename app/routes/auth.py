from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.init_db import seed_categories
from app.db.session import get_db
from app.models.entities import Empresa, Usuario
from app.routes.deps import get_current_user
from app.schemas.common import LoginPayload, RegisterPayload, Token, UserOut

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/login", response_model=Token)
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    user = db.scalar(select(Usuario).where(Usuario.email == payload.email, Usuario.ativo.is_(True)))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(401, "Credenciais inválidas.")
    return Token(access_token=create_access_token(user.email))


@router.post("/register", response_model=Token, status_code=201)
def register(payload: RegisterPayload, db: Session = Depends(get_db)):
    if len(payload.password) < 8:
        raise HTTPException(400, "A senha deve ter no mínimo 8 caracteres.")
    if not payload.telefone.strip():
        raise HTTPException(400, "Telefone é obrigatório.")
    if db.scalar(select(Usuario).where(Usuario.email == payload.email)):
        raise HTTPException(400, "E-mail já cadastrado.")

    empresa = Empresa(nome=payload.empresa_nome, trial_ends_at=date.today() + timedelta(days=30))
    db.add(empresa)
    db.flush()

    seed_categories(db, empresa.id)

    user = Usuario(
        empresa_id=empresa.id,
        nome=payload.nome,
        email=payload.email,
        telefone=payload.telefone.strip(),
        hashed_password=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()

    return Token(access_token=create_access_token(user.email))


@router.get("/me", response_model=UserOut)
def me(user: Usuario = Depends(get_current_user)):
    return user
