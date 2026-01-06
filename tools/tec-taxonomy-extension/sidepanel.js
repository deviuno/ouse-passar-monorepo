let extractedMarkdown = '';
let updateInterval = null;

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
  });
});

function setStatus(message, type = 'info') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = type;
}

function showResult(markdown) {
  const result = document.getElementById('result');
  const preview = document.getElementById('preview');
  preview.textContent = markdown.substring(0, 3000) + (markdown.length > 3000 ? '\n\n... (truncado para preview)' : '');
  result.classList.add('show');

  document.getElementById('copyBtn').disabled = false;
  document.getElementById('downloadBtn').disabled = false;
}

// ============================================
// MODO AUTOMATICO
// ============================================

async function updateProgress() {
  try {
    const state = await chrome.runtime.sendMessage({ action: 'getState' });

    document.getElementById('currentPage').textContent = state.currentPage;
    document.getElementById('resultsCount').textContent = state.results.length;

    if (state.materias.length > 0) {
      const currentMateria = state.materias[state.currentMateriaIndex];
      document.getElementById('currentMateria').textContent = currentMateria?.nome?.substring(0, 25) || '-';
      document.getElementById('currentIndex').textContent = state.currentMateriaIndex + 1;
      document.getElementById('totalMaterias').textContent = state.materias.length;

      const progress = ((state.currentMateriaIndex + 1) / state.materias.length) * 100;
      document.getElementById('progressFill').style.width = `${progress}%`;
    }

    // Update buttons based on state
    document.getElementById('startAutoBtn').style.display = state.isRunning ? 'none' : 'block';
    document.getElementById('stopAutoBtn').style.display = state.isRunning ? 'block' : 'none';
    document.getElementById('downloadAllBtn').disabled = state.results.length === 0;
    document.getElementById('clearResultsBtn').disabled = state.results.length === 0 || state.isRunning;

    // Show progress section if running or has results
    const showProgress = state.isRunning || state.results.length > 0;
    document.getElementById('progressSection').style.display = showProgress ? 'block' : 'none';
    document.getElementById('resultsTitle').style.display = state.results.length > 0 ? 'block' : 'none';

    // Update results list
    updateResultsList(state.results);

    // Update errors list
    updateErrorsList(state.errors);

    if (!state.isRunning && updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
      if (state.results.length > 0) {
        setStatus(`Finalizado! ${state.results.length} materias extraidas.`, 'success');
      }
    }
  } catch (err) {
    console.error('Erro ao atualizar progresso:', err);
  }
}

function updateResultsList(results) {
  const listEl = document.getElementById('resultsList');
  if (results.length === 0) {
    listEl.style.display = 'none';
    return;
  }

  listEl.style.display = 'block';
  listEl.innerHTML = results.map(r => `
    <div class="result-item">
      <div class="name">${r.materia}</div>
      <div class="count">${r.assuntosCount} assuntos</div>
    </div>
  `).join('');
}

function updateErrorsList(errors) {
  const errorsSection = document.getElementById('errorsSection');
  const errorsList = document.getElementById('errorsList');

  if (!errors || errors.length === 0) {
    errorsSection.classList.remove('show');
    return;
  }

  errorsSection.classList.add('show');
  errorsList.innerHTML = errors.slice(-10).map(e => `
    <div class="error-item">
      <strong>${e.materia}:</strong> ${e.error}
    </div>
  `).join('');
}

// Iniciar extracao automatica
document.getElementById('startAutoBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  setStatus('Iniciando extracao automatica...', 'info');
  document.getElementById('progressSection').style.display = 'block';

  try {
    await chrome.runtime.sendMessage({ action: 'startScraping', tabId: tab.id });

    document.getElementById('startAutoBtn').style.display = 'none';
    document.getElementById('stopAutoBtn').style.display = 'block';

    // Start progress updates
    updateInterval = setInterval(updateProgress, 1000);
    updateProgress();

    setStatus('Extracao em andamento...', 'info');
  } catch (err) {
    setStatus('Erro ao iniciar: ' + err.message, 'error');
  }
});

// Parar extracao
document.getElementById('stopAutoBtn').addEventListener('click', async () => {
  try {
    await chrome.runtime.sendMessage({ action: 'stopScraping' });
    setStatus('Parando...', 'info');
  } catch (err) {
    setStatus('Erro ao parar: ' + err.message, 'error');
  }
});

// Download todos
document.getElementById('downloadAllBtn').addEventListener('click', async () => {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'downloadResults' });
    const results = response.results;

    if (!results || results.length === 0) {
      setStatus('Nenhum resultado para baixar', 'error');
      return;
    }

    // Create a combined markdown file
    let combined = '# TecConcursos - Taxonomia Completa\n\n';
    combined += `*Extraido em: ${new Date().toLocaleString('pt-BR')}*\n\n`;
    combined += `*Total: ${results.length} materias*\n\n`;
    combined += '---\n\n';

    results.forEach(r => {
      combined += r.markdown + '\n\n';
    });

    const blob = new Blob([combined], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `tec-taxonomia-completa-${Date.now()}.md`;
    a.click();

    URL.revokeObjectURL(url);
    setStatus('Arquivo baixado!', 'success');
  } catch (err) {
    setStatus('Erro ao baixar: ' + err.message, 'error');
  }
});

// Limpar resultados
document.getElementById('clearResultsBtn').addEventListener('click', async () => {
  try {
    await chrome.runtime.sendMessage({ action: 'clearResults' });
    updateProgress();
    setStatus('Resultados limpos', 'success');
  } catch (err) {
    setStatus('Erro ao limpar: ' + err.message, 'error');
  }
});

// ============================================
// MODO MANUAL
// ============================================

const MASTRA_URL = 'http://localhost:4000';

// Extrair taxonomia (modo manual)
document.getElementById('extractBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url.includes('tecconcursos.com.br/materias/')) {
    setStatus('Navegue para uma pagina de materia primeiro!', 'error');
    return;
  }

  setStatus('Capturando HTML...', 'info');

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const container = document.querySelector('#materia-assuntos');
      const title = document.querySelector('h1')?.textContent?.trim() || 'Materia';

      if (!container) {
        return { success: false, error: 'Container #materia-assuntos nao encontrado' };
      }

      return {
        success: true,
        html: container.outerHTML,
        materiaName: title,
        url: window.location.href
      };
    }
  }, async (results) => {
    if (chrome.runtime.lastError) {
      setStatus('Erro: ' + chrome.runtime.lastError.message, 'error');
      return;
    }

    const captureResult = results[0]?.result;
    if (!captureResult?.success) {
      setStatus(captureResult?.error || 'Erro ao capturar HTML', 'error');
      return;
    }

    setStatus('Processando com IA...', 'info');

    try {
      const response = await fetch(`${MASTRA_URL}/api/tec-scraper/taxonomia/extract-from-html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: captureResult.html,
          materiaName: captureResult.materiaName,
          url: captureResult.url
        })
      });

      const data = await response.json();

      if (data.success) {
        extractedMarkdown = data.markdown;
        setStatus(`Extraido! ${data.assuntosCount} assuntos encontrados.`, 'success');
        showResult(extractedMarkdown);
      } else {
        setStatus(data.error || 'Erro ao extrair taxonomia', 'error');
      }
    } catch (err) {
      setStatus('Erro de conexao com Mastra: ' + err.message, 'error');
    }
  });
});

// Copiar para clipboard
document.getElementById('copyBtn').addEventListener('click', async () => {
  if (!extractedMarkdown) return;

  try {
    await navigator.clipboard.writeText(extractedMarkdown);
    setStatus('Copiado para a area de transferencia!', 'success');
  } catch (err) {
    setStatus('Erro ao copiar: ' + err.message, 'error');
  }
});

// Baixar como arquivo
document.getElementById('downloadBtn').addEventListener('click', async () => {
  if (!extractedMarkdown) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const slugMatch = tab.url.match(/\/materias\/([^\/]+)/);
  const slug = slugMatch ? slugMatch[1] : 'taxonomia';

  const blob = new Blob([extractedMarkdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `taxonomia-${slug}.md`;
  a.click();

  URL.revokeObjectURL(url);
  setStatus('Arquivo baixado!', 'success');
});

// Initialize - check current state
updateProgress();

// Keep updating if already running
setInterval(async () => {
  try {
    const state = await chrome.runtime.sendMessage({ action: 'getState' });
    if (state.isRunning && !updateInterval) {
      updateInterval = setInterval(updateProgress, 1000);
    }
  } catch (e) {}
}, 2000);
