/**
 * Human Behavior Simulation Module
 *
 * Simula comportamento humano para evitar detecção de bot durante web scraping.
 * Baseado nas técnicas do scraper Python (packages/scraper-py/tecconcursosv3_FINAL.py)
 */

import { Page } from 'puppeteer';

// ============================================================================
// CONFIGURAÇÃO DE DELAYS
// ============================================================================

export const DELAY_RANGES: Record<string, [number, number]> = {
  page_load: [2000, 4500],
  click: [1000, 2500],
  quick_skip: [800, 1500],
  typing: [100, 300],
  comment_open: [1500, 3000],
  details_open: [1500, 3000],
  duplicate_recognition: [800, 2000],
  duplicate_scroll: [300, 800],
  duplicate_skip_decision: [500, 1200],
  duplicate_click: [300, 700],
  between_questions: [1500, 2500],
  pause_break: [2000, 4000],
};

export type DelayType = keyof typeof DELAY_RANGES;

// ============================================================================
// COMPORTAMENTOS DE SKIP PARA DUPLICATAS
// ============================================================================

export const SKIP_BEHAVIORS = {
  quick_skip: 0.60,       // 60% - Reconhece rapidamente e pula
  scroll_then_skip: 0.25, // 25% - Dá uma olhada rápida antes de pular
  hesitate_skip: 0.15,    // 15% - Hesita um pouco antes de pular
};

export type SkipBehavior = keyof typeof SKIP_BEHAVIORS;

// ============================================================================
// USER AGENTS ROTATIVOS
// ============================================================================

export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Gera um número aleatório com distribuição Gaussiana (mais natural que uniforme)
 * Valores tendem a se concentrar no meio do range
 */
export function gaussianRandom(min: number, max: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();

  // Box-Muller transform
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

  // Normalizar para range 0-1 (aproximadamente)
  num = (num + 3) / 6;

  // Clampar para garantir que está no range
  num = Math.max(0, Math.min(1, num));

  return min + num * (max - min);
}

/**
 * Delay simples (para uso interno)
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// FUNÇÕES DE HUMANIZAÇÃO
// ============================================================================

/**
 * Aplica um delay humanizado baseado no tipo de ação
 * Retorna o tempo em ms que foi aguardado
 */
export async function humanDelay(type: DelayType): Promise<number> {
  const range = DELAY_RANGES[type];
  if (!range) {
    console.warn(`[HumanBehavior] Tipo de delay desconhecido: ${type}, usando padrão`);
    return humanDelay('click');
  }

  const [min, max] = range;
  const delayMs = gaussianRandom(min, max);

  await sleep(delayMs);

  return delayMs;
}

/**
 * Delay com range customizado
 */
export async function humanDelayCustom(min: number, max: number): Promise<number> {
  const delayMs = gaussianRandom(min, max);
  await sleep(delayMs);
  return delayMs;
}

/**
 * Retorna um user agent aleatório da lista
 */
export function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Simula movimento do mouse em uma curva Bezier até o alvo
 * Mais natural que movimento linear direto
 */
export async function simulateMouseMovement(
  page: Page,
  targetX: number,
  targetY: number
): Promise<void> {
  try {
    const mouse = page.mouse;

    // Obter posição atual aproximada (centro da viewport)
    const viewport = page.viewport();
    const startX = viewport ? viewport.width / 2 : 960;
    const startY = viewport ? viewport.height / 2 : 540;

    // Número de passos variável (10-20)
    const steps = 10 + Math.floor(Math.random() * 10);

    // Ponto de controle para curva Bezier (adiciona curvatura)
    const controlX = (startX + targetX) / 2 + (Math.random() - 0.5) * 100;
    const controlY = (startY + targetY) / 2 + (Math.random() - 0.5) * 100;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;

      // Curva Bezier quadrática
      const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * targetX;
      const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * targetY;

      await mouse.move(x, y);

      // Delay variável entre movimentos (10-30ms)
      await sleep(10 + Math.random() * 20);
    }
  } catch (error) {
    // Silenciosamente falha - movimento de mouse é opcional
    console.debug('[HumanBehavior] Erro no movimento de mouse:', error);
  }
}

/**
 * Simula scroll de leitura natural
 * @param quick - Se true, scroll mais rápido (para skips)
 */
export async function simulateReadingScroll(
  page: Page,
  quick: boolean = false
): Promise<void> {
  try {
    // Quantidade de scroll
    const scrollAmount = quick
      ? 100 + Math.random() * 200  // 100-300px para scroll rápido
      : 200 + Math.random() * 300; // 200-500px para leitura normal

    // Número de incrementos (simula scroll suave)
    const increments = quick ? 2 : 2 + Math.floor(Math.random() * 3);
    const incrementSize = scrollAmount / increments;

    // Delay entre incrementos
    const incrementDelay = quick ? 50 : 100 + Math.random() * 150;

    for (let i = 0; i < increments; i++) {
      await page.evaluate((scroll) => {
        window.scrollBy(0, scroll);
      }, incrementSize);

      await sleep(incrementDelay);
    }

    // Às vezes volta um pouco (comportamento natural)
    if (!quick && Math.random() > 0.7) {
      await sleep(200 + Math.random() * 300);
      await page.evaluate((scroll) => {
        window.scrollBy(0, -scroll);
      }, 50 + Math.random() * 100);
    }
  } catch (error) {
    console.debug('[HumanBehavior] Erro no scroll:', error);
  }
}

/**
 * Escolhe um comportamento de skip baseado nas probabilidades configuradas
 */
export function chooseSkipBehavior(): SkipBehavior {
  const rand = Math.random();
  let cumulative = 0;

  for (const [behavior, probability] of Object.entries(SKIP_BEHAVIORS)) {
    cumulative += probability;
    if (rand <= cumulative) {
      return behavior as SkipBehavior;
    }
  }

  return 'quick_skip'; // Fallback
}

/**
 * Simula comportamento humano ao pular uma questão duplicada
 * Usa diferentes padrões para parecer mais natural
 */
export async function humanSkipDuplicate(
  page: Page,
  questionId: string,
  nextButtonSelector: string = 'button.questao-navegacao-botao-proxima'
): Promise<boolean> {
  const behavior = chooseSkipBehavior();

  console.debug(`[HumanBehavior] Pulando questão ${questionId} com comportamento: ${behavior}`);

  try {
    switch (behavior) {
      case 'quick_skip':
        // Reconhecimento rápido - delay curto e pula
        await humanDelay('duplicate_recognition');
        break;

      case 'scroll_then_skip':
        // Dá uma olhada rápida antes de pular
        await sleep(300 + Math.random() * 400);
        await simulateReadingScroll(page, true);
        await humanDelay('duplicate_scroll');
        // Volta ao topo
        await page.evaluate(() => window.scrollTo(0, 0));
        await sleep(200 + Math.random() * 300);
        break;

      case 'hesitate_skip':
        // Hesita antes de pular (como se estivesse confirmando)
        await humanDelay('duplicate_recognition');
        // Às vezes move o mouse sobre o enunciado
        if (Math.random() > 0.5) {
          const enunciado = await page.$('div.questao-enunciado-texto');
          if (enunciado) {
            const box = await enunciado.boundingBox();
            if (box) {
              await simulateMouseMovement(page, box.x + box.width / 2, box.y + 50);
            }
          }
        }
        await humanDelay('duplicate_skip_decision');
        break;
    }

    // Localizar botão próximo
    const nextBtn = await page.$(nextButtonSelector);

    if (!nextBtn) {
      console.debug('[HumanBehavior] Botão próximo não encontrado');
      return false;
    }

    // Às vezes move o mouse até o botão antes de clicar (60% das vezes)
    if (Math.random() > 0.4) {
      const box = await nextBtn.boundingBox();
      if (box) {
        await simulateMouseMovement(page, box.x + box.width / 2, box.y + box.height / 2);
      }
    }

    // Delay antes do clique
    await humanDelay('duplicate_click');

    // Clicar
    await nextBtn.click();

    // Aguardar carregamento
    await sleep(400 + Math.random() * 500);

    return true;
  } catch (error) {
    console.error('[HumanBehavior] Erro ao pular duplicata:', error);
    return false;
  }
}

/**
 * Simula digitação humana com delays variáveis entre teclas
 */
export async function humanType(
  page: Page,
  selector: string,
  text: string
): Promise<void> {
  const element = await page.$(selector);
  if (!element) {
    throw new Error(`Elemento não encontrado: ${selector}`);
  }

  // Limpar campo primeiro
  await element.click({ clickCount: 3 }); // Seleciona tudo
  await page.keyboard.press('Backspace');

  // Digitar caractere por caractere
  for (const char of text) {
    await page.keyboard.type(char, { delay: 0 });

    // Delay variável entre teclas (mais natural)
    const [min, max] = DELAY_RANGES.typing;
    await sleep(min + Math.random() * (max - min));
  }
}

/**
 * Detecta problemas de extração (Cloudflare, CAPTCHA, mudança de layout)
 */
export async function detectExtractionProblem(page: Page): Promise<'none' | 'cloudflare' | 'captcha' | 'layout_change' | 'loading_error'> {
  try {
    // 1. Verificar se elementos essenciais existem
    const essentialSelectors = [
      'div.questao-enunciado-texto',
      'button.questao-navegacao-botao-proxima'
    ];

    const missingElements: string[] = [];

    for (const selector of essentialSelectors) {
      const found = await page.$(selector);
      if (!found) {
        missingElements.push(selector);
      }
    }

    // Se todos os elementos estão presentes, não há problema
    if (missingElements.length === 0) {
      return 'none';
    }

    console.debug(`[HumanBehavior] Elementos ausentes: ${missingElements.join(', ')}`);

    // 2. Investigar a causa
    const bodyText = await page.evaluate(() => document.body.innerText || '');

    // Verificar Cloudflare
    const cloudflareIndicators = [
      'Checking your browser',
      'Just a moment',
      'Please wait',
      'cf-browser-verification',
      'challenge-platform',
      'Verificando seu navegador'
    ];

    for (const indicator of cloudflareIndicators) {
      if (bodyText.toLowerCase().includes(indicator.toLowerCase())) {
        console.debug(`[HumanBehavior] Cloudflare detectado: ${indicator}`);
        return 'cloudflare';
      }
    }

    // Verificar CAPTCHA visível
    const captchaSelectors = [
      'iframe[src*="recaptcha"]',
      'iframe[src*="captcha"]',
      '.g-recaptcha',
      '#captcha'
    ];

    for (const selector of captchaSelectors) {
      const captchaElement = await page.$(selector);
      if (captchaElement) {
        const isVisible = await captchaElement.isIntersectingViewport();
        if (isVisible) {
          console.debug(`[HumanBehavior] CAPTCHA detectado: ${selector}`);
          return 'captcha';
        }
      }
    }

    // Verificar erros de carregamento
    const errorKeywords = ['erro fatal', 'error 500', 'error 404', 'página não encontrada', 'not found'];
    for (const keyword of errorKeywords) {
      if (bodyText.toLowerCase().includes(keyword)) {
        console.debug(`[HumanBehavior] Erro de carregamento: ${keyword}`);
        return 'loading_error';
      }
    }

    // Se chegou aqui, é mudança de layout
    return 'layout_change';

  } catch (error) {
    console.error('[HumanBehavior] Erro ao detectar problema:', error);
    return 'none';
  }
}

/**
 * Aguarda com comportamento humanizado (usado para pausas periódicas)
 */
export async function humanPause(reason: string = 'periodic'): Promise<number> {
  const duration = await humanDelay('pause_break');
  console.debug(`[HumanBehavior] Pausa humanizada (${reason}): ${(duration / 1000).toFixed(1)}s`);
  return duration;
}

/**
 * Verifica se deve fazer uma pausa baseado no número de questões processadas
 */
export function shouldTakePause(
  questionsProcessed: number,
  pauseEveryN: number = 30
): boolean {
  return questionsProcessed > 0 && questionsProcessed % pauseEveryN === 0;
}
