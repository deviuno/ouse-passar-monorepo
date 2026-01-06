/**
 * TecConcursos Taxonomy Scraper Service
 *
 * Serviço para coletar a estrutura hierárquica de matérias e assuntos
 * do TecConcursos para criar uma taxonomia padronizada.
 *
 * Fluxo:
 * 1. Acessar https://www.tecconcursos.com.br/materias/
 * 2. Coletar lista de todas as matérias
 * 3. Para cada matéria, acessar sua página e extrair os assuntos
 * 4. Organizar em estrutura hierárquica
 * 5. Retornar como Markdown ou JSON
 */

import puppeteerExtra from 'puppeteer-extra';
import puppeteerVanilla, { Browser, Page } from 'puppeteer';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configurar puppeteer-extra com plugins
const puppeteer = (puppeteerExtra as any).default || puppeteerExtra;

// Adicionar plugin stealth para evitar detecção
const stealthPlugin = (StealthPlugin as any).default ? (StealthPlugin as any).default() : (StealthPlugin as any)();
puppeteer.use(stealthPlugin);

// ==================== CONFIGURAÇÕES ====================

const CONFIG = {
  baseUrl: 'https://www.tecconcursos.com.br',
  materiasUrl: 'https://www.tecconcursos.com.br/materias',
  delays: {
    afterPageLoad: 3000,
    betweenPages: 2000,
    afterExpand: 1500,
    randomExtra: () => Math.floor(Math.random() * 1000),
  },
};

// ==================== INTERFACES ====================

export interface AssuntoNode {
  id: string;
  nome: string;
  href?: string;
  nivel: number;
  filhos: AssuntoNode[];
}

export interface MateriaInfo {
  nome: string;
  slug: string;
  href: string;
  assuntos: AssuntoNode[];
}

export interface TaxonomiaResult {
  success: boolean;
  materias?: MateriaInfo[];
  markdown?: string;
  error?: string;
}

export interface TaxonomiaMateriaResult {
  success: boolean;
  materia?: MateriaInfo;
  markdown?: string;
  error?: string;
}

// ==================== ESTADO GLOBAL ====================

let _browser: Browser | null = null;
let _page: Page | null = null;
let _isRunning = false;

// ==================== SUPABASE CLIENT ====================

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// ==================== BROWSER HELPERS ====================

async function initBrowser(): Promise<Browser> {
  if (_browser) return _browser;

  console.log('[TaxonomyScraper] Iniciando browser...');

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920x1080',
    ],
  });

  _browser = browser;
  return browser;
}

async function getPage(): Promise<Page> {
  if (_page) return _page;

  const browser = await initBrowser();
  _page = await browser.newPage();

  // Configurar viewport e user agent
  await _page.setViewport({ width: 1920, height: 1080 });
  await _page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  // Carregar cookies de uma conta ativa do banco de dados
  try {
    const supabase = getSupabase();
    const { data: account } = await supabase
      .from('tec_accounts')
      .select('cookies')
      .eq('is_active', true)
      .eq('login_status', 'valid')
      .limit(1)
      .single();

    if (account?.cookies) {
      console.log('[TaxonomyScraper] Carregando cookies da conta ativa...');
      const cookies = Array.isArray(account.cookies) ? account.cookies : [];
      if (cookies.length > 0) {
        await _page.setCookie(...cookies);
        console.log(`[TaxonomyScraper] ${cookies.length} cookies carregados`);
      }
    } else {
      console.log('[TaxonomyScraper] AVISO: Nenhuma conta ativa com cookies válidos encontrada');
    }
  } catch (err) {
    console.log('[TaxonomyScraper] Erro ao carregar cookies:', err);
  }

  return _page;
}

async function closeBrowser(): Promise<void> {
  if (_browser) {
    await _browser.close();
    _browser = null;
    _page = null;
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== FUNÇÕES DE SCRAPING ====================

/**
 * Lista todas as matérias disponíveis na página principal
 */
async function listarMaterias(): Promise<{ nome: string; slug: string; href: string }[]> {
  console.log('[TaxonomyScraper] Listando matérias...');

  const page = await getPage();

  await page.goto(CONFIG.materiasUrl, { waitUntil: 'networkidle2', timeout: 60000 });
  await delay(CONFIG.delays.afterPageLoad);

  // Extrair todas as matérias da página
  const materias = await page.evaluate(() => {
    const links = document.querySelectorAll('a.materia-href, a[href*="/materias/"]');
    const result: { nome: string; slug: string; href: string }[] = [];

    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && href.includes('/materias/') && !href.includes('/aulas/')) {
        const nome = link.textContent?.trim() || '';
        const slugMatch = href.match(/\/materias\/([^\/]+)/);
        const slug = slugMatch ? slugMatch[1] : '';

        if (nome && slug && !result.find(m => m.slug === slug)) {
          result.push({
            nome,
            slug,
            href: href.startsWith('http') ? href : `https://www.tecconcursos.com.br${href}`,
          });
        }
      }
    });

    return result;
  });

  console.log(`[TaxonomyScraper] ${materias.length} matérias encontradas`);
  return materias;
}

/**
 * Extrai a estrutura de assuntos de uma página de matéria
 */
async function extrairAssuntosDeMateria(materiaUrl: string): Promise<AssuntoNode[]> {
  console.log(`[TaxonomyScraper] Extraindo assuntos de: ${materiaUrl}`);

  const page = await getPage();

  console.log('[TaxonomyScraper] Navegando para a página...');
  await page.goto(materiaUrl, { waitUntil: 'networkidle2', timeout: 60000 });
  console.log('[TaxonomyScraper] Página carregada');

  // Log do título da página para debug
  const pageTitle = await page.title();
  console.log(`[TaxonomyScraper] Título da página: ${pageTitle}`);

  // Verificar se fomos redirecionados para login
  const currentUrl = page.url();
  if (currentUrl.includes('/login') || currentUrl.includes('/entrar')) {
    console.log('[TaxonomyScraper] ERRO: Redirecionado para página de login - cookies inválidos');
    return [];
  }

  await delay(CONFIG.delays.afterPageLoad);

  // Aguardar o container de assuntos carregar
  try {
    console.log('[TaxonomyScraper] Aguardando container de assuntos...');
    await page.waitForSelector('#materia-assuntos, .assuntos-container, .subassunto', { timeout: 10000 });
    console.log('[TaxonomyScraper] Container encontrado');
  } catch (e) {
    console.log('[TaxonomyScraper] Container de assuntos não encontrado, tentando estrutura alternativa...');

    // Log do HTML para debug
    const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 2000));
    console.log('[TaxonomyScraper] HTML parcial:', bodyHTML.substring(0, 500));
  }

  // Expandir todos os itens expandíveis
  await expandirTodosItens(page);

  // Extrair estrutura hierárquica
  const assuntos = await page.evaluate(() => {
    const result: any[] = [];

    // Função recursiva para extrair assuntos aninhados
    function extrairFilhos(container: Element, nivel: number): any[] {
      const filhos: any[] = [];

      // Buscar elementos de assunto no container
      const assuntoElements = container.querySelectorAll(':scope > .subassunto, :scope > div > .subassunto');

      assuntoElements.forEach((el) => {
        const tituloEl = el.querySelector('.subassunto-titulo');
        if (!tituloEl) return;

        const linkEl = tituloEl.querySelector('a.subassunto-nome');
        const iconeEl = tituloEl.querySelector('.icone-arvore');

        const id = iconeEl?.id || linkEl?.getAttribute('href')?.match(/assuntos\/(\d+)/)?.[1] || '';
        const nome = linkEl?.textContent?.trim() || tituloEl.textContent?.trim() || '';
        const href = linkEl?.getAttribute('href') || '';

        if (!nome) return;

        // Buscar filhos aninhados
        const filhosContainer = el.querySelector('.assuntos-filhos, .subassuntos');
        const filhosNested = filhosContainer ? extrairFilhos(filhosContainer, nivel + 1) : [];

        filhos.push({
          id,
          nome,
          href: href.startsWith('http') ? href : (href ? `https://www.tecconcursos.com.br${href}` : ''),
          nivel,
          filhos: filhosNested,
        });
      });

      return filhos;
    }

    // Buscar container principal de assuntos
    const mainContainer = document.querySelector('#materia-assuntos') ||
                          document.querySelector('.assuntos-container') ||
                          document.body;

    // Extrair todos os assuntos de nível 1
    const assuntosNivel1 = mainContainer.querySelectorAll('.subassunto');

    assuntosNivel1.forEach((el) => {
      // Verificar se é um assunto de nível 1 (não está dentro de outro subassunto)
      const parentSubassunto = el.parentElement?.closest('.subassunto');
      if (parentSubassunto && mainContainer.contains(parentSubassunto)) return;

      const tituloEl = el.querySelector('.subassunto-titulo');
      if (!tituloEl) return;

      const linkEl = tituloEl.querySelector('a.subassunto-nome');
      const iconeEl = tituloEl.querySelector('.icone-arvore');

      const id = iconeEl?.id || linkEl?.getAttribute('href')?.match(/assuntos\/(\d+)/)?.[1] || '';
      const nome = linkEl?.textContent?.trim() || tituloEl.textContent?.trim() || '';
      const href = linkEl?.getAttribute('href') || '';

      if (!nome) return;

      // Buscar filhos
      const filhosContainer = el.querySelector('.assuntos-filhos, .subassuntos');
      const filhos = filhosContainer ? extrairFilhos(filhosContainer, 2) : [];

      result.push({
        id,
        nome,
        href: href.startsWith('http') ? href : (href ? `https://www.tecconcursos.com.br${href}` : ''),
        nivel: 1,
        filhos,
      });
    });

    return result;
  });

  console.log(`[TaxonomyScraper] ${assuntos.length} assuntos de nível 1 encontrados`);
  return assuntos;
}

/**
 * Expande todos os itens expandíveis na página
 */
async function expandirTodosItens(page: Page): Promise<void> {
  let expandidos = 0;
  let tentativas = 0;
  const maxTentativas = 20;

  while (tentativas < maxTentativas) {
    const iconesExpandir = await page.$$('.icone-arvore.expandir:not(.expandido)');

    if (iconesExpandir.length === 0) break;

    for (const icone of iconesExpandir) {
      try {
        await icone.click();
        expandidos++;
        await delay(500 + CONFIG.delays.randomExtra());
      } catch (e) {
        // Ignorar erros de clique (elemento pode não estar visível)
      }
    }

    await delay(CONFIG.delays.afterExpand);
    tentativas++;
  }

  console.log(`[TaxonomyScraper] ${expandidos} itens expandidos`);
}

// ==================== FORMATAÇÃO ====================

/**
 * Converte a estrutura de assuntos para Markdown
 */
function assuntosParaMarkdown(assuntos: AssuntoNode[], prefixo: string = ''): string {
  let markdown = '';

  assuntos.forEach((assunto, index) => {
    const numero = prefixo ? `${prefixo}.${index + 1}` : `${index + 1}`;

    if (assunto.nivel === 1) {
      // Nível 1: Título principal
      markdown += `\n# ${numero} ${assunto.nome}\n`;

      if (assunto.filhos.length === 0) {
        markdown += '\n---\n';
      }
    } else if (assunto.nivel === 2) {
      // Nível 2: Item em negrito
      markdown += `\n* **${numero}** ${assunto.nome}`;
    } else {
      // Nível 3+: Sub-item com indentação
      const indent = '    '.repeat(assunto.nivel - 2);
      markdown += `\n${indent}* **${numero}** ${assunto.nome}`;
    }

    // Processar filhos recursivamente
    if (assunto.filhos.length > 0) {
      markdown += assuntosParaMarkdown(assunto.filhos, numero);
    }

    // Adicionar separador após cada seção de nível 1
    if (assunto.nivel === 1 && assunto.filhos.length > 0) {
      markdown += '\n\n---\n';
    }
  });

  return markdown;
}

/**
 * Converte uma matéria completa para Markdown
 */
function materiaParaMarkdown(materia: MateriaInfo): string {
  let markdown = `# ${materia.nome}\n\n`;
  markdown += `*Fonte: ${materia.href}*\n`;
  markdown += assuntosParaMarkdown(materia.assuntos);
  return markdown;
}

// ==================== FUNÇÕES PÚBLICAS ====================

/**
 * Coleta a taxonomia de uma única matéria
 */
export async function coletarTaxonomiaMateria(
  materiaSlugOuUrl: string
): Promise<TaxonomiaMateriaResult> {
  if (_isRunning) {
    return { success: false, error: 'Uma coleta já está em andamento' };
  }

  _isRunning = true;

  try {
    // Determinar URL da matéria
    let materiaUrl: string;
    let materiaSlug: string;

    if (materiaSlugOuUrl.startsWith('http')) {
      materiaUrl = materiaSlugOuUrl;
      const match = materiaSlugOuUrl.match(/\/materias\/([^\/]+)/);
      materiaSlug = match ? match[1] : materiaSlugOuUrl;
    } else {
      materiaSlug = materiaSlugOuUrl;
      materiaUrl = `${CONFIG.materiasUrl}/${materiaSlugOuUrl}`;
    }

    console.log(`[TaxonomyScraper] Coletando taxonomia de: ${materiaSlug}`);

    // Extrair assuntos
    const assuntos = await extrairAssuntosDeMateria(materiaUrl);

    // Buscar nome completo da matéria na página
    const page = await getPage();
    const nomeMateria = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1?.textContent?.trim() || '';
    });

    const materia: MateriaInfo = {
      nome: nomeMateria || materiaSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      slug: materiaSlug,
      href: materiaUrl,
      assuntos,
    };

    const markdown = materiaParaMarkdown(materia);

    await closeBrowser();
    _isRunning = false;

    return {
      success: true,
      materia,
      markdown,
    };
  } catch (error) {
    await closeBrowser();
    _isRunning = false;

    console.error('[TaxonomyScraper] Erro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Coleta a taxonomia de todas as matérias
 */
export async function coletarTaxonomiaCompleta(): Promise<TaxonomiaResult> {
  if (_isRunning) {
    return { success: false, error: 'Uma coleta já está em andamento' };
  }

  _isRunning = true;

  try {
    // Listar todas as matérias
    const materiasInfo = await listarMaterias();

    const materias: MateriaInfo[] = [];
    let markdown = '# Taxonomia Completa - TecConcursos\n\n';
    markdown += `*${materiasInfo.length} matérias encontradas*\n\n`;
    markdown += '---\n\n';

    // Processar cada matéria
    for (let i = 0; i < materiasInfo.length; i++) {
      const info = materiasInfo[i];
      console.log(`[TaxonomyScraper] Processando ${i + 1}/${materiasInfo.length}: ${info.nome}`);

      try {
        const assuntos = await extrairAssuntosDeMateria(info.href);

        const materia: MateriaInfo = {
          ...info,
          assuntos,
        };

        materias.push(materia);

        // Adicionar ao Markdown
        markdown += `\n\n# ${info.nome}\n`;
        markdown += `*Fonte: ${info.href}*\n`;
        markdown += assuntosParaMarkdown(assuntos);
        markdown += '\n\n---\n';

        // Delay entre matérias
        await delay(CONFIG.delays.betweenPages + CONFIG.delays.randomExtra());
      } catch (error) {
        console.error(`[TaxonomyScraper] Erro ao processar ${info.nome}:`, error);
        markdown += `\n\n# ${info.nome}\n*Erro ao coletar: ${error instanceof Error ? error.message : 'Erro desconhecido'}*\n\n---\n`;
      }
    }

    await closeBrowser();
    _isRunning = false;

    return {
      success: true,
      materias,
      markdown,
    };
  } catch (error) {
    await closeBrowser();
    _isRunning = false;

    console.error('[TaxonomyScraper] Erro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Lista apenas os nomes das matérias disponíveis
 */
export async function listarNomesMaterias(): Promise<{ success: boolean; materias?: { nome: string; slug: string; href: string }[]; error?: string }> {
  if (_isRunning) {
    return { success: false, error: 'Uma coleta já está em andamento' };
  }

  _isRunning = true;

  try {
    const materias = await listarMaterias();
    await closeBrowser();
    _isRunning = false;

    return { success: true, materias };
  } catch (error) {
    await closeBrowser();
    _isRunning = false;

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Salva a taxonomia coletada no banco de dados
 */
export async function salvarTaxonomiaNoDb(materia: MateriaInfo): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabase();

    // Função recursiva para achatar a estrutura
    const flattenAssuntos = (assuntos: AssuntoNode[], materiaSlug: string, parentId: string | null = null): any[] => {
      const result: any[] = [];

      assuntos.forEach((assunto, index) => {
        const record = {
          tec_id: assunto.id,
          nome: assunto.nome,
          href: assunto.href,
          nivel: assunto.nivel,
          ordem: index + 1,
          materia_slug: materiaSlug,
          parent_tec_id: parentId,
        };

        result.push(record);

        if (assunto.filhos.length > 0) {
          result.push(...flattenAssuntos(assunto.filhos, materiaSlug, assunto.id));
        }
      });

      return result;
    };

    // Salvar matéria
    const { error: materiaError } = await supabase
      .from('tec_materias')
      .upsert({
        slug: materia.slug,
        nome: materia.nome,
        href: materia.href,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'slug' });

    if (materiaError) {
      console.error('[TaxonomyScraper] Erro ao salvar matéria:', materiaError);
      return { success: false, error: materiaError.message };
    }

    // Salvar assuntos
    const assuntosFlat = flattenAssuntos(materia.assuntos, materia.slug);

    for (const assunto of assuntosFlat) {
      const { error: assuntoError } = await supabase
        .from('tec_assuntos')
        .upsert(assunto, { onConflict: 'tec_id' });

      if (assuntoError) {
        console.error('[TaxonomyScraper] Erro ao salvar assunto:', assuntoError);
      }
    }

    console.log(`[TaxonomyScraper] Salvos ${assuntosFlat.length} assuntos para ${materia.nome}`);
    return { success: true };
  } catch (error) {
    console.error('[TaxonomyScraper] Erro ao salvar no DB:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Verifica se uma coleta está em andamento
 */
export function isRunning(): boolean {
  return _isRunning;
}

/**
 * Força parada da coleta
 */
export async function parar(): Promise<void> {
  await closeBrowser();
  _isRunning = false;
}

export default {
  coletarTaxonomiaMateria,
  coletarTaxonomiaCompleta,
  listarNomesMaterias,
  salvarTaxonomiaNoDb,
  isRunning,
  parar,
};
