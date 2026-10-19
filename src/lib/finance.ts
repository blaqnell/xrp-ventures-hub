import Decimal from "decimal.js";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_EVEN });

export type PositionLike = {
  quantity: string | number;
  cost_basis_usd: string | number | null;
  source?: string;
};

const QTY_RE = /^\d{1,15}(\.\d{1,8})?$/;
const USD_RE = /^\d{1,18}(\.\d{1,2})?$/;

/** Validates a user-typed XRP quantity (max 8 decimals, > 0). Returns normalized string or null. */
export function parseQuantity(input: string): string | null {
  const v = input.trim().replace(/,/g, "");
  if (!QTY_RE.test(v)) return null;
  const d = new Decimal(v);
  if (d.lte(0)) return null;
  return d.toFixed();
}

/** Validates an optional USD cost basis (max 2 decimals, >= 0). "" → null (unknown). */
export function parseUsd(input: string): string | null | undefined {
  const v = input.trim().replace(/[,$]/g, "");
  if (v === "") return null;
  if (!USD_RE.test(v)) return undefined; // invalid
  return new Decimal(v).toFixed(2);
}

export function positionValue(quantity: string | number, priceUsd: string | number): Decimal {
  return new Decimal(quantity).mul(priceUsd);
}

/** Unrealized P/L is only defined when cost basis is known. */
export function unrealizedPnl(
  quantity: string | number,
  priceUsd: string | number,
  costBasisUsd: string | number | null,
): Decimal | null {
  if (costBasisUsd === null || costBasisUsd === undefined) return null;
  return positionValue(quantity, priceUsd).minus(costBasisUsd);
}

export function portfolioTotals(positions: PositionLike[], priceUsd: number | string | null) {
  let qty = new Decimal(0);
  let qtyWithBasis = new Decimal(0);
  let basis = new Decimal(0);
  let withBasis = 0;
  for (const p of positions) {
    qty = qty.plus(p.quantity);
    if (p.cost_basis_usd !== null && p.cost_basis_usd !== undefined) {
      withBasis++;
      qtyWithBasis = qtyWithBasis.plus(p.quantity);
      basis = basis.plus(p.cost_basis_usd);
    }
  }
  const value = priceUsd === null ? null : qty.mul(priceUsd);
  const pnl =
    priceUsd === null || withBasis === 0 ? null : qtyWithBasis.mul(priceUsd).minus(basis);
  return {
    quantity: qty,
    value,
    costBasis: withBasis > 0 ? basis : null,
    pnl,
    positionsWithBasis: withBasis,
    positionCount: positions.length,
  };
}

export function formatUsd(v: Decimal | number | string | null | undefined, digits = 2): string {
  if (v === null || v === undefined) return "—";
  const n = new Decimal(v).toNumber();
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatPrice(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  return formatUsd(n, n < 10 ? 4 : 2);
}

export function formatXrp(v: Decimal | number | string | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return new Decimal(v).toNumber().toLocaleString("en-US", { maximumFractionDigits: 6 });
}

export function formatCompact(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return Number(v).toLocaleString("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
    style: "currency",
    currency: "USD",
  });
}

export function formatPct(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return "—";
  const n = Number(v);
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}
