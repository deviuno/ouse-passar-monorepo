# TecConcursos Cookie Exporter

Extensão do Chrome para exportar cookies do TecConcursos para o scraper Ouse Passar.

## Instalação

### 1. Gerar os ícones (opcional)

1. Abra o arquivo `create-icons.html` no navegador
2. Clique com botão direito em cada ícone e salve como:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

### 2. Instalar a extensão no Chrome

1. Abra o Chrome e vá para `chrome://extensions/`
2. Ative o **Modo do desenvolvedor** (canto superior direito)
3. Clique em **Carregar sem compactação**
4. Selecione a pasta `chrome-extension-tec`

## Como usar

1. Acesse https://www.tecconcursos.com.br e faça login normalmente
2. Clique no ícone da extensão (T amarelo) na barra do Chrome
3. Clique em **Exportar Cookies para Scraper**
4. Pronto! Os cookies serão enviados automaticamente para o servidor

## Configuração

- **URL do Servidor**: Por padrão usa `http://72.61.217.225:4000`
- Você pode alterar a URL se o servidor estiver em outro endereço

## Funcionalidades

- **Exportar Cookies**: Captura todos os cookies do TecConcursos (incluindo httpOnly) e envia para o servidor
- **Verificar Status**: Verifica se o scraper está autenticado no TecConcursos

## Cookies capturados

A extensão captura automaticamente:
- `JSESSIONID` - Cookie de sessão Java
- `TecPermanecerLogado` - Cookie "lembrar-me"
- `AWSALB` / `AWSALBCORS` - Cookies do load balancer AWS
- E todos os outros cookies do domínio tecconcursos.com.br
