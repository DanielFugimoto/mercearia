import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as service from '../services/sales.service'
import { getErrorMessage, isRequestCanceled } from '../services/http/errors'

export const useSalesStore = defineStore('sales', () => {
  const items = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const payingSaleId = ref(null)
  const error = ref('')
  const loaded = ref(false)
  let controller
  let requestId = 0

  async function fetchAll(force = false) {
    if (loaded.value && !force) return
    controller?.abort()
    controller = new AbortController()
    const currentRequest = ++requestId
    loading.value = true
    error.value = ''
    try {
      const sales = await service.listSales(controller.signal)
      if (currentRequest === requestId) {
        items.value = sales
        loaded.value = true
      }
    } catch (requestError) {
      if (!isRequestCanceled(requestError) && currentRequest === requestId) {
        error.value = getErrorMessage(requestError, 'Não foi possível carregar as vendas.')
      }
      throw requestError
    } finally {
      if (currentRequest === requestId) loading.value = false
    }
  }

  async function create(payload) {
    saving.value = true
    error.value = ''
    try {
      const sale = await service.createSale(payload)
      items.value.unshift(sale)
      return sale
    } catch (requestError) {
      error.value = getErrorMessage(requestError, 'Não foi possível registrar a venda.')
      throw requestError
    } finally {
      saving.value = false
    }
  }

  async function payCreditSale(id) {
    if (payingSaleId.value !== null) return
    payingSaleId.value = id
    error.value = ''
    try {
      const sale = await service.payCreditSale(id)
      const index = items.value.findIndex((item) => item.id === id)
      if (index !== -1) items.value[index] = sale
      return sale
    } catch (requestError) {
      error.value = getErrorMessage(requestError, 'Não foi possível registrar o pagamento.')
      throw requestError
    } finally {
      payingSaleId.value = null
    }
  }

  function reset() {
    controller?.abort()
    requestId += 1
    items.value = []
    loading.value = false
    saving.value = false
    payingSaleId.value = null
    error.value = ''
    loaded.value = false
  }

  return {
    items,
    loading,
    saving,
    payingSaleId,
    error,
    loaded,
    fetchAll,
    create,
    payCreditSale,
    reset,
  }
})
