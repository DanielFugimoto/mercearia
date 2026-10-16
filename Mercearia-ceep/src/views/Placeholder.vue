<template>
  <div class="placeholder">
    <h2>{{ titulo }}</h2>
    <p>Esta página será implementada em breve.</p>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

// useRoute() retorna a rota atual; meta contém dados extras (ex: titulo)
const route = useRoute()
// Se a rota tiver meta.titulo, usa; senão exibe "Em breve"
const titulo = route.meta?.titulo ?? 'Em breve'
</script>

<style scoped>
/* scoped: estilos só afetam este componente */
.placeholder {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}
.placeholder h2 {
  color: #1a1a2e;
  margin-bottom: 0.5rem;
}
.placeholder p {
  color: #666;
}
</style>
