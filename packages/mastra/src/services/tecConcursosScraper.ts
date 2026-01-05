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
import * as os from 'os';

// Caminho para salvar cookies - usar temp dir do sistema
const TEMP_DIR = os.tmpdir();
const COOKIES_PATH = process.env.TEC_COOKIES_PATH || path.join(TEMP_DIR, 'tec-cookies.json');

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
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    // Use service role key for admin operations (INSERT/UPDATE)
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
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

// ID da conta sendo usada atualmente
let _currentAccountId: string | null = null;

async function loadCookies(page: Page, accountId?: string): Promise<boolean> {
  try {
    // Carregar do banco de dados (tec_accounts)
    const supabase = getSupabase();

    let query = supabase
      .from('tec_accounts')
      .select('id, email, cookies')
      .eq('is_active', true);

    // Se accountId fornecido, buscar conta específica
    if (accountId) {
      query = query.eq('id', accountId);
    }

    const { data: accounts, error: dbError } = await query.limit(1);

    const account = accounts?.[0];
    if (!dbError && account?.cookies && Array.isArray(account.cookies) && account.cookies.length > 0) {
      await page.setCookie(...account.cookies);
      _currentAccountId = account.id;
      log(`Cookies loaded from database (${account.cookies.length} cookies) - Account: ${account.email}`);
      return true;
    } else if (dbError) {
      log(`Erro ao carregar cookies do banco: ${dbError.message}`, 'error');
    } else if (accountId && !account) {
      log(`Conta ${accountId} não encontrada ou sem cookies válidos`, 'error');
    }

    // Fallback: tentar carregar do arquivo
    if (fs.existsSync(COOKIES_PATH)) {
      const cookiesJson = fs.readFileSync(COOKIES_PATH, 'utf-8');
      const cookies: Cookie[] = JSON.parse(cookiesJson);

      if (cookies && cookies.length > 0) {
        await page.setCookie(...cookies);
        log(`Cookies carregados do arquivo (${cookies.length} cookies)`);
        return true;
      }
    }

    log('Nenhum cookie disponível (banco ou arquivo)');
    return false;
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

    // Salvar no banco de dados (tec_accounts)
    const supabase = getSupabase();
    const { error: dbError } = await supabase
      .from('tec_accounts')
      .update({
        cookies: cookies,
        login_status: 'valid',
        last_login_check: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('is_active', true);

    if (dbError) {
      log(`Erro ao salvar cookies no banco: ${dbError.message}`, 'error');
      // Fallback: salvar no arquivo
      fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2));
      log(`Cookies salvos no arquivo como fallback (${cookies.length} cookies)`);
    } else {
      log(`Cookies salvos no banco de dados (${cookies.length} cookies)`);
    }

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

async function login(accountId?: string): Promise<boolean> {
  if (_isLoggedIn && (!accountId || accountId === _currentAccountId)) {
    log('Já está logado');
    return true;
  }

  // Se trocar de conta, limpar estado de login
  if (accountId && accountId !== _currentAccountId) {
    _isLoggedIn = false;
  }

  const page = await getPage();

  // Tentar usar cookies salvos primeiro
  log('Tentando login com cookies salvos...');
  const cookiesLoaded = await loadCookies(page, accountId);

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

      // Primeiro, analisar a estrutura HTML do elemento "Todo o conteúdo"
      const htmlDebug = await page.evaluate((areaNome) => {
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          const text = el.textContent?.trim() || '';
          // Procurar elemento que contém exatamente "Todo o conteúdo de 'Policial'"
          if (text.includes(`Todo o conteúdo de "${areaNome}"`) || text.includes(`Todo o conteúdo de '${areaNome}'`)) {
            // Encontrar o elemento mais específico (menor)
            if (text.length < 50) {
              return {
                tag: el.tagName,
                classes: el.className,
                id: el.id,
                parentTag: el.parentElement?.tagName || '',
                parentClasses: el.parentElement?.className || '',
                grandparentTag: el.parentElement?.parentElement?.tagName || '',
                grandparentClasses: el.parentElement?.parentElement?.className || '',
                outerHTML: el.outerHTML.substring(0, 300),
                parentOuterHTML: el.parentElement?.outerHTML?.substring(0, 500) || '',
              };
            }
          }
        }
        return null;
      }, areaNome);
      log(`HTML debug para "Todo o conteúdo": ${JSON.stringify(htmlDebug)}`);

      // ESTRATÉGIA NOVA: Encontrar o elemento correto e clicar via coordenadas
      const filterResult = await page.evaluate((areaNome) => {
        // Procurar todos os elementos na área de filtros
        const filterArea = document.querySelector('.areas-list, .filter-list, [class*="area"]');
        const searchArea = filterArea || document;

        // Procurar especificamente pelo texto "Todo o conteúdo de 'X'"
        const textToFind = `Todo o conteúdo de "${areaNome}"`;
        const altText = `Todo o conteúdo de '${areaNome}'`;

        const allElements = searchArea.querySelectorAll('*');
        for (const el of allElements) {
          const text = el.textContent?.trim() || '';
          if ((text === textToFind || text === altText) && el.tagName !== 'SCRIPT') {
            // Este é o elemento de texto exato
            // Agora procurar o ícone de checkbox ao lado dele
            const parent = el.parentElement;
            if (parent) {
              // Procurar ícone dentro do pai (pode ser i, svg, span com classe de ícone)
              const icon = parent.querySelector('i, svg, [class*="icon"], [class*="check"], [class*="fa-"]');
              if (icon) {
                const rect = (icon as HTMLElement).getBoundingClientRect();
                return {
                  found: true,
                  element: 'icon',
                  x: rect.x + rect.width / 2,
                  y: rect.y + rect.height / 2,
                  text,
                };
              }
              // Se não achou ícone, clicar no pai inteiro (linha)
              const parentRect = parent.getBoundingClientRect();
              return {
                found: true,
                element: 'parent',
                x: parentRect.x + 20, // Clicar mais à esquerda onde estaria o checkbox
                y: parentRect.y + parentRect.height / 2,
                text,
              };
            }
            // Se não tem pai, clicar no próprio elemento
            const rect = (el as HTMLElement).getBoundingClientRect();
            return {
              found: true,
              element: 'self',
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2,
              text,
            };
          }
        }

        // Estratégia alternativa: procurar por elementos li que contenham o texto
        const listItems = searchArea.querySelectorAll('li, div[class*="item"], a[class*="item"]');
        for (const li of listItems) {
          const text = li.textContent?.trim() || '';
          if (text.includes('Todo o conteúdo') && text.toLowerCase().includes(areaNome.toLowerCase())) {
            // Procurar checkbox ou ícone dentro deste li
            const checkbox = li.querySelector('input[type="checkbox"], [class*="check"], i');
            if (checkbox) {
              const rect = (checkbox as HTMLElement).getBoundingClientRect();
              return {
                found: true,
                element: 'li-checkbox',
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
                text,
              };
            }
            // Clicar no início do li (onde estaria o checkbox)
            const rect = (li as HTMLElement).getBoundingClientRect();
            return {
              found: true,
              element: 'li-left',
              x: rect.x + 15, // 15px do início
              y: rect.y + rect.height / 2,
              text,
            };
          }
        }

        return { found: false, element: '', x: 0, y: 0, text: '' };
      }, areaNome);

      if (filterResult.found) {
        log(`Encontrado elemento "${filterResult.element}" em (${filterResult.x}, ${filterResult.y}), clicando...`);
        await page.mouse.click(filterResult.x, filterResult.y);
        await delay(500);

        // Verificar filtros ativos imediatamente
        let filtrosAtivos = await page.evaluate(() => {
          const body = document.body.innerText;
          const match = body.match(/Filtros ativos:\s*(\d+)/);
          return match ? parseInt(match[1]) : 0;
        });
        log(`Filtros ativos após primeiro clique: ${filtrosAtivos}`);

        // Se ainda não funcionou, tentar clicar mais vezes em posições diferentes
        if (filtrosAtivos === 0) {
          log('Filtro não aplicado, tentando clicar em posições alternativas...');

          // Tentar clicar 20px mais à esquerda
          await page.mouse.click(filterResult.x - 20, filterResult.y);
          await delay(500);

          filtrosAtivos = await page.evaluate(() => {
            const body = document.body.innerText;
            const match = body.match(/Filtros ativos:\s*(\d+)/);
            return match ? parseInt(match[1]) : 0;
          });
          log(`Filtros ativos após segundo clique: ${filtrosAtivos}`);
        }

        // Tentar double-click se ainda não funcionou
        if (filtrosAtivos === 0) {
          log('Tentando double-click...');
          await page.mouse.click(filterResult.x, filterResult.y, { clickCount: 2 });
          await delay(500);

          filtrosAtivos = await page.evaluate(() => {
            const body = document.body.innerText;
            const match = body.match(/Filtros ativos:\s*(\d+)/);
            return match ? parseInt(match[1]) : 0;
          });
          log(`Filtros ativos após double-click: ${filtrosAtivos}`);
        }
      } else {
        log('Elemento "Todo o conteúdo" não encontrado para clique via coordenadas', 'warn');
      }

      await delay(CONFIG.delays.afterPageLoad);

      // Verificar se o filtro foi aplicado (verificação final)
      const finalFiltrosAtivos = await page.evaluate(() => {
        const body = document.body.innerText;
        const match = body.match(/Filtros ativos:\s*(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
      log(`Filtros ativos (final): ${finalFiltrosAtivos}`);

      await page.screenshot({ path: '/tmp/tec-area-selecionada.png', fullPage: true });

      // Se nenhum filtro foi aplicado, tentar ir direto para GERAR CADERNO
      // O TecConcursos pode gerar um caderno mesmo sem filtros específicos
      if (finalFiltrosAtivos === 0) {
        log('Nenhum filtro aplicado, tentando gerar caderno diretamente...');

        // Clicar em "GERAR CADERNO"
        const gerarCadernoClicked = await page.evaluate(() => {
          const buttons = document.querySelectorAll('button, input[type="submit"], a.btn');
          for (const btn of buttons) {
            const text = btn.textContent?.trim().toUpperCase() || '';
            if (text.includes('GERAR CADERNO') || text.includes('GERAR')) {
              (btn as HTMLElement).click();
              return { clicked: true, text };
            }
          }
          return { clicked: false, text: '' };
        });

        if (gerarCadernoClicked.clicked) {
          log(`Clicado em "${gerarCadernoClicked.text}"`);
          await delay(CONFIG.delays.afterPageLoad * 2);
          await page.screenshot({ path: '/tmp/tec-apos-gerar-caderno.png', fullPage: true });

          // Verificar se foi redirecionado para um caderno
          const currentUrl = page.url();
          log(`URL após gerar caderno: ${currentUrl}`);
        }
      }

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
    await page.screenshot({ path: '/tmp/tec-antes-editar-qtd.png', fullPage: true });

    // Clicar em "Editar quantidades" usando page.evaluate para maior precisão
    const editarQtdClicked = await page.evaluate(() => {
      const elements = document.querySelectorAll('a, button, span, div');
      for (const el of elements) {
        const text = el.textContent?.trim() || '';
        if (text === 'Editar quantidades' || text.includes('Editar quantidades')) {
          const rect = el.getBoundingClientRect();
          return {
            found: true,
            text,
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
          };
        }
      }
      return { found: false, text: '', x: 0, y: 0 };
    });

    if (editarQtdClicked.found) {
      log(`Encontrado "Editar quantidades", clicando em (${editarQtdClicked.x}, ${editarQtdClicked.y})`);
      await page.mouse.click(editarQtdClicked.x, editarQtdClicked.y);
      await delay(CONFIG.delays.afterPageLoad);
      await page.screenshot({ path: '/tmp/tec-apos-editar-qtd.png', fullPage: true });
    } else {
      log('"Editar quantidades" não encontrado', 'warn');
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

/**
 * Verifica se uma questão já existe no banco de dados
 */
async function questaoJaExiste(id: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('questoes_concurso')
      .select('id')
      .eq('id', parseInt(id))
      .maybeSingle();

    if (error) {
      log(`Erro ao verificar existência da questão ${id}: ${error.message}`, 'warn');
      return false; // Em caso de erro, tentamos inserir
    }

    return data !== null;
  } catch (error) {
    return false;
  }
}

async function salvarQuestaoNoBanco(questao: QuestaoColetada): Promise<'saved' | 'exists' | 'error'> {
  try {
    const supabase = getSupabase();
    const questaoId = parseInt(questao.id);

    // Primeiro, verificar se a questão já existe
    const existe = await questaoJaExiste(questao.id);
    if (existe) {
      log(`Questão ${questao.id} já existe no banco, pulando...`);
      return 'exists';
    }

    // Inserir nova questão
    const { error } = await supabase
      .from('questoes_concurso')
      .insert({
        id: questaoId,
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
        imagens_enunciado: questao.imagensEnunciado.length > 0 ? questao.imagensEnunciado : null,
        imagens_comentario: questao.imagensComentario.length > 0 ? questao.imagensComentario : null,
        ativo: true,
        created_at: new Date().toISOString(),
      });

    if (error) {
      log(`Erro ao salvar questão ${questao.id}: ${error.message}`, 'error');
      return 'error';
    }

    log(`Questão ${questao.id} salva com sucesso!`);
    return 'saved';

  } catch (error) {
    log(`Exceção ao salvar questão: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return 'error';
  }
}

async function salvarLoteQuestoes(questoes: QuestaoColetada[]): Promise<{ salvos: number; existentes: number; erros: number }> {
  let salvos = 0;
  let existentes = 0;
  let erros = 0;

  for (const questao of questoes) {
    const resultado = await salvarQuestaoNoBanco(questao);
    switch (resultado) {
      case 'saved':
        salvos++;
        break;
      case 'exists':
        existentes++;
        break;
      case 'error':
        erros++;
        break;
    }
  }

  log(`Lote processado: ${salvos} novas, ${existentes} já existentes, ${erros} erros`);
  return { salvos, existentes, erros };
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

    // 4. FLUXO CORRETO: Usar "Editar quantidades" para controlar cadernos de até 30k
    // O TecConcursos tem limite de 30k questões por caderno
    // Estratégia: clicar em "Editar quantidades", coletar matérias com quantidades originais,
    // zerar tudo, preencher até ~30k, gerar caderno, repetir para próximos lotes

    const page = await getPage();

    // Seletor do link "Editar quantidades" (fornecido pelo usuário)
    const SELETOR_EDITAR_QUANTIDADES = '#caderno-novo > div > div > div.gerador-caderno-novo > div > div.gerador-conteudo.ng-scope.ng-isolate-scope.sem-borda-inferior > div > div.ng-scope.ng-isolate-scope > div.somente-desktop > div > div > div > div.gerador-filtrador.somente-desktop > div.gerador-filtrador-rodape > div.gerador-filtrador-conteudo-rodape-informacoes > div.gerador-filtrador-conteudo-rodape-configurar > span > a';

    // 4.1 Clicar em "Remover desatualizadas" e "Remover anuladas" PRIMEIRO
    log('Clicando em "Remover desatualizadas" e "Remover anuladas"...');
    await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      for (const link of links) {
        const text = link.textContent?.trim() || '';
        if (text.includes('Remover desatualizadas') || text.includes('Remover anuladas')) {
          (link as HTMLElement).click();
        }
      }
    });
    await delay(CONFIG.delays.afterPageLoad);
    await page.screenshot({ path: '/tmp/tec-apos-remover-opcoes.png', fullPage: true });

    // 4.2 Clicar em "Editar quantidades"
    log('Clicando em "Editar quantidades"...');
    let editarQtdClicked = false;

    // Primeiro, vamos encontrar e logar todos os links disponíveis para debug
    const linksDisponiveis = await page.evaluate(() => {
      const results: { text: string; tag: string; x: number; y: number }[] = [];
      const elements = document.querySelectorAll('a, span, button');
      for (const el of elements) {
        const text = el.textContent?.trim() || '';
        if (text.toLowerCase().includes('editar') || text.toLowerCase().includes('quantidad')) {
          const rect = (el as HTMLElement).getBoundingClientRect();
          results.push({
            text: text.substring(0, 50),
            tag: el.tagName,
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
          });
        }
      }
      return results;
    });
    log(`Links relacionados a "editar/quantidades" encontrados: ${JSON.stringify(linksDisponiveis)}`);

    // Tentar pelo seletor específico primeiro
    try {
      const editarLink = await page.$(SELETOR_EDITAR_QUANTIDADES);
      if (editarLink) {
        await editarLink.click();
        editarQtdClicked = true;
        log('Clicado via seletor específico');
      }
    } catch {
      log('Seletor específico falhou, tentando alternativas...');
    }

    // Filtrar apenas elementos visíveis (x > 0 e y > 0)
    const linksVisiveis = linksDisponiveis.filter(l => l.x > 0 && l.y > 0);
    log(`Links visíveis: ${JSON.stringify(linksVisiveis)}`);

    // Se temos links visíveis, clicar via coordenadas (mais confiável)
    if (linksVisiveis.length > 0) {
      const link = linksVisiveis[0];
      log(`Clicando via coordenadas em: ${link.text} (${link.x}, ${link.y})`);
      await page.mouse.click(link.x, link.y);
      editarQtdClicked = true;
    }

    // Se não funcionou, tentar por texto (apenas elementos visíveis)
    if (!editarQtdClicked) {
      const clickResult = await page.evaluate(() => {
        const links = document.querySelectorAll('a, span, button');
        for (const link of links) {
          const text = link.textContent?.trim() || '';
          if (text === 'Editar quantidades' || text.includes('Editar quantidades')) {
            const rect = (link as HTMLElement).getBoundingClientRect();
            // Verificar se o elemento é visível
            if (rect.x > 0 && rect.y > 0 && rect.width > 0 && rect.height > 0) {
              (link as HTMLElement).click();
              return { clicked: true, text, x: rect.x, y: rect.y };
            }
          }
        }
        return { clicked: false, text: '', x: 0, y: 0 };
      });
      if (clickResult.clicked) {
        editarQtdClicked = true;
        log(`Clicado via texto: "${clickResult.text}" em (${clickResult.x}, ${clickResult.y})`);
      }
    }

    if (!editarQtdClicked) {
      await page.screenshot({ path: '/tmp/tec-editar-quantidades-nao-encontrado.png', fullPage: true });
      throw new Error('Link "Editar quantidades" não encontrado');
    }

    // Aguardar mais tempo para o AngularJS processar e carregar os dados
    await delay(3000);
    await page.screenshot({ path: '/tmp/tec-editar-quantidades-apos-click.png', fullPage: true });

    // Verificar se há um painel/modal aberto com inputs
    const temPainelAberto = await page.evaluate(() => {
      // Verificar se há inputs visíveis na página
      const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');
      let inputsVisiveis = 0;
      inputs.forEach(input => {
        const rect = (input as HTMLElement).getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          inputsVisiveis++;
        }
      });
      return { inputsVisiveis, totalInputs: inputs.length };
    });
    log(`Inputs na página: ${temPainelAberto.inputsVisiveis} visíveis de ${temPainelAberto.totalInputs} total`);

    // Se não há inputs suficientes, pode ser que o painel não abriu
    if (temPainelAberto.inputsVisiveis < 5) {
      log('Poucos inputs encontrados, aguardando mais tempo...');
      await delay(3000);
      await page.screenshot({ path: '/tmp/tec-editar-quantidades-esperando.png', fullPage: true });
    }

    await page.screenshot({ path: '/tmp/tec-editar-quantidades.png', fullPage: true });

    // 4.3 Coletar todas as matérias com suas quantidades ORIGINAIS
    log('Coletando matérias e quantidades originais...');
    const materiasOriginais = await page.evaluate(() => {
      const materias: { nome: string; quantidade: number; indice: number }[] = [];

      // Procurar inputs de quantidade
      const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');

      inputs.forEach((input, index) => {
        const inputEl = input as HTMLInputElement;
        const quantidade = parseInt(inputEl.value) || 0;

        if (quantidade > 0) {
          // Tentar encontrar nome da matéria próximo ao input
          let nome = '';

          // Verificar elemento anterior (label, td, span)
          const parent = inputEl.parentElement;
          if (parent) {
            const prevSibling = parent.previousElementSibling;
            if (prevSibling) {
              nome = prevSibling.textContent?.trim() || '';
            }
            // Tentar dentro do parent
            if (!nome) {
              const label = parent.querySelector('label, span, td:first-child');
              if (label) {
                nome = label.textContent?.trim() || '';
              }
            }
          }

          // Se ainda não achou, usar texto da row inteira
          if (!nome) {
            const row = inputEl.closest('tr, .row, div[class*="materia"]');
            if (row) {
              const firstCol = row.querySelector('td:first-child, .nome, label');
              if (firstCol) {
                nome = firstCol.textContent?.trim() || '';
              }
            }
          }

          if (!nome) {
            nome = `Matéria ${index + 1}`;
          }

          materias.push({
            nome: nome.substring(0, 100),
            quantidade,
            indice: index,
          });
        }
      });

      return materias;
    });

    log(`Matérias encontradas: ${materiasOriginais.length}`);
    const totalQuestoes = materiasOriginais.reduce((sum, m) => sum + m.quantidade, 0);
    log(`Total de questões: ${totalQuestoes}`);

    if (materiasOriginais.length === 0) {
      throw new Error('Nenhuma matéria encontrada na tela de editar quantidades');
    }

    // 4.4 Loop para criar cadernos de até 30k questões cada
    const LIMITE_POR_CADERNO = 29000; // Margem de segurança
    const cadernosCriados: { nome: string; materias: string[]; totalQuestoes: number }[] = [];
    let indiceMateriaAtual = 0;
    let cadernoNumero = 1;

    while (indiceMateriaAtual < materiasOriginais.length) {
      log(`\n=== Criando caderno ${cadernoNumero} ===`);

      // 4.4.1 Zerar todas as quantidades usando TECLADO PURO para garantir que Angular reconheça
      // JavaScript DOM manipulation não funciona com o AngularJS deste site
      log('Zerando todas as quantidades via teclado...');

      // Obter índices dos inputs que precisam ser zerados
      const inputsParaZerar = await page.evaluate(() => {
        const allInputs = document.querySelectorAll('input[type="number"], input[type="text"]');
        const indices: number[] = [];
        allInputs.forEach((input, idx) => {
          const val = parseInt((input as HTMLInputElement).value) || 0;
          if (val > 0) indices.push(idx);
        });
        return indices;
      });

      log(`Inputs para zerar: ${inputsParaZerar.length}`);

      // Zerar cada input via teclado
      for (const idx of inputsParaZerar) {
        const inputCoords = await page.evaluate((i) => {
          const allInputs = document.querySelectorAll('input[type="number"], input[type="text"]');
          const input = allInputs[i] as HTMLInputElement;
          if (!input) return null;
          input.scrollIntoView({ block: 'center' });
          const rect = input.getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        }, idx);

        if (inputCoords) {
          await page.mouse.click(inputCoords.x, inputCoords.y);
          await delay(30);
          await page.keyboard.down('Control');
          await page.keyboard.press('KeyA');
          await page.keyboard.up('Control');
          await delay(20);
          await page.keyboard.type('0', { delay: 30 });
          await delay(20);
        }
      }

      // Tab final para sair do último campo
      await page.keyboard.press('Tab');
      await delay(1000);

      // Clicar em algum lugar neutro para forçar Angular a atualizar
      await page.mouse.click(100, 100);
      await delay(500);

      // Verificar se o Total foi zerado
      const totalAposZerar = await page.evaluate(() => {
        const text = document.body.innerText || '';
        const match = text.match(/Total no caderno[:\s]+(\d[\d.,]*)/i);
        return match ? parseInt(match[1].replace(/[.,]/g, ''), 10) : -1;
      });
      log(`Total após zerar: ${totalAposZerar}`);

      // 4.4.2 Preencher matérias até atingir ~30k
      let totalCaderno = 0;
      const materiasNoCaderno: string[] = [];
      const indiceInicio = indiceMateriaAtual;

      while (indiceMateriaAtual < materiasOriginais.length && totalCaderno < LIMITE_POR_CADERNO) {
        const materia = materiasOriginais[indiceMateriaAtual];

        // Verificar se adicionar esta matéria excederia o limite
        if (totalCaderno + materia.quantidade > LIMITE_POR_CADERNO && materiasNoCaderno.length > 0) {
          // Não cabe mais, parar aqui
          break;
        }

        // Preencher quantidade desta matéria usando CDP Input.insertText:
        // Este é o método mais baixo nível para inserir texto, deve funcionar com AngularJS
        let preenchido = false;

        try {
          // Obter bounding box do input para clicar diretamente nele
          const inputInfo = await page.evaluate((idx) => {
            const allInputs = document.querySelectorAll('input[type="number"], input[type="text"]');
            if (idx >= allInputs.length) return null;

            const input = allInputs[idx] as HTMLInputElement;
            input.scrollIntoView({ block: 'center' });

            const rect = input.getBoundingClientRect();
            return {
              x: rect.x + rect.width / 2,
              y: rect.y + rect.height / 2,
              visible: rect.width > 0 && rect.height > 0,
              currentValue: input.value
            };
          }, materia.indice);

          if (inputInfo && inputInfo.visible) {
            // 1. Clicar no input para focar
            await page.mouse.click(inputInfo.x, inputInfo.y);
            await delay(200);

            // 2. Triple-click para selecionar tudo
            await page.mouse.click(inputInfo.x, inputInfo.y, { clickCount: 3 });
            await delay(100);

            // 3. Usar keyboard.type que funcionava para setar DOM (mesmo que Angular não reconheça)
            const valueToType = String(materia.quantidade);
            await page.keyboard.type(valueToType, { delay: 30 });
            await delay(200);

            // 5. Tab para blur
            await page.keyboard.press('Tab');
            await delay(300);

            // Verificar se o valor foi aceito pelo AngularJS
            const resultado = await page.evaluate((idx, qtdEsperada) => {
              const allInputs = document.querySelectorAll('input[type="number"], input[type="text"]');
              const input = allInputs[idx] as HTMLInputElement;
              const valorDOM = input?.value || '';

              // Verificar Total no caderno
              const text = document.body.innerText || '';
              const match = text.match(/Total no caderno[:\s]+(\d[\d.,]*)/i);
              const totalNaPagina = match ? parseInt(match[1].replace(/[.,]/g, ''), 10) : 0;

              return {
                valorDOM,
                totalNaPagina,
                correto: valorDOM === String(qtdEsperada) && totalNaPagina > 0
              };
            }, materia.indice, materia.quantidade);

            if (resultado.correto) {
              preenchido = true;
              log(`  [✓] DOM: ${resultado.valorDOM}, Total: ${resultado.totalNaPagina}`);
            } else if (resultado.valorDOM === String(materia.quantidade)) {
              // Valor está no DOM mas Total ainda é 0
              log(`  [?] DOM: ${resultado.valorDOM} (correto), Total: ${resultado.totalNaPagina}`);
              preenchido = true;
            } else {
              log(`  [!] DOM: ${resultado.valorDOM}, Total: ${resultado.totalNaPagina}`, 'warn');

              // Fallback: usar keyboard type diretamente
              await page.mouse.click(inputInfo.x, inputInfo.y, { clickCount: 3 });
              await delay(100);
              await page.keyboard.type(valueToType, { delay: 30 });
              await delay(100);
              await page.keyboard.press('Tab');
              await delay(300);

              const retryResult = await page.evaluate((idx) => {
                const allInputs = document.querySelectorAll('input[type="number"], input[type="text"]');
                const input = allInputs[idx] as HTMLInputElement;
                return input?.value || '';
              }, materia.indice);

              if (retryResult === String(materia.quantidade)) {
                preenchido = true;
                log(`  [✓] Retry bem-sucedido: DOM=${retryResult}`);
              }
            }
          } else {
            log(`  Input ${materia.indice} não está visível ou não existe`, 'warn');
          }
        } catch (err) {
          log(`  Erro ao preencher input ${materia.indice}: ${err instanceof Error ? err.message : String(err)}`, 'error');
        }

        if (preenchido) {
          totalCaderno += materia.quantidade;
          materiasNoCaderno.push(materia.nome);
          log(`  + ${materia.nome}: ${materia.quantidade} (total: ${totalCaderno})`);
        }

        indiceMateriaAtual++;
      }

      if (materiasNoCaderno.length === 0) {
        log('Nenhuma matéria adicionada ao caderno, encerrando');
        break;
      }

      // 4.4.3 Preencher nome do caderno
      const nomeCaderno = `${areaNome} ${cadernoNumero}`;
      log(`Definindo nome do caderno: ${nomeCaderno}`);

      await page.evaluate((nome) => {
        // Procurar campo de nome do caderno
        const inputs = document.querySelectorAll('input[type="text"]');
        for (const input of inputs) {
          const inputEl = input as HTMLInputElement;
          const placeholder = inputEl.placeholder?.toLowerCase() || '';
          const name = inputEl.name?.toLowerCase() || '';
          // Campo de nome geralmente tem placeholder ou name relacionado
          if (placeholder.includes('nome') || name.includes('nome') ||
              placeholder.includes('caderno') || name.includes('caderno')) {
            inputEl.value = nome;
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));
            return;
          }
        }
        // Tentar o primeiro input que não seja de quantidade
        for (const input of inputs) {
          const inputEl = input as HTMLInputElement;
          if (inputEl.type === 'text' && !inputEl.closest('tr, .quantidade-row')) {
            inputEl.value = nome;
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
            break;
          }
        }
      }, nomeCaderno);

      await delay(500);

      // Verificar "Total no caderno" na página antes de gerar
      const totalNaPagina = await page.evaluate(() => {
        const bodyText = document.body.innerText || '';
        // Procurar "Total no caderno: X" ou similar
        const match = bodyText.match(/Total no caderno[:\s]+(\d+)/i);
        if (match) return parseInt(match[1], 10);
        // Tentar alternativa
        const match2 = bodyText.match(/(\d+)\s*questões? no caderno/i);
        if (match2) return parseInt(match2[1], 10);
        return 0;
      });

      log(`Total no caderno (página): ${totalNaPagina}`);

      if (totalNaPagina === 0) {
        log('AVISO: Total no caderno é 0! Os valores não foram registrados pelo AngularJS', 'error');
        // Continuar mesmo assim para ver o que acontece, mas logar o aviso
      }

      await page.screenshot({ path: `/tmp/tec-caderno-${cadernoNumero}-antes.png`, fullPage: true });

      // 4.4.4 Clicar em GERAR CADERNO
      log('Clicando em GERAR CADERNO...');
      const gerarClicked = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, input[type="submit"]');
        for (const btn of buttons) {
          const text = btn.textContent?.trim().toUpperCase() || '';
          if (text.includes('GERAR CADERNO') || text === 'GERAR') {
            (btn as HTMLElement).click();
            return true;
          }
        }
        return false;
      });

      if (!gerarClicked) {
        log('Botão GERAR CADERNO não encontrado', 'warn');
        break;
      }

      // Aguardar geração
      await delay(5000);
      await page.screenshot({ path: `/tmp/tec-caderno-${cadernoNumero}-apos.png`, fullPage: true });

      // Verificar se apareceu modal de limite
      const temModalLimite = await page.evaluate(() => {
        if (document.body.innerText.includes('Limite de Questões Excedido')) {
          const okBtns = document.querySelectorAll('button');
          for (const btn of okBtns) {
            if (btn.textContent?.trim().toUpperCase() === 'OK') {
              btn.click();
              return true;
            }
          }
          return true;
        }
        return false;
      });

      if (temModalLimite) {
        log('Modal de limite apareceu - reduzindo matérias', 'error');
        await delay(1000);
        // Voltar uma matéria e tentar novamente
        indiceMateriaAtual = indiceInicio + Math.max(1, Math.floor(materiasNoCaderno.length / 2));
        continue;
      }

      // Verificar se houve erro no servidor
      const temErroServidor = await page.evaluate(() => {
        const bodyText = document.body.innerText || '';
        if (bodyText.includes('Ocorreu um erro no servidor') ||
            bodyText.includes('erro no servidor') ||
            bodyText.includes('Erro interno')) {
          return true;
        }
        return false;
      });

      if (temErroServidor) {
        log('Erro no servidor do TecConcursos detectado - tentando novamente...', 'error');
        await page.screenshot({ path: `/tmp/tec-caderno-${cadernoNumero}-erro-servidor.png`, fullPage: true });
        await delay(3000);

        // Tentar novamente com menos matérias
        if (materiasNoCaderno.length > 1) {
          indiceMateriaAtual = indiceInicio + Math.max(1, Math.floor(materiasNoCaderno.length / 2));
          log(`Reduzindo para ${indiceMateriaAtual - indiceInicio} matérias e tentando novamente...`);

          // Voltar para página de criar caderno
          await page.goto(`${CONFIG.baseUrl}/questoes/cadernos/novo/`, { waitUntil: 'networkidle2' });
          await delay(CONFIG.delays.afterPageLoad);
          await selecionarArea(areaNome);
          await page.evaluate(() => {
            const links = document.querySelectorAll('a');
            for (const link of links) {
              const text = link.textContent?.trim() || '';
              if (text.includes('Remover desatualizadas') || text.includes('Remover anuladas')) {
                (link as HTMLElement).click();
              }
            }
          });
          await delay(CONFIG.delays.afterPageLoad);

          // IMPORTANTE: Clicar em "Editar quantidades" novamente para reabrir o painel
          log('Reabrindo painel "Editar quantidades"...');
          const linksRetry = await page.evaluate(() => {
            const allElements = document.querySelectorAll('a, span');
            const found: { text: string; x: number; y: number }[] = [];
            allElements.forEach((el) => {
              const text = el.textContent?.trim() || '';
              if (text.toLowerCase().includes('editar quant')) {
                const rect = el.getBoundingClientRect();
                found.push({ text, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
              }
            });
            return found.filter(l => l.x > 0 && l.y > 0);
          });

          if (linksRetry.length > 0) {
            const link = linksRetry[0];
            log(`Clicando em: ${link.text} (${link.x}, ${link.y})`);
            await page.mouse.click(link.x, link.y);
            await delay(CONFIG.delays.afterPageLoad + 2000);
          } else {
            log('Link "Editar quantidades" não encontrado no retry', 'warn');
          }

          continue;
        } else {
          log('Não foi possível criar caderno mesmo com 1 matéria, pulando...', 'error');
          indiceMateriaAtual++;
          continue;
        }
      }

      // Verificar se modal "sem questões" apareceu
      const temModalSemQuestoes = await page.evaluate(() => {
        const bodyText = document.body.innerText || '';
        if (bodyText.includes('Não é possível gerar caderno sem questões') ||
            bodyText.includes('sem questões')) {
          // Fechar modal se houver botão
          const buttons = document.querySelectorAll('button');
          for (const btn of buttons) {
            const text = btn.textContent?.trim().toUpperCase() || '';
            if (text === 'OK' || text === 'FECHAR') {
              btn.click();
              break;
            }
          }
          return true;
        }
        return false;
      });

      if (temModalSemQuestoes) {
        log('Modal "sem questões" apareceu - valores não foram registrados pelo AngularJS', 'error');
        await page.screenshot({ path: `/tmp/tec-caderno-${cadernoNumero}-sem-questoes.png`, fullPage: true });

        // Diagnóstico: verificar valores dos inputs
        const diagnostico = await page.evaluate(() => {
          const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');
          const valores: { index: number; value: string; ngModel: string | null }[] = [];
          inputs.forEach((input, idx) => {
            const inp = input as HTMLInputElement;
            const ngModel = inp.getAttribute('ng-model');
            if (inp.value && inp.value !== '0') {
              valores.push({ index: idx, value: inp.value, ngModel });
            }
          });
          return { totalInputs: inputs.length, inputsComValor: valores };
        });
        log(`Diagnóstico: ${diagnostico.totalInputs} inputs, ${diagnostico.inputsComValor.length} com valor`);

        // Tentar abordagem diferente - usar form submit direto
        log('Tentando abordagem alternativa...');
        indiceMateriaAtual = indiceInicio + 1; // Tentar só com a primeira matéria
        await page.goto(`${CONFIG.baseUrl}/questoes/cadernos/novo/`, { waitUntil: 'networkidle2' });
        await delay(CONFIG.delays.afterPageLoad);
        await selecionarArea(areaNome);
        continue;
      }

      // Verificar se URL mudou para caderno criado (indica sucesso real)
      const urlAposCriacao = page.url();
      const cadernoRealmenteCriado = urlAposCriacao.includes('/questoes/cadernos/') &&
                                      !urlAposCriacao.includes('/novo');

      if (!cadernoRealmenteCriado) {
        log(`URL não indica sucesso: ${urlAposCriacao}`, 'warn');
        // Verificar se há algum elemento indicando sucesso
        const temIndicadorSucesso = await page.evaluate(() => {
          const body = document.body.innerText || '';
          return body.includes('Caderno criado') ||
                 body.includes('sucesso') ||
                 document.querySelector('.caderno-questoes') !== null;
        });

        if (!temIndicadorSucesso) {
          log('Nenhum indicador de sucesso encontrado, verificando página...', 'warn');
          await page.screenshot({ path: `/tmp/tec-caderno-${cadernoNumero}-verificacao.png`, fullPage: true });
        }
      }

      // Caderno criado com sucesso
      cadernosCriados.push({
        nome: nomeCaderno,
        materias: materiasNoCaderno,
        totalQuestoes: totalCaderno,
      });

      log(`✓ Caderno "${nomeCaderno}" criado: ${totalCaderno} questões (${materiasNoCaderno.length} matérias)`);

      // Se ainda há matérias, voltar para criar próximo caderno
      if (indiceMateriaAtual < materiasOriginais.length) {
        log('Voltando para criar próximo caderno...');
        await page.goto(`${CONFIG.baseUrl}/questoes/cadernos/novo/`, { waitUntil: 'networkidle2' });
        await delay(CONFIG.delays.afterPageLoad);

        // Selecionar a área novamente
        await selecionarArea(areaNome);

        // Clicar em remover desatualizadas/anuladas novamente
        await page.evaluate(() => {
          const links = document.querySelectorAll('a');
          for (const link of links) {
            const text = link.textContent?.trim() || '';
            if (text.includes('Remover desatualizadas') || text.includes('Remover anuladas')) {
              (link as HTMLElement).click();
            }
          }
        });
        await delay(CONFIG.delays.afterPageLoad);

        // Clicar em "Editar quantidades" novamente
        await page.evaluate(() => {
          const links = document.querySelectorAll('a, span');
          for (const link of links) {
            if (link.textContent?.includes('Editar quantidades')) {
              (link as HTMLElement).click();
              return;
            }
          }
        });
        await delay(CONFIG.delays.afterPageLoad + 2000);
      }

      cadernoNumero++;
      await delay(CONFIG.delays.betweenCadernos);
    }

    // Resumo
    log('\n=== RESUMO DOS CADERNOS CRIADOS ===');
    for (const caderno of cadernosCriados) {
      log(`${caderno.nome}: ${caderno.totalQuestoes} questões (${caderno.materias.length} matérias)`);
    }
    log(`Total de cadernos: ${cadernosCriados.length}`);
    log(`Total de questões: ${cadernosCriados.reduce((sum, c) => sum + c.totalQuestoes, 0)}`);

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

// ==================== EXTRAÇÃO DE CADERNO POR URL ====================

/**
 * Extrai questões de um caderno existente por URL
 * Usado para cadernos criados manualmente
 */
async function extrairQuestoesDeCadernoUrl(
  cadernoUrl: string,
  options?: {
    startFromQuestion?: number; // Número da questão para começar (1-indexed)
    cadernoId?: string; // ID do caderno para atualizar progresso no banco
    accountId?: string; // ID da conta para usar (para workers paralelos)
  }
): Promise<{
  success: boolean;
  questoes: QuestaoColetada[];
  salvos: number;
  erros: number;
  message: string;
}> {
  const startFrom = options?.startFromQuestion || 1;
  const cadernoId = options?.cadernoId;
  const accountId = options?.accountId;

  log(`Iniciando extração de questões do caderno: ${cadernoUrl} (começando da questão ${startFrom})${accountId ? ` [Account: ${accountId}]` : ''}`);

  if (!cadernoUrl.includes('tecconcursos.com.br')) {
    return {
      success: false,
      questoes: [],
      salvos: 0,
      erros: 0,
      message: 'URL inválida. Use uma URL do TecConcursos.',
    };
  }

  try {
    // Fazer login primeiro (com conta específica se fornecida)
    const loggedIn = await login(accountId);
    if (!loggedIn) {
      return {
        success: false,
        questoes: [],
        salvos: 0,
        erros: 0,
        message: 'Não foi possível fazer login. Importe os cookies novamente.',
      };
    }

    const page = await getPage();
    const questoes: QuestaoColetada[] = [];

    log(`Navegando para o caderno: ${cadernoUrl}`);
    await page.goto(cadernoUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    await delay(CONFIG.delays.afterPageLoad);

    // Screenshot para debug
    await page.screenshot({ path: '/tmp/caderno-page.png', fullPage: false });

    // Verificar se estamos na página correta
    const pageTitle = await page.title();
    log(`Título da página: ${pageTitle}`);

    // Inicializar progresso
    _progress = {
      area: 'manual',
      caderno: cadernoUrl,
      questoesColetadas: 0,
      questoesTotal: 0,
      status: 'running',
      startedAt: new Date(),
      updatedAt: new Date(),
    };
    _isRunning = true;

    // Tentar obter o total de questões do caderno
    // TecConcursos mostra "Questão 1 de 121870" no topo
    let totalQuestoes = 0;
    try {
      // Procurar texto que contém "de X" onde X é o total
      const bodyText = await page.evaluate(() => document.body.innerText);
      const match = bodyText.match(/Quest[aã]o\s+\d+\s+de\s+([\d.]+)/i);
      if (match) {
        totalQuestoes = parseInt(match[1].replace(/\D/g, '')) || 0;
        log(`Total de questões detectado: ${totalQuestoes}`);
      } else {
        // Fallback para seletores específicos
        const totalText = await page.$eval('.total-questoes, .questoes-count, [data-total]', (el: Element) => el.textContent || '').catch(() => '');
        totalQuestoes = parseInt(totalText.replace(/\D/g, '')) || 0;
        if (totalQuestoes > 0) {
          log(`Total de questões (fallback): ${totalQuestoes}`);
        }
      }
    } catch (e) {
      log('Não foi possível detectar o total de questões', 'warn');
    }

    _progress.questoesTotal = totalQuestoes;

    let paginaAtual = 1;
    let temMaisQuestoes = true;
    let questoesSemDadosConsecutivas = 0;
    const MAX_SEM_DADOS = 10;

    // Se precisamos começar de uma posição específica, pular rapidamente até lá
    if (startFrom > 1) {
      log(`Pulando para a questão ${startFrom} (${startFrom - 1} questões a pular)...`);
      const questoesAPular = startFrom - 1;

      for (let i = 0; i < questoesAPular && _isRunning; i++) {
        // Navegar rápido sem extrair dados
        await page.keyboard.press('ArrowRight');
        await delay(300); // Delay menor para navegação rápida

        // Log a cada 100 questões puladas
        if ((i + 1) % 100 === 0) {
          log(`Puladas ${i + 1}/${questoesAPular} questões...`);
        }
      }

      // Esperar a página carregar após pular
      await delay(1500);
      paginaAtual = startFrom;
      log(`Chegou na questão ${startFrom}, iniciando extração...`);
    }

    // Função auxiliar para atualizar posição no banco
    const updateCadernoPosition = async (questionNumber: number, questionId: string) => {
      if (cadernoId) {
        try {
          const supabase = getSupabase();
          await supabase
            .from('tec_cadernos')
            .update({
              last_question_number: questionNumber,
              last_question_id: questionId,
              collected_questions: questionNumber,
              updated_at: new Date().toISOString(),
            })
            .eq('id', cadernoId);
        } catch (err) {
          log(`Erro ao atualizar posição do caderno: ${err}`, 'warn');
        }
      }
    };

    while (temMaisQuestoes && _isRunning) {
      log(`Processando página ${paginaAtual}...`);

      // Tentar diferentes seletores para as questões
      const seletores = [
        '.questao-caderno',
        '.questao',
        '.question-item',
        '[data-questao-id]',
        '.caderno-questao',
        'article.question',
      ];

      let questoesElements: any[] = [];
      for (const seletor of seletores) {
        questoesElements = await page.$$(seletor);
        if (questoesElements.length > 0) {
          log(`Encontradas ${questoesElements.length} questões com seletor: ${seletor}`);
          break;
        }
      }

      if (questoesElements.length === 0) {
        // Tentar pegar o HTML para debug
        const html = await page.content();
        const debugPath = path.join(TEMP_DIR, 'caderno-debug.html');
        fs.writeFileSync(debugPath, html);
        log(`Nenhuma questão encontrada na página. HTML salvo em ${debugPath}`, 'warn');

        // Analisar estrutura da página para debug
        const pageStructure = await page.evaluate(() => {
          const result: {
            mainClasses: string[];
            articleElements: string[];
            divClasses: string[];
            questionLikeElements: string[];
            bodyText: string;
          } = {
            mainClasses: [],
            articleElements: [],
            divClasses: [],
            questionLikeElements: [],
            bodyText: document.body.innerText.substring(0, 500),
          };

          // Encontrar todas as classes principais
          document.querySelectorAll('main, article, section, .container, [class*="quest"]').forEach(el => {
            result.mainClasses.push(`${el.tagName}.${el.className}`);
          });

          // Encontrar elementos article
          document.querySelectorAll('article').forEach(el => {
            result.articleElements.push(`${el.tagName}.${el.className}`);
          });

          // Encontrar divs com classes que possam conter questões
          document.querySelectorAll('div[class*="quest"], div[class*="enunciado"], div[class*="conteudo"]').forEach(el => {
            result.divClasses.push(`${el.tagName}.${el.className}`);
          });

          // Encontrar elementos que parecem questões
          document.querySelectorAll('[data-id], [data-questao], [id*="quest"]').forEach(el => {
            result.questionLikeElements.push(`${el.tagName}#${el.id}.${el.className}`);
          });

          return result;
        });

        log(`Estrutura da página: ${JSON.stringify(pageStructure, null, 2)}`);

        // Verificar se há erro de permissão
        const errorText = await page.$eval('body', (el: Element) => el.textContent || '').catch(() => '');
        if (errorText.includes('acesso') || errorText.includes('login') || errorText.includes('permission')) {
          return {
            success: false,
            questoes,
            salvos: 0,
            erros: 0,
            message: 'Acesso negado ao caderno. Verifique se você tem permissão e se está logado.',
          };
        }
        break;
      }

      let questoesPuladas = 0;

      for (const questaoEl of questoesElements) {
        try {
          // OTIMIZAÇÃO: Primeiro obter apenas o ID rapidamente
          let questaoIdRapido = await questaoEl.evaluate((el: Element) => {
            // Tentar diferentes formas de obter o ID rapidamente
            const dataId = el.getAttribute('data-id') ||
                           el.getAttribute('data-questao-id') ||
                           el.getAttribute('id');
            if (dataId) return dataId.replace(/\D/g, '');

            // Procurar em links dentro da questão
            const link = el.querySelector('a[href*="/questoes/"]');
            if (link) {
              const match = link.getAttribute('href')?.match(/\/questoes\/(\d+)/);
              if (match) return match[1];
            }

            // Procurar #ID no texto (ex: #1635243)
            const text = el.textContent || '';
            const idMatch = text.match(/#(\d{5,})/);
            if (idMatch) return idMatch[1];

            return '';
          });

          // Fallback: tentar obter ID do body text
          if (!questaoIdRapido) {
            const bodyText = await page.evaluate(() => document.body.innerText);
            const idMatch = bodyText.match(/#(\d{5,})/);
            if (idMatch) questaoIdRapido = idMatch[1];
          }

          // Se conseguimos o ID, verificar se já existe no banco
          if (questaoIdRapido) {
            const jaExiste = await questaoJaExiste(questaoIdRapido);
            if (jaExiste) {
              questoesPuladas++;
              log(`Questão ${questaoIdRapido} já existe, pulando... (${questoesPuladas} puladas)`);
              // Atualizar posição mesmo pulando (para retomada correta)
              await updateCadernoPosition(paginaAtual, questaoIdRapido);
              continue; // Pular para próxima questão sem extrair dados
            }
          }

          // Questão não existe, fazer extração completa
          const questao = await extrairDadosQuestaoTec(questaoEl, page);
          if (questao) {
            questoes.push(questao);
            questoesSemDadosConsecutivas = 0;

            // Atualizar progresso
            if (_progress) {
              _progress.questoesColetadas = questoes.length;
              _progress.updatedAt = new Date();
            }

            log(`Questão ${questao.id} extraída (${questoes.length} total)`);

            // Atualizar posição no banco para retomada
            await updateCadernoPosition(paginaAtual, questao.id);
          } else {
            questoesSemDadosConsecutivas++;
          }
        } catch (err) {
          questoesSemDadosConsecutivas++;
          log(`Erro ao extrair questão: ${err instanceof Error ? err.message : String(err)}`, 'warn');
        }

        await delay(100); // Pequeno delay entre questões
      }

      // Se muitas questões consecutivas sem dados, pode haver problema
      if (questoesSemDadosConsecutivas >= MAX_SEM_DADOS) {
        log(`${MAX_SEM_DADOS} questões consecutivas sem dados. Verificando seletores...`, 'warn');
      }

      // TecConcursos mostra uma questão por vez com navegação por botões
      // Verificar se há próxima questão usando os botões de navegação
      // Os seletores incluem o botão ► (play/próximo) na barra inferior
      const nextQuestionSelectors = [
        // Botão de próxima questão (play icon) - barra inferior
        'button[title*="róxim"]',
        'button[title*="next"]',
        'a[title*="róxim"]',
        '.btn-proximo',
        '.btn-next',
        // Setas de navegação
        '.navegacao-questoes button:last-child',
        '.question-nav .next',
        // Ícones de seta
        'button svg[data-icon="play"]',
        'button svg[data-icon="chevron-right"]',
        // Fallback: qualquer botão com ícone de play
        '.questao button[class*="play"]',
        // Paginação tradicional
        '.pagination .next:not(.disabled) a',
        'a[rel="next"]',
      ];

      let nextBtn = null;
      for (const selector of nextQuestionSelectors) {
        nextBtn = await page.$(selector);
        if (nextBtn) {
          log(`Botão próxima questão encontrado com seletor: ${selector}`);
          break;
        }
      }

      // Se não encontrou por seletores, tentar por keyboard shortcut
      // TecConcursos suporta teclas de atalho: → para próxima questão
      if (!nextBtn) {
        log('Tentando navegar via teclado (seta direita)...');
        // Usar keyboard para navegar
        await page.keyboard.press('ArrowRight');
        await delay(1500);

        // Verificar se mudou de questão
        const novoTextoCheck = await page.evaluate(() => {
          const questaoEl = document.querySelector('.questao');
          const link = questaoEl?.querySelector('a[href*="/questoes/"]');
          return link?.getAttribute('href') || '';
        });
        const novoIdCheck = novoTextoCheck.match(/\/questoes\/(\d+)/)?.[1] || '';
        const questaoAtualIdCheck = questoes.length > 0 ? questoes[questoes.length - 1].id : '';

        if (novoIdCheck && novoIdCheck !== questaoAtualIdCheck) {
          paginaAtual++;
          log(`Navegou via teclado para questão ${novoIdCheck} (${paginaAtual}/${totalQuestoes || '?'})`);
          continue; // Continuar o loop
        } else {
          log('Navegação via teclado não funcionou.');
        }
      }

      if (nextBtn) {
        // Obter ID da questão atual antes de navegar
        const questaoAtualId = questoes.length > 0 ? questoes[questoes.length - 1].id : '';

        // Tentar navegação via teclado primeiro (mais confiável)
        // TecConcursos suporta atalho de teclado para próxima questão
        await page.keyboard.press('ArrowRight');
        await delay(2000); // Esperar carregamento AJAX

        // Verificar se mudou via teclado
        let navegouComSucesso = false;
        const textoAposTeclado = await page.evaluate(() => document.body.innerText);
        const idAposTeclado = textoAposTeclado.match(/#(\d{5,})/)?.[1] || '';
        if (idAposTeclado && idAposTeclado !== questaoAtualId) {
          navegouComSucesso = true;
          paginaAtual++;
          log(`Navegou via teclado (ArrowRight) para questão ${idAposTeclado} (${paginaAtual}/${totalQuestoes || '?'})`);
          continue; // Pular para a próxima iteração do loop
        }

        // Se não funcionou via teclado, tentar click no botão
        if (!navegouComSucesso) {
          log('Teclado não funcionou, tentando click no botão...');
          await (nextBtn as any).click();
          await delay(2500); // Esperar mais tempo para o click
        }

        // Verificar se realmente mudou de questão após click
        // Tentar múltiplos métodos para detectar a questão atual
        let novoId = '';

        // Método 1: Procurar link com href /questoes/ID
        const novoTexto = await page.$eval('.questao', (el: Element) => {
          const link = el.querySelector('a[href*="/questoes/"]');
          return link?.getAttribute('href') || '';
        }).catch(() => '');
        novoId = novoTexto.match(/\/questoes\/(\d+)/)?.[1] || '';

        // Método 2: Procurar #ID no texto (ex: #1635243)
        if (!novoId) {
          const bodyText = await page.evaluate(() => document.body.innerText);
          const idMatch = bodyText.match(/#(\d{5,})/);
          if (idMatch) {
            novoId = idMatch[1];
          }
        }

        // Método 3: Procurar no atributo data-id
        if (!novoId) {
          novoId = await page.$eval('.questao, [data-questao-id], [data-id]', (el: Element) => {
            return el.getAttribute('data-questao-id') || el.getAttribute('data-id') || '';
          }).catch(() => '');
        }

        // Método 4: Verificar número da questão no texto "Questão X de Y"
        if (!novoId) {
          const questaoNum = await page.evaluate(() => {
            const text = document.body.innerText;
            const match = text.match(/Quest[aã]o\s+(\d+)\s+de\s+\d+/i);
            return match ? match[1] : '';
          });
          if (questaoNum && parseInt(questaoNum) > paginaAtual) {
            // Questão mudou, mas não conseguimos o ID real
            paginaAtual = parseInt(questaoNum);
            log(`Detectada mudança para questão número ${questaoNum} (ID desconhecido)`);
            continue;
          }
        }

        if (novoId && novoId !== questaoAtualId) {
          paginaAtual++;
          log(`Navegou para questão ${novoId} (${paginaAtual}/${totalQuestoes || '?'})`);
        } else {
          log(`Navegação parece ter falhado. novoId=${novoId}, questaoAtualId=${questaoAtualId}`);
          // Tentar mais uma vez antes de desistir
          await delay(1000);
          const retryText = await page.evaluate(() => document.body.innerText);
          const retryMatch = retryText.match(/#(\d{5,})/);
          if (retryMatch && retryMatch[1] !== questaoAtualId) {
            novoId = retryMatch[1];
            paginaAtual++;
            log(`Retry bem-sucedido: questão ${novoId}`);
          } else {
            log('Parece que não há mais questões ou navegação falhou definitivamente.');
            temMaisQuestoes = false;
          }
        }

        // Limite de segurança para não ficar em loop infinito
        if (paginaAtual > 50000) {
          log('Limite de questões atingido (50000)', 'warn');
          break;
        }
      } else {
        log('Não encontrou botão de próxima questão.');
        temMaisQuestoes = false;
      }
    }

    log(`Extração concluída. ${questoes.length} questões coletadas.`);

    // Salvar no banco
    let salvos = 0;
    let existentes = 0;
    let erros = 0;

    if (questoes.length > 0) {
      log('Salvando questões no banco de dados...');
      const resultado = await salvarLoteQuestoes(questoes);
      salvos = resultado.salvos;
      existentes = resultado.existentes;
      erros = resultado.erros;
      log(`Salvamento concluído: ${salvos} novas, ${existentes} já existentes, ${erros} erros`);
    }

    // Atualizar progresso final
    if (_progress) {
      _progress.status = 'completed';
      _progress.updatedAt = new Date();
    }
    _isRunning = false;

    return {
      success: true,
      questoes,
      salvos,
      erros,
      message: `Extração concluída: ${questoes.length} questões coletadas, ${salvos} novas salvas, ${existentes} já existiam`,
    };

  } catch (error) {
    log(`Erro na extração: ${error instanceof Error ? error.message : String(error)}`, 'error');

    if (_progress) {
      _progress.status = 'error';
      _progress.lastError = error instanceof Error ? error.message : String(error);
      _progress.updatedAt = new Date();
    }
    _isRunning = false;

    return {
      success: false,
      questoes: [],
      salvos: 0,
      erros: 0,
      message: `Erro: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Extrai dados de uma questão específica do TecConcursos
 * Adaptado para a estrutura HTML real do site
 */
async function extrairDadosQuestaoTec(questaoEl: any, page: Page): Promise<QuestaoColetada | null> {
  try {
    // Extrair ID da questão - TecConcursos usa data-id ou id no elemento
    const id = await questaoEl.evaluate((el: Element) => {
      // Tentar diferentes formas de obter o ID
      const dataId = el.getAttribute('data-id') ||
                     el.getAttribute('data-questao-id') ||
                     el.getAttribute('id');
      if (dataId) return dataId.replace(/\D/g, '');

      // Procurar em links dentro da questão
      const link = el.querySelector('a[href*="/questoes/"]');
      if (link) {
        const match = link.getAttribute('href')?.match(/\/questoes\/(\d+)/);
        if (match) return match[1];
      }

      // Procurar no texto do número da questão
      const numEl = el.querySelector('.questao-numero, .numero, .question-number');
      if (numEl) {
        const num = numEl.textContent?.replace(/\D/g, '');
        if (num) return num;
      }

      return '';
    });

    if (!id) {
      log('Questão sem ID encontrada', 'warn');
      return null;
    }

    // Extrair matéria e assunto
    const materia = await questaoEl.$eval('.materia, .questao-materia, .subject, .disciplina', (el: Element) => el.textContent?.trim() || '').catch(() => '');
    const assunto = await questaoEl.$eval('.assunto, .questao-assunto, .topic, .topico', (el: Element) => el.textContent?.trim() || '').catch(() => null);

    // Extrair enunciado - preservar HTML para imagens e formatação
    const enunciado = await questaoEl.$eval('.enunciado, .questao-enunciado, .question-text, .questao-texto, .texto', (el: Element) => {
      return el.innerHTML?.trim() || '';
    }).catch(() => '');

    // Extrair alternativas
    const alternativasRaw = await questaoEl.$$eval('.alternativa, .alternativas li, .option, .choice, .opcao', (elements: Element[]) => {
      return elements.map((el, index) => {
        const letterEl = el.querySelector('.letra, .letter, .alternativa-letra');
        const letter = letterEl ? letterEl.textContent?.trim() : String.fromCharCode(65 + index);
        const textEl = el.querySelector('.texto, .alternativa-texto, .option-text') || el;
        const text = textEl.textContent?.replace(/^[A-E]\)?\s*/, '').trim() || '';
        return { letter: letter || String.fromCharCode(65 + index), text };
      });
    }).catch(() => []);

    const alternativas = alternativasRaw.filter((a: any) => a.text.length > 0);

    // Extrair gabarito
    const gabarito = await questaoEl.$eval('.gabarito, .resposta, .answer, [data-gabarito], .resposta-correta', (el: Element) => {
      const dataGab = el.getAttribute('data-gabarito');
      if (dataGab) return dataGab;
      const text = el.textContent?.trim() || '';
      const match = text.match(/[A-E]/);
      return match ? match[0] : text;
    }).catch(() => null);

    // Extrair comentário/resolução
    const comentario = await questaoEl.$eval('.comentario, .resolucao, .explanation, .questao-comentario', (el: Element) => el.innerHTML?.trim() || '').catch(() => null);

    // Extrair metadados
    const ano = await questaoEl.$eval('.ano, [data-ano], .questao-ano, .year', (el: Element) => {
      const anoText = el.getAttribute('data-ano') || el.textContent || '';
      return parseInt(anoText.replace(/\D/g, '')) || null;
    }).catch(() => null);

    const orgao = await questaoEl.$eval('.orgao, .organization, .questao-orgao', (el: Element) => el.textContent?.trim() || '').catch(() => null);
    const cargo = await questaoEl.$eval('.cargo, .position, .questao-cargo', (el: Element) => el.textContent?.trim() || '').catch(() => null);
    const prova = await questaoEl.$eval('.prova, .exam, .questao-prova', (el: Element) => el.textContent?.trim() || '').catch(() => null);
    const banca = await questaoEl.$eval('.banca, .board, .questao-banca', (el: Element) => el.textContent?.trim() || '').catch(() => null);
    const concurso = await questaoEl.$eval('.concurso, .contest, .questao-concurso', (el: Element) => el.textContent?.trim() || '').catch(() => null);

    // Extrair imagens do enunciado
    const imagensEnunciado: string[] = await questaoEl.$$eval('.enunciado img, .questao-enunciado img, .question-text img', (imgs: HTMLImageElement[]) => {
      return imgs.map(img => img.src).filter(src => src && !src.includes('data:'));
    }).catch(() => []);

    // Extrair imagens do comentário
    const imagensComentario: string[] = await questaoEl.$$eval('.comentario img, .resolucao img, .explanation img', (imgs: HTMLImageElement[]) => {
      return imgs.map(img => img.src).filter(src => src && !src.includes('data:'));
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
    log(`Erro ao extrair dados da questão: ${error instanceof Error ? error.message : String(error)}`, 'warn');
    return null;
  }
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
  // Extração de caderno por URL
  extrairQuestoesDeCadernoUrl,
};

export default TecConcursosScraper;
