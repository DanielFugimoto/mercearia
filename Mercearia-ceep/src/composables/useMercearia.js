import { computed, reactive } from 'vue'
import { useProductsStore } from '../stores/products'
import { useClientsStore } from '../stores/clients'
import { useSalesStore } from '../stores/sales'
import { getRevenueDate, isSameLocalDay } from '../utils/revenue'

export function useMercearia() {
  const productsStore = useProductsStore()
  const clientsStore = useClientsStore()
  const salesStore = useSalesStore()

  const produtos = computed(() => productsStore.items)
  const clientes = computed(() => clientsStore.items)
  const pedidos = computed(() => salesStore.items)
  const produtosEmFalta = computed(() => productsStore.lowStock)
  const totalItensEstoque = computed(() =>
    productsStore.items.reduce((total, product) => total + product.quantidade, 0),
  )
  const vendasHoje = computed(() => {
    const hoje = new Date()
    return salesStore.items
      .filter((sale) => isSameLocalDay(getRevenueDate(sale), hoje))
      .reduce((total, sale) => total + sale.valorTotal, 0)
  })
  const totalAlertas = computed(() => productsStore.lowStock.length)
  const carregando = computed(() =>
    productsStore.loading || clientsStore.loading || salesStore.loading,
  )
  const salvando = computed(() =>
    productsStore.saving || clientsStore.saving || salesStore.saving,
  )
  const pagandoVendaId = computed(() => salesStore.payingSaleId)
  const erro = computed(() =>
    productsStore.error || clientsStore.error || salesStore.error,
  )

  async function carregarDados(force = false) {
    await Promise.all([
      productsStore.fetchAll(force),
      clientsStore.fetchAll(force),
      salesStore.fetchAll(force),
    ])
  }

  async function adicionarPedido(payload) {
    const sale = await salesStore.create(payload)
    await Promise.all([
      productsStore.fetchAll(true),
      payload.tipoPagamento === 'STORE_CREDIT'
        ? clientsStore.fetchAll(true)
        : Promise.resolve(),
    ])
    return sale
  }

  async function pagarVendaFiada(id) {
    const sale = await salesStore.payCreditSale(id)
    await clientsStore.fetchAll(true)
    return sale
  }

  return reactive({
    produtos,
    clientes,
    pedidos,
    produtosEmFalta,
    totalItensEstoque,
    vendasHoje,
    totalAlertas,
    carregando,
    salvando,
    pagandoVendaId,
    erro,
    carregarDados,
    adicionarCliente: clientsStore.create,
    atualizarCliente: clientsStore.update,
    removerCliente: clientsStore.remove,
    adicionarProduto: productsStore.create,
    atualizarProduto: productsStore.update,
    removerProduto: productsStore.remove,
    adicionarPedido,
    pagarVendaFiada,
  })
}
