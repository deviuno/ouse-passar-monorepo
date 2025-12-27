import jsPDF from 'jspdf';
import { ParsedQuestion } from '../types';

// Motivational quotes for the cover page
const MOTIVATIONAL_QUOTES = [
  'A disciplina é a ponte entre metas e realizações.',
  'O sucesso é a soma de pequenos esforços repetidos dia após dia.',
  'Sua dedicação de hoje é sua vitória de amanhã.',
  'Não existe elevator para o sucesso. Você precisa subir as escadas.',
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

// PDF dimensions and margins (in mm)
const PAGE_WIDTH = 210; // A4 width
const PAGE_HEIGHT = 297; // A4 height
const MARGIN_LEFT = 15;
const MARGIN_RIGHT = 15;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 20;
const COLUMN_GAP = 10;
const COLUMN_WIDTH = (PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT - COLUMN_GAP) / 2;
const LINE_HEIGHT = 5;
const QUESTION_SPACING = 8;

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
  generateQuestionsPages(doc, questions);

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

  // Background color (dark theme)
  doc.setFillColor(18, 18, 18); // #121212
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // Brand header
  doc.setTextColor(255, 184, 0); // #FFB800
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('OUSE PASSAR', centerX, 50, { align: 'center' });

  // Tagline
  doc.setTextColor(160, 160, 160); // #A0A0A0
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Sua aprovação começa aqui', centerX, 60, { align: 'center' });

  // Decorative line
  doc.setDrawColor(255, 184, 0);
  doc.setLineWidth(0.5);
  doc.line(centerX - 40, 70, centerX + 40, 70);

  // Simulado name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const simuladoLines = splitTextToLines(doc, simuladoName.toUpperCase(), 160);
  let yPos = 100;
  simuladoLines.forEach((line: string) => {
    doc.text(line, centerX, yPos, { align: 'center' });
    yPos += 10;
  });

  // Prova number
  doc.setTextColor(255, 184, 0);
  doc.setFontSize(18);
  doc.text(`PROVA ${provaNumber + 1}`, centerX, yPos + 10, { align: 'center' });

  // Preparatorio name (if available)
  if (preparatorioName) {
    doc.setTextColor(160, 160, 160);
    doc.setFontSize(14);
    doc.text(preparatorioName, centerX, yPos + 25, { align: 'center' });
  }

  // Info box
  const boxY = 160;
  const boxHeight = 40;
  doc.setFillColor(26, 26, 26); // #1A1A1A
  doc.roundedRect(30, boxY, PAGE_WIDTH - 60, boxHeight, 5, 5, 'F');

  // Info items
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  const infoY = boxY + 15;

  // Questions count
  doc.setFont('helvetica', 'bold');
  doc.text(`${totalQuestions}`, 60, infoY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 160, 160);
  doc.text('questões', 60, infoY + 8, { align: 'center' });

  // Time
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(formatTime(totalTime), centerX, infoY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 160, 160);
  doc.text('duração', centerX, infoY + 8, { align: 'center' });

  // Date
  const today = new Date().toLocaleDateString('pt-BR');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(today, PAGE_WIDTH - 60, infoY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 160, 160);
  doc.text('data', PAGE_WIDTH - 60, infoY + 8, { align: 'center' });

  // Motivational quote
  const quote = getRandomQuote();
  doc.setTextColor(255, 184, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'italic');
  const quoteLines = splitTextToLines(doc, `"${quote}"`, 140);
  let quoteY = 220;
  quoteLines.forEach((line: string) => {
    doc.text(line, centerX, quoteY, { align: 'center' });
    quoteY += 6;
  });

  // Student info section
  const studentBoxY = 245;
  doc.setFillColor(26, 26, 26);
  doc.roundedRect(30, studentBoxY, PAGE_WIDTH - 60, 30, 5, 5, 'F');

  // Student name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(studentName || 'Aluno', centerX, studentBoxY + 12, { align: 'center' });

  // Cargo
  if (cargo) {
    doc.setTextColor(160, 160, 160);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(cargo, centerX, studentBoxY + 22, { align: 'center' });
  }

  // Footer
  doc.setTextColor(110, 110, 110); // #6E6E6E
  doc.setFontSize(8);
  doc.text('© Ouse Passar - Todos os direitos reservados', centerX, PAGE_HEIGHT - 15, { align: 'center' });
  doc.text('questoes.ousepassar.com.br', centerX, PAGE_HEIGHT - 10, { align: 'center' });
}

function generateQuestionsPages(doc: jsPDF, questions: ParsedQuestion[]): void {
  let currentColumn = 0; // 0 = left, 1 = right
  let yPosition = MARGIN_TOP;

  // Set white background for questions pages
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  // Add page header
  addPageHeader(doc);
  yPosition = MARGIN_TOP + 15;

  questions.forEach((question, index) => {
    const questionNumber = index + 1;
    const questionText = stripHtml(question.enunciado);
    const options = question.alternativas;

    // Calculate column X position
    const columnX = currentColumn === 0
      ? MARGIN_LEFT
      : MARGIN_LEFT + COLUMN_WIDTH + COLUMN_GAP;

    // Estimate question height
    const questionHeight = calculateQuestionHeight(doc, questionText, options, COLUMN_WIDTH - 5);

    // Check if question fits in current column
    const availableHeight = PAGE_HEIGHT - MARGIN_BOTTOM - yPosition;

    if (questionHeight > availableHeight) {
      // Move to next column or page
      if (currentColumn === 0) {
        // Move to right column
        currentColumn = 1;
        yPosition = MARGIN_TOP + 15; // Reset to top of column
      } else {
        // Move to new page
        doc.addPage();
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
        addPageHeader(doc);
        currentColumn = 0;
        yPosition = MARGIN_TOP + 15;
      }
    }

    // Recalculate column X after potential column/page change
    const finalColumnX = currentColumn === 0
      ? MARGIN_LEFT
      : MARGIN_LEFT + COLUMN_WIDTH + COLUMN_GAP;

    // Draw question
    yPosition = drawQuestion(doc, questionNumber, questionText, options, finalColumnX, yPosition, COLUMN_WIDTH - 5);

    // Add spacing between questions
    yPosition += QUESTION_SPACING;
  });
}

function addPageHeader(doc: jsPDF): void {
  // Header line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, MARGIN_TOP + 8, PAGE_WIDTH - MARGIN_RIGHT, MARGIN_TOP + 8);

  // Brand text
  doc.setTextColor(255, 184, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('OUSE PASSAR', MARGIN_LEFT, MARGIN_TOP + 5);

  // Page number
  const pageNum = doc.internal.pages.length - 1; // -1 because first page is cover
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Página ${pageNum}`, PAGE_WIDTH - MARGIN_RIGHT, MARGIN_TOP + 5, { align: 'right' });
}

function calculateQuestionHeight(
  doc: jsPDF,
  questionText: string,
  options: { letra: string; texto: string }[],
  maxWidth: number
): number {
  let height = 0;

  // Question number and text
  doc.setFontSize(10);
  const questionLines = splitTextToLines(doc, questionText, maxWidth - 10);
  height += 6; // Question number
  height += questionLines.length * LINE_HEIGHT;
  height += 3; // Spacing before options

  // Options
  doc.setFontSize(9);
  options.forEach((option) => {
    const optionText = `(${option.letra}) ${stripHtml(option.texto)}`;
    const optionLines = splitTextToLines(doc, optionText, maxWidth - 15);
    height += optionLines.length * (LINE_HEIGHT - 0.5);
    height += 1; // Spacing between options
  });

  return height;
}

function drawQuestion(
  doc: jsPDF,
  questionNumber: number,
  questionText: string,
  options: { letra: string; texto: string }[],
  x: number,
  startY: number,
  maxWidth: number
): number {
  let y = startY;

  // Question number
  doc.setTextColor(255, 184, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Questão ${questionNumber}`, x, y);
  y += 6;

  // Question text
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const questionLines = splitTextToLines(doc, questionText, maxWidth - 5);
  questionLines.forEach((line: string) => {
    doc.text(line, x, y);
    y += LINE_HEIGHT;
  });

  y += 3; // Spacing before options

  // Options
  doc.setFontSize(9);
  options.forEach((option) => {
    const optionText = stripHtml(option.texto);
    const fullOption = `(${option.letra}) ${optionText}`;
    const optionLines = splitTextToLines(doc, fullOption, maxWidth - 10);

    optionLines.forEach((line: string, lineIndex: number) => {
      if (lineIndex === 0) {
        // First line with letter
        doc.setTextColor(80, 80, 80);
        doc.text(line, x + 3, y);
      } else {
        // Continuation lines (indented)
        doc.text(line, x + 8, y);
      }
      y += LINE_HEIGHT - 0.5;
    });
    y += 1; // Small spacing between options
  });

  return y;
}

function generateAnswerSheet(doc: jsPDF, totalQuestions: number, provaNumber: number): void {
  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');

  const centerX = PAGE_WIDTH / 2;

  // Header
  doc.setTextColor(255, 184, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FOLHA DE RESPOSTAS', centerX, 25, { align: 'center' });

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Prova ${provaNumber + 1} - ${totalQuestions} questões`, centerX, 33, { align: 'center' });

  // Name field
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.text('Nome:', MARGIN_LEFT, 50);
  doc.setDrawColor(180, 180, 180);
  doc.line(MARGIN_LEFT + 15, 50, PAGE_WIDTH - MARGIN_RIGHT, 50);

  // Date field
  doc.text('Data:', MARGIN_LEFT, 60);
  doc.line(MARGIN_LEFT + 15, 60, MARGIN_LEFT + 60, 60);

  // Score field
  doc.text('Nota:', MARGIN_LEFT + 80, 60);
  doc.line(MARGIN_LEFT + 95, 60, MARGIN_LEFT + 130, 60);

  // Answer grid
  const gridStartY = 75;
  const cellWidth = 8;
  const cellHeight = 8;
  const columns = 5; // A, B, C, D, E
  const questionsPerRow = 10;
  const rowHeight = cellHeight + 5;

  // Column headers
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const gridStartX = MARGIN_LEFT + 20;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  letters.forEach((letter, i) => {
    doc.text(letter, gridStartX + i * (cellWidth + 2) + cellWidth / 2, gridStartY, { align: 'center' });
  });

  // Questions grid
  doc.setFont('helvetica', 'normal');
  let y = gridStartY + 8;

  for (let q = 1; q <= totalQuestions; q++) {
    const row = Math.floor((q - 1) / questionsPerRow);
    const col = (q - 1) % questionsPerRow;

    // Determine X position (two columns of questions)
    let questionX: number;
    let optionsX: number;

    if (col < 5) {
      // Left side
      questionX = MARGIN_LEFT;
      optionsX = gridStartX;
    } else {
      // Right side
      questionX = centerX + 10;
      optionsX = centerX + 30;
    }

    const questionY = gridStartY + 8 + (row * 2 + (col >= 5 ? 1 : 0)) * rowHeight;

    // Question number
    doc.setTextColor(60, 60, 60);
    doc.text(`${q}.`, questionX, questionY + cellHeight / 2 + 1);

    // Answer circles
    letters.forEach((_, i) => {
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);
      doc.circle(
        optionsX + i * (cellWidth + 2) + cellWidth / 2,
        questionY + cellHeight / 2,
        cellWidth / 2 - 1
      );
    });
  }

  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text('Marque apenas uma alternativa por questão', centerX, PAGE_HEIGHT - 20, { align: 'center' });
  doc.text('© Ouse Passar - questoes.ousepassar.com.br', centerX, PAGE_HEIGHT - 12, { align: 'center' });
}
