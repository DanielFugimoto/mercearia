<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h2>Dashboard</h2>
      <p class="subtitle">Visão geral do controle da mercearia</p>
      <p class="data-atual">{{ dataAtual }}</p>
    </header>

    <p v-if="store.erro" class="mensagem-api erro" role="alert">{{ store.erro }}</p>
    <p v-else-if="store.carregando" class="mensagem-api" role="status">Carregando resumo...</p>

    <section class="resumo-extra" aria-label="Resumo de cadastros">
      <div class="item-resumo">
        <span class="label">Clientes cadastrados:</span>
        <span class="valor">{{ totalClientes }}</span>
      </div>
      <div class="item-resumo">
        <span class="label">Produtos cadastrados:</span>
        <span class="valor">{{ totalProdutos }}</span>
      </div>
    </section>

    <section class="cards" aria-label="Resumo">
      <article class="card card-estoque">
        <p class="valor">{{ resumo.estoque.total }}</p>
        <h3>Estoque</h3>
        <p class="label">{{ resumo.estoque.label }}</p>
      </article>
      <article class="card card-vendas">
        <p class="valor">{{ resumo.vendasHoje.total }}</p>
        <h3>Faturamento</h3>
        <p class="label">{{ resumo.vendasHoje.label }}</p>
      </article>
      <article class="card card-alertas">
        <p class="valor">{{ resumo.alertas.total }}</p>
        <h3>Alertas</h3>
        <p class="label">{{ resumo.alertas.label }}</p>
      </article>
    </section>

    <section class="secao-alertas">
      <h3>Produtos em falta</h3>
      <div v-if="produtosEmFalta.length > 0" class="tabela-div">
        <table class="tabela">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Qtd. atual</th>
              <th>Qtd. mínima</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in produtosEmFalta" :key="item.id">
              <td>{{ item.nome }}</td>
              <td>{{ item.quantidade }}</td>
              <td>{{ item.minimo }}</td>
              <td><span class="badge badge-falta">Repor</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else-if="!store.carregando" class="sem-alertas">Nenhum produto abaixo do estoque mínimo.</p>
    </section>

    <section class="secao-pedidos" aria-labelledby="titulo-vendas-fiado">
      <div class="secao-cabecalho">
        <div>
          <h3 id="titulo-vendas-fiado">Vendas em fiado</h3>
          <p>Contas pendentes com vencimento no dia 10 do mês seguinte à compra.</p>
        </div>
        <strong v-if="vendasFiadoPendentes.length" class="total-pendente">
          {{ formatarMoeda(totalFiadoPendente) }} pendente
        </strong>
      </div>

      <p v-if="!store.carregando && vendasFiadoPendentes.length === 0" class="sem-pedidos">
        Nenhuma conta fiada pendente.
      </p>

      <div v-else-if="!store.carregando" class="tabela-div">
        <table class="tabela tabela-pedidos">
          <thead>
            <tr>
              <th>Nº venda</th>
              <th>Cliente</th>
              <th>Compra</th>
              <th>Vencimento</th>
              <th>Saldo</th>
              <th>Status</th>
              <th><span class="sr-only">Ação</span></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="venda in vendasFiadoPendentes"
              :key="venda.id"
              :class="{ 'linha-vencida': estaVencida(venda.dataVencimento) }"
            >
              <td>#{{ venda.id }}</td>
              <td class="cliente" :title="venda.clienteNome">{{ venda.clienteNome }}</td>
              <td>{{ formatarData(venda.data) }}</td>
              <td>{{ formatarData(venda.dataVencimento) }}</td>
              <td class="saldo">{{ formatarMoeda(venda.saldoPendente) }}</td>
              <td>
                <span
                  class="badge"
                  :class="estaVencida(venda.dataVencimento) ? 'badge-vencida' : 'badge-pendente'"
                >
                  {{ estaVencida(venda.dataVencimento) ? 'Vencida' : 'Pendente' }}
                </span>
              </td>
              <td class="acao">
                <button
                  type="button"
                  class="botao-pagar"
                  :class="{ 'esta-pagando': store.pagandoVendaId === venda.id }"
                  :disabled="store.pagandoVendaId !== null"
                  :aria-busy="store.pagandoVendaId === venda.id"
                  :aria-label="`Efetuar pagamento da venda ${venda.id}, de ${venda.clienteNome}`"
                  @click="pagarConta(venda)"
                >
                  <span
                    v-if="store.pagandoVendaId === venda.id"
                    class="botao-pagar-spinner"
                    aria-hidden="true"
                  ></span>
                  <svg
                    v-else
                    class="botao-pagar-icone"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <span>{{ store.pagandoVendaId === venda.id ? 'Processando' : 'Efetuar pagamento' }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useMercearia } from '../composables/useMercearia'

const store = useMercearia()

const totalClientes = computed(() => store.clientes.length)
const totalProdutos = computed(() => store.produtos.length)

const resumo = computed(() => ({
  estoque: {
    total: store.totalItensEstoque,
    label: 'Itens no estoque',
  },
  vendasHoje: {
    total: formatarMoeda(store.vendasHoje),
    label: 'Recebido hoje',
  },
  alertas: {
    total: store.totalAlertas,
    label: 'Produtos em falta',
  },
}))

const produtosEmFalta = computed(() =>
  store.produtosEmFalta.map((produto) => ({
    id: produto.id,
    nome: produto.nome,
    quantidade: produto.quantidade ?? 0,
    minimo: produto.quantidadeMinima ?? 0,
  }))
)

const dataAtual = computed(() =>
  new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
)

const vendasFiadoPendentes = computed(() =>
  [...store.pedidos]
    .filter((venda) => venda.tipoPagamento === 'STORE_CREDIT' && venda.saldoPendente > 0)
    .sort((vendaA, vendaB) => {
      const vencimento = String(vendaA.dataVencimento || '').localeCompare(
        String(vendaB.dataVencimento || '')
      )

      if (vencimento !== 0) return vencimento
      return (vendaA.id || 0) - (vendaB.id || 0)
    })
)

const totalFiadoPendente = computed(() =>
  vendasFiadoPendentes.value.reduce((total, venda) => total + venda.saldoPendente, 0)
)

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor) || 0)
}

function formatarData(valor) {
  if (!valor) return '-'

  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split('-').map(Number)
    return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR')
  }

  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? '-' : data.toLocaleDateString('pt-BR')
}

function estaVencida(dataVencimento) {
  if (!dataVencimento) return false

  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')

  return dataVencimento < `${ano}-${mes}-${dia}`
}

async function pagarConta(venda) {
  const confirmado = window.confirm(
    `Confirmar o pagamento de ${formatarMoeda(venda.saldoPendente)} de ${venda.clienteNome}?`
  )

  if (!confirmado) return

  await store.pagarVendaFiada(venda.id).catch(() => {})
}

onMounted(() => {
  store.carregarDados().catch(() => {})
})
</script>

<style scoped>
.dashboard {
  padding: 1.5rem;
  max-width: var(--largura-max);
  margin: 0 auto;
}

.dashboard-header { margin-bottom: 2rem; }

.dashboard-header h2 {
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

.data-atual {
  margin: 0.4rem 0 0;
  font-size: 0.875rem;
  color: var(--cor-texto-leve);
  text-transform: capitalize;
}

.resumo-extra {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  background: var(--cor-superficie);
  border-radius: var(--raio);
  border: 1px solid var(--cor-borda);
  box-shadow: var(--sombra);
}

.item-resumo {
  display: flex;
  gap: 0.35rem;
  font-size: 0.9rem;
  align-items: center;
}

.item-resumo .label { color: var(--cor-texto-leve); }
.item-resumo .valor { font-weight: 700; color: var(--cor-titulo); }

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

.card .valor { margin: 0 0 0.25rem; font-size: 1.5rem; font-weight: 700; }
.card .label { margin: 0.1rem 0 0; font-size: 0.78rem; color: var(--cor-texto-muito-leve); }
.card-estoque .valor { color: var(--cor-primaria); }
.card-vendas .valor { color: var(--cor-sucesso); }
.card-alertas .valor { color: var(--cor-perigo); }

.secao-alertas,
.secao-pedidos {
  background: var(--cor-superficie);
  border-radius: var(--raio);
  padding: 1.25rem;
  box-shadow: var(--sombra);
  border: 1px solid var(--cor-borda);
  margin-bottom: 1.5rem;
}

.secao-alertas h3,
.secao-pedidos h3 {
  margin: 0 0 1rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--cor-titulo);
}

.secao-cabecalho {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.secao-cabecalho h3 { margin-bottom: 0.25rem; }

.secao-cabecalho p {
  margin: 0;
  color: var(--cor-texto-leve);
  font-size: 0.875rem;
}

.total-pendente {
  flex: 0 0 auto;
  color: var(--cor-alerta);
  font-size: 0.875rem;
}

.tabela-div { overflow-x: auto; }

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
  white-space: nowrap;
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
.tabela tbody tr:last-child td { border-bottom: 0; }
.tabela .cliente { max-width: 220px; overflow: hidden; text-overflow: ellipsis; }
.tabela .saldo { font-weight: 700; color: var(--cor-titulo); }
.tabela .acao { text-align: right; }
.linha-vencida { background: var(--cor-perigo-fundo); }

.badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: var(--raio-pill);
  font-size: 0.78rem;
  font-weight: 600;
}

.badge-falta,
.badge-vencida { background: var(--cor-perigo-fundo); color: var(--cor-perigo); }
.badge-pendente { background: var(--cor-alerta-fundo); color: var(--cor-alerta); }

.botao-pagar {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.55rem 0.9rem;
  border: 0;
  border-radius: var(--raio-sm);
  background: var(--cor-sucesso);
  color: #fff;
  font: inherit;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  box-shadow: 0 2px 5px rgba(22, 101, 52, 0.22);
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
}

.botao-pagar:hover:not(:disabled) {
  background: #15803d;
  box-shadow: 0 4px 9px rgba(22, 101, 52, 0.28);
  transform: translateY(-1px);
}

.botao-pagar:active:not(:disabled) {
  box-shadow: 0 1px 3px rgba(22, 101, 52, 0.22);
  transform: translateY(0);
}

.botao-pagar:focus-visible {
  outline: 3px solid rgba(22, 163, 74, 0.3);
  outline-offset: 2px;
}

.botao-pagar:disabled {
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.52;
}

.botao-pagar.esta-pagando {
  cursor: wait;
  opacity: 0.82;
}

.botao-pagar-icone {
  width: 1rem;
  height: 1rem;
  flex: 0 0 auto;
}

.botao-pagar-spinner {
  width: 0.9rem;
  height: 0.9rem;
  flex: 0 0 auto;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  border-radius: 50%;
  animation: girar 0.7s linear infinite;
}

@keyframes girar {
  to { transform: rotate(360deg); }
}

.sem-alertas,
.sem-pedidos {
  margin: 0;
  color: var(--cor-texto-leve);
  font-size: 0.9rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 600px) {
  .dashboard { padding: 1rem; }
  .secao-cabecalho { flex-direction: column; }
  .tabela th,
  .tabela td { padding: 0.5rem; }
}

@media (prefers-reduced-motion: reduce) {
  .botao-pagar { transition: none; }
  .botao-pagar-spinner { animation-duration: 1.4s; }
}
</style>
