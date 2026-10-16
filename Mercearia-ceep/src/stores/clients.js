import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as service from '../services/clients.service'
import { getErrorMessage, isRequestCanceled } from '../services/http/errors'

export const useClientsStore = defineStore('clients', () => {
  const items = ref([])
  const loading = ref(false)
  const saving = ref(false)
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
      const clients = await service.listClients(controller.signal)
      if (currentRequest === requestId) {
        items.value = clients
        loaded.value = true
      }
    } catch (requestError) {
      if (!isRequestCanceled(requestError) && currentRequest === requestId) {
        error.value = getErrorMessage(requestError, 'Não foi possível carregar os clientes.')
      }
      throw requestError
    } finally {
      if (currentRequest === requestId) loading.value = false
    }
  }

  async function create(payload) {
    return mutate(() => service.createClient(payload), (client) => items.value.push(client))
  }

  async function update(id, payload) {
    return mutate(() => service.updateClient(id, payload), (client) => {
      const index = items.value.findIndex((item) => item.id === id)
      if (index !== -1) items.value[index] = client
    })
  }

  async function remove(id) {
    return mutate(() => service.deleteClient(id), () => {
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

  return { items, loading, saving, error, loaded, fetchAll, create, update, remove, reset }
})
