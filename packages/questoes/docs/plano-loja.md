# Plano do Sistema de Loja - Ouse Passar

## Visão Geral

O sistema de loja do Ouse Passar será uma plataforma completa para gerenciar produtos digitais e físicos, incluindo:
- Preparatórios/Trilhas (produtos principais)
- Simulados específicos
- Modo Reta Final (trilha condensada)
- Produtos externos/físicos
- Mimos/Recompensas (compráveis com moedas do sistema)

---

## 1. Estrutura de Produtos

### 1.1 Categorias de Produtos

| Categoria | Tipo | Moeda | Descrição |
|-----------|------|-------|-----------|
| `preparatorio` | Digital | R$ | Trilhas completas de estudo |
| `reta_final` | Digital | R$ | Trilhas condensadas (45-60 dias) |
| `simulado` | Digital | R$/Moedas | Simulados específicos |
| `mimo` | Digital | Moedas | Recompensas cosméticas (avatares, temas, badges) |
| `boost` | Digital | Moedas | Multiplicadores de XP, proteção de streak |
| `externo` | Físico/Digital | R$ | Produtos externos (livros, cursos parceiros) |

### 1.2 Mimos Disponíveis (Moedas)

| Item | Preço | Descrição |
|------|-------|-----------|
| Avatares exclusivos | 500-2000 | Fotos de perfil temáticas |
| Temas de interface | 1000-3000 | Dark mode especial, cores personalizadas |
| Badges especiais | 300-1000 | Distintivos para o perfil |
| Títulos | 500-1500 | "Mestre em Direito", "Estrategista" |
| Multiplicador XP 2x | 200 | 24 horas de XP dobrado |
| Proteção de Streak | 500 | Protege 1 dia de streak |
| Pulo de missão | 300 | Pular 1 missão sem penalidade |
| Dica extra | 100 | Dica adicional em questões |

---

## 2. Modo Reta Final

### 2.1 Conceito
Quando a data da prova está definida e restam poucos dias (ex: 45-60 dias), o sistema entra no "Modo Reta Final":

### 2.2 Características
- **Visual diferente**: Cores de urgência (vermelho/laranja), indicadores de contagem regressiva
- **Comunicação agressiva**: Mensagens diretas, estilo "treinador rigoroso"
- **Conteúdo condensado**: Foco nos tópicos mais cobrados
- **Simulados intensivos**: Mais simulados, feedback imediato
- **Notificações urgentes**: Lembretes mais frequentes

### 2.3 Gatilhos Visuais
- Badge "RETA FINAL" no header
- Countdown para a prova sempre visível
- Barra de progresso com cor de urgência
- Fundo/tema mais intenso
- Mensagens do tutor mais diretas

### 2.4 Comunicação do Tutor (Reta Final)
```
MODO NORMAL:
"Olá! Vamos continuar seus estudos? Hoje temos uma aula interessante sobre..."

MODO RETA FINAL:
"⏰ Faltam 23 DIAS. Não tem tempo para enrolação.
Hoje você PRECISA dominar [Tópico X] - é um dos mais cobrados.
Bora! Cada minuto conta."
```

---

## 3. Alterações no Banco de Dados

### 3.1 Nova Tabela: `store_categories`
```sql
CREATE TABLE store_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Alterar Tabela: `store_items`
```sql
ALTER TABLE store_items ADD COLUMN category_id UUID REFERENCES store_categories(id);
ALTER TABLE store_items ADD COLUMN product_type VARCHAR(50); -- preparatorio, simulado, mimo, boost, externo
ALTER TABLE store_items ADD COLUMN external_url TEXT; -- para produtos externos
ALTER TABLE store_items ADD COLUMN stock INTEGER; -- para produtos físicos
ALTER TABLE store_items ADD COLUMN preparatorio_id UUID REFERENCES preparatorios(id);
ALTER TABLE store_items ADD COLUMN simulado_id UUID REFERENCES simulados(id);
```

### 3.3 Nova Tabela: `store_purchases`
```sql
CREATE TABLE store_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  item_id TEXT NOT NULL REFERENCES store_items(id),
  quantity INTEGER DEFAULT 1,
  price_paid NUMERIC(10,2),
  currency VARCHAR(10) DEFAULT 'BRL', -- BRL ou COINS
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, completed, refunded
  payment_method VARCHAR(50), -- pix, credit_card, coins
  payment_reference TEXT, -- ID da transação externa
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### 3.4 Alterar Tabela: `user_trails`
```sql
ALTER TABLE user_trails ADD COLUMN is_reta_final BOOLEAN DEFAULT false;
ALTER TABLE user_trails ADD COLUMN data_prova DATE;
ALTER TABLE user_trails ADD COLUMN dias_restantes INTEGER;
ALTER TABLE user_trails ADD COLUMN reta_final_started_at TIMESTAMPTZ;
```

### 3.5 Alterar Tabela: `preparatorios`
```sql
ALTER TABLE preparatorios ADD COLUMN reta_final_disponivel BOOLEAN DEFAULT false;
ALTER TABLE preparatorios ADD COLUMN preco_reta_final NUMERIC(10,2);
ALTER TABLE preparatorios ADD COLUMN dias_reta_final INTEGER DEFAULT 45;
```

### 3.6 Nova Tabela: `user_boosts`
```sql
CREATE TABLE user_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  boost_type VARCHAR(50) NOT NULL, -- xp_multiplier, streak_protection, mission_skip, extra_hint
  value NUMERIC(5,2), -- ex: 2.0 para 2x XP
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Endpoints da API

### 4.1 Loja Pública
- `GET /api/store/categories` - Listar categorias
- `GET /api/store/products` - Listar produtos (com filtros)
- `GET /api/store/products/:id` - Detalhes do produto
- `GET /api/store/featured` - Produtos em destaque

### 4.2 Compras
- `POST /api/store/purchase` - Iniciar compra
- `POST /api/store/purchase/coins` - Compra com moedas
- `GET /api/store/purchases` - Histórico de compras do usuário
- `POST /api/webhooks/payment` - Webhook de pagamento

### 4.3 Inventário
- `GET /api/user/inventory` - Itens do usuário
- `POST /api/user/inventory/:id/equip` - Equipar item
- `POST /api/user/boosts/:id/use` - Usar boost

### 4.4 Reta Final
- `POST /api/trails/:id/reta-final` - Ativar modo reta final
- `GET /api/trails/:id/reta-final/status` - Status do reta final

### 4.5 Admin
- `GET /api/admin/store/products` - Listar todos produtos
- `POST /api/admin/store/products` - Criar produto
- `PUT /api/admin/store/products/:id` - Atualizar produto
- `DELETE /api/admin/store/products/:id` - Remover produto
- `GET /api/admin/store/purchases` - Listar compras
- `GET /api/admin/store/stats` - Estatísticas de vendas

---

## 5. Interface Admin

### 5.1 Menu Loja no Admin
```
📦 Loja
├── 📊 Dashboard (vendas, métricas)
├── 🏷️ Categorias
├── 📦 Produtos
│   ├── Todos
│   ├── Preparatórios
│   ├── Simulados
│   ├── Mimos
│   └── Externos
├── 🛒 Pedidos
└── ⚙️ Configurações
```

### 5.2 Funcionalidades
- CRUD de categorias
- CRUD de produtos com upload de imagens
- Gerenciamento de estoque (produtos físicos)
- Visualização de pedidos
- Relatórios de vendas
- Configuração de promoções

---

## 6. Fluxo de Produtos Automáticos

### 6.1 Preparatórios
- Quando um novo preparatório é criado, automaticamente:
  1. Cria entrada em `store_items` com tipo `preparatorio`
  2. Sincroniza preço e informações
  3. Marca como ativo quando estiver pronto

### 6.2 Simulados
- Simulados criados pelo admin podem ser:
  1. Gratuitos (parte da trilha)
  2. Pagos (R$)
  3. Por moedas

---

## 7. Implementação do Reta Final

### 7.1 Ativação
1. Usuário define data da prova
2. Sistema calcula dias restantes
3. Se <= 60 dias, oferece modo Reta Final
4. Usuário confirma (pode ter custo adicional)
5. Sistema recalcula trilha condensada

### 7.2 Algoritmo de Condensação
```
Para cada matéria:
  1. Priorizar tópicos por peso histórico (% de questões)
  2. Reduzir conteúdo para 70% dos tópicos mais importantes
  3. Aumentar proporção de revisão e simulados
  4. Remover missões de "técnicas avançadas"
```

### 7.3 Comunicação Agressiva
Mensagens do tutor em modo Reta Final:
- Diretas e urgentes
- Foco em resultados
- Cobrança de metas diárias
- Celebração rápida, volta ao foco

---

## 8. Ordem de Implementação

1. ✅ Migration do banco de dados
2. ✅ Seed de categorias e mimos padrão
3. ✅ Endpoints básicos da loja
4. ✅ Sincronização preparatorios → store_items
5. ⬜ Interface admin da loja
6. ⬜ Página de loja no app
7. ⬜ Sistema de compras com moedas
8. ⬜ Integração pagamento (fase futura)
9. ⬜ Modo Reta Final (fase 2)

---

## 9. Notas Técnicas

- Usar React Query para cache de produtos
- Implementar optimistic updates para compras com moedas
- Webhooks para pagamentos externos (Stripe/Mercado Pago)
- Sistema de notificações para Reta Final
