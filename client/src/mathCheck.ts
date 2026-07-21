export function computeMathCheck(
  lineItems: {amount: number}[],
  tax: number | null,
  tip: number | null,
  discount: number | null
): number {
  const itemsSum = lineItems.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  return itemsSum + (Number(tax) || 0) + (Number(tip) || 0) - (Number(discount) || 0);
}
