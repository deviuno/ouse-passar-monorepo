import puppeteer from 'puppeteer';

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

interface Alternative {
  letter: string;
  text: string;
}

interface Question {
  id: number;
  materia: string;
  assunto: string;
  enunciado: string;
  parsedAlternativas: Alternative[];
  gabarito: string;
  imagens_enunciado?: string | null;
}

interface SimuladoPDFOptions {
  simuladoName: string;
  preparatorioName?: string;
  studentName: string;
  cargo?: string;
  questions: Question[];
  totalTime: number;
  provaNumber: number;
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

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function groupQuestionsByMateria(questions: Question[]): Map<string, Question[]> {
  const grouped = new Map<string, Question[]>();

  questions.forEach(q => {
    const materia = q.materia || 'Sem Matéria';
    if (!grouped.has(materia)) {
      grouped.set(materia, []);
    }
    grouped.get(materia)!.push(q);
  });

  return grouped;
}

function generateCoverPageHTML(options: SimuladoPDFOptions): string {
  const quote = getRandomQuote();
  const today = new Date().toLocaleDateString('pt-BR');

  return `
    <div class="cover-page">
      <div class="cover-top-bar"></div>

      <div class="cover-content">
        <div class="brand">
          <h1>OUSE PASSAR</h1>
          <p class="tagline">Sua aprovação começa aqui</p>
        </div>

        <div class="title-box">
          <h2>${options.simuladoName.toUpperCase()}</h2>
          <p class="prova-number">PROVA ${options.provaNumber + 1}</p>
          ${options.preparatorioName ? `<p class="preparatorio">${options.preparatorioName}</p>` : ''}
        </div>

        <div class="info-cards">
          <div class="card">
            <span class="value">${options.questions.length}</span>
            <span class="label">QUESTÕES</span>
          </div>
          <div class="card">
            <span class="value">${formatTime(options.totalTime)}</span>
            <span class="label">DURAÇÃO</span>
          </div>
          <div class="card">
            <span class="value">${today}</span>
            <span class="label">DATA</span>
          </div>
        </div>

        <div class="quote">
          <span class="quote-mark">"</span>
          <p>${quote}</p>
          <span class="quote-mark">"</span>
        </div>

        <div class="student-box">
          <span class="label">NOME DO ALUNO</span>
          <span class="name">${options.studentName || '________________________________'}</span>
          ${options.cargo ? `<span class="cargo">${options.cargo}</span>` : ''}
        </div>

        <div class="instructions">
          <h3>INSTRUÇÕES</h3>
          <ul>
            <li>Leia atentamente cada questão antes de responder.</li>
            <li>Marque apenas uma alternativa por questão na folha de respostas.</li>
            <li>Não é permitido o uso de calculadora ou material de consulta.</li>
          </ul>
        </div>
      </div>

      <div class="cover-bottom-bar">
        <span>questoes.ousepassar.com.br</span>
      </div>
    </div>
  `;
}

function parseImageUrls(imagens: string | null | undefined): string[] {
  if (!imagens) return [];
  // Images can be a single URL or comma/semicolon separated URLs
  return imagens.split(/[,;]/).map(url => url.trim()).filter(url => url.length > 0);
}

function generateQuestionsHTML(options: SimuladoPDFOptions): string {
  const groupedQuestions = groupQuestionsByMateria(options.questions);
  let questionNumber = 0;
  let html = '';

  groupedQuestions.forEach((questions, materia) => {
    html += `
      <div class="materia-header">
        <span>${materia.toUpperCase()}</span>
      </div>
    `;

    questions.forEach(q => {
      questionNumber++;
      const enunciado = stripHtml(q.enunciado);
      const images = parseImageUrls(q.imagens_enunciado);

      html += `
        <div class="question">
          <div class="question-number">Questão ${questionNumber}</div>
          <div class="question-text">${enunciado}</div>
          ${images.length > 0 ? `
            <div class="question-images">
              ${images.map(url => `<img src="${url}" alt="Imagem da questão" />`).join('')}
            </div>
          ` : ''}
          <div class="alternatives">
            ${q.parsedAlternativas.map(alt => `
              <div class="alternative">
                <span class="letter">(${alt.letter})</span>
                <span class="text">${stripHtml(alt.text)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
  });

  return `
    <div class="questions-section">
      <div class="questions-header">
        <span class="brand">OUSE PASSAR</span>
        <span class="simulado-name">${options.simuladoName}</span>
      </div>
      <div class="questions-container">
        ${html}
      </div>
    </div>
  `;
}

function generateAnswerSheetHTML(options: SimuladoPDFOptions): string {
  const totalQuestions = options.questions.length;
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const questionsPerColumn = Math.ceil(totalQuestions / 4);

  let html = '';
  for (let q = 1; q <= totalQuestions; q++) {
    html += `
      <div class="answer-row">
        <span class="question-num">${q}.</span>
        <div class="circles">
          ${letters.map(l => `<div class="circle"><span>${l}</span></div>`).join('')}
        </div>
      </div>
    `;
  }

  return `
    <div class="answer-sheet">
      <div class="answer-top-bar"></div>

      <div class="answer-header">
        <h2>FOLHA DE RESPOSTAS</h2>
        <p>Prova ${options.provaNumber + 1} • ${totalQuestions} questões</p>
      </div>

      <div class="answer-fields">
        <div class="field">
          <span class="field-label">Nome:</span>
          <div class="field-line"></div>
        </div>
        <div class="field-row">
          <div class="field small">
            <span class="field-label">Data:</span>
            <div class="field-line"></div>
          </div>
          <div class="field small">
            <span class="field-label">Nota:</span>
            <div class="field-line"></div>
          </div>
        </div>
      </div>

      <div class="answer-grid">
        ${html}
      </div>

      <div class="answer-footer">
        <p>Marque apenas uma alternativa por questão.</p>
      </div>

      <div class="answer-bottom-bar">
        <span>questoes.ousepassar.com.br</span>
      </div>
    </div>
  `;
}

function generateFullHTML(options: SimuladoPDFOptions): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #000;
      background: #fff;
    }

    /* Cover Page Styles */
    .cover-page {
      width: 210mm;
      height: 297mm;
      padding: 0;
      page-break-after: always;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .cover-top-bar, .cover-bottom-bar {
      background: #000;
      height: 8mm;
      width: 100%;
    }

    .cover-bottom-bar {
      position: absolute;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 8pt;
    }

    .cover-content {
      flex: 1;
      padding: 15mm 20mm;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .brand {
      text-align: center;
      margin-bottom: 8mm;
    }

    .brand h1 {
      font-size: 32pt;
      font-weight: bold;
      letter-spacing: 2px;
    }

    .brand .tagline {
      font-size: 12pt;
      font-style: italic;
      color: #555;
      margin-top: 2mm;
    }

    .title-box {
      background: #f5f5f5;
      border: 1px solid #ccc;
      padding: 8mm 15mm;
      text-align: center;
      width: 100%;
      margin-bottom: 10mm;
    }

    .title-box h2 {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 3mm;
    }

    .title-box .prova-number {
      font-size: 14pt;
      color: #333;
    }

    .title-box .preparatorio {
      font-size: 11pt;
      font-style: italic;
      color: #555;
      margin-top: 2mm;
    }

    .info-cards {
      display: flex;
      gap: 8mm;
      margin-bottom: 12mm;
    }

    .card {
      border: 1px solid #ccc;
      background: #fff;
      padding: 5mm 10mm;
      text-align: center;
      min-width: 50mm;
    }

    .card .value {
      display: block;
      font-size: 14pt;
      font-weight: bold;
    }

    .card .label {
      display: block;
      font-size: 8pt;
      color: #999;
      margin-top: 2mm;
    }

    .quote {
      text-align: center;
      margin-bottom: 12mm;
      max-width: 140mm;
      position: relative;
    }

    .quote p {
      font-size: 12pt;
      font-style: italic;
      color: #333;
    }

    .quote .quote-mark {
      font-size: 24pt;
      color: #999;
      line-height: 1;
    }

    .student-box {
      background: #f5f5f5;
      border: 1px solid #ccc;
      padding: 5mm 15mm;
      text-align: center;
      margin-bottom: 15mm;
    }

    .student-box .label {
      display: block;
      font-size: 9pt;
      color: #999;
      margin-bottom: 2mm;
    }

    .student-box .name {
      display: block;
      font-size: 16pt;
      font-weight: bold;
    }

    .student-box .cargo {
      display: block;
      font-size: 11pt;
      color: #555;
      margin-top: 2mm;
    }

    .instructions {
      width: 100%;
      border-top: 1px solid #000;
      padding-top: 5mm;
    }

    .instructions h3 {
      font-size: 9pt;
      font-weight: bold;
      margin-bottom: 3mm;
    }

    .instructions ul {
      font-size: 8pt;
      margin-left: 5mm;
    }

    .instructions li {
      margin-bottom: 1mm;
    }

    /* Questions Container Styles */
    .questions-section {
      page-break-before: always;
    }

    .questions-header {
      width: 210mm;
      padding: 8mm 12mm 4mm 12mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000;
    }

    .questions-header .brand {
      font-size: 10pt;
      font-weight: bold;
      margin: 0;
    }

    .questions-header .simulado-name {
      font-size: 10pt;
    }

    .questions-container {
      width: 210mm;
      padding: 5mm 12mm 15mm 12mm;
      column-count: 2;
      column-gap: 6mm;
      column-rule: 1px solid #000;
    }

    .materia-header {
      background: #f0f0f0;
      padding: 2mm 3mm;
      margin-bottom: 3mm;
      margin-top: 4mm;
      border-bottom: 2px solid #000;
      break-inside: avoid;
      column-span: none;
    }

    .materia-header:first-child {
      margin-top: 0;
    }

    .materia-header span {
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
    }

    .question {
      margin-bottom: 5mm;
      break-inside: avoid-column;
      text-align: justify;
      hyphens: auto;
      -webkit-hyphens: auto;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .question-number {
      font-weight: bold;
      font-size: 9pt;
      margin-bottom: 1.5mm;
    }

    .question-images {
      margin: 3mm 0;
      text-align: center;
    }

    .question-images img {
      max-width: 100%;
      max-height: 60mm;
      object-fit: contain;
      margin: 2mm 0;
    }

    .question-text {
      font-size: 9pt;
      margin-bottom: 2mm;
      text-align: justify;
      hyphens: auto;
      -webkit-hyphens: auto;
    }

    .alternatives {
      margin-left: 3mm;
    }

    .alternative {
      font-size: 9pt;
      margin-bottom: 1mm;
      display: flex;
      text-align: justify;
      hyphens: auto;
      -webkit-hyphens: auto;
    }

    .alternative .letter {
      font-weight: normal;
      margin-right: 2mm;
      flex-shrink: 0;
    }

    .alternative .text {
      flex: 1;
    }

    /* Answer Sheet Styles */
    .answer-sheet {
      width: 210mm;
      height: 297mm;
      page-break-before: always;
      position: relative;
    }

    .answer-top-bar, .answer-bottom-bar {
      background: #000;
      height: 6mm;
      width: 100%;
    }

    .answer-bottom-bar {
      position: absolute;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 8pt;
    }

    .answer-header {
      text-align: center;
      padding: 8mm 0;
    }

    .answer-header h2 {
      font-size: 16pt;
      font-weight: bold;
    }

    .answer-header p {
      font-size: 11pt;
      color: #555;
      margin-top: 2mm;
    }

    .answer-fields {
      padding: 0 15mm;
      margin-bottom: 5mm;
    }

    .field {
      display: flex;
      align-items: center;
      margin-bottom: 3mm;
    }

    .field-label {
      font-size: 10pt;
      margin-right: 3mm;
    }

    .field-line {
      flex: 1;
      border-bottom: 1px solid #ccc;
      height: 1px;
    }

    .field-row {
      display: flex;
      gap: 15mm;
    }

    .field.small {
      flex: 0 0 40mm;
    }

    .answer-grid {
      padding: 0 12mm;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2mm 8mm;
    }

    .answer-row {
      display: flex;
      align-items: center;
      gap: 2mm;
    }

    .question-num {
      font-size: 8pt;
      width: 8mm;
      text-align: right;
    }

    .circles {
      display: flex;
      gap: 1mm;
    }

    .circle {
      width: 4.5mm;
      height: 4.5mm;
      border: 1px solid #000;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .circle span {
      font-size: 5pt;
      color: #999;
    }

    .answer-footer {
      text-align: center;
      padding: 8mm;
      color: #555;
      font-size: 8pt;
    }
  </style>
</head>
<body>
  ${generateCoverPageHTML(options)}
  ${generateQuestionsHTML(options)}
  ${generateAnswerSheetHTML(options)}
</body>
</html>
  `;
}

let browser: puppeteer.Browser | null = null;

async function getBrowser(): Promise<puppeteer.Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=medium',
        '--force-color-profile=srgb',
      ],
    });
  }
  return browser;
}

export async function generateSimuladoPDF(options: SimuladoPDFOptions): Promise<Buffer> {
  const html = generateFullHTML(options);

  const browserInstance = await getBrowser();
  const page = await browserInstance.newPage();

  try {
    // Set viewport for high quality rendering
    await page.setViewport({
      width: 794, // A4 width at 96 DPI
      height: 1123, // A4 height at 96 DPI
      deviceScaleFactor: 2, // 2x scale for better quality
    });

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    // Wait for fonts and images to load
    await page.evaluateHandle('document.fonts.ready');
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'));
      await Promise.all(
        images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve, reject) => {
            img.addEventListener('load', resolve);
            img.addEventListener('error', resolve); // Don't fail on broken images
          });
        })
      );
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      scale: 1,
      margin: {
        top: '0mm',
        bottom: '0mm',
        left: '0mm',
        right: '0mm',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
