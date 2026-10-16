<template>
  <div class="app">
    <header v-if="!emTelaLogin" class="barra-superior">
      <h1 class="logo">Mercearia do Erinaldo</h1>
      <nav class="nav">
        <RouterLink to="/dashboard" class="nav-link">Dashboard</RouterLink>
        <RouterLink to="/produtos" class="nav-link">Produtos</RouterLink>
        <RouterLink to="/clientes" class="nav-link">Clientes</RouterLink>
        <RouterLink to="/pedidos" class="nav-link">Vendas</RouterLink>
        <RouterLink to="/relatorios" class="nav-link">Relatórios</RouterLink>
      </nav>
      <button type="button" class="botao-sair" @click="sair">Sair</button>
    </header>
    <main class="conteudo">
      <RouterView />
    </main>
    <footer v-if="!emTelaLogin" class="barra-inferior">
      <p>Controle Mercearia</p>
    </footer>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logout } from './services/auth.service'
import { useProductsStore } from './stores/products'
import { useClientsStore } from './stores/clients'
import { useSalesStore } from './stores/sales'
import { clearSaleDraft } from './services/saleDraft.service'

const route = useRoute()
const router = useRouter()
const domainStores = [useProductsStore(), useClientsStore(), useSalesStore()]
const emTelaLogin = computed(() => route.name === 'Login')

function sair() {
  logout()
  domainStores.forEach((store) => store.reset())
  router.push('/login')
}

function handleUnauthorized() {
  clearSaleDraft()
  domainStores.forEach((store) => store.reset())
  if (route.name !== 'Login') router.push('/login')
}

onMounted(() => window.addEventListener('auth:unauthorized', handleUnauthorized))
onBeforeUnmount(() => window.removeEventListener('auth:unauthorized', handleUnauthorized))
</script>

<style>
/* ============================================================
   Variáveis globais – sistema de design da mercearia
   Use estas variáveis em todos os componentes para manter
   cores, raios e sombras padronizados.
   ============================================================ */
:root {
  /* Cores de ação */
  --cor-primaria:       #2563eb;
  --cor-primaria-fundo: #eff6ff;
  --cor-sucesso:        #16a34a;
  --cor-sucesso-fundo:  #f0fdf4;
  --cor-perigo:         #dc2626;
  --cor-perigo-fundo:   #fef2f2;
  --cor-alerta:         #d97706;
  --cor-alerta-fundo:   #fffbeb;
  --cor-roxa:           #7c3aed;
  --cor-roxa-fundo:     #f5f3ff;

  /* Texto */
  --cor-titulo:         #1a1a2e;
  --cor-texto:          #374151;
  --cor-texto-leve:     #6b7280;
  --cor-texto-muito-leve: #9ca3af;

  /* Superfícies e bordas */
  --cor-superficie:     #ffffff;
  --cor-fundo-suave:    #f8f9fa;
  --cor-fundo-input:    #f9fafb;
  --cor-borda:          #e5e7eb;
  --cor-borda-leve:     #f3f4f6;

  /* Navegação */
  --cor-nav:            #1a1a2e;

  /* Forma */
  --raio:               10px;   /* cards, seções */
  --raio-sm:            6px;    /* inputs, botões, badges pequenos */
  --raio-pill:          20px;   /* badges arredondados */

  /* Sombra */
  --sombra:             0 1px 4px rgba(0, 0, 0, 0.08);

  /* Layout */
  --largura-max:        1080px;
}

/* Reset: box-sizing para padding não somar à largura */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #f0f2f5;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: var(--cor-texto);
}

.mensagem-api {
  margin: 0 0 1rem;
  padding: 0.75rem 1rem;
  border-radius: var(--raio-sm);
  border: 1px solid var(--cor-borda);
  background: var(--cor-primaria-fundo);
  color: var(--cor-primaria);
  font-size: 0.9rem;
}

.mensagem-api.erro {
  background: var(--cor-perigo-fundo);
  border-color: #fecaca;
  color: var(--cor-perigo);
}

/* Layout em coluna: barra em cima, conteúdo preenchendo o resto */
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Barra superior escura com logo e menu */
.barra-superior {
  background: #1a1a2e;
  color: #fff;
  padding: 0.75rem 1.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.barra-superior .logo {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.nav {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.botao-sair {
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border-radius: 6px;
  padding: 0.35rem 0.7rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.botao-sair:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.45);
}

/* Links do menu: cor clara, destaque no hover e na rota ativa */
.nav-link {
  color: #e0e0e0;
  text-decoration: none;
  padding: 0.35rem 0.6rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.nav-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

/* Classe aplicada automaticamente pelo Vue Router ao link da rota ativa */
.nav-link.router-link-active {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
}

.conteudo {
  flex: 1;
  padding-bottom: 1rem;
}

/* Rodapé fixo: mesmo estilo visual do header (fundo escuro, texto claro) */
.barra-inferior {
  background: #1a1a2e;
  color: #e0e0e0;
  padding: 0.75rem 1.5rem;
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.15);
  text-align: center;
  font-size: 0.85rem;
}

.barra-inferior p {
  margin: 0;
}
</style>
