import jsPDF from 'jspdf';
import { ParsedQuestion, Alternative } from '../types';

// Motivational quotes for the cover page
const MOTIVATIONAL_QUOTES = [
  'A disciplina é a ponte entre metas e realizações.',
  'O sucesso é a soma de pequenos esforços repetidos dia após dia.',
  'Sua dedicação de hoje é sua vitória de amanhã.',
  'Não existe elevador para o sucesso. Você precisa subir as escadas.',
  'O único lugar onde o sucesso vem antes do trabalho é no dicionário.',
  'Acredite em você mesmo e tudo será possível.',
  'Grandes conquistas exigem grande preparação.',
  'A persistência realiza o impossível.',
  'Cada questão resolvida é um passo mais perto da sua aprovação.',
  'Você está mais perto do que imagina.',
];

interface PDFGeneratorOptions {
  simuladoName: string;
  preparatorioName?: string;
  studentName: string;
  cargo?: string;
  questions: ParsedQuestion[];
  totalTime: number; // in minutes
  provaNumber: number;
}

// PDF dimensions and margins (in mm) - A4
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_LEFT = 12;
const MARGIN_RIGHT = 12;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 15;
const COLUMN_GAP = 6;
const COLUMN_WIDTH = (PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT - COLUMN_GAP) / 2;
const LINE_HEIGHT = 3.8;
const HEADER_HEIGHT = 12;
const FOOTER_HEIGHT = 8;

// Colors (grayscale - light mode)
const BLACK = '#000000';
const DARK_GRAY = '#333333';
const MEDIUM_GRAY = '#555555';
const LIGHT_GRAY = '#999999';
const BORDER_GRAY = '#CCCCCC';
const BG_GRAY = '#F5F5F5';
const WHITE = '#FFFFFF';

// Portuguese hyphenation patterns (simplified)
const VOWELS = 'aeiouáéíóúâêîôûãõàèìòùäëïöü';
const CONSONANTS = 'bcdfghjklmnpqrstvwxyzçBCDFGHJKLMNPQRSTVWXYZÇ';

function isVowel(char: string): boolean {
  return VOWELS.includes(char.toLowerCase());
}

function hyphenateWord(word: string): string[] {
  if (word.length <= 4) return [word];

  const syllables: string[] = [];
  let current = '';

  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const next = word[i + 1] || '';
    const prev = word[i - 1] || '';

    current += char;

    // Basic Portuguese syllable rules
    if (isVowel(char)) {
      // Check if we should break after this vowel
      if (next && !isVowel(next)) {
        const nextNext = word[i + 2] || '';
        // Don't break between consonant clusters that start syllables (pr, tr, br, etc.)
        const clusters = ['pr', 'tr', 'br', 'cr', 'dr', 'fr', 'gr', 'vr', 'pl', 'tl', 'bl', 'cl', 'dl', 'fl', 'gl'];
        const possibleCluster = (next + nextNext).toLowerCase();

        if (clusters.includes(possibleCluster) && nextNext) {
          // Break before the cluster
          if (current.length >= 2) {
            syllables.push(current);
            current = '';
          }
        } else if (nextNext && !isVowel(next) && !isVowel(nextNext)) {
          // Two consonants after vowel - break between them usually
          current += next;
          i++;
          if (current.length >= 2) {
            syllables.push(current);
            current = '';
          }
        }
      } else if (next && isVowel(next) && !['a', 'e', 'i', 'o', 'u'].includes(char.toLowerCase())) {
        // Hiatus - break between vowels (except for some diphthongs)
        if (current.length >= 2) {
          syllables.push(current);
          current = '';
        }
      }
    }
  }

  if (current) {
    syllables.push(current);
  }

  // Merge syllables that are too short
  const result: string[] = [];
  for (let i = 0; i < syllables.length; i++) {
    if (syllables[i].length === 1 && result.length > 0) {
      result[result.length - 1] += syllables[i];
    } else if (syllables[i].length === 1 && i < syllables.length - 1) {
      syllables[i + 1] = syllables[i] + syllables[i + 1];
    } else {
      result.push(syllables[i]);
    }
  }

  return result.length > 0 ? result : [word];
}

function getRandomQuote(): string {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
  }
  return `${mins} minutos`;
}

// Strip HTML tags and decode entities
function stripHtml(html: string): string {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

// Convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function setColor(doc: jsPDF, hex: string, type: 'text' | 'draw' | 'fill' = 'text'): void {
  const { r, g, b } = hexToRgb(hex);
  if (type === 'text') {
    doc.setTextColor(r, g, b);
  } else if (type === 'draw') {
    doc.setDrawColor(r, g, b);
  } else {
    doc.setFillColor(r, g, b);
  }
}

// Check if a word is a URL or long unbreakable string
function isLongWord(word: string): boolean {
  return word.length > 25 || word.includes('://') || word.includes('www.');
}

// Force break long words (URLs, etc.) to fit within maxWidth
function forceBreakLongWord(doc: jsPDF, word: string, maxWidth: number): string[] {
  const wordWidth = doc.getTextWidth(word);

  // If word fits, return as is
  if (wordWidth <= maxWidth) {
    return [word];
  }

  const result: string[] = [];

  // For URLs, try to break at natural points first
  if (word.includes('://') || word.includes('www.')) {
    // Break points for URLs (in order of preference)
    const breakChars = ['/', '?', '&', '=', '-', '_', '.', '#'];
    let remaining = word;

    while (remaining.length > 0) {
      // Find the longest substring that fits
      let bestBreak = -1;
      let testStr = '';

      for (let i = 0; i < remaining.length; i++) {
        testStr += remaining[i];
        const width = doc.getTextWidth(testStr);

        if (width > maxWidth) {
          // We've exceeded the width, need to break before this
          if (bestBreak > 0) {
            // Break at the best break point we found
            result.push(remaining.substring(0, bestBreak + 1));
            remaining = remaining.substring(bestBreak + 1);
          } else if (i > 0) {
            // No good break point, force break at previous char
            result.push(remaining.substring(0, i));
            remaining = remaining.substring(i);
          } else {
            // Single char is too wide (shouldn't happen)
            result.push(remaining[0]);
            remaining = remaining.substring(1);
          }
          break;
        }

        // Check if current char is a good break point
        if (breakChars.includes(remaining[i])) {
          bestBreak = i;
        }

        // If we reached the end and it fits
        if (i === remaining.length - 1) {
          result.push(remaining);
          remaining = '';
        }
      }
    }

    return result;
  }

  // For non-URLs, just break by character count
  let remaining = word;
  while (remaining.length > 0) {
    let testStr = '';
    let breakIndex = 0;

    for (let i = 0; i < remaining.length; i++) {
      testStr += remaining[i];
      if (doc.getTextWidth(testStr) > maxWidth) {
        breakIndex = Math.max(1, i);
        break;
      }
      breakIndex = i + 1;
    }

    if (breakIndex >= remaining.length) {
      result.push(remaining);
      break;
    } else {
      result.push(remaining.substring(0, breakIndex));
      remaining = remaining.substring(breakIndex);
    }
  }

  return result;
}

// Pre-process text to break long words
function preprocessText(doc: jsPDF, text: string, maxWidth: number): string {
  const words = text.split(/(\s+)/); // Keep whitespace
  const processedWords: string[] = [];

  for (const word of words) {
    if (/^\s+$/.test(word)) {
      // It's whitespace, keep as is
      processedWords.push(word);
    } else if (isLongWord(word) && doc.getTextWidth(word) > maxWidth) {
      // Break the long word
      const brokenParts = forceBreakLongWord(doc, word, maxWidth * 0.95); // 95% to give some margin
      processedWords.push(brokenParts.join(' '));
    } else {
      processedWords.push(word);
    }
  }

  return processedWords.join('');
}

// Justify text with hyphenation
function justifyText(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  fontSize: number
): { lines: string[]; isJustified: boolean[] } {
  doc.setFontSize(fontSize);

  // Pre-process text to break long words (URLs, etc.)
  const processedText = preprocessText(doc, text, maxWidth);

  const words = processedText.split(/\s+/).filter(w => w.length > 0);
  const lines: string[] = [];
  const isJustified: boolean[] = [];
  let currentLine = '';
  let currentWidth = 0;
  const spaceWidth = doc.getTextWidth(' ');

  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    const wordWidth = doc.getTextWidth(word);

    if (currentWidth === 0) {
      currentLine = word;
      currentWidth = wordWidth;
    } else if (currentWidth + spaceWidth + wordWidth <= maxWidth) {
      currentLine += ' ' + word;
      currentWidth += spaceWidth + wordWidth;
    } else {
      // Try to hyphenate the word if it doesn't fit
      const syllables = hyphenateWord(word);
      let fitted = false;

      if (syllables.length > 1) {
        for (let s = syllables.length - 1; s >= 1; s--) {
          const partial = syllables.slice(0, s).join('') + '-';
          const partialWidth = doc.getTextWidth(partial);

          if (currentWidth + spaceWidth + partialWidth <= maxWidth) {
            currentLine += ' ' + partial;
            lines.push(currentLine);
            isJustified.push(true);

            // Start new line with remainder
            const remainder = syllables.slice(s).join('');
            currentLine = remainder;
            currentWidth = doc.getTextWidth(remainder);
            fitted = true;
            break;
          }
        }
      }

      if (!fitted) {
        // Push current line and start new one
        lines.push(currentLine);
        isJustified.push(true);
        currentLine = word;
        currentWidth = wordWidth;
      }
    }
  }

  // Last line - not justified
  if (currentLine) {
    lines.push(currentLine);
    isJustified.push(false);
  }

  return { lines, isJustified };
}

// Draw justified text
function drawJustifiedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number
): number {
  const { lines, isJustified } = justifyText(doc, text, maxWidth, fontSize);
  doc.setFontSize(fontSize);

  let currentY = y;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isJustified[i] && line.includes(' ')) {
      // Justify this line by spreading spaces
      const words = line.split(' ');
      if (words.length > 1) {
        const totalWordsWidth = words.reduce((sum, word) => sum + doc.getTextWidth(word), 0);
        const totalSpaceNeeded = maxWidth - totalWordsWidth;
        const spaceWidth = totalSpaceNeeded / (words.length - 1);

        let currentX = x;
        for (let j = 0; j < words.length; j++) {
          doc.text(words[j], currentX, currentY);
          currentX += doc.getTextWidth(words[j]) + spaceWidth;
        }
      } else {
        doc.text(line, x, currentY);
      }
    } else {
      doc.text(line, x, currentY);
    }

    currentY += LINE_HEIGHT;
  }

  return currentY;
}

// Rendering state for continuous flow
interface RenderState {
  column: number; // 0 = left, 1 = right
  y: number;
  pageNumber: number;
  currentMateria: string | null;
}

export async function generateSimuladoPDF(options: PDFGeneratorOptions): Promise<void> {
  const {
    simuladoName,
    preparatorioName,
    studentName,
    cargo,
    questions,
    totalTime,
    provaNumber,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Set default font to Times (serif)
  doc.setFont('times', 'normal');

  // Generate cover page (original design with light colors)
  generateCoverPage(doc, {
    simuladoName,
    preparatorioName,
    studentName,
    cargo,
    totalQuestions: questions.length,
    totalTime,
    provaNumber,
  });

  // Add questions pages with continuous flow
  doc.addPage();
  generateQuestionsPages(doc, questions, simuladoName);

  // Add answer sheet page
  doc.addPage();
  generateAnswerSheet(doc, questions.length, provaNumber);

  // Download the PDF
  const fileName = `${simuladoName.replace(/[^a-zA-Z0-9]/g, '_')}_Prova_${provaNumber + 1}.pdf`;
  doc.save(fileName);
}

function generateCoverPage(
  doc: jsPDF,
  options: {
    simuladoName: string;
    preparatorioName?: string;
    studentName: string;
    cargo?: string;
    totalQuestions: number;
    totalTime: number;
    provaNumber: number;
  }
): void {
  const {
    simuladoName,
    preparatorioName,
    studentName,
    cargo,
    totalQuestions,
    totalTime,
    provaNumber,
  } = options;

  const centerX = PAGE_WIDTH / 2;

  // White background
  setColor(doc, WHITE, 'fill');
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // Top decorative bar
  setColor(doc, BLACK, 'fill');
  doc.rect(0, 0, PAGE_WIDTH, 8, 'F');

  // Brand header
  setColor(doc, BLACK, 'text');
  doc.setFontSize(32);
  doc.setFont('times', 'bold');
  doc.text('OUSE PASSAR', centerX, 35, { align: 'center' });

  // Tagline
  setColor(doc, MEDIUM_GRAY, 'text');
  doc.setFontSize(12);
  doc.setFont('times', 'italic');
  doc.text('Sua aprovação começa aqui', centerX, 44, { align: 'center' });

  // Decorative line under tagline
  setColor(doc, BORDER_GRAY, 'draw');
  doc.setLineWidth(0.5);
  doc.line(centerX - 50, 50, centerX + 50, 50);

  // Simulado name - main title box
  const titleBoxY = 65;
  const titleBoxHeight = 45;

  // Light background for title
  setColor(doc, BG_GRAY, 'fill');
  doc.rect(MARGIN_LEFT, titleBoxY, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT, titleBoxHeight, 'F');

  // Border
  setColor(doc, BORDER_GRAY, 'draw');
  doc.setLineWidth(0.3);
  doc.rect(MARGIN_LEFT, titleBoxY, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT, titleBoxHeight, 'S');

  // Simulado name
  setColor(doc, BLACK, 'text');
  doc.setFontSize(20);
  doc.setFont('times', 'bold');

  // Split long names
  const maxTitleWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT - 20;
  const titleLines = doc.splitTextToSize(simuladoName.toUpperCase(), maxTitleWidth);
  let titleY = titleBoxY + 18;

  titleLines.forEach((line: string) => {
    doc.text(line, centerX, titleY, { align: 'center' });
    titleY += 9;
  });

  // Prova number
  setColor(doc, DARK_GRAY, 'text');
  doc.setFontSize(14);
  doc.setFont('times', 'normal');
  doc.text(`PROVA ${provaNumber + 1}`, centerX, titleBoxY + titleBoxHeight - 8, { align: 'center' });

  // Preparatorio name (if available)
  if (preparatorioName) {
    setColor(doc, MEDIUM_GRAY, 'text');
    doc.setFontSize(11);
    doc.setFont('times', 'italic');
    doc.text(preparatorioName, centerX, titleBoxY + titleBoxHeight + 10, { align: 'center' });
  }

  // Info cards section
  const cardsY = 130;
  const cardWidth = 55;
  const cardHeight = 30;
  const cardGap = 8;
  const cardsStartX = (PAGE_WIDTH - (cardWidth * 3 + cardGap * 2)) / 2;

  // Card 1: Questões
  drawInfoCard(doc, cardsStartX, cardsY, cardWidth, cardHeight, String(totalQuestions), 'QUESTÕES');

  // Card 2: Duração
  drawInfoCard(doc, cardsStartX + cardWidth + cardGap, cardsY, cardWidth, cardHeight, formatTime(totalTime), 'DURAÇÃO');

  // Card 3: Data
  const today = new Date().toLocaleDateString('pt-BR');
  drawInfoCard(doc, cardsStartX + (cardWidth + cardGap) * 2, cardsY, cardWidth, cardHeight, today, 'DATA');

  // Motivational quote section
  const quoteY = 180;
  const quote = getRandomQuote();

  // Quote decorative elements
  setColor(doc, LIGHT_GRAY, 'text');
  doc.setFontSize(24);
  doc.text('"', MARGIN_LEFT + 20, quoteY);

  setColor(doc, DARK_GRAY, 'text');
  doc.setFontSize(12);
  doc.setFont('times', 'italic');
  const quoteLines = doc.splitTextToSize(quote, 140);
  let quoteTextY = quoteY + 2;
  quoteLines.forEach((line: string) => {
    doc.text(line, centerX, quoteTextY, { align: 'center' });
    quoteTextY += 6;
  });

  setColor(doc, LIGHT_GRAY, 'text');
  doc.setFontSize(24);
  doc.text('"', PAGE_WIDTH - MARGIN_RIGHT - 20, quoteTextY - 4, { align: 'right' });

  // Student info section
  const studentBoxY = 210;
  const studentBoxHeight = 40;

  // Light background
  setColor(doc, BG_GRAY, 'fill');
  doc.rect(MARGIN_LEFT + 15, studentBoxY, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT - 30, studentBoxHeight, 'F');

  // Border
  setColor(doc, BORDER_GRAY, 'draw');
  doc.setLineWidth(0.3);
  doc.rect(MARGIN_LEFT + 15, studentBoxY, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT - 30, studentBoxHeight, 'S');

  // "Nome do aluno:" label
  setColor(doc, LIGHT_GRAY, 'text');
  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  doc.text('NOME DO ALUNO', centerX, studentBoxY + 10, { align: 'center' });

  // Student name
  setColor(doc, BLACK, 'text');
  doc.setFontSize(16);
  doc.setFont('times', 'bold');
  doc.text(studentName || '________________________________', centerX, studentBoxY + 22, { align: 'center' });

  // Cargo (if available)
  if (cargo) {
    setColor(doc, MEDIUM_GRAY, 'text');
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    doc.text(cargo, centerX, studentBoxY + 32, { align: 'center' });
  }

  // Instructions section
  const instructionsY = 260;

  setColor(doc, BLACK, 'draw');
  doc.setLineWidth(0.5);
  doc.line(MARGIN_LEFT, instructionsY, PAGE_WIDTH - MARGIN_RIGHT, instructionsY);

  setColor(doc, BLACK, 'text');
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.text('INSTRUÇÕES', MARGIN_LEFT, instructionsY + 6);

  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  const instructions = [
    '• Leia atentamente cada questão antes de responder.',
    '• Marque apenas uma alternativa por questão na folha de respostas.',
    '• Não é permitido o uso de calculadora ou material de consulta.',
  ];
  instructions.forEach((inst, idx) => {
    doc.text(inst, MARGIN_LEFT, instructionsY + 12 + idx * 4);
  });

  // Bottom decorative bar
  setColor(doc, BLACK, 'fill');
  doc.rect(0, PAGE_HEIGHT - 8, PAGE_WIDTH, 8, 'F');

  // Footer text (on the black bar)
  setColor(doc, WHITE, 'text');
  doc.setFontSize(8);
  doc.setFont('times', 'normal');
  doc.text('questoes.ousepassar.com.br', centerX, PAGE_HEIGHT - 3, { align: 'center' });
}

function drawInfoCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  value: string,
  label: string
): void {
  // Card background
  setColor(doc, WHITE, 'fill');
  doc.rect(x, y, width, height, 'F');

  // Card border
  setColor(doc, BORDER_GRAY, 'draw');
  doc.setLineWidth(0.5);
  doc.rect(x, y, width, height, 'S');

  // Value
  setColor(doc, BLACK, 'text');
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.text(value, x + width / 2, y + height / 2 - 1, { align: 'center' });

  // Label
  setColor(doc, LIGHT_GRAY, 'text');
  doc.setFontSize(8);
  doc.setFont('times', 'normal');
  doc.text(label, x + width / 2, y + height / 2 + 8, { align: 'center' });
}

function generateQuestionsPages(
  doc: jsPDF,
  questions: ParsedQuestion[],
  simuladoName: string
): void {
  const state: RenderState = {
    column: 0,
    y: MARGIN_TOP + HEADER_HEIGHT,
    pageNumber: 1,
    currentMateria: null,
  };

  // Initialize first page
  initializeQuestionPage(doc, state.pageNumber, simuladoName);

  const contentBottom = PAGE_HEIGHT - MARGIN_BOTTOM - FOOTER_HEIGHT;
  const getColumnX = (col: number) => col === 0
    ? MARGIN_LEFT
    : MARGIN_LEFT + COLUMN_WIDTH + COLUMN_GAP;

  // Process each question with continuous flow
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const questionNumber = i + 1;
    const questionText = stripHtml(question.enunciado);
    const options = question.parsedAlternativas || [];
    const materia = question.materia || null;

    // Check if we need to add a subject/materia header
    if (materia && materia !== state.currentMateria) {
      state.currentMateria = materia;

      // Add space before discipline header
      const headerHeight = 10;

      // Check if we have space for the header
      if (state.y + headerHeight > contentBottom) {
        // Move to next column or page
        if (state.column === 0) {
          state.column = 1;
          state.y = MARGIN_TOP + HEADER_HEIGHT;
        } else {
          doc.addPage();
          state.pageNumber++;
          initializeQuestionPage(doc, state.pageNumber, simuladoName);
          state.column = 0;
          state.y = MARGIN_TOP + HEADER_HEIGHT;
        }
      }

      // Draw subject/materia header
      const colX = getColumnX(state.column);
      drawDisciplinaHeader(doc, materia, colX, state.y, COLUMN_WIDTH - 2);
      state.y += headerHeight;
    }

    // Render question with continuous flow
    renderQuestionContinuous(
      doc,
      state,
      questionNumber,
      questionText,
      options,
      simuladoName,
      contentBottom,
      getColumnX
    );
  }

  // Ensure last page has footer
  addFooter(doc, state.pageNumber);
}

function drawDisciplinaHeader(
  doc: jsPDF,
  disciplina: string,
  x: number,
  y: number,
  width: number
): void {
  // Background
  setColor(doc, BG_GRAY, 'fill');
  doc.rect(x, y - 3, width, 8, 'F');

  // Discipline name
  setColor(doc, BLACK, 'text');
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.text(disciplina.toUpperCase(), x + 2, y + 2);

  // Line below
  setColor(doc, BLACK, 'draw');
  doc.setLineWidth(0.5);
  doc.line(x, y + 5, x + width, y + 5);
}

function renderQuestionContinuous(
  doc: jsPDF,
  state: RenderState,
  questionNumber: number,
  questionText: string,
  options: Alternative[],
  simuladoName: string,
  contentBottom: number,
  getColumnX: (col: number) => number
): void {
  const maxWidth = COLUMN_WIDTH - 4;

  // Prepare all lines for the question
  const allElements: { type: 'number' | 'text' | 'option'; content: string; indent: number }[] = [];

  // Question number
  allElements.push({ type: 'number', content: `Questão ${questionNumber}`, indent: 0 });

  // Question text lines (justified)
  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  const { lines: questionLines } = justifyText(doc, questionText, maxWidth - 2, 9);
  questionLines.forEach(line => {
    allElements.push({ type: 'text', content: line, indent: 0 });
  });

  // Small gap before options
  allElements.push({ type: 'text', content: '', indent: 0 });

  // Options
  doc.setFontSize(9);
  options.forEach((option) => {
    const optionText = stripHtml(option.text);
    const fullOption = `(${option.letter}) ${optionText}`;
    const { lines: optionLines } = justifyText(doc, fullOption, maxWidth - 6, 9);

    optionLines.forEach((line, lineIndex) => {
      allElements.push({
        type: 'option',
        content: line,
        indent: lineIndex === 0 ? 3 : 7
      });
    });
  });

  // Add spacing after question
  allElements.push({ type: 'text', content: '', indent: 0 });
  allElements.push({ type: 'text', content: '', indent: 0 });

  // Render elements with continuous flow
  for (const element of allElements) {
    // Check if we need to move to next column/page
    if (state.y + LINE_HEIGHT > contentBottom) {
      if (state.column === 0) {
        state.column = 1;
        state.y = MARGIN_TOP + HEADER_HEIGHT;
      } else {
        doc.addPage();
        state.pageNumber++;
        initializeQuestionPage(doc, state.pageNumber, simuladoName);
        state.column = 0;
        state.y = MARGIN_TOP + HEADER_HEIGHT;
      }
    }

    const colX = getColumnX(state.column);

    if (element.content === '') {
      // Empty line for spacing
      state.y += LINE_HEIGHT * 0.5;
      continue;
    }

    if (element.type === 'number') {
      // Question number - bold
      setColor(doc, BLACK, 'text');
      doc.setFontSize(9);
      doc.setFont('times', 'bold');
      doc.text(element.content, colX + element.indent, state.y);
      state.y += LINE_HEIGHT + 1;
    } else if (element.type === 'text') {
      // Question text - justified
      setColor(doc, BLACK, 'text');
      doc.setFontSize(9);
      doc.setFont('times', 'normal');

      // Draw justified line
      const words = element.content.split(' ');
      if (words.length > 1 && element !== allElements[allElements.length - 1]) {
        const totalWordsWidth = words.reduce((sum, word) => sum + doc.getTextWidth(word), 0);
        const lineWidth = doc.getTextWidth(element.content);
        const availableWidth = COLUMN_WIDTH - 6;

        if (lineWidth < availableWidth * 0.85) {
          // Last line of paragraph or short line - left align
          doc.text(element.content, colX + element.indent, state.y);
        } else {
          // Justify
          const totalSpaceNeeded = availableWidth - totalWordsWidth;
          const spaceWidth = totalSpaceNeeded / (words.length - 1);
          let currentX = colX + element.indent;

          for (let j = 0; j < words.length; j++) {
            doc.text(words[j], currentX, state.y);
            currentX += doc.getTextWidth(words[j]) + spaceWidth;
          }
        }
      } else {
        doc.text(element.content, colX + element.indent, state.y);
      }
      state.y += LINE_HEIGHT;
    } else if (element.type === 'option') {
      // Option text
      setColor(doc, BLACK, 'text');
      doc.setFontSize(9);
      doc.setFont('times', 'normal');
      doc.text(element.content, colX + element.indent, state.y);
      state.y += LINE_HEIGHT;
    }
  }
}

function initializeQuestionPage(
  doc: jsPDF,
  pageNumber: number,
  simuladoName: string
): void {
  // White background
  setColor(doc, WHITE, 'fill');
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // Header
  addHeader(doc, simuladoName);

  // Column divider line
  const dividerX = MARGIN_LEFT + COLUMN_WIDTH + COLUMN_GAP / 2;
  setColor(doc, BLACK, 'draw');
  doc.setLineWidth(0.3);
  doc.line(dividerX, MARGIN_TOP + HEADER_HEIGHT - 2, dividerX, PAGE_HEIGHT - MARGIN_BOTTOM - FOOTER_HEIGHT + 2);

  // Footer
  addFooter(doc, pageNumber);
}

function addHeader(doc: jsPDF, simuladoName: string): void {
  // Header text - left
  setColor(doc, BLACK, 'text');
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.text('OUSE PASSAR', MARGIN_LEFT, MARGIN_TOP);

  // Header text - right
  doc.setFont('times', 'normal');
  const truncatedText = simuladoName.length > 45 ? simuladoName.substring(0, 42) + '...' : simuladoName;
  doc.text(truncatedText, PAGE_WIDTH - MARGIN_RIGHT, MARGIN_TOP, { align: 'right' });

  // Header border (thick line)
  setColor(doc, BLACK, 'draw');
  doc.setLineWidth(0.8);
  doc.line(MARGIN_LEFT, MARGIN_TOP + 4, PAGE_WIDTH - MARGIN_RIGHT, MARGIN_TOP + 4);
}

function addFooter(doc: jsPDF, pageNumber: number): void {
  const footerY = PAGE_HEIGHT - MARGIN_BOTTOM;

  // Footer border (thin line)
  setColor(doc, BLACK, 'draw');
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, footerY - 4, PAGE_WIDTH - MARGIN_RIGHT, footerY - 4);

  // Page number centered
  setColor(doc, BLACK, 'text');
  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  doc.text(String(pageNumber), PAGE_WIDTH / 2, footerY, { align: 'center' });
}

function generateAnswerSheet(doc: jsPDF, totalQuestions: number, provaNumber: number): void {
  // White background
  setColor(doc, WHITE, 'fill');
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  const centerX = PAGE_WIDTH / 2;

  // Top bar
  setColor(doc, BLACK, 'fill');
  doc.rect(0, 0, PAGE_WIDTH, 6, 'F');

  // Header
  setColor(doc, BLACK, 'text');
  doc.setFontSize(16);
  doc.setFont('times', 'bold');
  doc.text('FOLHA DE RESPOSTAS', centerX, 22, { align: 'center' });

  setColor(doc, MEDIUM_GRAY, 'text');
  doc.setFontSize(11);
  doc.setFont('times', 'normal');
  doc.text(`Prova ${provaNumber + 1} • ${totalQuestions} questões`, centerX, 30, { align: 'center' });

  // Decorative line
  setColor(doc, BORDER_GRAY, 'draw');
  doc.setLineWidth(0.5);
  doc.line(centerX - 40, 35, centerX + 40, 35);

  // Name field
  setColor(doc, BLACK, 'text');
  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  doc.text('Nome:', MARGIN_LEFT, 50);
  setColor(doc, BORDER_GRAY, 'draw');
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT + 15, 50, PAGE_WIDTH - MARGIN_RIGHT, 50);

  // Date field
  doc.text('Data:', MARGIN_LEFT, 60);
  doc.line(MARGIN_LEFT + 15, 60, MARGIN_LEFT + 55, 60);

  // Score field
  doc.text('Nota:', MARGIN_LEFT + 70, 60);
  doc.line(MARGIN_LEFT + 85, 60, MARGIN_LEFT + 120, 60);

  // Answer grid
  const gridStartY = 75;
  const circleRadius = 2.2; // Smaller circles
  const circleSpacing = 5; // Space between circle centers (closer together)
  const rowHeight = 6; // Vertical spacing between rows
  const numberToCircleGap = 8; // Gap between number and first circle (closer)
  const questionsPerColumn = Math.ceil(totalQuestions / 4);
  const columnSpacing = 48; // More space between columns for better separation

  const letters = ['A', 'B', 'C', 'D', 'E'];

  for (let q = 1; q <= totalQuestions; q++) {
    const columnIndex = Math.floor((q - 1) / questionsPerColumn);
    const rowIndex = (q - 1) % questionsPerColumn;

    const baseX = MARGIN_LEFT + columnIndex * columnSpacing;
    const baseY = gridStartY + rowIndex * rowHeight;

    // Question number
    setColor(doc, BLACK, 'text');
    doc.setFontSize(8);
    doc.setFont('times', 'normal');
    const numText = q < 10 ? `  ${q}.` : q < 100 ? ` ${q}.` : `${q}.`;
    doc.text(numText, baseX, baseY + circleRadius + 1);

    // Answer circles
    letters.forEach((letter, i) => {
      const circleX = baseX + numberToCircleGap + i * circleSpacing;
      const circleY = baseY + circleRadius;

      setColor(doc, BLACK, 'draw');
      doc.setLineWidth(0.2);
      doc.circle(circleX, circleY, circleRadius);

      // Letter inside circle
      setColor(doc, LIGHT_GRAY, 'text');
      doc.setFontSize(5);
      doc.text(letter, circleX, circleY + 1.2, { align: 'center' });
    });
  }

  // Footer instructions
  setColor(doc, MEDIUM_GRAY, 'text');
  doc.setFontSize(8);
  doc.setFont('times', 'normal');
  doc.text('Marque apenas uma alternativa por questão.', centerX, PAGE_HEIGHT - 22, { align: 'center' });

  // Bottom bar
  setColor(doc, BLACK, 'fill');
  doc.rect(0, PAGE_HEIGHT - 6, PAGE_WIDTH, 6, 'F');

  // Footer text
  setColor(doc, WHITE, 'text');
  doc.text('questoes.ousepassar.com.br', centerX, PAGE_HEIGHT - 2, { align: 'center' });
}
