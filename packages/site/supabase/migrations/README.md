# Migrations para Integração de Questões

Este diretório contém os scripts SQL necessários para configurar o banco de dados para a integração com o sistema de questões via n8n.

## Como executar

Execute os scripts SQL na ordem abaixo no **Supabase SQL Editor** do projeto `ousepassar` (avlttxzppcywybiaxxzd):

1. **001_create_courses_table.sql** - Cria a tabela `courses` para simulados/preparatórios
2. **002_create_editais_table.sql** - Cria a tabela `editais` para armazenar os PDFs e análises da IA
3. **003_create_editais_storage.sql** - Cria o bucket de storage para os arquivos PDF

## Acesso ao Supabase

- **URL do Dashboard:** https://supabase.com/dashboard/project/avlttxzppcywybiaxxzd
- **SQL Editor:** https://supabase.com/dashboard/project/avlttxzppcywybiaxxzd/sql/new

## Verificação

Após executar as migrations, verifique se:

1. A tabela `courses` foi criada com as colunas `question_filters` e `questions_count`
2. A tabela `editais` foi criada com referência para `courses`
3. O bucket `editais` foi criado no Storage
4. As políticas de RLS estão configuradas corretamente

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
