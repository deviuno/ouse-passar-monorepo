/**
 * HTML Validator and Sanitizer
 *
 * Validates and cleans HTML content from web scraping to prevent corrupted
 * AngularJS templates and malformed HTML from being stored in the database.
 */

// Patterns that indicate corrupted/malformed HTML from AngularJS sites
const CORRUPTED_PATTERNS = [
  // AngularJS directives
  /ng-if\s*=/gi,
  /ng-repeat\s*=/gi,
  /ng-model\s*=/gi,
  /ng-click\s*=/gi,
  /ng-class\s*=/gi,
  /ng-show\s*=/gi,
  /ng-hide\s*=/gi,
  /ng-disabled\s*=/gi,
  /ng-bind\s*=/gi,
  /ng-scope/gi,
  /ng-isolate-scope/gi,

  // AngularJS template comments
  /<!--\s*ngIf:/gi,
  /<!--\s*end ngIf/gi,
  /<!--\s*ngRepeat:/gi,
  /<!--\s*end ngRepeat/gi,

  // AngularJS binding expressions
  /\{\{[^}]+\}\}/g,
  /vm\.\w+/gi,

  // TEC-specific broken selectors
  /tec-\w+\s*=/gi,
  /aria-label="[^"]*"/gi,
  /aria-labelledby/gi,
  /aria-checked/gi,
  /data-container/gi,
  /data-original-title/gi,

  // Truncated/corrupted class names (incomplete words)
  /class="[^"]*questao-enunc[^a-z]/gi,
  /class="[^"]*clauestao/gi,
  /class="[^"]*espacamento-/gi,
  /class="[^"]*elemento-vazio/gi,

  // Raw form elements that shouldn't be in content
  /<input[^>]*type="radio"[^>]*>/gi,
  /<label[^>]*for="alternativa-/gi,
];

// Minimum content requirements
const MIN_ENUNCIADO_LENGTH = 10;
const MIN_ALTERNATIVA_LENGTH = 1;

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface SanitizationResult {
  content: string;
  wasModified: boolean;
  removedPatterns: string[];
}

/**
 * Check if HTML content contains corrupted AngularJS patterns
 */
export function detectCorruptedHTML(html: string): { isCorrupted: boolean; patterns: string[] } {
  const foundPatterns: string[] = [];

  for (const pattern of CORRUPTED_PATTERNS) {
    if (pattern.test(html)) {
      foundPatterns.push(pattern.source);
      // Reset regex lastIndex
      pattern.lastIndex = 0;
    }
  }

  return {
    isCorrupted: foundPatterns.length > 0,
    patterns: foundPatterns,
  };
}

/**
 * Validate question content before storage
 */
export function validateQuestionContent(
  enunciado: string,
  alternativas: { letter: string; text: string }[],
  comentario?: string | null
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate enunciado
  if (!enunciado || enunciado.trim().length < MIN_ENUNCIADO_LENGTH) {
    errors.push(`Enunciado muito curto (mínimo ${MIN_ENUNCIADO_LENGTH} caracteres)`);
  }

  // Check for corrupted patterns in enunciado
  const enunciadoCheck = detectCorruptedHTML(enunciado);
  if (enunciadoCheck.isCorrupted) {
    errors.push(`Enunciado contém HTML corrompido (padrões: ${enunciadoCheck.patterns.slice(0, 3).join(', ')}...)`);
  }

  // Check for placeholder content
  if (enunciado && /^\s*Imagem\s*$/i.test(enunciado.replace(/<[^>]*>/g, '').trim())) {
    errors.push('Enunciado contém apenas placeholder de imagem');
  }

  // Validate alternativas
  if (!alternativas || alternativas.length < 2) {
    errors.push('Questão deve ter pelo menos 2 alternativas');
  } else {
    for (const alt of alternativas) {
      if (!alt.text || alt.text.trim().length < MIN_ALTERNATIVA_LENGTH) {
        warnings.push(`Alternativa ${alt.letter} está vazia ou muito curta`);
      }

      const altCheck = detectCorruptedHTML(alt.text);
      if (altCheck.isCorrupted) {
        errors.push(`Alternativa ${alt.letter} contém HTML corrompido`);
      }
    }
  }

  // Validate comentario if present
  if (comentario) {
    const comentarioCheck = detectCorruptedHTML(comentario);
    if (comentarioCheck.isCorrupted) {
      warnings.push('Comentário contém HTML potencialmente corrompido');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitize HTML content by removing AngularJS directives and cleaning up
 */
export function sanitizeHTML(html: string): SanitizationResult {
  if (!html) {
    return { content: '', wasModified: false, removedPatterns: [] };
  }

  let content = html;
  const removedPatterns: string[] = [];

  // Remove AngularJS comments
  const angularCommentPattern = /<!--\s*(ngIf|ngRepeat|end ngIf|end ngRepeat)[^>]*-->/gi;
  if (angularCommentPattern.test(content)) {
    removedPatterns.push('AngularJS comments');
    content = content.replace(angularCommentPattern, '');
  }

  // Remove ng-* attributes from tags
  const ngAttributePattern = /\s+ng-\w+="[^"]*"/gi;
  if (ngAttributePattern.test(content)) {
    removedPatterns.push('ng-* attributes');
    content = content.replace(ngAttributePattern, '');
  }

  // Remove tec-* custom attributes
  const tecAttributePattern = /\s+tec-\w+="[^"]*"/gi;
  if (tecAttributePattern.test(content)) {
    removedPatterns.push('tec-* attributes');
    content = content.replace(tecAttributePattern, '');
  }

  // Remove ARIA attributes
  const ariaPattern = /\s+aria-\w+="[^"]*"/gi;
  if (ariaPattern.test(content)) {
    removedPatterns.push('aria-* attributes');
    content = content.replace(ariaPattern, '');
  }

  // Remove data-* attributes (except common ones like data-src)
  const dataPattern = /\s+data-(?!src)[a-z-]+="[^"]*"/gi;
  if (dataPattern.test(content)) {
    removedPatterns.push('data-* attributes');
    content = content.replace(dataPattern, '');
  }

  // Remove ng-scope and ng-isolate-scope classes
  content = content.replace(/\s+class="[^"]*ng-scope[^"]*"/gi, (match) => {
    const cleaned = match.replace(/ng-scope|ng-isolate-scope|ng-pristine|ng-untouched|ng-valid|ng-binding/gi, '').replace(/\s+/g, ' ');
    return cleaned;
  });

  // Remove AngularJS expression bindings {{ }}
  const bindingPattern = /\{\{[^}]+\}\}/g;
  if (bindingPattern.test(content)) {
    removedPatterns.push('AngularJS bindings');
    content = content.replace(bindingPattern, '');
  }

  // Remove form elements that shouldn't be in content
  const formPattern = /<input[^>]*type="radio"[^>]*>/gi;
  if (formPattern.test(content)) {
    removedPatterns.push('form elements');
    content = content.replace(formPattern, '');
  }

  // Remove empty elements created by cleanup
  content = content.replace(/<(\w+)[^>]*>\s*<\/\1>/gi, '');

  // Remove multiple consecutive whitespace/newlines
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  content = content.replace(/\s{2,}/g, ' ');

  // Trim
  content = content.trim();

  return {
    content,
    wasModified: content !== html,
    removedPatterns,
  };
}

/**
 * Extract plain text from HTML and validate it makes sense
 */
export function extractTextContent(html: string): string {
  // Remove all HTML tags
  let text = html.replace(/<[^>]+>/g, ' ');
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  // Remove multiple spaces
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

/**
 * Check if content is meaningful (not just placeholders or garbage)
 */
export function isMeaningfulContent(html: string, minWords: number = 3): boolean {
  const text = extractTextContent(html);

  // Check minimum word count
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length < minWords) {
    return false;
  }

  // Check for common placeholders
  const placeholderPatterns = [
    /^Imagem$/i,
    /^Carregando/i,
    /^Loading/i,
    /^\[object Object\]$/i,
    /^undefined$/i,
    /^null$/i,
  ];

  for (const pattern of placeholderPatterns) {
    if (pattern.test(text)) {
      return false;
    }
  }

  return true;
}

/**
 * Full validation and sanitization pipeline for a question
 */
export interface QuestionValidationResult {
  isValid: boolean;
  sanitizedEnunciado: string;
  sanitizedAlternativas: { letter: string; text: string }[];
  sanitizedComentario: string | null;
  errors: string[];
  warnings: string[];
}

export function validateAndSanitizeQuestion(
  enunciado: string,
  alternativas: { letter: string; text: string }[],
  comentario?: string | null
): QuestionValidationResult {
  // First, sanitize the content
  const sanitizedEnunciado = sanitizeHTML(enunciado);
  const sanitizedAlternativas = alternativas.map(alt => ({
    letter: alt.letter,
    text: sanitizeHTML(alt.text).content,
  }));
  const sanitizedComentario = comentario ? sanitizeHTML(comentario).content : null;

  // Then validate the sanitized content
  const validation = validateQuestionContent(
    sanitizedEnunciado.content,
    sanitizedAlternativas,
    sanitizedComentario
  );

  // Add warnings for sanitization
  const warnings = [...validation.warnings];
  if (sanitizedEnunciado.wasModified) {
    warnings.push(`Enunciado foi sanitizado (removido: ${sanitizedEnunciado.removedPatterns.join(', ')})`);
  }

  return {
    isValid: validation.isValid,
    sanitizedEnunciado: sanitizedEnunciado.content,
    sanitizedAlternativas,
    sanitizedComentario,
    errors: validation.errors,
    warnings,
  };
}

export default {
  detectCorruptedHTML,
  validateQuestionContent,
  sanitizeHTML,
  extractTextContent,
  isMeaningfulContent,
  validateAndSanitizeQuestion,
};
