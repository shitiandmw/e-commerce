/**
 * 统一价格格式化
 * @param amount 金额（单位：分/cents）
 * @param currencyCode 货币代码，默认 usd
 */
export function formatPrice(amount: number, currencyCode = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount / 100)
}
