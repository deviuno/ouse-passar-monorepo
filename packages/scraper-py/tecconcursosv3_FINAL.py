import json
import time
import os
import logging
import requests
import random
import threading
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains
from webdriver_manager.chrome import ChromeDriverManager

# ============================================================================
# 🔐 CONFIGURAÇÃO DE MÚLTIPLAS CONTAS
# ============================================================================
ACCOUNTS = [
    {
        "name": "sebastian-alves",
        "email": "sebastian-alves-1985@hotmail.com",
        "password": "Z9xW.x5sn@EE34?"
    },

    {
        "name": "alfredo_dias",
        "email": "alfredo_dias-232354@outlook.com",
        "password": "Z9xW.x5sn@EE34?"
    },

     {
        "name": "enrico_campos",
        "email": "enrico_campos-1976@hotmail.com",
        "password": "Z9xW.x5sn@EE34?"
    },

     {
        "name": "isaaccaleb39",
        "email": "isaaccaleb39@hotmail.com",
        "password": "Z9xW.x5sn@EE34?"
    },

     {
        "name": "feaurora1",
        "email": "feaurora1@outlook.com",
        "password": "Z9xW.x5sn@EE34?"
    },

     {
        "name": "lunasthe",
        "email": "lunasthe@hotmail.com",
        "password": "Z9xW.x5sn@EE34?"
    },

     {
        "name": "diogotrader",
        "email": "diogotrader28@hotmail.com",
        "password": "Z9xW.x5sn@EE34?"
    },



]

# ============================================================================
# CONFIGURAÇÕES GERAIS
# ============================================================================
MAX_QUESTIONS_PER_ACCOUNT = 5000

# Configurações de Webhook
WEBHOOK_URL = "https://n8n.appcodigodavida.com.br/webhook/testescraping"
WEBHOOK_ENABLED = True
WEBHOOK_BATCH_SIZE = 50
WEBHOOK_REALTIME = True

# ============================================================================
# CONFIGURAÇÕES DE COMPORTAMENTO HUMANO
# ============================================================================
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
]

DELAY_RANGES = {
    'page_load': (2.0, 4.5),
    'click': (1.0, 2.5),
    'quick_skip': (0.8, 1.5),
    'typing': (0.1, 0.3),
    'comment_open': (1.5, 3.0),
    'details_open': (1.5, 3.0),
    
    # 🆕 NOVOS DELAYS PARA QUESTÕES REPETIDAS (Comportamento Humano)
    'duplicate_recognition': (0.8, 2.0),      # Tempo para "reconhecer" que já viu
    'duplicate_scroll': (0.3, 0.8),            # Tempo de scroll rápido
    'duplicate_skip_decision': (0.5, 1.2),     # Tempo para "decidir" pular
    'duplicate_click': (0.3, 0.7),             # Clique mais rápido mas não instantâneo
}

# 🆕 CONFIGURAÇÃO DE COMPORTAMENTOS ALEATÓRIOS PARA SKIP
SKIP_BEHAVIORS = {
    'quick_skip': 0.60,        # 60% - Pula rápido (reconhece imediatamente)
    'scroll_then_skip': 0.25,  # 25% - Dá uma scrollada rápida antes
    'hesitate_skip': 0.15,     # 15% - Hesita um pouco antes de pular
}

WAIT_TIMEOUT = 4

# ============================================================================
# LOCKS E EVENTS PARA SINCRONIZAÇÃO
# ============================================================================
ids_lock = threading.Lock()
shared_ids = set()
start_extraction_event = threading.Event()
login_complete_event = threading.Event()  # 🆕 Evento para sincronizar logins

# ============================================================================
# ESTATÍSTICAS GLOBAIS PARA MONITORAMENTO
# ============================================================================
stats_lock = threading.Lock()
global_stats = {
    'total_new': 0,
    'total_skipped': 0,
    'total_webhook_success': 0,
    'total_webhook_failed': 0,
    'start_time': None,
    'accounts': {}  # Dict com estatísticas por conta
}

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================

def human_delay(delay_type='page_load'):
    """Aplica um delay randomizado para simular comportamento humano."""
    if delay_type in DELAY_RANGES:
        min_delay, max_delay = DELAY_RANGES[delay_type]
    else:
        min_delay, max_delay = (1.0, 2.0)
    
    delay = random.uniform(min_delay, max_delay)
    time.sleep(delay)
    return delay

def simulate_mouse_movement(driver, element, logger):
    """Simula movimento natural do mouse até o elemento."""
    try:
        actions = ActionChains(driver)
        
        # Move para uma posição intermediária primeiro (mais natural)
        viewport_width = driver.execute_script("return window.innerWidth")
        viewport_height = driver.execute_script("return window.innerHeight")
        
        # Posição intermediária aleatória
        mid_x = random.randint(int(viewport_width * 0.3), int(viewport_width * 0.7))
        mid_y = random.randint(int(viewport_height * 0.3), int(viewport_height * 0.7))
        
        # Move em duas etapas para parecer mais humano
        actions.move_by_offset(mid_x - viewport_width//2, mid_y - viewport_height//2)
        actions.pause(random.uniform(0.1, 0.3))
        actions.move_to_element(element)
        actions.pause(random.uniform(0.05, 0.15))
        
        actions.perform()
        
        logger.debug("Mouse movido naturalmente até o elemento")
    except Exception as e:
        logger.debug(f"Movimento de mouse não realizado: {e}")

def simulate_reading_scroll(driver, logger, quick=False):
    """Simula uma leitura rápida com scroll natural."""
    try:
        if quick:
            # Scroll rápido mas não instantâneo
            scroll_amount = random.randint(100, 300)
            scroll_duration = random.uniform(0.2, 0.5)
        else:
            # Scroll mais lento
            scroll_amount = random.randint(200, 500)
            scroll_duration = random.uniform(0.5, 1.2)
        
        # Scroll em pequenos incrementos
        increments = random.randint(2, 4)
        increment_size = scroll_amount // increments
        
        for i in range(increments):
            driver.execute_script(f"window.scrollBy(0, {increment_size})")
            time.sleep(scroll_duration / increments)
        
        logger.debug(f"Scroll simulado: {scroll_amount}px em {scroll_duration:.2f}s")
        
    except Exception as e:
        logger.debug(f"Erro no scroll simulado: {e}")

def human_skip_duplicate(driver, logger, question_id, behavior_type=None):
    """
    🆕 Simula comportamento humano ao pular questão repetida.
    
    Tipos de comportamento:
    - quick_skip: Reconhece rapidamente e pula (mais comum)
    - scroll_then_skip: Dá uma olhada rápida antes de pular
    - hesitate_skip: Hesita um pouco, como se estivesse confirmando
    """
    
    # Se não especificado, escolhe comportamento aleatório baseado nas probabilidades
    if behavior_type is None:
        rand = random.random()
        cumulative = 0
        for behavior, probability in SKIP_BEHAVIORS.items():
            cumulative += probability
            if rand <= cumulative:
                behavior_type = behavior
                break
    
    logger.debug(f"🎭 Comportamento escolhido para pular: {behavior_type}")
    
    try:
        if behavior_type == 'quick_skip':
            # Reconhecimento rápido
            human_delay('duplicate_recognition')
            logger.debug("⚡ Reconheceu rapidamente - pulando direto")
            
        elif behavior_type == 'scroll_then_skip':
            # Pequena pausa de reconhecimento
            time.sleep(random.uniform(0.3, 0.7))
            
            # Scroll rápido pela questão
            simulate_reading_scroll(driver, logger, quick=True)
            human_delay('duplicate_scroll')
            
            # Volta pro topo
            driver.execute_script("window.scrollTo(0, 0)")
            time.sleep(random.uniform(0.2, 0.4))
            
            logger.debug("👀 Deu uma olhada rápida antes de pular")
            
        elif behavior_type == 'hesitate_skip':
            # Pausa maior, como se estivesse pensando
            human_delay('duplicate_recognition')
            
            # Às vezes move o mouse
            if random.random() > 0.5:
                try:
                    # Move mouse para área do enunciado
                    enunciado = driver.find_element(By.CSS_SELECTOR, "div.questao-enunciado-texto")
                    simulate_mouse_movement(driver, enunciado, logger)
                except:
                    pass
            
            # Pausa de decisão
            human_delay('duplicate_skip_decision')
            
            logger.debug("🤔 Hesitou um pouco antes de pular")
        
        # Localiza o botão próximo
        next_button = WebDriverWait(driver, WAIT_TIMEOUT).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "button.questao-navegacao-botao-proxima"))
        )
        
        # Às vezes move o mouse até o botão antes de clicar
        if random.random() > 0.4:  # 60% das vezes
            simulate_mouse_movement(driver, next_button, logger)
        
        # Clique mais natural (não instantâneo, mas relativamente rápido)
        human_delay('duplicate_click')
        next_button.click()
        
        # Aguarda a próxima questão carregar com delay natural
        time.sleep(random.uniform(0.4, 0.9))
        
        WebDriverWait(driver, WAIT_TIMEOUT).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div.questao-enunciado-texto"))
        )
        
        logger.debug(f"✓ Questão {question_id} pulada com comportamento humano")
        return True
        
    except Exception as e:
        logger.error(f"Erro ao pular questão com comportamento humano: {e}")
        return False

def human_type(element, text, logger):
    """Simula digitação humana com delays entre teclas."""
    element.clear()
    for char in text:
        element.send_keys(char)
        time.sleep(random.uniform(*DELAY_RANGES['typing']))
    
    logger.debug(f"Digitado '{text[:3]}...' com delay humanizado")

def setup_logging(account_name):
    """Configura o sistema de logging para uma conta específica."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_filename = f"scraper_{account_name.replace(' ', '_')}_{timestamp}.log"
    
    logger = logging.getLogger(f"Scraper_{account_name}")
    logger.setLevel(logging.INFO)
    logger.handlers = []
    
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    date_format = '%Y-%m-%d %H:%M:%S'
    
    file_handler = logging.FileHandler(log_filename, encoding='utf-8')
    file_handler.setFormatter(logging.Formatter(log_format, date_format))
    logger.addHandler(file_handler)
    
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(log_format, date_format))
    logger.addHandler(console_handler)
    
    logger.info("="*70)
    logger.info(f"INICIANDO EXTRAÇÃO - {account_name}")
    logger.info(f"Arquivo de log: {log_filename}")
    logger.info(f"Webhook: {'ATIVADO' if WEBHOOK_ENABLED else 'DESATIVADO'}")
    logger.info("="*70)
    
    return logger, log_filename

def load_shared_ids(logger):
    """Carrega IDs compartilhados via webhook."""
    global shared_ids

    with ids_lock:
        ids_from_webhook = set()
        
        # SEMPRE carregar IDs via webhook para evitar duplicatas
        max_retries = 3
        retry_count = 0
        
        webhook_ids_url = "https://n8n.appcodigodavida.com.br/webhook/q"
        
        while retry_count < max_retries:
            try:
                logger.info(f"🔍 Carregando IDs existentes via webhook... (tentativa {retry_count + 1}/{max_retries})")
                
                response = requests.get(webhook_ids_url, timeout=60)
                response.raise_for_status()
                
                data = response.json()

                # Extrair IDs do JSON
                ids_from_webhook = set(str(item['id']) for item in data if 'id' in item)

                logger.info(f"✅ {len(ids_from_webhook)} IDs carregados via webhook!")
                break  # Sucesso, sair do loop de retry

            except Exception as e:
                retry_count += 1
                logger.error(f"⚠️ Erro ao carregar IDs via webhook (tentativa {retry_count}/{max_retries}): {e}")

                if retry_count < max_retries:
                    wait_time = 2 ** retry_count  # Exponential backoff: 2s, 4s, 8s
                    logger.info(f"   ⏳ Aguardando {wait_time}s antes de tentar novamente...")
                    time.sleep(wait_time)
                else:
                    logger.warning("❌ FALHA ao carregar IDs após 3 tentativas!")
                    logger.warning("⚠️ CONTINUANDO SEM IDs - Questões podem ser re-extraídas!")
                    logger.info("   💡 Verifique se o webhook está acessível")
                    ids_from_webhook = set()

        # Usar IDs carregados
        shared_ids = ids_from_webhook
        logger.info(f"📚 TOTAL: {len(shared_ids)} IDs únicos já extraídos")
        
        return shared_ids.copy()

def add_shared_id(question_id):
    """Adiciona um ID ao conjunto compartilhado de forma thread-safe."""
    global shared_ids
    with ids_lock:
        shared_ids.add(question_id)

def is_id_extracted(question_id):
    """Verifica se um ID já foi extraído de forma thread-safe."""
    global shared_ids
    with ids_lock:
        return question_id in shared_ids

def update_stats(account_name, new_questions=0, skipped=0, webhook_success=0, webhook_failed=0):
    """Atualiza estatísticas globais de forma thread-safe."""
    global global_stats
    with stats_lock:
        global_stats['total_new'] += new_questions
        global_stats['total_skipped'] += skipped
        global_stats['total_webhook_success'] += webhook_success
        global_stats['total_webhook_failed'] += webhook_failed

        if account_name not in global_stats['accounts']:
            global_stats['accounts'][account_name] = {
                'new': 0,
                'skipped': 0,
                'webhook_success': 0,
                'last_update': time.time()
            }

        global_stats['accounts'][account_name]['new'] += new_questions
        global_stats['accounts'][account_name]['skipped'] += skipped
        global_stats['accounts'][account_name]['webhook_success'] += webhook_success
        global_stats['accounts'][account_name]['last_update'] = time.time()

def print_global_stats():
    """Imprime estatísticas consolidadas de todas as contas."""
    global global_stats
    with stats_lock:
        if global_stats['start_time'] is None:
            return

        elapsed = time.time() - global_stats['start_time']
        elapsed_min = elapsed / 60

        total_processed = global_stats['total_new'] + global_stats['total_skipped']
        rate_per_min = (global_stats['total_new'] / elapsed_min) if elapsed_min > 0 else 0

        print("\n" + "="*70)
        print("📊 ESTATÍSTICAS GLOBAIS EM TEMPO REAL")
        print("="*70)
        print(f"⏱️  Tempo decorrido: {int(elapsed_min)}min {int(elapsed % 60)}s")
        print(f"🆕 Questões novas: {global_stats['total_new']}")
        print(f"⏭️  Duplicadas puladas: {global_stats['total_skipped']}")
        print(f"📊 Total processadas: {total_processed}")
        print(f"📤 Enviadas ao webhook: {global_stats['total_webhook_success']}")
        if global_stats['total_webhook_failed'] > 0:
            print(f"⚠️  Falhas no webhook: {global_stats['total_webhook_failed']}")
        print(f"⚡ Taxa: {rate_per_min:.1f} questões/min")
        print("-"*70)
        print("📋 POR CONTA:")

        for acc_name, acc_stats in sorted(global_stats['accounts'].items()):
            time_since = int(time.time() - acc_stats['last_update'])
            status = "🟢 Ativo" if time_since < 30 else "🟡 Inativo"
            print(f"  [{acc_name}] {status} - Novas: {acc_stats['new']} | Puladas: {acc_stats['skipped']}")

        print("="*70 + "\n")

def setup_driver(account_name, logger):
    """Configura e retorna o WebDriver do Chrome com User-Agent randomizado."""
    selected_ua = random.choice(USER_AGENTS)
    logger.info(f"🎭 User-Agent: {selected_ua[:80]}...")
    
    logger.info("Configurando WebDriver do Chrome...")
    options = webdriver.ChromeOptions()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--start-maximized")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-infobars")
    options.page_load_strategy = 'eager'
    options.add_argument(f'user-agent={selected_ua}')
    options.add_argument(f'--window-name={account_name}')
    
    try:
        driver = webdriver.Chrome(options=options)
        driver.execute_script(f"document.title = '{account_name} - TEC Concursos'")
        logger.info("✓ WebDriver configurado com sucesso")
        return driver
    except Exception as path_error:
        logger.warning(f"ChromeDriver não encontrado no PATH: {path_error}")
        
        try:
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=options)
            driver.execute_script(f"document.title = '{account_name} - TEC Concursos'")
            logger.info("✓ WebDriver configurado com sucesso (webdriver-manager)")
            return driver
        except Exception as manager_error:
            logger.error(f"Erro ao configurar WebDriver: {manager_error}", exc_info=True)
            raise

def disable_popups(driver, logger):
    """Injeta JavaScript para desabilitar popups Alertify permanentemente."""
    try:
        script = """
        // Desabilitar Alertify completamente
        if (typeof alertify !== 'undefined') {
            alertify.alert = function() { return false; };
            alertify.confirm = function() { return false; };
            alertify.prompt = function() { return false; };
            alertify.notify = function() { return false; };
            alertify.message = function() { return false; };
            alertify.success = function() { return false; };
            alertify.error = function() { return false; };
            alertify.warning = function() { return false; };
        }
        
        // Remover popups existentes
        document.querySelectorAll('.alertify, .ajs-modal, .ajs-dialog').forEach(el => el.remove());
        
        // Criar observer para remover popups que aparecerem
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) {
                        if (node.classList && (node.classList.contains('alertify') || 
                            node.classList.contains('ajs-modal') || 
                            node.classList.contains('ajs-dialog'))) {
                            node.remove();
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        console.log('✓ Popups Alertify desabilitados');
        """
        
        driver.execute_script(script)
        logger.info("✓ Popups Alertify desabilitados via JavaScript")
        return True
    except Exception as e:
        logger.warning(f"Não foi possível desabilitar popups: {e}")
        return False

def login(driver, account, logger):
    """Realiza o login no site do TEC Concursos."""
    logger.info(f"Iniciando processo de login para {account['name']}...")
    print(f"\n[{account['name']}] Navegando para a página de login...")
    driver.get("https://www.tecconcursos.com.br/login")
    
    try:
        human_delay('page_load')
        
        email_field = WebDriverWait(driver, WAIT_TIMEOUT).until(
            EC.visibility_of_element_located((By.ID, "email"))
        )
        password_field = driver.find_element(By.ID, "senha")
        
        logger.info("Preenchendo credenciais com digitação humanizada...")
        human_type(email_field, account['email'], logger)
        human_delay('click')
        human_type(password_field, account['password'], logger)
        
        logger.info(f"✓ Credenciais preenchidas para {account['name']}")
        return True
        
    except Exception as e:
        logger.error(f"Erro no login: {e}", exc_info=True)
        print(f"[{account['name']}] ✗ Erro no login: {e}")
        return False

def detect_extraction_problem(driver, logger):
    """
    🆕 Detecta problemas REAIS que IMPEDEM a extração:
    - CAPTCHA/reCAPTCHA bloqueante
    - Cloudflare bloqueando elementos essenciais
    - Mudança de layout (elementos essenciais ausentes)
    - Erro de carregamento

    IMPORTANTE: Cloudflare pode estar presente sem bloquear.
    Só retorna 'cloudflare' se os elementos essenciais estiverem ausentes.

    Retorna: 'cloudflare', 'captcha', 'layout_change', 'loading_error', ou 'none'
    """
    try:
        # 1. PRIMEIRO: Verificar se elementos essenciais existem (PRIORIDADE MÁXIMA)
        essential_elements = [
            "div.questao-enunciado-texto",  # Enunciado
            "button.questao-navegacao-botao-proxima"  # Botão próximo
        ]

        elements_found = []
        missing_elements = []

        for selector in essential_elements:
            try:
                found = driver.find_elements(By.CSS_SELECTOR, selector)
                if found:
                    elements_found.append(selector)
                else:
                    missing_elements.append(selector)
            except:
                missing_elements.append(selector)

        # Se TODOS os elementos essenciais estão presentes, NÃO há problema
        if not missing_elements:
            logger.debug("✓ Elementos essenciais presentes - extração pode prosseguir")
            return 'none'

        # Se elementos essenciais estão AUSENTES, investigar o motivo:
        logger.warning(f"⚠️ Elementos essenciais ausentes: {missing_elements}")

        # 2. Verificar se ausência é por Cloudflare BLOQUEANTE
        cloudflare_blocking_indicators = [
            "Checking your browser",
            "Just a moment",
            "Please wait",
            "cf-browser-verification",
            "challenge-platform"
        ]

        try:
            page_text = driver.find_element(By.TAG_NAME, 'body').text

            # Verificar se página está em branco ou só com Cloudflare
            if len(page_text.strip()) < 100:  # Página muito vazia
                for indicator in cloudflare_blocking_indicators:
                    if indicator.lower() in page_text.lower():
                        logger.warning(f"🔒 Cloudflare BLOQUEANDO extração: '{indicator}'")
                        return 'cloudflare'

            # Verificar se mensagem de Cloudflare é DOMINANTE na página
            cloudflare_text_count = sum(1 for ind in cloudflare_blocking_indicators if ind.lower() in page_text.lower())
            if cloudflare_text_count >= 2:  # Múltiplos indicadores = bloqueio real
                logger.warning("🔒 Cloudflare Challenge ATIVO bloqueando página")
                return 'cloudflare'

        except:
            pass

        # 3. Verificar se há CAPTCHA VISÍVEL bloqueante
        captcha_indicators = [
            "iframe[src*='recaptcha']",
            "iframe[src*='captcha']",
            ".g-recaptcha",
            "#captcha"
        ]

        for selector in captcha_indicators:
            try:
                captcha_elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if captcha_elements and captcha_elements[0].is_displayed():
                    logger.warning("🔒 CAPTCHA VISÍVEL bloqueando página")
                    return 'captcha'
            except:
                pass

        # 4. Verificar mensagens de erro explícitas
        error_keywords = ['erro fatal', 'error 500', 'error 404', 'página não encontrada']
        try:
            page_text = driver.find_element(By.TAG_NAME, 'body').text.lower()
            for keyword in error_keywords:
                if keyword in page_text:
                    logger.warning(f"⚠️ Erro detectado: '{keyword}'")
                    return 'loading_error'
        except:
            pass

        # 5. Se elementos ausentes mas sem causa clara, reportar mudança de layout
        logger.warning("⚠️ Elementos ausentes - possível mudança de layout")
        return 'layout_change'

    except Exception as e:
        logger.error(f"Erro ao detectar problemas: {e}")
        return 'none'

def pause_for_manual_intervention(account_name, logger, problem_type='unknown'):
    """
    🆕 PAUSA a extração e aguarda intervenção manual do usuário.
    Não fecha o navegador - aguarda o usuário resolver o problema.
    """
    problem_messages = {
        'cloudflare': '🔒 CLOUDFLARE/VERIFICAÇÃO DE SEGURANÇA DETECTADA',
        'captcha': '🔒 CAPTCHA DETECTADO',
        'layout_change': '🎨 MUDANÇA NO LAYOUT DA PÁGINA',
        'loading_error': '❌ ERRO DE CARREGAMENTO',
        'unknown': '⚠️ PROBLEMA NÃO IDENTIFICADO'
    }

    problem_instructions = {
        'cloudflare': [
            "   1. Aguarde o Cloudflare terminar a verificação automática",
            "   2. OU resolva o desafio/CAPTCHA se solicitado",
            "   3. Aguarde a página redirecionar de volta",
            "   4. Confirme que voltou para a página de questões"
        ],
        'captcha': [
            "   1. Resolva o CAPTCHA/reCAPTCHA exibido",
            "   2. Aguarde a validação",
            "   3. Confirme que a página carregou corretamente"
        ],
        'layout_change': [
            "   1. Verifique se há popup/mensagem",
            "   2. Confirme que a página está carregada corretamente",
            "   3. Se necessário, reaplique os filtros"
        ],
        'loading_error': [
            "   1. Atualize a página se necessário",
            "   2. Verifique sua conexão",
            "   3. Confirme que a página carregou"
        ],
        'unknown': [
            "   1. Verifique a janela do navegador",
            "   2. Resolva qualquer problema visível",
            "   3. Confirme que está tudo OK"
        ]
    }

    message = problem_messages.get(problem_type, problem_messages['unknown'])
    instructions = problem_instructions.get(problem_type, problem_instructions['unknown'])

    print(f"\n{'='*70}")
    print(f"⏸️  PAUSA AUTOMÁTICA - [{account_name}]")
    print(f"{'='*70}")
    print(f"⚠️  {message}")
    print(f"\n🔍 INSTRUÇÕES:")
    for instruction in instructions:
        print(instruction)
    print(f"\n💡 IMPORTANTE:")
    print(f"   - NÃO feche o navegador")
    print(f"   - O scraper aguardará você resolver")
    print(f"   - Pressione ENTER quando estiver pronto para continuar")
    print(f"{'='*70}")

    logger.warning(f"⏸️ PAUSADO: {message}")
    logger.warning("Aguardando intervenção manual do usuário...")

    input(f"\n[{account_name}] 🔓 Pressione ENTER para CONTINUAR após resolver... ")

    print(f"\n[{account_name}] ✅ Retomando extração...")
    logger.info("✓ Extração retomada pelo usuário")

    # Aguarda um pouco para garantir estabilidade
    time.sleep(2)

    return True

def send_webhook(data, account_name, logger, batch_info=None):
    """Envia dados para webhook via POST."""
    if not WEBHOOK_ENABLED or not WEBHOOK_URL:
        return False
    
    if isinstance(data, dict):
        data = [data]
    
    try:
        payload = {
            "timestamp": datetime.now().isoformat(),
            "total_questions": len(data),
            "source": f"TEC Scraper - {account_name}",
            "account": account_name,
            "data": data
        }
        
        if batch_info:
            payload.update(batch_info)
        
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "TEC-Scraper/2.0"
        }
        
        response = requests.post(WEBHOOK_URL, json=payload, headers=headers, timeout=30)
        
        if response.status_code in [200, 201, 202]:
            logger.info(f"✓ Webhook enviado! Status: {response.status_code}")
            return True
        else:
            logger.warning(f"⚠️ Webhook status {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"Erro ao enviar webhook: {e}")
        return False

def extract_images_from_element(element, logger):
    """Extrai URLs de imagens de um elemento específico."""
    image_urls = []
    try:
        img_elements = element.find_elements(By.TAG_NAME, "img")
        for img in img_elements:
            try:
                src = img.get_attribute("src")
                if src and src.startswith("http"):
                    image_urls.append(src)
                    continue
                
                data_src = img.get_attribute("data-src")
                if data_src and data_src.startswith("http"):
                    image_urls.append(data_src)
                    continue
                
                for attr in ["data-original", "data-lazy-src"]:
                    url = img.get_attribute(attr)
                    if url and url.startswith("http"):
                        image_urls.append(url)
                        break
            except:
                continue
        
        seen = set()
        unique_images = []
        for url in image_urls:
            if url not in seen:
                seen.add(url)
                unique_images.append(url)
        
        return unique_images
    except Exception as e:
        logger.debug(f"Erro ao extrair imagens: {e}")
        return []

def extract_question_data(driver, logger, quick_check=False):
    """Extrai os dados de uma única questão da página atual."""
    data = {}
    try:
        delay = human_delay('page_load')
        logger.debug(f"Delay após carregar questão: {delay:.2f}s")
        
        # ID da Questão
        try:
            question_id_element = driver.find_element(By.CSS_SELECTOR, "a.id-questao")
            id_text = question_id_element.text.strip()
            data['id'] = id_text.replace('#', '')
        except NoSuchElementException:
            try:
                question_id_element = driver.find_element(By.CSS_SELECTOR, "div.questao-enunciado-concurso a[target='_blank']")
                id_text = question_id_element.text.strip()
                data['id'] = id_text.replace('#', '')
            except:
                data['id'] = "ID não encontrado"
                logger.warning("ID da questão não encontrado")
        
        if quick_check:
            if not data.get('id') or data['id'] == "ID não encontrado":
                return None
            return data

        # EXTRAÇÃO COMPLETA
        
        # Matéria
        try:
            subject_element = driver.find_element(By.CSS_SELECTOR, "div.questao-cabecalho-informacoes-materia a")
            data['materia'] = subject_element.text.strip()
        except NoSuchElementException:
            data['materia'] = "Matéria não encontrada"

        # Assunto
        try:
            topic_div = driver.find_element(By.CSS_SELECTOR, "div.questao-cabecalho-informacoes-assunto")
            full_text = topic_div.text.strip()
            data['assunto'] = full_text.replace("Assunto:", "").strip() if full_text.startswith("Assunto:") else full_text
        except NoSuchElementException:
            data['assunto'] = "Sem classificação"

        # Concurso
        try:
            contest_div = driver.find_element(By.CSS_SELECTOR, "div.questao-enunciado-concurso")
            full_text = contest_div.text.strip()
            lines = full_text.split('\n')
            data['concurso'] = ' '.join(lines[1:]).strip() if len(lines) > 1 else full_text
        except NoSuchElementException:
            data['concurso'] = "Concurso não encontrado"

        # Enunciado e suas imagens
        data['imagens_enunciado'] = []
        try:
            statement_element = driver.find_element(By.CSS_SELECTOR, "div.questao-enunciado-texto")
            data['enunciado'] = statement_element.text.strip()
            
            enunciado_images = extract_images_from_element(statement_element, logger)
            if enunciado_images:
                data['imagens_enunciado'] = enunciado_images
        except NoSuchElementException:
            data['enunciado'] = "Enunciado não encontrado"

        # Alternativas
        try:
            options_elements = driver.find_elements(By.CSS_SELECTOR, "ul.questao-enunciado-alternativas li")
            data['alternativas'] = []
            
            for option in options_elements:
                try:
                    letter_element = option.find_element(By.CSS_SELECTOR, "span.questao-enunciado-alternativa-opcao label")
                    letter = letter_element.text.strip()
                    
                    text_element = option.find_element(By.CSS_SELECTOR, "div.questao-enunciado-alternativa-texto")
                    text = text_element.text.strip()
                    
                    if letter and text:
                        alternativa_data = {'letter': letter, 'text': text}
                        
                        alt_images = extract_images_from_element(text_element, logger)
                        if alt_images:
                            alternativa_data['imagens'] = alt_images
                        
                        data['alternativas'].append(alternativa_data)
                except:
                    continue
        except NoSuchElementException:
            data['alternativas'] = []

        # Gabarito
        data['gabarito'] = None
        gabarito_obtido = False
        try:
            gabarito_text = driver.find_element(By.CSS_SELECTOR, "div.questao-enunciado-resolucao-errou strong")
            data['gabarito'] = gabarito_text.text.strip()
            gabarito_obtido = True
        except:
            pass
        
        if not gabarito_obtido:
            try:
                correct_options = driver.find_elements(By.CSS_SELECTOR, "li.questao-enunciado-alternativa-correta")
                if correct_options:
                    correct_element = correct_options[0].find_element(By.CSS_SELECTOR, "span.questao-enunciado-alternativa-opcao label")
                    data['gabarito'] = correct_element.text.strip()
                    gabarito_obtido = True
            except:
                pass

        # Comentário e suas imagens (usando atalho de teclado "o")
        try:
            delay = human_delay('comment_open')
            logger.debug(f"Delay antes de abrir comentário: {delay:.2f}s")

            # Usar atalho "o" para abrir comentário (mais rápido e confiável)
            body = driver.find_element(By.TAG_NAME, 'body')
            body.send_keys('o')
            human_delay('page_load')

            try:
                comment_element = driver.find_element(By.CSS_SELECTOR, "div.questao-complementos-comentario-conteudo-texto")
                data['comentario'] = comment_element.text.strip()

                comment_images = extract_images_from_element(comment_element, logger)
                if comment_images:
                    data['imagens_comentario'] = comment_images
                    logger.info(f"🖼️ {len(comment_images)} imagem(ns) no comentário")

                # Extrair gabarito do comentário se ainda não obtido
                if not gabarito_obtido or data['gabarito'] is None:
                    import re
                    # Procurar por padrões: "Gabarito: C", "Letra C", "C ou E" etc
                    gabarito_match = re.search(r'Gabarito:\s*(?:Letra\s*)?([A-E]|CERTO|ERRADO)', data['comentario'], re.IGNORECASE)
                    if gabarito_match:
                        gabarito_text = gabarito_match.group(1).upper()
                        # Converter CERTO/ERRADO para C/E se necessário
                        if gabarito_text == 'CERTO':
                            data['gabarito'] = 'C'
                        elif gabarito_text == 'ERRADO':
                            data['gabarito'] = 'E'
                        else:
                            data['gabarito'] = gabarito_text
                        gabarito_obtido = True
                        logger.info(f"✓ Gabarito extraído do comentário: {data['gabarito']}")

                # Fechar comentário (usando ESC ou botão)
                body.send_keys(Keys.ESCAPE)
                human_delay('click')
            except:
                data['comentario'] = None
        except Exception as e:
            logger.debug(f"Erro ao extrair comentário: {e}")
            data['comentario'] = None

        # Detalhes adicionais (usando atalho de teclado "i")
        data['detalhes'] = {}
        try:
            delay = human_delay('details_open')
            logger.debug(f"Delay antes de abrir detalhes: {delay:.2f}s")

            # Usar atalho "i" para abrir informações da questão (mais rápido e confiável)
            body = driver.find_element(By.TAG_NAME, 'body')
            body.send_keys('i')
            human_delay('page_load')

            try:
                # Aguardar container de detalhes aparecer com NOVO seletor
                details_container = WebDriverWait(driver, 4).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "div.detalhes-questao"))
                )

                detail_items = details_container.find_elements(By.CSS_SELECTOR, "div.item-detalhe")
                logger.debug(f"🔍 Encontrados {len(detail_items)} itens de detalhe")

                for item in detail_items:
                    try:
                        # Verificar se é item múltiplo (Ano e Banca juntos, por exemplo)
                        if "item-detalhe-multiplo" in item.get_attribute("class"):
                            # Buscar sub-itens dentro do item múltiplo
                            sub_items = item.find_elements(By.XPATH, "./div")
                            for sub_item in sub_items:
                                try:
                                    sub_title_elem = sub_item.find_elements(By.CSS_SELECTOR, "div.detalhe-titulo")
                                    sub_value_elem = sub_item.find_elements(By.CSS_SELECTOR, "div.ng-binding")

                                    if sub_title_elem and sub_value_elem:
                                        sub_title = sub_title_elem[0].text.strip()
                                        sub_value = sub_value_elem[0].text.strip()

                                        if sub_title and sub_value:
                                            # Normalizar chave
                                            key = sub_title.lower().replace(' ', '_')
                                            data['detalhes'][key] = sub_value
                                            logger.debug(f"  ✓ {sub_title}: {sub_value}")
                                except Exception as e:
                                    logger.debug(f"  Erro ao extrair sub-item: {e}")
                                    continue
                        else:
                            # Item simples
                            title_elem = item.find_elements(By.CSS_SELECTOR, "div.detalhe-titulo")

                            if title_elem:
                                title = title_elem[0].text.strip()

                                # Primeiro tentar campo composto (ex: Cargo / Área / Especialidade / Edição)
                                value_elem = item.find_elements(By.CSS_SELECTOR, "div.detalhe-concurso-composto")

                                # Se não encontrar, tentar div.ng-binding normal
                                if not value_elem:
                                    value_elem = item.find_elements(By.CSS_SELECTOR, "div.ng-binding")

                                if value_elem:
                                    value = value_elem[0].text.strip()

                                    if title and value:
                                        # Normalizar chave (substituir caracteres especiais)
                                        key = title.lower().replace(' / ', '_').replace('/', '_').replace(' ', '_')
                                        data['detalhes'][key] = value
                                        logger.debug(f"  ✓ {title}: {value[:50]}...")
                    except Exception as e:
                        logger.debug(f"  Erro ao processar item de detalhe: {e}")
                        continue

                logger.info(f"✓ {len(data['detalhes'])} campos de detalhes extraídos")

                # Fechar detalhes (usando ESC)
                body.send_keys(Keys.ESCAPE)
                human_delay('click')

            except TimeoutException:
                logger.warning("⚠️ Timeout ao aguardar detalhes da questão")
                data['detalhes'] = {}
            except Exception as e:
                logger.warning(f"⚠️ Erro ao extrair detalhes: {e}")
                data['detalhes'] = {}

        except Exception as e:
            logger.debug(f"Erro ao abrir detalhes: {e}")
            data['detalhes'] = {}

        # Contador total de imagens
        total_images = 0
        total_images += len(data.get('imagens_enunciado', []))
        total_images += len(data.get('imagens_comentario', []))
        for alt in data.get('alternativas', []):
            total_images += len(alt.get('imagens', []))
        
        if total_images > 0:
            data['total_imagens'] = total_images
            logger.info(f"🖼️ Total de {total_images} imagem(ns) na questão")

        data['extracted_at'] = datetime.now().isoformat()

        if not data.get('id') or data['id'] == "ID não encontrado":
            logger.error("ID da questão não encontrado - dados inválidos")
            return None
            
        if not data.get('alternativas'):
            logger.error(f"Nenhuma alternativa encontrada - Questão {data.get('id', 'N/A')}")
            return None

    except Exception as e:
        logger.error(f"Erro inesperado ao extrair questão: {e}", exc_info=True)
        return None
    
    logger.info(f"✓ Questão {data.get('id', 'N/A')} extraída com sucesso")
    return data

# ============================================================================
# FUNÇÃO PRINCIPAL POR CONTA (Thread)
# ============================================================================

def scrape_account(account, account_index):
    """Função principal que executa o scraping para uma conta específica."""
    logger, log_filename = setup_logging(account['name'])
    driver = None

    try:
        logger.info(f"Iniciando thread para {account['name']}")
        print(f"\n{'='*70}")
        print(f"🚀 INICIANDO {account['name'].upper()}")
        print(f"{'='*70}\n")

        # Carregar IDs já extraídos via webhook
        load_shared_ids(logger)
        print(f"[{account['name']}] 📚 Total de {len(shared_ids)} IDs carregados (serão pulados automaticamente)")
        
        driver = setup_driver(account['name'], logger)
        new_questions = []
        pending_batch = []

        # Inicializar estatísticas da conta
        update_stats(account['name'])

        # Login
        if not login(driver, account, logger):
            logger.error("Falha no login. Encerrando thread...")
            return
        
        print(f"\n[{account['name']}] ✓ Credenciais preenchidas!")
        print(f"[{account['name']}] 🔐 Agora resolva o CAPTCHA nesta janela")
        print(f"[{account['name']}] 🔐 Depois clique no botão de LOGIN")
        print(f"[{account['name']}] ⏸️  Aguardando confirmação de login...")
        
        # 🆕 AGUARDA o evento de login ao invés de input individual
        login_complete_event.wait()
        
        logger.info("Login confirmado pelo usuário")
        
        logger.info("Navegando para página de questões...")
        driver.get("https://www.tecconcursos.com.br/questoes/filtrar")
        human_delay('page_load')
        
        # Desabilitar popups Alertify
        disable_popups(driver, logger)
        
        print(f"\n[{account['name']}] 🔍 Aplique os FILTROS desejados nesta janela")
        print(f"[{account['name']}] ⏸️  Aguardando você pressionar ENTER no console principal...")
        
        start_extraction_event.wait()
        
        print(f"\n[{account['name']}] 🚀 Iniciando extração!")
        logger.info("Sinal recebido - iniciando extração")
        
        # Desabilitar popups novamente antes de começar
        disable_popups(driver, logger)
        
        try:
            WebDriverWait(driver, WAIT_TIMEOUT).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div.questao-enunciado-texto"))
            )
            print(f"[{account['name']}] ✓ Questão encontrada! Iniciando extração...")
        except TimeoutException:
            print(f"[{account['name']}] ⚠️ Nenhuma questão encontrada. Encerrando...")
            return
        
        # Loop de extração
        question_count = 0
        skipped_count = 0
        webhook_success = 0
        webhook_failed = 0
        consecutive_errors = 0
        max_consecutive_errors = 3
        start_time = time.time()
        
        logger.info("="*70)
        logger.info("INICIANDO LOOP DE EXTRAÇÃO")
        logger.info("="*70)
        
        while True:
            try:
                # 🆕 NOVA VERIFICAÇÃO: Detecta problemas reais (não mais texto "limite")
                problem = detect_extraction_problem(driver, logger)
                
                if problem != 'none':
                    # 🆕 PAUSA ao invés de fechar
                    logger.warning(f"⚠️ Problema detectado: {problem}")
                    print(f"\n[{account['name']}] ⚠️ PROBLEMA DETECTADO: {problem}")
                    
                    # Pausa e aguarda usuário resolver
                    pause_for_manual_intervention(account['name'], logger, problem)
                    
                    # Desabilita popups novamente após resolver
                    disable_popups(driver, logger)
                    
                    # Aguarda um pouco e continua
                    time.sleep(2)
                    continue
                
                question_start = time.time()
                
                # Verificação rápida do ID
                quick_data = extract_question_data(driver, logger, quick_check=True)
                
                if not quick_data:
                    consecutive_errors += 1
                    if consecutive_errors >= max_consecutive_errors:
                        logger.critical("Muitos erros consecutivos. Encerrando.")
                        break
                    
                    try:
                        next_button = WebDriverWait(driver, WAIT_TIMEOUT).until(
                            EC.element_to_be_clickable((By.CSS_SELECTOR, "button.questao-navegacao-botao-proxima"))
                        )
                        human_delay('click')
                        next_button.click()
                        human_delay('page_load')
                        continue
                    except Exception:
                        break
                
                question_id = quick_data.get('id')
                
                # DEBUG: Mostrar ID sendo verificado
                logger.debug(f"🔍 Verificando ID: {question_id} (tipo: {type(question_id)})")
                
                # ⚡ OTIMIZADO: Verifica se já foi extraída e pula COM COMPORTAMENTO HUMANO
                if is_id_extracted(question_id):
                    skipped_count += 1
                    consecutive_errors = 0
                    question_time = time.time() - question_start

                    # Atualizar estatísticas
                    update_stats(account['name'], skipped=1)

                    logger.info(f"⏭️ Questão {question_id} JÁ EXISTE - Pulando com comportamento humano ({question_time:.2f}s)")
                    print(f"[{account['name']}] ⏭️ PULOU: {question_id} (já existe)")

                    # Mostrar estatísticas globais a cada 50 questões puladas (todas as contas)
                    if global_stats['total_skipped'] % 50 == 0 and global_stats['total_skipped'] > 0:
                        print_global_stats()
                    
                    # 🆕 USA A NOVA FUNÇÃO DE COMPORTAMENTO HUMANO
                    if human_skip_duplicate(driver, logger, question_id):
                        continue
                    else:
                        # Se falhar, tenta skip tradicional como fallback
                        try:
                            next_button = WebDriverWait(driver, WAIT_TIMEOUT).until(
                                EC.element_to_be_clickable((By.CSS_SELECTOR, "button.questao-navegacao-botao-proxima"))
                            )
                            next_button.click()
                            time.sleep(random.uniform(0.5, 1.0))
                            continue
                        except:
                            break
                
                # QUESTÃO NOVA - Extração completa
                question_data = extract_question_data(driver, logger, quick_check=False)
                question_time = time.time() - question_start
                
                if question_data:
                    question_count += 1
                    consecutive_errors = 0

                    add_shared_id(question_id)
                    new_questions.append(question_data)

                    logger.info(f"✓ Questão {question_count} extraída em {question_time:.1f}s - ID: {question_id}")
                    print(f"[{account['name']}] ✓ Questão {question_count}: {question_id} | {question_data.get('materia', 'N/A')}")

                    # 📤 WEBHOOK
                    webhook_sent = False
                    if WEBHOOK_ENABLED and WEBHOOK_URL:
                        if WEBHOOK_REALTIME:
                            if send_webhook(question_data, account['name'], logger):
                                webhook_success += 1
                                webhook_sent = True
                            else:
                                webhook_failed += 1

                    # Atualizar estatísticas
                    update_stats(account['name'], new_questions=1,
                                webhook_success=1 if webhook_sent else 0,
                                webhook_failed=0 if webhook_sent else 1)

                    # Mostrar estatísticas globais a cada 20 questões novas (todas as contas)
                    if global_stats['total_new'] % 20 == 0 and global_stats['total_new'] > 0:
                        print_global_stats()

                    if not WEBHOOK_REALTIME:
                        pending_batch.append(question_data)

                        if len(pending_batch) >= WEBHOOK_BATCH_SIZE:
                                batch_info = {
                                    "batch_number": (question_count // WEBHOOK_BATCH_SIZE),
                                    "batch_size": len(pending_batch)
                                }
                                if send_webhook(pending_batch, account['name'], logger, batch_info):
                                    webhook_success += len(pending_batch)
                                    pending_batch = []
                                else:
                                    webhook_failed += len(pending_batch)
                                    pending_batch = []

                    if question_count % 10 == 0:
                        # 🆕 Verificação periódica de problemas (a cada 10 questões)
                        problem = detect_extraction_problem(driver, logger)
                        if problem != 'none':
                            logger.warning(f"⚠️ Verificação periódica: problema detectado ({problem})")
                            pause_for_manual_intervention(account['name'], logger, problem)
                            disable_popups(driver, logger)
                else:
                    consecutive_errors += 1
                    if consecutive_errors >= max_consecutive_errors:
                        logger.critical("Muitos erros consecutivos. Encerrando.")
                        break

                # Verificar limite por conta
                if MAX_QUESTIONS_PER_ACCOUNT and question_count >= MAX_QUESTIONS_PER_ACCOUNT:
                    logger.info(f"Limite de {MAX_QUESTIONS_PER_ACCOUNT} questões atingido")
                    print(f"\n[{account['name']}] ✓ Limite de {MAX_QUESTIONS_PER_ACCOUNT} questões atingido.")
                    break

                # Próxima questão
                try:
                    next_button = WebDriverWait(driver, WAIT_TIMEOUT).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, "button.questao-navegacao-botao-proxima"))
                    )
                    human_delay('click')
                    next_button.click()
                    human_delay('page_load')

                    WebDriverWait(driver, WAIT_TIMEOUT).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, "div.questao-enunciado-texto"))
                    )

                    # 🆕 VERIFICAÇÃO CRÍTICA: Detectar Cloudflare/CAPTCHA após navegação
                    problem = detect_extraction_problem(driver, logger)
                    if problem != 'none':
                        logger.warning(f"⚠️ Problema detectado após navegação: {problem}")
                        pause_for_manual_intervention(account['name'], logger, problem)
                        disable_popups(driver, logger)
                        # Continua após resolver
                        continue

                except TimeoutException:
                    logger.warning("Timeout ao aguardar próxima questão")

                    # Verificar se é Cloudflare/CAPTCHA antes de desistir
                    problem = detect_extraction_problem(driver, logger)
                    if problem in ['cloudflare', 'captcha']:
                        logger.warning(f"⚠️ {problem.upper()} detectado durante timeout")
                        pause_for_manual_intervention(account['name'], logger, problem)
                        disable_popups(driver, logger)
                        continue

                    try:
                        next_buttons = driver.find_elements(By.CSS_SELECTOR, "button.questao-navegacao-botao-proxima")
                        if not next_buttons or not next_buttons[0].is_enabled():
                            logger.info("Fim das questões disponíveis")
                            print(f"\n[{account['name']}] ✓ Não há mais questões disponíveis.")
                            break
                    except:
                        pass
                    break

                except Exception as e:
                    logger.error(f"Erro ao navegar: {e}", exc_info=True)

                    # Verificar se é Cloudflare/CAPTCHA antes de desistir
                    problem = detect_extraction_problem(driver, logger)
                    if problem in ['cloudflare', 'captcha']:
                        logger.warning(f"⚠️ {problem.upper()} detectado durante erro de navegação")
                        pause_for_manual_intervention(account['name'], logger, problem)
                        disable_popups(driver, logger)
                        continue

                    if "element click intercepted" in str(e).lower() or "ajs-modal" in str(e).lower():
                        logger.warning("⚠️ CLIQUE INTERCEPTADO POR POPUP - Tentando continuar")
                        # Tenta continuar após pequena pausa
                        logger.info("✓ Aguardando e tentando continuar")
                        time.sleep(2)
                        continue
                    break
                    
            except Exception as loop_error:
                logger.error(f"Erro no loop principal: {loop_error}", exc_info=True)

                # 🆕 VERIFICAR SE É CLOUDFLARE/CAPTCHA ANTES DE CONTAR COMO ERRO
                problem = detect_extraction_problem(driver, logger)
                if problem in ['cloudflare', 'captcha']:
                    logger.warning(f"⚠️ {problem.upper()} detectado no loop - NÃO conta como erro")
                    pause_for_manual_intervention(account['name'], logger, problem)
                    disable_popups(driver, logger)
                    # Não incrementa consecutive_errors - Cloudflare não é erro do scraper
                    continue

                consecutive_errors += 1

                if consecutive_errors >= max_consecutive_errors:
                    logger.critical(f"❌ {max_consecutive_errors} erros consecutivos - encerrando conta")
                    break

                logger.warning(f"⚠️ Erro {consecutive_errors}/{max_consecutive_errors} - tentando continuar")
                try:
                    next_button = driver.find_element(By.CSS_SELECTOR, "button.questao-navegacao-botao-proxima")
                    human_delay('click')
                    next_button.click()
                    human_delay('page_load')
                    continue
                except Exception as recovery_error:
                    logger.error(f"Falha ao tentar recuperar: {recovery_error}")
                    break

        # FINALIZAÇÃO
        total_time = time.time() - start_time

        logger.info("="*70)
        logger.info("FINALIZANDO EXTRAÇÃO")
        logger.info("="*70)

        # 📤 Enviar lote pendente do webhook
        if pending_batch and WEBHOOK_ENABLED and not WEBHOOK_REALTIME:
            print(f"\n[{account['name']}] 📤 Enviando lote final de {len(pending_batch)} questões...")
            batch_info = {
                "batch_number": "final",
                "batch_size": len(pending_batch)
            }
            if send_webhook(pending_batch, account['name'], logger, batch_info):
                webhook_success += len(pending_batch)

        print(f"\n{'='*70}")
        print(f"✅ {account['name'].upper()} - EXTRAÇÃO CONCLUÍDA!")
        print(f"{'='*70}")
        print(f"[{account['name']}] 🆕 Questões novas: {question_count}")
        print(f"[{account['name']}] ⏭️ Duplicadas puladas: {skipped_count}")
        print(f"[{account['name']}] 📤 Enviadas webhook: {webhook_success}")
        print(f"[{account['name']}] ⏱️ Tempo total: {total_time:.1f}s")
        print(f"[{account['name']}] 📋 Log: {log_filename}")
        print(f"{'='*70}\n")

        logger.info(f"Questões novas: {question_count}")
        logger.info(f"Duplicadas puladas: {skipped_count}")
        logger.info(f"Webhook enviadas: {webhook_success}")
        logger.info(f"Tempo total: {total_time:.1f}s")

    except KeyboardInterrupt:
        logger.warning("Extração interrompida pelo usuário (Ctrl+C)")
        print(f"\n[{account['name']}] ⚠️ Extração interrompida!")

        if 'pending_batch' in locals() and pending_batch:
            send_webhook(pending_batch, account['name'], logger)

    except Exception as e:
        logger.critical(f"Erro fatal: {e}", exc_info=True)
        print(f"\n[{account['name']}] ✗ Erro fatal: {e}")

        if 'pending_batch' in locals() and pending_batch:
            send_webhook(pending_batch, account['name'], logger)
    
    finally:
        if driver:
            logger.info("Fechando navegador...")
            time.sleep(1)
            try:
                driver.quit()
                logger.info("✓ Navegador fechado")
            except Exception as e:
                logger.error(f"Erro ao fechar navegador: {e}")
        
        logger.info("="*70)
        logger.info(f"THREAD {account['name']} FINALIZADA")
        logger.info("="*70)

# ============================================================================
# MAIN - COORDENA TODAS AS THREADS
# ============================================================================

def main():
    """Função principal que coordena a execução paralela de múltiplas contas."""
    global global_stats

    print("\n" + "="*70)
    print("🚀 TEC CONCURSOS SCRAPER - MODO MULTI-CONTAS PARALELO")
    print("="*70)
    print(f"📊 Contas configuradas: {len(ACCOUNTS)}")
    print(f"🔄 Modo: {'TEMPO REAL' if WEBHOOK_REALTIME else f'LOTES DE {WEBHOOK_BATCH_SIZE}'}")
    print(f"🌐 Webhook: {'ATIVADO' if WEBHOOK_ENABLED else 'DESATIVADO'}")
    print("="*70)

    print(f"\n{'='*70}")
    print("📋 INSTRUÇÕES:")
    print("="*70)
    print("1️⃣  Serão abertos múltiplos navegadores (um para cada conta)")
    print("2️⃣  RESOLVA o CAPTCHA em cada navegador")
    print("3️⃣  CLIQUE no botão de LOGIN em cada navegador")
    print("4️⃣  APLIQUE os FILTROS desejados em cada navegador")
    print("5️⃣  Volte aqui e PRESSIONE ENTER para iniciar a extração")
    print("6️⃣  As questões duplicadas serão automaticamente puladas")
    print("7️⃣  Todas as contas trabalharão em PARALELO")
    print("="*70)
    
    input("\n⏸️  Pressione ENTER para ABRIR os navegadores... ")
    
    threads = []
    
    print(f"\n🚀 Abrindo {len(ACCOUNTS)} navegador(es)...\n")
    
    for i, account in enumerate(ACCOUNTS):
        thread = threading.Thread(
            target=scrape_account,
            args=(account, i),
            name=f"Thread-{account['name']}"
        )
        threads.append(thread)
        thread.start()
        time.sleep(3)
    
    print(f"\n{'='*70}")
    print(f"✓ Todos os navegadores foram abertos!")
    print(f"{'='*70}")
    print(f"🔐 Agora faça o seguinte em CADA navegador:")
    print(f"   1. RESOLVA o CAPTCHA")
    print(f"   2. CLIQUE no botão de LOGIN")
    print(f"{'='*70}")
    print(f"⏸️  Quando TODAS as contas estiverem LOGADAS (CAPTCHA resolvido),")
    print(f"⏸️  pressione ENTER para CONTINUAR")
    print(f"{'='*70}\n")
    
    input("⏸️  [ETAPA 1/2] Pressione ENTER após FAZER LOGIN em todas as contas... ")
    
    print(f"\n{'='*70}")
    print(f"✅ LOGIN CONFIRMADO - Liberando todas as contas para aplicar filtros...")
    print(f"{'='*70}\n")
    
    # 🆕 LIBERA todas as threads do login
    login_complete_event.set()
    
    # Pequena pausa para threads processarem
    time.sleep(2)
    
    print(f"\n{'='*70}")
    print(f"🔍 Agora APLIQUE OS FILTROS em cada navegador")
    print(f"⏸️  Quando TODOS os filtros estiverem aplicados,")
    print(f"⏸️  pressione ENTER para INICIAR a extração")
    print(f"{'='*70}\n")
    
    input("⏸️  [ETAPA 2/2] Pressione ENTER para INICIAR a extração em todas as contas... ")

    # Iniciar timer global
    global_stats['start_time'] = time.time()

    print(f"\n🚀 Iniciando extração em todas as contas...")
    print(f"📊 Monitoramento em tempo real: Estatísticas serão exibidas periodicamente\n")
    start_extraction_event.set()
    
    try:
        for thread in threads:
            thread.join()
    except KeyboardInterrupt:
        print("\n\n⚠️  INTERRUPÇÃO DETECTADA (Ctrl+C)")
        print("⏳ Aguardando threads finalizarem...")
        
        for thread in threads:
            if thread.is_alive():
                thread.join(timeout=10)
    
    # Estatísticas finais
    print_global_stats()

    print("\n" + "="*70)
    print("🎉 TODAS AS EXTRAÇÕES FINALIZADAS!")
    print("="*70)
    print(f"📚 Total de IDs únicos no sistema: {len(shared_ids)}")
    print(f"🆕 Questões novas extraídas: {global_stats['total_new']}")
    print(f"📤 Enviadas ao webhook com sucesso: {global_stats['total_webhook_success']}")
    print("="*70)

if __name__ == "__main__":
    main()