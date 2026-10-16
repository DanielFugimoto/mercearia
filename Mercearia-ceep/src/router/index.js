import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Placeholder from '../views/Placeholder.vue'
import Clientes from '../views/Clientes.vue'
import Produtos from '../views/Produtos.vue'
import Pedidos from '../views/Pedidos.vue'
import Relatorios from '../views/Relatorios.vue'
import { isAuthenticated } from '../services/auth.service'

// Lista de rotas: path, nome, componente e meta (dados extras, ex: título)
const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: Login },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/produtos', name: 'Produtos', component: Produtos, meta: { titulo: 'Cadastro de Produtos', requiresAuth: true } },
  { path: '/clientes', name: 'Clientes', component: Clientes, meta: { titulo: 'Cadastro de Clientes', requiresAuth: true } },
  { path: '/pedidos', name: 'Pedidos', component: Pedidos, meta: { titulo: 'Vendas', requiresAuth: true } },
  { path: '/relatorios', name: 'Relatorios', component: Relatorios, meta: { titulo: 'Relatórios', requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

// Cria o router: history em modo HTML5 (URLs sem #) e usa as rotas acima
const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const authenticated = isAuthenticated()
  if (to.meta.requiresAuth && !authenticated) return '/login'
  if (to.name === 'Login' && authenticated) return '/dashboard'
  return true
})

export default router
