# Integração HTTP e autenticação

O frontend utiliza uma única instância Axios em `src/services/http/client.js`.

Ela é responsável por:

- usar `VITE_API_URL` como URL base;
- limitar cada requisição a dez segundos;
- adicionar o JWT no header `Authorization`;
- limpar a sessão e avisar a aplicação quando a API responder `401`.

As views não conhecem URLs e não executam requisições diretamente. As operações estão divididas em:

- `services/auth.service.js`;
- `services/products.service.js`;
- `services/clients.service.js`;
- `services/sales.service.js`.

Os services também convertem o contrato em inglês da API para os nomes usados pela interface. As stores Pinia mantêm somente o estado de seus respectivos domínios. O composable `useMercearia` coordena os dados necessários às páginas que dependem de mais de uma store.

## Login

1. `POST /login` recebe `{ email, password }`.
2. A API retorna `{ token, user }`.
3. O frontend armazena a sessão.
4. O router libera as rotas protegidas.
5. Uma resposta `401` posterior limpa todos os estados de domínio e retorna ao login.

## Cadastro

`POST /register` recebe `{ name, email, password }`. A senha deve ter no mínimo seis caracteres.

## Erros

`src/services/http/errors.js` transforma falhas de rede, timeout e respostas `401`, `403`, `404`, `409` e `5xx` em mensagens adequadas à interface. Cancelamentos de requisição não são apresentados como erro ao usuário.
