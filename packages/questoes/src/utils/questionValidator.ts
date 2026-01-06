/**
 * Utilitário para validar e detectar questões corrompidas
 */

// Padrões que indicam HTML corrompido (templates AngularJS, etc)
const CORRUPTED_PATTERNS = [
  /ng-if\s*=/gi,
  /ng-repeat\s*=/gi,
  /ng-model\s*=/gi,
  /ng-click\s*=/gi,
  /ng-class\s*=/gi,
  /ng-scope/gi,
  /<!--\s*ngIf:/gi,
  /<!--\s*ngRepeat:/gi,
  /\{\{[^}]+\}\}/g,  // AngularJS bindings
  /vm\.\w+/gi,       // vm.questao, etc
  /tec-\w+\s*=/gi,   // tec-* attributes
  /aria-labelledby/gi,
];

export interface QuestionValidation {
  isValid: boolean;
  isCorrupted: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Detecta se o conteúdo contém padrões de HTML corrompido
 */
export function detectCorruptedContent(content: string | null | undefined): boolean {
  if (!content) return false;

  for (const pattern of CORRUPTED_PATTERNS) {
    if (pattern.test(content)) {
      // Reset regex lastIndex
      pattern.lastIndex = 0;
      return true;
    }
  }

  return false;
}

/**
 * Valida uma questão e retorna informações sobre problemas encontrados
 */
export function validateQuestion(question: {
  enunciado?: string | null;
  parsedAlternativas?: Array<{ letter: string; text: string }>;
  gabarito?: string | null;
}): QuestionValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  let isCorrupted = false;

  // Verificar enunciado
  if (!question.enunciado) {
    errors.push('Questão sem enunciado');
  } else {
    // Verificar se está corrompido
    if (detectCorruptedContent(question.enunciado)) {
      isCorrupted = true;
      errors.push('Enunciado contém código corrompido');
    }

    // Verificar se é muito curto
    const cleanText = question.enunciado.replace(/<[^>]*>/g, '').trim();
    if (cleanText.length < 10) {
      warnings.push('Enunciado muito curto');
    }
  }

  // Verificar alternativas
  if (!question.parsedAlternativas || question.parsedAlternativas.length === 0) {
    errors.push('Questão sem alternativas');
  } else if (question.parsedAlternativas.length < 2) {
    errors.push('Questão com menos de 2 alternativas');
  } else {
    // Verificar cada alternativa
    for (const alt of question.parsedAlternativas) {
      if (!alt.text || alt.text.trim().length === 0) {
        warnings.push(`Alternativa ${alt.letter} sem texto`);
      }
      if (detectCorruptedContent(alt.text)) {
        isCorrupted = true;
        errors.push(`Alternativa ${alt.letter} contém código corrompido`);
      }
    }
  }

  // Verificar gabarito
  if (!question.gabarito) {
    warnings.push('Questão sem gabarito definido');
  } else if (question.parsedAlternativas) {
    const validLetters = question.parsedAlternativas.map(a => a.letter);
    if (!validLetters.includes(question.gabarito)) {
      errors.push('Gabarito não corresponde a nenhuma alternativa');
    }
  }

  return {
    isValid: errors.length === 0,
    isCorrupted,
    errors,
    warnings
  };
}

/**
 * Limpa texto removendo padrões de código corrompido (fallback básico)
 * Nota: Para limpeza completa, usar o serviço de IA no backend
 */
export function sanitizeText(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Remover comentários AngularJS
  cleaned = cleaned.replace(/<!--\s*(ngIf|ngRepeat|end ngIf|end ngRepeat)[^>]*-->/gi, '');

  // Remover atributos ng-*
  cleaned = cleaned.replace(/\s+ng-\w+="[^"]*"/gi, '');

  // Remover atributos tec-*
  cleaned = cleaned.replace(/\s+tec-\w+="[^"]*"/gi, '');

  // Remover bindings {{ }}
  cleaned = cleaned.replace(/\{\{[^}]+\}\}/g, '');

  // Remover múltiplos espaços
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  return cleaned.trim();
}

export default {
  detectCorruptedContent,
  validateQuestion,
  sanitizeText
};
