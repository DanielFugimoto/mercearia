export const STORE_CREDIT = 'STORE_CREDIT'

export function getRevenueDate(sale) {
  if (sale.tipoPagamento === STORE_CREDIT) return sale.pagoEm || null
  return sale.data || null
}

export function isRevenueRecognized(sale) {
  return Boolean(getRevenueDate(sale))
}

export function isSameLocalDay(value, referenceDate = new Date()) {
  if (!value) return false

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  return (
    date.getFullYear() === referenceDate.getFullYear()
    && date.getMonth() === referenceDate.getMonth()
    && date.getDate() === referenceDate.getDate()
  )
}
