const STORAGE_KEY = 'mercearia-sale-draft'

const PAYMENT_TYPES = new Set([
  'CASH',
  'PIX',
  'DEBIT_CARD',
  'CREDIT_CARD',
  'STORE_CREDIT',
])

function emptyDraft() {
  return {
    clienteId: '',
    formaPagamento: '',
    itens: [],
  }
}

export function loadSaleDraft() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (!saved) return emptyDraft()

    const parsed = JSON.parse(saved)
    const clientId = Number(parsed.clienteId)
    const items = Array.isArray(parsed.itens) ? parsed.itens : []

    return {
      clienteId: Number.isInteger(clientId) && clientId > 0 ? clientId : '',
      formaPagamento: PAYMENT_TYPES.has(parsed.formaPagamento)
        ? parsed.formaPagamento
        : '',
      itens: items
        .map((item) => ({
          produtoId: Number(item.produtoId),
          quantidade: Number(item.quantidade),
        }))
        .filter((item) =>
          Number.isInteger(item.produtoId)
          && item.produtoId > 0
          && Number.isInteger(item.quantidade)
          && item.quantidade > 0,
        ),
    }
  } catch {
    clearSaleDraft()
    return emptyDraft()
  }
}

export function saveSaleDraft(draft) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      clienteId: draft.clienteId || '',
      formaPagamento: draft.formaPagamento || '',
      itens: draft.itens.map((item) => ({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
      })),
    }))
  } catch {
    // O carrinho continua funcional mesmo se o armazenamento estiver indisponível.
  }
}

export function clearSaleDraft() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Não há ação adicional quando o armazenamento está indisponível.
  }
}
