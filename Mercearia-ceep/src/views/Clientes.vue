<template>
  <div class="clientes">
    <!-- Cabeçalho da página -->
    <header class="clientes-header">
      <h2>Clientes</h2>
      <p class="subtitle">Gerencie os clientes cadastrados na mercearia.</p>
    </header>

    <p v-if="store.erro" class="mensagem-api erro" role="alert">{{ store.erro }}</p>
    <p v-else-if="store.carregando" class="mensagem-api" role="status">Carregando clientes...</p>

    <!-- Cards de resumo -->
    <section class="cards" aria-label="Resumo de clientes">
      <article class="card card-total">
        <p class="valor">{{ store.clientes.length }}</p>
        <h3>Clientes cadastrados</h3>
      </article>

      <article class="card card-ativos">
        <p class="valor">{{ clientesComPedidos }}</p>
        <h3>Já fizeram pedidos</h3>
      </article>

      <article class="card card-pedidos">
        <p class="valor">{{ store.pedidos.length }}</p>
        <h3>Pedidos registrados</h3>
      </article>
    </section>

    <!-- Formulário de novo cliente / edição de cliente -->
    <section class="secao-formulario">
      <h3 v-if="!estaEditando">Novo cliente</h3>
      <h3 v-else>
        Editar cliente: <span class="nome-editando">{{ form.nome }}</span>
      </h3>

      <form @submit.prevent="salvarCliente" class="form">
        <div class="campo">
          <label for="nome">Nome <span class="obrigatorio">*</span></label>
          <input
            id="nome"
            v-model="form.nome"
            type="text"
            placeholder="Ex.: Maria Silva"
            required
          />
        </div>

        <div class="grupo-horizontal">
          <div class="campo">
            <label for="telefone">Telefone</label>
            <input
              id="telefone"
              v-model="telefoneMascarado"
              type="tel"
              inputmode="numeric"
              maxlength="15"
              autocomplete="tel"
              placeholder="Ex.: (11) 99999-0000"
            />
          </div>

          <div class="campo">
            <label for="endereco">Endereço</label>
            <input
              id="endereco"
              v-model="form.endereco"
              type="text"
              placeholder="Ex.: Rua A, 100"
            />
          </div>

          <div class="campo">
            <label for="limiteCredito">Limite para fiado (R$)</label>
            <input
              id="limiteCredito"
              v-model.number="form.limiteCredito"
              type="number"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        <div class="acoes-form">
          <button type="submit" class="botao-primario" :disabled="store.salvando">
            {{ store.salvando ? 'Salvando...' : estaEditando ? 'Salvar alterações' : 'Adicionar' }}
          </button>
          <button type="button" class="botao-secundario" @click="limparFormulario">
            {{ estaEditando ? 'Cancelar' : 'Limpar' }}
          </button>
        </div>
      </form>
    </section>

    <!-- Lista de clientes cadastrados -->
    <section class="secao-lista">
      <div class="lista-cabecalho">
        <h3>Clientes cadastrados</h3>
        <div class="campo-busca">
          <input
            v-model="textoBusca"
            type="text"
            placeholder="Buscar por nome..."
            class="input-busca"
          />
        </div>
      </div>

      <!-- Sem clientes cadastrados -->
      <p v-if="!store.carregando && store.clientes.length === 0" class="mensagem-vazia">
        Nenhum cliente cadastrado ainda. Use o formulário acima para adicionar.
      </p>

      <!-- Busca sem resultado -->
      <p v-else-if="!store.carregando && clientesFiltrados.length === 0" class="mensagem-vazia">
        Nenhum cliente encontrado para "<strong>{{ textoBusca }}</strong>".
      </p>

      <div v-else-if="!store.carregando" class="tabela-wrapper">
        <table class="tabela">
          <thead>
            <tr>
              <th></th>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Endereço</th>
              <th>Limite / dívida</th>
              <th>Pedidos</th>
              <th class="col-acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cliente in clientesFiltrados" :key="cliente.id">
              <td class="celula-avatar">
                <div class="avatar" :style="{ background: corAvatar(cliente.nome) }">
                  {{ iniciais(cliente.nome) }}
                </div>
              </td>
              <td class="coluna-nome">{{ cliente.nome }}</td>
              <td>{{ cliente.telefone || '-' }}</td>
              <td>{{ cliente.endereco || '-' }}</td>
              <td>{{ formatarMoeda(cliente.limiteCredito) }} / {{ formatarMoeda(cliente.saldoDevedor) }}</td>
              <td>
                <span
                  class="badge"
                  :class="pedidosPorCliente(cliente.id) > 0 ? 'badge-ativo' : 'badge-sem-pedido'"
                >
                  {{ pedidosPorCliente(cliente.id) }}
                  {{ pedidosPorCliente(cliente.id) === 1 ? 'pedido' : 'pedidos' }}
                </span>
              </td>
              <td class="celula-acoes">
                <button type="button" class="botao-acao" @click="iniciarEdicao(cliente)">
                  Editar
                </button>
                <button
                  type="button"
                  class="botao-acao botao-remover"
                  :disabled="store.salvando"
                  @click="remover(cliente.id)"
                >
                  Remover
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="clientesFiltrados.length > 0" class="rodape-tabela">
        Exibindo {{ clientesFiltrados.length }} de {{ store.clientes.length }} clientes.
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useMercearia } from '../composables/useMercearia'
import { formatPhone } from '../utils/phone'

const store = useMercearia()

const textoBusca = ref('')

const form = reactive({
  nome: '',
  telefone: '',
  endereco: '',
  limiteCredito: 0,
})

const idEmEdicao = ref(null)
const estaEditando = computed(() => idEmEdicao.value !== null)
const telefoneMascarado = computed({
  get: () => form.telefone,
  set: (value) => {
    form.telefone = formatPhone(value)
  },
})

// Clientes ordenados e filtrados pela busca
const clientesFiltrados = computed(() => {
  const lista = [...store.clientes].sort((a, b) =>
    (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }),
  )
  const busca = textoBusca.value.trim().toLowerCase()
  if (!busca) return lista
  return lista.filter(
    (c) =>
      (c.nome || '').toLowerCase().includes(busca) ||
      (c.telefone || '').toLowerCase().includes(busca),
  )
})

// Número de clientes que possuem ao menos 1 pedido
const clientesComPedidos = computed(
  () => new Set(store.pedidos.map((p) => p.clienteId)).size,
)

// Quantidade de pedidos por cliente
function pedidosPorCliente(clienteId) {
  return store.pedidos.filter((p) => p.clienteId === clienteId).length
}

// Gera as duas primeiras iniciais do nome
function iniciais(nome) {
  if (!nome) return '?'
  const partes = nome.trim().split(/\s+/)
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

// Gera uma cor de fundo para o avatar baseada no nome
const CORES_AVATAR = [
  '#2563eb', '#7c3aed', '#059669', '#d97706', '#db2777',
  '#0891b2', '#16a34a', '#dc2626', '#9333ea', '#0369a1',
]
function corAvatar(nome) {
  if (!nome) return CORES_AVATAR[0]
  let soma = 0
  for (const char of nome) soma += char.charCodeAt(0)
  return CORES_AVATAR[soma % CORES_AVATAR.length]
}

function limparFormulario() {
  form.nome = ''
  form.telefone = ''
  form.endereco = ''
  form.limiteCredito = 0
  idEmEdicao.value = null
}

async function salvarCliente() {
  if (!form.nome.trim()) return

  const dados = {
    nome: form.nome.trim(),
    telefone: form.telefone.trim(),
    endereco: form.endereco.trim(),
    limiteCredito: Number(form.limiteCredito) || 0,
  }

  try {
    if (idEmEdicao.value !== null) {
      await store.atualizarCliente(idEmEdicao.value, dados)
    } else {
      await store.adicionarCliente(dados)
    }
    limparFormulario()
  } catch {
    // A mensagem normalizada é exibida pela página.
  }
}

function iniciarEdicao(cliente) {
  idEmEdicao.value = cliente.id
  form.nome = cliente.nome || ''
  form.telefone = formatPhone(cliente.telefone)
  form.endereco = cliente.endereco || ''
  form.limiteCredito = cliente.limiteCredito ?? 0
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor || 0)
}

async function remover(id) {
  const confirmar = window.confirm('Tem certeza que deseja remover este cliente?')
  if (!confirmar) return

  try {
    await store.removerCliente(id)
    if (idEmEdicao.value === id) limparFormulario()
  } catch {
    // A mensagem normalizada é exibida pela página.
  }
}

onMounted(() => {
  store.carregarDados().catch(() => {})
})
</script>

<style scoped>
.clientes {
  max-width: var(--largura-max);
  margin: 0 auto;
  padding: 1.5rem;
}

.clientes-header { margin-bottom: 2rem; }

.clientes-header h2 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--cor-titulo);
}

.subtitle {
  margin: 0.25rem 0 0;
  color: var(--cor-texto-leve);
  font-size: 0.95rem;
}

/* Cards */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.card {
  background: var(--cor-superficie);
  border-radius: var(--raio);
  padding: 1.25rem;
  box-shadow: var(--sombra);
  border: 1px solid var(--cor-borda);
}

.card h3 {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--cor-texto-leve);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.card .valor {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.card-total .valor   { color: var(--cor-primaria); }
.card-ativos .valor  { color: var(--cor-sucesso); }
.card-pedidos .valor { color: var(--cor-roxa); }

/* Formulário */
.secao-formulario {
  background: var(--cor-superficie);
  border-radius: var(--raio);
  padding: 1.25rem;
  box-shadow: var(--sombra);
  border: 1px solid var(--cor-borda);
  margin-bottom: 1.5rem;
}

.secao-formulario h3 {
  margin: 0 0 1.25rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--cor-titulo);
}

.nome-editando { color: var(--cor-primaria); }
.obrigatorio   { color: var(--cor-perigo); }

.form { display: grid; gap: 0.85rem; }

.grupo-horizontal {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 0.85rem;
}

.campo { display: flex; flex-direction: column; gap: 0.3rem; }

.campo label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--cor-texto);
}

.campo input {
  padding: 0.55rem 0.7rem;
  border-radius: var(--raio-sm);
  border: 1px solid var(--cor-borda);
  font-size: 0.9rem;
  transition: border-color 0.15s;
}

.campo input:focus {
  outline: none;
  border-color: var(--cor-primaria);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
}

.acoes-form { display: flex; gap: 0.5rem; margin-top: 0.25rem; flex-wrap: wrap; }

.botao-primario {
  padding: 0.5rem 1.1rem;
  border-radius: var(--raio-sm);
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  background: var(--cor-primaria);
  color: #fff;
  transition: filter 0.15s;
}

.botao-secundario {
  padding: 0.5rem 1.1rem;
  border-radius: var(--raio-sm);
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  background: var(--cor-borda);
  color: var(--cor-texto);
  transition: filter 0.15s;
}

.botao-primario:hover,
.botao-secundario:hover { filter: brightness(0.95); }

/* Lista / Tabela */
.secao-lista {
  background: var(--cor-superficie);
  border-radius: var(--raio);
  padding: 1.25rem;
  box-shadow: var(--sombra);
  border: 1px solid var(--cor-borda);
}

.lista-cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.lista-cabecalho h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--cor-titulo);
}

.campo-busca {
  display: flex;
  align-items: center;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio-sm);
  background: var(--cor-fundo-input);
}

.input-busca {
  border: none;
  background: transparent;
  font-size: 0.875rem;
  outline: none;
  width: 180px;
  color: var(--cor-texto);
  padding: 0.4rem 0.7rem;
}

.tabela-wrapper { overflow-x: auto; }

.tabela {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.tabela th,
.tabela td {
  padding: 0.6rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--cor-borda);
}

.tabela th {
  background: var(--cor-fundo-suave);
  font-weight: 600;
  color: var(--cor-texto);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tabela tbody tr:hover { background: var(--cor-fundo-suave); }

.celula-avatar { width: 44px; padding-right: 0; }

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.coluna-nome { font-weight: 500; }

.badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: var(--raio-pill);
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-ativo      { background: var(--cor-sucesso-fundo); color: var(--cor-sucesso); }
.badge-sem-pedido { background: var(--cor-borda-leve);    color: var(--cor-texto-leve); }

.col-acoes { width: 160px; text-align: center; }

.celula-acoes { display: flex; gap: 0.35rem; justify-content: center; }

.botao-acao {
  padding: 0.28rem 0.6rem;
  border-radius: var(--raio-sm);
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  background: var(--cor-borda);
  color: var(--cor-texto);
  white-space: nowrap;
  transition: filter 0.15s;
}

.botao-acao.botao-remover {
  background: var(--cor-perigo-fundo);
  color: var(--cor-perigo);
}

.botao-acao:hover { filter: brightness(0.93); }

.mensagem-vazia {
  margin: 1rem 0 0;
  font-size: 0.9rem;
  color: var(--cor-texto-leve);
  text-align: center;
  padding: 1.5rem;
  background: var(--cor-fundo-suave);
  border-radius: var(--raio-sm);
  border: 1px dashed var(--cor-borda);
}

.rodape-tabela {
  margin: 0.75rem 0 0;
  font-size: 0.8rem;
  color: var(--cor-texto-muito-leve);
  text-align: right;
}

@media (max-width: 640px) {
  .clientes { padding: 1rem; }
  .grupo-horizontal { grid-template-columns: 1fr; }
  .tabela th, .tabela td { padding: 0.5rem; }
  .input-busca { width: 120px; }
}
</style>
