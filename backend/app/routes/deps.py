from datetime import date, timedelta

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_token_payload
from app.db.session import get_db
from app.models.entities import Empresa, Usuario

bearer = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    payload = decode_token_payload(credentials.credentials)
    email = payload.get("sub") if payload else None
    if not email:
        raise HTTPException(status_code=401, detail="Token inválido.")
    user = db.scalar(select(Usuario).where(Usuario.email == email, Usuario.ativo.is_(True)))
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado.")
    user._support_access = bool(payload.get("support")) if payload else False
    return user


def subscription_status(empresa: Empresa) -> dict:
    today = date.today()
    trial_end = empresa.trial_ends_at or ((empresa.created_at.date() if empresa.created_at else today) + timedelta(days=30))
    paid_until = empresa.assinatura_ends_at
    active_until = paid_until if paid_until and paid_until >= today else trial_end
    active = bool(active_until and active_until >= today)
    return {
        "active": active,
        "trial_ends_at": trial_end,
        "assinatura_ends_at": paid_until,
        "active_until": active_until,
        "days_remaining": max(0, (active_until - today).days) if active_until else 0,
    }


def get_empresa_id(user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)) -> int:
    if user.is_admin or getattr(user, "_support_access", False):
        return user.empresa_id
    empresa = db.get(Empresa, user.empresa_id)
    if empresa and not subscription_status(empresa)["active"]:
        raise HTTPException(status_code=402, detail="Periodo gratis encerrado. Regularize o pagamento para continuar.")
    return user.empresa_id


def get_admin_user(user: Usuario = Depends(get_current_user)) -> Usuario:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores.")
    return user
