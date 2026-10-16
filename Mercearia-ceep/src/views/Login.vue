<template>
  <section class="login">
    <div class="card-login-borda">
      <div class="card-viewport">
        <Transition name="card-switch" mode="out-in">
          <article
            v-if="!modoCadastro"
            key="login"
            class="card-login"
            aria-label="Tela de login"
          >
            <header class="topo">
              <span class="chip">Mercearia do Erinaldo</span>
              <h1>Entrar</h1>
              <p class="subtitulo">
                Digite seu usuario e senha para acessar o sistema.
              </p>
            </header>

            <form class="form-login" @submit.prevent="entrar">
              <div class="campo">
                <label for="usuario-login">E-mail</label>
                <input
                  id="usuario-login"
                  v-model="usuarioLogin"
                  type="email"
                  placeholder="Digite seu e-mail"
                  autocomplete="username"
                  required
                />
              </div>

              <div class="campo">
                <label for="senha-login">Senha</label>
                <input
                  id="senha-login"
                  v-model="senhaLogin"
                  type="password"
                  placeholder="Digite sua senha"
                  autocomplete="current-password"
                  required
                />
              </div>

              <div class="feedback-slot" aria-live="polite">
                <p v-if="mensagemLogin" class="feedback feedback--info" role="status">
                  {{ mensagemLogin }}
                </p>
              </div>

              <button type="submit" class="botao-entrar" :disabled="carregando">
                {{ carregando ? 'Entrando...' : 'Entrar no dashboard' }}
              </button>
            </form>

            <p class="rodape-card">
              Ainda não tem conta?
              <button type="button" class="link-alternar" @click="irParaCadastro">
                Criar cadastro
              </button>
            </p>
          </article>

          <article
            v-else
            key="cadastro"
            class="card-login"
            aria-label="Cadastro de usuario"
          >
            <header class="topo">
              <span class="chip">Mercearia do Erinaldo</span>
              <h1>Criar conta</h1>
              <p class="subtitulo">Informe usuario e senha para se cadastrar.</p>
            </header>

            <form class="form-login" @submit.prevent="cadastrar">
              <div class="campo">
                <label for="nome-cadastro">Nome</label>
                <input
                  id="nome-cadastro"
                  v-model="nomeCadastro"
                  type="text"
                  placeholder="Digite seu nome"
                  autocomplete="name"
                  required
                />
              </div>

              <div class="campo">
                <label for="usuario-cadastro">E-mail</label>
                <input
                  id="usuario-cadastro"
                  v-model="usuarioCadastro"
                  type="email"
                  placeholder="Digite seu e-mail"
                  autocomplete="username"
                  required
                />
              </div>

              <div class="campo">
                <label for="senha-cadastro">Senha</label>
                <input
                  id="senha-cadastro"
                  v-model="senhaCadastro"
                  type="password"
                  placeholder="Defina sua senha"
                  autocomplete="new-password"
                  minlength="6"
                  required
                />
              </div>

              <div class="feedback-slot" aria-live="assertive">
                <p v-if="erroCadastro" class="feedback feedback--erro" role="alert">
                  {{ erroCadastro }}
                </p>
              </div>

              <button type="submit" class="botao-entrar botao-cadastrar" :disabled="carregando">
                {{ carregando ? 'Cadastrando...' : 'Cadastrar' }}
              </button>
            </form>

            <p class="rodape-card">
              Já tem conta?
              <button type="button" class="link-alternar" @click="irParaLogin">
                Voltar ao login
              </button>
            </p>
          </article>
        </Transition>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { login, register } from '../services/auth.service'
import { getErrorMessage } from '../services/http/errors'

const router = useRouter()

const modoCadastro = ref(false)
const usuarioLogin = ref('')
const senhaLogin = ref('')
const usuarioCadastro = ref('')
const nomeCadastro = ref('')
const senhaCadastro = ref('')
const erroCadastro = ref('')
const mensagemLogin = ref('')
const carregando = ref(false)

function irParaCadastro() {
  mensagemLogin.value = ''
  erroCadastro.value = ''
  modoCadastro.value = true
}

function irParaLogin() {
  erroCadastro.value = ''
  modoCadastro.value = false
}

watch(modoCadastro, (cadastro) => {
  if (!cadastro) {
    erroCadastro.value = ''
  } else {
    mensagemLogin.value = ''
  }
})

async function entrar() {
  mensagemLogin.value = ''
  const email = usuarioLogin.value.trim()
  const password = senhaLogin.value

  if (!email || !password) {
    mensagemLogin.value = 'Preencha usuário/e-mail e senha.'
    return
  }

  try {
    carregando.value = true
    await login({ email, password })
    await router.push('/dashboard')
  } catch (err) {
    mensagemLogin.value = getErrorMessage(err, 'Falha ao autenticar.')
  } finally {
    carregando.value = false
  }
}

async function cadastrar() {
  erroCadastro.value = ''
  const email = usuarioCadastro.value.trim()
  const name = nomeCadastro.value.trim()
  const password = senhaCadastro.value

  if (!name || !email || !password) {
    erroCadastro.value = 'Preencha nome, e-mail e senha.'
    return
  }

  try {
    carregando.value = true
    await register({ name, email, password })

    nomeCadastro.value = ''
    usuarioCadastro.value = ''
    senhaCadastro.value = ''
    usuarioLogin.value = email
    mensagemLogin.value = 'Cadastro concluído. Você já pode entrar.'
    modoCadastro.value = false
  } catch (err) {
    erroCadastro.value = getErrorMessage(err, 'Falha ao cadastrar.')
  } finally {
    carregando.value = false
  }
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: #f3f4f6;
}

.card-login-borda {
  width: 100%;
  max-width: 430px;
  padding: 3px;
  border-radius: 15px;
  background: linear-gradient(
    90deg,
    #ff0080,
    #ff4000,
    #fffc00,
    #00ff80,
    #0080ff,
    #8000ff,
    #ff0080
  );
  background-size: 400% 100%;
  animation: borda-rgb-onda 5s ease-in-out infinite;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
}

.card-viewport {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
}

@keyframes borda-rgb-onda {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.card-login {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  background: #fff;
  border: none;
  border-radius: 12px;
  box-shadow: none;
  padding: 2rem 1.7rem;
  box-sizing: border-box;
}

.topo {
  flex-shrink: 0;
  margin-bottom: 1.35rem;
}

.subtitulo {
  margin: 0.5rem 0 0;
  font-size: 0.88rem;
  color: #6b7280;
  line-height: 1.45;
  min-height: 2.9em;
}

.form-login {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.feedback-slot {
  min-height: 2.75rem;
  flex-shrink: 0;
}

.chip {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #4b5563;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  margin-bottom: 0.8rem;
}

.card-login h1 {
  margin: 0;
  font-size: 1.9rem;
  line-height: 1.1;
  font-weight: 700;
  color: #0b1220;
  letter-spacing: -0.02em;
}

.campo {
  display: grid;
  gap: 0.38rem;
}

.campo label {
  color: #1f2937;
  font-size: 0.85rem;
  font-weight: 600;
}

.campo input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 9px;
  background: #f9fafb;
  color: #111827;
  font-size: 0.92rem;
  padding: 0.72rem 0.8rem;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.campo input::placeholder {
  color: #9ca3af;
}

.campo input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14);
  background: #ffffff;
}

.feedback {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.35;
}

.feedback--erro {
  color: #b91c1c;
}

.feedback--info {
  color: #15803d;
}

.botao-entrar {
  margin-top: 0.35rem;
  width: 100%;
  border: none;
  border-radius: 9px;
  background: var(--cor-nav);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0.74rem;
  cursor: pointer;
  transition: filter 0.15s, transform 0.15s;
}

.botao-cadastrar {
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
}

.botao-entrar:hover {
  filter: brightness(1.12);
  transform: translateY(-1px);
}

.rodape-card {
  margin: 1.25rem 0 0;
  text-align: center;
  font-size: 0.88rem;
  color: #6b7280;
}

.link-alternar {
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  color: var(--cor-primaria, #2563eb);
  font-size: inherit;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link-alternar:hover {
  color: #1d4ed8;
}

/* Transição entre login e cadastro */
.card-switch-enter-active,
.card-switch-leave-active {
  transition:
    opacity 0.38s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.42s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-switch-enter-from {
  opacity: 0;
  transform: translateX(36px) scale(0.97);
}

.card-switch-leave-to {
  opacity: 0;
  transform: translateX(-36px) scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .card-switch-enter-active,
  .card-switch-leave-active {
    transition: opacity 0.2s ease;
  }

  .card-switch-enter-from,
  .card-switch-leave-to {
    transform: none;
  }
}
</style>
