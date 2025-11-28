## INSTRUÇÕES FINAIS - APLICAR MANUALMENTE

O CSS já está pronto em `styles/blog-content.css`.

Você precisa fazer APENAS 2 alterações no arquivo `components/Blog.tsx`:

### 1. Adicionar o import (linha ~9)
Adicione esta linha após os outros imports:
```typescript
import '../styles/blog-content.css';
```

### 2. Substituir a div do prose (linha ~296)
Encontre este bloco:
```typescript
<div className="prose prose-lg prose-invert max-w-none 
  prose-headings:font-display prose-headings:font-black prose-headings:text-white prose-headings:uppercase
  prose-p:text-gray-300 prose-p:font-light prose-p:leading-8
  prose-a:text-brand-yellow prose-a:no-underline hover:prose-a:underline
  prose-strong:text-white prose-strong:font-bold
  prose-ul:marker:text-brand-yellow
  prose-li:text-gray-300
">
```

E substitua por:
```typescript
<div className="blog-content">
```

## PRONTO!

Depois disso, faça commit e push:
```bash
git add .
git commit -m "Apply blog typography improvements"
git push origin main
```

Os artigos vão ficar com:
✅ H1 grande (4xl) com borda amarela embaixo
✅ H2 médio (3xl) em amarelo
✅ H3, H4, H5, H6 com tamanhos decrescentes
✅ Imagens com bordas e sombra amarela
✅ Listas com marcadores amarelos
✅ Blockquotes com borda esquerda amarela
✅ Código com fundo escuro e texto amarelo
