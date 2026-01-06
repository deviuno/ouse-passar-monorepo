// Estado global do scraper
let scrapeState = {
  isRunning: false,
  currentPage: 1,
  materias: [],
  currentMateriaIndex: 0,
  results: [],
  errors: [],
  tabId: null
};

// URL do Mastra
const MASTRA_URL = 'http://localhost:4000';

// Abrir side panel ao clicar no icone
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Listeners de mensagens
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getState') {
    sendResponse(scrapeState);
    return true;
  }

  if (message.action === 'startScraping') {
    startScraping(message.tabId);
    sendResponse({ started: true });
    return true;
  }

  if (message.action === 'stopScraping') {
    scrapeState.isRunning = false;
    sendResponse({ stopped: true });
    return true;
  }

  if (message.action === 'downloadResults') {
    sendResponse({ results: scrapeState.results });
    return true;
  }

  if (message.action === 'clearResults') {
    scrapeState.results = [];
    scrapeState.errors = [];
    sendResponse({ cleared: true });
    return true;
  }
});

// Funcao principal de scraping
async function startScraping(tabId) {
  scrapeState.isRunning = true;
  scrapeState.tabId = tabId;
  scrapeState.currentPage = 1;
  scrapeState.materias = [];
  scrapeState.currentMateriaIndex = 0;

  try {
    // Navegar para a pagina de materias
    await chrome.tabs.update(tabId, { url: 'https://www.tecconcursos.com.br/materias' });
    await waitForPageLoad(tabId);
    await delay(1500);

    // Loop pelas paginas
    while (scrapeState.isRunning) {
      // Extrair lista de materias da pagina atual
      const materias = await extractMateriasFromPage(tabId);

      if (materias.length === 0) {
        console.log('Nenhuma materia encontrada na pagina');
        break;
      }

      scrapeState.materias = materias;
      scrapeState.currentMateriaIndex = 0;

      // Processar cada materia
      for (let i = 0; i < materias.length && scrapeState.isRunning; i++) {
        scrapeState.currentMateriaIndex = i;
        const materia = materias[i];

        try {
          console.log(`Processando: ${materia.nome}`);
          await chrome.tabs.update(tabId, { url: materia.href });
          await waitForPageLoad(tabId);
          await delay(1000);

          // Capturar HTML e enviar para IA
          const taxonomy = await extractTaxonomy(tabId, materia.nome);

          if (taxonomy.success) {
            scrapeState.results.push({
              materia: materia.nome,
              slug: materia.slug,
              markdown: taxonomy.markdown,
              assuntosCount: taxonomy.assuntosCount
            });
            console.log(`OK: ${materia.nome} - ${taxonomy.assuntosCount} assuntos`);
          } else {
            scrapeState.errors.push({ materia: materia.nome, error: taxonomy.error });
            console.log(`ERRO: ${materia.nome} - ${taxonomy.error}`);
          }

        } catch (err) {
          scrapeState.errors.push({ materia: materia.nome, error: err.message });
          console.log(`ERRO: ${materia.nome} - ${err.message}`);
        }

        await delay(500);
      }

      // Tentar ir para proxima pagina
      await chrome.tabs.update(tabId, { url: 'https://www.tecconcursos.com.br/materias' });
      await waitForPageLoad(tabId);
      await delay(1500);

      const hasNextPage = await goToNextPage(tabId, scrapeState.currentPage);
      if (!hasNextPage) {
        console.log('Ultima pagina alcancada');
        break;
      }

      scrapeState.currentPage++;
      await delay(1500);
    }

  } catch (err) {
    console.error('Erro no scraping:', err);
  }

  scrapeState.isRunning = false;
  console.log(`Scraping finalizado: ${scrapeState.results.length} materias extraidas`);
}

// Funcoes auxiliares
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForPageLoad(tabId) {
  return new Promise((resolve) => {
    function listener(changedTabId, changeInfo) {
      if (changedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function extractMateriasFromPage(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const links = document.querySelectorAll('a[href*="/materias/"]');
      const materias = [];

      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes('/materias/') && !href.includes('/aulas/') && !href.endsWith('/materias')) {
          const nome = link.textContent?.trim() || '';
          const slugMatch = href.match(/\/materias\/([^\/]+)/);
          const slug = slugMatch ? slugMatch[1] : '';

          if (nome && slug && !materias.find(m => m.slug === slug)) {
            materias.push({
              nome,
              slug,
              href: href.startsWith('http') ? href : `https://www.tecconcursos.com.br${href}`
            });
          }
        }
      });

      return materias;
    }
  });

  return results[0]?.result || [];
}

async function extractTaxonomy(tabId, materiaName) {
  // Capturar HTML da pagina
  const htmlResults = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const container = document.querySelector('#materia-assuntos');
      if (!container) {
        return { success: false, error: 'Container #materia-assuntos nao encontrado' };
      }
      return {
        success: true,
        html: container.outerHTML,
        url: window.location.href
      };
    }
  });

  const htmlResult = htmlResults[0]?.result;
  if (!htmlResult?.success) {
    return htmlResult || { success: false, error: 'Falha ao capturar HTML' };
  }

  console.log(`Enviando HTML para Mastra (${htmlResult.html.length} chars)`);

  // Enviar para o Mastra processar com IA
  try {
    const response = await fetch(`${MASTRA_URL}/api/tec-scraper/taxonomia/extract-from-html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: htmlResult.html,
        materiaName: materiaName,
        url: htmlResult.url
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.error || `Erro HTTP ${response.status}` };
    }

    const data = await response.json();
    return {
      success: data.success,
      markdown: data.markdown,
      assuntosCount: data.assuntosCount || 0,
      error: data.error
    };
  } catch (err) {
    console.error('Erro ao chamar Mastra:', err);
    return { success: false, error: `Erro de conexao: ${err.message}` };
  }
}

async function goToNextPage(tabId, currentPage) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: (currentPage) => {
      const nextLinks = document.querySelectorAll('a[href*="page="], .pagination a, .paginacao a');
      for (const link of nextLinks) {
        const href = link.getAttribute('href') || '';
        const pageMatch = href.match(/page=(\d+)/);
        if (pageMatch && parseInt(pageMatch[1]) === currentPage + 1) {
          link.click();
          return true;
        }
      }

      const nextBtn = document.querySelector('.next a, .proxima a, [rel="next"]');
      if (nextBtn) {
        nextBtn.click();
        return true;
      }

      return false;
    },
    args: [currentPage]
  });

  return results[0]?.result || false;
}
