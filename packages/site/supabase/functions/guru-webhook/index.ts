import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Tipos de eventos da Guru
type GuruEventType =
  | 'transaction.created'
  | 'transaction.approved'
  | 'transaction.refused'
  | 'transaction.refunded'
  | 'transaction.chargeback'
  | 'transaction.canceled'
  | 'subscription.created'
  | 'subscription.activated'
  | 'subscription.canceled'
  | 'subscription.renewed';

interface GuruWebhookPayload {
  event: GuruEventType;
  timestamp: string;
  data: {
    transaction_id?: string;
    subscription_id?: string;
    product_id?: string;
    status?: string;
    amount?: number;
    currency?: string;
    payment_method?: string;
    customer?: {
      email?: string;
      name?: string;
      doc?: string;
      phone?: string;
    };
    // Outros campos que a Guru pode enviar
    [key: string]: any;
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-guru-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Apenas aceitar POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Criar cliente Supabase com service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar assinatura do webhook (opcional, mas recomendado)
    const guruSignature = req.headers.get('x-guru-signature');
    const guruWebhookSecret = Deno.env.get('GURU_WEBHOOK_SECRET');

    // TODO: Implementar verificação de assinatura quando a Guru fornecer
    // if (guruWebhookSecret && guruSignature) {
    //   const isValid = verifySignature(payload, guruSignature, guruWebhookSecret);
    //   if (!isValid) return new Response('Invalid signature', { status: 401 });
    // }

    // Parse do payload
    const payload: GuruWebhookPayload = await req.json();
    console.log('[Guru Webhook] Received event:', payload.event);

    // Extrair dados
    const {
      event,
      timestamp,
      data
    } = payload;

    const transactionId = data.transaction_id || '';
    const productId = data.product_id || '';
    const subscriptionId = data.subscription_id || '';
    const customerEmail = data.customer?.email?.toLowerCase() || '';
    const customerName = data.customer?.name || '';
    const customerDoc = data.customer?.doc || '';

    // 1. Registrar transação no log
    const { data: logEntry, error: logError } = await supabase
      .from('guru_transactions')
      .insert({
        guru_transaction_id: transactionId,
        guru_product_id: productId,
        guru_subscription_id: subscriptionId,
        event_type: event,
        event_timestamp: timestamp,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_doc: customerDoc,
        amount: data.amount,
        currency: data.currency || 'BRL',
        payment_method: data.payment_method,
        status: data.status,
        raw_payload: payload,
        processed: false
      })
      .select()
      .single();

    if (logError) {
      console.error('[Guru Webhook] Error logging transaction:', logError);
      // Continuar mesmo com erro de log
    }

    // 2. Encontrar usuário pelo email
    let userId: string | null = null;

    if (customerEmail) {
      // Primeiro, tentar encontrar na auth.users
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const authUser = authUsers?.users?.find(
        u => u.email?.toLowerCase() === customerEmail
      );

      if (authUser) {
        userId = authUser.id;
      } else {
        // Fallback: buscar em admin_users ou leads
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('id')
          .ilike('email', customerEmail)
          .single();

        if (adminUser) {
          userId = adminUser.id;
        }
      }
    }

    // 3. Encontrar preparatório pelo product_id da Guru
    let preparatorioId: string | null = null;
    let productType: string | null = null;

    if (productId) {
      const { data: prepData } = await supabase
        .rpc('find_preparatorio_by_guru_product', { p_guru_product_id: productId });

      if (prepData && prepData.length > 0) {
        preparatorioId = prepData[0].preparatorio_id;
        productType = prepData[0].product_type;
      }
    }

    // 4. Processar evento
    let userProductId: string | null = null;
    let processingError: string | null = null;

    if (userId && preparatorioId && productType) {
      try {
        switch (event) {
          // Eventos de aprovação - conceder acesso
          case 'transaction.approved':
          case 'subscription.activated':
          case 'subscription.renewed': {
            const { data: grantResult } = await supabase
              .rpc('grant_product_access', {
                p_user_id: userId,
                p_preparatorio_id: preparatorioId,
                p_product_type: productType,
                p_guru_transaction_id: transactionId,
                p_guru_subscription_id: subscriptionId,
                p_guru_product_id: productId
              });

            userProductId = grantResult;
            console.log(`[Guru Webhook] Access granted: user=${userId}, product=${productType}`);
            break;
          }

          // Eventos de cancelamento - revogar acesso
          case 'transaction.refunded': {
            await supabase.rpc('revoke_product_access', {
              p_user_id: userId,
              p_preparatorio_id: preparatorioId,
              p_product_type: productType,
              p_reason: 'refunded'
            });
            console.log(`[Guru Webhook] Access revoked (refund): user=${userId}, product=${productType}`);
            break;
          }

          case 'transaction.chargeback': {
            await supabase.rpc('revoke_product_access', {
              p_user_id: userId,
              p_preparatorio_id: preparatorioId,
              p_product_type: productType,
              p_reason: 'chargeback'
            });
            console.log(`[Guru Webhook] Access revoked (chargeback): user=${userId}, product=${productType}`);
            break;
          }

          case 'transaction.canceled':
          case 'subscription.canceled': {
            await supabase.rpc('revoke_product_access', {
              p_user_id: userId,
              p_preparatorio_id: preparatorioId,
              p_product_type: productType,
              p_reason: 'canceled'
            });
            console.log(`[Guru Webhook] Access revoked (canceled): user=${userId}, product=${productType}`);
            break;
          }

          // Eventos informativos - apenas log
          case 'transaction.created':
          case 'transaction.refused':
          case 'subscription.created': {
            console.log(`[Guru Webhook] Informational event: ${event}`);
            break;
          }

          default:
            console.log(`[Guru Webhook] Unknown event type: ${event}`);
        }
      } catch (err: any) {
        processingError = err.message;
        console.error('[Guru Webhook] Processing error:', err);
      }
    } else {
      // Logar motivo do não processamento
      if (!userId) processingError = `User not found for email: ${customerEmail}`;
      else if (!preparatorioId) processingError = `Preparatorio not found for product: ${productId}`;
      else if (!productType) processingError = `Product type not determined`;

      console.warn('[Guru Webhook] Could not process:', processingError);
    }

    // 5. Atualizar log com resultado do processamento
    if (logEntry?.id) {
      await supabase
        .from('guru_transactions')
        .update({
          processed: !processingError,
          processed_at: new Date().toISOString(),
          processing_error: processingError,
          user_id: userId,
          preparatorio_id: preparatorioId,
          user_product_id: userProductId
        })
        .eq('id', logEntry.id);
    }

    // Retornar sucesso (sempre 200 para não reprocessar)
    return new Response(
      JSON.stringify({
        success: true,
        event,
        processed: !processingError,
        error: processingError
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[Guru Webhook] Fatal error:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
