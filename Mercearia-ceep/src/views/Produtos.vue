<template>
  <div class="produtos">
    <header class="produtos-header">
      <h2>Produtos</h2>
      <p class="subtitle">Gerencie os produtos e o estoque da mercearia.</p>
    </header>

    <p v-if="store.erro" class="mensagem-api erro" role="alert">{{ store.erro }}</p>
    <p v-else-if="store.carregando" class="mensagem-api" role="status">Carregando produtos...</p>

    <section class="cards" aria-label="Resumo de produtos">
      <article class="card card-total">
        <p class="valor">{{ totalProdutos }}</p>
        <h3>Produtos cadastrados</h3>
        <p class="label">Itens diferentes</p>
      </article>

      <article class="card card-estoque">
        <p class="valor">{{ totalItensEmEstoque }}</p>
        <h3>Unidades em estoque</h3>
        <p class="label">Soma das quantidades</p>
      </article>

      <article class="card card-valor">
        <p class="valor">{{ formatarMoeda(valorTotalEstoque) }}</p>
        <h3>Valor total do estoque</h3>
        <p class="label">Qtd × preço</p>
      </article>

      <article class="card card-alertas">
        <p class="valor">{{ totalEmFalta }}</p>
        <h3>Produtos em alerta</h3>
        <p class="label">Abaixo do mínimo</p>
      </article>
    </section>

    <section class="secao-formulario">
      <h3 v-if="!estaEditando">Novo produto</h3>
      <h3 v-else>Editar produto: <span class="nome-editando">{{ form.nome }}</span></h3>

      <form @submit.prevent="salvarProduto" class="form">
        <div class="campo">
          <label for="nome">Nome</label>
          <input
            id="nome"
            v-model="form.nome"
            type="text"
            placeholder="Ex.: Arroz 5kg"
            required
          />
        </div>

        <div class="grupo-horizontal">
          <div class="campo">
            <label for="preco">Preço (R$)</label>
            <input
              id="preco"
              v-model.number="form.preco"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              required
            />
          </div>

          <div class="campo">
            <label for="quantidade">Qtd. estoque</label>
            <input
              id="quantidade"
              v-model.number="form.quantidade"
              type="number"
              min="0"
              placeholder="Ex.: 10"
              required
            />
          </div>

          <div class="campo">
            <label for="quantidadeMinima">Qtd. mínima</label>
            <input
              id="quantidadeMinima"
              v-model.number="form.quantidadeMinima"
              type="number"
              min="0"
              placeholder="Ex.: 5"
              required
            />
          </div>
        </div>

        <p v-if="form.preco > 0 && form.quantidade > 0" class="preview-valor">
          Valor em estoque: <strong>{{ formatarMoeda(form.preco * form.quantidade) }}</strong>
        </p>

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

    <section class="secao-tabela">
      <div class="tabela-cabecalho">
        <h3>Lista de produtos</h3>
        <div class="campo-busca">
          <input
            v-model="textoBusca"
            type="text"
            placeholder="Buscar por nome..."
            class="input-busca"
          />
        </div>
      </div>

      <p v-if="!store.carregando && store.produtos.length === 0" class="mensagem-vazia">
        Nenhum produto cadastrado ainda. Use o formulário acima para adicionar.
      </p>

      <p v-else-if="!store.carregando && produtosFiltrados.length === 0" class="mensagem-vazia">
        Nenhum produto encontrado para "<strong>{{ textoBusca }}</strong>".
      </p>

      <div v-else-if="!store.carregando" class="tabela-wrapper">
        <table class="tabela">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Preço</th>
              <th>Qtd. estoque</th>
              <th>Qtd. mínima</th>
              <th>Valor estoque</th>
              <th>Status</th>
              <th class="col-acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="produto in produtosFiltrados"
              :key="produto.id"
              :class="{ 'linha-alerta': produto.quantidade < produto.quantidadeMinima }"
            >
              <td class="coluna-nome">{{ produto.nome }}</td>
              <td>{{ formatarMoeda(produto.preco) }}</td>
              <td>
                <span
                  :class="produto.quantidade < produto.quantidadeMinima ? 'qtd-baixa' : ''"
                >
                  {{ produto.quantidade }}
                </span>
              </td>
              <td>{{ produto.quantidadeMinima }}</td>
              <td>{{ formatarMoeda(produto.preco * produto.quantidade) }}</td>
              <td>
                <span
                  class="badge"
                  :class="produto.quantidade < produto.quantidadeMinima ? 'badge-alerta' : 'badge-ok'"
                >
                  {{ produto.quantidade < produto.quantidadeMinima ? 'Abaixo do mínimo' : 'OK' }}
                </span>
              </td>
              <td class="celula-acoes">
                <button type="button" class="botao-acao" @click="iniciarEdicao(produto)">
                  Editar
                </button>
                <button
                  type="button"
                  class="botao-acao botao-remover"
                  :disabled="store.salvando"
                  @click="remover(produto.id)"
                >
                  Remover
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="produtosFiltrados.length > 0" class="rodape-tabela">
        Exibindo {{ produtosFiltrados.length }} de {{ store.produtos.length }} produtos.
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue'
import { useMercearia } from '../composables/useMercearia'

const store = useMercearia()

const textoBusca = ref('')

const form = reactive({
  nome: '',
  preco: 0,
  quantidade: 0,
  quantidadeMinima: 0,
})

const idEmEdicao = ref(null)
const estaEditando = computed(() => idEmEdicao.value !== null)

const produtosFiltrados = computed(() => {
  const lista = [...store.produtos].sort((a, b) =>
    (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }),
  )
  const busca = textoBusca.value.trim().toLowerCase()
  if (!busca) return lista
  return lista.filter((p) => (p.nome || '').toLowerCase().includes(busca))
})

const totalProdutos = computed(() => store.produtos.length)
const totalItensEmEstoque = computed(() =>
  store.produtos.reduce((soma, p) => soma + (p.quantidade || 0), 0),
)
const totalEmFalta = computed(() => store.produtosEmFalta.length)
const valorTotalEstoque = computed(() =>
  store.produtos.reduce((soma, p) => soma + (p.quantidade || 0) * (p.preco || 0), 0),
)

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor || 0)
}

function limparFormulario() {
  form.nome = ''
  form.preco = 0
  form.quantidade = 0
  form.quantidadeMinima = 0
  idEmEdicao.value = null
}

async function salvarProduto() {
  if (!form.nome.trim()) return

  const dados = {
    nome: form.nome.trim(),
    preco: Number(form.preco) || 0,
    quantidade: Number(form.quantidade) || 0,
    quantidadeMinima: Number(form.quantidadeMinima) || 0,
  }

  try {
    if (idEmEdicao.value !== null) {
      await store.atualizarProduto(idEmEdicao.value, dados)
    } else {
      await store.adicionarProduto(dados)
    }
    limparFormulario()
  } catch {
    // A mensagem normalizada é exibida pela página.
  }
}

function iniciarEdicao(produto) {
  idEmEdicao.value = produto.id
  form.nome = produto.nome || ''
  form.preco = produto.preco ?? 0
  form.quantidade = produto.quantidade ?? 0
  form.quantidadeMinima = produto.quantidadeMinima ?? 0
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function remover(id) {
  const confirmar = window.confirm('Tem certeza que deseja remover este produto?')
  if (!confirmar) return

  try {
    await store.removerProduto(id)
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
.produtos {
  max-width: var(--largura-max);
  margin: 0 auto;
  padding: 1.5rem;
}

.produtos-header { margin-bottom: 2rem; }

.produtos-header h2 {
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

.card .label {
  margin: 0.1rem 0 0;
  font-size: 0.78rem;
  color: var(--cor-texto-muito-leve);
}

.card-total .valor   { color: var(--cor-primaria); }
.card-estoque .valor { color: var(--cor-sucesso); }
.card-valor .valor   { color: var(--cor-roxa); }
.card-alertas .valor { color: var(--cor-perigo); }

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

.nome-editando { color: var(--cor-primaria); font-weight: 700; }

.form { display: grid; gap: 0.85rem; }

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

.grupo-horizontal {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.85rem;
}

.preview-valor {
  margin: 0;
  font-size: 0.85rem;
  color: var(--cor-texto);
  background: var(--cor-roxa-fundo);
  border-left: 3px solid var(--cor-roxa);
  padding: 0.4rem 0.75rem;
  border-radius: 0 var(--raio-sm) var(--raio-sm) 0;
}

.preview-valor strong { color: var(--cor-roxa); }

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

/* Tabela */
.secao-tabela {
  background: var(--cor-superficie);
  border-radius: var(--raio);
  padding: 1.25rem;
  box-shadow: var(--sombra);
  border: 1px solid var(--cor-borda);
}

.tabela-cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.tabela-cabecalho h3 {
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

.linha-alerta { background: var(--cor-perigo-fundo) !important; }
.linha-alerta:hover { background: #ffecec !important; }

.qtd-baixa { color: var(--cor-perigo); font-weight: 700; }
.coluna-nome { font-weight: 500; }

.badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: var(--raio-pill);
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-ok     { background: var(--cor-sucesso-fundo); color: var(--cor-sucesso); }
.badge-alerta { background: var(--cor-perigo-fundo);  color: var(--cor-perigo); }

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

@media (max-width: 600px) {
  .produtos { padding: 1rem; }
  .tabela th, .tabela td { padding: 0.5rem; }
  .input-busca { width: 120px; }
}
</style>
