import { BancaWithDetails } from '../../../services/externalQuestionsService';

// Ordenar itens com selecionados no topo
export function sortWithSelectedFirst<T>(items: T[], selected: T[]): T[] {
  const selectedSet = new Set(selected);
  const selectedItems = items.filter(item => selectedSet.has(item));
  const unselectedItems = items.filter(item => !selectedSet.has(item));
  return [...selectedItems, ...unselectedItems];
}

// Normalizar texto removendo acentos e convertendo para minusculo
export function normalizeText(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Filtrar valores validos (remove undefined, null, strings vazias)
export function filterValid<T>(arr: T[]): T[] {
  return arr.filter(item => item !== undefined && item !== null && item !== '');
}

// Formatar nome da banca usando sigla do banco de dados
export function formatBancaDisplay(banca: string, allBancasWithDetails: BancaWithDetails[]): string {
  const bancaDetails = allBancasWithDetails.find(b => b.nome === banca);
  if (bancaDetails?.sigla) {
    return `${bancaDetails.sigla} - ${banca}`;
  }
  return banca;
}

// Obter o ID da banca pelo nome
export function getBancaId(bancaNome: string, allBancasWithDetails: BancaWithDetails[]): string | undefined {
  const bancaDetails = allBancasWithDetails.find(b => b.nome === bancaNome);
  return bancaDetails?.id;
}

// Verificar se banca corresponde a busca (sigla ou nome)
export function bancaMatchesSearch(
  banca: string,
  search: string,
  allBancasWithDetails: BancaWithDetails[]
): boolean {
  const searchNormalized = normalizeText(search);
  const bancaNormalized = normalizeText(banca);
  const displayNormalized = normalizeText(formatBancaDisplay(banca, allBancasWithDetails));

  return bancaNormalized.includes(searchNormalized) || displayNormalized.includes(searchNormalized);
}
