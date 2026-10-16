import api from './http/client'

const PAYMENT_LABELS = {
  CASH: 'Dinheiro',
  PIX: 'Pix',
  DEBIT_CARD: 'Cartão de Débito',
  CREDIT_CARD: 'Cartão de Crédito',
  STORE_CREDIT: 'Fiado',
}

function toSale(data) {
  return {
    id: data.id,
    clienteId: data.ClientId,
    clienteNome: data.client?.name || 'Consumidor final',
    data: data.createdAt,
    formaPagamento: PAYMENT_LABELS[data.paymentType] || data.paymentType,
    tipoPagamento: data.paymentType,
    valorTotal: Number(data.total),
    dataVencimento: data.dueDate || null,
    saldoPendente: Number(data.outstandingAmount || 0),
    pagoEm: data.paidAt || null,
    itens: (data.items || []).map((item) => ({
      produtoId: item.ProductId,
      produtoNome: item.product?.name || 'Produto removido',
      quantidade: item.qty,
      precoUnitario: Number(item.unitPrice),
    })),
  }
}

export async function listSales(signal) {
  const { data } = await api.get('/sales', { signal })
  return data.map(toSale)
}

export async function createSale(sale) {
  const { data } = await api.post('/sales', {
    clientId: sale.clienteId,
    paymentType: sale.tipoPagamento,
    items: sale.itens.map((item) => ({ productId: item.produtoId, qty: item.quantidade })),
  })
  return toSale(data)
}

export async function payCreditSale(id) {
  const { data } = await api.post(`/sales/${id}/pay`)
  return toSale(data)
}
