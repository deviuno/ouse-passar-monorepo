const MASTRA_API_URL = import.meta.env.VITE_MASTRA_API_URL || 'http://localhost:4000';

// ==================== TIPOS ====================

export interface ParsedSubtopico {
  titulo: string;
  _tempId?: string;
}

export interface ParsedTopico {
  titulo: string;
  subtopicos: ParsedSubtopico[];
  _tempId?: string;
  _expanded?: boolean;
}

export interface ParsedMateria {
  titulo: string;
  topicos: ParsedTopico[];
  _tempId?: string;
  _expanded?: boolean;
}

export interface ParsedBloco {
  titulo: string;
  materias: ParsedMateria[];
  _tempId?: string;
  _expanded?: boolean;
}

export interface ParsedEdital {
  blocos: ParsedBloco[];
}

export type EditalExistsAction = 'clear' | 'merge' | 'cancel';

// ==================== HELPERS ====================

// Gera IDs temporarios para uso na UI
let tempIdCounter = 0;
const generateTempId = () => `temp-${++tempIdCounter}-${Date.now()}`;

// Adiciona IDs temporarios a estrutura parseada
export const addTempIds = (parsed: ParsedEdital): ParsedEdital => {
  return {
    blocos: parsed.blocos.map(bloco => ({
      ...bloco,
      _tempId: generateTempId(),
      _expanded: true,
      materias: bloco.materias.map(materia => ({
        ...materia,
        _tempId: generateTempId(),
        _expanded: true,
        topicos: materia.topicos.map(topico => ({
          ...topico,
          _tempId: generateTempId(),
          _expanded: topico.subtopicos.length > 0,
          subtopicos: topico.subtopicos.map(sub => ({
            ...sub,
            _tempId: generateTempId(),
          })),
        })),
      })),
    })),
  };
};

// Conta itens na estrutura
export const countItems = (parsed: ParsedEdital) => {
  let blocos = 0;
  let materias = 0;
  let topicos = 0;
  let subtopicos = 0;

  parsed.blocos.forEach(bloco => {
    blocos++;
    bloco.materias.forEach(materia => {
      materias++;
      materia.topicos.forEach(topico => {
        topicos++;
        subtopicos += topico.subtopicos.length;
      });
    });
  });

  return { blocos, materias, topicos, subtopicos };
};

// ==================== SERVICO ====================

export const editalAIService = {
  async parseEdital(texto: string): Promise<ParsedEdital> {
    const response = await fetch(`${MASTRA_API_URL}/api/edital/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erro ao processar edital');
    }

    // Adiciona IDs temporarios para a UI
    return addTempIds(result.data);
  },
};
