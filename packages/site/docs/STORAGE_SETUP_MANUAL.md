# Configuração Manual do Supabase Storage

## Guia Passo a Passo (5 minutos)

### Passo 1: Criar o Bucket

1. **Acesse o Dashboard do Supabase:**
   ```
   https://supabase.com/dashboard/project/avlttxzppcywybiaxxzd
   ```

2. **Navegue até Storage:**
   - No menu lateral esquerdo, clique em **"Storage"**

3. **Crie um novo bucket:**
   - Clique no botão **"New bucket"** (canto superior direito)
   - Preencha os campos:
     - **Name**: `blog-images`
     - **Public bucket**: ✅ **MARQUE ESTA OPÇÃO** (muito importante!)
     - **Allowed MIME types**: Deixe vazio (permite todos os tipos de imagem)
     - **File size limit**: 5 MB (ou deixe o padrão)
   - Clique em **"Create bucket"**

### Passo 2: Configurar Políticas de Acesso

1. **Acesse as Políticas do Bucket:**
   - Clique no bucket **"blog-images"** que você acabou de criar
   - Vá na aba **"Policies"**

2. **Criar Política de Leitura Pública (SELECT):**
   - Clique em **"New Policy"**
   - Selecione **"For full customization"**
   - Preencha:
     - **Policy name**: `Public Access - Read`
     - **Allowed operation**: `SELECT` ✅
     - **Target roles**: `public` ✅
     - **USING expression**:
       ```sql
       bucket_id = 'blog-images'
       ```
   - Clique em **"Review"** e depois **"Save policy"**

3. **Criar Política de Upload (INSERT):**
   - Clique em **"New Policy"** novamente
   - Selecione **"For full customization"**
   - Preencha:
     - **Policy name**: `Authenticated users can upload`
     - **Allowed operation**: `INSERT` ✅
     - **Target roles**: `authenticated` ✅
     - **WITH CHECK expression**:
       ```sql
       bucket_id = 'blog-images'
       ```
   - Clique em **"Review"** e depois **"Save policy"**

4. **Criar Política de Remoção (DELETE):**
   - Clique em **"New Policy"** novamente
   - Selecione **"For full customization"**
   - Preencha:
     - **Policy name**: `Authenticated users can delete`
     - **Allowed operation**: `DELETE` ✅
     - **Target roles**: `authenticated` ✅
     - **USING expression**:
       ```sql
       bucket_id = 'blog-images'
       ```
   - Clique em **"Review"** e depois **"Save policy"**

### Passo 3: Verificar Configuração

1. **Verifique o bucket:**
   - Volte para **Storage** no menu lateral
   - Você deve ver o bucket **"blog-images"** com um ícone de "Public"
   - Clique nele e vá em **"Policies"**
   - Você deve ver 3 políticas listadas

### Passo 4: Testar o Upload

1. **Acesse o painel admin:**
   ```
   http://localhost:5174/admin/login
   ```
   - Login: `admin@ousepassar.com`
   - Senha: `123456`

2. **Criar/Editar um artigo:**
   - Vá em **"Artigos"** → **"Novo Artigo"**
   - Role até a seção **"Imagem Destacada"**
   - Clique em **"Clique para fazer upload"**
   - Selecione uma imagem do seu computador
   - Aguarde o upload
   - A imagem deve aparecer como preview
   - Passe o mouse sobre a imagem para ver o botão de remover (X)

3. **Verificar no Storage:**
   - Volte para o Dashboard do Supabase
   - Vá em **Storage** → **blog-images**
   - Você deve ver a pasta **article-images**
   - Dentro dela, a imagem que você fez upload

## Estrutura Esperada

```
Storage
└── blog-images (bucket público)
    └── article-images/
        ├── abc123-1234567890.jpg
        ├── def456-1234567891.png
        └── ...
```

## URLs das Imagens

As imagens terão URLs no formato:
```
https://avlttxzppcywybiaxxzd.supabase.co/storage/v1/object/public/blog-images/article-images/{filename}
```

## Troubleshooting

### ❌ Erro: "Failed to upload"
**Causa**: Bucket não foi criado ou não está marcado como público

**Solução**:
1. Verifique se o bucket existe em Storage
2. Verifique se está marcado como "Public"
3. Verifique se as políticas estão criadas

### ❌ Erro: "Not authorized"
**Causa**: Políticas de acesso não estão configuradas

**Solução**:
1. Vá em Storage → blog-images → Policies
2. Crie as 3 políticas descritas acima
3. Certifique-se de estar logado no painel admin

### ❌ Imagem não carrega
**Causa**: Política de SELECT não está configurada para "public"

**Solução**:
1. Verifique a política de SELECT
2. Target role deve ser "public"
3. USING expression deve ser `bucket_id = 'blog-images'`

### ❌ Erro: "Row Level Security"
**Causa**: Políticas não foram criadas

**Solução**:
Crie todas as 3 políticas descritas no Passo 2

## Alternativa: SQL Editor

Se preferir, você pode executar este SQL no **SQL Editor**:

```sql
-- 1. Permitir leitura pública
CREATE POLICY "Public Access - Read blog images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'blog-images' );

-- 2. Permitir upload para autenticados
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'blog-images' );

-- 3. Permitir remoção para autenticados
CREATE POLICY "Authenticated users can delete blog images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'blog-images' );
```

**Nota**: O bucket ainda precisa ser criado manualmente via interface!

## Conclusão

Após seguir estes passos, o sistema de upload de imagens estará totalmente funcional! ✅
