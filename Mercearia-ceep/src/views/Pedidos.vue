<template>
  <div class="vendas">

    <header class="vendas-header">
      <h2>Vendas</h2>
      <p class="subtitle">Registre as vendas realizadas na mercearia.</p>
    </header>

    <p v-if="store.erro" class="mensagem-api erro" role="alert">{{ store.erro }}</p>
    <p v-else-if="store.carregando" class="mensagem-api" role="status">Carregando dados da venda...</p>

    <section class="cards" aria-label="Resumo de vendas">
      <article class="card card-total">
        <p class="valor">{{ store.pedidos.length }}</p>
        <h3>Vendas registradas</h3>
      </article>
      <article class="card card-hoje">
        <p class="valor">{{ vendasHoje }}</p>
        <h3>Vendas hoje</h3>
      </article>
      <article class="card card-faturamento">
        <p class="valor">{{ formatarMoeda(faturamentoTotal) }}</p>
        <h3>Faturamento total</h3>
      </article>
      <article class="card card-hoje-valor">
        <p class="valor">{{ formatarMoeda(faturamentoHoje) }}</p>
        <h3>Faturamento hoje</h3>
      </article>
    </section>

    <section class="secao-venda">
      <h3 class="titulo-secao">Nova venda</h3>

      <div class="linha-cabecalho-venda">
        <div class="campo">
          <label for="cliente">Cliente <span class="opcional">(opcional)</span></label>
          <select id="cliente" v-model="form.clienteId">
            <option value="">Consumidor final / Venda avulsa</option>
            <option v-for="c in clientesOrdenados" :key="c.id" :value="c.id">
              {{ c.nome }}
            </option>
          </select>
        </div>

        <div class="campo">
          <label for="pagamento">Forma de pagamento <span class="obrigatorio">*</span></label>
          <select id="pagamento" v-model="form.formaPagamento">
            <option value="">Selecione...</option>
            <option value="CASH">Dinheiro</option>
            <option value="PIX">Pix</option>
            <option value="DEBIT_CARD">Cartão de Débito</option>
            <option value="CREDIT_CARD">Cartão de Crédito</option>
            <option value="STORE_CREDIT">Fiado</option>
          </select>
        </div>
      </div>

      <div class="area-venda">

        <div class="catalogo">
          <div class="catalogo-busca">
            <input
              v-model="buscaCatalogo"
              type="text"
              placeholder="Buscar produto..."
              class="input-busca"
            />
            <button
              v-if="buscaCatalogo"
              type="button"
              class="botao-limpar-busca"
              @click="buscaCatalogo = ''"
              title="Limpar busca"
            >✕</button>
          </div>

          <p v-if="!store.carregando && store.produtos.length === 0" class="catalogo-vazio">
            Nenhum produto cadastrado.
          </p>

          <p v-else-if="!store.carregando && produtosFiltrados.length === 0" class="catalogo-vazio">
            Nenhum produto encontrado para "<strong>{{ buscaCatalogo }}</strong>".
          </p>

          <div v-else-if="!store.carregando" class="grade-produtos">
            <button
              v-for="produto in produtosFiltrados"
              :key="produto.id"
              type="button"
              class="card-produto"
              :class="{
                'card-produto-selecionado': quantidadeNoCarrinho(produto.id) > 0,
                'card-produto-sem-estoque': produto.quantidade <= 0,
              }"
              :disabled="produto.quantidade <= 0"
              @click="adicionarAoCarrinho(produto.id)"
              :title="produto.quantidade <= 0 ? 'Sem estoque' : `Adicionar ${produto.nome}`"
            >
              <span
                v-if="quantidadeNoCarrinho(produto.id) > 0"
                class="badge-carrinho"
              >
                {{ quantidadeNoCarrinho(produto.id) }}
              </span>

              <p class="produto-nome">{{ produto.nome }}</p>
              <p class="produto-preco">{{ formatarMoeda(produto.preco) }}</p>

              <div class="produto-rodape">
                <span
                  class="produto-estoque"
                  :class="produto.quantidade <= 0 ? 'estoque-zero' : produto.quantidade <= produto.quantidadeMinima ? 'estoque-baixo' : 'estoque-ok'"
                >
                  <template v-if="produto.quantidade <= 0">Sem estoque</template>
                  <template v-else>Est: {{ produto.quantidade }}</template>
                </span>
                <span v-if="produto.quantidade > 0" class="produto-adicionar">
                  {{ quantidadeNoCarrinho(produto.id) > 0 ? '+ mais' : '+ add' }}
                </span>
              </div>
            </button>
          </div>
        </div>

        <div class="carrinho">
          <div class="carrinho-cabecalho">
            <h4>
              Carrinho
              <span v-if="form.itens.length > 0" class="badge-total-itens">
                {{ totalItensCarrinho }}
              </span>
            </h4>
            <button
              v-if="form.itens.length > 0"
              type="button"
              class="botao-limpar-carrinho"
              @click="limparCarrinho"
              title="Esvaziar carrinho"
            >
              Esvaziar
            </button>
          </div>

          <div v-if="form.itens.length === 0" class="carrinho-vazio">
            <p>Nenhum produto adicionado.</p>
            <p class="carrinho-dica">Clique nos produtos ao lado para adicionar.</p>
          </div>

          <ul v-else class="lista-carrinho">
            <li
              v-for="item in carrinhoEnriquecido"
              :key="item.produtoId"
              class="item-carrinho"
            >
              <div class="item-info">
                <span class="item-nome">{{ item.nome }}</span>
                <span class="item-preco-unit">{{ formatarMoeda(item.preco) }} / un.</span>
              </div>

              <div class="item-controles">
                <button
                  type="button"
                  class="btn-qtd"
                  @click="decrementar(item.produtoId)"
                  title="Diminuir"
                >−</button>
                <span class="item-qtd">{{ item.quantidade }}</span>
                <button
                  type="button"
                  class="btn-qtd"
                  @click="incrementar(item.produtoId)"
                  :disabled="item.quantidade >= item.estoqueDisponivel"
                  title="Aumentar"
                >+</button>
                <button
                  type="button"
                  class="btn-remover"
                  @click="removerDoCarrinho(item.produtoId)"
                  title="Remover"
                >✕</button>
              </div>

              <div class="item-subtotal">{{ formatarMoeda(item.subtotal) }}</div>
            </li>
          </ul>

          <div class="carrinho-rodape">
            <div class="linha-total">
              <span>Total</span>
              <strong class="valor-total-carrinho">{{ formatarMoeda(totalFormulario) }}</strong>
            </div>

            <button
              type="button"
              class="botao-registrar"
              :disabled="store.salvando || form.itens.length === 0 || !form.formaPagamento || (form.formaPagamento === 'STORE_CREDIT' && !form.clienteId)"
              @click="registrarVenda"
            >
              {{ store.salvando ? 'Registrando...' : 'Registrar venda' }}
            </button>

            <p v-if="form.itens.length > 0 && !form.formaPagamento" class="aviso-pagamento">
              Selecione a forma de pagamento acima.
            </p>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useMercearia } from '../composables/useMercearia'
import {
  clearSaleDraft,
  loadSaleDraft,
  saveSaleDraft,
} from '../services/saleDraft.service'
import { getRevenueDate, isRevenueRecognized, isSameLocalDay } from '../utils/revenue'

const store = useMercearia()

const buscaCatalogo = ref('')

const form = reactive(loadSaleDraft())

watch(form, () => saveSaleDraft(form), { deep: true })

const clientesOrdenados = computed(() =>
  [...store.clientes].sort((a, b) =>
    (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }),
  ),
)

const produtosFiltrados = computed(() => {
  const lista = [...store.produtos].sort((a, b) =>
    (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }),
  )
  const busca = buscaCatalogo.value.trim().toLowerCase()
  if (!busca) return lista
  return lista.filter((p) => (p.nome || '').toLowerCase().includes(busca))
})

function quantidadeNoCarrinho(produtoId) {
  return form.itens.find((i) => i.produtoId === produtoId)?.quantidade ?? 0
}

function adicionarAoCarrinho(produtoId) {
  const produto = store.produtos.find((p) => p.id === produtoId)
  if (!produto || produto.quantidade <= 0) return

  const item = form.itens.find((i) => i.produtoId === produtoId)
  if (item) {
    if (item.quantidade < produto.quantidade) item.quantidade++
  } else {
    form.itens.push({ produtoId, quantidade: 1 })
  }
}

function incrementar(produtoId) {
  const produto = store.produtos.find((p) => p.id === produtoId)
  const item    = form.itens.find((i) => i.produtoId === produtoId)
  if (item && produto && item.quantidade < produto.quantidade) {
    item.quantidade++
  }
}

function decrementar(produtoId) {
  const idx = form.itens.findIndex((i) => i.produtoId === produtoId)
  if (idx === -1) return
  if (form.itens[idx].quantidade > 1) {
    form.itens[idx].quantidade--
  } else {
    form.itens.splice(idx, 1)
  }
}

function removerDoCarrinho(produtoId) {
  const idx = form.itens.findIndex((i) => i.produtoId === produtoId)
  if (idx !== -1) form.itens.splice(idx, 1)
}

function limparCarrinho() {
  form.itens = []
}

const carrinhoEnriquecido = computed(() =>
  form.itens.map((item) => {
    const produto = store.produtos.find((p) => p.id === item.produtoId)
    return {
      produtoId:         item.produtoId,
      nome:              produto?.nome ?? 'Produto',
      preco:             produto?.preco ?? 0,
      quantidade:        item.quantidade,
      estoqueDisponivel: produto?.quantidade ?? 0,
      subtotal:          (produto?.preco ?? 0) * item.quantidade,
    }
  }),
)

const totalItensCarrinho = computed(() =>
  form.itens.reduce((s, i) => s + i.quantidade, 0),
)

const totalFormulario = computed(() =>
  carrinhoEnriquecido.value.reduce((s, i) => s + i.subtotal, 0),
)

async function registrarVenda() {
  if (form.itens.length === 0 || !form.formaPagamento) return
  if (form.formaPagamento === 'STORE_CREDIT' && !form.clienteId) {
    window.alert('Selecione um cliente para registrar uma venda fiada.')
    return
  }

  const itens = form.itens.map((item) => {
    const produto = store.produtos.find((p) => p.id === item.produtoId)
    return {
      produtoId:      produto.id,
      quantidade:     item.quantidade,
      precoUnitario:  produto?.preco ?? 0,
    }
  })

  for (const item of itens) {
    const produto = store.produtos.find((p) => p.id === item.produtoId)
    if (item.quantidade > (produto?.quantidade ?? 0)) {
      window.alert(
        `Estoque insuficiente para "${produto?.nome}".\n` +
        `Disponível: ${produto?.quantidade ?? 0} | Solicitado: ${item.quantidade}.`,
      )
      return
    }
  }

  try {
    await store.adicionarPedido({
      clienteId: form.clienteId || null,
      tipoPagamento: form.formaPagamento,
      itens,
    })
    limparCarrinho()
    form.formaPagamento = ''
    form.clienteId = ''
    await nextTick()
    clearSaleDraft()
  } catch {
    // A mensagem normalizada é exibida pela página.
  }
}

const vendaFoiHoje = (venda) => isSameLocalDay(venda.data)

const vendasHoje = computed(
  () => store.pedidos.filter(vendaFoiHoje).length,
)

const faturamentoTotal = computed(() =>
  store.pedidos
    .filter(isRevenueRecognized)
    .reduce((total, venda) => total + venda.valorTotal, 0),
)

const faturamentoHoje = computed(() =>
  store.pedidos
    .filter((venda) => isSameLocalDay(getRevenueDate(venda)))
    .reduce((total, venda) => total + venda.valorTotal, 0),
)

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
}

onMounted(async () => {
  try {
    await store.carregarDados()

    if (form.clienteId && !store.clientes.some((cliente) => cliente.id === form.clienteId)) {
      form.clienteId = ''
    }

    form.itens = form.itens
      .map((item) => {
        const produto = store.produtos.find((candidate) => candidate.id === item.produtoId)
        if (!produto || produto.quantidade <= 0) return null
        return {
          produtoId: item.produtoId,
          quantidade: Math.min(item.quantidade, produto.quantidade),
        }
      })
      .filter(Boolean)
  } catch {
    // A mensagem normalizada é exibida pela página.
  }
})
</script>

<style scoped>
.vendas {
  max-width: var(--largura-max);
  margin: 0 auto;
  padding: 1.5rem;
}

.vendas-header { margin-bottom: 2rem; }

.vendas-header h2 {
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
  font-size: 1.4rem;
  font-weight: 700;
}

.card-total .valor       { color: var(--cor-primaria); }
.card-hoje .valor        { color: var(--cor-sucesso); }
.card-faturamento .valor { color: var(--cor-roxa); font-size: 1.1rem; }
.card-hoje-valor .valor  { color: var(--cor-alerta); font-size: 1.1rem; }

.secao-venda {
  background: var(--cor-superficie);
  border-radius: var(--raio);
  padding: 1.25rem;
  box-shadow: var(--sombra);
  border: 1px solid var(--cor-borda);
  margin-bottom: 1.5rem;
}

.titulo-secao {
  margin: 0 0 1.25rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--cor-titulo);
}

.linha-cabecalho-venda {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.campo { display: flex; flex-direction: column; gap: 0.3rem; }

.campo label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--cor-texto);
}

.campo select,
.campo input {
  padding: 0.55rem 0.7rem;
  border-radius: var(--raio-sm);
  border: 1px solid var(--cor-borda);
  font-size: 0.9rem;
  background: var(--cor-superficie);
  transition: border-color 0.15s;
}

.campo select:focus,
.campo input:focus {
  outline: none;
  border-color: var(--cor-primaria);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
}

.obrigatorio { color: var(--cor-perigo); }
.opcional    { color: var(--cor-texto-muito-leve); font-weight: 400; font-size: 0.8rem; }

.area-venda {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.25rem;
  align-items: start;
}

.catalogo { display: flex; flex-direction: column; gap: 0.75rem; }

.catalogo-busca {
  display: flex;
  align-items: center;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio-sm);
  background: var(--cor-fundo-input);
}

.input-busca {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  outline: none;
  color: var(--cor-texto);
  padding: 0.45rem 0.75rem;
}

.botao-limpar-busca {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.8rem;
  color: var(--cor-texto-muito-leve);
  padding: 0 0.25rem;
}

.botao-limpar-busca:hover { color: var(--cor-texto); }

.grade-produtos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(145px, 1fr));
  gap: 0.75rem;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.grade-produtos::-webkit-scrollbar { width: 5px; }
.grade-produtos::-webkit-scrollbar-track { background: transparent; }
.grade-produtos::-webkit-scrollbar-thumb { background: var(--cor-borda); border-radius: 4px; }

.card-produto {
  position: relative;
  background: var(--cor-fundo-input);
  border: 1.5px solid var(--cor-borda);
  border-radius: var(--raio);
  padding: 0.85rem 0.75rem 0.7rem;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.card-produto:hover:not(:disabled) {
  border-color: var(--cor-primaria);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  background: var(--cor-superficie);
}

.card-produto-selecionado {
  border-color: var(--cor-primaria) !important;
  background: var(--cor-primaria-fundo) !important;
}

.card-produto-sem-estoque { opacity: 0.5; cursor: not-allowed; }

.badge-carrinho {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  background: var(--cor-primaria);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.38rem;
  border-radius: var(--raio-pill);
  min-width: 18px;
  text-align: center;
}

.produto-nome {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--cor-titulo);
  line-height: 1.3;
  word-break: break-word;
}

.produto-preco {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--cor-primaria);
}

.produto-rodape {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.25rem;
}

.produto-estoque {
  font-size: 0.72rem;
  font-weight: 500;
  padding: 0.1rem 0.35rem;
  border-radius: var(--raio-pill);
}

.estoque-ok    { background: var(--cor-sucesso-fundo); color: var(--cor-sucesso); }
.estoque-baixo { background: var(--cor-alerta-fundo);  color: var(--cor-alerta); }
.estoque-zero  { background: var(--cor-perigo-fundo);  color: var(--cor-perigo); }

.produto-adicionar {
  font-size: 0.72rem;
  color: var(--cor-primaria);
  font-weight: 600;
}

.catalogo-vazio {
  padding: 1.5rem;
  text-align: center;
  background: var(--cor-fundo-suave);
  border-radius: var(--raio-sm);
  border: 1px dashed var(--cor-borda);
  color: var(--cor-texto-leve);
  font-size: 0.9rem;
  margin: 0;
}

.carrinho {
  background: var(--cor-fundo-suave);
  border: 1.5px solid var(--cor-borda);
  border-radius: var(--raio);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: sticky;
  top: 1rem;
}

.carrinho-cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  background: var(--cor-nav);
  color: #fff;
}

.carrinho-cabecalho h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.badge-total-itens {
  background: var(--cor-primaria);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  border-radius: var(--raio-pill);
}

.botao-limpar-carrinho {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 0.75rem;
  padding: 0.2rem 0.55rem;
  border-radius: var(--raio-sm);
  cursor: pointer;
  transition: background 0.15s;
}

.botao-limpar-carrinho:hover { background: rgba(255, 255, 255, 0.25); }

.carrinho-vazio { padding: 1.75rem 1rem; text-align: center; }

.carrinho-vazio p {
  margin: 0;
  color: var(--cor-texto-leve);
  font-size: 0.9rem;
}

.carrinho-dica {
  margin-top: 0.35rem !important;
  font-size: 0.78rem !important;
  color: var(--cor-texto-muito-leve) !important;
}

.lista-carrinho {
  list-style: none;
  margin: 0;
  padding: 0.5rem 0;
  max-height: 300px;
  overflow-y: auto;
}

.lista-carrinho::-webkit-scrollbar { width: 4px; }
.lista-carrinho::-webkit-scrollbar-thumb { background: var(--cor-borda); border-radius: 3px; }

.item-carrinho {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--cor-borda);
}

.item-carrinho:last-child { border-bottom: none; }

.item-info {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.4rem;
}

.item-nome {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--cor-titulo);
  word-break: break-word;
}

.item-preco-unit {
  font-size: 0.75rem;
  color: var(--cor-texto-leve);
  white-space: nowrap;
}

.item-controles { display: flex; align-items: center; gap: 0.35rem; }

.btn-qtd {
  width: 26px;
  height: 26px;
  border-radius: var(--raio-sm);
  border: 1px solid var(--cor-borda);
  background: var(--cor-superficie);
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--cor-texto);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, border-color 0.12s;
  padding: 0;
}

.btn-qtd:hover:not(:disabled) {
  background: var(--cor-primaria-fundo);
  border-color: var(--cor-primaria);
  color: var(--cor-primaria);
}

.btn-qtd:disabled { opacity: 0.35; cursor: default; }

.item-qtd {
  min-width: 22px;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--cor-titulo);
}

.btn-remover {
  margin-left: auto;
  border: none;
  background: var(--cor-perigo-fundo);
  color: var(--cor-perigo);
  font-size: 0.8rem;
  padding: 0.2rem 0.5rem;
  border-radius: var(--raio-sm);
  cursor: pointer;
  transition: filter 0.12s;
}

.btn-remover:hover { filter: brightness(0.93); }

.item-subtotal {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--cor-sucesso);
  text-align: right;
}

.carrinho-rodape {
  padding: 0.85rem 1rem;
  background: var(--cor-superficie);
  border-top: 1.5px solid var(--cor-borda);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.linha-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1rem;
  font-weight: 600;
  color: var(--cor-texto);
}

.valor-total-carrinho {
  font-size: 1.4rem;
  color: var(--cor-titulo);
}

.botao-registrar {
  width: 100%;
  padding: 0.65rem;
  border-radius: var(--raio-sm);
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 700;
  background: var(--cor-sucesso);
  color: #fff;
  transition: filter 0.15s;
}

.botao-registrar:hover:not(:disabled) { filter: brightness(0.93); }

.botao-registrar:disabled {
  background: var(--cor-borda);
  color: var(--cor-texto-leve);
  cursor: not-allowed;
}

.aviso-pagamento {
  margin: 0;
  font-size: 0.78rem;
  color: var(--cor-alerta);
  text-align: center;
}

@media (max-width: 860px) {
  .area-venda { grid-template-columns: 1fr; }
  .carrinho { position: static; }
  .grade-produtos { max-height: 280px; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
  .lista-carrinho { max-height: 220px; }
}

@media (max-width: 600px) {
  .vendas { padding: 1rem; }
  .linha-cabecalho-venda { grid-template-columns: 1fr; }
}
</style>
