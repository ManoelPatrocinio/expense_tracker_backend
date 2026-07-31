# Expense Tracker Backend

API Express + TypeScript + MongoDB para autenticação e gerenciamento isolado de eventos financeiros por usuário.

## Variáveis de ambiente

Crie `.env` com base em `.env_exemple`:

```env
PORT=3333
MONGO_URL="mongodb://localhost:27017/expense_tracker"
AUTH_JWT_SECRET="use-uma-chave-secreta-forte"
AUTH_DEFAULT_NAME="Administrador"
AUTH_DEFAULT_EMAIL="admin@expense.com"
AUTH_DEFAULT_PASSWORD="troque-esta-senha"
```

Na inicialização, a conta configurada em `AUTH_DEFAULT_EMAIL` é criada ou promovida para `admin`.

## Perfis e acesso aos registros

- `admin`: visualiza e administra todos os eventos, inclusive registros antigos sem proprietário.
- `user`: visualiza, totaliza e remove somente os próprios eventos.

Novos eventos recebem automaticamente `ownerId` a partir do JWT. O backend ignora qualquer tentativa de escolher o proprietário pelo payload.

Os registros existentes antes desta versão não possuem `ownerId` e, portanto, são retornados apenas para o administrador.

## Autenticação

### Cadastro

```http
POST /auth/register
```

```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "123456",
  "confirmPassword": "123456"
}
```

Contas criadas por esta rota sempre recebem o perfil `user`.

### Login

```http
POST /auth/login
```

```json
{
  "email": "admin@expense.com",
  "password": "123456"
}
```

Resposta:

```json
{
  "token": "jwt_gerado_pelo_backend",
  "user": {
    "id": "id_do_usuario",
    "name": "Administrador",
    "email": "admin@expense.com",
    "role": "admin"
  },
  "message": "Login realizado com sucesso."
}
```

As rotas financeiras exigem:

```http
Authorization: Bearer token_recebido_no_login
```

## Rotas

- `GET /`: verificação da API.
- `POST /auth/register`: cadastro público de usuário comum.
- `POST /auth/login`: autenticação.
- `POST /add_event`: adiciona evento para o usuário autenticado.
- `GET /list_by_date/:date`: lista eventos permitidos no mês `AAAA-MM`.
- `DELETE /remove_by_id/:eventId`: remove um evento permitido.
- `GET /balance_by_category/:date`: total por categoria respeitando o proprietário.
- `GET /balance_by_year/:year`: total anual respeitando o proprietário.

## Scripts

```bash
npm install
npm run dev
npm run build
npm test
npm start
```

Criar conta por linha de comando:

```bash
npm run create:user -- --name="João Silva" --email="joao@email.com" --password="123456" --role="user"
```

Criar outro administrador:

```bash
npm run create:user -- --name="Administrador 2" --email="admin2@email.com" --password="senha-forte" --role="admin"
```

Perfis aceitos: `admin` e `user`.
