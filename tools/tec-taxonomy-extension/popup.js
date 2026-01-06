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
  preview.textContent = markdown.substring(0, 2000) + (markdown.length > 2000 ? '\n\n... (truncado para preview)' : '');
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
      document.getElementById('currentMateria').textContent = currentMateria?.nome?.substring(0, 30) || '-';
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
    document.getElementById('progressSection').style.display =
      (state.isRunning || state.results.length > 0) ? 'block' : 'none';

    // Update results list
    updateResultsList(state.results);

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

// Download todos como ZIP
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

// Expandir todos os itens
document.getElementById('expandBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url.includes('tecconcursos.com.br/materias/')) {
    setStatus('Navegue para uma pagina de materia primeiro!', 'error');
    return;
  }

  setStatus('Expandindo itens...', 'info');

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const expandButtons = document.querySelectorAll('.icone-arvore.expandir:not(.expandido)');
      expandButtons.forEach((btn, i) => {
        setTimeout(() => btn.click(), i * 200);
      });
      return expandButtons.length;
    }
  }, (results) => {
    if (chrome.runtime.lastError) {
      setStatus('Erro: ' + chrome.runtime.lastError.message, 'error');
      return;
    }
    const count = results[0]?.result || 0;
    setStatus(`${count} itens expandidos. Aguarde carregar e clique em Extrair.`, 'success');
  });
});

// Extrair taxonomia
document.getElementById('extractBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab.url.includes('tecconcursos.com.br/materias/')) {
    setStatus('Navegue para uma pagina de materia primeiro!', 'error');
    return;
  }

  setStatus('Extraindo taxonomia...', 'info');

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: extractTaxonomy
  }, (results) => {
    if (chrome.runtime.lastError) {
      setStatus('Erro: ' + chrome.runtime.lastError.message, 'error');
      return;
    }

    const result = results[0]?.result;
    if (result && result.success) {
      extractedMarkdown = result.markdown;
      setStatus(`Extraido! ${result.assuntosCount} assuntos encontrados.`, 'success');
      showResult(extractedMarkdown);
    } else {
      setStatus(result?.error || 'Erro ao extrair taxonomia', 'error');
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

// Funcao que sera injetada na pagina
function extractTaxonomy() {
  try {
    const materiaTitle = document.querySelector('h1')?.textContent?.trim() || 'Materia';

    // Funcao para extrair assuntos recursivamente
    function extractAssuntos(container, level = 1) {
      const assuntos = [];

      // Buscar elementos .subassunto diretos
      const subassuntos = container.querySelectorAll(':scope > .subassunto, :scope > div > .subassunto');

      subassuntos.forEach((el) => {
        const tituloEl = el.querySelector(':scope > .subassunto-titulo');
        if (!tituloEl) return;

        const linkEl = tituloEl.querySelector('a.subassunto-nome');
        const nome = linkEl?.textContent?.trim() || tituloEl.textContent?.trim() || '';

        if (!nome) return;

        // Buscar filhos
        const filhosContainer = el.querySelector(':scope > .assuntos-filhos, :scope > .subassuntos');
        const filhos = filhosContainer ? extractAssuntos(filhosContainer, level + 1) : [];

        assuntos.push({ nome, level, filhos });
      });

      return assuntos;
    }

    // Buscar container principal
    const mainContainer = document.querySelector('#materia-assuntos') ||
                          document.querySelector('.assuntos-container') ||
                          document.body;

    // Extrair assuntos de nivel 1
    const assuntosNivel1 = [];
    const todosSubassuntos = mainContainer.querySelectorAll('.subassunto');

    todosSubassuntos.forEach((el) => {
      // Verificar se e nivel 1 (nao tem .subassunto como ancestral dentro do container)
      const parent = el.parentElement;
      const isLevel1 = !parent?.closest('.subassunto') ||
                       !mainContainer.contains(parent.closest('.subassunto'));

      if (!isLevel1) return;

      const tituloEl = el.querySelector(':scope > .subassunto-titulo');
      if (!tituloEl) return;

      const linkEl = tituloEl.querySelector('a.subassunto-nome');
      const nome = linkEl?.textContent?.trim() || tituloEl.textContent?.trim() || '';

      if (!nome) return;

      const filhosContainer = el.querySelector(':scope > .assuntos-filhos, :scope > .subassuntos');
      const filhos = filhosContainer ? extractAssuntos(filhosContainer, 2) : [];

      assuntosNivel1.push({ nome, level: 1, filhos });
    });

    // Converter para Markdown
    function toMarkdown(assuntos, prefix = '') {
      let md = '';

      assuntos.forEach((a, i) => {
        const num = prefix ? `${prefix}.${i + 1}` : `${i + 1}`;

        if (a.level === 1) {
          md += `\n# ${num} ${a.nome}\n`;
          if (a.filhos.length === 0) {
            md += '\n---\n';
          }
        } else if (a.level === 2) {
          md += `\n* **${num}** ${a.nome}`;
        } else {
          const indent = '    '.repeat(a.level - 2);
          md += `\n${indent}* **${num}** ${a.nome}`;
        }

        if (a.filhos.length > 0) {
          md += toMarkdown(a.filhos, num);
        }

        if (a.level === 1 && a.filhos.length > 0) {
          md += '\n\n---\n';
        }
      });

      return md;
    }

    let markdown = `# ${materiaTitle}\n`;
    markdown += `\n*Fonte: ${window.location.href}*\n`;
    markdown += toMarkdown(assuntosNivel1);

    return {
      success: true,
      markdown,
      assuntosCount: assuntosNivel1.length
    };

  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

// Initialize - check current state
updateProgress();
