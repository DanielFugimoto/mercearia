/**
 * main.js - Ponto de entrada da aplicação Vue
 *
 * Este arquivo é carregado pelo index.html (script type="module").
 * Ele cria a instância da aplicação Vue, registra os plugins (Pinia e Vue Router)
 * e monta o componente raiz App no elemento #app da página.
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Cria a instância da aplicação Vue usando o componente App como raiz
const app = createApp(App)

// Registra o Pinia para gerenciamento de estado global (produtos, clientes, pedidos)
app.use(createPinia())

// Registra o Vue Router para navegação entre páginas (Dashboard, Produtos, etc.)
app.use(router)

// Monta a aplicação no elemento HTML com id="app"
app.mount('#app')
