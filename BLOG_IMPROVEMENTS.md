# Melhorias na Exibição do Blog

## Arquivo: `components/Blog.tsx`

### Localização: Linhas 296-303

Substitua o bloco de classes do `prose` por este:

```typescript
<div className="prose prose-lg prose-invert max-w-none 
  prose-headings:font-display prose-headings:font-black prose-headings:text-white 
  prose-h1:text-4xl prose-h1:mb-6 prose-h1:mt-12 prose-h1:pb-4 prose-h1:border-b prose-h1:border-brand-yellow/30
  prose-h2:text-3xl prose-h2:mb-5 prose-h2:mt-10 prose-h2:text-brand-yellow
  prose-h3:text-2xl prose-h3:mb-4 prose-h3:mt-8 prose-h3:text-white
  prose-h4:text-xl prose-h4:mb-3 prose-h4:mt-6 prose-h4:text-gray-200
  prose-h5:text-lg prose-h5:mb-3 prose-h5:mt-6 prose-h5:text-gray-300
  prose-h6:text-base prose-h6:mb-2 prose-h6:mt-4 prose-h6:text-gray-400 prose-h6:uppercase prose-h6:tracking-wider
  prose-p:text-gray-300 prose-p:font-light prose-p:leading-8 prose-p:mb-6
  prose-a:text-brand-yellow prose-a:no-underline prose-a:font-semibold hover:prose-a:underline hover:prose-a:text-white
  prose-strong:text-white prose-strong:font-bold
  prose-em:text-gray-200 prose-em:italic
  prose-code:text-brand-yellow prose-code:bg-brand-darker prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
  prose-pre:bg-brand-darker prose-pre:border prose-pre:border-white/10 prose-pre:rounded-sm prose-pre:p-4 prose-pre:overflow-x-auto
  prose-blockquote:border-l-4 prose-blockquote:border-brand-yellow prose-blockquote:bg-brand-darker/50 prose-blockquote:pl-6 prose-blockquote:py-4 prose-blockquote:italic prose-blockquote:text-gray-300 prose-blockquote:my-8
  prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-6 prose-ul:marker:text-brand-yellow
  prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-6 prose-ol:marker:text-brand-yellow prose-ol:marker:font-bold
  prose-li:text-gray-300 prose-li:mb-2 prose-li:leading-7
  prose-img:rounded-sm prose-img:border prose-img:border-white/10 prose-img:my-8 prose-img:w-full prose-img:h-auto prose-img:object-cover prose-img:shadow-[0_0_30px_rgba(255,184,0,0.1)]
  prose-figure:my-8
  prose-figcaption:text-center prose-figcaption:text-gray-500 prose-figcaption:text-sm prose-figcaption:mt-3 prose-figcaption:italic
  prose-table:border-collapse prose-table:w-full prose-table:my-8
  prose-thead:border-b-2 prose-thead:border-brand-yellow
  prose-th:text-left prose-th:p-3 prose-th:text-white prose-th:font-bold prose-th:uppercase prose-th:text-sm prose-th:tracking-wider
  prose-td:p-3 prose-td:border-b prose-td:border-white/10 prose-td:text-gray-300
  prose-tr:hover:bg-white/5 prose-tr:transition-colors
  prose-hr:border-white/10 prose-hr:my-10
">
```

## O que isso melhora:

✅ **Hierarquia de Títulos (H1-H6)**: Cada nível tem tamanho e espaçamento próprio
- H1: 4xl, borda inferior amarela
- H2: 3xl, cor amarela
- H3-H6: Tamanhos decrescentes com cores apropriadas

✅ **Imagens**: 
- Bordas arredondadas
- Sombra com efeito glow amarelo
- Responsivas (w-full, h-auto)

✅ **Código**: Fundo escuro, cor amarela, sem aspas antes/depois

✅ **Blockquotes**: Borda esquerda amarela, fundo semi-transparente

✅ **Listas**: Marcadores amarelos

✅ **Tabelas**: Cabeçalho com borda amarela, hover nos rows

✅ **Links**: Amarelo, negrito, hover com sublinhado
