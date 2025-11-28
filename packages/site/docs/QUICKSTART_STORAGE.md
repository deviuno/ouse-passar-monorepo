# 🚀 Configuração Rápida do Storage (2 minutos)

## ❌ Erro Atual
```
StorageApiError: new row violates row-level security policy
```

**Causa**: O bucket existe, mas as políticas de acesso não estão configuradas.

## ✅ Solução Rápida

### 1️⃣ Acesse o Supabase Dashboard

Abra este link em uma nova aba:
```
https://supabase.com/dashboard/project/avlttxzppcywybiaxxzd/storage/buckets
```

### 2️⃣ Configure as Políticas

1. Clique no bucket **`blog-images`**
2. Clique na aba **"Policies"** (ou "Políticas")
3. Clique em **"New Policy"** → **"Get started quickly"**
4. Selecione o template: **"Enable read access for all users"**
   - Isso criará a política de leitura pública automaticamente
5. Clique em **"Review"** → **"Save policy"**

### 3️⃣ Adicionar Política de Upload

1. Clique em **"New Policy"** novamente
2. Selecione **"For full customization"**
3. Preencha:
   ```
   Policy name: Allow authenticated uploads
   Allowed operation: INSERT ✅
   Target roles: authenticated ✅
   WITH CHECK: (true)
   ```
4. Clique em **"Review"** → **"Save policy"**

### 4️⃣ Adicionar Política de Delete

1. Clique em **"New Policy"** novamente
2. Selecione **"For full customization"**
3. Preencha:
   ```
   Policy name: Allow authenticated deletes
   Allowed operation: DELETE ✅
   Target roles: authenticated ✅
   USING: (true)
   ```
4. Clique em **"Review"** → **"Save policy"**

## 🎯 Alternativa: SQL Direto

Se preferir usar SQL, copie e cole isto no **SQL Editor**:

```sql
-- Política 1: Leitura pública
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-images');

-- Política 2: Upload para autenticados
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');

-- Política 3: Delete para autenticados
CREATE POLICY "Authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'blog-images');
```

**Para executar:**
1. Vá em **SQL Editor** no menu lateral
2. Cole o SQL acima
3. Clique em **"Run"** (ou F5)

## ✅ Testar

Após configurar as políticas:

1. Volte para: http://localhost:5174/admin/articles/new
2. Clique em "Clique para fazer upload"
3. Selecione uma imagem
4. Deve funcionar! ✅

## 🔍 Verificar se Funcionou

No Supabase Dashboard:
1. Vá em **Storage** → **blog-images** → **Policies**
2. Você deve ver **3 políticas** listadas
3. Tente fazer upload novamente

---

**Tempo estimado**: 2-3 minutos
**Dificuldade**: Fácil ⭐

Se ainda der erro, me avise qual mensagem aparece!
