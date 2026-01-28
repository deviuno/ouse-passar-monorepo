# Arquitetura de Scraping em Escala - TecConcursos

## Desafios do Site

- **Cloudflare/WAF** - Bloqueia requests automatizados
- **Conteúdo requer login** - Questões são pagas/protegidas
- **JavaScript rendering** - Conteúdo carregado dinamicamente
- **Rate limiting** - Muitas requisições = bloqueio

---

## Opção 1: Bright Data Web Unlocker (Mais Poderoso)

O Bright Data tem um produto específico chamado **Web Unlocker** que:
- Bypass automático de Cloudflare, CAPTCHAs, fingerprinting
- Rotação automática de IPs residenciais
- Retry automático com diferentes estratégias
- Taxa de sucesso de ~99% em sites protegidos

```typescript
// Exemplo de uso
const response = await fetch('https://api.brightdata.com/request', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer API_KEY' },
  body: JSON.stringify({
    url: 'https://www.tecconcursos.com.br/questoes/123',
    zone: 'web_unlocker',
    country: 'br',
    render_js: true
  })
});
```

**Custo**: ~$3-5 por 1000 requisições com sucesso

---

## Opção 2: Playwright + Proxies Residenciais em Paralelo

Arquitetura com múltiplas instâncias rodando em paralelo:

```
┌─────────────────────────────────────────────────┐
│              Orquestrador (Queue)               │
│         (Bull/BullMQ com Redis)                 │
└─────────────────┬───────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
┌────────┐  ┌────────┐   ┌────────┐
│Worker 1│  │Worker 2│   │Worker N│
│Playwright│ │Playwright│  │Playwright│
└────┬───┘  └────┬───┘   └────┬───┘
     │           │            │
     ▼           ▼            ▼
┌─────────────────────────────────────┐
│   Pool de Proxies Residenciais BR   │
│   (Bright Data / Oxylabs / IPRoyal) │
└─────────────────────────────────────┘
```

---

## Opção 3: Scraping como Serviço Gerenciado

| Serviço | Bypass Cloudflare | Preço/1K req | Vantagem |
|---------|-------------------|--------------|----------|
| **Scrapfly** | ✅ Sim | ~$2.50 | Anti-bot avançado |
| **ZenRows** | ✅ Sim | ~$2.75 | Fácil de usar |
| **ScrapingBee** | ✅ Sim | ~$3.00 | JS rendering |
| **Apify** | ✅ Sim | Pay as you go | Actors prontos |

---

## Recomendação: Arquitetura Híbrida

```
1. Bright Data Web Unlocker (para bypass)
   +
2. Playwright rodando em VPS (para parsing)
   +
3. Sistema de filas (para escala)
   +
4. Banco de dados para deduplicação
```

---

## Estimativa de Coleta

Com essa arquitetura:

| Métrica | Valor |
|---------|-------|
| Velocidade sustentável | 50-100 questões/minuto |
| Coleta diária | 5.000-10.000 questões/dia |
| Custo estimado | ~$50-100/dia em proxies/API |

---

## Componentes do Projeto

1. **Script de scraping** - Playwright + Bright Data
2. **Sistema de filas** - Bull/BullMQ com Redis
3. **Parser das questões** - Extração estruturada dos dados
4. **Integração** - Salvar no banco do Ouse Passar
