# Database Migrations

Este diretório contém os scripts SQL necessários para configurar o banco de dados.

## Como executar

Execute os scripts SQL na ordem abaixo no **Supabase SQL Editor** do projeto `ousepassar` (avlttxzppcywybiaxxzd):

### Migrations Executadas (Base do Sistema)
1. **001_create_courses_table.sql** - Cria a tabela `courses` para simulados/preparatórios
2. **002_create_editais_table.sql** - Cria a tabela `editais` para armazenar os PDFs e análises da IA
3. **003_create_editais_storage.sql** - Cria o bucket de storage para os arquivos PDF

### ⚠️ Migrations Pendentes (Executar AGORA)
4. **023_create_legal_texts_table.sql** - Cria tabela para Termos de Uso e Política de Privacidade
5. **024_add_show_answers_to_user_profiles.sql** - Adiciona campo show_answers para visualização de respostas

## Acesso ao Supabase

- **URL do Dashboard:** https://supabase.com/dashboard/project/avlttxzppcywybiaxxzd
- **SQL Editor:** https://supabase.com/dashboard/project/avlttxzppcywybiaxxzd/sql/new

## Detalhes das Novas Migrations

### 023_create_legal_texts_table.sql
**O que faz:**
- Cria a tabela `legal_texts` para armazenar textos legais (Termos de Uso e Política de Privacidade)
- Insere textos padrão em português brasileiro
- Configura RLS: leitura pública, escrita apenas para admins
- Habilita gerenciamento via `/admin/legal-texts`

**Features habilitadas:**
- Página pública de Termos de Uso (`/termos-de-uso`)
- Página pública de Política de Privacidade (`/politica-de-privacidade`)
- Painel admin para editar textos legais
- Links automáticos na tela de cadastro

### 024_add_show_answers_to_user_profiles.sql
**O que faz:**
- Adiciona campo `show_answers` (boolean) na tabela `user_profiles`
- Valor padrão: `false`
- Quando `true`: usuário vê respostas corretas marcadas com estrela durante prática/simulados

**Features habilitadas:**
- Toggle "Ver Respostas" na página de Detalhes do Usuário (admin)
- Usuários com este recurso ativo veem gabarito antecipadamente
- Funciona igual à visualização do admin

## Verificação

### Para migrations antigas:
1. A tabela `courses` foi criada com as colunas `question_filters` e `questions_count`
2. A tabela `editais` foi criada com referência para `courses`
3. O bucket `editais` foi criado no Storage
4. As políticas de RLS estão configuradas corretamente

### Para novas migrations (023 e 024):

**Verificar legal_texts:**
```sql
SELECT id, title, LEFT(content, 50) as preview FROM legal_texts;
```
Deve retornar 2 registros: `terms_of_service` e `privacy_policy`

**Verificar show_answers:**
```sql
SELECT id, name, show_answers FROM user_profiles LIMIT 5;
```
Deve mostrar a coluna `show_answers` (todos `false` por padrão)

## Rollback

Para reverter as migrations (em caso de erro):

```sql
-- Remove policies
DROP POLICY IF EXISTS "Anyone can read active courses" ON courses;
DROP POLICY IF EXISTS "Authenticated users can manage courses" ON courses;
DROP POLICY IF EXISTS "Authenticated users can manage editais" ON editais;
DROP POLICY IF EXISTS "Allow updates from n8n" ON editais;

-- Remove storage policies
DROP POLICY IF EXISTS "Authenticated users can upload editais" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read editais" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete editais" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access to editais" ON storage.objects;

-- Remove bucket
DELETE FROM storage.buckets WHERE id = 'editais';

-- Remove tables
DROP TABLE IF EXISTS editais;
DROP TABLE IF EXISTS courses;
```
