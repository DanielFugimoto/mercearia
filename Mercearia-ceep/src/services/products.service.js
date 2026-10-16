import api from './http/client'

function toProduct(data) {
  return {
    id: data.id,
    nome: data.name,
    preco: Number(data.price),
    quantidade: data.stockQty,
    quantidadeMinima: data.minStockQty,
  }
}

function toPayload(product) {
  return {
    name: product.nome,
    price: product.preco,
    stockQty: product.quantidade,
    minStockQty: product.quantidadeMinima,
  }
}

export async function listProducts(signal) {
  const { data } = await api.get('/products', { signal })
  return data.map(toProduct)
}

export async function createProduct(product) {
  const { data } = await api.post('/products', toPayload(product))
  return toProduct(data)
}

export async function updateProduct(id, product) {
  const { data } = await api.put(`/products/${id}`, toPayload(product))
  return toProduct(data)
}

export async function deleteProduct(id) {
  await api.delete(`/products/${id}`)
}
