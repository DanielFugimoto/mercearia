<template>
  <div class="relatorios">
    <!-- Cabeçalho da página -->
    <header class="relatorios-header">
      <h2>Relatórios</h2>
      <p class="subtitle">
        Faturamento recebido, valores a receber e posição atual do estoque.
      </p>
    </header>

    <p v-if="store.erro" class="mensagem-api erro" role="alert">{{ store.erro }}</p>
    <p v-else-if="store.carregando" class="mensagem-api" role="status">Carregando relatórios...</p>

    <!-- Relatório de vendas -->
    <section class="secao secao-vendas">
      <h3>Relatório financeiro de vendas</h3>

      <p v-if="!store.carregando && pedidosEnriquecidos.length === 0" class="mensagem-vazia">
        Nenhuma venda registrada para exibir.
      </p>

      <div v-else-if="!store.carregando">
        <div class="resumo-vendas">
          <div class="item-resumo">
            <span class="label">Vendas registradas:</span>
            <span class="valor">{{ pedidosEnriquecidos.length }}</span>
          </div>
          <div class="item-resumo">
            <span class="label">Faturamento recebido:</span>
            <span class="valor destaque">{{ formatarMoeda(totalFaturado) }}</span>
          </div>
          <div class="item-resumo">
            <span class="label">Fiado a receber:</span>
            <span class="valor destaque-pendente">{{ formatarMoeda(totalFiadoPendente) }}</span>
          </div>
        </div>

        <div class="tabela-wrapper">
          <table class="tabela">
            <thead>
              <tr>
                <th>Nº venda</th>
                <th>Data da venda</th>
                <th>Data do faturamento</th>
                <th>Cliente</th>
                <th>Qtd. itens</th>
                <th>Pagamento</th>
                <th>Status financeiro</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pedido in pedidosEnriquecidos" :key="pedido.id">
                <td>#{{ pedido.id }}</td>
                <td>{{ formatarData(pedido.data) }}</td>
                <td>{{ formatarData(pedido.dataFaturamento) }}</td>
                <td>{{ pedido.clienteNome }}</td>
                <td>{{ pedido.quantidadeTotal }}</td>
                <td>{{ pedido.formaPagamento }}</td>
                <td>
                  <span class="badge" :class="pedido.faturado ? 'badge-ok' : 'badge-pendente'">
                    {{ pedido.statusFinanceiro }}
                  </span>
                </td>
                <td>{{ formatarMoeda(pedido.valorTotal) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Relatório de estoque -->
    <section class="secao secao-estoque">
      <h3>Relatório de estoque</h3>

      <div class="resumo-estoque">
        <div class="item-resumo">
          <span class="label">Total de itens em estoque:</span>
          <span class="valor">{{ totalItensEstoque }}</span>
        </div>
        <div class="item-resumo">
          <span class="label">Produtos em falta:</span>
          <span class="valor destaque-alerta">{{ produtosEmFalta.length }}</span>
        </div>
      </div>

      <p v-if="!store.carregando && produtosOrdenados.length === 0" class="mensagem-vazia">
        Nenhum produto cadastrado para exibir.
      </p>

      <div v-else-if="!store.carregando" class="tabela-wrapper">
        <table class="tabela">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Qtd. estoque</th>
              <th>Qtd. mínima</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="produto in produtosOrdenados" :key="produto.id">
              <td>{{ produto.nome }}</td>
              <td>{{ produto.quantidade }}</td>
              <td>{{ produto.quantidadeMinima }}</td>
              <td>
                <span
                  class="badge"
                  :class="produto.quantidade < produto.quantidadeMinima ? 'badge-alerta' : 'badge-ok'"
                >
                  {{ produto.quantidade < produto.quantidadeMinima ? 'Abaixo do mínimo' : 'OK' }}
                </span>
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
import { getRevenueDate, isRevenueRecognized, STORE_CREDIT } from '../utils/revenue'

const store = useMercearia()

// --------- Relatório de vendas ---------

const pedidosEnriquecidos = computed(() =>
  [...store.pedidos]
    .sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0))
    .map((pedido) => {
      const cliente = store.clientes.find((c) => c.id === pedido.clienteId)
      const quantidadeTotal = (pedido.itens || []).reduce(
        (soma, item) => soma + (item.quantidade || 0),
        0,
      )
      const valorTotal = Number(pedido.valorTotal) || calcularValorPedido(pedido)
      const dataFaturamento = getRevenueDate(pedido)
      const faturado = isRevenueRecognized(pedido)

      return {
        ...pedido,
        clienteNome: cliente?.nome || pedido.clienteNome || 'Consumidor final',
        quantidadeTotal,
        valorTotal,
        dataFaturamento,
        faturado,
        statusFinanceiro: obterStatusFinanceiro(pedido, faturado),
      }
    }),
)

const totalFaturado = computed(() =>
  pedidosEnriquecidos.value
    .filter((pedido) => pedido.faturado)
    .reduce((soma, pedido) => soma + pedido.valorTotal, 0),
)

const totalFiadoPendente = computed(() =>
  pedidosEnriquecidos.value
    .filter((pedido) => pedido.tipoPagamento === STORE_CREDIT && !pedido.faturado)
    .reduce((soma, pedido) => soma + pedido.saldoPendente, 0),
)

// --------- Relatório de estoque ---------

const produtosOrdenados = computed(() =>
  [...store.produtos].sort((a, b) =>
    (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }),
  ),
)

const produtosEmFalta = computed(() => store.produtosEmFalta)

const totalItensEstoque = computed(() =>
  store.produtos.reduce((soma, p) => soma + (p.quantidade || 0), 0),
)

// --------- Funções auxiliares ---------

function calcularValorPedido(pedido) {
  return (pedido.itens || []).reduce(
    (soma, item) => soma + (item.quantidade || 0) * (item.precoUnitario || 0),
    0,
  )
}

function obterStatusFinanceiro(pedido, faturado) {
  if (faturado && pedido.tipoPagamento === STORE_CREDIT) return 'Fiado recebido'
  if (faturado) return 'Recebida'
  if (pedido.tipoPagamento === STORE_CREDIT && pedido.saldoPendente <= 0) {
    return 'Pagamento sem data'
  }
  return 'A receber'
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor || 0)
}

function formatarData(dataISO) {
  if (!dataISO) return '-'
  const data = new Date(dataISO)
  return data.toLocaleDateString('pt-BR')
}

// Log dos dados que a tela de relatórios utiliza
onMounted(() => {
  store.carregarDados().catch(() => {})
})
</script>

<style scoped>
.relatorios {
  max-width: var(--largura-max);
  margin: 0 auto;
  padding: 1.5rem;
}

.relatorios-header { margin-bottom: 2rem; }

.relatorios-header h2 {
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

.secao {
  background: var(--cor-superficie);
  border-radius: var(--raio);
  padding: 1.25rem;
  box-shadow: var(--sombra);
  border: 1px solid var(--cor-borda);
  margin-bottom: 1.5rem;
}

.secao h3 {
  margin: 0 0 1rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--cor-titulo);
}

.resumo-vendas,
.resumo-estoque {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: var(--cor-fundo-suave);
  border-radius: var(--raio-sm);
  border: 1px solid var(--cor-borda);
}

.item-resumo {
  display: flex;
  gap: 0.35rem;
  font-size: 0.9rem;
  align-items: center;
}

.item-resumo .label { color: var(--cor-texto-leve); }

.item-resumo .valor {
  font-weight: 700;
  color: var(--cor-titulo);
}

.item-resumo .valor.destaque       { color: var(--cor-sucesso); }
.item-resumo .valor.destaque-alerta { color: var(--cor-perigo); }
.item-resumo .valor.destaque-pendente { color: var(--cor-alerta); }

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

.mensagem-vazia {
  margin: 0;
  font-size: 0.9rem;
  color: var(--cor-texto-leve);
}

.badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: var(--raio-pill);
  font-size: 0.78rem;
  font-weight: 600;
}

.badge-ok     { background: var(--cor-sucesso-fundo); color: var(--cor-sucesso); }
.badge-alerta { background: var(--cor-perigo-fundo);  color: var(--cor-perigo); }
.badge-pendente { background: var(--cor-alerta-fundo); color: var(--cor-alerta); }

@media (max-width: 600px) {
  .relatorios { padding: 1rem; }
  .tabela th, .tabela td { padding: 0.5rem; }
}
</style>

