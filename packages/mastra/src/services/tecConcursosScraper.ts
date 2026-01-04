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

import puppeteer, { Browser, Page, Cookie } from 'puppeteer';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Caminho para salvar cookies
const COOKIES_PATH = process.env.TEC_COOKIES_PATH || '/tmp/tec-cookies.json';

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

// Função auxiliar para encontrar elemento por texto (substitui :has-text())
async function findElementByText(page: Page, selector: string, text: string): Promise<any> {
  const elements = await page.$$(selector);
  for (const el of elements) {
    const elText = await el.evaluate((node: Element) => node.textContent || '');
    if (elText.toLowerCase().includes(text.toLowerCase())) {
      return el;
    }
  }
  return null;
}

// Função auxiliar para clicar em elemento por texto
async function clickByText(page: Page, selector: string, text: string): Promise<boolean> {
  const el = await findElementByText(page, selector, text);
  if (el) {
    await el.click();
    return true;
  }
  return false;
}

// ==================== COOKIE MANAGEMENT ====================

async function saveCookies(page: Page): Promise<void> {
  try {
    const cookies = await page.cookies();
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
    log(`Cookies salvos em ${COOKIES_PATH} (${cookies.length} cookies)`);
  } catch (error) {
    log(`Erro ao salvar cookies: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
}

async function loadCookies(page: Page): Promise<boolean> {
  try {
    if (!fs.existsSync(COOKIES_PATH)) {
      log('Arquivo de cookies não encontrado');
      return false;
    }

    const cookiesJson = fs.readFileSync(COOKIES_PATH, 'utf-8');
    const cookies: Cookie[] = JSON.parse(cookiesJson);

    if (!cookies || cookies.length === 0) {
      log('Arquivo de cookies vazio');
      return false;
    }

    await page.setCookie(...cookies);
    log(`Cookies carregados (${cookies.length} cookies)`);
    return true;
  } catch (error) {
    log(`Erro ao carregar cookies: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return false;
  }
}

async function checkIfLoggedIn(page: Page): Promise<boolean> {
  try {
    // Navegar para uma página que requer login
    await page.goto(CONFIG.pastasUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000);

    const currentUrl = page.url();

    // Se foi redirecionado para login, não está logado
    if (currentUrl.includes('/login')) {
      log('Não está logado (redirecionado para login)');
      return false;
    }

    // Verificar se está na página de pastas
    if (currentUrl.includes('/questoes/pastas') || currentUrl.includes('/questoes')) {
      log('Está logado (acessou página de questões)');
      return true;
    }

    // Verificar se há elemento de usuário logado
    const userElement = await page.$('.user-menu, .user-info, .logged-user, [data-user], .avatar');
    if (userElement) {
      log('Está logado (encontrou elemento de usuário)');
      return true;
    }

    log(`Estado de login incerto. URL: ${currentUrl}`);
    return false;
  } catch (error) {
    log(`Erro ao verificar login: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return false;
  }
}

// Função para salvar cookies manualmente (chamada pela API após login manual)
async function exportCookiesFromCurrentSession(): Promise<{ success: boolean; message: string; cookiesCount?: number }> {
  try {
    const page = await getPage();
    const cookies = await page.cookies();

    if (cookies.length === 0) {
      return { success: false, message: 'Nenhum cookie encontrado na sessão atual' };
    }

    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
    return {
      success: true,
      message: `Cookies exportados com sucesso para ${COOKIES_PATH}`,
      cookiesCount: cookies.length
    };
  } catch (error) {
    return {
      success: false,
      message: `Erro ao exportar cookies: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Função para importar cookies de uma string JSON
async function importCookiesFromJson(cookiesJson: string): Promise<{ success: boolean; message: string }> {
  try {
    const cookies: Cookie[] = JSON.parse(cookiesJson);

    if (!cookies || cookies.length === 0) {
      return { success: false, message: 'JSON de cookies vazio ou inválido' };
    }

    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
    log(`Cookies importados (${cookies.length} cookies)`);

    // Recarregar cookies na página atual se houver
    if (_page && !_page.isClosed()) {
      await _page.setCookie(...cookies);
    }

    return { success: true, message: `${cookies.length} cookies importados com sucesso` };
  } catch (error) {
    return {
      success: false,
      message: `Erro ao importar cookies: ${error instanceof Error ? error.message : String(error)}`
    };
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

  // Tentar usar cookies salvos primeiro
  log('Tentando login com cookies salvos...');
  const cookiesLoaded = await loadCookies(page);

  if (cookiesLoaded) {
    const isLoggedIn = await checkIfLoggedIn(page);
    if (isLoggedIn) {
      _isLoggedIn = true;
      log('Login via cookies bem-sucedido!');
      return true;
    }
    log('Cookies não são mais válidos, tentando login normal...');
  }

  try {
    log('Navegando para página de login...');
    await page.goto(CONFIG.loginUrl, { waitUntil: 'networkidle2' });

    // Aguardar formulário de login - tentar múltiplos seletores
    log('Aguardando formulário de login...');
    await page.waitForSelector('form', { timeout: 15000 });
    await delay(2000); // Aguardar carregamento completo

    // Salvar screenshot para debug
    await page.screenshot({ path: '/tmp/tec-login-before.png', fullPage: true });
    log('Screenshot salvo em /tmp/tec-login-before.png');

    // Listar todos os inputs da página para debug
    const inputs = await page.$$eval('input', elements =>
      elements.map(el => ({
        type: el.type,
        name: el.name,
        id: el.id,
        placeholder: el.placeholder,
        className: el.className
      }))
    );
    log(`Inputs encontrados: ${JSON.stringify(inputs, null, 2)}`);

    log('Preenchendo credenciais...');

    // Tentar diferentes seletores para o campo de email/usuário
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[name="login"]',
      'input[name="username"]',
      'input[name="usuario"]',
      '#email',
      '#login',
      'input[placeholder*="mail"]',
      'input[placeholder*="usuário"]',
      'input[placeholder*="E-mail"]',
      'input.form-control:first-of-type'
    ];
    let emailInput = null;
    for (const selector of emailSelectors) {
      emailInput = await page.$(selector);
      if (emailInput) {
        log(`Campo de email encontrado com seletor: ${selector}`);
        break;
      }
    }

    if (!emailInput) {
      // Tentar pegar o primeiro input de texto
      emailInput = await page.$('input[type="text"]');
      if (emailInput) {
        log('Campo de email encontrado como input[type="text"]');
      }
    }

    if (!emailInput) {
      throw new Error('Campo de email não encontrado');
    }

    await emailInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await emailInput.type(CONFIG.credentials.email, { delay: 100 });

    // Tentar diferentes seletores para o campo de senha
    const passwordSelectors = ['input[type="password"]', 'input[name="password"]', 'input[name="senha"]', '#password', '#senha'];
    let passwordInput = null;
    for (const selector of passwordSelectors) {
      passwordInput = await page.$(selector);
      if (passwordInput) {
        log(`Campo de senha encontrado com seletor: ${selector}`);
        break;
      }
    }

    if (!passwordInput) {
      throw new Error('Campo de senha não encontrado');
    }

    await passwordInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await passwordInput.type(CONFIG.credentials.password, { delay: 100 });

    // Salvar screenshot após preencher
    await page.screenshot({ path: '/tmp/tec-login-filled.png', fullPage: true });
    log('Screenshot salvo em /tmp/tec-login-filled.png');

    // Clicar no botão de login
    log('Enviando formulário de login...');
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button.btn-primary',
      'button.btn-login',
      '.btn-login',
      'form button'
    ];

    let submitted = false;
    // Tentar seletores CSS primeiro
    for (const selector of submitSelectors) {
      try {
        const submitBtn = await page.$(selector);
        if (submitBtn) {
          log(`Botão de submit encontrado com seletor: ${selector}`);
          await submitBtn.click();
          submitted = true;
          break;
        }
      } catch {
        // Continuar tentando outros seletores
      }
    }

    // Se não encontrou, tentar por texto
    if (!submitted) {
      const entrarBtn = await findElementByText(page, 'button', 'Entrar');
      if (entrarBtn) {
        log('Botão "Entrar" encontrado por texto');
        await entrarBtn.click();
        submitted = true;
      }
    }
    if (!submitted) {
      const loginBtn = await findElementByText(page, 'button', 'Login');
      if (loginBtn) {
        log('Botão "Login" encontrado por texto');
        await loginBtn.click();
        submitted = true;
      }
    }

    // Se não encontrou botão, tentar submeter o formulário diretamente
    if (!submitted) {
      log('Submetendo formulário via Enter...');
      await page.keyboard.press('Enter');
    }

    // Aguardar navegação pós-login
    log('Aguardando navegação pós-login...');
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    } catch {
      log('Timeout na navegação, verificando estado atual...');
    }
    await delay(CONFIG.delays.afterLogin);

    // Salvar screenshot após login
    await page.screenshot({ path: '/tmp/tec-login-after.png', fullPage: true });
    log('Screenshot salvo em /tmp/tec-login-after.png');

    // Verificar se o login foi bem-sucedido
    const currentUrl = page.url();
    log(`URL atual após login: ${currentUrl}`);
    const isLoginPage = currentUrl.includes('/login');

    if (isLoginPage) {
      // Verificar se há mensagem de erro
      const errorMessage = await page.$eval('.alert-danger, .error-message, .login-error, .alert', el => el.textContent?.trim()).catch(() => null);
      if (errorMessage) {
        log(`Mensagem de erro encontrada: ${errorMessage}`, 'error');
        throw new Error(`Falha no login: ${errorMessage}`);
      }

      // Verificar conteúdo da página
      const pageContent = await page.content();
      if (pageContent.includes('incorreta') || pageContent.includes('inválido') || pageContent.includes('incorrect')) {
        throw new Error('Login falhou - credenciais inválidas');
      }

      throw new Error('Login falhou - ainda na página de login');
    }

    _isLoggedIn = true;
    log('Login realizado com sucesso!');

    // Salvar cookies para uso futuro
    await saveCookies(page);

    return true;

  } catch (error) {
    // Salvar screenshot do erro
    try {
      await page.screenshot({ path: '/tmp/tec-login-error.png', fullPage: true });
      log('Screenshot de erro salvo em /tmp/tec-login-error.png');
    } catch {}

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

    // Salvar screenshot para debug
    await page.screenshot({ path: '/tmp/tec-pastas-page.png', fullPage: true });
    log('Screenshot da página de pastas salvo em /tmp/tec-pastas-page.png');

    // Clicar em "Novo Caderno" - usando findElementByText
    let novoCadernoBtn = await page.$('.btn-novo-caderno, .novo-caderno, [data-action="novo-caderno"]');
    if (!novoCadernoBtn) {
      novoCadernoBtn = await findElementByText(page, 'button, a', 'Novo Caderno');
    }
    if (!novoCadernoBtn) {
      novoCadernoBtn = await findElementByText(page, 'button, a', 'novo caderno');
    }

    if (novoCadernoBtn) {
      log('Botão "Novo Caderno" encontrado, clicando...');
      await novoCadernoBtn.click();
      await delay(CONFIG.delays.afterPageLoad);
    } else {
      log('Botão "Novo Caderno" não encontrado, tentando continuar...');
    }

    // Salvar screenshot após clicar
    await page.screenshot({ path: '/tmp/tec-novo-caderno.png', fullPage: true });
    log('Screenshot após "Novo Caderno" salvo');

    // PASSO 1: Clicar no filtro "Área (Carreira)" na barra lateral esquerda
    // A página mostra "Matéria e assunto" por padrão, precisamos trocar para "Área (Carreira)"
    log('Procurando filtro "Área (Carreira)" na barra lateral...');

    // Usar page.evaluate para encontrar e clicar no elemento correto da barra lateral
    const areaCarreiraClicked = await page.evaluate(() => {
      // Procurar todos os elementos que podem conter o texto "Área (Carreira)"
      const allElements = document.querySelectorAll('a, li, div, span, button');
      for (const el of allElements) {
        const text = el.textContent?.trim() || '';
        // Verificar se o texto é exatamente "Área (Carreira)" ou similar
        if (text === 'Área (Carreira)' || text === 'Area (Carreira)') {
          // Tentar encontrar o elemento pai clicável (li ou a)
          let clickTarget = el;
          if (el.tagName.toLowerCase() === 'span') {
            clickTarget = el.parentElement || el;
          }
          (clickTarget as HTMLElement).click();
          return { found: true, text, tag: (clickTarget as HTMLElement).tagName };
        }
      }
      return { found: false, text: '', tag: '' };
    });

    if (areaCarreiraClicked.found) {
      log(`Filtro "Área (Carreira)" clicado (tag: ${areaCarreiraClicked.tag})`);
      await delay(CONFIG.delays.afterPageLoad + 1000); // Esperar mais para a lista carregar
      await page.screenshot({ path: '/tmp/tec-area-carreira-filter.png', fullPage: true });
      log('Screenshot após clicar em "Área (Carreira)" salvo');
    } else {
      log('Filtro "Área (Carreira)" não encontrado, tentando abordagem alternativa...', 'warn');

      // Tentar clicar via XPath ou outro método
      const elements = await page.$$('li');
      for (const el of elements) {
        const text = await el.evaluate(node => node.textContent?.trim() || '');
        if (text.includes('Área') && text.includes('Carreira')) {
          log(`Encontrado elemento li com texto: "${text}", clicando...`);
          await el.click();
          await delay(CONFIG.delays.afterPageLoad + 1000);
          break;
        }
      }
      await page.screenshot({ path: '/tmp/tec-area-carreira-filter.png', fullPage: true });
    }

    // PASSO 2: Agora procurar pela área específica (ex: "Policial")
    log(`Procurando área específica: ${areaNome}`);

    // Tentar por data attribute
    let areaFilter = await page.$(`[data-area="${areaNome}"]`);

    // Se não encontrou, tentar buscar por texto na lista de áreas
    if (!areaFilter) {
      // Tentar em labels (checkboxes de filtro)
      areaFilter = await findElementByText(page, 'label', areaNome);
    }

    // Tentar em links/buttons
    if (!areaFilter) {
      areaFilter = await findElementByText(page, 'a, button', areaNome);
    }

    // Tentar em itens de lista ou spans
    if (!areaFilter) {
      areaFilter = await findElementByText(page, 'li, span, div.item', areaNome);
    }

    if (areaFilter) {
      log(`Área "${areaNome}" encontrada, clicando para expandir...`);
      await areaFilter.click();
      await delay(CONFIG.delays.afterPageLoad);
      await page.screenshot({ path: '/tmp/tec-area-expandida.png', fullPage: true });

      // PASSO 3: Após expandir a área, clicar em "Todo o conteúdo de..." para selecionar tudo
      log(`Procurando "Todo o conteúdo de" para selecionar toda a área...`);

      const todoConteudoClicked = await page.evaluate((areaNome) => {
        const allElements = document.querySelectorAll('a, span, label, div');
        for (const el of allElements) {
          const text = el.textContent?.trim() || '';
          // Procurar por "Todo o conteúdo de 'X'" ou similar
          if (text.includes('Todo o conteúdo') && text.toLowerCase().includes(areaNome.toLowerCase())) {
            (el as HTMLElement).click();
            return { found: true, text };
          }
        }
        // Tentar alternativa - apenas "Todo o conteúdo"
        for (const el of allElements) {
          const text = el.textContent?.trim() || '';
          if (text.startsWith('Todo o conteúdo')) {
            (el as HTMLElement).click();
            return { found: true, text };
          }
        }
        return { found: false, text: '' };
      }, areaNome);

      if (todoConteudoClicked.found) {
        log(`Clicado em: "${todoConteudoClicked.text}"`);
        await delay(CONFIG.delays.afterPageLoad);
      } else {
        log('Não encontrou "Todo o conteúdo", a área já pode estar selecionada', 'warn');
      }

      await page.screenshot({ path: '/tmp/tec-area-selecionada.png', fullPage: true });
      return true;
    }

    // Tentar abordagem alternativa - busca exata
    const allLabels = await page.$$('label');
    for (const label of allLabels) {
      try {
        const text = await label.evaluate(el => el.textContent?.trim() || '');
        if (text.toLowerCase().includes(areaNome.toLowerCase())) {
          log(`Encontrado label com texto "${text}"`);
          await label.click();
          await delay(CONFIG.delays.afterPageLoad);
          await page.screenshot({ path: '/tmp/tec-area-selecionada.png', fullPage: true });
          return true;
        }
      } catch {
        continue;
      }
    }

    log(`Área "${areaNome}" não encontrada`, 'warn');
    await page.screenshot({ path: '/tmp/tec-area-nao-encontrada.png', fullPage: true });
    return false;

  } catch (error) {
    log(`Erro ao selecionar área: ${error instanceof Error ? error.message : String(error)}`, 'error');
    await page.screenshot({ path: '/tmp/tec-area-erro.png', fullPage: true }).catch(() => {});
    return false;
  }
}

async function obterMateriasComQuantidades(): Promise<MateriaQuantidade[]> {
  const page = await getPage();
  const materias: MateriaQuantidade[] = [];

  try {
    log('Obtendo matérias e quantidades...');

    // Clicar em "Editar quantidades"
    let editarQtdBtn = await page.$('.edit-quantities, [data-action="editar-quantidades"]');
    if (!editarQtdBtn) {
      editarQtdBtn = await findElementByText(page, 'a, button', 'Editar quantidades');
    }
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
          // Encontrar o input da matéria
          let materiaInput = await page.$(`input[data-materia="${materia.nome}"]`);
          if (!materiaInput) {
            // Buscar na linha que contém o nome da matéria
            const row = await findElementByText(page, 'tr', materia.nome);
            if (row) materiaInput = await row.$('input');
          }
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
      let materiaInput = await page.$(`input[data-materia="${materia.nome}"]`);
      if (!materiaInput) {
        // Buscar na linha que contém o nome da matéria
        const row = await findElementByText(page, 'tr', materia.nome);
        if (row) materiaInput = await row.$('input');
      }
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
    let desatualizadasCheckbox = await page.$('input[name="remover_desatualizadas"], #remover-desatualizadas');
    if (!desatualizadasCheckbox) {
      const label = await findElementByText(page, 'label', 'desatualizada');
      if (label) desatualizadasCheckbox = await label.$('input');
    }
    if (desatualizadasCheckbox) {
      const isChecked = await desatualizadasCheckbox.evaluate(el => (el as HTMLInputElement).checked);
      if (!isChecked) {
        await desatualizadasCheckbox.click();
      }
    }

    // Procurar checkbox para remover questões anuladas
    let anuladasCheckbox = await page.$('input[name="remover_anuladas"], #remover-anuladas');
    if (!anuladasCheckbox) {
      const label = await findElementByText(page, 'label', 'anulada');
      if (label) anuladasCheckbox = await label.$('input');
    }
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
    let salvarBtn = await page.$('input[type="submit"], button[type="submit"]');
    if (!salvarBtn) {
      salvarBtn = await findElementByText(page, 'button', 'Salvar');
    }
    if (!salvarBtn) {
      salvarBtn = await findElementByText(page, 'button', 'Criar');
    }
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

// Wrapper para checkLogin que não precisa de page
async function checkLoginWrapper(): Promise<boolean> {
  try {
    const page = await getPage();
    return await checkIfLoggedIn(page);
  } catch (error) {
    log(`Erro ao verificar login: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return false;
  }
}

export const TecConcursosScraper = {
  login,
  iniciarScrapingArea,
  pararScraping,
  getScrapingProgress,
  isScrapingRunning,
  startScrapingCron,
  stopScrapingCron,
  closeBrowser,
  // Cookie management
  exportCookies: exportCookiesFromCurrentSession,
  importCookies: importCookiesFromJson,
  checkLogin: checkLoginWrapper,
};

export default TecConcursosScraper;
