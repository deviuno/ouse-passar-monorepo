# Guia Rápido: Melhorar Diagramação do Blog

## Passo 1: Importar o CSS customizado

No arquivo `components/Blog.tsx`, adicione esta linha após os outros imports (linha ~9):

```typescript
import '../styles/blog-content.css';
```

## Passo 2: Substituir a classe do container de conteúdo

No arquivo `components/Blog.tsx`, encontre a linha ~296 que tem:

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

## Pronto!

Isso vai aplicar todos os estilos customizados que criamos no arquivo `styles/blog-content.css` para formatar corretamente:
- ✅ Hierarquia de títulos (H1-H6)
- ✅ Imagens com bordas e sombras
- ✅ Listas, blockquotes, tabelas
- ✅ Código inline e blocos
- ✅ Links e ênfases

O CSS já está criado e pronto em `styles/blog-content.css`.
