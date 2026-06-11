from __future__ import annotations

import json
from datetime import date, timedelta
from decimal import Decimal
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import APIRouter, Depends, HTTPException, Request as FastAPIRequest
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.entities import Empresa, Usuario
from app.routes.deps import get_current_user, subscription_status

router = APIRouter(prefix="/billing", tags=["Billing"])


class CheckoutInput(BaseModel):
    plan: str = "monthly"


def plan_config(plan: str) -> dict:
    settings = get_settings()
    if plan == "annual":
        return {"key": "annual", "label": "Plano anual", "price": settings.mercado_pago_annual_price, "days": 365}
    return {"key": "monthly", "label": "Plano mensal", "price": settings.mercado_pago_monthly_price, "days": 30}


def company_status(empresa: Empresa) -> dict:
    status = subscription_status(empresa)
    return {
        "active": status["active"],
        "days_remaining": status["days_remaining"],
        "trial_ends_at": status["trial_ends_at"].isoformat() if status["trial_ends_at"] else None,
        "assinatura_ends_at": status["assinatura_ends_at"].isoformat() if status["assinatura_ends_at"] else None,
        "active_until": status["active_until"].isoformat() if status["active_until"] else None,
    }


def mp_request(path: str, method: str = "GET", payload: dict | None = None) -> dict:
    settings = get_settings()
    if not settings.mercado_pago_access_token:
        raise HTTPException(503, "Token do Mercado Pago nao configurado.")
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = Request(
        f"https://api.mercadopago.com{path}",
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {settings.mercado_pago_access_token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urlopen(req, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise HTTPException(exc.code, detail or "Erro Mercado Pago.") from exc
    except URLError as exc:
        raise HTTPException(503, "Nao foi possivel conectar ao Mercado Pago.") from exc


@router.get("/status")
def get_billing_status(user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    empresa = db.get(Empresa, user.empresa_id)
    if not empresa:
        raise HTTPException(404, "Empresa nao encontrada.")
    return {
        **company_status(empresa),
        "plans": {
            "monthly": plan_config("monthly"),
            "annual": plan_config("annual"),
        },
        "payment_configured": bool(get_settings().mercado_pago_access_token),
    }


@router.post("/checkout")
def create_checkout(payload: CheckoutInput, user: Usuario = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.is_admin:
        raise HTTPException(400, "Administradores nao precisam de assinatura.")
    empresa = db.get(Empresa, user.empresa_id)
    if not empresa:
        raise HTTPException(404, "Empresa nao encontrada.")
    settings = get_settings()
    plan = plan_config(payload.plan)
    payload = {
        "items": [{
            "title": f"{settings.mercado_pago_plan_title} - {plan['label']}",
            "quantity": 1,
            "unit_price": float(Decimal(str(plan["price"]))),
            "currency_id": "BRL",
        }],
        "payer": {"name": user.nome, "email": user.email},
        "external_reference": f"empresa:{empresa.id}:plan:{plan['key']}",
        "back_urls": {
            "success": f"{settings.app_base_url}/?pagamento=sucesso",
            "failure": f"{settings.app_base_url}/?pagamento=falha",
            "pending": f"{settings.app_base_url}/?pagamento=pendente",
        },
        "notification_url": f"{settings.api_base_url}/billing/webhook",
    }
    preference = mp_request("/checkout/preferences", "POST", payload)
    return {"init_point": preference.get("init_point"), "sandbox_init_point": preference.get("sandbox_init_point")}


@router.post("/webhook")
async def mercado_pago_webhook(request: FastAPIRequest, db: Session = Depends(get_db)):
    body = await request.json()
    payment_id = body.get("data", {}).get("id") or body.get("id")
    event_type = body.get("type") or body.get("topic")
    if event_type not in {"payment", "payments"} or not payment_id:
        return {"ok": True}

    payment = mp_request(f"/v1/payments/{payment_id}")
    if payment.get("status") != "approved":
        return {"ok": True}
    reference = payment.get("external_reference") or ""
    if not reference.startswith("empresa:"):
        return {"ok": True}
    parts = reference.split(":")
    empresa_id = int(parts[1])
    plan_key = parts[3] if len(parts) >= 4 and parts[2] == "plan" else "monthly"
    plan = plan_config(plan_key)
    empresa = db.get(Empresa, empresa_id)
    if not empresa:
        return {"ok": True}

    today = date.today()
    base = empresa.assinatura_ends_at if empresa.assinatura_ends_at and empresa.assinatura_ends_at > today else today
    empresa.assinatura_ends_at = base + timedelta(days=plan["days"])
    db.commit()
    return {"ok": True}
