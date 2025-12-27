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
          <img src="https://i.ibb.co/d4bx5Cyz/ouse-passar-logo-n-1.png" alt="Ouse Passar" />
          <p class="tagline">Sua aprovação começa aqui</p>
        </div>

        <div class="title-box">
          <p class="simulado-label">SIMULADO</p>
          <h2>${options.preparatorioName || options.simuladoName}</h2>
          <p class="prova-number">PROVA ${options.provaNumber + 1}</p>
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
        <span>www.OusePassar.com</span>
      </div>
    </div>
  `;
}

function parseImageUrls(imagens: string | null | undefined): string[] {
  if (!imagens || imagens.trim() === '') return [];

  // Images can be a single URL or comma/semicolon separated URLs
  const urls = imagens.split(/[,;]/)
    .map(url => url.trim())
    .filter(url => {
      // Only include valid URLs (must start with http or https)
      return url.length > 0 && (url.startsWith('http://') || url.startsWith('https://'));
    });

  return urls;
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
        <span>www.OusePassar.com</span>
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 10mm 0;
    }

    @page :first {
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
      background: #fff;
      font-family: 'Montserrat', sans-serif;
    }

    .cover-top-bar {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      height: 12mm;
      width: 100%;
    }

    .cover-bottom-bar {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      height: 10mm;
      width: 100%;
      position: absolute;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 9pt;
      letter-spacing: 1px;
    }

    .cover-content {
      flex: 1;
      padding: 20mm 25mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
    }

    .brand {
      text-align: center;
      margin-bottom: 12mm;
    }

    .brand img {
      max-width: 180mm;
      height: auto;
      max-height: 35mm;
    }

    .brand .tagline {
      font-size: 11pt;
      font-style: italic;
      color: #666;
      letter-spacing: 1px;
      margin-top: 3mm;
    }

    .title-box {
      background: #fafafa;
      border: 2px solid #1a1a2e;
      border-radius: 2mm;
      padding: 6mm 20mm;
      text-align: center;
      width: 100%;
      margin-bottom: 9mm;
    }

    .title-box .simulado-label {
      font-family: 'Montserrat', sans-serif;
      font-size: 9pt;
      color: #888;
      margin-bottom: 2mm;
      letter-spacing: 2px;
      font-weight: 500;
    }

    .title-box h2 {
      font-family: 'Montserrat', sans-serif;
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 2mm;
      color: #1a1a2e;
    }

    .title-box .prova-number {
      font-family: 'Montserrat', sans-serif;
      font-size: 12pt;
      color: #444;
      font-weight: 600;
    }

    .info-cards {
      display: flex;
      gap: 9mm;
      margin-bottom: 10mm;
      width: 100%;
      justify-content: center;
    }

    .card {
      border: 1.5px solid #ddd;
      background: #fff;
      padding: 4.5mm 12mm;
      text-align: center;
      min-width: 48mm;
      border-radius: 1.5mm;
    }

    .card .value {
      display: block;
      font-size: 15pt;
      font-weight: bold;
      color: #1a1a2e;
    }

    .card .label {
      display: block;
      font-size: 7pt;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 1.5mm;
    }

    .quote {
      text-align: center;
      margin-bottom: 12mm;
      max-width: 150mm;
      padding: 6mm 15mm;
      background: #f8f8f8;
      border-left: 3px solid #1a1a2e;
    }

    .quote p {
      font-size: 12pt;
      font-style: italic;
      color: #444;
      line-height: 1.5;
    }

    .quote .quote-mark {
      display: none;
    }

    .student-box {
      background: #fff;
      border: 2px solid #1a1a2e;
      border-radius: 2mm;
      padding: 6mm 20mm;
      text-align: center;
      margin-bottom: 12mm;
      min-width: 120mm;
    }

    .student-box .label {
      display: block;
      font-size: 8pt;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3mm;
    }

    .student-box .name {
      display: block;
      font-size: 18pt;
      font-weight: bold;
      color: #1a1a2e;
    }

    .instructions {
      width: 100%;
      border-top: 2px solid #1a1a2e;
      padding-top: 8mm;
      margin-top: auto;
    }

    .instructions h3 {
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 4mm;
      color: #1a1a2e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .instructions ul {
      font-size: 9pt;
      margin-left: 5mm;
      color: #444;
    }

    .instructions li {
      margin-bottom: 2mm;
      line-height: 1.4;
    }

    /* Questions Container Styles */
    .questions-section {
      page-break-before: always;
    }

    .questions-header {
      width: 210mm;
      padding: 12mm 15mm 6mm 15mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #1a1a2e;
      background: #fff;
    }

    .questions-header .brand {
      font-family: 'Montserrat', sans-serif;
      font-size: 12pt;
      font-weight: bold;
      letter-spacing: 2px;
      color: #1a1a2e;
    }

    .questions-header .simulado-name {
      font-size: 10pt;
      color: #555;
      font-weight: 500;
    }

    .questions-container {
      width: 210mm;
      padding: 8mm 15mm 15mm 15mm;
      column-count: 2;
      column-gap: 8mm;
      column-rule: 1px solid #ddd;
      column-fill: auto;
    }

    .materia-header {
      background: #1a1a2e;
      color: #fff;
      padding: 2.5mm 4mm;
      margin-bottom: 4mm;
      margin-top: 5mm;
      border-radius: 1mm;
      break-inside: avoid;
      break-after: avoid;
    }

    .materia-header:first-child {
      margin-top: 0;
    }

    .materia-header span {
      font-family: 'Montserrat', sans-serif;
      font-size: 9pt;
      font-weight: bold;
      letter-spacing: 0.8px;
    }

    .question {
      margin-bottom: 5mm;
      text-align: justify;
      hyphens: auto;
      -webkit-hyphens: auto;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .question-number {
      font-family: 'Montserrat', sans-serif;
      font-weight: bold;
      font-size: 9pt;
      margin-bottom: 1.5mm;
      color: #1a1a2e;
      background: #f0f0f0;
      padding: 1mm 2mm;
      display: inline-block;
      border-radius: 0.5mm;
    }

    .question-images {
      margin: 3mm 0;
      text-align: center;
      break-inside: avoid;
    }

    .question-images img {
      max-width: 95%;
      max-height: 45mm;
      object-fit: contain;
      border: 1px solid #ddd;
      padding: 2mm;
      background: #fafafa;
      border-radius: 1mm;
    }

    .question-text {
      font-size: 9.5pt;
      line-height: 1.45;
      margin-bottom: 2.5mm;
      text-align: justify;
      hyphens: auto;
      -webkit-hyphens: auto;
      color: #222;
    }

    .alternatives {
      margin-left: 0;
      margin-top: 2mm;
    }

    .alternative {
      font-size: 9.5pt;
      line-height: 1.35;
      margin-bottom: 1.2mm;
      display: flex;
      align-items: flex-start;
    }

    .alternative .letter {
      flex-shrink: 0;
      width: 7mm;
      font-weight: 600;
      color: #333;
    }

    .alternative .text {
      flex: 1;
      text-align: justify;
      hyphens: auto;
      -webkit-hyphens: auto;
      color: #333;
    }

    /* Answer Sheet Styles */
    .answer-sheet {
      width: 210mm;
      height: 297mm;
      page-break-before: always;
      position: relative;
      background: #fff;
    }

    .answer-top-bar {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      height: 8mm;
      width: 100%;
    }

    .answer-bottom-bar {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      height: 8mm;
      width: 100%;
      position: absolute;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 8pt;
      letter-spacing: 1px;
    }

    .answer-header {
      text-align: center;
      padding: 12mm 0 8mm 0;
    }

    .answer-header h2 {
      font-size: 18pt;
      font-weight: bold;
      color: #1a1a2e;
      letter-spacing: 1px;
    }

    .answer-header p {
      font-size: 10pt;
      color: #666;
      margin-top: 2mm;
    }

    .answer-fields {
      padding: 0 20mm;
      margin-bottom: 8mm;
    }

    .field {
      display: flex;
      align-items: center;
      margin-bottom: 4mm;
    }

    .field-label {
      font-size: 10pt;
      font-weight: 500;
      margin-right: 4mm;
      color: #333;
    }

    .field-line {
      flex: 1;
      border-bottom: 1.5px solid #ccc;
      height: 1px;
    }

    .field-row {
      display: flex;
      gap: 20mm;
    }

    .field.small {
      flex: 0 0 45mm;
    }

    .answer-grid {
      padding: 0 15mm;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2.5mm 10mm;
    }

    .answer-row {
      display: flex;
      align-items: center;
      gap: 1.5mm;
    }

    .question-num {
      font-size: 8pt;
      width: 7mm;
      text-align: right;
      font-weight: 500;
      color: #444;
    }

    .circles {
      display: flex;
      gap: 0.8mm;
    }

    .circle {
      width: 4mm;
      height: 4mm;
      border: 1px solid #333;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .circle span {
      font-size: 4.5pt;
      color: #999;
    }

    .answer-footer {
      text-align: center;
      padding: 10mm;
      color: #666;
      font-size: 9pt;
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
