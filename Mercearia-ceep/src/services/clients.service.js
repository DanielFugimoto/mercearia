import api from './http/client'
import { formatPhone, normalizePhone } from '../utils/phone'

function toClient(data) {
  return {
    id: data.id,
    nome: data.name,
    telefone: formatPhone(data.phone),
    endereco: data.address || '',
    limiteCredito: Number(data.creditLimit),
    saldoDevedor: Number(data.debtBalance),
  }
}

function toPayload(client) {
  return {
    name: client.nome,
    phone: normalizePhone(client.telefone) || null,
    address: client.endereco,
    creditLimit: client.limiteCredito ?? 0,
  }
}

export async function listClients(signal) {
  const { data } = await api.get('/clients', { signal })
  return data.map(toClient)
}

export async function createClient(client) {
  const { data } = await api.post('/clients', toPayload(client))
  return toClient(data)
}

export async function updateClient(id, client) {
  const { data } = await api.put(`/clients/${id}`, toPayload(client))
  return toClient(data)
}

export async function deleteClient(id) {
  await api.delete(`/clients/${id}`)
}

export async function payClientDebt(id, amount) {
  const { data } = await api.post(`/clients/${id}/pay`, { amount })
  return Number(data.debtBalance)
}
