import React from 'react';
import { motion } from 'framer-motion';
import { Clock, FileText, Trophy, Lock, Play, CheckCircle } from 'lucide-react';
import { Card, Button, StaggerContainer, StaggerItem } from '../components/ui';

interface Simulado {
  id: string;
  nome: string;
  duracao: number;
  questoes: number;
  isPremium: boolean;
  isCompleted: boolean;
  score?: number;
  ranking?: number;
}

const SIMULADOS: Simulado[] = [
  { id: '1', nome: 'Simulado PRF 2024 - Modelo 1', duracao: 180, questoes: 120, isPremium: false, isCompleted: true, score: 78, ranking: 234 },
  { id: '2', nome: 'Simulado PRF 2024 - Modelo 2', duracao: 180, questoes: 120, isPremium: false, isCompleted: false },
  { id: '3', nome: 'Simulado Intensivo - Direito', duracao: 60, questoes: 40, isPremium: true, isCompleted: false },
  { id: '4', nome: 'Simulado Final - Prova Completa', duracao: 240, questoes: 150, isPremium: true, isCompleted: false },
];

function SimuladoCard({ simulado }: { simulado: Simulado }) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}min` : ''}` : `${mins}min`;
  };

  return (
    <Card
      hoverable
      onClick={() => !simulado.isPremium && console.log('Start simulado', simulado.id)}
      className={simulado.isPremium ? 'relative overflow-hidden' : ''}
    >
      {/* Premium Badge */}
      {simulado.isPremium && (
        <div className="absolute top-0 right-0 bg-[#FFB800] text-black text-xs font-bold px-3 py-1 rounded-bl-xl">
          PREMIUM
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`
            w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
            ${simulado.isCompleted ? 'bg-[#2ECC71]/20' : simulado.isPremium ? 'bg-[#FFB800]/20' : 'bg-[#3498DB]/20'}
          `}
        >
          {simulado.isCompleted ? (
            <CheckCircle size={24} className="text-[#2ECC71]" />
          ) : simulado.isPremium ? (
            <Lock size={24} className="text-[#FFB800]" />
          ) : (
            <FileText size={24} className="text-[#3498DB]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium mb-1 truncate">{simulado.nome}</h3>

          <div className="flex items-center gap-4 text-sm text-[#6E6E6E]">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{formatDuration(simulado.duracao)}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText size={14} />
              <span>{simulado.questoes} questoes</span>
            </div>
          </div>

          {/* Completed Stats */}
          {simulado.isCompleted && (
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <span className="text-[#2ECC71] font-bold">{simulado.score}%</span>
                <span className="text-[#6E6E6E] text-sm">acerto</span>
              </div>
              {simulado.ranking && (
                <div className="flex items-center gap-1">
                  <Trophy size={14} className="text-[#FFB800]" />
                  <span className="text-[#A0A0A0] text-sm">#{simulado.ranking}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0">
          {simulado.isCompleted ? (
            <button className="text-[#3498DB] text-sm hover:underline">
              Ver Resultado
            </button>
          ) : simulado.isPremium ? (
            <Button size="sm" variant="secondary">
              Desbloquear
            </Button>
          ) : (
            <Button size="sm" leftIcon={<Play size={16} />}>
              Iniciar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function SimuladosPage() {
  const completedSimulados = SIMULADOS.filter((s) => s.isCompleted);
  const availableSimulados = SIMULADOS.filter((s) => !s.isCompleted && !s.isPremium);
  const premiumSimulados = SIMULADOS.filter((s) => s.isPremium);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Meus Simulados</h1>
        <p className="text-[#A0A0A0]">
          Simule a prova real com cronometro e ranking
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="text-center">
          <p className="text-2xl font-bold text-white">{completedSimulados.length}</p>
          <p className="text-[#6E6E6E] text-xs">Realizados</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-[#2ECC71]">
            {completedSimulados.length > 0
              ? Math.round(completedSimulados.reduce((acc, s) => acc + (s.score || 0), 0) / completedSimulados.length)
              : 0}%
          </p>
          <p className="text-[#6E6E6E] text-xs">Media Geral</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-[#FFB800]">
            #{completedSimulados[0]?.ranking || '-'}
          </p>
          <p className="text-[#6E6E6E] text-xs">Melhor Ranking</p>
        </Card>
      </div>

      {/* Available Simulados */}
      {availableSimulados.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Disponiveis</h2>
          <StaggerContainer className="space-y-3">
            {availableSimulados.map((simulado) => (
              <StaggerItem key={simulado.id}>
                <SimuladoCard simulado={simulado} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      )}

      {/* Completed Simulados */}
      {completedSimulados.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Realizados</h2>
          <StaggerContainer className="space-y-3">
            {completedSimulados.map((simulado) => (
              <StaggerItem key={simulado.id}>
                <SimuladoCard simulado={simulado} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      )}

      {/* Premium Simulados */}
      {premiumSimulados.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            Premium
            <span className="text-[#FFB800]">✨</span>
          </h2>
          <StaggerContainer className="space-y-3">
            {premiumSimulados.map((simulado) => (
              <StaggerItem key={simulado.id}>
                <SimuladoCard simulado={simulado} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      )}
    </div>
  );
}
