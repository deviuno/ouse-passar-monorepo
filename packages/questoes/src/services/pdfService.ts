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
const MARGIN_LEFT = 15;
const MARGIN_RIGHT = 15;
const MARGIN_TOP = 25;
const MARGIN_BOTTOM = 20;
const COLUMN_GAP = 8;
const COLUMN_WIDTH = (PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT - COLUMN_GAP) / 2;
const LINE_HEIGHT = 4.5;
const QUESTION_SPACING = 6;
const HEADER_HEIGHT = 15;
const FOOTER_HEIGHT = 10;

// Colors (grayscale)
const BLACK = '#000000';
const DARK_GRAY = '#333333';
const MEDIUM_GRAY = '#666666';
const LIGHT_GRAY = '#CCCCCC';
const VERY_LIGHT_GRAY = '#EEEEEE';
const WHITE = '#FFFFFF';

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

// Split text into lines that fit within a given width
function splitTextToLines(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
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

  // Generate cover page
  generateCoverPage(doc, {
    simuladoName,
    preparatorioName,
    studentName,
    cargo,
    totalQuestions: questions.length,
    totalTime,
    provaNumber,
  });

  // Add questions pages
  doc.addPage();
  generateQuestionsPages(doc, questions, simuladoName, preparatorioName);

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

  // Header border
  setColor(doc, BLACK, 'draw');
  doc.setLineWidth(0.8);
  doc.line(MARGIN_LEFT, 30, PAGE_WIDTH - MARGIN_RIGHT, 30);

  // Brand header
  setColor(doc, BLACK, 'text');
  doc.setFontSize(28);
  doc.setFont('times', 'bold');
  doc.text('OUSE PASSAR', centerX, 22, { align: 'center' });

  // Tagline
  setColor(doc, MEDIUM_GRAY, 'text');
  doc.setFontSize(10);
  doc.setFont('times', 'italic');
  doc.text('Sua aprovação começa aqui', centerX, 27, { align: 'center' });

  // Simulado name box
  const titleBoxY = 45;
  setColor(doc, VERY_LIGHT_GRAY, 'fill');
  doc.roundedRect(MARGIN_LEFT, titleBoxY, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT, 35, 3, 3, 'F');
  setColor(doc, BLACK, 'draw');
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN_LEFT, titleBoxY, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT, 35, 3, 3, 'S');

  // Simulado name
  setColor(doc, BLACK, 'text');
  doc.setFontSize(18);
  doc.setFont('times', 'bold');
  const simuladoLines = splitTextToLines(doc, simuladoName.toUpperCase(), 160);
  let yPos = titleBoxY + 15;
  simuladoLines.forEach((line: string) => {
    doc.text(line, centerX, yPos, { align: 'center' });
    yPos += 8;
  });

  // Prova number
  doc.setFontSize(14);
  doc.setFont('times', 'normal');
  doc.text(`Prova ${provaNumber + 1}`, centerX, yPos + 5, { align: 'center' });

  // Preparatorio name (if available)
  if (preparatorioName) {
    setColor(doc, DARK_GRAY, 'text');
    doc.setFontSize(11);
    doc.setFont('times', 'italic');
    doc.text(preparatorioName, centerX, yPos + 13, { align: 'center' });
  }

  // Info cards
  const cardsY = 100;
  const cardWidth = 50;
  const cardHeight = 35;
  const cardGap = 10;
  const cardsStartX = (PAGE_WIDTH - (cardWidth * 3 + cardGap * 2)) / 2;

  // Card 1: Questões
  drawInfoCard(doc, cardsStartX, cardsY, cardWidth, cardHeight, String(totalQuestions), 'Questões');

  // Card 2: Duração
  drawInfoCard(doc, cardsStartX + cardWidth + cardGap, cardsY, cardWidth, cardHeight, formatTime(totalTime), 'Duração');

  // Card 3: Data
  const today = new Date().toLocaleDateString('pt-BR');
  drawInfoCard(doc, cardsStartX + (cardWidth + cardGap) * 2, cardsY, cardWidth, cardHeight, today, 'Data');

  // Motivational quote
  const quote = getRandomQuote();
  setColor(doc, DARK_GRAY, 'text');
  doc.setFontSize(11);
  doc.setFont('times', 'italic');
  const quoteLines = splitTextToLines(doc, `"${quote}"`, 150);
  let quoteY = 160;
  quoteLines.forEach((line: string) => {
    doc.text(line, centerX, quoteY, { align: 'center' });
    quoteY += 6;
  });

  // Student info section
  const studentBoxY = 195;
  setColor(doc, VERY_LIGHT_GRAY, 'fill');
  doc.roundedRect(MARGIN_LEFT + 20, studentBoxY, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT - 40, 45, 3, 3, 'F');
  setColor(doc, BLACK, 'draw');
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN_LEFT + 20, studentBoxY, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT - 40, 45, 3, 3, 'S');

  // "Nome do aluno:" label
  setColor(doc, MEDIUM_GRAY, 'text');
  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  doc.text('Nome do aluno:', centerX, studentBoxY + 12, { align: 'center' });

  // Student name
  setColor(doc, BLACK, 'text');
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.text(studentName || '________________________________', centerX, studentBoxY + 22, { align: 'center' });

  // Cargo (if available)
  if (cargo) {
    setColor(doc, DARK_GRAY, 'text');
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    doc.text(cargo, centerX, studentBoxY + 32, { align: 'center' });
  }

  // Instructions box
  const instructionsY = 255;
  setColor(doc, BLACK, 'draw');
  doc.setLineWidth(0.5);
  doc.rect(MARGIN_LEFT, instructionsY, PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT, 25, 'S');

  setColor(doc, BLACK, 'text');
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.text('INSTRUÇÕES:', MARGIN_LEFT + 5, instructionsY + 6);

  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  const instructions = [
    '• Leia atentamente cada questão antes de responder.',
    '• Marque apenas uma alternativa por questão na folha de respostas.',
    '• Não é permitido o uso de calculadora ou material de consulta.',
  ];
  instructions.forEach((inst, idx) => {
    doc.text(inst, MARGIN_LEFT + 5, instructionsY + 12 + idx * 4);
  });

  // Footer
  setColor(doc, MEDIUM_GRAY, 'text');
  doc.setFontSize(8);
  doc.setFont('times', 'normal');
  doc.text('© Ouse Passar - Todos os direitos reservados', centerX, PAGE_HEIGHT - 12, { align: 'center' });
  doc.text('questoes.ousepassar.com.br', centerX, PAGE_HEIGHT - 8, { align: 'center' });
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
  setColor(doc, VERY_LIGHT_GRAY, 'fill');
  doc.roundedRect(x, y, width, height, 2, 2, 'F');
  setColor(doc, LIGHT_GRAY, 'draw');
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 2, 2, 'S');

  // Value
  setColor(doc, BLACK, 'text');
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.text(value, x + width / 2, y + height / 2 - 2, { align: 'center' });

  // Label (capitalized)
  setColor(doc, DARK_GRAY, 'text');
  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  doc.text(label, x + width / 2, y + height / 2 + 8, { align: 'center' });
}

function generateQuestionsPages(
  doc: jsPDF,
  questions: ParsedQuestion[],
  simuladoName: string,
  disciplina?: string
): void {
  let currentColumn = 0; // 0 = left, 1 = right
  let yPosition = MARGIN_TOP + HEADER_HEIGHT;
  let pageNumber = 1;

  // Initialize first page
  initializeQuestionPage(doc, pageNumber, simuladoName, disciplina);

  questions.forEach((question, index) => {
    const questionNumber = index + 1;
    const questionText = stripHtml(question.enunciado);
    const options = question.parsedAlternativas || [];

    // Calculate column X position
    const columnX = currentColumn === 0
      ? MARGIN_LEFT
      : MARGIN_LEFT + COLUMN_WIDTH + COLUMN_GAP;

    // Estimate question height
    const questionHeight = calculateQuestionHeight(doc, questionText, options, COLUMN_WIDTH - 3);

    // Check if question fits in current column
    const availableHeight = PAGE_HEIGHT - MARGIN_BOTTOM - FOOTER_HEIGHT - yPosition;

    if (questionHeight > availableHeight) {
      // Move to next column or page
      if (currentColumn === 0) {
        // Move to right column
        currentColumn = 1;
        yPosition = MARGIN_TOP + HEADER_HEIGHT;
      } else {
        // Move to new page
        doc.addPage();
        pageNumber++;
        initializeQuestionPage(doc, pageNumber, simuladoName, disciplina);
        currentColumn = 0;
        yPosition = MARGIN_TOP + HEADER_HEIGHT;
      }
    }

    // Recalculate column X after potential column/page change
    const finalColumnX = currentColumn === 0
      ? MARGIN_LEFT
      : MARGIN_LEFT + COLUMN_WIDTH + COLUMN_GAP;

    // Draw question
    yPosition = drawQuestion(doc, questionNumber, questionText, options, finalColumnX, yPosition, COLUMN_WIDTH - 3);

    // Add spacing between questions
    yPosition += QUESTION_SPACING;
  });

  // Add page number to last page
  addFooter(doc, pageNumber);
}

function initializeQuestionPage(
  doc: jsPDF,
  pageNumber: number,
  simuladoName: string,
  disciplina?: string
): void {
  // White background
  setColor(doc, WHITE, 'fill');
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // Header
  addHeader(doc, simuladoName, disciplina);

  // Column divider line
  const dividerX = MARGIN_LEFT + COLUMN_WIDTH + COLUMN_GAP / 2;
  setColor(doc, BLACK, 'draw');
  doc.setLineWidth(0.3);
  doc.line(dividerX, MARGIN_TOP + HEADER_HEIGHT, dividerX, PAGE_HEIGHT - MARGIN_BOTTOM - FOOTER_HEIGHT);

  // Footer will be added at the end
  addFooter(doc, pageNumber);
}

function addHeader(doc: jsPDF, simuladoName: string, disciplina?: string): void {
  // Header text - left
  setColor(doc, BLACK, 'text');
  doc.setFontSize(10);
  doc.setFont('times', 'bold');
  doc.text('OUSE PASSAR', MARGIN_LEFT, MARGIN_TOP);

  // Header text - right
  doc.setFont('times', 'normal');
  const rightText = disciplina ? `${simuladoName} - ${disciplina}` : simuladoName;
  const truncatedText = rightText.length > 40 ? rightText.substring(0, 37) + '...' : rightText;
  doc.text(truncatedText, PAGE_WIDTH - MARGIN_RIGHT, MARGIN_TOP, { align: 'right' });

  // Header border (thick line)
  setColor(doc, BLACK, 'draw');
  doc.setLineWidth(0.8);
  doc.line(MARGIN_LEFT, MARGIN_TOP + 5, PAGE_WIDTH - MARGIN_RIGHT, MARGIN_TOP + 5);
}

function addFooter(doc: jsPDF, pageNumber: number): void {
  const footerY = PAGE_HEIGHT - MARGIN_BOTTOM;

  // Footer border (thin line)
  setColor(doc, BLACK, 'draw');
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, footerY - 5, PAGE_WIDTH - MARGIN_RIGHT, footerY - 5);

  // Page number centered
  setColor(doc, BLACK, 'text');
  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  doc.text(String(pageNumber), PAGE_WIDTH / 2, footerY, { align: 'center' });
}

function calculateQuestionHeight(
  doc: jsPDF,
  questionText: string,
  options: Alternative[],
  maxWidth: number
): number {
  let height = 0;

  // Question number and text
  doc.setFontSize(10);
  const questionLines = splitTextToLines(doc, questionText, maxWidth - 8);
  height += 5; // Question number line
  height += questionLines.length * LINE_HEIGHT;
  height += 2; // Spacing before options

  // Options
  doc.setFontSize(9);
  options.forEach((option) => {
    const optionText = `(${option.letter}) ${stripHtml(option.text)}`;
    const optionLines = splitTextToLines(doc, optionText, maxWidth - 12);
    height += optionLines.length * (LINE_HEIGHT - 0.3);
    height += 0.5; // Spacing between options
  });

  return height;
}

function drawQuestion(
  doc: jsPDF,
  questionNumber: number,
  questionText: string,
  options: Alternative[],
  x: number,
  startY: number,
  maxWidth: number
): number {
  let y = startY;

  // Question number
  setColor(doc, BLACK, 'text');
  doc.setFontSize(10);
  doc.setFont('times', 'bold');
  doc.text(`Questão ${questionNumber}`, x, y);
  y += 5;

  // Question text (justified)
  doc.setFont('times', 'normal');
  const questionLines = splitTextToLines(doc, questionText, maxWidth - 3);
  questionLines.forEach((line: string) => {
    doc.text(line, x, y);
    y += LINE_HEIGHT;
  });

  y += 2; // Spacing before options

  // Options
  doc.setFontSize(9);
  options.forEach((option) => {
    const optionText = stripHtml(option.text);
    const fullOption = `(${option.letter}) ${optionText}`;
    const optionLines = splitTextToLines(doc, fullOption, maxWidth - 8);

    optionLines.forEach((line: string, lineIndex: number) => {
      if (lineIndex === 0) {
        doc.text(line, x + 3, y);
      } else {
        // Continuation lines (indented)
        doc.text(line, x + 8, y);
      }
      y += LINE_HEIGHT - 0.3;
    });
    y += 0.5; // Small spacing between options
  });

  return y;
}

function generateAnswerSheet(doc: jsPDF, totalQuestions: number, provaNumber: number): void {
  // White background
  setColor(doc, WHITE, 'fill');
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  const centerX = PAGE_WIDTH / 2;

  // Header border
  setColor(doc, BLACK, 'draw');
  doc.setLineWidth(0.8);
  doc.line(MARGIN_LEFT, 35, PAGE_WIDTH - MARGIN_RIGHT, 35);

  // Header
  setColor(doc, BLACK, 'text');
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.text('FOLHA DE RESPOSTAS', centerX, 20, { align: 'center' });

  setColor(doc, DARK_GRAY, 'text');
  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  doc.text(`Prova ${provaNumber + 1} - ${totalQuestions} questões`, centerX, 28, { align: 'center' });

  // Name field
  setColor(doc, BLACK, 'text');
  doc.setFontSize(10);
  doc.text('Nome:', MARGIN_LEFT, 50);
  setColor(doc, BLACK, 'draw');
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
  const cellWidth = 7;
  const cellHeight = 7;
  const questionsPerColumn = Math.ceil(totalQuestions / 4);
  const columnSpacing = 45;

  const letters = ['A', 'B', 'C', 'D', 'E'];

  for (let q = 1; q <= totalQuestions; q++) {
    const columnIndex = Math.floor((q - 1) / questionsPerColumn);
    const rowIndex = (q - 1) % questionsPerColumn;

    const baseX = MARGIN_LEFT + columnIndex * columnSpacing;
    const baseY = gridStartY + rowIndex * (cellHeight + 3);

    // Question number
    setColor(doc, BLACK, 'text');
    doc.setFontSize(8);
    doc.setFont('times', 'normal');
    const numText = q < 10 ? `  ${q}.` : q < 100 ? ` ${q}.` : `${q}.`;
    doc.text(numText, baseX, baseY + cellHeight / 2 + 1);

    // Answer circles
    letters.forEach((letter, i) => {
      const circleX = baseX + 12 + i * (cellWidth + 1);
      const circleY = baseY + cellHeight / 2;

      setColor(doc, BLACK, 'draw');
      doc.setLineWidth(0.2);
      doc.circle(circleX, circleY, cellWidth / 2 - 0.5);

      // Letter inside circle
      setColor(doc, MEDIUM_GRAY, 'text');
      doc.setFontSize(6);
      doc.text(letter, circleX, circleY + 1.5, { align: 'center' });
    });
  }

  // Footer instructions
  setColor(doc, DARK_GRAY, 'text');
  doc.setFontSize(8);
  doc.setFont('times', 'normal');
  doc.text('Marque apenas uma alternativa por questão.', centerX, PAGE_HEIGHT - 25, { align: 'center' });

  // Footer border
  setColor(doc, BLACK, 'draw');
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, PAGE_HEIGHT - 18, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 18);

  setColor(doc, MEDIUM_GRAY, 'text');
  doc.text('© Ouse Passar - questoes.ousepassar.com.br', centerX, PAGE_HEIGHT - 12, { align: 'center' });
}
