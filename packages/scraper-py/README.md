# 🚀 TEC Concursos Scraper - Multi-Contas Paralelo

Web scraper automatizado para extração de questões do site TEC Concursos, com suporte a múltiplas contas em paralelo, comportamento humano simulado e monitoramento em tempo real.

## 📋 Índice

- [Características](#-características)
- [Requisitos](#-requisitos)
- [Instalação](#-instalação)
- [Configuração](#️-configuração)
- [Como Usar](#-como-usar)
- [Sistema de Monitoramento](#-sistema-de-monitoramento)
- [Estrutura do Código](#-estrutura-do-código)
- [Logs](#-logs)
- [Troubleshooting](#-troubleshooting)

## ✨ Características

### 🎯 Funcionalidades Principais

- **Multi-Threading**: Execução paralela de múltiplas contas simultaneamente
- **Comportamento Humano**: Simulação de delays, movimentos de mouse e padrões de leitura
- **Detecção de Duplicatas**: Carrega IDs já extraídos via webhook para evitar reprocessamento
- **Webhook Integration**: Envio automático de dados para endpoints N8N
- **Monitoramento em Tempo Real**: Dashboard com estatísticas consolidadas
- **Resistente a Falhas**: Sistema robusto com retries e tratamento de erros
- **Extração Completa**: Questões, alternativas, gabaritos, comentários, imagens e metadados

### 🤖 Simulação de Comportamento Humano

- **Delays Randomizados**: Entre cliques, scroll e navegação
- **User-Agent Rotativo**: Diferentes navegadores e versões
- **Movimento de Mouse**: Simulação natural de movimentação
- **Padrões de Skip**: 3 tipos diferentes ao pular questões duplicadas
  - Quick Skip (60%): Reconhece rapidamente
  - Scroll Then Skip (25%): Dá uma olhada antes
  - Hesitate Skip (15%): Hesita antes de pular

### 📊 Sistema de Monitoramento

- **Estatísticas Globais**: Consolidadas de todas as contas
- **Taxa de Extração**: Questões por minuto
- **Status por Conta**: Indicador de atividade (ativo/inativo)
- **Atualizações Automáticas**: A cada 20 questões novas ou 50 duplicadas
- **Dashboard Final**: Resumo completo ao término

## 📦 Requisitos

### Software Necessário

- **Python**: 3.8 ou superior
- **Google Chrome**: Versão atualizada
- **ChromeDriver**: Compatível com versão do Chrome (gerenciado automaticamente)

### Dependências Python

```bash
selenium>=4.0.0
webdriver-manager>=3.8.0
requests>=2.28.0
```

## 🔧 Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/josejusto192/SCRAPER.git
cd SCRAPER
```

### 2. Instale as Dependências

```bash
pip install -r requirements.txt
```

Ou instale manualmente:

```bash
pip install selenium webdriver-manager requests
```

### 3. Verifique o Chrome

Certifique-se de que o Google Chrome está instalado:

```bash
google-chrome --version
```

## ⚙️ Configuração

### 1. Configure as Contas

Edite o arquivo `tecconcursosv3_FINAL.py` e adicione suas contas:

```python
ACCOUNTS = [
    {
        "name": "conta1",
        "email": "email1@example.com",
        "password": "senha123"
    },
    {
        "name": "conta2",
        "email": "email2@example.com",
        "password": "senha456"
    },
    # Adicione mais contas conforme necessário
]
```

### 2. Configure o Webhook

```python
WEBHOOK_URL = "https://n8n.appcodigodavida.com.br/webhook/testescraping"
WEBHOOK_ENABLED = True
WEBHOOK_BATCH_SIZE = 50  # Tamanho do lote (modo batch)
WEBHOOK_REALTIME = True  # True = tempo real | False = lotes
```

### 3. Ajuste Limites (Opcional)

```python
MAX_QUESTIONS_PER_ACCOUNT = 5000  # Limite por conta
WAIT_TIMEOUT = 4  # Timeout para espera de elementos (segundos)
```

## 🚀 Como Usar

### Execução Básica

```bash
python3 tecconcursosv3_FINAL.py
```

### Fluxo de Execução

1. **Inicialização**
   - O script abrirá múltiplas janelas do Chrome (uma por conta)
   - Aguarde todos os navegadores abrirem

2. **Login** (ETAPA 1/2)
   - Em cada janela, resolva o CAPTCHA
   - Clique no botão de LOGIN
   - Aguarde o login ser confirmado em todas as contas
   - Pressione ENTER no console principal

3. **Aplicar Filtros** (ETAPA 2/2)
   - Em cada janela, aplique os filtros desejados:
     - Matéria
     - Assunto
     - Banca
     - Ano
     - etc.
   - Certifique-se de que há questões disponíveis
   - Pressione ENTER no console principal

4. **Extração**
   - A extração iniciará automaticamente
   - Estatísticas serão exibidas periodicamente
   - Aguarde até a conclusão

### Interrupção Segura

Para interromper gracefully:

```bash
Ctrl+C
```

O script enviará os dados pendentes antes de encerrar.

## 📊 Sistema de Monitoramento

### Dashboard em Tempo Real

```
======================================================================
📊 ESTATÍSTICAS GLOBAIS EM TEMPO REAL
======================================================================
⏱️  Tempo decorrido: 15min 32s
🆕 Questões novas: 245
⏭️  Duplicadas puladas: 128
📊 Total processadas: 373
📤 Enviadas ao webhook: 245
⚡ Taxa: 15.8 questões/min
----------------------------------------------------------------------
📋 POR CONTA:
  [conta1] 🟢 Ativo - Novas: 87 | Puladas: 45
  [conta2] 🟢 Ativo - Novas: 92 | Puladas: 51
  [conta3] 🟡 Inativo - Novas: 66 | Puladas: 32
======================================================================
```

### Indicadores

- 🟢 **Ativo**: Processou questão nos últimos 30 segundos
- 🟡 **Inativo**: Sem atividade há mais de 30 segundos

### Frequência de Atualização

- A cada **20 questões novas** (todas as contas)
- A cada **50 questões duplicadas** (todas as contas)
- Ao **finalizar** a extração

## 📁 Estrutura do Código

### Principais Componentes

```
tecconcursosv3_FINAL.py
│
├── CONFIGURAÇÕES
│   ├── Contas (ACCOUNTS)
│   ├── Webhooks (WEBHOOK_*)
│   ├── Comportamento Humano (DELAY_RANGES, SKIP_BEHAVIORS)
│   └── User Agents (USER_AGENTS)
│
├── SINCRONIZAÇÃO (Thread-Safe)
│   ├── ids_lock (Lock para IDs compartilhados)
│   ├── stats_lock (Lock para estatísticas)
│   ├── shared_ids (Set de IDs extraídos)
│   └── global_stats (Dict de estatísticas)
│
├── FUNÇÕES AUXILIARES
│   ├── human_delay() - Delays humanizados
│   ├── simulate_mouse_movement() - Movimento de mouse
│   ├── human_skip_duplicate() - Comportamento ao pular
│   └── detect_extraction_problem() - Detecta problemas
│
├── CORE FUNCTIONS
│   ├── load_shared_ids() - Carrega IDs via webhook
│   ├── extract_question_data() - Extrai dados da questão
│   ├── send_webhook() - Envia dados ao webhook
│   └── update_stats() - Atualiza estatísticas
│
├── THREAD PRINCIPAL
│   └── scrape_account() - Executa extração por conta
│
└── MAIN
    └── main() - Coordena todas as threads
```

### Dados Extraídos

Cada questão inclui:

- **ID**: Identificador único
- **Matéria**: Disciplina
- **Assunto**: Tópico específico
- **Concurso**: Nome do concurso
- **Enunciado**: Texto da questão
- **Alternativas**: Array com letra e texto
- **Gabarito**: Resposta correta
- **Comentário**: Resolução/explicação
- **Detalhes**: Órgão, banca, ano, prova, cargo
- **Imagens**: URLs de imagens (enunciado, alternativas, comentário)
- **Timestamp**: Data/hora da extração

## 📋 Logs

### Localização

Cada conta gera um log individual:

```
scraper_<nome_da_conta>_<timestamp>.log
```

Exemplo:
```
scraper_sebastian-alves_20231222_154530.log
```

### Informações Registradas

- Início e fim da extração
- IDs carregados via webhook
- Cada questão extraída (sucesso/falha)
- Questões duplicadas puladas
- Envios ao webhook
- Erros e exceções
- Estatísticas finais

### Níveis de Log

- **INFO**: Operações normais
- **DEBUG**: Informações detalhadas
- **WARNING**: Avisos (não impedem execução)
- **ERROR**: Erros recuperáveis
- **CRITICAL**: Erros fatais

## 🔧 Troubleshooting

### Problema: ChromeDriver não encontrado

**Solução:**
```bash
pip install --upgrade webdriver-manager
```

O `webdriver-manager` baixará automaticamente o ChromeDriver compatível.

### Problema: Timeout ao carregar IDs via webhook

**Sintomas:**
```
❌ FALHA ao carregar IDs após 3 tentativas!
```

**Soluções:**
1. Verifique se o webhook está acessível:
   ```bash
   curl https://n8n.appcodigodavida.com.br/webhook/q
   ```
2. Verifique sua conexão de internet
3. Aumente o timeout na linha 348:
   ```python
   response = requests.get(webhook_ids_url, timeout=120)  # 2 minutos
   ```

### Problema: Conta detectada como inativa

**Sintomas:**
```
[conta1] 🟡 Inativo - Novas: 66 | Puladas: 32
```

**Causas Comuns:**
1. CAPTCHA apareceu e não foi resolvido
2. Fim das questões disponíveis com os filtros
3. Elemento não encontrado (mudança de layout)
4. Erro no navegador

**Solução:**
- Verifique a janela do navegador da conta
- Resolva o CAPTCHA se presente
- Verifique se há questões disponíveis
- Revise os logs da conta

### Problema: Webhook retorna erro 4xx/5xx

**Solução:**
1. Verifique a URL do webhook
2. Verifique se o N8N está online
3. Revise o formato do payload esperado
4. Verifique os logs do N8N

### Problema: Muitas questões duplicadas

**Sintomas:**
```
⏭️  Duplicadas puladas: 5000
🆕 Questões novas: 10
```

**Soluções:**
1. Ajuste os filtros para incluir questões não extraídas
2. Use filtros mais específicos (ano, banca, etc.)
3. Considere limpar os IDs no webhook (se apropriado)

### Problema: Taxa de extração muito baixa

**Sintomas:**
```
⚡ Taxa: 2.3 questões/min
```

**Causas:**
- Muitos delays (comportamento humano)
- Muitas imagens nas questões (mais tempo de carregamento)
- Conexão lenta

**Ajustes (use com cautela):**
```python
# Reduza delays (pode parecer menos humano)
DELAY_RANGES = {
    'page_load': (1.0, 2.0),  # Reduzido de (2.0, 4.5)
    'click': (0.5, 1.0),      # Reduzido de (1.0, 2.5)
    # ...
}
```

## 📄 Formato de Saída (Webhook)

### Payload Enviado

```json
{
  "timestamp": "2023-12-22T15:45:30.123456",
  "total_questions": 1,
  "source": "TEC Scraper - conta1",
  "account": "conta1",
  "data": [
    {
      "id": "123456",
      "materia": "Direito Constitucional",
      "assunto": "Direitos Fundamentais",
      "concurso": "TRF 1ª Região - Analista",
      "enunciado": "Texto da questão...",
      "alternativas": [
        {"letter": "A", "text": "Alternativa A..."},
        {"letter": "B", "text": "Alternativa B..."}
      ],
      "gabarito": "A",
      "comentario": "Resolução da questão...",
      "detalhes": {
        "órgão": "TRF 1ª Região",
        "banca": "CESPE",
        "ano": "2023",
        "prova": "Analista Judiciário"
      },
      "imagens_enunciado": ["url1", "url2"],
      "imagens_comentario": ["url3"],
      "extracted_at": "2023-12-22T15:45:30.123456"
    }
  ]
}
```

## 🛡️ Boas Práticas

### Segurança

- ⚠️ **Não commite** senhas no repositório
- ✅ Use variáveis de ambiente para credenciais sensíveis
- ✅ Adicione `tecconcursosv3_FINAL.py` ao `.gitignore` se contiver senhas

### Performance

- Não use mais de 7 contas simultâneas (limite razoável)
- Mantenha delays humanizados (evita detecção)
- Use modo REALTIME para feedback imediato
- Use modo BATCH para reduzir requisições ao webhook

### Manutenção

- Revise logs regularmente
- Monitore taxa de duplicatas
- Ajuste filtros conforme necessário
- Atualize dependências periodicamente

## 📝 Changelog

### Versão 3.0 (Atual)

- ✅ Removida integração com Supabase
- ✅ Sistema de monitoramento em tempo real
- ✅ Remoção de código redundante
- ✅ Webhook como único método de persistência
- ✅ Dashboard consolidado com estatísticas
- ✅ Indicadores de atividade por conta

### Versão 2.0

- Multi-threading para múltiplas contas
- Simulação de comportamento humano
- Integração com Supabase e webhooks

## 📄 Licença

Este projeto é de uso interno e educacional.

## 👥 Contribuição

Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📞 Suporte

Para questões ou problemas:

- Abra uma [Issue](https://github.com/josejusto192/SCRAPER/issues)
- Revise os logs antes de reportar
- Inclua informações sobre o ambiente (Python, Chrome, OS)

---

**⚠️ Aviso Legal**: Este software é fornecido "como está", sem garantias. Use por sua conta e risco. Respeite os termos de serviço do site TEC Concursos.