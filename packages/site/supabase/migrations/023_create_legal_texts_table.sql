-- Create legal_texts table to store terms of service and privacy policy
-- These can be managed by admins through the admin panel

CREATE TABLE IF NOT EXISTS legal_texts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE legal_texts ENABLE ROW LEVEL SECURITY;

-- Public can read legal texts
CREATE POLICY "Legal texts are publicly readable"
  ON legal_texts
  FOR SELECT
  USING (true);

-- Only authenticated admins can insert/update
CREATE POLICY "Admins can manage legal texts"
  ON legal_texts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
    )
  );

-- Insert default legal texts in Portuguese (Brazil)
INSERT INTO legal_texts (id, title, content) VALUES
('terms_of_service', 'Termos de Uso',
'# Termos de Uso - Ouse Passar

**Última atualização:** ' || TO_CHAR(NOW(), 'DD/MM/YYYY') || '

## 1. Aceitação dos Termos

Ao acessar e utilizar a plataforma Ouse Passar, você concorda em cumprir e estar vinculado aos presentes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.

## 2. Descrição do Serviço

O Ouse Passar é uma plataforma educacional online que oferece:
- Conteúdo de estudo para concursos públicos
- Sistema de questões e simulados
- Acompanhamento de desempenho e estatísticas
- Recursos de gamificação para engajamento
- Planos de estudo personalizados

## 3. Cadastro e Conta do Usuário

### 3.1 Requisitos
Para utilizar nossos serviços, você deve:
- Ter pelo menos 18 anos de idade ou consentimento dos responsáveis legais
- Fornecer informações precisas e atualizadas durante o cadastro
- Manter a confidencialidade de sua senha

### 3.2 Responsabilidades
Você é responsável por:
- Todas as atividades realizadas em sua conta
- Manter suas informações de login seguras
- Notificar-nos imediatamente sobre qualquer uso não autorizado

## 4. Uso Aceitável

Você concorda em NÃO:
- Compartilhar sua conta com terceiros
- Copiar, reproduzir ou distribuir conteúdo da plataforma sem autorização
- Utilizar robôs, scrapers ou ferramentas automatizadas
- Violar direitos de propriedade intelectual
- Tentar acessar áreas restritas do sistema
- Utilizar a plataforma para fins ilegais ou não autorizados

## 5. Conteúdo e Propriedade Intelectual

### 5.1 Nosso Conteúdo
Todo conteúdo disponibilizado na plataforma (textos, questões, vídeos, imagens, etc.) é protegido por direitos autorais e propriedade intelectual do Ouse Passar ou de seus licenciadores.

### 5.2 Licença de Uso
Concedemos a você uma licença limitada, não exclusiva e intransferível para:
- Acessar e usar o conteúdo exclusivamente para fins de estudo pessoal
- Não permite distribuição, revenda ou uso comercial

## 6. Planos e Pagamentos

### 6.1 Assinaturas
- Os planos de assinatura são cobrados de forma recorrente conforme o período escolhido
- Você pode cancelar sua assinatura a qualquer momento
- Não oferecemos reembolsos proporcionais para cancelamentos

### 6.2 Alterações de Preço
Reservamo-nos o direito de alterar os preços de nossos planos mediante notificação prévia de 30 dias.

## 7. Privacidade e Proteção de Dados

O tratamento de seus dados pessoais está descrito em nossa Política de Privacidade, que faz parte integrante destes Termos de Uso.

## 8. Disponibilidade do Serviço

### 8.1 Manutenção
Podemos realizar manutenções programadas ou emergenciais que podem resultar em indisponibilidade temporária.

### 8.2 Modificações
Reservamo-nos o direito de:
- Modificar ou descontinuar recursos da plataforma
- Atualizar o conteúdo disponibilizado
- Alterar a estrutura ou funcionamento do serviço

## 9. Limitação de Responsabilidade

O Ouse Passar não se responsabiliza por:
- Aprovação em concursos ou exames
- Decisões tomadas com base no conteúdo da plataforma
- Interrupções no serviço causadas por terceiros
- Perda de dados devido a problemas técnicos

## 10. Rescisão

### 10.1 Por Você
Você pode cancelar sua conta a qualquer momento através das configurações da plataforma.

### 10.2 Por Nós
Podemos suspender ou encerrar sua conta se:
- Você violar estes Termos de Uso
- Houver suspeita de fraude ou uso indevido
- For necessário por questões legais ou regulatórias

## 11. Disposições Gerais

### 11.1 Alterações nos Termos
Podemos atualizar estes termos periodicamente. Notificaremos sobre alterações significativas.

### 11.2 Lei Aplicável
Estes termos são regidos pelas leis brasileiras.

### 11.3 Foro
Qualquer disputa será resolvida no foro da comarca de São Paulo/SP.

## 12. Contato

Para dúvidas sobre estes Termos de Uso, entre em contato:
- Email: contato@ousepassar.com.br
- Através do formulário de contato na plataforma

---

Ao utilizar a plataforma Ouse Passar, você declara ter lido, compreendido e concordado com estes Termos de Uso.'),

('privacy_policy', 'Política de Privacidade',
'# Política de Privacidade - Ouse Passar

**Última atualização:** ' || TO_CHAR(NOW(), 'DD/MM/YYYY') || '

## 1. Introdução

Esta Política de Privacidade descreve como o Ouse Passar ("nós", "nosso" ou "plataforma") coleta, usa, armazena e protege seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).

## 2. Responsável pelo Tratamento de Dados

**Razão Social:** Ouse Passar Educação Ltda.
**Email:** privacidade@ousepassar.com.br
**Encarregado de Dados (DPO):** dpo@ousepassar.com.br

## 3. Dados Coletados

### 3.1 Dados Fornecidos por Você

**Ao se cadastrar:**
- Nome completo
- Email
- Senha (armazenada de forma criptografada)
- CPF (quando necessário para emissão de certificados)

**Durante o uso da plataforma:**
- Preferências de estudo
- Respostas às questões
- Progresso e desempenho
- Comentários e feedbacks

### 3.2 Dados Coletados Automaticamente

- Endereço IP
- Informações do dispositivo (tipo, sistema operacional)
- Informações do navegador
- Dados de navegação e interação com a plataforma
- Cookies e tecnologias similares

### 3.3 Dados de Terceiros

Podemos receber dados de:
- Plataformas de pagamento (confirmação de transações)
- Redes sociais (se você optar por login social)
- Ferramentas de análise de dados

## 4. Finalidade do Tratamento de Dados

Utilizamos seus dados para:

### 4.1 Prestação do Serviço
- Criar e gerenciar sua conta
- Fornecer acesso ao conteúdo
- Processar pagamentos
- Enviar comunicações sobre o serviço

### 4.2 Personalização
- Adaptar o conteúdo às suas necessidades
- Recomendar materiais de estudo
- Criar planos personalizados
- Analisar seu desempenho

### 4.3 Melhorias e Desenvolvimento
- Melhorar a experiência do usuário
- Desenvolver novos recursos
- Realizar pesquisas e análises
- Identificar e corrigir problemas técnicos

### 4.4 Comunicação
- Enviar atualizações sobre o serviço
- Notificações de progresso e conquistas
- Newsletters educacionais (se você optar por receber)
- Suporte ao cliente

### 4.5 Segurança
- Prevenir fraudes
- Proteger contra abusos
- Cumprir obrigações legais

## 5. Base Legal para Tratamento

Tratamos seus dados com base em:
- **Execução de contrato:** Para fornecer os serviços contratados
- **Consentimento:** Para envio de comunicações de marketing
- **Legítimo interesse:** Para melhoria dos serviços e segurança
- **Obrigação legal:** Para cumprimento de leis e regulamentações

## 6. Compartilhamento de Dados

### 6.1 Não Vendemos seus Dados

Nunca vendemos, alugamos ou comercializamos seus dados pessoais.

### 6.2 Compartilhamento Permitido

Podemos compartilhar dados com:

**Prestadores de Serviço:**
- Hospedagem e infraestrutura (AWS, Supabase)
- Processamento de pagamentos (Stripe, PagSeguro)
- Análise de dados (Google Analytics)
- Email e notificações (SendGrid)

**Cumprimento Legal:**
- Autoridades governamentais quando exigido por lei
- Em resposta a processos legais

**Proteção de Direitos:**
- Para proteger nossos direitos legais
- Para prevenir fraudes ou atividades ilegais

### 6.3 Transferência Internacional

Alguns de nossos prestadores podem estar localizados fora do Brasil. Garantimos que essas transferências seguem os requisitos da LGPD.

## 7. Armazenamento e Segurança

### 7.1 Medidas de Segurança

Implementamos medidas técnicas e organizacionais:
- Criptografia de dados sensíveis (SSL/TLS)
- Senhas armazenadas com hash
- Controle de acesso restrito
- Monitoramento de segurança
- Backups regulares
- Firewall e proteção contra ataques

### 7.2 Período de Retenção

Mantemos seus dados enquanto:
- Sua conta estiver ativa
- For necessário para cumprir obrigações legais
- Para resolver disputas

Após o cancelamento da conta, dados podem ser mantidos por:
- Dados fiscais: 5 anos (obrigação legal)
- Dados de suporte: até 2 anos
- Dados anonimizados: indefinidamente para análises estatísticas

## 8. Seus Direitos (LGPD)

Você tem direito a:

### 8.1 Acesso
- Confirmar se tratamos seus dados
- Acessar seus dados pessoais

### 8.2 Correção
- Corrigir dados incompletos ou desatualizados

### 8.3 Exclusão
- Solicitar a exclusão de dados desnecessários ou tratados sem base legal

### 8.4 Portabilidade
- Receber seus dados em formato estruturado

### 8.5 Oposição
- Opor-se a tratamentos realizados sem consentimento

### 8.6 Revogação de Consentimento
- Retirar consentimento a qualquer momento

### 8.7 Informação
- Saber com quem compartilhamos seus dados

### 8.8 Anonimização/Bloqueio
- Solicitar anonimização ou bloqueio de dados

**Como exercer seus direitos:**
- Através das configurações da sua conta
- Email para: privacidade@ousepassar.com.br
- Responderemos em até 15 dias

## 9. Cookies

### 9.1 O que são Cookies

Cookies são pequenos arquivos de texto armazenados em seu dispositivo.

### 9.2 Tipos de Cookies que Usamos

**Essenciais:**
- Necessários para funcionamento da plataforma
- Login e autenticação
- Segurança

**Funcionais:**
- Lembrar preferências
- Personalização da experiência

**Analíticos:**
- Entender como você usa a plataforma
- Melhorar nossos serviços

**Marketing:**
- Comunicações relevantes
- Campanhas publicitárias

### 9.3 Gerenciamento de Cookies

Você pode gerenciar cookies através:
- Configurações do navegador
- Nossas configurações de privacidade
- Ferramentas de opt-out de terceiros

## 10. Menores de Idade

Nossos serviços são destinados a maiores de 18 anos. Se você tiver entre 13 e 18 anos, precisa do consentimento dos responsáveis legais.

Não coletamos intencionalmente dados de menores de 13 anos. Se identificarmos tal coleta, excluiremos os dados imediatamente.

## 11. Alterações nesta Política

Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas através de:
- Email cadastrado
- Aviso na plataforma
- Notificação push

Recomendamos revisar esta política regularmente.

## 12. Legislação Aplicável

Esta política é regida pela legislação brasileira, especialmente a LGPD (Lei nº 13.709/2018).

## 13. Contato e Reclamações

### 13.1 Entre em Contato

Para dúvidas ou solicitações sobre privacidade:
- **Email:** privacidade@ousepassar.com.br
- **DPO:** dpo@ousepassar.com.br
- **Formulário:** Disponível nas configurações da conta

### 13.2 Autoridade de Proteção de Dados

Você tem o direito de apresentar reclamação à:
**ANPD - Autoridade Nacional de Proteção de Dados**
- Site: www.gov.br/anpd

---

Ao utilizar a plataforma Ouse Passar, você declara ter lido e compreendido esta Política de Privacidade.')

ON CONFLICT (id) DO NOTHING;
