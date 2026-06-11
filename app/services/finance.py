from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import extract, select
from sqlalchemy.orm import Session

from app.models.entities import BaixaFinanceira, Categoria, ContaPagar, ContaReceber
from app.models.enums import StatusPagar, StatusReceber, TipoBaixa, TipoCategoria
from app.schemas.common import BaixaPayload


def atualizar_status_pagar(conta: ContaPagar) -> None:
    if conta.valor_pago <= 0:
        conta.status = StatusPagar.aberto
    elif conta.valor_pago >= conta.valor:
        conta.status = StatusPagar.pago
    else:
        conta.status = StatusPagar.parcial


def atualizar_status_receber(conta: ContaReceber) -> None:
    if conta.valor_recebido <= 0:
        conta.status = StatusReceber.aberto
    elif conta.valor_recebido >= conta.valor:
        conta.status = StatusReceber.recebido
    else:
        conta.status = StatusReceber.parcial


def baixar_conta_pagar(db: Session, conta: ContaPagar, payload: BaixaPayload) -> ContaPagar:
    if conta.status == StatusPagar.cancelado:
        raise HTTPException(400, "Conta cancelada não pode receber baixa.")
    restante = Decimal(conta.valor) - Decimal(conta.valor_pago or 0)
    if payload.valor <= 0 or payload.valor > restante:
        raise HTTPException(400, "Valor da baixa inválido.")
    conta.valor_pago = Decimal(conta.valor_pago or 0) + payload.valor
    atualizar_status_pagar(conta)
    db.add(BaixaFinanceira(
        empresa_id=conta.empresa_id,
        tipo=TipoBaixa.pagar,
        conta_pagar_id=conta.id,
        data_baixa=payload.data_baixa,
        valor=payload.valor,
        observacao=payload.observacao,
    ))
    return conta


def baixar_conta_receber(db: Session, conta: ContaReceber, payload: BaixaPayload) -> ContaReceber:
    if conta.status == StatusReceber.cancelado:
        raise HTTPException(400, "Conta cancelada não pode receber baixa.")
    restante = Decimal(conta.valor) - Decimal(conta.valor_recebido or 0)
    if payload.valor <= 0 or payload.valor > restante:
        raise HTTPException(400, "Valor da baixa inválido.")
    conta.valor_recebido = Decimal(conta.valor_recebido or 0) + payload.valor
    atualizar_status_receber(conta)
    db.add(BaixaFinanceira(
        empresa_id=conta.empresa_id,
        tipo=TipoBaixa.receber,
        conta_receber_id=conta.id,
        data_baixa=payload.data_baixa,
        valor=payload.valor,
        observacao=payload.observacao,
    ))
    return conta


def resumo_pagar(contas: list[ContaPagar]) -> dict[str, Decimal]:
    hoje = date.today()
    aberto = vencido = vencer = pago = Decimal("0")
    for conta in contas:
        if conta.status == StatusPagar.cancelado:
            continue
        saldo = Decimal(conta.valor) - Decimal(conta.valor_pago or 0)
        if conta.status == StatusPagar.pago:
            pago += Decimal(conta.valor_pago or 0)
        else:
            aberto += saldo
            if conta.data_vencimento < hoje:
                vencido += saldo
            else:
                vencer += saldo
    return {"total_aberto": aberto, "total_pago": pago, "vencido": vencido, "a_vencer": vencer}


def resumo_receber(contas: list[ContaReceber]) -> dict[str, Decimal]:
    hoje = date.today()
    aberto = vencido = receber = recebido = Decimal("0")
    for conta in contas:
        if conta.status == StatusReceber.cancelado:
            continue
        saldo = Decimal(conta.valor) - Decimal(conta.valor_recebido or 0)
        if conta.status == StatusReceber.recebido:
            recebido += Decimal(conta.valor_recebido or 0)
        else:
            aberto += saldo
            if conta.data_vencimento < hoje:
                vencido += saldo
            else:
                receber += saldo
    return {"total_aberto": aberto, "recebido": recebido, "vencido": vencido, "a_receber": receber}


def fluxo_realizado(db: Session, empresa_id: int, start: date | None = None, end: date | None = None):
    stmt = select(BaixaFinanceira).where(BaixaFinanceira.empresa_id == empresa_id)
    if start:
        stmt = stmt.where(BaixaFinanceira.data_baixa >= start)
    if end:
        stmt = stmt.where(BaixaFinanceira.data_baixa <= end)
    baixas = db.scalars(stmt).all()

    pagar_ids = {b.conta_pagar_id for b in baixas if b.conta_pagar_id}
    receber_ids = {b.conta_receber_id for b in baixas if b.conta_receber_id}

    contas_pagar: dict[int, ContaPagar] = (
        {c.id: c for c in db.scalars(select(ContaPagar).where(ContaPagar.id.in_(pagar_ids)))}
        if pagar_ids else {}
    )
    contas_receber: dict[int, ContaReceber] = (
        {c.id: c for c in db.scalars(select(ContaReceber).where(ContaReceber.id.in_(receber_ids)))}
        if receber_ids else {}
    )

    categoria_ids = (
        {c.categoria_id for c in contas_pagar.values()}
        | {c.categoria_id for c in contas_receber.values()}
    )
    categorias: dict[int, Categoria] = (
        {c.id: c for c in db.scalars(select(Categoria).where(Categoria.id.in_(categoria_ids)))}
        if categoria_ids else {}
    )

    movimentos = []
    for baixa in baixas:
        conta = contas_receber.get(baixa.conta_receber_id) if baixa.tipo == TipoBaixa.receber else contas_pagar.get(baixa.conta_pagar_id)
        if not conta:
            continue
        categoria = categorias.get(conta.categoria_id)
        movimentos.append({
            "baixa_id": baixa.id,
            "conta_id": conta.id,
            "origem_tipo": baixa.tipo.value,
            "data": baixa.data_baixa,
            "descricao": conta.descricao,
            "categoria_id": conta.categoria_id,
            "subcategoria_id": conta.subcategoria_id,
            "categoria": categoria.nome if categoria else "-",
            "tipo": "Entrada" if baixa.tipo == TipoBaixa.receber else "Saída",
            "valor": Decimal(baixa.valor) if baixa.tipo == TipoBaixa.receber else -Decimal(baixa.valor),
        })

    saldo = Decimal("0")
    rows = []
    for mov in sorted(movimentos, key=lambda m: m["data"]):
        saldo += mov["valor"]
        rows.append({**mov, "saldo_acumulado": saldo})
    return rows


def fluxo_projetado(db: Session, empresa_id: int, dias: int = 90, saldo_inicial: Decimal = Decimal("0")):
    hoje = date.today()
    fim = hoje + timedelta(days=dias)
    movimentos = []
    for conta in db.scalars(select(ContaReceber).where(
        ContaReceber.empresa_id == empresa_id,
        ContaReceber.status.in_([StatusReceber.aberto, StatusReceber.parcial]),
        ContaReceber.data_vencimento.between(hoje, fim),
    )):
        saldo = Decimal(conta.valor) - Decimal(conta.valor_recebido or 0)
        movimentos.append({"data": conta.data_vencimento, "descricao": conta.descricao, "tipo": "Entrada prevista", "valor": saldo})
    for conta in db.scalars(select(ContaPagar).where(
        ContaPagar.empresa_id == empresa_id,
        ContaPagar.status.in_([StatusPagar.aberto, StatusPagar.parcial]),
        ContaPagar.data_vencimento.between(hoje, fim),
    )):
        saldo = Decimal(conta.valor) - Decimal(conta.valor_pago or 0)
        movimentos.append({"data": conta.data_vencimento, "descricao": conta.descricao, "tipo": "Saída prevista", "valor": -saldo})
    saldo = saldo_inicial
    rows = []
    for mov in sorted(movimentos, key=lambda m: m["data"]):
        saldo += mov["valor"]
        rows.append({**mov, "saldo_final_projetado": saldo})
    return rows


def dashboard(db: Session, empresa_id: int):
    hoje = date.today()

    pagar = db.scalars(select(ContaPagar).where(ContaPagar.empresa_id == empresa_id)).all()
    receber = db.scalars(select(ContaReceber).where(ContaReceber.empresa_id == empresa_id)).all()

    categorias_por_id: dict[int, Categoria] = {
        c.id: c for c in db.scalars(select(Categoria).where(Categoria.empresa_id == empresa_id))
    }

    recebido_mes = sum(
        (Decimal(c.valor_recebido or 0) for c in receber
         if c.data_vencimento.year == hoje.year
         and c.data_vencimento.month == hoje.month
         and c.status == StatusReceber.recebido),
        Decimal("0"),
    )
    pago_mes = sum(
        (Decimal(c.valor_pago or 0) for c in pagar
         if c.data_vencimento.year == hoje.year
         and c.data_vencimento.month == hoje.month
         and c.status == StatusPagar.pago),
        Decimal("0"),
    )
    saldo_atual = (
        sum((Decimal(c.valor_recebido or 0) for c in receber if c.status == StatusReceber.recebido), Decimal("0"))
        - sum((Decimal(c.valor_pago or 0) for c in pagar if c.status == StatusPagar.pago), Decimal("0"))
    )

    contas_pagar_aberto = resumo_pagar(pagar)["total_aberto"]
    contas_receber_aberto = resumo_receber(receber)["total_aberto"]

    receitas_categoria: dict[str, Decimal] = defaultdict(Decimal)
    despesas_categoria: dict[str, Decimal] = defaultdict(Decimal)
    for conta in receber:
        if conta.status == StatusReceber.cancelado:
            continue
        cat = categorias_por_id.get(conta.categoria_id)
        receitas_categoria[cat.nome if cat else "Sem categoria"] += Decimal(conta.valor)
    for conta in pagar:
        if conta.status == StatusPagar.cancelado:
            continue
        cat = categorias_por_id.get(conta.categoria_id)
        despesas_categoria[cat.nome if cat else "Sem categoria"] += Decimal(conta.valor)

    resultado_mensal = []
    for mes in range(1, 13):
        receita = sum(
            (Decimal(c.valor_recebido or 0) for c in receber
             if c.data_vencimento.year == hoje.year and c.data_vencimento.month == mes),
            Decimal("0"),
        )
        despesa = sum(
            (Decimal(c.valor_pago or 0) for c in pagar
             if c.data_vencimento.year == hoje.year and c.data_vencimento.month == mes),
            Decimal("0"),
        )
        resultado_mensal.append({"mes": mes, "receitas": receita, "despesas": despesa, "resultado": receita - despesa})

    inadimplencia = sum(
        (Decimal(c.valor) - Decimal(c.valor_recebido or 0) for c in receber
         if c.data_vencimento < hoje and c.status in [StatusReceber.aberto, StatusReceber.parcial]),
        Decimal("0"),
    )
    return {
        "kpis": {
            "saldo_atual": saldo_atual,
            "receitas_mes": recebido_mes,
            "despesas_mes": pago_mes,
            "resultado_mes": recebido_mes - pago_mes,
            "resultado_acumulado": saldo_atual,
            "contas_pagar_aberto": contas_pagar_aberto,
            "contas_receber_aberto": contas_receber_aberto,
            "inadimplencia": inadimplencia,
        },
        "evolucao_caixa": fluxo_realizado(db, empresa_id),
        "receitas_por_categoria": [{"categoria": k, "valor": v} for k, v in receitas_categoria.items()],
        "despesas_por_categoria": [{"categoria": k, "valor": v} for k, v in despesas_categoria.items()],
        "resultado_mensal": resultado_mensal,
    }


def monthly_report(db: Session, empresa_id: int, year: int, month: int):
    pagar = db.scalars(select(ContaPagar).where(
        ContaPagar.empresa_id == empresa_id,
        extract("year", ContaPagar.data_vencimento) == year,
        extract("month", ContaPagar.data_vencimento) == month,
    )).all()
    receber = db.scalars(select(ContaReceber).where(
        ContaReceber.empresa_id == empresa_id,
        extract("year", ContaReceber.data_vencimento) == year,
        extract("month", ContaReceber.data_vencimento) == month,
    )).all()
    return {"ano": year, "mes": month, "receitas": resumo_receber(receber), "despesas": resumo_pagar(pagar)}


def annual_report(db: Session, empresa_id: int, year: int):
    pagar_ano = db.scalars(select(ContaPagar).where(
        ContaPagar.empresa_id == empresa_id,
        extract("year", ContaPagar.data_vencimento) == year,
    )).all()
    receber_ano = db.scalars(select(ContaReceber).where(
        ContaReceber.empresa_id == empresa_id,
        extract("year", ContaReceber.data_vencimento) == year,
    )).all()

    pagar_por_mes: dict[int, list] = defaultdict(list)
    receber_por_mes: dict[int, list] = defaultdict(list)
    for conta in pagar_ano:
        pagar_por_mes[conta.data_vencimento.month].append(conta)
    for conta in receber_ano:
        receber_por_mes[conta.data_vencimento.month].append(conta)

    meses = [
        {
            "ano": year,
            "mes": month,
            "receitas": resumo_receber(receber_por_mes.get(month, [])),
            "despesas": resumo_pagar(pagar_por_mes.get(month, [])),
        }
        for month in range(1, 13)
    ]
    return {"ano": year, "meses": meses}
