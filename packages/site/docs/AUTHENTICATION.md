# Sistema de Autenticação - Ouse Passar Admin

## Visão Geral

O painel administrativo do Ouse Passar está protegido por um sistema de autenticação baseado em React Context API e localStorage para persistência de sessão.

## Credenciais de Acesso

### Usuário Administrador
- **Email**: `admin@ousepassar.com`
- **Senha**: `123456`
- **Role**: `admin`

## Estrutura do Sistema

### 1. AuthContext (`lib/AuthContext.tsx`)
Contexto React que gerencia o estado de autenticação da aplicação.

**Funcionalidades:**
- `login(email, password)`: Autentica o usuário
- `logout()`: Remove a sessão do usuário
- `isAuthenticated`: Boolean indicando se há usuário logado
- `isLoading`: Boolean para estado de carregamento
- `user`: Objeto com dados do usuário logado

### 2. Login Page (`pages/admin/Login.tsx`)
Página de login estilizada com o tema do Ouse Passar.

**Características:**
- Validação de formulário
- Feedback de erros
- Loading state durante autenticação
- Link para retornar ao site principal

### 3. ProtectedRoute (`components/ProtectedRoute.tsx`)
Componente que protege rotas administrativas.

**Comportamento:**
- Verifica se o usuário está autenticado
- Redireciona para `/admin/login` se não autenticado
- Mostra loading durante verificação inicial
- Permite acesso se autenticado

### 4. AdminLayout (`components/admin/AdminLayout.tsx`)
Layout principal do painel administrativo.

**Melhorias implementadas:**
- Exibição do nome e email do usuário logado
- Botão de logout funcional
- Logo do Ouse Passar
- Navegação melhorada

## Fluxo de Autenticação

```
1. Usuário acessa /admin
   ↓
2. ProtectedRoute verifica autenticação
   ↓
3a. Se NÃO autenticado → Redireciona para /admin/login
3b. Se autenticado → Permite acesso ao AdminLayout
   ↓
4. Usuário faz login em /admin/login
   ↓
5. AuthContext valida credenciais
   ↓
6a. Credenciais válidas → Salva no localStorage → Redireciona para /admin
6b. Credenciais inválidas → Mostra erro
```

## Persistência de Sessão

A sessão é mantida usando `localStorage` com a chave `ouse_admin_user`.

**Estrutura armazenada:**
```json
{
  "id": "1",
  "email": "admin@ousepassar.com",
  "name": "Administrador",
  "role": "admin"
}
```

## Rotas

### Públicas
- `/` - Homepage
- `/blog` - Lista de artigos
- `/blog/:slug` - Artigo individual
- `/mentoria` - Página de mentorias
- `/admin/login` - Login do admin

### Protegidas (requerem autenticação)
- `/admin` - Dashboard
- `/admin/articles` - Gerenciamento de artigos
- `/admin/categories` - Gerenciamento de categorias
- `/admin/authors` - Gerenciamento de autores
- `/admin/settings` - Configurações

## Segurança

### Implementação Atual (Desenvolvimento)
- Autenticação hardcoded no frontend
- Senha em texto plano (apenas para desenvolvimento)
- Sessão armazenada no localStorage

### Recomendações para Produção

1. **Backend API**
   - Implementar endpoint `/api/auth/login` no backend
   - Usar JWT (JSON Web Tokens) para autenticação
   - Hash de senhas com bcrypt

2. **Segurança**
   - Implementar refresh tokens
   - Adicionar CSRF protection
   - Usar HTTPS em produção
   - Implementar rate limiting no login

3. **Sessão**
   - Considerar usar httpOnly cookies em vez de localStorage
   - Implementar expiração de sessão
   - Adicionar logout automático após inatividade

4. **Multi-usuário**
   - Criar tabela de usuários no banco de dados
   - Implementar sistema de roles (admin, editor, etc)
   - Adicionar recuperação de senha

## Exemplo de Migração para Backend

```typescript
// Exemplo de como seria com backend real
const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      const adminUser: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role
      };

      setUser(adminUser);
      localStorage.setItem('ouse_admin_token', data.token);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
};
```

## Testando a Autenticação

### Cenário 1: Login com sucesso
1. Acesse: `http://localhost:5173/admin`
2. Será redirecionado para `/admin/login`
3. Digite: `admin@ousepassar.com` / `123456`
4. Clique em "Entrar no Painel"
5. Será redirecionado para o dashboard

### Cenário 2: Login com credenciais inválidas
1. Acesse: `http://localhost:5173/admin/login`
2. Digite credenciais incorretas
3. Verá mensagem de erro em vermelho

### Cenário 3: Logout
1. No painel admin, clique no botão "Sair" no rodapé da sidebar
2. Será redirecionado para `/admin/login`
3. Sessão será removida do localStorage

### Cenário 4: Persistência de sessão
1. Faça login
2. Recarregue a página (F5)
3. Deve permanecer logado
4. Feche o navegador e reabra
5. Deve permanecer logado (sessão persiste)

## Manutenção

### Adicionar novo usuário (futuramente)
Quando houver backend, adicionar usuários no banco de dados:

```sql
INSERT INTO users (email, password_hash, name, role)
VALUES ('novo@ousepassar.com', '$2b$10$...', 'Nome do Usuário', 'admin');
```

### Trocar senha do admin
Atualmente, edite o arquivo `lib/AuthContext.tsx`:

```typescript
if (email === 'admin@ousepassar.com' && password === 'NOVA_SENHA') {
  // ...
}
```

### Debug de autenticação
Use o console do navegador:

```javascript
// Ver usuário logado
JSON.parse(localStorage.getItem('ouse_admin_user'))

// Forçar logout
localStorage.removeItem('ouse_admin_user')
window.location.reload()
```

## Favicon

O favicon do site foi atualizado para usar a imagem oficial:
- **URL**: `https://ousepassar.com/wp-content/uploads/2025/02/favicon-100x100.webp`
- **Localização**: `index.html` (linhas 8-9)
- **Formatos**: favicon padrão + Apple touch icon
