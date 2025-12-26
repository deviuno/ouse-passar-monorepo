import React, { useMemo } from 'react';
import { Flame, Clock, AlertTriangle } from 'lucide-react';
import { RETA_FINAL_THEME } from '../../services/retaFinalService';

interface RetaFinalCountdownProps {
  dataProva?: string; // formato: YYYY-MM-DD
  userName?: string;
}

// Mensagens motivacionais por dia (dias 1-30)
const MENSAGENS_POR_DIA: Record<number, string> = {
  1: 'HOJE! A hora chegou. Confie no que você estudou. Você está pronto!',
  2: 'Amanhã é o grande dia! Descanse bem e confie na sua preparação.',
  3: 'Faltam 3 dias! Revise apenas os pontos principais. Nada de desespero!',
  4: 'Faltam 4 dias! Mantenha o foco e revise os temas mais importantes.',
  5: 'Faltam 5 dias! Continue firme, cada minuto de estudo conta agora.',
  6: 'Faltam 6 dias! Você está na reta final. Não desista!',
  7: 'Uma semana! 7 dias para brilhar. Mantenha a intensidade!',
  8: 'Faltam 8 dias! O sucesso está próximo. Continue estudando!',
  9: 'Faltam 9 dias! Cada questão resolvida te aproxima da aprovação.',
  10: 'Faltam 10 dias! Você já percorreu muito. Não pare agora!',
  11: 'Faltam 11 dias! A persistência vai te levar longe.',
  12: 'Faltam 12 dias! Concentre-se no que mais cai na prova.',
  13: 'Faltam 13 dias! Sua dedicação vai fazer a diferença.',
  14: 'Duas semanas! 14 dias para consolidar tudo que você aprendeu.',
  15: 'Faltam 15 dias! Metade do mês. Intensifique os estudos!',
  16: 'Faltam 16 dias! Não existe sorte, existe preparação.',
  17: 'Faltam 17 dias! Quem estuda mais, erra menos.',
  18: 'Faltam 18 dias! Cada dia é uma oportunidade de melhorar.',
  19: 'Faltam 19 dias! Você está construindo sua aprovação.',
  20: 'Faltam 20 dias! Não fique parado! A prova não espera.',
  21: 'Três semanas! 21 dias para fazer a diferença.',
  22: 'Faltam 22 dias! Sua aprovação está sendo construída agora.',
  23: 'Faltam 23 dias! Cada questão certa é um passo à frente.',
  24: 'Faltam 24 dias! Mantenha a consistência nos estudos.',
  25: 'Faltam 25 dias! O esforço de hoje é a vitória de amanhã.',
  26: 'Faltam 26 dias! Não deixe para depois o que pode estudar agora.',
  27: 'Faltam 27 dias! Você já está à frente de quem não começou.',
  28: 'Quatro semanas! 28 dias para se tornar um aprovado.',
  29: 'Faltam 29 dias! A disciplina vai te levar onde a motivação não alcança.',
  30: 'Faltam 30 dias! Um mês para a prova. É hora de intensificar!',
};

// Mensagem para mais de 30 dias
const MENSAGEM_MAIS_30_DIAS = 'Você está no caminho certo! Continue focado e consistente nos estudos.';

// Mensagem quando a prova já passou
const MENSAGEM_PROVA_PASSOU = 'Esperamos que você tenha ido bem na prova! Continue estudando para os próximos desafios.';

function calcularDiasRestantes(dataProva: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const prova = new Date(dataProva + 'T00:00:00');

  const diffTime = prova.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

function getMensagemMotivacional(dias: number, nome?: string): string {
  const nomeDisplay = nome?.split(' ')[0] || 'Concurseiro';

  if (dias < 0) {
    return MENSAGEM_PROVA_PASSOU;
  }

  if (dias === 0) {
    return MENSAGENS_POR_DIA[1].replace('!', `, ${nomeDisplay}!`);
  }

  const mensagem = MENSAGENS_POR_DIA[dias] || MENSAGEM_MAIS_30_DIAS;

  // Adiciona o nome na mensagem de forma natural
  if (dias <= 30) {
    // Para mensagens específicas, adiciona o nome no final da primeira frase
    const partes = mensagem.split('!');
    if (partes.length > 1) {
      return `${partes[0]}, ${nomeDisplay}!${partes.slice(1).join('!')}`;
    }
  }

  return `${nomeDisplay}, ${mensagem.charAt(0).toLowerCase()}${mensagem.slice(1)}`;
}

function getUrgencyLevel(dias: number): 'critical' | 'high' | 'medium' | 'low' {
  if (dias <= 3) return 'critical';
  if (dias <= 7) return 'high';
  if (dias <= 14) return 'medium';
  return 'low';
}

export function RetaFinalCountdown({ dataProva, userName }: RetaFinalCountdownProps) {
  const countdownData = useMemo(() => {
    if (!dataProva) return null;

    const dias = calcularDiasRestantes(dataProva);
    const mensagem = getMensagemMotivacional(dias, userName);
    const urgency = getUrgencyLevel(dias);

    return { dias, mensagem, urgency };
  }, [dataProva, userName]);

  if (!countdownData || countdownData.dias < 0) return null;

  const { dias, mensagem, urgency } = countdownData;

  const urgencyStyles = {
    critical: {
      bg: 'bg-gradient-to-r from-red-900/40 to-orange-900/40',
      border: 'border-red-500/50',
      icon: AlertTriangle,
      iconColor: 'text-red-400',
      daysColor: 'text-red-400',
    },
    high: {
      bg: 'bg-gradient-to-r from-orange-900/30 to-yellow-900/30',
      border: 'border-orange-500/50',
      icon: Flame,
      iconColor: 'text-orange-400',
      daysColor: 'text-orange-400',
    },
    medium: {
      bg: `bg-gradient-to-r from-[${RETA_FINAL_THEME.colors.primary}20] to-[${RETA_FINAL_THEME.colors.accent}20]`,
      border: `border-[${RETA_FINAL_THEME.colors.primary}50]`,
      icon: Flame,
      iconColor: 'text-yellow-400',
      daysColor: 'text-yellow-400',
    },
    low: {
      bg: 'bg-[#1F1F1F]',
      border: 'border-[#3A3A3A]',
      icon: Clock,
      iconColor: 'text-gray-400',
      daysColor: 'text-gray-300',
    },
  };

  const style = urgencyStyles[urgency];
  const IconComponent = style.icon;

  return (
    <div
      className={`rounded-xl p-4 border ${style.bg} ${style.border} mb-4`}
      style={{
        background: urgency === 'medium'
          ? `linear-gradient(135deg, ${RETA_FINAL_THEME.colors.primary}15 0%, ${RETA_FINAL_THEME.colors.accent}15 100%)`
          : undefined,
        borderColor: urgency === 'medium' ? `${RETA_FINAL_THEME.colors.primary}40` : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${urgency === 'critical' ? 'bg-red-500/20 animate-pulse' : 'bg-white/5'}`}>
          <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-lg font-bold ${style.daysColor}`}>
              {dias === 0 ? 'HOJE!' : dias === 1 ? 'AMANHÃ!' : `${dias} dias`}
            </span>
            <span className="text-gray-500 text-sm">para a prova</span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            {mensagem}
          </p>
        </div>
      </div>
    </div>
  );
}

export default RetaFinalCountdown;
