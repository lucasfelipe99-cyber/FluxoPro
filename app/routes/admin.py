from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.db.session import get_db
from app.models.entities import Empresa, Usuario
from app.routes.deps import get_admin_user, subscription_status
from app.schemas.common import Token, UserOut

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/usuarios")
def list_usuarios(
    q: str | None = None,
    page: int = 1,
    page_size: int = 20,
    _admin: Usuario = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    stmt = select(Usuario)
    if q:
        stmt = stmt.where(
            Usuario.nome.ilike(f"%{q}%") | Usuario.email.ilike(f"%{q}%")
        )
    stmt = stmt.order_by(Usuario.created_at.desc())
    offset = (page - 1) * page_size
    users = db.scalars(stmt.offset(offset).limit(page_size)).all()
    empresas = {
        empresa.id: empresa
        for empresa in db.scalars(select(Empresa).where(Empresa.id.in_([user.empresa_id for user in users]))).all()
    } if users else {}
    rows = []
    for user in users:
        empresa = empresas.get(user.empresa_id)
        billing = subscription_status(empresa) if empresa else {}
        rows.append({
            "id": user.id,
            "nome": user.nome,
            "email": user.email,
            "telefone": user.telefone,
            "ativo": user.ativo,
            "is_admin": user.is_admin,
            "created_at": user.created_at,
            "empresa_id": user.empresa_id,
            "empresa_nome": empresa.nome if empresa else "-",
            "licenca_ativa": billing.get("active", True),
            "dias_restantes": billing.get("days_remaining"),
            "licenca_ate": billing.get("active_until"),
        })
    return rows


@router.get("/usuarios/count")
def count_usuarios(
    q: str | None = None,
    _admin: Usuario = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    stmt = select(Usuario)
    if q:
        stmt = stmt.where(
            Usuario.nome.ilike(f"%{q}%") | Usuario.email.ilike(f"%{q}%")
        )
    return {"total": len(db.scalars(stmt).all())}


@router.put("/usuarios/{user_id}/toggle", response_model=UserOut)
def toggle_usuario(
    user_id: int,
    _admin: Usuario = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.scalar(select(Usuario).where(Usuario.id == user_id))
    if not user:
        raise HTTPException(404, "Usuário não encontrado.")
    if user.is_admin:
        raise HTTPException(400, "Não é possível desativar um administrador.")
    user.ativo = not user.ativo
    db.commit()
    db.refresh(user)
    return user


@router.post("/usuarios/{user_id}/access", response_model=Token)
def access_usuario(
    user_id: int,
    _admin: Usuario = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.scalar(select(Usuario).where(Usuario.id == user_id, Usuario.ativo.is_(True)))
    if not user:
        raise HTTPException(404, "Usuário não encontrado ou inativo.")
    if user.is_admin:
        raise HTTPException(400, "Selecione um cliente para acessar.")
    return Token(access_token=create_access_token(user.email, extra={"support": True, "admin": _admin.email}))
