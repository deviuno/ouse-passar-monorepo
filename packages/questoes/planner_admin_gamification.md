# Plano de Gamificacao Gerenciavel - Painel Admin

## Visao Geral

Este documento detalha o planejamento para tornar todo o sistema de gamificacao do Ouse Passar gerenciavel via Painel Admin. O objetivo e dar total controle ao administrador sobre XP, moedas, niveis, conquistas, ligas, loja e todas as mecanicas de gamificacao.

**Principio Fundamental**: O sistema deve ser 100% configuravel. Se o admin excluir todos os dados, o app deve funcionar (sem gamificacao visivel). Os dados iniciais sao apenas um ponto de partida.

---

## Estrutura do Banco de Dados (Supabase)

### Tabelas Criadas

#### 1. `gamification_settings` (Configuracoes Gerais)
Tabela singleton com todas as configuracoes globais do sistema.

| Campo | Tipo | Descricao | Valor Padrao |
|-------|------|-----------|--------------|
| `id` | TEXT | Sempre 'main' | 'main' |
| `xp_per_correct_answer` | INTEGER | XP por acerto (modo normal) | 50 |
| `xp_per_correct_hard_mode` | INTEGER | XP por acerto (modo desafio) | 100 |
| `xp_per_pvp_win` | INTEGER | XP por vitoria PvP | 200 |
| `xp_per_pvp_loss` | INTEGER | XP por derrota PvP | 20 |
| `xp_per_flashcard_review` | INTEGER | XP base por revisao | 50 |
| `xp_per_flashcard_remembered` | INTEGER | XP por card lembrado | 10 |
| `coins_per_correct_answer` | INTEGER | Moedas por acerto (normal) | 10 |
| `coins_per_correct_hard_mode` | INTEGER | Moedas por acerto (desafio) | 20 |
| `coins_per_pvp_win` | INTEGER | Moedas por vitoria PvP | 50 |
| `coins_per_pvp_loss` | INTEGER | Moedas por derrota PvP | 5 |
| `xp_per_level` | INTEGER | XP necessario por nivel | 1000 |
| `level_formula` | TEXT | Formula: 'linear', 'exponential' | 'linear' |
| `daily_goal_questions` | INTEGER | Meta diaria de questoes | 50 |
| `daily_goal_xp_bonus` | INTEGER | XP bonus por meta | 100 |
| `daily_goal_coins_bonus` | INTEGER | Moedas bonus por meta | 50 |
| `streak_freeze_cost` | INTEGER | Custo do congelamento | 300 |
| `streak_7_day_xp_bonus` | INTEGER | Bonus 7 dias | 200 |
| `streak_30_day_xp_bonus` | INTEGER | Bonus 30 dias | 500 |
| `league_promotion_top` | INTEGER | Top N promovidos | 5 |
| `league_demotion_bottom` | INTEGER | Ultimos N rebaixados | 3 |
| `league_reset_day` | TEXT | Dia do reset | 'sunday' |
| `srs_interval_easy` | INTEGER | Intervalo facil (dias) | 7 |
| `srs_interval_medium` | INTEGER | Intervalo medio (dias) | 3 |
| `srs_interval_hard` | INTEGER | Intervalo dificil (dias) | 0 |
| `srs_progression_steps` | JSONB | Progressao SRS | [1,3,7,14,30] |
| `is_gamification_enabled` | BOOLEAN | Ativar gamificacao | true |
| `show_xp_animations` | BOOLEAN | Mostrar animacoes | true |
| `show_level_up_modal` | BOOLEAN | Mostrar modal de nivel | true |

---

#### 2. `levels` (Niveis e Titulos)
Configuracao dos niveis do sistema.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | SERIAL | ID auto-incremento |
| `level_number` | INTEGER | Numero do nivel (1, 2, 3...) |
| `title` | TEXT | Titulo do nivel |
| `min_xp` | INTEGER | XP minimo para este nivel |
| `icon` | TEXT | Emoji ou URL do icone |
| `color` | TEXT | Cor hex do nivel |
| `rewards_xp` | INTEGER | XP bonus ao atingir |
| `rewards_coins` | INTEGER | Moedas bonus ao atingir |
| `is_active` | BOOLEAN | Se o nivel esta ativo |

**Dados Iniciais:**
| Nivel | Titulo | XP Min | Icone | Cor |
|-------|--------|--------|-------|-----|
| 1 | Iniciante | 0 | Seed | #9CA3AF |
| 2 | Estudante | 1000 | Books | #60A5FA |
| 3 | Dedicado | 2000 | Muscle | #34D399 |
| 4 | Guardiao da Lei | 3000 | Scales | #FBBF24 |
| 5 | Especialista | 4000 | Target | #F97316 |
| 6 | Mestre | 5000 | Medal | #EF4444 |
| 7 | Lenda | 6000 | Crown | #8B5CF6 |
| 8 | Mestre Supremo | 7000 | Star | #EC4899 |

---

#### 3. `league_tiers` (Ligas do Ranking)
Configuracao das ligas competitivas.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | TEXT | ID da liga (ferro, bronze...) |
| `name` | TEXT | Nome exibido |
| `display_order` | INTEGER | Ordem (1=menor, 5=maior) |
| `icon` | TEXT | Emoji da liga |
| `color` | TEXT | Cor principal |
| `bg_color` | TEXT | Cor de fundo |
| `min_xp_to_enter` | INTEGER | XP minimo (opcional) |
| `promotion_bonus_xp` | INTEGER | XP ao ser promovido |
| `promotion_bonus_coins` | INTEGER | Moedas ao ser promovido |
| `is_active` | BOOLEAN | Se a liga esta ativa |

**Dados Iniciais:**
| ID | Nome | Ordem | Icone | Cor |
|----|------|-------|-------|-----|
| ferro | Ferro | 1 | Screw | #6B7280 |
| bronze | Bronze | 2 | Bronze Medal | #CD7F32 |
| prata | Prata | 3 | Silver Medal | #C0C0C0 |
| ouro | Ouro | 4 | Gold Medal | #FFD700 |
| diamante | Diamante | 5 | Diamond | #B9F2FF |

---

#### 4. `xp_actions` (Acoes de XP/Moedas)
Cada acao que concede recompensas.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | TEXT | ID unico da acao |
| `name` | TEXT | Nome da acao |
| `description` | TEXT | Descricao |
| `xp_reward` | INTEGER | XP concedido |
| `coins_reward` | INTEGER | Moedas concedidas |
| `study_mode` | TEXT | Modo especifico (null=todos) |
| `requires_correct_answer` | BOOLEAN | Requer acerto |
| `multiplier_enabled` | BOOLEAN | Multiplicador ativo |
| `multiplier_value` | DECIMAL | Valor do multiplicador |
| `is_active` | BOOLEAN | Se esta ativo |

**Dados Iniciais:**
| ID | Nome | XP | Moedas |
|----|------|-----|--------|
| correct_answer_zen | Acerto Zen | 50 | 10 |
| correct_answer_hard | Acerto Desafio | 100 | 20 |
| pvp_win | Vitoria PvP | 200 | 50 |
| pvp_loss | Derrota PvP | 20 | 5 |
| daily_goal_complete | Meta Diaria | 100 | 50 |
| streak_7_days | 7 Dias Seguidos | 200 | 100 |
| streak_30_days | 30 Dias Seguidos | 500 | 250 |

---

#### 5. `store_items` (Itens da Loja)
Todos os itens compraveis.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | TEXT | ID unico |
| `name` | TEXT | Nome do item |
| `description` | TEXT | Descricao |
| `item_type` | TEXT | avatar, theme, powerup, badge |
| `price_coins` | INTEGER | Preco em moedas |
| `price_real` | DECIMAL | Preco em R$ (opcional) |
| `icon` | TEXT | Emoji ou URL |
| `value` | TEXT | Valor especifico |
| `metadata` | JSONB | Dados extras |
| `is_active` | BOOLEAN | Se esta ativo |
| `is_featured` | BOOLEAN | Se esta em destaque |
| `available_from` | TIMESTAMPTZ | Disponivel a partir de |
| `available_until` | TIMESTAMPTZ | Disponivel ate |
| `max_purchases` | INTEGER | Limite de compras |
| `required_level` | INTEGER | Nivel minimo |
| `required_achievement_id` | TEXT | Conquista necessaria |
| `display_order` | INTEGER | Ordem de exibicao |

---

#### 6. `streak_rewards` (Recompensas por Sequencia)
Bonus por dias consecutivos.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | SERIAL | ID |
| `days_required` | INTEGER | Dias necessarios |
| `xp_reward` | INTEGER | XP bonus |
| `coins_reward` | INTEGER | Moedas bonus |
| `badge_id` | TEXT | Conquista desbloqueada |
| `special_reward_type` | TEXT | Tipo de item especial |
| `special_reward_id` | TEXT | ID do item especial |
| `notification_message` | TEXT | Mensagem de notificacao |
| `icon` | TEXT | Icone |
| `is_active` | BOOLEAN | Se esta ativo |

---

#### 7. `daily_challenges` (Desafios Diarios)
Desafios aleatorios diarios.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | UUID | ID unico |
| `name` | TEXT | Nome do desafio |
| `description` | TEXT | Descricao |
| `challenge_type` | TEXT | questions, accuracy, time... |
| `target_value` | INTEGER | Valor alvo |
| `xp_reward` | INTEGER | XP bonus |
| `coins_reward` | INTEGER | Moedas bonus |
| `subject_filter` | TEXT | Materia especifica |
| `study_mode_filter` | TEXT | Modo especifico |
| `is_active` | BOOLEAN | Se esta ativo |
| `weight` | INTEGER | Peso no sorteio |

---

#### 8. `achievements` (Conquistas - ja existente)
Tabela atualizada com novos campos.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | TEXT | ID unico |
| `name` | TEXT | Nome |
| `description` | TEXT | Descricao |
| `icon` | TEXT | Emoji |
| `category` | TEXT | Categoria |
| `requirement_type` | TEXT | Tipo de requisito |
| `requirement_value` | INTEGER | Valor necessario |
| `xp_reward` | INTEGER | XP ao desbloquear |
| `coins_reward` | INTEGER | Moedas (NOVO) |
| `is_active` | BOOLEAN | Se esta ativo (NOVO) |
| `is_hidden` | BOOLEAN | Se e oculto (NOVO) |
| `display_order` | INTEGER | Ordem (NOVO) |
| `unlock_message` | TEXT | Mensagem (NOVO) |

---

## Fases de Implementacao

### FASE 1: Backend/Admin Panel (Prioridade Alta)

#### 1.1 Pagina de Configuracoes Gerais
**Arquivo sugerido:** `pages/admin/gamification/settings.tsx`

- [ ] Formulario para editar `gamification_settings`
- [ ] Campos organizados em secoes:
  - Sistema de XP
  - Sistema de Moedas
  - Sistema de Niveis
  - Meta Diaria
  - Sistema de Streak
  - Liga/Ranking
  - SRS (Repeticao Espacada)
  - Configuracoes Gerais
- [ ] Validacao de campos
- [ ] Preview em tempo real
- [ ] Botao de "Restaurar Padrao"

**Query de leitura:**
```sql
SELECT * FROM gamification_settings WHERE id = 'main';
```

**Query de atualizacao:**
```sql
UPDATE gamification_settings SET ... WHERE id = 'main';
```

---

#### 1.2 Pagina de Niveis
**Arquivo sugerido:** `pages/admin/gamification/levels.tsx`

- [ ] Tabela listando todos os niveis
- [ ] CRUD completo (Criar, Editar, Excluir)
- [ ] Drag-and-drop para reordenar
- [ ] Preview visual do nivel (icone + cor)
- [ ] Campo de XP com calculo automatico sugerido
- [ ] Toggle de ativacao
- [ ] Botao "Adicionar Nivel"

**Funcionalidades:**
- Duplicar nivel existente
- Importar/Exportar JSON
- Visualizacao da curva de progressao

---

#### 1.3 Pagina de Ligas
**Arquivo sugerido:** `pages/admin/gamification/leagues.tsx`

- [ ] Tabela listando todas as ligas
- [ ] CRUD completo
- [ ] Seletor de cor com preview
- [ ] Configuracao de bonus de promocao
- [ ] Ordenacao por display_order
- [ ] Toggle de ativacao

---

#### 1.4 Pagina de Acoes de XP
**Arquivo sugerido:** `pages/admin/gamification/xp-actions.tsx`

- [ ] Tabela listando todas as acoes
- [ ] Edicao rapida inline de XP/Moedas
- [ ] Filtro por modo de estudo
- [ ] Toggle de ativacao
- [ ] Criacao de novas acoes customizadas

---

#### 1.5 Pagina de Loja
**Arquivo sugerido:** `pages/admin/gamification/store.tsx`

- [ ] Grid de itens com preview visual
- [ ] Tabs por tipo (Avatares, Temas, Power-ups)
- [ ] CRUD completo
- [ ] Upload de imagem para avatares
- [ ] Configuracao de disponibilidade (datas)
- [ ] Toggle de destaque
- [ ] Estatisticas de vendas

---

#### 1.6 Pagina de Conquistas
**Arquivo sugerido:** `pages/admin/gamification/achievements.tsx`

- [ ] Grid de conquistas com preview
- [ ] CRUD completo
- [ ] Seletor de tipo de requisito
- [ ] Preview da conquista
- [ ] Toggle de ativo/oculto
- [ ] Estatisticas de desbloqueio

---

#### 1.7 Pagina de Recompensas de Streak
**Arquivo sugerido:** `pages/admin/gamification/streak-rewards.tsx`

- [ ] Tabela ordenada por dias
- [ ] CRUD completo
- [ ] Vinculo com conquistas
- [ ] Preview da notificacao

---

#### 1.8 Pagina de Desafios Diarios
**Arquivo sugerido:** `pages/admin/gamification/daily-challenges.tsx`

- [ ] Tabela de desafios
- [ ] CRUD completo
- [ ] Configuracao de peso
- [ ] Preview do desafio

---

### FASE 2: Integracao no App Principal (Ouse-Questoes)

#### 2.1 Criar Service de Gamificacao
**Arquivo:** `services/gamificationConfigService.ts`

```typescript
// Funcoes a implementar:
export const fetchGamificationSettings = async () => {...}
export const fetchLevels = async () => {...}
export const fetchLeagueTiers = async () => {...}
export const fetchXpActions = async () => {...}
export const fetchStoreItems = async () => {...}
export const fetchStreakRewards = async () => {...}
export const fetchAchievements = async () => {...}
export const fetchDailyChallenges = async () => {...}

// Cache local para performance
export const getGamificationConfig = async () => {...}
```

---

#### 2.2 Atualizar App.tsx
- [ ] Substituir valores hardcoded por dados do Supabase
- [ ] Criar contexto de gamificacao
- [ ] Implementar cache local
- [ ] Fallback para valores padrao se config vazia

**Valores a substituir:**
| Atual (Hardcoded) | Novo (Supabase) |
|-------------------|-----------------|
| `+50 XP` | `settings.xp_per_correct_answer` |
| `+100 XP` | `settings.xp_per_correct_hard_mode` |
| `+10 coins` | `settings.coins_per_correct_answer` |
| `level * 1000` | `settings.xp_per_level` |
| Etc... | Etc... |

---

#### 2.3 Atualizar GamificationModal.tsx
- [ ] Buscar niveis da tabela `levels`
- [ ] Buscar ligas da tabela `league_tiers`
- [ ] Calcular XP baseado em `gamification_settings`

---

#### 2.4 Atualizar Dashboard.tsx
- [ ] Buscar titulo do nivel dinamicamente
- [ ] Usar cores da tabela `levels`
- [ ] Meta diaria de `gamification_settings`

---

#### 2.5 Atualizar RankingView.tsx
- [ ] Buscar ligas da tabela `league_tiers`
- [ ] Cores e icones dinamicos

---

#### 2.6 Atualizar StoreView.tsx (se existir)
- [ ] Buscar itens de `store_items`
- [ ] Filtrar por `is_active` e disponibilidade

---

### FASE 3: Funcionalidades Avancadas

#### 3.1 Sistema de Eventos/Campanhas
- [ ] Tabela `gamification_events` para eventos temporarios
- [ ] Multiplicadores de XP por periodo
- [ ] Itens exclusivos de evento

#### 3.2 Analytics de Gamificacao
- [ ] Dashboard com metricas
- [ ] Usuarios por nivel
- [ ] Itens mais comprados
- [ ] Taxa de retencao por streak

#### 3.3 Notificacoes Push
- [ ] Lembrete de streak
- [ ] Conquista desbloqueada
- [ ] Promocao de liga

---

## Queries Uteis para o Admin Panel

### Listar todos os niveis
```sql
SELECT * FROM levels WHERE is_active = true ORDER BY level_number;
```

### Estatisticas de usuarios por nivel
```sql
SELECT l.title, COUNT(u.id) as users
FROM levels l
LEFT JOIN user_profiles u ON u.level = l.level_number
GROUP BY l.level_number, l.title
ORDER BY l.level_number;
```

### Itens mais vendidos
```sql
SELECT s.name, s.price_coins, COUNT(ui.id) as purchases
FROM store_items s
LEFT JOIN user_inventory ui ON ui.item_id = s.id
GROUP BY s.id, s.name, s.price_coins
ORDER BY purchases DESC;
```

### Conquistas mais desbloqueadas
```sql
SELECT a.name, a.icon, COUNT(ua.id) as unlocks
FROM achievements a
LEFT JOIN user_achievements ua ON ua.achievement_id = a.id
GROUP BY a.id, a.name, a.icon
ORDER BY unlocks DESC;
```

---

## Consideracoes de Seguranca

### RLS (Row Level Security)
Todas as tabelas de configuracao tem RLS habilitado:
- **SELECT**: Permitido para todos (dados publicos)
- **INSERT/UPDATE/DELETE**: Apenas via `service_role` (admin)

### Validacao no Admin
- Nao permitir XP negativo
- Nao permitir nivel 0
- Validar URLs de imagem
- Limite de caracteres em textos

---

## Checklist de Implementacao

### Supabase (Concluido)
- [x] Criar tabela `gamification_settings`
- [x] Criar tabela `levels`
- [x] Criar tabela `league_tiers`
- [x] Criar tabela `xp_actions`
- [x] Criar tabela `store_items`
- [x] Criar tabela `streak_rewards`
- [x] Criar tabela `daily_challenges`
- [x] Atualizar tabela `achievements`
- [x] Popular dados iniciais
- [x] Configurar RLS

### Admin Panel (Pendente)
- [ ] Pagina de configuracoes gerais
- [ ] Pagina de niveis
- [ ] Pagina de ligas
- [ ] Pagina de acoes XP
- [ ] Pagina de loja
- [ ] Pagina de conquistas
- [ ] Pagina de streak rewards
- [ ] Pagina de desafios diarios
- [ ] Menu de navegacao
- [ ] Dashboard de analytics

### App Principal (Pendente)
- [ ] Service de configuracao
- [ ] Contexto de gamificacao
- [ ] Substituir hardcoded values
- [ ] Cache local
- [ ] Fallbacks

---

## Estimativa de Esforco

| Fase | Componentes | Estimativa |
|------|-------------|------------|
| Fase 1 | Admin Panel | 8 paginas |
| Fase 2 | Integracao App | 6 arquivos |
| Fase 3 | Funcionalidades Avancadas | 3 modulos |

---

## Proximos Passos

1. **Iniciar pelo Admin Panel** - Criar as paginas de configuracao
2. **Testar no Supabase** - Verificar se os dados estao corretos
3. **Integrar no App** - Substituir valores hardcoded
4. **Testar end-to-end** - Alterar config e verificar no app
5. **Deploy** - Publicar alteracoes

---

*Documento criado em: 27/11/2025*
*Ultima atualizacao: 27/11/2025*
