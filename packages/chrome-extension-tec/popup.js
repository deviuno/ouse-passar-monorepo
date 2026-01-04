// TecConcursos Cookie Exporter
console.log('[TecExporter] Iniciando extensão...');

const TECCONCURSOS_DOMAIN = '.tecconcursos.com.br';

// Elementos do DOM
let statusDiv, copyBtn, exportBtn, checkBtn, cookieCountDiv, serverUrlInput;

try {
  statusDiv = document.getElementById('status');
  copyBtn = document.getElementById('copyBtn');
  exportBtn = document.getElementById('exportBtn');
  checkBtn = document.getElementById('checkBtn');
  cookieCountDiv = document.getElementById('cookieCount');
  serverUrlInput = document.getElementById('serverUrl');
  console.log('[TecExporter] Elementos carregados:', { statusDiv, copyBtn, exportBtn, checkBtn });
} catch (e) {
  console.error('[TecExporter] Erro ao carregar elementos:', e);
}

// Carregar URL salva
try {
  chrome.storage.local.get(['serverUrl'], (result) => {
    if (result && result.serverUrl) {
      serverUrlInput.value = result.serverUrl;
    }
  });
} catch (e) {
  console.log('[TecExporter] Storage não disponível:', e);
}

// Salvar URL quando mudar
if (serverUrlInput) {
  serverUrlInput.addEventListener('change', () => {
    try {
      chrome.storage.local.set({ serverUrl: serverUrlInput.value });
    } catch (e) {
      console.log('[TecExporter] Erro ao salvar URL:', e);
    }
  });
}

// Função para mostrar status
function showStatus(message, type = 'info') {
  statusDiv.className = `status ${type}`;
  statusDiv.innerHTML = message;
}

// Função para obter todos os cookies do TecConcursos
async function getTecConcursosCookies() {
  return new Promise((resolve) => {
    chrome.cookies.getAll({ domain: 'tecconcursos.com.br' }, (cookies) => {
      resolve(cookies);
    });
  });
}

// Função para formatar cookies para o Puppeteer
function formatCookiesForPuppeteer(cookies) {
  return cookies.map(cookie => ({
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path || '/',
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite === 'unspecified' ? 'Lax' : cookie.sameSite,
    expires: cookie.expirationDate ? Math.floor(cookie.expirationDate) : undefined
  }));
}

// Função para copiar cookies para área de transferência
async function copyCookiesToClipboard() {
  console.log('[TecExporter] Copiando cookies...');

  copyBtn.disabled = true;
  copyBtn.innerHTML = '<span class="spinner"></span>Copiando...';

  try {
    const cookies = await getTecConcursosCookies();

    if (cookies.length === 0) {
      showStatus('Nenhum cookie do TecConcursos encontrado. Faça login primeiro.', 'warning');
      return;
    }

    const formattedCookies = formatCookiesForPuppeteer(cookies);

    // Verificar se tem cookie de sessão
    const sessionCookies = cookies.filter(c =>
      c.name === 'JSESSIONID' ||
      c.name === 'TecPermanecerLogado'
    );

    if (sessionCookies.length === 0) {
      showStatus('Cookies encontrados, mas sem sessão. Faça login no TecConcursos primeiro.', 'warning');
      return;
    }

    // Copiar para área de transferência
    const jsonString = JSON.stringify(formattedCookies, null, 2);
    await navigator.clipboard.writeText(jsonString);

    showStatus(`${formattedCookies.length} cookies copiados! Cole no terminal com o comando curl.`, 'success');
    cookieCountDiv.innerHTML = `
      <strong>Comando para importar:</strong><br>
      <code style="font-size:10px;word-break:break-all;">curl -X POST http://72.61.217.225:4000/api/tec-scraper/cookies/import -H "Content-Type: application/json" -d '{"cookies": COLE_AQUI}'</code>
    `;

    console.log('[TecExporter] Cookies copiados:', formattedCookies.length);

  } catch (error) {
    console.error('[TecExporter] Erro:', error);
    showStatus(`Erro ao copiar: ${error.message}`, 'error');
  } finally {
    copyBtn.disabled = false;
    copyBtn.innerHTML = 'Copiar Cookies para Área de Transferência';
  }
}

// Função para exportar cookies para o servidor
async function exportCookies() {
  console.log('[TecExporter] Iniciando exportação...');
  const serverUrl = serverUrlInput.value.trim();

  if (!serverUrl) {
    showStatus('Por favor, informe a URL do servidor.', 'error');
    return;
  }

  exportBtn.disabled = true;
  exportBtn.innerHTML = '<span class="spinner"></span>Exportando...';
  showStatus('Obtendo cookies...', 'info');

  try {
    // Obter cookies
    console.log('[TecExporter] Obtendo cookies do TecConcursos...');
    const cookies = await getTecConcursosCookies();
    console.log('[TecExporter] Cookies obtidos:', cookies.length);

    if (cookies.length === 0) {
      showStatus('Nenhum cookie do TecConcursos encontrado. Você está logado?', 'warning');
      return;
    }

    // Formatar cookies
    const formattedCookies = formatCookiesForPuppeteer(cookies);

    // Verificar se tem cookie de sessão
    const hasSession = cookies.some(c =>
      c.name === 'JSESSIONID' ||
      c.name === 'TecPermanecerLogado' ||
      c.name.toLowerCase().includes('session')
    );

    if (!hasSession) {
      showStatus('Cookies encontrados, mas nenhum cookie de sessão. Faça login primeiro no TecConcursos.', 'warning');
      cookieCountDiv.textContent = `${cookies.length} cookies encontrados (sem sessão)`;
      return;
    }

    // Enviar para o servidor
    showStatus('Enviando para o servidor...', 'info');
    console.log('[TecExporter] Enviando para:', `${serverUrl}/api/tec-scraper/cookies/import`);
    console.log('[TecExporter] Cookies formatados:', formattedCookies.length);

    const response = await fetch(`${serverUrl}/api/tec-scraper/cookies/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cookies: formattedCookies }),
    });

    console.log('[TecExporter] Response status:', response.status);
    const result = await response.json();
    console.log('[TecExporter] Response:', result);

    if (result.success) {
      showStatus(`Cookies exportados com sucesso! ${formattedCookies.length} cookies enviados.`, 'success');
      cookieCountDiv.textContent = `Cookies importantes: JSESSIONID, TecPermanecerLogado, AWSALB`;
    } else {
      showStatus(`Erro ao exportar: ${result.error || result.message}`, 'error');
    }

  } catch (error) {
    console.error('[TecExporter] Erro:', error);
    showStatus(`Erro de conexão: ${error.message}. Verifique se o servidor está rodando.`, 'error');
  } finally {
    exportBtn.disabled = false;
    exportBtn.innerHTML = 'Exportar Cookies para Scraper';
  }
}

// Função para verificar status do login no servidor
async function checkLoginStatus() {
  const serverUrl = serverUrlInput.value.trim();

  if (!serverUrl) {
    showStatus('Por favor, informe a URL do servidor.', 'error');
    return;
  }

  checkBtn.disabled = true;
  checkBtn.innerHTML = '<span class="spinner"></span>Verificando...';

  try {
    const response = await fetch(`${serverUrl}/api/tec-scraper/cookies/check`);
    const result = await response.json();

    if (result.isLoggedIn) {
      showStatus('Login válido! O scraper está autenticado no TecConcursos.', 'success');
    } else {
      showStatus('Login inválido. Exporte os cookies novamente após fazer login no TecConcursos.', 'warning');
    }

  } catch (error) {
    showStatus(`Erro de conexão: ${error.message}`, 'error');
  } finally {
    checkBtn.disabled = false;
    checkBtn.innerHTML = 'Verificar Status do Login';
  }
}

// Carregar contagem de cookies ao abrir
async function loadCookieCount() {
  const cookies = await getTecConcursosCookies();
  const sessionCookies = cookies.filter(c =>
    c.name === 'JSESSIONID' ||
    c.name === 'TecPermanecerLogado' ||
    c.name === 'AWSALB'
  );

  if (cookies.length > 0) {
    cookieCountDiv.textContent = `${cookies.length} cookies encontrados (${sessionCookies.length} de sessão)`;

    if (sessionCookies.length === 0) {
      showStatus('Você não está logado no TecConcursos. Faça login primeiro.', 'warning');
    }
  } else {
    cookieCountDiv.textContent = 'Nenhum cookie do TecConcursos';
    showStatus('Acesse o TecConcursos e faça login primeiro.', 'warning');
  }
}

// Event listeners
try {
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      console.log('[TecExporter] Botão copiar clicado');
      copyCookiesToClipboard();
    });
    console.log('[TecExporter] Event listener copyBtn adicionado');
  }
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      console.log('[TecExporter] Botão exportar clicado');
      exportCookies();
    });
    console.log('[TecExporter] Event listener exportBtn adicionado');
  }
  if (checkBtn) {
    checkBtn.addEventListener('click', () => {
      console.log('[TecExporter] Botão check clicado');
      checkLoginStatus();
    });
    console.log('[TecExporter] Event listener checkBtn adicionado');
  }
} catch (e) {
  console.error('[TecExporter] Erro ao adicionar event listeners:', e);
}

// Carregar ao abrir
try {
  loadCookieCount();
} catch (e) {
  console.error('[TecExporter] Erro ao carregar contagem:', e);
}

console.log('[TecExporter] Extensão carregada com sucesso!');
