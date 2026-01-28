import { FileText, Building2, DollarSign } from 'lucide-react';
import { StepConfig } from './types';

export const STEPS: StepConfig[] = [
  { id: 1, title: 'Geral', description: 'Informações básicas', icon: FileText },
  { id: 2, title: 'Técnico', description: 'Dados do concurso', icon: Building2 },
  { id: 3, title: 'Detalhes', description: 'Vagas e datas', icon: FileText },
  { id: 4, title: 'Vendas', description: 'Preços e checkout', icon: DollarSign },
];

export const NIVEIS = [
  { value: 'fundamental', label: 'Fundamental' },
  { value: 'medio', label: 'Médio' },
  { value: 'superior', label: 'Superior' },
];

export const MODALIDADES = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'remoto', label: 'Remoto' },
  { value: 'hibrido', label: 'Híbrido' },
];

export const TIPOS_QUESTAO = [
  { value: 'multipla_escolha', label: 'Múltipla Escolha' },
  { value: 'certo_errado', label: 'Certo/Errado' },
];

export const ESCOLARIDADES = [
  { value: '', label: 'Selecione...' },
  { value: 'fundamental', label: 'Ensino Fundamental' },
  { value: 'medio', label: 'Ensino Médio' },
  { value: 'tecnico', label: 'Ensino Técnico' },
  { value: 'superior', label: 'Ensino Superior' },
  { value: 'pos_graduacao', label: 'Pós-Graduação' },
];

export const REGIOES = [
  'Nacional',
  'Norte',
  'Nordeste',
  'Centro-Oeste',
  'Sudeste',
  'Sul',
  'Acre (AC)',
  'Alagoas (AL)',
  'Amapá (AP)',
  'Amazonas (AM)',
  'Bahia (BA)',
  'Ceará (CE)',
  'Distrito Federal (DF)',
  'Espírito Santo (ES)',
  'Goiás (GO)',
  'Maranhão (MA)',
  'Mato Grosso (MT)',
  'Mato Grosso do Sul (MS)',
  'Minas Gerais (MG)',
  'Pará (PA)',
  'Paraíba (PB)',
  'Paraná (PR)',
  'Pernambuco (PE)',
  'Piauí (PI)',
  'Rio de Janeiro (RJ)',
  'Rio Grande do Norte (RN)',
  'Rio Grande do Sul (RS)',
  'Rondônia (RO)',
  'Roraima (RR)',
  'Santa Catarina (SC)',
  'São Paulo (SP)',
  'Sergipe (SE)',
  'Tocantins (TO)',
];
