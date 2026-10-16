export function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 11)
}

export function formatPhone(value) {
  const digits = normalizePhone(value)

  if (!digits) return ''
  if (digits.length <= 2) return `(${digits}`

  const areaCode = digits.slice(0, 2)
  const number = digits.slice(2)

  if (number.length <= 4) return `(${areaCode}) ${number}`

  const prefixLength = digits.length === 11 ? 5 : 4
  const prefix = number.slice(0, prefixLength)
  const suffix = number.slice(prefixLength)

  return `(${areaCode}) ${prefix}-${suffix}`
}
