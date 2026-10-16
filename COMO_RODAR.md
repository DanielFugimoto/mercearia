# Como rodar o projeto Mercearia

O projeto possui duas aplicações independentes:

- `API-Mercearia`: API Node.js, Express, Sequelize e PostgreSQL;
- `Mercearia-ceep`: frontend Vue 3 e Vite.

## 1. Pré-requisitos

- Node.js `20.19+` ou `22.12+`;
- npm;
- PostgreSQL em execução;
- um banco PostgreSQL chamado `mercearia`.

Para criar o banco pelo `psql`:

```sql
CREATE DATABASE mercearia;
```

## 2. Configurar a API

Entre na pasta da API:

```powershell
cd API-Mercearia
npm install
```

Copie `.env.example` para `.env` caso o arquivo ainda não exista:

```powershell
Copy-Item .env.example .env
```

Configure o `.env`:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173,http://127.0.0.1:5173
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mercearia
DB_USER=postgres
DB_PASS=sua_senha_do_postgres
JWT_SECRET=uma_chave_longa_e_aleatoria
APP_TIMEZONE=America/Sao_Paulo
SEED_USER_NAME=Administrador
SEED_USER_EMAIL=admin@mercearia.local
SEED_USER_PASSWORD=troque_esta_senha
```

O `JWT_SECRET` não deve ser reutilizado entre ambientes nem enviado ao Git. O arquivo `.env` da API já está ignorado.

Inicie a API:

```powershell
npm run dev
```

Para executar sem o reinício automático do Nodemon:

```powershell
npm start
```

A API aplica de forma idempotente as colunas necessárias ao iniciar. Confirme o funcionamento em:

```text
http://localhost:3000/health
```

A resposta esperada é:

```json
{ "ok": true }
```

### Popular o banco

Depois de configurar o `.env`, execute:

```powershell
npm run seed
```

O comando cria:

- um usuário usando `SEED_USER_NAME`, `SEED_USER_EMAIL` e `SEED_USER_PASSWORD`;
- quinze produtos iniciais com preço, estoque e estoque mínimo.

O seed é idempotente: usuários são identificados pelo e-mail e produtos pelo nome. Executá-lo novamente não duplica nem sobrescreve os registros existentes. A senha não é mostrada no terminal.

## 3. Configurar o frontend

Em outro terminal:

```powershell
cd Mercearia-ceep
npm install
```

Copie `.env.example` para `.env` caso necessário:

```powershell
Copy-Item .env.example .env
```

Conteúdo esperado:

```env
VITE_API_URL=http://localhost:3000
```

Inicie o frontend:

```powershell
npm run dev
```

Acesse:

```text
http://localhost:5173
```

Na primeira utilização, selecione **Criar cadastro**, informe nome, e-mail e uma senha com no mínimo seis caracteres. Depois, faça login.

## 4. Fluxo recomendado de inicialização

1. Inicie o PostgreSQL.
2. Inicie a API e confirme `/health`.
3. Inicie o frontend.
4. Acesse o frontend e faça login.

## 5. Build de produção do frontend

```powershell
cd Mercearia-ceep
npm run build
```

Os arquivos são gerados em `Mercearia-ceep/dist`.

## 6. Endpoints disponíveis

Rotas públicas:

- `POST /register`
- `POST /login`
- `GET /health`

Rotas autenticadas com `Authorization: Bearer <token>`:

- `GET`, `POST /products`
- `GET`, `PUT`, `DELETE /products/:id`
- `GET`, `POST /clients`
- `GET`, `PUT`, `DELETE /clients/:id`
- `POST /clients/:id/pay`
- `GET`, `POST /sales`
- `GET /sales/:id`
- `POST /sales/:id/pay`

## 7. Problemas comuns

### Falha de autenticação no PostgreSQL

Revise `DB_USER` e `DB_PASS` no `.env` da API e confirme que o serviço PostgreSQL está iniciado.

### Banco inexistente

Crie o banco `mercearia` ou altere `DB_NAME` para um banco existente. As tabelas são criadas na primeira inicialização.

### Erro de CORS

Inclua a URL exata do frontend em `FRONTEND_URL`. Para mais de uma origem, separe os endereços por vírgula e reinicie a API.

### Sessão expirada

O token dura oito horas. Ao receber `401`, o frontend limpa a sessão e retorna para o login.

## 8. Observações

- Vendas em fiado vencem no dia 10 do mês seguinte à compra e podem ser quitadas pela tabela do dashboard.
- O faturamento segue o recebimento: vendas imediatas entram na data da venda e vendas em fiado somente na data da quitação.
- Produtos, clientes e vendas são persistidos somente no PostgreSQL; os mocks e a persistência de domínio no `localStorage` foram removidos.
- O `localStorage` mantém apenas os dados da sessão JWT e do usuário autenticado.
- Não há retry automático para mutações como cadastro, edição, exclusão ou venda.
- Não foram adicionados testes automatizados nesta etapa.
