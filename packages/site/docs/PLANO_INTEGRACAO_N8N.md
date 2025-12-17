# Plano de Integração: Sistema de Preparatórios com N8N

## Resumo Executivo

Este documento descreve o plano de integração do sistema de criação de preparatórios do admin com os webhooks do N8N para automatizar a criação de estrutura de cursos e geração de conteúdo sob demanda.

---

## 1. Visão Geral da Arquitetura

### 1.1 Fluxo Atual vs Novo Fluxo

**Fluxo Atual:**
```
Admin → Cria Preparatório manualmente → Adiciona Rodadas → Adiciona Missões
```

**Novo Fluxo com N8N:**
```
Admin → Preenche formulário com dados do edital → POST webhook/preparatorio
  ↓
N8N processa e cria automaticamente:
  - preparatorio (tabela existente? ou nova?)
  - preparatorio_materias (nova tabela)
  - assuntos (nova tabela)
  ↓
Usuário acessa assunto → Verifica se conteúdo existe
  ↓
Se não existe → POST webhook/conteudo → N8N gera e salva em 'conteudos'
  ↓
Atualiza página → Exibe conteúdo (texto, áudio, imagem, mapa mental)
```

### 1.2 Endpoints N8N

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `https://n8n.appcodigodavida.com.br/webhook/preparatorio` | POST | Criar estrutura do preparatório |
| `https://n8n.appcodigodavida.com.br/webhook/conteudo` | POST | Gerar conteúdo sob demanda |

---

## 2. Análise de Impacto no Banco de Dados

### 2.1 Tabelas Existentes (Podem ser reutilizadas)

| Tabela | Status | Observação |
|--------|--------|------------|
| `preparatorios` | Existente | Pode ser reutilizada com campos adicionais |
| `rodadas` | Existente | Estrutura diferente do novo modelo |
| `missoes` | Existente | Estrutura diferente do novo modelo |

### 2.2 Novas Tabelas Necessárias

```sql
-- Tabela de matérias do preparatório
CREATE TABLE preparatorio_materias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preparatorio_id UUID NOT NULL REFERENCES preparatorios(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de assuntos (tópicos de cada matéria)
CREATE TABLE assuntos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    materia_id UUID NOT NULL REFERENCES preparatorio_materias(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    sub_assuntos TEXT[], -- Array de subtópicos
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de conteúdos gerados (multimídia)
CREATE TABLE conteudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assunto_id UUID NOT NULL REFERENCES assuntos(id) ON DELETE CASCADE,
    nivel_dificuldade VARCHAR(20) NOT NULL CHECK (nivel_dificuldade IN ('iniciante', 'intermediario', 'avancado')),

    -- Conteúdo textual
    texto TEXT,

    -- Áudio (podcast)
    audio_url TEXT,
    audio_base64 TEXT, -- Alternativa se armazenado inline
    audio_duracao INTEGER, -- Duração em segundos

    -- Imagem de capa
    imagem_capa_url TEXT,

    -- Mapa mental
    mapa_mental_url TEXT,
    mapa_mental_data JSONB, -- Dados estruturados do mapa mental

    -- Metadados
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'error')),
    error_message TEXT,
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint única: apenas um conteúdo por assunto+nível
    UNIQUE(assunto_id, nivel_dificuldade)
);

-- Índices
CREATE INDEX idx_preparatorio_materias_preparatorio ON preparatorio_materias(preparatorio_id);
CREATE INDEX idx_assuntos_materia ON assuntos(materia_id);
CREATE INDEX idx_conteudos_assunto ON conteudos(assunto_id);
CREATE INDEX idx_conteudos_assunto_nivel ON conteudos(assunto_id, nivel_dificuldade);
```

### 2.3 Campos Adicionais na Tabela `preparatorios`

```sql
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS orgao VARCHAR(255);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS banca VARCHAR(100);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS nivel VARCHAR(50); -- 'NÍVEL SUPERIOR', 'NÍVEL MÉDIO'
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS cargo VARCHAR(255);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS requisitos TEXT;
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS area_conhecimento_basico TEXT;
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS area_conhecimento_especifico TEXT;
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS data_prevista DATE;
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS n8n_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS n8n_error_message TEXT;
```

---

## 3. Implementação - ETAPA 1: Criação do Preparatório

### 3.1 Modificações no Formulário de Criação

**Arquivo:** `packages/site/pages/admin/NewPreparatorio.tsx`

**Novo modo de criação:** "Via Dados do Edital"

**Campos do formulário:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| orgao | text | Sim | Ex: "POLÍCIA FEDERAL" |
| banca | text | Não | Ex: "CESPE", "NAO DEFINIDO" |
| nivel | select | Sim | "NÍVEL SUPERIOR" ou "NÍVEL MÉDIO" |
| cargo | text | Sim | Ex: "ADMINISTRADOR" |
| requisitos | textarea | Não | Requisitos do cargo |
| area_conhecimento_basico | textarea | Sim | Conteúdo programático básico |
| area_conhecimento_especifico | textarea | Sim | Conteúdo programático específico |
| data_prevista | date | Não | Data prevista da prova |

### 3.2 Payload para o Webhook

```typescript
interface CreatePreparatorioN8NPayload {
  Orgão: string;
  Banca: string;
  Nivel: string;
  Cargo: string;
  Requisitos: string;
  "ÁREA DE CONHECIMENTO BASICO": string;
  "ÁREA DE CONHECIMENTO ESEPCIFICO": string;
  "Data Prevista": string; // ISO date format
  submittedAt: string; // ISO datetime
  formMode: "production" | "test";

  // Campos adicionais para callback
  preparatorio_id?: string; // Se já existir no banco
  callback_url?: string;
}
```

### 3.3 Fluxo de Criação

```
1. Admin preenche formulário
   ↓
2. Frontend valida campos obrigatórios
   ↓
3. Frontend cria registro em `preparatorios` com n8n_status='pending'
   ↓
4. Frontend envia POST para webhook/preparatorio
   ↓
5. Mostra loading com mensagem "Processando edital..."
   ↓
6. N8N processa e cria:
   - preparatorio_materias (lista de matérias)
   - assuntos (tópicos de cada matéria)
   ↓
7. N8N atualiza n8n_status='completed' no preparatorio
   ↓
8. Frontend polling ou webhook callback detecta conclusão
   ↓
9. Redireciona para página de edição do preparatório
```

### 3.4 Serviço de Integração

**Novo arquivo:** `packages/site/services/n8nService.ts`

```typescript
const N8N_PREPARATORIO_WEBHOOK = 'https://n8n.appcodigodavida.com.br/webhook/preparatorio';
const N8N_CONTEUDO_WEBHOOK = 'https://n8n.appcodigodavida.com.br/webhook/conteudo';

export const n8nService = {
  // Etapa 1: Criar estrutura do preparatório
  async createPreparatorioStructure(payload: CreatePreparatorioN8NPayload): Promise<N8NResponse>,

  // Etapa 2: Gerar conteúdo sob demanda
  async generateContent(payload: GenerateContentPayload): Promise<ContentGenerationResponse>,

  // Verificar status de processamento
  async checkPreparatorioStatus(preparatorioId: string): Promise<ProcessingStatus>,
};
```

---

## 4. Implementação - ETAPA 2: Geração de Conteúdo

### 4.1 Fluxo de Acesso do Usuário

```
1. Usuário navega para um assunto específico
   ↓
2. Frontend busca conteúdo: SELECT * FROM conteudos
   WHERE assunto_id = ? AND nivel_dificuldade = ?
   ↓
3a. SE EXISTE → Renderiza conteúdo (texto, áudio, imagem, mapa)
   ↓
3b. SE NÃO EXISTE:
   ↓
4. Mostra estado de loading "Gerando conteúdo personalizado..."
   ↓
5. POST para webhook/conteudo com payload
   ↓
6. Aguarda resposta (success: true, id: uuid)
   ↓
7. Mostra mensagem "Conteúdo gerado! Carregando..."
   ↓
8. Busca conteúdo no banco usando assunto_id + nivel_dificuldade
   ↓
9. Renderiza conteúdo completo
```

### 4.2 Payload para Geração de Conteúdo

```typescript
interface GenerateContentPayload {
  nivel_dificuldade: 'iniciante' | 'intermediario' | 'avancado';
  materia: string;
  assunto_principal: string;
  sub_assuntos: string[];
  assunto_id: string; // UUID
}
```

### 4.3 Resposta Esperada do Webhook

```typescript
interface ContentGenerationResponse {
  success: boolean;
  message: string;
  id: string; // UUID do conteúdo criado
  nivel_dificuldade: string;
}
```

### 4.4 Componente de Visualização de Conteúdo

**Novo arquivo:** `packages/site/components/ConteudoAssunto.tsx`

```typescript
interface ConteudoAssuntoProps {
  assuntoId: string;
  nivelDificuldade: 'iniciante' | 'intermediario' | 'avancado';
  materia: string;
  assuntoPrincipal: string;
  subAssuntos: string[];
}

// Estados do componente:
// 1. loading - Verificando se conteúdo existe
// 2. generating - Chamando webhook para gerar
// 3. ready - Conteúdo disponível para exibição
// 4. error - Erro na geração
```

---

## 5. Possíveis Falhas e Mitigações

### 5.1 Falhas de Rede

| Cenário | Impacto | Mitigação |
|---------|---------|-----------|
| Timeout na chamada do webhook | Usuário fica sem feedback | Implementar timeout de 60s + retry automático (3x) |
| Webhook N8N fora do ar | Sistema não cria preparatórios | Implementar fila local + retry com exponential backoff |
| Conexão perdida durante geração | Conteúdo fica em estado indefinido | Status 'generating' com timestamp + limpeza automática |

### 5.2 Falhas de Dados

| Cenário | Impacto | Mitigação |
|---------|---------|-----------|
| Payload malformado | N8N rejeita requisição | Validação rigorosa no frontend antes de enviar |
| Campos obrigatórios vazios | Erro 400 do webhook | Validação com mensagens claras ao usuário |
| UUID inválido | N8N não encontra registro | Verificar existência antes de chamar webhook |
| Caracteres especiais no texto | Encoding quebrado | Sanitização + UTF-8 encoding explícito |

### 5.3 Falhas de Processamento N8N

| Cenário | Impacto | Mitigação |
|---------|---------|-----------|
| IA falha ao processar edital | Estrutura não é criada | Status 'error' + mensagem detalhada + botão "Tentar novamente" |
| Geração de conteúdo timeout | Conteúdo não disponível | Criar registro com status 'error' + permitir nova tentativa |
| Áudio não gerado | Experiência incompleta | Campos opcionais + UI graceful degradation |
| Mapa mental falha | Experiência incompleta | Campo opcional + UI mostra apenas o que está disponível |

### 5.4 Falhas de Concorrência

| Cenário | Impacto | Mitigação |
|---------|---------|-----------|
| Múltiplos usuários gerando mesmo conteúdo | Duplicação/conflito | UNIQUE constraint + verificar status antes de chamar webhook |
| Usuário sai da página durante geração | Conteúdo órfão | Continuar processamento no backend, conteúdo estará lá na próxima visita |
| Race condition no status update | Estado inconsistente | Usar transações + updated_at para verificar conflitos |

### 5.5 Falhas de UI/UX

| Cenário | Impacto | Mitigação |
|---------|---------|-----------|
| Loading infinito | Usuário abandona | Timeout máximo de 2 minutos + cancelamento com feedback |
| Erro sem mensagem clara | Frustração do usuário | Mensagens de erro amigáveis + opção de suporte |
| Página não atualiza após geração | Usuário não vê conteúdo | Polling automático + botão "Atualizar" visível |

---

## 6. Tratamento de Erros

### 6.1 Códigos de Erro Esperados

```typescript
enum N8NErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  AI_ERROR = 'AI_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

interface N8NErrorResponse {
  success: false;
  error: {
    code: N8NErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### 6.2 Estratégia de Retry

```typescript
const retryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 segundo
  maxDelay: 30000, // 30 segundos
  backoffMultiplier: 2,
  retryableErrors: [
    'TIMEOUT_ERROR',
    'PROCESSING_ERROR',
  ],
};
```

---

## 7. Monitoramento e Logs

### 7.1 Eventos a Logar

| Evento | Dados | Nível |
|--------|-------|-------|
| Webhook chamado | payload, timestamp | INFO |
| Webhook sucesso | response, duration | INFO |
| Webhook erro | error, payload, attempts | ERROR |
| Conteúdo gerado | assunto_id, nivel, duration | INFO |
| Retry executado | attempt, delay, reason | WARN |

### 7.2 Métricas a Monitorar

- Tempo médio de processamento do webhook/preparatorio
- Tempo médio de geração de conteúdo
- Taxa de erro por tipo
- Número de retries por requisição
- Conteúdos gerados por dia/semana

---

## 8. Ordem de Implementação

### Fase 1: Infraestrutura (Estimativa: 1-2 dias)
1. [ ] Criar migration para novas tabelas
2. [ ] Criar tipos TypeScript
3. [ ] Criar serviço n8nService.ts
4. [ ] Configurar variáveis de ambiente

### Fase 2: ETAPA 1 - Criação de Preparatório (Estimativa: 2-3 dias)
5. [ ] Modificar formulário NewPreparatorio.tsx
6. [ ] Implementar chamada ao webhook/preparatorio
7. [ ] Implementar polling/callback para status
8. [ ] Criar UI de feedback durante processamento
9. [ ] Testes manuais com N8N

### Fase 3: ETAPA 2 - Geração de Conteúdo (Estimativa: 3-4 dias)
10. [ ] Criar página de visualização de assunto
11. [ ] Implementar verificação de conteúdo existente
12. [ ] Implementar chamada ao webhook/conteudo
13. [ ] Criar componente de renderização multimídia
14. [ ] Implementar player de áudio
15. [ ] Implementar visualização de mapa mental
16. [ ] Testes end-to-end

### Fase 4: Polimento (Estimativa: 1-2 dias)
17. [ ] Tratamento de erros robusto
18. [ ] Loading states e animações
19. [ ] Testes de edge cases
20. [ ] Documentação final

---

## 9. Variáveis de Ambiente

```env
# N8N Webhooks
VITE_N8N_PREPARATORIO_WEBHOOK=https://n8n.appcodigodavida.com.br/webhook/preparatorio
VITE_N8N_CONTEUDO_WEBHOOK=https://n8n.appcodigodavida.com.br/webhook/conteudo

# Configurações
VITE_N8N_TIMEOUT=60000
VITE_N8N_MAX_RETRIES=3
```

---

## 10. Considerações de Segurança

1. **Autenticação**: Verificar se os webhooks N8N requerem autenticação (API key, bearer token)
2. **Rate Limiting**: Implementar limite de requisições para evitar abuso
3. **Validação de Input**: Sanitizar todos os campos antes de enviar ao webhook
4. **CORS**: Verificar se os webhooks permitem chamadas do domínio do frontend
5. **Dados Sensíveis**: Não enviar dados sensíveis desnecessários no payload

---

## 11. Perguntas Pendentes para o Time N8N

1. Os webhooks requerem algum tipo de autenticação (API key, token)?
2. Qual o timeout máximo esperado para cada webhook?
3. O N8N envia callback quando termina ou devemos fazer polling?
4. Existe endpoint para verificar status de processamento?
5. Como são retornados os erros (formato, códigos)?
6. O conteúdo base64 do áudio tem limite de tamanho?
7. O mapa mental é retornado como imagem ou dados estruturados?

---

## 12. Conclusão

Este plano cobre a integração completa do sistema de preparatórios com os webhooks N8N, incluindo:

- Estrutura de banco de dados necessária
- Fluxos de criação e geração de conteúdo
- Tratamento de erros e cenários de falha
- Ordem de implementação clara
- Considerações de segurança

**Próximos passos após aprovação:**
1. Revisar plano com equipe
2. Esclarecer perguntas pendentes com time N8N
3. Iniciar Fase 1 (Infraestrutura)
