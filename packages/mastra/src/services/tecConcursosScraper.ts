/**
 * TecConcursos Scraper Service
 *
 * Serviço autônomo para coletar questões do TecConcursos usando Puppeteer.
 *
 * Fluxo:
 * 1. Login no TecConcursos
 * 2. Navegar para área de questões
 * 3. Criar cadernos por área (Policial, etc.) respeitando limite de 30k
 * 4. Coletar questões de cada caderno
 * 5. Salvar no banco de dados
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ==================== CONFIGURAÇÕES ====================

const CONFIG = {
  baseUrl: 'https://www.tecconcursos.com.br',
  loginUrl: 'https://www.tecconcursos.com.br/login',
  pastasUrl: 'https://www.tecconcursos.com.br/questoes/pastas',
  maxQuestoesPorCaderno: 30000,
  // Credenciais (em produção, usar variáveis de ambiente)
  credentials: {
    email: process.env.TECCONCURSOS_EMAIL || 'engenheirosdaweb2@gmail.com',
    password: process.env.TECCONCURSOS_PASSWORD || '123456789',
  },
  // Áreas para scraping (em ordem de prioridade)
  areas: [
    'Policial',
    'Fiscal',
    'Tribunais e MPU',
    'Administrativa',
    'Bancária',
    'Controle',
    'Gestão e Governança',
    'Regulação',
    'Legislativo',
    'Diplomacia',
    'Militar',
    'Outras Carreiras',
  ],
  // Delays para evitar bloqueio
  delays: {
    afterLogin: 3000,
    afterPageLoad: 2000,
    betweenQuestions: 500,
    betweenCadernos: 5000,
  },
};

// ==================== INTERFACES ====================

interface MateriaQuantidade {
  nome: string;
  quantidade: number;
  selecionada: boolean;
}

interface CadernoInfo {
  id: string;
  nome: string;
  area: string;
  totalQuestoes: number;
  url: string;
}

interface QuestaoColetada {
  id: string;
  materia: string;
  assunto: string | null;
  enunciado: string;
  alternativas: { letter: string; text: string }[];
  gabarito: string | null;
  comentario: string | null;
  ano: number | null;
  orgao: string | null;
  cargo: string | null;
  prova: string | null;
  banca: string | null;
  concurso: string | null;
  imagensEnunciado: string[];
  imagensComentario: string[];
}

interface ScrapingProgress {
  area: string;
  caderno: string;
  questoesColetadas: number;
  questoesTotal: number;
  status: 'running' | 'completed' | 'error' | 'paused';
  lastError?: string;
  startedAt: Date;
  updatedAt: Date;
}

// ==================== ESTADO GLOBAL ====================

let _browser: Browser | null = null;
let _page: Page | null = null;
let _isLoggedIn = false;
let _isRunning = false;
let _progress: ScrapingProgress | null = null;
let _supabase: SupabaseClient | null = null;

// ==================== FUNÇÕES AUXILIARES ====================

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.VITE_SUPABASE_URL || '';
    const key = process.env.VITE_SUPABASE_ANON_KEY || '';
    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const prefix = '[TecConcursosScraper]';
  const timestamp = new Date().toISOString();
  const logMessage = `${prefix} [${timestamp}] ${message}`;

  switch (level) {
    case 'error':
      console.error(logMessage);
      break;
    case 'warn':
      console.warn(logMessage);
      break;
    default:
      console.log(logMessage);
  }
}

// ==================== BROWSER MANAGEMENT ====================

async function initBrowser(): Promise<Browser> {
  if (_browser) {
    return _browser;
  }

  log('Iniciando navegador...');

  _browser = await puppeteer.launch({
    headless: true, // Usar 'new' para headless mais moderno
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  });

  log('Navegador iniciado com sucesso');
  return _browser;
}

async function getPage(): Promise<Page> {
  if (_page && !_page.isClosed()) {
    return _page;
  }

  const browser = await initBrowser();
  _page = await browser.newPage();

  // Configurar user agent para parecer um navegador real
  await _page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  // Configurar timeouts
  _page.setDefaultTimeout(30000);
  _page.setDefaultNavigationTimeout(60000);

  return _page;
}

async function closeBrowser(): Promise<void> {
  if (_page && !_page.isClosed()) {
    await _page.close();
    _page = null;
  }

  if (_browser) {
    await _browser.close();
    _browser = null;
  }

  _isLoggedIn = false;
  log('Navegador fechado');
}

// ==================== AUTENTICAÇÃO ====================

async function login(): Promise<boolean> {
  if (_isLoggedIn) {
    log('Já está logado');
    return true;
  }

  const page = await getPage();

  try {
    log('Navegando para página de login...');
    await page.goto(CONFIG.loginUrl, { waitUntil: 'networkidle2' });

    // Aguardar formulário de login
    await page.waitForSelector('input[type="email"], input[name="email"], #email', { timeout: 10000 });

    log('Preenchendo credenciais...');

    // Tentar diferentes seletores para o campo de email
    const emailSelectors = ['input[type="email"]', 'input[name="email"]', '#email', 'input[placeholder*="mail"]'];
    let emailInput = null;
    for (const selector of emailSelectors) {
      emailInput = await page.$(selector);
      if (emailInput) break;
    }

    if (!emailInput) {
      throw new Error('Campo de email não encontrado');
    }

    await emailInput.click({ clickCount: 3 });
    await emailInput.type(CONFIG.credentials.email, { delay: 50 });

    // Tentar diferentes seletores para o campo de senha
    const passwordSelectors = ['input[type="password"]', 'input[name="password"]', '#password'];
    let passwordInput = null;
    for (const selector of passwordSelectors) {
      passwordInput = await page.$(selector);
      if (passwordInput) break;
    }

    if (!passwordInput) {
      throw new Error('Campo de senha não encontrado');
    }

    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type(CONFIG.credentials.password, { delay: 50 });

    // Clicar no botão de login
    log('Enviando formulário de login...');
    const submitSelectors = ['button[type="submit"]', 'input[type="submit"]', 'button:contains("Entrar")', '.btn-login'];

    for (const selector of submitSelectors) {
      const submitBtn = await page.$(selector);
      if (submitBtn) {
        await submitBtn.click();
        break;
      }
    }

    // Aguardar navegação pós-login
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await delay(CONFIG.delays.afterLogin);

    // Verificar se o login foi bem-sucedido
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');

    if (isLoginPage) {
      // Verificar se há mensagem de erro
      const errorMessage = await page.$eval('.alert-danger, .error-message, .login-error', el => el.textContent).catch(() => null);
      if (errorMessage) {
        throw new Error(`Falha no login: ${errorMessage}`);
      }
      throw new Error('Login falhou - ainda na página de login');
    }

    _isLoggedIn = true;
    log('Login realizado com sucesso!');
    return true;

  } catch (error) {
    log(`Erro no login: ${error instanceof Error ? error.message : String(error)}`, 'error');
    _isLoggedIn = false;
    return false;
  }
}

// ==================== NAVEGAÇÃO E CRIAÇÃO DE CADERNOS ====================

async function navegarParaPastas(): Promise<boolean> {
  const page = await getPage();

  try {
    log('Navegando para página de pastas/cadernos...');
    await page.goto(CONFIG.pastasUrl, { waitUntil: 'networkidle2' });
    await delay(CONFIG.delays.afterPageLoad);

    // Verificar se chegou na página correta
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      log('Redirecionado para login, tentando logar novamente...', 'warn');
      _isLoggedIn = false;
      return await login() && await navegarParaPastas();
    }

    return true;
  } catch (error) {
    log(`Erro ao navegar para pastas: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return false;
  }
}

async function selecionarArea(areaNome: string): Promise<boolean> {
  const page = await getPage();

  try {
    log(`Selecionando área: ${areaNome}`);

    // Clicar em "Novo Caderno"
    const novoCadernoBtn = await page.$('button:has-text("Novo Caderno"), a:has-text("Novo Caderno"), .btn-novo-caderno');
    if (novoCadernoBtn) {
      await novoCadernoBtn.click();
      await delay(CONFIG.delays.afterPageLoad);
    }

    // Encontrar e clicar no filtro de área
    // Isso vai depender da estrutura do site
    const areaFilterSelector = `[data-area="${areaNome}"], label:has-text("${areaNome}"), .area-filter:has-text("${areaNome}")`;

    await page.waitForSelector(areaFilterSelector, { timeout: 10000 }).catch(() => null);
    const areaFilter = await page.$(areaFilterSelector);

    if (areaFilter) {
      await areaFilter.click();
      await delay(CONFIG.delays.afterPageLoad);
      return true;
    }

    // Tentar abordagem alternativa - clicar no accordion/dropdown de área
    const areaAccordion = await page.$$('.area-item, .filter-area, .accordion-item');
    for (const item of areaAccordion) {
      const text = await item.evaluate(el => el.textContent);
      if (text?.includes(areaNome)) {
        await item.click();
        await delay(CONFIG.delays.afterPageLoad);
        return true;
      }
    }

    log(`Área "${areaNome}" não encontrada`, 'warn');
    return false;

  } catch (error) {
    log(`Erro ao selecionar área: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return false;
  }
}

async function obterMateriasComQuantidades(): Promise<MateriaQuantidade[]> {
  const page = await getPage();
  const materias: MateriaQuantidade[] = [];

  try {
    log('Obtendo matérias e quantidades...');

    // Clicar em "Editar quantidades"
    const editarQtdBtn = await page.$('a:has-text("Editar quantidades"), button:has-text("Editar quantidades"), .edit-quantities');
    if (editarQtdBtn) {
      await editarQtdBtn.click();
      await delay(CONFIG.delays.afterPageLoad);
    }

    // Coletar todas as matérias com suas quantidades
    const materiaElements = await page.$$('.materia-item, .subject-row, tr[data-materia]');

    for (const element of materiaElements) {
      const nome = await element.$eval('.materia-nome, .subject-name, td:first-child', el => el.textContent?.trim() || '').catch(() => '');
      const qtdText = await element.$eval('.materia-qtd, .subject-count, input[type="number"]', el => {
        if (el instanceof HTMLInputElement) return el.value;
        return el.textContent?.trim() || '0';
      }).catch(() => '0');

      const quantidade = parseInt(qtdText.replace(/\D/g, '')) || 0;

      if (nome && quantidade > 0) {
        materias.push({
          nome,
          quantidade,
          selecionada: false,
        });
      }
    }

    log(`Encontradas ${materias.length} matérias`);
    return materias;

  } catch (error) {
    log(`Erro ao obter matérias: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return materias;
  }
}

async function configurarCaderno(materias: MateriaQuantidade[], indiceInicial: number): Promise<{ materiasUsadas: number; totalQuestoes: number }> {
  const page = await getPage();
  let totalQuestoes = 0;
  let materiasUsadas = 0;

  try {
    // Primeiro, zerar todas as quantidades
    log('Zerando todas as quantidades...');
    const inputs = await page.$$('input[type="number"].materia-qtd, input.subject-quantity');
    for (const input of inputs) {
      await input.click({ clickCount: 3 });
      await input.type('0');
    }

    // Adicionar matérias até atingir o limite
    for (let i = indiceInicial; i < materias.length; i++) {
      const materia = materias[i];

      if (totalQuestoes + materia.quantidade > CONFIG.maxQuestoesPorCaderno) {
        // Se adicionar essa matéria ultrapassar o limite, parar
        if (materiasUsadas === 0) {
          // Se é a primeira matéria e já ultrapassa, adicionar parcialmente
          const qtdParcial = CONFIG.maxQuestoesPorCaderno - totalQuestoes;
          // Encontrar o input da matéria e definir quantidade parcial
          const materiaInput = await page.$(`input[data-materia="${materia.nome}"], tr:has-text("${materia.nome}") input`);
          if (materiaInput) {
            await materiaInput.click({ clickCount: 3 });
            await materiaInput.type(String(qtdParcial));
            totalQuestoes += qtdParcial;
            materiasUsadas++;
          }
        }
        break;
      }

      // Encontrar o input da matéria e definir quantidade
      const materiaInput = await page.$(`input[data-materia="${materia.nome}"], tr:has-text("${materia.nome}") input`);
      if (materiaInput) {
        await materiaInput.click({ clickCount: 3 });
        await materiaInput.type(String(materia.quantidade));
        totalQuestoes += materia.quantidade;
        materiasUsadas++;
        materia.selecionada = true;
      }
    }

    return { materiasUsadas, totalQuestoes };

  } catch (error) {
    log(`Erro ao configurar caderno: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return { materiasUsadas, totalQuestoes };
  }
}

async function removerQuestoesDesatualizadasEAnuladas(): Promise<void> {
  const page = await getPage();

  try {
    log('Removendo questões desatualizadas e anuladas...');

    // Procurar checkboxes para remover questões desatualizadas
    const desatualizadasCheckbox = await page.$('input[name="remover_desatualizadas"], #remover-desatualizadas, label:has-text("desatualizada") input');
    if (desatualizadasCheckbox) {
      const isChecked = await desatualizadasCheckbox.evaluate(el => (el as HTMLInputElement).checked);
      if (!isChecked) {
        await desatualizadasCheckbox.click();
      }
    }

    // Procurar checkbox para remover questões anuladas
    const anuladasCheckbox = await page.$('input[name="remover_anuladas"], #remover-anuladas, label:has-text("anulada") input');
    if (anuladasCheckbox) {
      const isChecked = await anuladasCheckbox.evaluate(el => (el as HTMLInputElement).checked);
      if (!isChecked) {
        await anuladasCheckbox.click();
      }
    }

  } catch (error) {
    log(`Erro ao configurar filtros: ${error instanceof Error ? error.message : String(error)}`, 'warn');
  }
}

async function salvarCaderno(nome: string): Promise<CadernoInfo | null> {
  const page = await getPage();

  try {
    log(`Salvando caderno: ${nome}`);

    // Preencher nome do caderno
    const nomeInput = await page.$('input[name="nome_caderno"], #nome-caderno, input[placeholder*="nome"]');
    if (nomeInput) {
      await nomeInput.click({ clickCount: 3 });
      await nomeInput.type(nome);
    }

    // Clicar em salvar
    const salvarBtn = await page.$('button:has-text("Salvar"), button:has-text("Criar"), input[type="submit"]');
    if (salvarBtn) {
      await salvarBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
      await delay(CONFIG.delays.afterPageLoad);
    }

    // Extrair ID do caderno da URL ou da página
    const currentUrl = page.url();
    const cadernoIdMatch = currentUrl.match(/cadernos\/(\d+)/);
    const cadernoId = cadernoIdMatch ? cadernoIdMatch[1] : Date.now().toString();

    // Obter total de questões do caderno
    const totalText = await page.$eval('.total-questoes, .caderno-count', el => el.textContent).catch(() => '0');
    const totalQuestoes = parseInt(totalText?.replace(/\D/g, '') || '0');

    const cadernoInfo: CadernoInfo = {
      id: cadernoId,
      nome,
      area: nome.split(' ')[0], // Ex: "Policial 1" -> "Policial"
      totalQuestoes,
      url: `${CONFIG.baseUrl}/questoes/cadernos/${cadernoId}/caderno`,
    };

    log(`Caderno criado: ${nome} (${totalQuestoes} questões)`);
    return cadernoInfo;

  } catch (error) {
    log(`Erro ao salvar caderno: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return null;
  }
}

// ==================== COLETA DE QUESTÕES ====================

async function coletarQuestoesDoCaderno(caderno: CadernoInfo): Promise<QuestaoColetada[]> {
  const page = await getPage();
  const questoes: QuestaoColetada[] = [];

  try {
    log(`Coletando questões do caderno: ${caderno.nome}`);
    await page.goto(caderno.url, { waitUntil: 'networkidle2' });
    await delay(CONFIG.delays.afterPageLoad);

    let paginaAtual = 1;
    let temMaisQuestoes = true;

    while (temMaisQuestoes) {
      log(`Processando página ${paginaAtual}...`);

      // Coletar questões da página atual
      const questoesElements = await page.$$('.questao, .question-item, [data-questao-id]');

      for (const questaoEl of questoesElements) {
        try {
          const questao = await extrairDadosQuestao(questaoEl);
          if (questao) {
            questoes.push(questao);
          }
        } catch (err) {
          log(`Erro ao extrair questão: ${err instanceof Error ? err.message : String(err)}`, 'warn');
        }

        await delay(CONFIG.delays.betweenQuestions);
      }

      // Verificar se há próxima página
      const nextPageBtn = await page.$('.pagination .next:not(.disabled), a[rel="next"], .btn-next-page');
      if (nextPageBtn) {
        await nextPageBtn.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
        await delay(CONFIG.delays.afterPageLoad);
        paginaAtual++;
      } else {
        temMaisQuestoes = false;
      }

      // Atualizar progresso
      if (_progress) {
        _progress.questoesColetadas = questoes.length;
        _progress.updatedAt = new Date();
      }
    }

    log(`Coletadas ${questoes.length} questões do caderno ${caderno.nome}`);
    return questoes;

  } catch (error) {
    log(`Erro ao coletar questões: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return questoes;
  }
}

async function extrairDadosQuestao(questaoEl: any): Promise<QuestaoColetada | null> {
  try {
    // Extrair ID da questão
    const id = await questaoEl.evaluate((el: Element) => {
      return el.getAttribute('data-questao-id') ||
             el.getAttribute('data-id') ||
             el.querySelector('[data-id]')?.getAttribute('data-id') ||
             '';
    });

    if (!id) return null;

    // Extrair matéria e assunto
    const materia = await questaoEl.$eval('.materia, .subject', (el: Element) => el.textContent?.trim() || '').catch(() => '');
    const assunto = await questaoEl.$eval('.assunto, .topic', (el: Element) => el.textContent?.trim() || '').catch(() => null);

    // Extrair enunciado
    const enunciado = await questaoEl.$eval('.enunciado, .question-text, .questao-texto', (el: Element) => el.innerHTML?.trim() || '').catch(() => '');

    // Extrair alternativas
    const alternativasElements = await questaoEl.$$('.alternativa, .option, .choice');
    const alternativas: { letter: string; text: string }[] = [];

    for (let i = 0; i < alternativasElements.length; i++) {
      const altEl = alternativasElements[i];
      const letter = String.fromCharCode(65 + i); // A, B, C, D, E
      const text = await altEl.evaluate((el: Element) => el.textContent?.trim() || '');
      alternativas.push({ letter, text });
    }

    // Extrair gabarito
    const gabarito = await questaoEl.$eval('.gabarito, .answer, [data-gabarito]', (el: Element) => {
      return el.getAttribute('data-gabarito') || el.textContent?.trim() || '';
    }).catch(() => null);

    // Extrair comentário
    const comentario = await questaoEl.$eval('.comentario, .explanation, .resolucao', (el: Element) => el.innerHTML?.trim() || '').catch(() => null);

    // Extrair metadados
    const ano = await questaoEl.$eval('.ano, [data-ano]', (el: Element) => {
      const anoText = el.getAttribute('data-ano') || el.textContent || '';
      return parseInt(anoText.replace(/\D/g, '')) || null;
    }).catch(() => null);

    const orgao = await questaoEl.$eval('.orgao, .organization', (el: Element) => el.textContent?.trim() || '').catch(() => null);
    const cargo = await questaoEl.$eval('.cargo, .position', (el: Element) => el.textContent?.trim() || '').catch(() => null);
    const prova = await questaoEl.$eval('.prova, .exam', (el: Element) => el.textContent?.trim() || '').catch(() => null);
    const banca = await questaoEl.$eval('.banca, .board', (el: Element) => el.textContent?.trim() || '').catch(() => null);
    const concurso = await questaoEl.$eval('.concurso, .contest', (el: Element) => el.textContent?.trim() || '').catch(() => null);

    // Extrair imagens do enunciado
    const imagensEnunciado: string[] = await questaoEl.$$eval('.enunciado img, .question-text img', (imgs: HTMLImageElement[]) => {
      return imgs.map(img => img.src).filter(src => src);
    }).catch(() => []);

    // Extrair imagens do comentário
    const imagensComentario: string[] = await questaoEl.$$eval('.comentario img, .explanation img', (imgs: HTMLImageElement[]) => {
      return imgs.map(img => img.src).filter(src => src);
    }).catch(() => []);

    return {
      id,
      materia,
      assunto,
      enunciado,
      alternativas,
      gabarito,
      comentario,
      ano,
      orgao,
      cargo,
      prova,
      banca,
      concurso,
      imagensEnunciado,
      imagensComentario,
    };

  } catch (error) {
    return null;
  }
}

// ==================== PERSISTÊNCIA ====================

async function salvarQuestaoNoBanco(questao: QuestaoColetada): Promise<boolean> {
  try {
    const supabase = getSupabase();

    const { error } = await supabase
      .from('questoes_concurso')
      .upsert({
        id: parseInt(questao.id),
        materia: questao.materia,
        assunto: questao.assunto,
        enunciado: questao.enunciado,
        alternativas: questao.alternativas,
        gabarito: questao.gabarito,
        comentario: questao.comentario,
        ano: questao.ano,
        orgao: questao.orgao,
        cargo_area_especialidade_edicao: questao.cargo,
        prova: questao.prova,
        banca: questao.banca,
        concurso: questao.concurso,
        imagens_enunciado: questao.imagensEnunciado.length > 0 ? `{${questao.imagensEnunciado.join(',')}}` : null,
        imagens_comentario: questao.imagensComentario.length > 0 ? questao.imagensComentario : null,
        ativo: true,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (error) {
      log(`Erro ao salvar questão ${questao.id}: ${error.message}`, 'error');
      return false;
    }

    return true;

  } catch (error) {
    log(`Exceção ao salvar questão: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return false;
  }
}

async function salvarLoteQuestoes(questoes: QuestaoColetada[]): Promise<{ salvos: number; erros: number }> {
  let salvos = 0;
  let erros = 0;

  for (const questao of questoes) {
    const sucesso = await salvarQuestaoNoBanco(questao);
    if (sucesso) {
      salvos++;
    } else {
      erros++;
    }
  }

  log(`Lote salvo: ${salvos} sucesso, ${erros} erros`);
  return { salvos, erros };
}

// ==================== ORQUESTRAÇÃO PRINCIPAL ====================

export async function iniciarScrapingArea(areaNome: string): Promise<void> {
  if (_isRunning) {
    log('Scraping já está em execução', 'warn');
    return;
  }

  _isRunning = true;
  _progress = {
    area: areaNome,
    caderno: '',
    questoesColetadas: 0,
    questoesTotal: 0,
    status: 'running',
    startedAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    // 1. Login
    const loginOk = await login();
    if (!loginOk) {
      throw new Error('Falha no login');
    }

    // 2. Navegar para pastas
    const navegacaoOk = await navegarParaPastas();
    if (!navegacaoOk) {
      throw new Error('Falha na navegação');
    }

    // 3. Selecionar área
    const areaOk = await selecionarArea(areaNome);
    if (!areaOk) {
      throw new Error(`Área "${areaNome}" não encontrada`);
    }

    // 4. Obter matérias com quantidades
    const materias = await obterMateriasComQuantidades();
    if (materias.length === 0) {
      throw new Error('Nenhuma matéria encontrada');
    }

    // 5. Criar cadernos respeitando limite de 30k
    let cadernoNumero = 1;
    let indiceMateria = 0;

    while (indiceMateria < materias.length) {
      // Configurar remover desatualizadas/anuladas
      await removerQuestoesDesatualizadasEAnuladas();

      // Configurar caderno com matérias até 30k
      const { materiasUsadas, totalQuestoes } = await configurarCaderno(materias, indiceMateria);

      if (materiasUsadas === 0) {
        break;
      }

      // Salvar caderno
      const nomeCaderno = `${areaNome} ${cadernoNumero}`;
      const caderno = await salvarCaderno(nomeCaderno);

      if (caderno) {
        _progress.caderno = nomeCaderno;
        _progress.questoesTotal = totalQuestoes;

        // Coletar questões do caderno
        const questoes = await coletarQuestoesDoCaderno(caderno);

        // Salvar questões no banco
        await salvarLoteQuestoes(questoes);

        await delay(CONFIG.delays.betweenCadernos);
      }

      indiceMateria += materiasUsadas;
      cadernoNumero++;
    }

    _progress.status = 'completed';
    log(`Scraping da área "${areaNome}" concluído!`);

  } catch (error) {
    log(`Erro no scraping: ${error instanceof Error ? error.message : String(error)}`, 'error');
    if (_progress) {
      _progress.status = 'error';
      _progress.lastError = error instanceof Error ? error.message : String(error);
    }
  } finally {
    _isRunning = false;
    await closeBrowser();
  }
}

export async function pararScraping(): Promise<void> {
  log('Parando scraping...');
  _isRunning = false;
  if (_progress) {
    _progress.status = 'paused';
  }
  await closeBrowser();
}

export function getScrapingProgress(): ScrapingProgress | null {
  return _progress;
}

export function isScrapingRunning(): boolean {
  return _isRunning;
}

// ==================== CRON JOB ====================

let _cronInterval: NodeJS.Timeout | null = null;

export function startScrapingCron(intervalMs: number = 24 * 60 * 60 * 1000): void {
  log(`Iniciando cron job de scraping (intervalo: ${intervalMs / 1000 / 60} minutos)`);

  // Não executar imediatamente, aguardar primeira execução agendada
  _cronInterval = setInterval(async () => {
    if (!_isRunning) {
      // Encontrar próxima área para processar
      for (const area of CONFIG.areas) {
        // TODO: Verificar se área já foi completamente processada
        log(`Iniciando scraping automático da área: ${area}`);
        await iniciarScrapingArea(area);
        break; // Processar uma área por vez
      }
    }
  }, intervalMs);
}

export function stopScrapingCron(): void {
  if (_cronInterval) {
    clearInterval(_cronInterval);
    _cronInterval = null;
    log('Cron job de scraping parado');
  }
}

// ==================== EXPORTAÇÕES ====================

export const TecConcursosScraper = {
  login,
  iniciarScrapingArea,
  pararScraping,
  getScrapingProgress,
  isScrapingRunning,
  startScrapingCron,
  stopScrapingCron,
  closeBrowser,
};

export default TecConcursosScraper;
