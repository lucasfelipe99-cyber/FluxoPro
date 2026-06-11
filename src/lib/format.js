export const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function money(value) {
  return brl.format(Number(value || 0));
}

export function dateBR(value) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}
