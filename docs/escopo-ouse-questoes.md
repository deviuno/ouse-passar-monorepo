# Ouse Passar - Escopo do Projeto

## Visão Geral

O **Ouse Passar** é uma plataforma completa de preparação para concursos públicos. O sistema é composto por três módulos principais:

1. **Ouse Questões** - Aplicativo web onde os alunos estudam, praticam questões e acompanham seu progresso
2. **Painel Administrativo** - Onde a equipe gerencia todo o conteúdo, questões, cursos e configurações
3. **Servidor de IA (Mastra)** - Backend que alimenta o tutor inteligente, geração de áudio e análise de conteúdo

---

## 1. Ouse Questões (App do Aluno)

### 1.1 Autenticação e Onboarding

- **Cadastro e Login** com e-mail/senha ou conta Google
- **Login anônimo** (modo visitante com funcionalidades limitadas)
- **Recuperação de senha** por e-mail
- **Onboarding guiado** em etapas para novos alunos:
  1. Boas-vindas
  2. Dados pessoais (nome, e-mail)
  3. Escolha do concurso alvo
  4. Nível de conhecimento (iniciante, intermediário, avançado)
  5. Disponibilidade de estudo (horas por semana)
  6. Geração da trilha personalizada

---

### 1.2 Trilha de Estudos (Tela Principal)

A trilha é o coração do sistema. Funciona como um caminho de aprendizagem com missões organizadas por rodadas.

- **Trilha visual** com mapa de missões (estilo gamificado)
- **Rodadas** agrupam missões por fase de estudo (Rodada 1, Rodada 2, etc.)
- **Missões** compostas por:
  - **Conteúdo teórico** - textos, imagens e vídeos explicativos
  - **Questões** - exercícios para fixação
  - **Resultado** - pontuação e feedback ao final
- **Progressão linear** - o aluno precisa completar uma missão para desbloquear a próxima
- **Aprovação mínima de 70%** - abaixo disso, o aluno entra em modo de "massificação" (reforço) e precisa refazer
- **Dois modos de trilha:**
  - **Normal** - estudo sequencial completo
  - **Reta Final** - modo intensivo para quem está perto da prova

---

### 1.3 Prática de Questões

Área livre para o aluno praticar questões com total controle sobre os filtros.

**Filtros disponíveis:**
- Matéria (Direito Constitucional, Português, etc.)
- Assunto (subtópicos organizados hierarquicamente)
- Banca examinadora (CESPE, FGV, FCC, etc.)
- Órgão (Polícia Federal, TRT, etc.)
- Cargo
- Ano da prova
- Escolaridade (Nível Médio / Superior)
- Modalidade (Certo/Errado ou Múltipla Escolha)
- Nível de dificuldade
- Apenas questões revisadas
- Apenas com comentário de professor
- Apenas questões inéditas da Ouse

**Modos de estudo:**
- **Zen** - sem timer, sem pressão, foco no aprendizado
- **Hard** - com cronômetro, contagem de acertos seguidos (streak), pressão de tempo
- **Revisão** - foco em questões que o aluno errou anteriormente

**Funcionalidades durante a prática:**
- Avaliação de dificuldade em cada questão (fácil, médio, difícil)
- Salvar sessão como caderno de questões
- Comentários e explicações detalhadas
- Estatísticas da comunidade (% que marcou cada alternativa)

---

### 1.4 Tutor com Inteligência Artificial (Mentor)

Um chat inteligente integrado na tela de questões, alimentado por IA (Google Gemini).

**Funcionalidades do Mentor:**
- **Chat de texto** - o aluno pergunta e a IA explica, tira dúvidas, aprofunda o tema
- **Explicação da resposta** - IA gera explicação detalhada de por que a alternativa está certa/errada
- **Áudio da explicação** - geração de áudio narrado a partir da explicação
- **Podcast completo** - IA gera um podcast educativo sobre o tema da questão
- **Resumo do conteúdo** - síntese dos pontos principais

Cada funcionalidade do Mentor consome "bateria" (ver seção de monetização).

---

### 1.5 Cadernos de Questões

- O aluno pode **criar cadernos** salvando questões de suas sessões de prática
- **Nomear e organizar** cadernos por tema
- **Revisitar** questões salvas a qualquer momento
- **Editar** cadernos (adicionar/remover questões, renomear)

---

### 1.6 Caderno Dourado (Anotações Pessoais)

- Sistema de **anotações livres** onde o aluno registra conceitos importantes
- Funciona como um "resumo pessoal" organizado
- Pode ser consultado a qualquer momento durante o estudo

---

### 1.7 Meus Erros

- Lista de **todas as questões que o aluno errou**
- Filtros por matéria e período
- Possibilidade de **refazer** as questões erradas
- Explicação detalhada de cada erro

---

### 1.8 Simulados

Provas completas que simulam o ambiente real do concurso.

- **Lista de simulados** disponíveis com duração e quantidade de questões
- **Execução em tela cheia** (modo prova)
- **Cronômetro** com tempo limite
- **Navegação entre questões** (ir e voltar)
- **Tela de resultados** com pontuação detalhada
- **Ranking** entre os participantes
- Simulados podem ser **gratuitos ou premium**

---

### 1.9 Trilhas por Edital

- Questões organizadas por **editais específicos** de concursos
- O aluno seleciona o edital do concurso que está estudando
- O sistema filtra automaticamente as questões relevantes
- Possibilidade de navegar por múltiplos editais

---

### 1.10 Cursos (Academia)

- **Cursos em vídeo** organizados por matéria/concurso
- Cards com imagem, título e descrição
- Alguns cursos são gratuitos, outros exclusivos para assinantes
- Layout em estilo catálogo (semelhante ao Netflix)

---

### 1.11 Estatísticas e Desempenho

Painel completo de análise do progresso do aluno.

- **Progresso de XP** e nível atual
- **Streak** (dias consecutivos de estudo)
- **Acurácia por matéria** - porcentagem de acerto em cada disciplina
- **Gráfico de evolução diária** - curva de desempenho ao longo do tempo
- **Mapa de calor (Heatmap)** - visualização de quais dias o aluno estudou
- **Conquistas desbloqueadas** - badges e troféus
- **Ranking na liga** - posição entre outros alunos
- **Percentil** - comparação com a base de usuários

---

### 1.12 Módulo de Música

Ambiente de estudo com áudio para manter o foco.

- **Biblioteca de músicas** ambiente para estudo
- **Playlists curadas** por tema/mood
- **Categorias** de áudio (concentração, relaxamento, etc.)
- **Player flutuante** que acompanha o aluno entre as telas
- **Controles completos** (play/pause, próxima/anterior, shuffle, repeat, volume)
- **Aulas em áudio** - conteúdo narrado para ouvir
- **Podcasts educativos**

---

### 1.13 Timer Pomodoro

Ferramenta de gestão de tempo integrada ao app.

- **Ciclos configuráveis:**
  - Estudo: 25 minutos (padrão)
  - Pausa curta: 5 minutos
  - Pausa longa: 15 minutos (a cada 4 ciclos)
- **Notificações sonoras e do navegador** ao final de cada fase
- **Registro do tempo** de estudo no banco de dados
- **Durações personalizáveis** pelo aluno

---

### 1.14 Loja e Inventário

Sistema de compras dentro do app.

- **Avatares** - personalização do perfil
- **Temas visuais** - customização da aparência
- **Power-ups** - itens especiais (ex: proteção de streak)
- Compra com **moedas ganhas no jogo** ou dinheiro real
- **Inventário** - visualização dos itens adquiridos

---

### 1.15 Notificações

- Notificações **em tempo real** dentro do app
- Tipos de notificação:
  - Boas-vindas (ao se cadastrar)
  - Primeiro acerto
  - Missão desbloqueada / completada
  - Marcos de streak (3, 7, 14, 30, 60, 100 dias)
  - Subiu de nível
  - Meta diária cumprida
- **Pop-up de notificações** acessível pelo sidebar
- Marcar como lida / limpar todas

---

### 1.16 Perfil e Configurações

- **Avatar** e dados pessoais
- **Estatísticas gerais** do aluno
- **Configurações de privacidade**
- **Configurações de notificação**
- **Termos de uso** e Política de Privacidade
- **Central de ajuda** com FAQ

---

## 2. Sistema de Gamificação

O app utiliza mecânicas de jogo para manter o aluno engajado.

### 2.1 XP e Níveis
- O aluno ganha **XP (pontos de experiência)** ao acertar questões
- **+10 XP** por questão correta (base)
- Conforme acumula XP, o aluno **sobe de nível**
- Cada nível exige progressivamente mais XP

### 2.2 Moedas
- Moeda virtual ganha junto com XP
- Pode ser usada na **Loja** para comprar avatares, temas e power-ups

### 2.3 Streak (Ofensiva)
- Conta quantos **dias consecutivos** o aluno estudou
- **Bônus de milestone:**
  - 7 dias: +100 XP
  - 30 dias: +250 XP
- Se o aluno pular um dia, o streak zera

### 2.4 Meta Diária
- O aluno tem uma meta de **10 questões por dia**
- Ao atingir: **+50 XP + moedas bônus**

### 2.5 Conquistas (Achievements)
- Badges desbloqueados por marcos importantes:
  - "Bem-vindo" - primeira questão
  - "Novato" - 50 acertos
  - "Dedicado" - 10 dias de streak
  - "Campeão" - líder da liga
- Visíveis no perfil e na tela de estatísticas

### 2.6 Ligas e Ranking
- Alunos são classificados em **ligas por tier:**
  - Ferro → Bronze → Prata → Ouro → Diamante
- **Ranking semanal** entre alunos da mesma liga
- **Percentil global** - "Você está entre os top X% dos alunos"

---

## 3. Sistema de Monetização

### 3.1 Sistema de Bateria (Freemium)

O plano gratuito funciona com um sistema de "bateria" que limita o uso diário.

**Custo por ação:**
| Ação | Custo de Bateria |
|------|------------------|
| Responder questão | 2 |
| Iniciar missão | 5 |
| Mensagem no chat IA | 3 |
| Gerar áudio (IA) | 5 |
| Gerar podcast (IA) | 10 |
| Criar caderno | 10 |
| Iniciar sessão de prática | 5 |

**Limites do plano gratuito:**
- 100 de bateria por dia (recarrega à meia-noite)
- Máximo 1 preparatório ativo
- Máximo 3 cadernos salvos

### 3.2 Plano Premium ("Ouse Questões")

- **Bateria ilimitada** - sem limites de uso
- **Preparatórios ilimitados**
- **Acesso completo ao Mentor IA** (texto + áudio + podcast)
- **Cadernos ilimitados**
- Suporte prioritário

### 3.3 Compras Avultas (Loja)

- Avatares e itens cosméticos
- Power-ups (proteção de streak, bônus de XP)
- Compra com moedas do jogo ou pagamento real

---

## 4. Painel Administrativo

Interface web para a equipe gerenciar todo o conteúdo e configurações da plataforma.

### 4.1 Dashboard
- Visão geral dos KPIs (indicadores-chave)
- Atividade recente dos alunos
- Status do sistema

### 4.2 Gestão de Preparatórios
- **Criar** novos preparatórios (concursos)
- **Editar** dados, imagem, descrição
- **Configurar planos** de preço
- **Associar matérias e editais** ao preparatório

### 4.3 Construtor de Missões
- **Criar e editar missões** com conteúdo teórico + questões
- **Geração automática de conteúdo** com IA
- **Organizar rodadas** (agrupar missões por fase)
- **Geração automática de rodadas** a partir de um edital

### 4.4 Gestão de Questões
- Upload e importação de questões
- Categorização por matéria, assunto, banca, etc.
- Upload de editais (especificações de concurso)
- Geração de questões com IA

### 4.5 Gestão de Cursos
- Criar e editar cursos em vídeo
- Organizar por categorias
- Definir acesso (gratuito ou premium)

### 4.6 Módulo de Música (Admin)
- Upload e gerenciamento de faixas de áudio
- Criar e organizar playlists
- Gerenciar categorias (foco, relaxamento, etc.)
- Gerador de letras com IA para estudo

### 4.7 Gamificação (Admin)
- Configurar **tabela de níveis** e XP necessário
- Criar e editar **conquistas** (achievements)
- Configurar **ligas** e regras de ranking

### 4.8 Blog e Conteúdo
- Criar e editar **artigos** no blog
- Gerenciar **autores**
- Organizar por **categorias**
- Geração de artigos com IA

### 4.9 Loja (Admin)
- Gerenciar **produtos** à venda (avatares, temas, power-ups)
- Organizar **categorias** de produtos
- Visualizar **histórico de compras**

### 4.10 CRM e Leads
- Quadro kanban para **gestão de leads** e parcerias
- Pipeline de vendas

### 4.11 Configurações Gerais
- **Módulos** - ativar/desativar funcionalidades do app
- **Gamificação** - ajustar regras de XP, bateria, etc.
- **Assinatura** - configurar planos e preços
- **Blog** - configurações do blog
- **E-mails** - templates de notificação por e-mail
- **Textos legais** - termos de uso e política de privacidade

### 4.12 Métricas de IA
- Acompanhar desempenho dos modelos de IA
- Gerenciar agentes de IA
- Monitorar uso e custos

---

## 5. Backend de IA (Mastra)

Servidor dedicado que processa as funcionalidades de inteligência artificial.

- **Tutor IA** - respostas educativas em chat, com histórico de conversa
- **Geração de áudio** - transforma texto em áudio narrado
- **Geração de podcast** - cria podcasts educativos sobre temas de estudo
- **Análise de conteúdo** - IA auxilia na criação de missões e questões
- Roda em servidor próprio (VPS) com PM2

---

## 6. Tecnologias Utilizadas

| Componente | Tecnologia |
|------------|------------|
| App do Aluno | React, TypeScript, Vite, Tailwind CSS |
| Painel Admin | React, TypeScript, Tailwind CSS |
| Gerenciamento de Estado | Zustand |
| Animações | Framer Motion |
| Banco de Dados | PostgreSQL (via Supabase) |
| Autenticação | Supabase Auth |
| Armazenamento de Arquivos | Supabase Storage |
| IA / Chat | Google Gemini API |
| Backend IA | Mastra (Node.js) |
| Hospedagem Backend | VPS com PM2 |
| Ícones | Lucide Icons |
| Pagamentos | Integração com gateway de pagamento |

---

## 7. Fluxo Principal do Aluno

```
Cadastro → Onboarding (escolha de concurso, nível, disponibilidade)
    ↓
Trilha Principal (missões organizadas por rodadas)
    ↓
Missão: Ler conteúdo → Responder questões → Ver resultado
    ↓
Aprovado (≥70%)? → Próxima missão desbloqueada
Reprovado (<70%)? → Massificação (reforço até passar)
    ↓
Entre missões: Praticar questões livres / Simulados / Cadernos
    ↓
Gamificação: XP, níveis, streak, conquistas, liga
    ↓
Mentor IA: Tirar dúvidas, ouvir explicações, gerar podcasts
    ↓
Estatísticas: Acompanhar evolução e pontos fracos
```

---

*Documento gerado em Janeiro/2026.*
