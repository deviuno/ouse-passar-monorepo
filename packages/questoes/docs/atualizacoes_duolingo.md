Aqui está o **PRD Master (Versão 2.0)**, atualizado e refinado com todas as correções lógicas (Massificação, Algoritmo de Alternância de Matérias) e as novas adições de interface (Simulados, Raio-X do Aluno).

Este documento está pronto para ser processado pelo **Gemini 3 (Vibe Coding)**, contendo instruções explícitas de lógica, banco de dados e automação via n8n.

---

# PRD Master: Ouse Questões (Ecossistema de Preparação Inteligente)

## 1. Visão Técnica e Arquitetura

* **Produto:** Ouse Questões.
* **Plataforma:** Mobile First (App) + Web Desktop (Dashboard do Aluno).
* **Core Logic:** Algoritmo de Trilha Adaptativa com bloqueio condicional (Massificação).
* **Backend Orchestration:** **n8n** (obrigatório para agentes de IA, scraping e análise de dados).
* **Database:** Híbrido (Relacional para User/Orders + NoSQL para Questões/Conteúdos Gerados).

---

## 2. Níveis de Proficiência e Carga (Regra de Negócio)

A carga de trabalho (quantidade de questões por missão) é determinada pelo nível do usuário.

**Tabela de Carga (Payload da Missão):**
*Lógica:* Ao instanciar uma missão, o backend verifica o `user_level` e injeta o `limit` de questões conforme abaixo:

| Disciplina | Iniciante | Intermediário | Avançado |
| :--- | :---: | :---: | :---: |
| **Direito** (Todas as áreas) | 40 | 50 | 80 |
| **Informática** | 30 | 40 | 60 |
| **Português** | 20 | 30 | 30 |
| **Exatas** (Mat/RLM) | 15 | 15 | 15-20 |

---

## 3. Workflow Administrativo (Automação n8n)

O Painel Admin dispara fluxos no n8n para criar os produtos ("Preparatórios").

### **Fluxo: "Criar Novo Preparatório"**
1.  **Input Admin:** Nome do Concurso + Link Fonte (ex: PCI Concursos).
2.  **Agente Crawler (n8n):** Baixa Edital e Provas Anteriores.
3.  **Agente Analista (Raio-X do Concurso):**
    * Classifica as matérias por Peso/Relevância.
    * Gera a **Lista Ordenada de Matérias** (ex: 1. Português, 2. Direito Const, 3. Informática...).
4.  **Agente Conteudista:** Gera textos/áudios para os assuntos (Input: Tópico + Nível do Aluno).
5.  **Output:** Estrutura de dados pronta para o Algoritmo da Trilha consumir.

---

## 4. A Trilha de Conhecimento (Lógica Core)

A trilha não é estática. Ela é gerada dinamicamente seguindo regras estritas de alternância e bloqueio.

### 4.1. Algoritmo de Sequenciamento (Regra de Alternância)

**Regra Absoluta:** Jamais permitir duas missões consecutivas da mesma matéria.

**Lógica de "Slots Ativos" (Exemplo prático):**
1.  O sistema pega as 2 matérias de maior peso do Raio-X (ex: Slot A = Português, Slot B = Matemática).
2.  **Geração da Trilha:**
    * Missão 1: Slot A (Assunto 1)
    * Missão 2: Slot B (Assunto 1)
    * Missão 3: Slot A (Assunto 2)
    * Missão 4: Slot B (Assunto 2)
3.  **Evento "Matéria Finalizada":**
    * Se os assuntos do Slot B (Matemática) acabarem:
    * A matéria "Matemática" sai do slot ativo e vai para o **Pool de Revisão**.
    * O sistema puxa a próxima matéria da lista de relevância (ex: Física) para o Slot B.
    * A trilha continua alternando: Slot A (Português) -> Slot B (Física).

### 4.2. Anatomia da Missão Padrão (Fluxo do Usuário)

Cada missão padrão possui 2 etapas visuais ("bolinhas") + 1 etapa condicional oculta.

1.  **Bolinha 1: Conteúdo (Teoria)**
    * Texto + Áudio + Visual (Mapa Mental).
    * Adaptado ao nível do aluno (Iniciante/Intermediário/Avançado).
2.  **Bolinha 2: Questões (Prática)**
    * Bateria de questões (quantidade definida na tabela 2).
3.  **Checkpoint de Validação (Lógica da Massificação):**
    * Ao terminar a Bolinha 2, calcula-se o `Score`.
    * **IF `Score` >= 50%:**
        * Missão Concluída.
        * Desbloqueia a próxima missão da trilha.
    * **IF `Score` < 50% (Gatilho de Massificação):**
        * **Bloqueio:** A próxima missão permanece bloqueada.
        * **Ação Obrigatória:** O sistema força o reload da missão atual (Massificação).
        * O aluno deve refazer a missão (mesmo assunto) até atingir > 50%.

### 4.3. Missões Especiais: Revisão e Simulado

As missões especiais intercalam as rodadas.

* **Missão Revisão:**
    * Ocorre periodicamente (ex: início de nova rodada).
    * **Fonte de Dados:**
        1.  Matérias que já foram "Finalizadas" (ex: Matemática do exemplo anterior).
        2.  Questões erradas em missões passadas (Prioridade Alta).
        3.  Questões marcadas como "Difíceis".
* **Missão Simulado da Rodada:**
    * Ocorre ao final de um ciclo de assuntos.
    * Acumulativo (Assuntos da rodada atual + anteriores).

---

## 5. Recursos Adicionais e Produtos

### 5.1. Simulados Avulsos (Novo Produto)
* **Conceito:** Área dedicada para venda e execução de simulados completos (estilo prova real).
* **Funcionalidade:**
    * Cronômetro rígido (sem pausa).
    * Sem feedback imediato (gabarito apenas no final).
    * Ranking específico por simulado.
* **Monetização:** Podem ser vendidos separadamente na Loja (ex: "Pacote 5 Simulados PRF").

### 5.2. Modo "Reta Final"
* Toggle pago que altera o algoritmo para focar apenas nos top 20% assuntos mais cobrados e encurta os conteúdos teóricos.

---

## 6. Analytics: Raio-X do Aluno

Localizado na área de "Estatísticas" do perfil.
* **Mapa de Calor:** Mostra visualmente as matérias onde o aluno é forte (Verde) e fraco (Vermelho).
* **Dados:**
    * Taxa de Acerto Global.
    * Taxa de Acerto por Matéria.
    * Tempo médio por questão.
    * Comparativo com a média da concorrência (ex: "Você está 10% acima da média em Direito Penal").

---

## 7. Estrutura de Navegação (Sitemap)

### 7.1. Web Sidebar (Menu Lateral Desktop) / Mobile Menu
A estrutura de navegação deve seguir esta hierarquia exata:

1.  **Minhas Trilhas (Turma de Elite):**
    * A Home do aluno. Visualização do Mapa/Saga. Acesso ao curso principal.
2.  **Praticar Questões:**
    * Modo livre ("Sandbox"). Filtros manuais. Não conta para a trilha.
3.  **Meus Simulados:**
    * Lista de simulados comprados ou disponíveis no plano.
    * Histórico de notas de simulados passados.
4.  **Minhas Estatísticas (Raio-X do Aluno):**
    * Dashboards de performance, pontos fortes e fracos.
5.  **Produtos (Loja):**
    * Marketplace para comprar novos preparatórios, pacotes de simulados ou itens (Reta Final).

---

## 8. Integrações e Workflow Técnico (Para Vibe Coding)

**Endpoints e Hooks Críticos (Sugestão de Estrutura):**

1.  `POST /mission/submit_result`
    * **Payload:** `{ user_id, mission_id, answers: [], score }`
    * **Logic:**
        * Salvar estatísticas.
        * Verificar `score < 50`.
        * Se `true`: Retornar status `MASSIFICATION_REQUIRED` (Frontend bloqueia nav e exibe botão "Refazer").
        * Se `false`: Retornar status `SUCCESS` e `next_mission_id`.

2.  `GET /track/next_mission`
    * **Logic (Algoritmo de Alternância):**
        * Verificar última matéria jogada.
        * Consultar `Active_Slots` do usuário.
        * Selecionar Slot diferente do anterior.
        * Se Slot vazio -> Trigger `Rotate_Subject_Review`.

3.  `WEBHOOK /n8n/generate_content`
    * **Trigger:** Criação de nova missão ou admin action.
    * **Input:** Assunto, Banca, Nível.
    * **Output:** JSON `{ text_content, audio_url, visual_summary_url }`.

---
