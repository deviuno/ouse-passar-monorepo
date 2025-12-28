-- Migration: Sistema de Tickets de Suporte
-- Permite que usuários criem tickets de ajuda

-- Criar tabela de tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Informações do usuário (snapshot)
  user_name TEXT,
  user_email TEXT,

  -- Dados do ticket
  motivo TEXT NOT NULL CHECK (motivo IN (
    'duvida_acesso',
    'problema_tecnico',
    'erro_pagamento',
    'cancelamento',
    'sugestao',
    'reclamacao',
    'outro'
  )),
  motivo_outro TEXT, -- Quando motivo = 'outro'
  mensagem TEXT NOT NULL,

  -- Arquivos anexados (array de URLs do Storage)
  anexos JSONB DEFAULT '[]'::jsonb,

  -- Status e resolução
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN (
    'aberto',
    'em_andamento',
    'aguardando_usuario',
    'resolvido',
    'fechado'
  )),
  prioridade TEXT NOT NULL DEFAULT 'normal' CHECK (prioridade IN (
    'baixa',
    'normal',
    'alta',
    'urgente'
  )),

  -- Resposta do admin
  admin_id UUID REFERENCES auth.users(id),
  admin_resposta TEXT,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de mensagens do ticket (histórico de conversas)
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  mensagem TEXT NOT NULL,
  anexos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_prioridade ON tickets(prioridade);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tickets_updated_at ON tickets;
CREATE TRIGGER trigger_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_tickets_updated_at();

-- RLS (Row Level Security)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para tickets

-- Usuários autenticados podem criar tickets
CREATE POLICY "Users can create tickets" ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem ver seus próprios tickets
CREATE POLICY "Users can view own tickets" ON tickets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Acesso público para admin (painel admin não usa Supabase Auth)
CREATE POLICY "Public read access for admin" ON tickets
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public update access for admin" ON tickets
  FOR UPDATE
  TO public
  USING (true);

-- Políticas para ticket_messages

-- Usuários podem criar mensagens em seus tickets
CREATE POLICY "Users can create messages in own tickets" ON ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM tickets WHERE id = ticket_id AND user_id = auth.uid())
    OR sender_type = 'admin'
  );

-- Usuários podem ver mensagens de seus tickets
CREATE POLICY "Users can view messages of own tickets" ON ticket_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM tickets WHERE id = ticket_id AND user_id = auth.uid())
  );

-- Acesso público para admin
CREATE POLICY "Public read access for admin messages" ON ticket_messages
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public insert access for admin messages" ON ticket_messages
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE tickets IS 'Tickets de suporte criados pelos usuários';
COMMENT ON TABLE ticket_messages IS 'Histórico de mensagens dos tickets';
COMMENT ON COLUMN tickets.motivo IS 'Tipo: duvida_acesso, problema_tecnico, erro_pagamento, cancelamento, sugestao, reclamacao, outro';
COMMENT ON COLUMN tickets.status IS 'Status: aberto, em_andamento, aguardando_usuario, resolvido, fechado';
COMMENT ON COLUMN tickets.anexos IS 'Array de objetos com informações dos arquivos anexados';
