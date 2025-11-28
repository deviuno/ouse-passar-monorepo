# Configuração do Supabase Storage

## Criação do Bucket

Para que o upload de imagens funcione corretamente, você precisa criar um bucket no Supabase Storage.

### Passo 1: Acesse o Dashboard do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: `avlttxzppcywybiaxxzd`
3. No menu lateral, clique em **Storage**

### Passo 2: Criar o Bucket

1. Clique no botão **"New bucket"**
2. Preencha os dados:
   - **Name**: `blog-images`
   - **Public bucket**: ✅ Marque esta opção (para que as imagens sejam acessíveis publicamente)
3. Clique em **"Create bucket"**

### Passo 3: Configurar Políticas (Policies)

Após criar o bucket, você precisa configurar as políticas de acesso:

#### 3.1. Política de Leitura Pública (SELECT)

```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'blog-images' );
```

**Ou via interface:**
1. Clique no bucket `blog-images`
2. Vá na aba **Policies**
3. Clique em **"New Policy"**
4. Selecione **"For full customization"**
5. Configure:
   - **Policy name**: `Public Access`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `public`
   - **USING expression**: `bucket_id = 'blog-images'`

#### 3.2. Política de Upload (INSERT)

```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'blog-images' );
```

**Ou via interface:**
1. Clique em **"New Policy"** novamente
2. Configure:
   - **Policy name**: `Authenticated users can upload`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **WITH CHECK expression**: `bucket_id = 'blog-images'`

#### 3.3. Política de Remoção (DELETE)

```sql
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'blog-images' );
```

**Ou via interface:**
1. Clique em **"New Policy"** novamente
2. Configure:
   - **Policy name**: `Authenticated users can delete`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **USING expression**: `bucket_id = 'blog-images'`

### Passo 4: Configurar Limite de Tamanho (Opcional)

Por padrão, o Supabase permite uploads de até 50MB. Para o blog, limitamos a 5MB no frontend, mas você pode ajustar no código se necessário.

## Estrutura de Pastas

As imagens serão organizadas automaticamente em:
```
blog-images/
└── article-images/
    ├── abc123-1234567890.jpg
    ├── def456-1234567891.png
    └── ...
```

## Tipos de Arquivo Suportados

- JPG/JPEG
- PNG
- WEBP
- GIF

## Validações no Frontend

- **Tamanho máximo**: 5MB
- **Tipo de arquivo**: Apenas imagens
- **Nome único**: Gerado automaticamente com timestamp

## Como Funciona

1. **Upload**: O usuário seleciona uma imagem no editor de artigos
2. **Validação**: Verifica tipo e tamanho do arquivo
3. **Upload**: Envia para o Supabase Storage no bucket `blog-images`
4. **URL**: Obtém a URL pública da imagem
5. **Salvar**: A URL é salva no campo `imagem_capa` da tabela `artigos`
6. **Remoção**: Ao clicar no X, remove do Storage e limpa o campo

## Testando

1. Acesse: `/admin/articles/new`
2. Preencha os campos do artigo
3. Clique em **"Clique para fazer upload"** na seção de Imagem Destacada
4. Selecione uma imagem do seu computador
5. Aguarde o upload
6. A imagem deve aparecer como preview
7. Passe o mouse sobre a imagem para ver o botão de remover (X)

## Troubleshooting

### Erro: "Failed to upload"
- Verifique se o bucket `blog-images` foi criado
- Verifique se o bucket está marcado como **Public**
- Verifique as políticas de acesso

### Erro: "Not authorized"
- Verifique se as políticas estão configuradas corretamente
- Certifique-se de estar autenticado no painel admin

### Imagem não aparece
- Verifique se a política de SELECT está configurada para `public`
- Verifique se a URL está correta no console do navegador

## URLs das Imagens

As URLs das imagens seguem o padrão:
```
https://avlttxzppcywybiaxxzd.supabase.co/storage/v1/object/public/blog-images/article-images/{filename}
```

## Alternativa: URL Manual

Se você não quiser usar o upload, ainda pode inserir URLs manualmente:
1. No campo de upload, clique em **"ou"**
2. Digite a URL da imagem no campo de texto
3. A imagem será carregada via URL externa
