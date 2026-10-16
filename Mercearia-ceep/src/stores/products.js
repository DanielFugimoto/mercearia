import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as service from '../services/products.service'
import { getErrorMessage, isRequestCanceled } from '../services/http/errors'

export const useProductsStore = defineStore('products', () => {
  const items = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const loaded = ref(false)
  let controller
  let requestId = 0

  const lowStock = computed(() =>
    items.value.filter((product) => product.quantidade < product.quantidadeMinima),
  )

  async function fetchAll(force = false) {
    if (loaded.value && !force) return
    controller?.abort()
    controller = new AbortController()
    const currentRequest = ++requestId
    loading.value = true
    error.value = ''

    try {
      const products = await service.listProducts(controller.signal)
      if (currentRequest === requestId) {
        items.value = products
        loaded.value = true
      }
    } catch (requestError) {
      if (!isRequestCanceled(requestError) && currentRequest === requestId) {
        error.value = getErrorMessage(requestError, 'Não foi possível carregar os produtos.')
      }
      throw requestError
    } finally {
      if (currentRequest === requestId) loading.value = false
    }
  }

  async function create(payload) {
    return mutate(() => service.createProduct(payload), (product) => items.value.push(product))
  }

  async function update(id, payload) {
    return mutate(() => service.updateProduct(id, payload), (product) => {
      const index = items.value.findIndex((item) => item.id === id)
      if (index !== -1) items.value[index] = product
    })
  }

  async function remove(id) {
    return mutate(() => service.deleteProduct(id), () => {
      items.value = items.value.filter((item) => item.id !== id)
    })
  }

  async function mutate(request, apply) {
    saving.value = true
    error.value = ''
    try {
      const result = await request()
      apply(result)
      return result
    } catch (requestError) {
      error.value = getErrorMessage(requestError)
      throw requestError
    } finally {
      saving.value = false
    }
  }

  function reset() {
    controller?.abort()
    requestId += 1
    items.value = []
    loading.value = false
    saving.value = false
    error.value = ''
    loaded.value = false
  }

  return { items, loading, saving, error, loaded, lowStock, fetchAll, create, update, remove, reset }
})
