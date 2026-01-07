# Supabase - Ouse Passar

## Configuração

### Projeto Supabase
- **Project ID:** `avlttxzppcywybiaxxzd`
- **URL:** https://avlttxzppcywybiaxxzd.supabase.co
- **Plano:** Pro

## Ambientes

### Produção
- Branch: `main`
- Database: Produção (avlttxzppcywybiaxxzd)
- URL: https://avlttxzppcywybiaxxzd.supabase.co

### Preview (Desenvolvimento)
- Criado automaticamente por PR
- Database: Isolado por branch
- Seed: `seed.sql` aplicado automaticamente

## Setup do Branching

### 1. Habilitar GitHub Integration

1. Acesse: https://supabase.com/dashboard/project/avlttxzppcywybiaxxzd/settings/integrations
2. Clique em **"Authorize GitHub"**
3. Autorize o Supabase a acessar o repositório
4. Selecione o repositório: `deviuno/ouse-passar-monorepo`
5. Configure o path do Supabase: `supabase` (raiz)
6. Ative **"Automatic branching"**

### 2. Habilitar Branching

1. Acesse: https://supabase.com/dashboard/project/avlttxzppcywybiaxxzd/branches
2. Clique em **"Enable branching"**
3. Selecione a branch de produção: `main`

### 3. Integração com Vercel (Opcional)

1. Acesse: https://vercel.com/integrations/supabase
2. Instale a integração
3. Conecte ao projeto Ouse Passar

## Workflow de Desenvolvimento

### Criar nova feature

```bash
# 1. Criar branch no Git
git checkout -b feature/nova-funcionalidade

# 2. Fazer mudanças no schema (se necessário)
# Criar arquivo em: supabase/migrations/YYYYMMDDHHMMSS_descricao.sql

# 3. Commit e push
git add .
git commit -m "feat: nova funcionalidade"
git push origin feature/nova-funcionalidade

# 4. Abrir PR
# → Supabase cria automaticamente um preview branch
# → Migrations são aplicadas
# → seed.sql é executado
```

### Testar no Preview Branch

Quando um PR é aberto:
1. Supabase cria um database de preview
2. Todas as migrations são aplicadas
3. `seed.sql` popula dados de teste
4. Você recebe credenciais únicas para o preview

### Merge para Produção

Quando o PR é mergeado:
1. Migrations são aplicadas em produção
2. Preview branch é deletado
3. Dados de preview são perdidos (esperado)

## Criando Migrations

### Via CLI (recomendado)

```bash
# Gerar diff do schema atual
supabase db diff -f nome_da_migration

# Aplicar localmente para teste
supabase db reset
```

### Manual

Criar arquivo em `supabase/migrations/`:

```sql
-- supabase/migrations/20250106120000_criar_tabela_exemplo.sql

CREATE TABLE exemplo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE exemplo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exemplo_select" ON exemplo
  FOR SELECT USING (true);
```

## Estrutura de Arquivos

```
supabase/
├── config.toml          # Configuração do projeto
├── seed.sql             # Dados de seed para preview branches
├── migrations/          # Arquivos de migration
│   └── YYYYMMDDHHMMSS_nome.sql
└── functions/           # Edge Functions (se houver)
```

## Comandos Úteis

```bash
# Status do projeto
supabase status

# Aplicar migrations localmente
supabase db reset

# Gerar tipos TypeScript
supabase gen types typescript --project-id avlttxzppcywybiaxxzd > types/database.types.ts

# Ver logs
supabase logs
```

## Troubleshooting

### Migration falhou no preview
1. Verifique o log no PR (comentário do Supabase)
2. Corrija o SQL
3. Push novamente

### Preview branch não criou
1. Verifique se GitHub Integration está ativa
2. Verifique se há arquivos alterados em `supabase/`
3. Feche e reabra o PR

### Credenciais do preview
Encontre no comentário do Supabase no PR ou:
1. Dashboard → Branches
2. Selecione o branch
3. Settings → API

---

*Última atualização: 2025-01-06*
