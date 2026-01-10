import puppeteer from 'puppeteer';

// ============================================================================
// TIPOS
// ============================================================================

export interface CurriculumEducation {
  level: string;
  area?: string;
  institution: string;
  startDate?: string;
  endDate?: string;
  inProgress?: boolean;
}

export interface CurriculumExperience {
  position: string;
  company: string;
  sector?: string;
  startDate?: string;
  endDate?: string;
  currentJob?: boolean;
  description?: string;
}

export interface CurriculumCourse {
  name: string;
  institution: string;
  description?: string;
}

export interface CurriculumLanguage {
  name: string;
  level: string;
}

export interface CurriculumData {
  candidateName: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  neighborhood?: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string;
  summary?: string;
  avatarUrl?: string;
  educationLevel?: string;
  yearsOfExperience?: number;
  expectedSalary?: number;
  minimumSalary?: number;
  immediateAvailability?: boolean;
  hasDisability?: boolean;
  disabilityDescription?: string;
  contractTypes?: string[];
  skills?: string[];
  education?: CurriculumEducation[];
  experiences?: CurriculumExperience[];
  courses?: CurriculumCourse[];
  languages?: CurriculumLanguage[];
}

// ============================================================================
// FUNCOES AUXILIARES
// ============================================================================

function escapeHtml(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatCurrency(value: number | undefined | null): string {
  if (!value) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(value / 100);
}

function calculateAge(birthDate: string | undefined | null): number | null {
  if (!birthDate) return null;
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}

export function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
}

export type CurriculumType = 'simples' | 'completo';

// ============================================================================
// GERACAO DO HTML - PDF SIMPLES (Preto e Branco)
// ============================================================================

function generateSimpleCurriculumHTML(data: CurriculumData): string {
  const age = calculateAge(data.birthDate);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Curriculo - ${escapeHtml(data.candidateName)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Times New Roman', Georgia, serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #333;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm 25mm;
      background: #ffffff;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #333;
    }

    .candidate-name {
      font-size: 20pt;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
      text-transform: uppercase;
    }

    .candidate-title {
      font-size: 12pt;
      color: #444;
      font-style: italic;
      margin-bottom: 10px;
    }

    .contact-info {
      font-size: 10pt;
      color: #555;
    }

    .contact-info span {
      margin: 0 10px;
    }

    .contact-info span:not(:last-child)::after {
      content: "|";
      margin-left: 20px;
      color: #999;
    }

    /* Info Line */
    .info-line {
      font-size: 10pt;
      color: #555;
      text-align: center;
      margin-bottom: 20px;
      padding: 8px 0;
      border-bottom: 1px solid #ccc;
    }

    .info-line span {
      margin: 0 8px;
    }

    /* Sections */
    .section {
      margin-bottom: 18px;
    }

    .section-title {
      font-size: 12pt;
      font-weight: bold;
      color: #333;
      text-transform: uppercase;
      border-bottom: 1px solid #666;
      padding-bottom: 4px;
      margin-bottom: 10px;
      letter-spacing: 1px;
    }

    .section-content {
      color: #444;
      text-align: justify;
    }

    /* Items */
    .item {
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px dotted #ccc;
    }

    .item:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      flex-wrap: wrap;
    }

    .item-title {
      font-weight: bold;
      font-size: 11pt;
      color: #333;
    }

    .item-period {
      font-size: 10pt;
      color: #666;
      font-style: italic;
    }

    .item-company {
      font-size: 10pt;
      color: #555;
      margin-top: 2px;
    }

    .item-description {
      font-size: 10pt;
      color: #555;
      margin-top: 6px;
      text-align: justify;
    }

    /* Skills */
    .skills-list {
      font-size: 10pt;
      color: #444;
    }

    /* Languages */
    .language-item {
      display: inline-block;
      margin-right: 20px;
      font-size: 10pt;
    }

    .language-name {
      font-weight: bold;
    }

    .language-level {
      color: #555;
    }

    /* Footer */
    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #ccc;
      text-align: center;
      font-size: 9pt;
      color: #888;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .page {
        margin: 0;
        padding: 15mm 20mm;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="candidate-name">${escapeHtml(data.candidateName)}</div>
      ${data.title ? `<div class="candidate-title">${escapeHtml(data.title)}</div>` : ''}
      <div class="contact-info">
        ${data.email ? `<span>${escapeHtml(data.email)}</span>` : ''}
        ${data.phone ? `<span>${escapeHtml(data.phone)}</span>` : ''}
        ${data.location ? `<span>${escapeHtml(data.location)}${data.neighborhood ? ` - ${escapeHtml(data.neighborhood)}` : ''}</span>` : ''}
      </div>
    </div>

    <!-- Info Line -->
    ${(age || data.gender || data.maritalStatus || data.educationLevel || data.yearsOfExperience !== undefined) ? `
      <div class="info-line">
        ${age ? `<span>${age} anos</span>` : ''}
        ${data.gender ? `<span>${escapeHtml(data.gender)}</span>` : ''}
        ${data.maritalStatus ? `<span>${escapeHtml(data.maritalStatus)}</span>` : ''}
        ${data.educationLevel ? `<span>${escapeHtml(data.educationLevel)}</span>` : ''}
        ${data.yearsOfExperience !== undefined ? `<span>${data.yearsOfExperience} ${data.yearsOfExperience === 1 ? 'ano' : 'anos'} de experiencia</span>` : ''}
        ${data.immediateAvailability ? `<span>Disponibilidade Imediata</span>` : ''}
        ${data.hasDisability ? `<span>PCD</span>` : ''}
      </div>
    ` : ''}

    <!-- Summary -->
    ${data.summary ? `
      <div class="section">
        <div class="section-title">Objetivo / Resumo</div>
        <div class="section-content">${escapeHtml(data.summary)}</div>
      </div>
    ` : ''}

    <!-- Experiences -->
    ${data.experiences && data.experiences.length > 0 ? `
      <div class="section">
        <div class="section-title">Experiencia Profissional</div>
        ${data.experiences.map(exp => `
          <div class="item">
            <div class="item-header">
              <span class="item-title">${escapeHtml(exp.position)}</span>
              <span class="item-period">${formatDate(exp.startDate)} - ${exp.currentJob ? 'Atual' : formatDate(exp.endDate)}</span>
            </div>
            <div class="item-company">${escapeHtml(exp.company)}${exp.sector ? ` | ${escapeHtml(exp.sector)}` : ''}</div>
            ${exp.description ? `<div class="item-description">${escapeHtml(exp.description)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Education -->
    ${data.education && data.education.length > 0 ? `
      <div class="section">
        <div class="section-title">Formacao Academica</div>
        ${data.education.map(edu => `
          <div class="item">
            <div class="item-header">
              <span class="item-title">${escapeHtml(edu.level)}${edu.area ? ` - ${escapeHtml(edu.area)}` : ''}</span>
              <span class="item-period">${formatDate(edu.startDate)}${edu.endDate ? ` - ${formatDate(edu.endDate)}` : ''}${edu.inProgress ? ' - Em andamento' : ''}</span>
            </div>
            <div class="item-company">${escapeHtml(edu.institution)}</div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Courses -->
    ${data.courses && data.courses.length > 0 ? `
      <div class="section">
        <div class="section-title">Cursos e Certificacoes</div>
        ${data.courses.map(course => `
          <div class="item">
            <div class="item-title">${escapeHtml(course.name)}</div>
            <div class="item-company">${escapeHtml(course.institution)}</div>
            ${course.description ? `<div class="item-description">${escapeHtml(course.description)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Skills -->
    ${data.skills && data.skills.length > 0 ? `
      <div class="section">
        <div class="section-title">Habilidades</div>
        <p class="skills-list">${data.skills.map(s => escapeHtml(s)).join(' | ')}</p>
      </div>
    ` : ''}

    <!-- Languages -->
    ${data.languages && data.languages.length > 0 ? `
      <div class="section">
        <div class="section-title">Idiomas</div>
        ${data.languages.map(lang => `
          <span class="language-item">
            <span class="language-name">${escapeHtml(lang.name)}:</span>
            <span class="language-level">${escapeHtml(lang.level)}</span>
          </span>
        `).join('')}
      </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      Curriculo gerado em ${new Date().toLocaleDateString('pt-BR')} | Pesca Talentos
    </div>
  </div>
</body>
</html>
  `;
}

// ============================================================================
// GERACAO DO HTML - PDF COMPLETO (Com cores e foto)
// ============================================================================

function generateCompleteCurriculumHTML(data: CurriculumData): string {
  const age = calculateAge(data.birthDate);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Curriculo - ${escapeHtml(data.candidateName)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #1a1a1a;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm 18mm;
      background: #ffffff;
    }

    .container {
      max-width: 100%;
    }

    /* Header */
    .header {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #2563eb;
    }

    .avatar-container {
      flex-shrink: 0;
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #2563eb;
    }

    .avatar-placeholder {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 28px;
      font-weight: 700;
    }

    .header-info {
      flex: 1;
    }

    .candidate-name {
      font-size: 22pt;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 4px;
    }

    .candidate-title {
      font-size: 12pt;
      color: #2563eb;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .contact-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 20px;
      font-size: 9pt;
      color: #4b5563;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .contact-icon {
      color: #2563eb;
      font-weight: 600;
    }

    /* Info Bar */
    .info-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 15px 25px;
      padding: 12px 15px;
      background: #f8fafc;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 9pt;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .info-label {
      color: #6b7280;
    }

    .info-value {
      font-weight: 600;
      color: #1a1a1a;
    }

    .contract-types {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }

    .contract-tag {
      padding: 3px 10px;
      background: #2563eb;
      color: white;
      border-radius: 12px;
      font-size: 8pt;
      font-weight: 500;
    }

    /* Sections */
    .section {
      margin-bottom: 18px;
    }

    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: #1a1a1a;
      padding-bottom: 6px;
      border-bottom: 2px solid #2563eb;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Summary */
    .summary-box {
      padding: 12px 15px;
      background: #f8fafc;
      border-left: 3px solid #2563eb;
      border-radius: 0 6px 6px 0;
      font-size: 9.5pt;
      line-height: 1.5;
      color: #374151;
    }

    /* Two Columns */
    .two-columns {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 25px;
    }

    /* Item Cards */
    .item-card {
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e5e7eb;
    }

    .item-card:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .item-header {
      margin-bottom: 6px;
    }

    .item-title {
      font-size: 10pt;
      font-weight: 600;
      color: #1a1a1a;
    }

    .item-subtitle {
      font-size: 9pt;
      color: #2563eb;
      font-weight: 500;
    }

    .item-period {
      font-size: 8.5pt;
      color: #6b7280;
      margin-top: 2px;
    }

    .item-description {
      font-size: 9pt;
      color: #4b5563;
      line-height: 1.45;
      margin-top: 6px;
    }

    /* Skills */
    .skills-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .skill-tag {
      padding: 4px 10px;
      background: #eff6ff;
      color: #1d4ed8;
      border-radius: 4px;
      font-size: 8.5pt;
      font-weight: 500;
    }

    /* Languages */
    .language-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .language-item:last-child {
      border-bottom: none;
    }

    .language-name {
      font-weight: 500;
      font-size: 9pt;
    }

    .language-level {
      color: #2563eb;
      font-size: 8.5pt;
      font-weight: 500;
    }

    /* Courses */
    .course-item {
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .course-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }

    .course-name {
      font-weight: 600;
      font-size: 9pt;
      color: #1a1a1a;
    }

    .course-institution {
      font-size: 8.5pt;
      color: #2563eb;
    }

    .course-description {
      font-size: 8.5pt;
      color: #6b7280;
      margin-top: 2px;
    }

    /* Footer */
    .footer {
      margin-top: 25px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 8pt;
      color: #9ca3af;
    }

    .footer-brand {
      color: #2563eb;
      font-weight: 600;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .page {
        margin: 0;
        padding: 15mm 18mm;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="container">
      <!-- Header -->
      <div class="header">
        ${data.avatarUrl ? `
          <div class="avatar-container">
            <img src="${escapeHtml(data.avatarUrl)}" alt="Foto" class="avatar" />
          </div>
        ` : `
          <div class="avatar-container">
            <div class="avatar-placeholder">
              ${escapeHtml(data.candidateName.charAt(0).toUpperCase())}
            </div>
          </div>
        `}

        <div class="header-info">
          <div class="candidate-name">${escapeHtml(data.candidateName)}</div>
          ${data.title ? `<div class="candidate-title">${escapeHtml(data.title)}</div>` : ''}

          <div class="contact-grid">
            ${data.email ? `
              <div class="contact-item">
                <span class="contact-icon">@</span>
                <span>${escapeHtml(data.email)}</span>
              </div>
            ` : ''}
            ${data.phone ? `
              <div class="contact-item">
                <span class="contact-icon">Tel:</span>
                <span>${escapeHtml(data.phone)}</span>
              </div>
            ` : ''}
            ${data.location ? `
              <div class="contact-item">
                <span class="contact-icon">Local:</span>
                <span>${escapeHtml(data.location)}${data.neighborhood ? ` - ${escapeHtml(data.neighborhood)}` : ''}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Info Bar -->
      <div class="info-bar">
        ${age ? `
          <div class="info-item">
            <span class="info-label">Idade:</span>
            <span class="info-value">${age} anos</span>
          </div>
        ` : ''}
        ${data.gender ? `
          <div class="info-item">
            <span class="info-label">Genero:</span>
            <span class="info-value">${escapeHtml(data.gender)}</span>
          </div>
        ` : ''}
        ${data.maritalStatus ? `
          <div class="info-item">
            <span class="info-label">Estado Civil:</span>
            <span class="info-value">${escapeHtml(data.maritalStatus)}</span>
          </div>
        ` : ''}
        ${data.educationLevel ? `
          <div class="info-item">
            <span class="info-label">Escolaridade:</span>
            <span class="info-value">${escapeHtml(data.educationLevel)}</span>
          </div>
        ` : ''}
        ${data.yearsOfExperience !== undefined ? `
          <div class="info-item">
            <span class="info-label">Experiencia:</span>
            <span class="info-value">${data.yearsOfExperience} ${data.yearsOfExperience === 1 ? 'ano' : 'anos'}</span>
          </div>
        ` : ''}
        ${data.immediateAvailability ? `
          <div class="info-item">
            <span class="info-value" style="color: #16a34a;">Disponibilidade Imediata</span>
          </div>
        ` : ''}
        ${data.hasDisability ? `
          <div class="info-item">
            <span class="info-value" style="color: #2563eb;">PCD${data.disabilityDescription ? `: ${escapeHtml(data.disabilityDescription)}` : ''}</span>
          </div>
        ` : ''}
        ${data.minimumSalary || data.expectedSalary ? `
          <div class="info-item">
            <span class="info-label">Pretensao:</span>
            <span class="info-value">
              ${data.minimumSalary ? formatCurrency(data.minimumSalary) : ''}
              ${data.minimumSalary && data.expectedSalary ? ' - ' : ''}
              ${data.expectedSalary ? formatCurrency(data.expectedSalary) : ''}
            </span>
          </div>
        ` : ''}
      </div>

      ${data.contractTypes && data.contractTypes.length > 0 ? `
        <div class="contract-types" style="margin-bottom: 20px; margin-top: -10px;">
          ${data.contractTypes.map(type => `<span class="contract-tag">${escapeHtml(type)}</span>`).join('')}
        </div>
      ` : ''}

      <!-- Summary -->
      ${data.summary ? `
        <div class="section">
          <div class="section-title">Resumo Profissional</div>
          <div class="summary-box">${escapeHtml(data.summary)}</div>
        </div>
      ` : ''}

      <!-- Two Columns Layout -->
      <div class="two-columns">
        <div>
          <!-- Experiences -->
          ${data.experiences && data.experiences.length > 0 ? `
            <div class="section">
              <div class="section-title">Experiencia Profissional</div>
              ${data.experiences.map(exp => `
                <div class="item-card">
                  <div class="item-header">
                    <div class="item-title">${escapeHtml(exp.position)}</div>
                    <div class="item-subtitle">${escapeHtml(exp.company)}${exp.sector ? ` | ${escapeHtml(exp.sector)}` : ''}</div>
                    <div class="item-period">
                      ${formatDate(exp.startDate)} - ${exp.currentJob ? 'Atual' : formatDate(exp.endDate)}
                    </div>
                  </div>
                  ${exp.description ? `<div class="item-description">${escapeHtml(exp.description)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Education -->
          ${data.education && data.education.length > 0 ? `
            <div class="section">
              <div class="section-title">Formacao Academica</div>
              ${data.education.map(edu => `
                <div class="item-card">
                  <div class="item-header">
                    <div class="item-title">${escapeHtml(edu.level)}${edu.area ? ` - ${escapeHtml(edu.area)}` : ''}</div>
                    <div class="item-subtitle">${escapeHtml(edu.institution)}</div>
                    <div class="item-period">
                      ${formatDate(edu.startDate)}${edu.endDate ? ` - ${formatDate(edu.endDate)}` : ''}${edu.inProgress ? ' - Em andamento' : ''}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div>
          <!-- Skills -->
          ${data.skills && data.skills.length > 0 ? `
            <div class="section">
              <div class="section-title">Habilidades</div>
              <div class="skills-container">
                ${data.skills.map(skill => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Languages -->
          ${data.languages && data.languages.length > 0 ? `
            <div class="section">
              <div class="section-title">Idiomas</div>
              ${data.languages.map(lang => `
                <div class="language-item">
                  <span class="language-name">${escapeHtml(lang.name)}</span>
                  <span class="language-level">${escapeHtml(lang.level)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Courses -->
          ${data.courses && data.courses.length > 0 ? `
            <div class="section">
              <div class="section-title">Cursos e Certificacoes</div>
              ${data.courses.map(course => `
                <div class="course-item">
                  <div class="course-name">${escapeHtml(course.name)}</div>
                  <div class="course-institution">${escapeHtml(course.institution)}</div>
                  ${course.description ? `<div class="course-description">${escapeHtml(course.description)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        Curriculo gerado em ${new Date().toLocaleDateString('pt-BR')} |
        <span class="footer-brand">Pesca Talentos</span>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// ============================================================================
// GERACAO DO PDF
// ============================================================================

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
        '--disable-software-rasterizer',
        '--disable-extensions',
      ],
    });
  }
  return browser;
}

export async function generateCurriculumPDF(data: CurriculumData, type: CurriculumType = 'completo'): Promise<Buffer> {
  const html = type === 'simples'
    ? generateSimpleCurriculumHTML(data)
    : generateCompleteCurriculumHTML(data);

  const browserInstance = await getBrowser();
  const page = await browserInstance.newPage();

  try {
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2,
    });

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Aguardar fontes carregarem
    await page.evaluateHandle('document.fonts.ready');

    // Se tem avatar, aguardar imagem carregar
    if (data.avatarUrl) {
      await page.waitForSelector('img.avatar', { timeout: 5000 }).catch(() => {
        console.log('[CurriculoPDF] Avatar image not found or timed out');
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

export async function closeCurriculoBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
