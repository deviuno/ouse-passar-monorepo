import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { mastra } from './mastra/index.js';
import { ousePassarMcpServer } from './mastra/mcp/mcpServer.js';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import {
    gerarRodadas,
    persistirRodadas,
    buscarMateriasComTopicos,
    criarEditalVerticalizado,
    criarMensagensIncentivoPadrao,
    criarPreparatorio,
    atualizarRaioX,
    ativarPreparatorio,
    deletarPreparatorio,
    getRodadasSettings,
    MateriaOrdenada,
    ConfiguracaoGeracao,
    EditalEstrutura,
} from './mastra/agents/rodadasGeneratorAgent.js';
import {
    getBuilderState,
    getTopicosDisponiveis,
    createMissao,
    deleteMissao,
    createRodada,
    deleteRodada,
    addRevisaoExtra,
    finalizarMontagem,
    getMissoesPorRodada,
} from './services/missionBuilderService.js';
import { otimizarFiltrosPreparatorio, sugerirFiltrosMissao } from './mastra/agents/filtrosAdapterAgent.js';
import { autoConfigureEditalFilters, AutoConfigProgressCallback } from './mastra/agents/editalFilterAutoConfigAgent.js';
import * as storeService from './services/storeService.js';
import { buscarOuGerarLogo } from './services/logoService.js';
import { generateSimuladoPDF } from './services/pdfService.js';
import { compressImage, getContentType, getFileExtension } from './services/imageCompressionService.js';
import multer from 'multer';
import { createScraperRoutes } from './routes/scraper.js';
import { createTecConcursosScraperRoutes } from './routes/tecConcursosScraper.js';
import { startImageProcessorCron, getImageProcessorStatus } from './cron/imageProcessor.js';
import { startQuestionReviewerCron, getQuestionReviewerStatus } from './cron/questionReviewer.js';
import { startGabaritoExtractorCron, getGabaritoExtractorStatus } from './cron/gabaritoExtractor.js';
import { startComentarioFormatterCron, startEnunciadoFormatterCron, getFormatterProcessorStatus } from './cron/formatterProcessor.js';
import { startMateriaClassifierCron, getMateriaClassifierStatus, runMateriaClassification } from './cron/materiaClassifier.js';
import {
    questionGeneratorAgent,
    fetchReferenceQuestions,
    generateQuestions,
    saveGeneratedQuestions,
    generateQuestionComment,
    QuestionGenerationParams,
} from './mastra/agents/questionGeneratorAgent.js';
import { musicLyricsAgent } from './mastra/agents/musicLyricsAgent.js';
import { podcastScriptAgent } from './mastra/agents/podcastScriptAgent.js';
import * as sunoService from './services/sunoService.js';

// Load environment variables
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading from local .env first, then fallback to sibling package
const result = dotenv.config();
if (result.error || !process.env.VITE_GEMINI_API_KEY) {
    console.log("Loading .env from questos package...");
    const questoesEnvPath = path.resolve(__dirname, '../../questoes/.env');
    const questoesEnv = dotenv.config({ path: questoesEnvPath });

    if (questoesEnv.error) {
        console.error("Error loading .env from path:", questoesEnvPath, questoesEnv.error);
    } else {
        console.log("Loaded .env from:", questoesEnvPath);
    }
}

// Ensure Google API Key is set for AI SDK
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.VITE_GEMINI_API_KEY) {
    console.log("Setting GOOGLE_GENERATIVE_AI_API_KEY from VITE_GEMINI_API_KEY");
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.VITE_GEMINI_API_KEY;
}

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("CRITICAL: GOOGLE_GENERATIVE_AI_API_KEY is missing!");
} else {
    console.log("GOOGLE_GENERATIVE_AI_API_KEY is set (starts with " + process.env.GOOGLE_GENERATIVE_AI_API_KEY.substring(0, 5) + "...)");
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const PORT = 4000;

// Multer configuration for PDF uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 30 * 1024 * 1024, // 30MB max
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos PDF são permitidos'));
        }
    },
});

app.post('/api/tutor', async (req, res) => {
    try {
        const { history, userMessage, question, user, threadId, mode } = req.body;

        const agent = mastra.getAgent("tutorAgent");

        if (!agent) {
            res.status(500).json({ success: false, error: "Agent not found" });
            return;
        }

        // Detect if this is content mode (lesson) or question mode
        // Content mode: no gabarito, no alternatives, or explicitly set mode
        const isContentMode = mode === 'content' ||
            (!question.gabarito && (!question.alternativas || question.alternativas.length === 0));

        // Generate thread ID based on context
        const currentThreadId = threadId || (isContentMode
            ? `content-${question.assunto || Date.now()}`
            : `question-${question.id || Date.now()}`);
        const resourceId = user.id || user.name || 'anonymous';

        let contextPrompt: string;
        let assistantPriming: string;
        let userPrompt: string;

        if (isContentMode) {
            // CONTENT MODE - Lesson/Aula context
            contextPrompt = `
📚 **MODO: TUTOR DE CONTEÚDO TEÓRICO**

Você está ajudando um aluno a entender o conteúdo de uma AULA TEÓRICA.
NÃO há questão de múltipla escolha aqui. NÃO mencione gabarito, alternativas ou respostas.

📋 **CONTEÚDO DA AULA**

**Matéria:** ${question.materia || 'Geral'}
**Tema:** ${question.assunto || 'Geral'}

**Conteúdo:**
${question.enunciado}

═══════════════════════════════════════
Sua função é:
- Explicar conceitos do conteúdo
- Responder dúvidas sobre a matéria
- Dar exemplos práticos
- Ajudar o aluno a entender o tema
═══════════════════════════════════════
            `.trim();

            assistantPriming = `📚 Recebi o conteúdo da aula sobre **${question.assunto || 'o tema'}**. Estou pronto para tirar suas dúvidas sobre esse material teórico. Como posso ajudar?`;

            userPrompt = userMessage;
        } else {
            // QUESTION MODE - Original behavior
            const alternativesText = Array.isArray(question.alternativas)
                ? question.alternativas.map((a: any) => `${a.letter || ''}) ${a.text || JSON.stringify(a)}`).join('\n')
                : JSON.stringify(question.alternativas);

            contextPrompt = `
⛔⛔⛔ INSTRUÇÃO CRÍTICA - LEIA PRIMEIRO ⛔⛔⛔
A RESPOSTA CORRETA DESTA QUESTÃO É: **${question.gabarito}**
VOCÊ DEVE USAR ESTA LETRA. NÃO ANALISE. NÃO PENSE. APENAS ACEITE.
⛔⛔⛔ FIM DA INSTRUÇÃO CRÍTICA ⛔⛔⛔

📋 **CONTEXTO DA QUESTÃO**

**Matéria:** ${question.materia || 'Geral'}
**Assunto:** ${question.assunto || 'Geral'}
**Banca:** ${question.banca || 'N/A'} | **Ano:** ${question.ano || 'N/A'}

**Enunciado:**
${question.enunciado}

**Alternativas:**
${alternativesText}

═══════════════════════════════════════
📌 **GABARITO OFICIAL: ${question.gabarito}**
A letra "${question.gabarito}" é a ÚNICA resposta correta.
Sua função é explicar POR QUE "${question.gabarito}" está certa.
═══════════════════════════════════════
${question.comentario ? `\n**Comentário de referência:** ${question.comentario}` : ''}
${question.isPegadinha ? `\n⚠️ **Pegadinha:** ${question.explicacaoPegadinha || ''}` : ''}
            `.trim();

            assistantPriming = `✅ Recebi a questão. O GABARITO OFICIAL é a letra **${question.gabarito}**. Essa é a resposta correta e vou usá-la como base absoluta. Como posso ajudar?`;

            userPrompt = `${userMessage}\n\n[LEMBRETE: O gabarito é ${question.gabarito}. Use essa letra como resposta correta.]`;
        }

        console.log(`[Tutor] Processing ${isContentMode ? 'CONTENT' : 'QUESTION'} mode message from ${user.name} on thread ${currentThreadId}...`);

        // Use the agent's generate method with memory context
        const result = await agent.generate([
            { role: "user", content: contextPrompt },
            { role: "assistant", content: assistantPriming },
            { role: "user", content: userPrompt }
        ], {
            threadId: currentThreadId,
            resourceId: resourceId,
        });

        console.log(`[Tutor] Response generated for thread ${currentThreadId}.`);

        res.json({
            success: true,
            response: result.text,
            threadId: currentThreadId,
        });

    } catch (error: any) {
        console.error("Error in Tutor Agent:", error);
        res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
});

// Endpoint para parsing de edital via IA
app.post('/api/edital/parse', async (req, res) => {
    try {
        const { texto } = req.body;

        if (!texto || texto.trim().length < 50) {
            res.status(400).json({
                success: false,
                error: "Texto do edital muito curto ou vazio. Minimo de 50 caracteres."
            });
            return;
        }

        console.log(`[Edital] Parsing edital with ${texto.length} characters...`);

        const agent = mastra.getAgent("editalParserAgent");

        if (!agent) {
            res.status(500).json({ success: false, error: "Agente de parsing nao encontrado" });
            return;
        }

        const result = await agent.generate([
            {
                role: "user",
                content: `Analise o seguinte texto de edital e extraia a estrutura hierarquica em JSON:\n\n${texto}`,
            },
        ]);

        console.log(`[Edital] Agent response received, extracting JSON...`);

        // Extrair JSON da resposta
        const responseText = result.text || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            console.error('[Edital] Could not extract JSON from response:', responseText.substring(0, 200));
            res.status(500).json({
                success: false,
                error: "Nao foi possivel extrair a estrutura do edital. Tente novamente."
            });
            return;
        }

        try {
            const parsed = JSON.parse(jsonMatch[0]);

            // Validar estrutura basica
            if (!parsed.blocos || !Array.isArray(parsed.blocos)) {
                throw new Error("Estrutura invalida: 'blocos' nao encontrado");
            }

            console.log(`[Edital] Successfully parsed: ${parsed.blocos.length} blocos found`);

            res.json({ success: true, data: parsed });

        } catch (parseError: any) {
            console.error('[Edital] JSON parse error:', parseError.message);
            res.status(500).json({
                success: false,
                error: "Erro ao processar resposta da IA. Tente novamente."
            });
        }

    } catch (error: any) {
        console.error("[Edital] Error parsing edital:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Erro interno ao processar edital"
        });
    }
});

// Endpoint para auto-configurar filtros do edital via IA
app.post('/api/edital/:preparatorioId/auto-configure-filters', async (req, res) => {
    try {
        const { preparatorioId } = req.params;

        if (!preparatorioId) {
            res.status(400).json({
                success: false,
                error: 'preparatorioId é obrigatório',
            });
            return;
        }

        console.log(`[EditalAutoConfig] Iniciando auto-configuração para: ${preparatorioId}`);

        const result = await autoConfigureEditalFilters(preparatorioId);

        if (result.success) {
            console.log(`[EditalAutoConfig] Sucesso: ${result.itemsConfigured}/${result.itemsProcessed} itens configurados`);
        } else {
            console.error(`[EditalAutoConfig] Erro: ${result.error}`);
        }

        res.json(result);

    } catch (error: any) {
        console.error('[EditalAutoConfig] Erro:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao auto-configurar filtros',
        });
    }
});

// Supabase client for main database (includes questions after unification)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Questions database now uses the same connection as main database (unified)
// Legacy env vars kept for backwards compatibility
const questionsDbUrl = process.env.VITE_QUESTIONS_DB_URL || supabaseUrl;
const questionsDbKey = process.env.VITE_QUESTIONS_DB_ANON_KEY || supabaseKey;
const questionsDb = createClient(questionsDbUrl, questionsDbKey);

// In-memory Set para deduplicação de geração de conteúdo em background
// Evita múltiplas requisições paralelas para a mesma missão
const contentGenerationInProgress = new Set<string>();

// Audio cache helper functions
async function getFromCache(assunto: string, contentType: 'explanation' | 'podcast') {
    try {
        const { data, error } = await supabase
            .from('audio_cache')
            .select('*')
            .eq('assunto', assunto)
            .eq('content_type', contentType)
            .single();

        if (error || !data) return null;

        // Update access count and last accessed
        await supabase
            .from('audio_cache')
            .update({
                access_count: (data.access_count || 0) + 1,
                last_accessed_at: new Date().toISOString()
            })
            .eq('id', data.id);

        return data;
    } catch (e) {
        console.error('[Cache] Error reading from cache:', e);
        return null;
    }
}

async function saveToCache(
    assunto: string,
    contentType: 'explanation' | 'podcast',
    audioData: string,
    scriptText?: string
) {
    try {
        const { error } = await supabase
            .from('audio_cache')
            .upsert({
                assunto,
                content_type: contentType,
                audio_data: audioData,
                script_text: scriptText,
                file_size_bytes: audioData.length,
                created_at: new Date().toISOString(),
                access_count: 1,
                last_accessed_at: new Date().toISOString()
            }, {
                onConflict: 'assunto,content_type'
            });

        if (error) {
            console.error('[Cache] Error saving to cache:', error);
        } else {
            console.log(`[Cache] Saved ${contentType} for "${assunto}" to cache`);
        }
    } catch (e) {
        console.error('[Cache] Error saving to cache:', e);
    }
}

// Simulated delay for cached content (makes it feel like it's generating)
const simulateGenerationDelay = () => new Promise(resolve =>
    setTimeout(resolve, 4000 + Math.random() * 2000) // 4-6 seconds (~5 seconds average)
);

// Gemini Client for various AI operations
const getGeminiClient = () => {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
};

// ==================== GERAÇÃO DE IMAGEM DE CAPA ====================

/**
 * Gera uma imagem de capa profissional estilo poster de filme Netflix
 * @param info Informações do preparatório (nome, banca, órgão, cargo)
 * @returns URL da imagem no Supabase Storage ou null se falhar
 */
async function gerarImagemCapa(info: {
    nome: string;
    banca?: string | null;
    orgao?: string | null;
    cargo?: string | null;
    preparatorioId: string;
}): Promise<string | null> {
    const client = getGeminiClient();
    if (!client) {
        console.warn('[ImagemCapa] API key não configurada');
        return null;
    }

    try {
        console.log(`[ImagemCapa] Gerando imagem para: ${info.cargo || info.nome}`);

        // Construir prompt simples e efetivo (formato que funciona melhor)
        const cargoTexto = info.cargo || 'profissional';
        const orgaoTexto = info.orgao ? ` - ${info.orgao}` : '';

        const prompt = `${cargoTexto}${orgaoTexto} exercendo sua função com realização profissional. Imagem foto-realista, cinematográfica e quadrada.`;

        // Timeout de 60 segundos para modelo mais potente
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Timeout: geração de imagem demorou mais de 60 segundos')), 60000);
        });

        const generatePromise = client.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: prompt,
            config: {
                responseModalities: ['image', 'text'],
            },
        });

        const response = await Promise.race([generatePromise, timeoutPromise]);

        // Extrair imagem da resposta
        const parts = response.candidates?.[0]?.content?.parts || [];
        let imageData: string | null = null;

        for (const part of parts) {
            if (part.inlineData?.data) {
                imageData = part.inlineData.data;
                break;
            }
        }

        if (!imageData) {
            console.warn('[ImagemCapa] Nenhuma imagem gerada na resposta');
            return null;
        }

        console.log('[ImagemCapa] Imagem estilo Netflix gerada, fazendo upload...');

        // Upload para Supabase Storage
        const fileName = `capa-${info.preparatorioId}-${Date.now()}.png`;
        const buffer = Buffer.from(imageData, 'base64');

        const { error: uploadError } = await supabase.storage
            .from('preparatorios')
            .upload(fileName, buffer, {
                contentType: 'image/png',
                upsert: true,
            });

        if (uploadError) {
            console.error('[ImagemCapa] Erro no upload:', uploadError);
            return null;
        }

        // Obter URL pública
        const { data: publicUrlData } = supabase.storage
            .from('preparatorios')
            .getPublicUrl(fileName);

        const imageUrl = publicUrlData?.publicUrl || null;
        console.log(`[ImagemCapa] Upload concluído: ${imageUrl}`);

        // IMPORTANTE: Atualizar o preparatório com a imagem E gerar textos de vendas
        if (imageUrl) {
            // Gerar textos de vendas persuasivos e ricos para página de vendas
            const cargoFormatado = info.cargo || 'concurso público';
            const orgaoFormatado = info.orgao || '';
            const bancaFormatada = info.banca || '';

            const descricaoCurta = `O caminho mais inteligente para sua aprovação como ${cargoFormatado}${orgaoFormatado ? ` no ${orgaoFormatado}` : ''}. Metodologia exclusiva que já aprovou milhares de concurseiros.`;

            const descricaoVendas = `## Por que este preparatório vai transformar seus estudos?

Você já sentiu que estuda muito, mas não evolui? Que falta direção e um método claro? **Este preparatório foi criado exatamente para resolver isso.**

Desenvolvemos uma metodologia baseada em **ciência da aprendizagem** e na análise de milhares de provas${bancaFormatada ? ` da banca ${bancaFormatada}` : ''}, para você estudar de forma **estratégica e eficiente**.

### O que você vai encontrar:

**Trilha de Estudos Personalizada**
Esqueça o estudo desorganizado. Você receberá um plano estruturado em rodadas, com cada missão pensada para maximizar sua retenção e performance.

**Questões Direcionadas**
Não é sobre resolver milhares de questões aleatórias. É sobre resolver as questões certas, no momento certo, dos assuntos que mais caem na prova.

**Sistema de Revisão Inteligente**
A revisão espaçada é comprovadamente a técnica mais eficaz para memorização de longo prazo. Nosso sistema programa suas revisões automaticamente.

**Simulados no Padrão da Prova**
Treine nas mesmas condições do dia da prova. Tempo controlado, questões no formato correto, e análise detalhada do seu desempenho.

**Acompanhamento em Tempo Real**
Visualize seu progresso, identifique pontos fracos, e saiba exatamente onde precisa melhorar.

### Para quem é este preparatório?

- Concurseiros que querem **parar de perder tempo** com métodos ineficientes
- Quem busca uma **preparação direcionada** para ${cargoFormatado}${orgaoFormatado ? ` - ${orgaoFormatado}` : ''}
- Candidatos que valorizam **qualidade sobre quantidade**
- Pessoas determinadas a conquistar a **estabilidade e os benefícios** de um cargo público

### A decisão é sua

Você pode continuar estudando sem direção, torcendo para dar certo. Ou pode seguir um método comprovado que já levou milhares de pessoas à aprovação.

**Sua vaga está esperando. A questão é: você vai conquistá-la?**`;

            const { error: updateError } = await supabase
                .from('preparatorios')
                .update({
                    imagem_capa: imageUrl,
                    descricao_curta: descricaoCurta,
                    descricao_vendas: descricaoVendas,
                })
                .eq('id', info.preparatorioId);

            if (updateError) {
                console.error('[ImagemCapa] Erro ao atualizar preparatório:', updateError);
            } else {
                console.log(`[ImagemCapa] Preparatório atualizado com imagem e textos de vendas`);
            }
        }

        return imageUrl;

    } catch (error: any) {
        console.error('[ImagemCapa] Erro ao gerar imagem:', error.message || error);
        return null;
    }
}

// ==================== GERAÇÃO DE IMAGENS EDUCACIONAIS (IMAGEN 3.0) ====================

/**
 * Interface para conceito de imagem a ser gerada
 */
interface ImageConceptForGeneration {
    conceito: string;
    descricao: string;
    posicaoNoTexto: string; // Trecho do texto onde inserir
}

/**
 * Gera uma imagem educacional (infográfico ou diagrama) usando Imagen 3.0
 * @param concept Conceito a ser ilustrado
 * @param materia Matéria relacionada para contexto
 * @param missaoId ID da missão para naming
 * @returns URL da imagem no Supabase Storage ou null se falhar
 */
async function gerarImagemEducacional(
    concept: ImageConceptForGeneration,
    materia: string,
    missaoId: string
): Promise<string | null> {
    const client = getGeminiClient();
    if (!client) {
        console.warn('[ImagemEducacional] API key não configurada');
        return null;
    }

    try {
        console.log(`[ImagemEducacional] Gerando imagem para: ${concept.conceito}`);

        // Construir prompt otimizado para infográficos educacionais - Branding Ouse Passar
        const prompt = `Create a clean, professional educational infographic or diagram about "${concept.conceito}".

Context: ${concept.descricao}
Subject area: ${materia}
Brand: Ouse Passar (educational platform)

Requirements:
- Professional, minimalist design with clean lines
- Clear visual hierarchy with sections and labels
- Use icons and simple illustrations (not photos)
- Color palette: blue (#3B82F6), orange/amber (#F59E0B), gray (#6B7280), white
- Include key terms as labels in Portuguese (Brazil)
- Suitable for educational content, like a textbook illustration
- 16:9 aspect ratio, suitable for embedding in content
- NO text in English, use Portuguese labels only
- NO photographs, only vector-style illustrations
- If any watermark, credit, or brand name is needed, use "Ouse Passar" only
- NEVER use the word "concurso" or "material para concurso" anywhere in the image
- NEVER include generic educational branding - only "Ouse Passar" if brand text is needed`;

        // Timeout de 90 segundos para geração de imagem
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Timeout: geração de imagem demorou mais de 90 segundos')), 90000);
        });

        // Usar Gemini 3 Pro Image Preview para geração de imagens 1K
        const generatePromise = client.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: prompt,
            config: {
                responseModalities: ['IMAGE', 'TEXT'],
            },
        });

        const response = await Promise.race([generatePromise, timeoutPromise]);

        // Extrair imagem da resposta
        const parts = response.candidates?.[0]?.content?.parts || [];
        let imageData: string | null = null;

        for (const part of parts) {
            if (part.inlineData?.data) {
                imageData = part.inlineData.data;
                break;
            }
        }

        if (!imageData) {
            console.warn('[ImagemEducacional] Nenhuma imagem gerada na resposta');
            return null;
        }

        console.log('[ImagemEducacional] Imagem gerada, fazendo upload...');

        // Upload para Supabase Storage
        const slugConceito = concept.conceito
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .substring(0, 30);
        const fileName = `edu-${missaoId}-${slugConceito}-${Date.now()}.png`;
        const buffer = Buffer.from(imageData, 'base64');

        const { error: uploadError } = await supabase.storage
            .from('missao-imagens')
            .upload(fileName, buffer, {
                contentType: 'image/png',
                upsert: true,
            });

        if (uploadError) {
            console.error('[ImagemEducacional] Erro no upload:', uploadError);
            return null;
        }

        // Obter URL pública
        const { data: publicUrlData } = supabase.storage
            .from('missao-imagens')
            .getPublicUrl(fileName);

        const imageUrl = publicUrlData?.publicUrl || null;
        console.log(`[ImagemEducacional] Upload concluído: ${imageUrl}`);

        return imageUrl;

    } catch (error: any) {
        console.error('[ImagemEducacional] Erro ao gerar imagem:', error.message || error);
        return null;
    }
}

/**
 * Analisa o conteúdo gerado e identifica conceitos que se beneficiariam de imagens
 * @param textoContent Conteúdo em Markdown gerado pelo agent
 * @param materia Matéria da missão
 * @returns Lista de conceitos para geração de imagens (máx 3)
 */
async function analisarConceitosParaImagens(
    textoContent: string,
    materia: string
): Promise<ImageConceptForGeneration[]> {
    const client = getGeminiClient();
    if (!client) return [];

    try {
        console.log('[ImagemEducacional] Analisando conteúdo para identificar conceitos visuais...');

        const prompt = `Analise o seguinte conteúdo educacional e identifique de 1 a 3 conceitos-chave que se beneficiariam de uma IMAGEM EDUCACIONAL (infográfico, diagrama, fluxograma, ou ilustração esquemática).

MATÉRIA: ${materia}

CONTEÚDO:
${textoContent.substring(0, 6000)}

CRITÉRIOS para escolher conceitos:
1. Conceitos abstratos que ficam mais claros com visualização
2. Processos ou fluxos que podem ser diagramados
3. Comparações ou classificações que podem virar infográficos
4. Relações entre elementos que podem ser ilustradas
5. EVITE: conceitos muito simples, definições textuais, listas de itens

IMPORTANTE: Retorne APENAS um JSON válido (sem markdown, sem explicação), no formato:
[
  {
    "conceito": "Nome curto do conceito (max 50 chars)",
    "descricao": "Descrição detalhada do que a imagem deve mostrar (100-200 chars)",
    "posicaoNoTexto": "Copie uma frase EXATA do texto onde a imagem deve ser inserida (após essa frase)"
  }
]

Se não houver conceitos adequados para imagens, retorne: []`;

        const response = await client.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });

        const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

        // Extrair JSON da resposta (pode vir com markdown)
        let jsonStr = responseText;
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        const concepts = JSON.parse(jsonStr) as ImageConceptForGeneration[];
        console.log(`[ImagemEducacional] ${concepts.length} conceitos identificados para imagens`);

        return concepts.slice(0, 3); // Máximo 3 imagens por missão

    } catch (error: any) {
        console.error('[ImagemEducacional] Erro ao analisar conceitos:', error.message || error);
        return [];
    }
}

/**
 * Gera imagens educacionais e as incorpora no conteúdo Markdown
 * @param textoContent Conteúdo original em Markdown
 * @param materia Matéria da missão
 * @param missaoId ID da missão
 * @returns Conteúdo atualizado com imagens incorporadas
 */
async function gerarEIncorporarImagensEducacionais(
    textoContent: string,
    materia: string,
    missaoId: string
): Promise<{ textoContent: string; imagensGeradas: string[] }> {
    const imagensGeradas: string[] = [];

    try {
        // 1. Analisar conteúdo para identificar conceitos
        const conceitos = await analisarConceitosParaImagens(textoContent, materia);

        if (conceitos.length === 0) {
            console.log('[ImagemEducacional] Nenhum conceito identificado para imagens');
            return { textoContent, imagensGeradas };
        }

        // 2. Gerar imagens em paralelo (máx 3)
        const imagensPromises = conceitos.map(async (conceito) => {
            const imageUrl = await gerarImagemEducacional(conceito, materia, missaoId);
            return { conceito, imageUrl };
        });

        const resultados = await Promise.all(imagensPromises);

        // 3. Incorporar imagens no conteúdo
        let textoAtualizado = textoContent;

        for (const { conceito, imageUrl } of resultados) {
            if (!imageUrl) continue;

            imagensGeradas.push(imageUrl);

            // Encontrar posição e inserir imagem
            const posicao = conceito.posicaoNoTexto;
            if (posicao && textoAtualizado.includes(posicao)) {
                // Inserir imagem após o trecho especificado
                const imageMarkdown = `\n\n![${conceito.conceito}](${imageUrl})\n*Ilustração: ${conceito.conceito}*\n`;
                textoAtualizado = textoAtualizado.replace(
                    posicao,
                    posicao + imageMarkdown
                );
                console.log(`[ImagemEducacional] Imagem incorporada após: "${posicao.substring(0, 50)}..."`);
            } else {
                // Fallback: inserir antes do resumo ou no final
                const resumoIndex = textoAtualizado.indexOf('## 📝 Resumo');
                const dicasIndex = textoAtualizado.indexOf('## 🎓 Dicas');
                const insertIndex = resumoIndex > 0 ? resumoIndex : (dicasIndex > 0 ? dicasIndex : textoAtualizado.length);

                const imageMarkdown = `\n\n### 🖼️ ${conceito.conceito}\n\n![${conceito.conceito}](${imageUrl})\n*${conceito.descricao}*\n\n`;
                textoAtualizado = textoAtualizado.slice(0, insertIndex) + imageMarkdown + textoAtualizado.slice(insertIndex);
                console.log(`[ImagemEducacional] Imagem incorporada como seção separada: ${conceito.conceito}`);
            }
        }

        console.log(`[ImagemEducacional] ${imagensGeradas.length} imagens incorporadas ao conteúdo`);
        return { textoContent: textoAtualizado, imagensGeradas };

    } catch (error: any) {
        console.error('[ImagemEducacional] Erro geral:', error.message || error);
        return { textoContent, imagensGeradas };
    }
}

// ==================== ENDPOINT PARA GERAÇÃO DE IMAGEM DE CAPA ====================

/**
 * Gera o prompt para imagem de capa foto-realista e cinematográfica
 * Mostra o profissional exercendo o cargo após aprovação, feliz e realizado
 */
function gerarPromptImagemCapa(cargo: string, orgao?: string): { prompt: string; promptUsuario: string } {
    const cargoDescricao = cargo?.toLowerCase() || '';

    // Mapear cargo para descrição visual realista
    let profissaoDescricao = 'profissional de sucesso';
    let protagonista = 'a confident professional in elegant business attire';
    let cenario = 'modern office environment with natural light';
    let atividade = 'working confidently at their desk, reviewing important documents';

    if (cargoDescricao.includes('juiz') || cargoDescricao.includes('magistrad')) {
        profissaoDescricao = 'Juiz(a) de Direito';
        protagonista = 'a distinguished judge wearing black judicial robes';
        cenario = 'elegant courtroom with wooden details and Brazilian flag';
        atividade = 'presiding over the court with wisdom and authority, gavel nearby';
    } else if (cargoDescricao.includes('promotor') || cargoDescricao.includes('procurador')) {
        profissaoDescricao = 'Promotor(a) de Justiça';
        protagonista = 'a sharp prosecutor in formal business attire';
        cenario = 'modern prosecutor office with law books and case files';
        atividade = 'reviewing case documents with focused determination';
    } else if (cargoDescricao.includes('delegado')) {
        profissaoDescricao = 'Delegado(a) de Polícia';
        protagonista = 'a commanding police delegate in formal uniform';
        cenario = 'police station command office with investigation boards';
        atividade = 'coordinating operations with their team, leading with confidence';
    } else if (cargoDescricao.includes('agente') && (cargoDescricao.includes('polícia') || cargoDescricao.includes('policia') || cargoDescricao.includes('civil'))) {
        profissaoDescricao = 'Agente de Polícia Civil';
        protagonista = 'a professional police detective in smart casual attire with badge visible';
        cenario = 'investigation room with evidence boards and computer screens';
        atividade = 'analyzing evidence and solving cases, dedicated to justice';
    } else if (cargoDescricao.includes('policial') || cargoDescricao.includes('prf')) {
        profissaoDescricao = 'Policial Rodoviário Federal';
        protagonista = 'a proud highway patrol officer in PRF uniform';
        cenario = 'scenic Brazilian highway with patrol vehicle nearby';
        atividade = 'ensuring road safety, protecting citizens with pride';
    } else if (cargoDescricao.includes('pf') || cargoDescricao.includes('federal')) {
        profissaoDescricao = 'Policial Federal';
        protagonista = 'an elite federal police officer in official attire';
        cenario = 'federal police headquarters with Brazilian flag';
        atividade = 'working on important federal investigations';
    } else if (cargoDescricao.includes('auditor') || cargoDescricao.includes('fiscal')) {
        profissaoDescricao = 'Auditor(a) Fiscal';
        protagonista = 'a sharp-eyed fiscal auditor in professional suit';
        cenario = 'modern government office with multiple monitors and financial data';
        atividade = 'analyzing complex fiscal data with expertise and precision';
    } else if (cargoDescricao.includes('analista')) {
        profissaoDescricao = 'Analista';
        protagonista = 'a skilled analyst in smart business casual attire';
        cenario = 'contemporary open-plan office with tech equipment';
        atividade = 'working on data analysis with multiple screens, solving complex problems';
    } else if (cargoDescricao.includes('técnico')) {
        profissaoDescricao = 'Técnico(a)';
        protagonista = 'a competent technician in professional attire';
        cenario = 'well-organized government office with documents and equipment';
        atividade = 'efficiently handling administrative tasks with expertise';
    } else if (cargoDescricao.includes('professor') || cargoDescricao.includes('docente')) {
        profissaoDescricao = 'Professor(a)';
        protagonista = 'an inspiring teacher in smart casual academic attire';
        cenario = 'vibrant classroom with engaged students and educational materials';
        atividade = 'teaching with passion, inspiring the next generation';
    } else if (cargoDescricao.includes('médico') || cargoDescricao.includes('perito')) {
        profissaoDescricao = 'Médico(a) Perito(a)';
        protagonista = 'a skilled medical examiner in white lab coat with stethoscope';
        cenario = 'modern medical facility with professional equipment';
        atividade = 'conducting expert medical analysis with precision';
    } else if (cargoDescricao.includes('defensor')) {
        profissaoDescricao = 'Defensor(a) Público(a)';
        protagonista = 'a dedicated public defender in formal legal attire';
        cenario = 'public defenders office with clients and legal files';
        atividade = 'passionately defending citizens rights';
    } else if (cargoDescricao.includes('escrivão') || cargoDescricao.includes('cartório')) {
        profissaoDescricao = 'Escrivão(ã)';
        protagonista = 'a meticulous notary in professional attire';
        cenario = 'elegant notary office with official documents and seals';
        atividade = 'carefully handling important legal documents';
    } else if (cargoDescricao.includes('bombeiro')) {
        profissaoDescricao = 'Bombeiro(a) Militar';
        protagonista = 'a brave firefighter in full uniform';
        cenario = 'fire station with emergency vehicles in background';
        atividade = 'ready for action, a true hero protecting the community';
    } else if (cargoDescricao.includes('militar')) {
        profissaoDescricao = 'Militar';
        protagonista = 'a proud military officer in official uniform';
        cenario = 'military base with national flag visible';
        atividade = 'serving the nation with honor and dedication';
    } else if (cargo) {
        profissaoDescricao = cargo;
    }

    // Prompt amigável para o usuário
    const promptUsuario = `${profissaoDescricao}${orgao ? ` - ${orgao}` : ''} exercendo sua função com realização profissional. Imagem foto-realista, cinematográfica e quadrada.`;

    // Prompt técnico foto-realista
    const prompt = `PHOTOREALISTIC CINEMATIC IMAGE - PERFECT SQUARE FORMAT (1:1 aspect ratio)

Create a beautiful, inspiring photorealistic image showing a person who has just been approved in a competitive exam and is now working happily in their dream job.

THE PROFESSIONAL:
${protagonista}
- Expression: genuinely happy, fulfilled, proud of their achievement
- Natural, authentic smile showing job satisfaction
- Confident but approachable body language
- Age: between 25-40 years old
- Brazilian appearance

THE SCENE:
${cenario}
- The professional is ${atividade}
- Include realistic context and environment details
- Other people or elements that make sense for this profession may appear in the background
- Natural, believable workplace setting

PHOTOGRAPHY STYLE:
- Shot on professional cinema camera (RED or ARRI quality)
- Beautiful natural lighting with soft shadows
- Shallow depth of field with gorgeous bokeh
- Warm, inviting color grading
- Golden hour or soft natural light feeling
- 8K resolution quality
- Magazine cover worthy composition

EMOTIONAL TONE:
- Convey the feeling of "I made it, I achieved my dream"
- Show professional fulfillment and purpose
- Inspire viewers who want to achieve the same success
- The joy of doing meaningful work

${orgao ? `Organization: ${orgao}` : ''}
${cargo ? `Position: ${cargo}` : ''}

CRITICAL REQUIREMENTS:
- ABSOLUTELY NO TEXT of any kind in the image
- NO titles, watermarks, logos, or written words
- NO floating text or captions
- 100% PHOTOREALISTIC - must look like a real photograph
- PERFECTLY SQUARE composition (1:1 ratio)
- The image must tell the story of success without any text`;

    return { prompt, promptUsuario };
}

app.post('/api/preparatorio/gerar-imagem-capa', async (req, res) => {
    try {
        const { cargo, orgao, prompt: customPrompt } = req.body;

        if (!cargo && !customPrompt) {
            return res.status(400).json({
                success: false,
                error: 'Cargo ou prompt personalizado é obrigatório',
            });
        }

        const client = getGeminiClient();
        if (!client) {
            return res.status(500).json({
                success: false,
                error: 'API do Gemini não configurada',
            });
        }

        console.log(`[ImagemCapa API] Gerando imagem para cargo: ${cargo}`);

        // Usar prompt customizado ou gerar baseado no cargo
        const promptFinal = customPrompt || gerarPromptImagemCapa(cargo, orgao).prompt;

        // Gerar imagem com timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Timeout: geração de imagem demorou mais de 60 segundos')), 60000);
        });

        const generatePromise = client.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: promptFinal,
            config: {
                responseModalities: ['image', 'text'],
            },
        });

        const response = await Promise.race([generatePromise, timeoutPromise]);

        // Extrair imagem da resposta
        const parts = response.candidates?.[0]?.content?.parts || [];
        let imageData: string | null = null;

        for (const part of parts) {
            if (part.inlineData?.data) {
                imageData = part.inlineData.data;
                break;
            }
        }

        if (!imageData) {
            return res.status(500).json({
                success: false,
                error: 'Não foi possível gerar a imagem',
            });
        }

        console.log('[ImagemCapa API] Imagem estilo Netflix gerada, comprimindo...');

        // Converter base64 para buffer
        const rawBuffer = Buffer.from(imageData, 'base64');
        console.log(`[ImagemCapa API] Tamanho original: ${(rawBuffer.length / 1024).toFixed(1)}KB`);

        // Comprimir imagem para max 400KB, formato WebP
        const compressed = await compressImage(rawBuffer, {
            maxSizeKB: 400,
            maxWidth: 1200,
            format: 'webp',
        });

        console.log(`[ImagemCapa API] Comprimido: ${(compressed.compressedSize / 1024).toFixed(1)}KB (${compressed.width}x${compressed.height})`);

        // Upload para Supabase Storage
        const fileName = `capa-ai-${Date.now()}-${Math.random().toString(36).substring(2)}${getFileExtension(compressed.format)}`;

        const { error: uploadError } = await supabase.storage
            .from('preparatorios')
            .upload(fileName, compressed.buffer, {
                contentType: getContentType(compressed.format),
                upsert: true,
            });

        if (uploadError) {
            console.error('[ImagemCapa API] Erro no upload:', uploadError);
            return res.status(500).json({
                success: false,
                error: 'Erro ao fazer upload da imagem',
            });
        }

        // Obter URL pública
        const { data: publicUrlData } = supabase.storage
            .from('preparatorios')
            .getPublicUrl(fileName);

        const imageUrl = publicUrlData?.publicUrl || null;
        console.log(`[ImagemCapa API] Sucesso! URL: ${imageUrl}`);

        res.json({
            success: true,
            imageUrl,
        });

    } catch (error: any) {
        console.error('[ImagemCapa API] Erro:', error.message || error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao gerar imagem',
        });
    }
});

// Endpoint para gerar apenas o prompt (sem gerar a imagem)
app.post('/api/preparatorio/gerar-prompt-imagem', (req, res) => {
    const { cargo, orgao } = req.body;

    if (!cargo) {
        return res.status(400).json({
            success: false,
            error: 'Cargo é obrigatório',
        });
    }

    const { promptUsuario } = gerarPromptImagemCapa(cargo, orgao);

    res.json({
        success: true,
        prompt: promptUsuario,
    });
});

// ==================== BUSCA DE LOGO DO ÓRGÃO ====================

/**
 * Endpoint para buscar ou gerar logo de um órgão
 * Estratégia: Google Custom Search -> Imagen 3 (fallback)
 */
app.post('/api/preparatorio/buscar-logo', async (req, res) => {
    try {
        const { orgao } = req.body;

        if (!orgao || orgao.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Nome do órgão é obrigatório',
            });
        }

        console.log(`[BuscarLogo API] Buscando logo para: ${orgao}`);

        const result = await buscarOuGerarLogo(orgao);

        if (result.success) {
            console.log(`[BuscarLogo API] Sucesso! Fonte: ${result.source}, URL: ${result.logoUrl}`);
            res.json({
                success: true,
                logoUrl: result.logoUrl,
                source: result.source,
            });
        } else {
            console.log(`[BuscarLogo API] Falha: ${result.error}`);
            res.status(500).json({
                success: false,
                error: result.error || 'Erro ao buscar logo',
            });
        }
    } catch (error: any) {
        console.error('[BuscarLogo API] Erro:', error.message || error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao buscar logo',
        });
    }
});

// Audio Generation Endpoints using Gemini TTS

// Single speaker audio explanation
app.post('/api/audio/explanation', async (req, res) => {
    try {
        const { title, content } = req.body;
        const cacheKey = title || 'geral';

        // Check cache first
        console.log(`[Audio] Checking cache for explanation: "${cacheKey}"`);
        const cached = await getFromCache(cacheKey, 'explanation');

        if (cached) {
            console.log(`[Cache] HIT! Returning cached explanation for "${cacheKey}" (accessed ${cached.access_count} times)`);
            // Simulate generation delay so user thinks it's generating
            await simulateGenerationDelay();
            res.json({
                success: true,
                audioData: cached.audio_data,
                text: cached.script_text,
                fromCache: true
            });
            return;
        }

        console.log(`[Cache] MISS - Generating new explanation for "${cacheKey}"`);

        const client = getGeminiClient();
        if (!client) {
            res.status(500).json({ success: false, error: "API key not configured" });
            return;
        }

        // First, generate a concise explanation text
        const textResponse = await client.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Você é um professor didático. Crie uma explicação ORAL concisa (máximo 2 minutos de fala) sobre o seguinte tema para um aluno de concurso público:

Tema: ${title}
Conteúdo base: ${content?.substring(0, 2000) || 'Explicação geral do tema'}

Regras:
- Use linguagem conversacional, como se estivesse falando diretamente com o aluno
- Seja objetivo e direto
- Não use formatação markdown, bullets ou símbolos
- Evite frases muito longas
- Limite a 300 palavras no máximo`
        });

        const explanationText = textResponse.text || '';
        console.log(`[Audio] Generated text (${explanationText.length} chars), now generating TTS...`);

        // Generate TTS audio
        const audioResponse = await client.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: `Fale de forma clara, amigável e didática em português brasileiro: ${explanationText}`,
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: 'Kore'
                        }
                    }
                }
            }
        });

        // Extract audio data from response
        const audioData = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!audioData) {
            console.error('[Audio] No audio data in response');
            res.status(500).json({ success: false, error: "Failed to generate audio" });
            return;
        }

        console.log(`[Audio] Successfully generated audio (${audioData.length} bytes base64)`);

        // Save to cache for future requests
        await saveToCache(cacheKey, 'explanation', audioData, explanationText);

        res.json({
            success: true,
            audioData: audioData,
            text: explanationText,
            fromCache: false
        });

    } catch (error: any) {
        console.error("[Audio] Error generating explanation:", error);
        res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
});

// Multi-speaker podcast generation
app.post('/api/audio/podcast', async (req, res) => {
    try {
        const { title, content } = req.body;
        const cacheKey = title || 'geral';

        // Check cache first
        console.log(`[Podcast] Checking cache for podcast: "${cacheKey}"`);
        const cached = await getFromCache(cacheKey, 'podcast');

        if (cached) {
            console.log(`[Cache] HIT! Returning cached podcast for "${cacheKey}" (accessed ${cached.access_count} times)`);
            // Simulate generation delay so user thinks it's generating
            await simulateGenerationDelay();
            res.json({
                success: true,
                audioData: cached.audio_data,
                script: cached.script_text,
                fromCache: true
            });
            return;
        }

        console.log(`[Cache] MISS - Generating new podcast for "${cacheKey}"`);

        const client = getGeminiClient();
        if (!client) {
            res.status(500).json({ success: false, error: "API key not configured" });
            return;
        }

        // First, generate a podcast script with two speakers
        const scriptResponse = await client.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Crie um script de podcast CURTO (máximo 2-3 minutos) com dois apresentadores discutindo o seguinte tema de concurso público:

Tema: ${title}
Conteúdo base: ${content?.substring(0, 2000) || 'Discussão geral do tema'}

Formato OBRIGATÓRIO:
- Use EXATAMENTE este formato para cada fala: "Ana: [fala]" ou "Carlos: [fala]"
- Ana é a apresentadora principal, didática e entusiasmada
- Carlos faz perguntas interessantes e traz exemplos práticos
- Mantenha as falas curtas e naturais
- Não use formatação markdown
- Máximo 400 palavras total

Exemplo:
Ana: Olá pessoal! Hoje vamos falar sobre um tema super importante.
Carlos: Verdade, Ana! Esse assunto cai muito em provas.
Ana: Exatamente! Vamos explicar de forma simples...`
        });

        const scriptText = scriptResponse.text || '';
        console.log(`[Podcast] Generated script (${scriptText.length} chars), now generating multi-speaker TTS...`);

        // Generate multi-speaker TTS audio
        const audioResponse = await client.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: scriptText,
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            {
                                speaker: 'Ana',
                                voiceConfig: {
                                    prebuiltVoiceConfig: {
                                        voiceName: 'Aoede'
                                    }
                                }
                            },
                            {
                                speaker: 'Carlos',
                                voiceConfig: {
                                    prebuiltVoiceConfig: {
                                        voiceName: 'Charon'
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        });

        // Extract audio data from response
        const audioData = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!audioData) {
            console.error('[Podcast] No audio data in response');
            res.status(500).json({ success: false, error: "Failed to generate podcast audio" });
            return;
        }

        console.log(`[Podcast] Successfully generated podcast audio (${audioData.length} bytes base64)`);

        // Save to cache for future requests
        await saveToCache(cacheKey, 'podcast', audioData, scriptText);

        res.json({
            success: true,
            audioData: audioData,
            script: scriptText,
            fromCache: false
        });

    } catch (error: any) {
        console.error("[Podcast] Error generating podcast:", error);
        res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
});

// ==================== ENDPOINTS DE GERAÇÃO DE CONTEÚDO DE MISSÃO ====================

// Endpoint para gerar conteúdo de texto para uma missão
app.post('/api/agents/contentGeneratorAgent/generate', async (req, res) => {
    try {
        const { messages } = req.body;

        const agent = mastra.getAgent("contentGeneratorAgent");

        if (!agent) {
            res.status(500).json({ success: false, error: "Agent not found" });
            return;
        }

        console.log(`[ContentGenerator] Generating content...`);

        const result = await agent.generate(messages);

        console.log(`[ContentGenerator] Content generated (${result.text?.length || 0} chars)`);

        res.json({
            success: true,
            text: result.text,
            content: result.text,
        });

    } catch (error: any) {
        console.error("[ContentGenerator] Error:", error);
        res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
});

// Endpoint para adaptar texto para áudio
app.post('/api/agents/audioScriptAgent/generate', async (req, res) => {
    try {
        const { messages } = req.body;

        const agent = mastra.getAgent("audioScriptAgent");

        if (!agent) {
            res.status(500).json({ success: false, error: "Agent not found" });
            return;
        }

        console.log(`[AudioScript] Adapting text for audio...`);

        const result = await agent.generate(messages);

        console.log(`[AudioScript] Script generated (${result.text?.length || 0} chars)`);

        res.json({
            success: true,
            text: result.text,
            content: result.text,
        });

    } catch (error: any) {
        console.error("[AudioScript] Error:", error);
        res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
});

// Endpoint para gerar resumo Reta Final (conteúdo condensado)
app.post('/api/agents/contentSummaryAgent/generate', async (req, res) => {
    try {
        const { messages } = req.body;

        const agent = mastra.getAgent("contentSummaryAgent");

        if (!agent) {
            res.status(500).json({ success: false, error: "Agent not found" });
            return;
        }

        console.log(`[ContentSummary] Generating summary...`);

        const result = await agent.generate(messages);

        console.log(`[ContentSummary] Summary generated (${result.text?.length || 0} chars)`);

        res.json({
            success: true,
            text: result.text,
            content: result.text,
        });

    } catch (error: any) {
        console.error("[ContentSummary] Error:", error);
        res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
});

// Endpoint para gerar letras de música educativa
app.post('/api/music/generate-lyrics', async (req, res) => {
    try {
        const { materia, assunto, cargo, estilo, customTopic } = req.body;

        if (!materia && !customTopic) {
            res.status(400).json({ error: "Informe uma matéria ou tópico personalizado" });
            return;
        }

        // Build the prompt
        const estiloLabel = getEstiloLabel(estilo);
        let prompt = `Crie uma letra de música educativa no estilo **${estiloLabel}**.

## Tema
`;

        if (materia) {
            prompt += `- **Matéria**: ${materia}\n`;
        }
        if (assunto) {
            prompt += `- **Assunto**: ${assunto}\n`;
        }
        if (cargo) {
            prompt += `- **Cargo alvo**: ${cargo}\n`;
        }
        if (customTopic) {
            prompt += `\n## Instruções Adicionais\n${customTopic}\n`;
        }

        prompt += `
## Objetivo
A música deve ajudar estudantes a memorizar os conceitos mais importantes deste tema de forma criativa e envolvente. A letra deve ser otimizada para uso em geradores de música como Suno e Udio.

Gere APENAS a letra da música, sem explicações adicionais.`;

        console.log(`[MusicLyrics] Generating lyrics for: ${materia || customTopic} (${estiloLabel})`);

        const result = await musicLyricsAgent.generate([
            { role: "user", content: prompt }
        ]);

        console.log(`[MusicLyrics] Lyrics generated (${result.text?.length || 0} chars)`);

        res.json({
            success: true,
            lyrics: result.text,
        });

    } catch (error: any) {
        console.error("[MusicLyrics] Error:", error);
        res.status(500).json({ error: error.message || "Erro ao gerar letra" });
    }
});

// Endpoint para gerar roteiro de podcast educativo
app.post('/api/music/generate-podcast-script', async (req, res) => {
    try {
        const { materia, assunto, cargo, duracao, customTopic } = req.body;

        if (!materia && !customTopic) {
            res.status(400).json({ error: "Informe uma matéria ou tópico personalizado" });
            return;
        }

        // Validate duracao
        const validDurations = [3, 5, 10, 15, 20, 30];
        const selectedDuration = validDurations.includes(duracao) ? duracao : 10;

        // Build the prompt
        let prompt = `Crie um roteiro completo de podcast educativo para o **Ouse Passar Podcast**.

## Configurações
- **Duração aproximada**: ${selectedDuration} minutos

## Tema
`;

        if (materia) {
            prompt += `- **Matéria**: ${materia}\n`;
        }
        if (assunto) {
            prompt += `- **Assunto**: ${assunto}\n`;
        }
        if (cargo) {
            prompt += `- **Cargo alvo**: ${cargo}\n`;
        }
        if (customTopic) {
            prompt += `\n## Instruções Adicionais\n${customTopic}\n`;
        }

        prompt += `
## Objetivo
O roteiro deve ser educativo, ajudando os ouvintes a memorizar os conceitos mais importantes deste tema para passar em concursos públicos. Use a dinâmica entre Diego (técnico e detalhista) e Glau (dinâmica e questionadora) para criar uma conversa natural e envolvente.

## IMPORTANTE
- Siga EXATAMENTE a estrutura de abertura, desenvolvimento e encerramento definida nas instruções
- Use APENAS o formato **[NOME]:** para as falas
- NÃO inclua indicações de som, música ou ações
- A duração de ${selectedDuration} minutos corresponde a aproximadamente ${selectedDuration * 150} palavras

Gere o roteiro completo.`;

        console.log(`[PodcastScript] Generating script for: ${materia || customTopic} (${selectedDuration}min)`);

        const result = await podcastScriptAgent.generate([
            { role: "user", content: prompt }
        ]);

        console.log(`[PodcastScript] Script generated (${result.text?.length || 0} chars)`);

        res.json({
            success: true,
            script: result.text,
            duracao: selectedDuration,
        });

    } catch (error: any) {
        console.error("[PodcastScript] Error:", error);
        res.status(500).json({ error: error.message || "Erro ao gerar roteiro" });
    }
});

// Endpoint para gerar áudio do podcast usando Gemini TTS
app.post('/api/music/generate-podcast-audio', async (req, res) => {
    try {
        const { script } = req.body;

        if (!script) {
            res.status(400).json({ error: "Roteiro não fornecido" });
            return;
        }

        console.log(`[PodcastTTS] Generating audio for script (${script.length} chars)`);

        // Initialize Gemini client
        const genai = new GoogleGenAI({
            apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.VITE_GEMINI_API_KEY
        });

        // Clean and format the script for TTS
        // Remove markdown formatting but keep speaker names
        let cleanScript = script
            .replace(/\*\*\[DIEGO\]\:\*\*/gi, 'Diego:')
            .replace(/\*\*\[GLAU\]\:\*\*/gi, 'Glau:')
            .replace(/\[DIEGO\]:/gi, 'Diego:')
            .replace(/\[GLAU\]:/gi, 'Glau:')
            .replace(/\*\*/g, '') // Remove bold markdown
            .replace(/\*/g, '')   // Remove italic markdown
            .replace(/#{1,6}\s/g, '') // Remove headers
            .trim();

        // Generate audio using Gemini TTS with multi-speaker
        const response = await genai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: cleanScript }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            {
                                speaker: 'Diego',
                                voiceConfig: {
                                    prebuiltVoiceConfig: { voiceName: 'Charon' } // Male voice (deep, warm)
                                }
                            },
                            {
                                speaker: 'Glau',
                                voiceConfig: {
                                    prebuiltVoiceConfig: { voiceName: 'Kore' } // Female voice (bright, upbeat)
                                }
                            }
                        ]
                    }
                }
            }
        });

        // Extract audio data and mimeType from response
        const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        const audioData = inlineData?.data;
        const responseMimeType = inlineData?.mimeType || 'audio/L16;rate=24000';

        if (!audioData) {
            throw new Error("Nenhum áudio foi gerado pela API");
        }

        console.log(`[PodcastTTS] Audio generated successfully (${audioData.length} bytes base64, mimeType: ${responseMimeType})`);

        // Convert PCM to WAV if needed
        // Gemini TTS returns raw PCM audio (linear16 at 24kHz)
        // We need to add WAV headers to make it playable in browsers
        const pcmBuffer = Buffer.from(audioData, 'base64');

        // Create WAV header
        const sampleRate = 24000; // Gemini TTS uses 24kHz
        const numChannels = 1;    // Mono audio
        const bitsPerSample = 16; // 16-bit PCM
        const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
        const blockAlign = numChannels * (bitsPerSample / 8);
        const dataSize = pcmBuffer.length;
        const fileSize = 36 + dataSize;

        // WAV header is 44 bytes
        const wavHeader = Buffer.alloc(44);

        // RIFF chunk descriptor
        wavHeader.write('RIFF', 0);                      // ChunkID
        wavHeader.writeUInt32LE(fileSize, 4);            // ChunkSize
        wavHeader.write('WAVE', 8);                      // Format

        // fmt sub-chunk
        wavHeader.write('fmt ', 12);                     // Subchunk1ID
        wavHeader.writeUInt32LE(16, 16);                 // Subchunk1Size (16 for PCM)
        wavHeader.writeUInt16LE(1, 20);                  // AudioFormat (1 for PCM)
        wavHeader.writeUInt16LE(numChannels, 22);        // NumChannels
        wavHeader.writeUInt32LE(sampleRate, 24);         // SampleRate
        wavHeader.writeUInt32LE(byteRate, 28);           // ByteRate
        wavHeader.writeUInt16LE(blockAlign, 32);         // BlockAlign
        wavHeader.writeUInt16LE(bitsPerSample, 34);      // BitsPerSample

        // data sub-chunk
        wavHeader.write('data', 36);                     // Subchunk2ID
        wavHeader.writeUInt32LE(dataSize, 40);           // Subchunk2Size

        // Combine header and PCM data
        const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);
        const wavBase64 = wavBuffer.toString('base64');

        console.log(`[PodcastTTS] WAV file created (${wavBuffer.length} bytes total)`);

        // Return the audio as base64 WAV
        res.json({
            success: true,
            audio: wavBase64,
            mimeType: 'audio/wav',
            format: 'base64'
        });

    } catch (error: any) {
        console.error("[PodcastTTS] Error:", error);
        res.status(500).json({ error: error.message || "Erro ao gerar áudio" });
    }
});

// Helper function to get estilo label
function getEstiloLabel(estilo: string): string {
    const estilos: Record<string, string> = {
        pop: 'Pop Brasileiro',
        rock: 'Rock Nacional',
        sertanejo: 'Sertanejo Universitário',
        funk: 'Funk Melody',
        pagode: 'Pagode',
        samba: 'Samba',
        forro: 'Forró',
        mpb: 'MPB',
        bossa_nova: 'Bossa Nova',
        axe: 'Axé',
        rap: 'Rap/Hip-Hop Brasileiro',
        trap: 'Trap Brasileiro',
        reggae: 'Reggae',
        gospel: 'Gospel/Música Cristã',
        country: 'Country/Música Caipira',
        folk: 'Folk',
        indie: 'Indie Pop',
        electronic: 'Eletrônica/EDM',
        house: 'House',
        jazz: 'Jazz',
        blues: 'Blues',
        classical: 'Clássica Contemporânea',
        opera: 'Ópera Pop',
        musical: 'Musical/Teatro',
        infantil: 'Música Infantil',
        jingle: 'Jingle/Comercial',
    };
    return estilos[estilo] || 'Pop Brasileiro';
}

// ==================== SUNO API ENDPOINTS ====================

// Endpoint de callback para receber notificações do Suno
app.post('/api/music/suno-callback', async (req, res) => {
    try {
        console.log('[Music] Suno callback received:', JSON.stringify(req.body, null, 2));

        // O Suno envia os dados da música gerada aqui
        // Podemos salvar no banco de dados ou notificar o frontend via WebSocket

        res.json({ success: true, message: 'Callback received' });
    } catch (error: any) {
        console.error('[Music] Suno callback error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint para gerar música usando Suno API
app.post('/api/music/generate-music', async (req, res) => {
    try {
        const { lyrics, style, title, model, instrumental } = req.body;

        if (!lyrics || !style || !title) {
            res.status(400).json({
                success: false,
                error: "Parâmetros obrigatórios: lyrics, style, title"
            });
            return;
        }

        console.log(`[Music] Generating music with Suno: "${title}"`);

        // URL de callback - usa MASTRA_PUBLIC_URL em produção ou localhost em dev
        const baseUrl = process.env.MASTRA_PUBLIC_URL || 'http://localhost:4000';
        const callbackUrl = `${baseUrl}/api/music/suno-callback`;

        const taskId = await sunoService.generateMusic({
            lyrics,
            style,
            title,
            model: model || 'V5',
            instrumental: instrumental || false,
            callbackUrl,
        });

        res.json({
            success: true,
            taskId,
            message: "Geração iniciada! Use o taskId para verificar o status."
        });

    } catch (error: any) {
        console.error("[Music] Suno generation error:", error);

        // Handle specific error cases
        if (error.message?.includes('429')) {
            res.status(429).json({
                success: false,
                error: "Créditos insuficientes na conta Suno"
            });
            return;
        }

        if (error.message?.includes('SUNO_API_KEY')) {
            res.status(500).json({
                success: false,
                error: "API key do Suno não configurada no servidor"
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: error.message || "Erro ao gerar música"
        });
    }
});

// Endpoint para verificar status da geração
app.get('/api/music/status/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;

        if (!taskId) {
            res.status(400).json({
                success: false,
                error: "taskId é obrigatório"
            });
            return;
        }

        const statusData = await sunoService.getTaskStatus(taskId);

        res.json({
            success: true,
            taskId: statusData.taskId,
            status: statusData.status,
            statusLabel: sunoService.getStatusLabel(statusData.status),
            isComplete: sunoService.isTaskComplete(statusData.status),
            isFailed: sunoService.isTaskFailed(statusData.status),
            tracks: statusData.response?.sunoData || [],
            errorMessage: statusData.errorMessage,
        });

    } catch (error: any) {
        console.error("[Music] Status check error:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Erro ao verificar status"
        });
    }
});

// Endpoint para verificar créditos disponíveis
app.get('/api/music/credits', async (req, res) => {
    try {
        const credits = await sunoService.getCredits();

        res.json({
            success: true,
            credits,
        });

    } catch (error: any) {
        console.error("[Music] Credits check error:", error);

        if (error.message?.includes('SUNO_API_KEY')) {
            res.status(500).json({
                success: false,
                error: "API key do Suno não configurada"
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: error.message || "Erro ao verificar créditos"
        });
    }
});

// ==================== END SUNO API ENDPOINTS ====================

// Endpoint para gerar TTS e fazer upload para Supabase Storage
app.post('/api/tts/generate', async (req, res) => {
    try {
        const { text, languageCode, voiceName, missaoId } = req.body;

        if (!text || text.length < 10) {
            res.status(400).json({ success: false, error: "Texto muito curto" });
            return;
        }

        console.log(`[TTS] Generating audio for mission ${missaoId} (${text.length} chars)...`);

        const client = getGeminiClient();
        if (!client) {
            res.status(500).json({ success: false, error: "API key not configured" });
            return;
        }

        // Sem limite de texto - cliente tem timeout de 5 minutos para aguardar
        // Generate TTS audio using Gemini TTS
        // IMPORTANTE: Não incluir instruções no texto, apenas o conteúdo a ser narrado
        // As instruções fazem o modelo ler "Leia o seguinte texto..." no áudio
        const audioResponse = await client.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{
                parts: [{
                    text: text
                }]
            }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: voiceName || 'Kore'
                        }
                    }
                }
            }
        });

        // Extract audio data from response
        const audioData = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!audioData) {
            console.error('[TTS] No audio data in response');
            res.status(500).json({ success: false, error: "Failed to generate audio" });
            return;
        }

        console.log(`[TTS] Audio generated (${audioData.length} bytes base64)`);

        // Convert raw PCM to WAV format
        // Gemini TTS returns raw PCM data at 24000 Hz, 16-bit, mono
        const pcmBuffer = Buffer.from(audioData, 'base64');
        const sampleRate = 24000;
        const numChannels = 1;
        const bitsPerSample = 16;
        const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
        const blockAlign = numChannels * (bitsPerSample / 8);

        // Create WAV header (44 bytes)
        const wavHeader = Buffer.alloc(44);
        wavHeader.write('RIFF', 0);                              // ChunkID
        wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);       // ChunkSize
        wavHeader.write('WAVE', 8);                              // Format
        wavHeader.write('fmt ', 12);                             // Subchunk1ID
        wavHeader.writeUInt32LE(16, 16);                         // Subchunk1Size (PCM = 16)
        wavHeader.writeUInt16LE(1, 20);                          // AudioFormat (PCM = 1)
        wavHeader.writeUInt16LE(numChannels, 22);                // NumChannels
        wavHeader.writeUInt32LE(sampleRate, 24);                 // SampleRate
        wavHeader.writeUInt32LE(byteRate, 28);                   // ByteRate
        wavHeader.writeUInt16LE(blockAlign, 32);                 // BlockAlign
        wavHeader.writeUInt16LE(bitsPerSample, 34);              // BitsPerSample
        wavHeader.write('data', 36);                             // Subchunk2ID
        wavHeader.writeUInt32LE(pcmBuffer.length, 40);           // Subchunk2Size

        // Combine header and PCM data
        const audioBuffer = Buffer.concat([wavHeader, pcmBuffer]);
        console.log(`[TTS] WAV file created: ${audioBuffer.length} bytes (header: 44, pcm: ${pcmBuffer.length})`);

        // Upload to Supabase Storage
        const fileName = `missao-${missaoId}-${Date.now()}.wav`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('missao-audios')
            .upload(fileName, audioBuffer, {
                contentType: 'audio/wav',
                upsert: true,
            });

        if (uploadError) {
            console.error('[TTS] Upload error:', uploadError);
            // Retornar base64 como fallback
            res.json({
                success: true,
                audioData: audioData,
                audioUrl: null,
            });
            return;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from('missao-audios')
            .getPublicUrl(fileName);

        const audioUrl = publicUrlData?.publicUrl || null;
        console.log(`[TTS] Audio uploaded: ${audioUrl}`);

        res.json({
            success: true,
            audioUrl,
            audioData,
        });

    } catch (error: any) {
        console.error("[TTS] Error:", error);
        res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
});

// ==================== SISTEMA DE GERAÇÃO DE CONTEÚDO EM BACKGROUND ====================

interface QuestaoFormatada {
    numero: number;
    enunciado: string;
    alternativas: { letter: string; text: string }[];
    gabarito: string;
    comentario: string;
    banca: string;
    ano: number;
}

// Helper: Buscar info da missão
async function getMissaoInfo(missaoId: string) {
    const { data, error } = await supabase
        .from('missoes')
        .select('*, rodadas(preparatorio_id)')
        .eq('id', missaoId)
        .single();

    if (error) {
        console.error('[BackgroundContent] Erro ao buscar missão:', error);
        return null;
    }
    return data;
}

// Helper: Buscar itens do edital vinculados à missão
async function getMissaoEditalItems(missaoId: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('missao_edital_items')
        .select('edital_item_id')
        .eq('missao_id', missaoId);

    if (error) {
        console.warn('[BackgroundContent] Erro ao buscar itens do edital:', error);
        return [];
    }
    return (data || []).map(d => d.edital_item_id);
}

// Helper: Buscar títulos dos itens do edital
async function getEditalItemsTitulos(itemIds: string[]): Promise<string[]> {
    if (itemIds.length === 0) return [];

    const { data, error } = await supabase
        .from('edital_verticalizado_items')
        .select('titulo')
        .in('id', itemIds);

    if (error) {
        console.warn('[BackgroundContent] Erro ao buscar títulos:', error);
        return [];
    }
    return (data || []).map(d => d.titulo);
}

// Helper: Buscar filtros da missão
async function getMissaoFiltros(missaoId: string) {
    const { data, error } = await supabase
        .from('missao_questao_filtros')
        .select('filtros')
        .eq('missao_id', missaoId)
        .single();

    if (error) return null;
    return data?.filtros || null;
}

// Helper: Parse alternativas de questão
function parseAlternativas(alternativas: any): { letter: string; text: string }[] {
    if (!alternativas) return [];
    if (Array.isArray(alternativas)) {
        return alternativas.map((alt: any, idx: number) => {
            if (typeof alt === 'string') {
                return { letter: String.fromCharCode(65 + idx), text: alt };
            }
            return { letter: alt.letter || String.fromCharCode(65 + idx), text: alt.text || alt };
        });
    }
    if (typeof alternativas === 'object') {
        return Object.entries(alternativas).map(([letter, text]) => ({
            letter: letter.toUpperCase(),
            text: String(text)
        }));
    }
    return [];
}

// Helper: Buscar questões do banco de scrapping
async function buscarQuestoesScrapping(
    filtros: any,
    editalTitulos: string[],
    limite: number = 20
): Promise<QuestaoFormatada[]> {
    const questoes: any[] = [];

    // Extrair palavras-chave dos títulos do edital
    const keywords = editalTitulos
        .flatMap(t => t.split(/[\s,.:;]+/))
        .filter(w => w.length > 4)
        .map(w => w.toLowerCase().replace(/[^a-záéíóúãõâêîôûç]/gi, ''));

    // Tentar buscar por palavras-chave
    for (const keyword of keywords.slice(0, 5)) {
        if (questoes.length >= limite) break;

        const { data, error } = await questionsDb
            .from('questoes_concurso')
            .select('*')
            .eq('ativo', true) // Apenas questões ativas
            .ilike('assunto', `%${keyword}%`)
            .limit(limite);

        if (!error && data) {
            for (const q of data) {
                if (questoes.length >= limite) break;
                if (!questoes.find(existing => existing.id === q.id)) {
                    questoes.push(q);
                }
            }
        }
    }

    // Fallback: buscar por banca + matéria se tiver nos filtros (DEVE manter filtro por tópico)
    if (questoes.length < limite && filtros?.bancas?.length > 0 && editalTitulos.length > 0) {
        // Usar o primeiro título como filtro de matéria para garantir relevância
        const materiaKeyword = editalTitulos[0]
            .toLowerCase()
            .replace(/[^a-záéíóúãõâêîôûç\s]/gi, '')
            .trim()
            .split(' ')[0]; // Pegar primeira palavra significativa

        if (materiaKeyword && materiaKeyword.length > 3) {
            const { data, error } = await questionsDb
                .from('questoes_concurso')
                .select('*')
                .eq('ativo', true) // Apenas questões ativas
                .in('banca', filtros.bancas)
                .or(`assunto.ilike.%${materiaKeyword}%,disciplina.ilike.%${materiaKeyword}%,materia.ilike.%${materiaKeyword}%`)
                .limit(limite - questoes.length);

            if (!error && data) {
                for (const q of data) {
                    if (!questoes.find(existing => existing.id === q.id)) {
                        questoes.push(q);
                    }
                }
            }
        }
    }

    // Formatar questões
    return questoes.slice(0, limite).map((q, i) => ({
        numero: i + 1,
        enunciado: q.enunciado || '',
        alternativas: parseAlternativas(q.alternativas),
        gabarito: q.gabarito || '',
        comentario: q.comentario || 'Sem comentário disponível',
        banca: q.banca || 'Desconhecida',
        ano: q.ano || 2024,
    }));
}

// Função auxiliar: Gerar resumo Reta Final a partir do conteúdo existente
async function gerarResumoRetaFinal(missaoId: string, textoContent: string, diasParaProva: number = 30): Promise<void> {
    console.log(`[RetaFinal] Gerando resumo para missão ${missaoId} (${diasParaProva} dias para prova)...`);

    try {
        // Verificar se já existe resumo
        const { data: existing } = await supabase
            .from('missao_conteudos')
            .select('reta_final_status, reta_final_content')
            .eq('missao_id', missaoId)
            .maybeSingle();

        if (existing?.reta_final_status === 'completed' && existing?.reta_final_content) {
            console.log(`[RetaFinal] Resumo já existe para missão ${missaoId}`);
            return;
        }

        // Marcar como gerando
        await supabase
            .from('missao_conteudos')
            .update({ reta_final_status: 'generating' })
            .eq('missao_id', missaoId);

        // 1. Gerar resumo com contentSummaryAgent
        const summaryAgent = mastra.getAgent("contentSummaryAgent");
        if (!summaryAgent) {
            console.warn('[RetaFinal] contentSummaryAgent não encontrado');
            return;
        }

        const summaryPrompt = `
## Conteúdo Original para Resumir

${textoContent}

---

## Contexto
- **Dias para a prova:** ${diasParaProva} dias
- ${diasParaProva <= 7 ? 'URGÊNCIA MÁXIMA - Foque apenas no essencial!' : diasParaProva <= 14 ? 'Urgência alta - Resumo focado nos pontos principais.' : 'Resumo com boa cobertura dos conceitos.'}

Crie um resumo Reta Final seguindo a estrutura e regras especificadas.
`;

        const summaryResult = await summaryAgent.generate([{ role: 'user', content: summaryPrompt }]);
        let resumoContent = summaryResult.text || '';

        // Remover code fences se a IA retornar envolvido em ```markdown ... ```
        resumoContent = resumoContent
            .replace(/^```(?:markdown)?\s*\n?/i, '')
            .replace(/\n?```\s*$/i, '')
            .trim();

        console.log(`[RetaFinal] Resumo gerado (${resumoContent.length} chars) para missão ${missaoId}`);

        // 2. Gerar áudio do resumo (opcional, se o resumo for grande o suficiente)
        let audioUrl: string | null = null;
        console.log(`[RetaFinal] Verificando áudio: resumo tem ${resumoContent.length} chars`);
        if (resumoContent.length > 200) {
            try {
                const audioSummaryAgent = mastra.getAgent("audioSummaryAgent");
                if (!audioSummaryAgent) {
                    console.warn('[RetaFinal] audioSummaryAgent não encontrado');
                } else {
                    console.log('[RetaFinal] Gerando roteiro de áudio...');
                    const audioResult = await audioSummaryAgent.generate([{
                        role: 'user',
                        content: `Adapte este resumo Reta Final para narração rápida em áudio:\n\n${resumoContent}`
                    }]);
                    const roteiro = audioResult.text || '';
                    console.log(`[RetaFinal] Roteiro gerado: ${roteiro.length} chars`);

                    if (roteiro.length > 100) {
                        const client = getGeminiClient();
                        if (!client) {
                            console.warn('[RetaFinal] Gemini client não disponível');
                        } else {
                            console.log('[RetaFinal] Gerando TTS...');
                            const audioResponse = await client.models.generateContent({
                                model: 'gemini-2.5-flash-preview-tts',
                                contents: [{ parts: [{ text: roteiro }] }],
                                config: {
                                    responseModalities: ['AUDIO'],
                                    speechConfig: {
                                        voiceConfig: {
                                            prebuiltVoiceConfig: { voiceName: 'Kore' }
                                        }
                                    }
                                }
                            });

                            const audioData = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                            console.log(`[RetaFinal] TTS response received, audioData: ${audioData ? 'presente' : 'ausente'}`);
                            if (audioData) {
                                const pcmBuffer = Buffer.from(audioData, 'base64');
                                const wavHeader = Buffer.alloc(44);
                                wavHeader.write('RIFF', 0);
                                wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
                                wavHeader.write('WAVE', 8);
                                wavHeader.write('fmt ', 12);
                                wavHeader.writeUInt32LE(16, 16);
                                wavHeader.writeUInt16LE(1, 20);
                                wavHeader.writeUInt16LE(1, 22);
                                wavHeader.writeUInt32LE(24000, 24);
                                wavHeader.writeUInt32LE(48000, 28);
                                wavHeader.writeUInt16LE(2, 32);
                                wavHeader.writeUInt16LE(16, 34);
                                wavHeader.write('data', 36);
                                wavHeader.writeUInt32LE(pcmBuffer.length, 40);

                                const audioBuffer = Buffer.concat([wavHeader, pcmBuffer]);
                                const fileName = `missao-${missaoId}-reta-final-${Date.now()}.wav`;

                                const { error: uploadError } = await supabase.storage
                                    .from('missao-audios')
                                    .upload(fileName, audioBuffer, {
                                        contentType: 'audio/wav',
                                        upsert: true,
                                    });

                                if (!uploadError) {
                                    const { data: publicUrlData } = supabase.storage
                                        .from('missao-audios')
                                        .getPublicUrl(fileName);
                                    audioUrl = publicUrlData?.publicUrl || null;
                                    console.log(`[RetaFinal] Áudio resumo uploaded: ${audioUrl}`);
                                }
                            }
                        }
                    }
                }
            } catch (ttsError) {
                console.warn(`[RetaFinal] TTS falhou para resumo da missão ${missaoId}:`, ttsError);
            }
        }

        // 3. Salvar resumo no banco
        await supabase
            .from('missao_conteudos')
            .update({
                reta_final_content: resumoContent,
                reta_final_audio_url: audioUrl,
                reta_final_status: 'completed',
            })
            .eq('missao_id', missaoId);

        console.log(`[RetaFinal] ✅ Resumo gerado com sucesso para missão ${missaoId}`);

    } catch (error: any) {
        console.error(`[RetaFinal] ❌ Erro ao gerar resumo para missão ${missaoId}:`, error);
        await supabase
            .from('missao_conteudos')
            .update({
                reta_final_status: 'failed',
            })
            .eq('missao_id', missaoId);
    }
}

// Função principal: Gerar conteúdo de uma missão em background
async function gerarConteudoMissaoBackground(missaoId: string): Promise<boolean> {
    // Deduplicação em memória - evita múltiplas requisições paralelas
    if (contentGenerationInProgress.has(missaoId)) {
        console.log(`[BackgroundContent] Geração já em progresso (in-memory) para missão ${missaoId}`);
        return false;
    }
    contentGenerationInProgress.add(missaoId);

    console.log(`[BackgroundContent] Iniciando geração para missão ${missaoId}...`);

    try {
        // 1. Verificar se já existe conteúdo
        const { data: existingContent } = await supabase
            .from('missao_conteudos')
            .select('id, status')
            .eq('missao_id', missaoId)
            .maybeSingle();

        if (existingContent) {
            if (existingContent.status === 'completed') {
                console.log(`[BackgroundContent] Conteúdo já existe para missão ${missaoId}`);
                contentGenerationInProgress.delete(missaoId);
                return true;
            }
            if (existingContent.status === 'generating') {
                // Fix 2: Reset automático de gerações travadas (>5 minutos)
                const { data: fullRecord } = await supabase
                    .from('missao_conteudos')
                    .select('created_at')
                    .eq('id', existingContent.id)
                    .single();

                if (fullRecord) {
                    const createdAt = new Date(fullRecord.created_at);
                    const minutos = (Date.now() - createdAt.getTime()) / 1000 / 60;

                    if (minutos > 5) {
                        console.log(`[BackgroundContent] Reset: ${missaoId} travado há ${minutos.toFixed(0)}min, deletando...`);
                        await supabase.from('missao_conteudos').delete().eq('id', existingContent.id);
                        // Continua para regenerar abaixo
                    } else {
                        console.log(`[BackgroundContent] Geração em andamento há ${minutos.toFixed(1)}min para missão ${missaoId}`);
                        contentGenerationInProgress.delete(missaoId);
                        return false;
                    }
                } else {
                    console.log(`[BackgroundContent] Geração já em andamento para missão ${missaoId}`);
                    contentGenerationInProgress.delete(missaoId);
                    return false;
                }
            }
            // Se status é 'failed', continua para regenerar (cai no insert que vai dar conflito e deletar)
        }

        // 2. Criar registro como "generating"
        const { data: contentRecord, error: insertError } = await supabase
            .from('missao_conteudos')
            .insert({
                missao_id: missaoId,
                texto_content: '',
                status: 'generating',
                modelo_texto: 'gemini-3-flash-preview',
            })
            .select('id')
            .single();

        if (insertError) {
            if (insertError.code === '23505') {
                console.log(`[BackgroundContent] Conteúdo já em criação (race condition)`);
                contentGenerationInProgress.delete(missaoId);
                return false;
            }
            throw insertError;
        }

        const contentId = contentRecord.id;

        // 3. Buscar informações da missão
        const missaoInfo = await getMissaoInfo(missaoId);
        if (!missaoInfo) {
            throw new Error('Missão não encontrada');
        }

        // 4. Buscar tópicos do edital
        const editalItemIds = await getMissaoEditalItems(missaoId);
        const topicos = editalItemIds.length > 0
            ? await getEditalItemsTitulos(editalItemIds)
            : [missaoInfo.assunto || 'Tema geral'];

        // 5. Buscar filtros e questões
        const filtros = await getMissaoFiltros(missaoId);
        const questoes = await buscarQuestoesScrapping(filtros, topicos, 20);

        console.log(`[BackgroundContent] ${questoes.length} questões encontradas para missão ${missaoId}`);

        // 6. Montar prompt e gerar conteúdo
        let prompt: string;

        // Fix 5: Fallback quando não há questões - gerar conteúdo baseado nos tópicos
        if (questoes.length === 0) {
            console.warn(`[BackgroundContent] 0 questões para ${missaoId}, usando apenas tópicos do edital`);
            prompt = `
## Contexto da Missão

**Matéria:** ${missaoInfo.materia || 'Matéria não especificada'}

**Tópicos do Edital para Estudo:**
${topicos.map((t: string) => `- ${t}`).join('\n')}

---

**ATENÇÃO:** Não foram encontradas questões específicas para esta missão.
Crie uma aula teórica completa sobre "${topicos[0] || missaoInfo.materia || 'o tema'}" baseada nos tópicos do edital acima.
A aula deve cobrir os conceitos fundamentais, exemplos práticos, e preparar o aluno para questões que cobrem esses tópicos.
`;
        } else {
            prompt = `
## Contexto da Missão

**Matéria:** ${missaoInfo.materia || 'Matéria não especificada'}

**Tópicos do Edital:**
${topicos.map((t: string) => `- ${t}`).join('\n')}

**Questões para Análise (${questoes.length} questões):**

${questoes.map((q: QuestaoFormatada) => `
### Questão ${q.numero} (${q.banca} ${q.ano})

**Enunciado:** ${q.enunciado}

**Alternativas:**
${q.alternativas.map((a: { letter: string; text: string }) => `${a.letter}) ${a.text}`).join('\n')}

**Gabarito:** ${q.gabarito}

**Comentário da banca/professor:** ${q.comentario}
`).join('\n---\n')}

---

Com base nas questões acima, crie uma aula completa sobre "${topicos[0] || missaoInfo.materia || 'o tema'}".
A aula deve preparar o aluno para responder questões similares às apresentadas.
`;
        }

        const contentAgent = mastra.getAgent("contentGeneratorAgent");
        if (!contentAgent) throw new Error('contentGeneratorAgent não encontrado');

        console.log(`[BackgroundContent] Gerando texto para missão ${missaoId}...`);
        const contentResult = await contentAgent.generate([{ role: 'user', content: prompt }]);
        let textoContent = contentResult.text || '';

        console.log(`[BackgroundContent] Texto gerado (${textoContent.length} chars) para missão ${missaoId}`);

        // 6.5. Gerar e incorporar imagens educacionais (se habilitado)
        let imagensGeradas: string[] = [];
        if (missaoInfo.gerar_imagem !== false && textoContent.length > 500) {
            console.log(`[BackgroundContent] Gerando imagens educacionais para missão ${missaoId}...`);
            const imageResult = await gerarEIncorporarImagensEducacionais(
                textoContent,
                missaoInfo.materia || 'Concursos',
                missaoId
            );
            textoContent = imageResult.textoContent;
            imagensGeradas = imageResult.imagensGeradas;
            console.log(`[BackgroundContent] ${imagensGeradas.length} imagens incorporadas ao conteúdo`);
        }

        // 7. Gerar roteiro para áudio
        const audioAgent = mastra.getAgent("audioScriptAgent");
        let roteiro = '';
        if (audioAgent && textoContent) {
            console.log(`[BackgroundContent] Gerando roteiro de áudio para missão ${missaoId}...`);
            const audioResult = await audioAgent.generate([{
                role: 'user',
                content: `Adapte o seguinte texto em Markdown para narração em áudio:\n\n${textoContent}`
            }]);
            roteiro = audioResult.text || '';
            console.log(`[BackgroundContent] Roteiro gerado (${roteiro.length} chars)`);
        }

        // 8. Gerar TTS (sem timeout - processo assíncrono pode levar o tempo que precisar)
        let audioUrl: string | null = null;
        if (roteiro && roteiro.length > 100) {
            try {
                console.log(`[BackgroundContent] Gerando TTS para missão ${missaoId} (${roteiro.length} chars)...`);

                const client = getGeminiClient();
                if (client) {
                    // Sem limite de texto - geramos o áudio completo no background
                    // IMPORTANTE: Não incluir instruções no texto, apenas o conteúdo a ser narrado
                    const audioResponse = await client.models.generateContent({
                        model: 'gemini-2.5-flash-preview-tts',
                        contents: [{
                            parts: [{
                                text: roteiro
                            }]
                        }],
                        config: {
                            responseModalities: ['AUDIO'],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: {
                                        voiceName: 'Kore'
                                    }
                                }
                            }
                        }
                    });

                    const audioData = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

                    if (audioData) {
                        // Convert PCM to WAV
                        const pcmBuffer = Buffer.from(audioData, 'base64');
                        const sampleRate = 24000;
                        const numChannels = 1;
                        const bitsPerSample = 16;
                        const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
                        const blockAlign = numChannels * (bitsPerSample / 8);

                        const wavHeader = Buffer.alloc(44);
                        wavHeader.write('RIFF', 0);
                        wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
                        wavHeader.write('WAVE', 8);
                        wavHeader.write('fmt ', 12);
                        wavHeader.writeUInt32LE(16, 16);
                        wavHeader.writeUInt16LE(1, 20);
                        wavHeader.writeUInt16LE(numChannels, 22);
                        wavHeader.writeUInt32LE(sampleRate, 24);
                        wavHeader.writeUInt32LE(byteRate, 28);
                        wavHeader.writeUInt16LE(blockAlign, 32);
                        wavHeader.writeUInt16LE(bitsPerSample, 34);
                        wavHeader.write('data', 36);
                        wavHeader.writeUInt32LE(pcmBuffer.length, 40);

                        const audioBuffer = Buffer.concat([wavHeader, pcmBuffer]);
                        const fileName = `missao-${missaoId}-${Date.now()}.wav`;

                        const { error: uploadError } = await supabase.storage
                            .from('missao-audios')
                            .upload(fileName, audioBuffer, {
                                contentType: 'audio/wav',
                                upsert: true,
                            });

                        if (!uploadError) {
                            const { data: publicUrlData } = supabase.storage
                                .from('missao-audios')
                                .getPublicUrl(fileName);
                            audioUrl = publicUrlData?.publicUrl || null;
                            console.log(`[BackgroundContent] Áudio uploaded: ${audioUrl}`);
                        }
                    }
                }
            } catch (ttsError) {
                console.warn(`[BackgroundContent] TTS falhou para missão ${missaoId}:`, ttsError);
                // Continua sem áudio
            }
        }

        // 9. Atualizar registro com conteúdo completo
        const { error: updateError } = await supabase
            .from('missao_conteudos')
            .update({
                texto_content: textoContent,
                audio_url: audioUrl,
                topicos_analisados: topicos,
                questoes_analisadas: questoes.map(q => q.numero),
                imagens_educacionais: imagensGeradas,
                status: 'completed',
                modelo_audio: audioUrl ? 'google-tts' : null,
            })
            .eq('id', contentId);

        if (updateError) {
            throw updateError;
        }

        console.log(`[BackgroundContent] ✅ Conteúdo gerado com sucesso para missão ${missaoId}`);

        // 10. Gerar resumo Reta Final em background (não bloqueia o retorno)
        if (textoContent && textoContent.length > 500) {
            gerarResumoRetaFinal(missaoId, textoContent).catch(err => {
                console.error(`[BackgroundContent] Erro ao gerar resumo Reta Final:`, err);
            });
        }

        return true;

    } catch (error: any) {
        console.error(`[BackgroundContent] ❌ Erro na geração para missão ${missaoId}:`, error);

        // Marcar como falhou
        await supabase
            .from('missao_conteudos')
            .update({
                status: 'failed',
                error_message: error.message || 'Erro desconhecido',
            })
            .eq('missao_id', missaoId);

        return false;
    } finally {
        // Sempre limpar do Set quando terminar (sucesso ou falha)
        contentGenerationInProgress.delete(missaoId);
    }
}

// Helper: Buscar primeiras N missões de um preparatório (atravessa rodadas se necessário)
async function getPrimeirasMissoes(preparatorioId: string, limite: number = 2): Promise<string[]> {
    // Buscar todas as rodadas ordenadas
    const { data: rodadas, error } = await supabase
        .from('rodadas')
        .select('id')
        .eq('preparatorio_id', preparatorioId)
        .order('ordem', { ascending: true });

    if (error || !rodadas?.length) return [];

    const missaoIds: string[] = [];

    // Percorrer rodadas até ter missões suficientes
    for (const rodada of rodadas) {
        if (missaoIds.length >= limite) break;

        const { data: missoes } = await supabase
            .from('missoes')
            .select('id')
            .eq('rodada_id', rodada.id)
            .order('ordem', { ascending: true })
            .limit(limite - missaoIds.length);

        if (missoes) {
            missaoIds.push(...missoes.map(m => m.id));
        }
    }

    return missaoIds.slice(0, limite);
}

// Helper: Buscar primeiras N missões do tipo 'padrao' (as que têm conteúdo a ser gerado)
async function getPrimeirasMissoesPadrao(preparatorioId: string, limite: number = 2): Promise<string[]> {
    // Buscar todas as rodadas ordenadas
    const { data: rodadas, error } = await supabase
        .from('rodadas')
        .select('id')
        .eq('preparatorio_id', preparatorioId)
        .order('ordem', { ascending: true });

    if (error || !rodadas?.length) {
        console.warn(`[getPrimeirasMissoesPadrao] Nenhuma rodada encontrada para ${preparatorioId}`);
        return [];
    }

    console.log(`[getPrimeirasMissoesPadrao] ${rodadas.length} rodadas encontradas`);

    const missaoIds: string[] = [];

    // Percorrer rodadas até ter missões suficientes
    for (const rodada of rodadas) {
        if (missaoIds.length >= limite) break;

        // Buscar apenas missões do tipo 'padrao' (não revisao, não acao)
        const { data: missoes, error: missaoError } = await supabase
            .from('missoes')
            .select('id, tipo')
            .eq('rodada_id', rodada.id)
            .eq('tipo', 'padrao')
            .order('ordem', { ascending: true })
            .limit(limite - missaoIds.length);

        if (missaoError) {
            console.error(`[getPrimeirasMissoesPadrao] Erro ao buscar missões:`, missaoError);
            continue;
        }

        if (missoes && missoes.length > 0) {
            console.log(`[getPrimeirasMissoesPadrao] Rodada ${rodada.id}: ${missoes.length} missões padrao`);
            missaoIds.push(...missoes.map(m => m.id));
        }
    }

    console.log(`[getPrimeirasMissoesPadrao] Total: ${missaoIds.length} missões encontradas`);
    return missaoIds.slice(0, limite);
}

// Helper: Buscar próxima missão
async function getProximaMissao(missaoAtualId: string): Promise<string | null> {
    // Buscar missão atual
    const { data: missaoAtual, error: missaoError } = await supabase
        .from('missoes')
        .select('id, ordem, rodada_id, rodadas(preparatorio_id, ordem)')
        .eq('id', missaoAtualId)
        .single();

    if (missaoError || !missaoAtual) return null;

    // Tentar próxima missão na mesma rodada
    const { data: proximaNaRodada } = await supabase
        .from('missoes')
        .select('id')
        .eq('rodada_id', missaoAtual.rodada_id)
        .gt('ordem', missaoAtual.ordem)
        .order('ordem', { ascending: true })
        .limit(1)
        .single();

    if (proximaNaRodada) return proximaNaRodada.id;

    // Tentar primeira missão da próxima rodada
    const preparatorioId = (missaoAtual.rodadas as any)?.preparatorio_id;
    const rodadaOrdem = (missaoAtual.rodadas as any)?.ordem;

    if (!preparatorioId) return null;

    const { data: proximaRodada } = await supabase
        .from('rodadas')
        .select('id')
        .eq('preparatorio_id', preparatorioId)
        .gt('ordem', rodadaOrdem)
        .order('ordem', { ascending: true })
        .limit(1)
        .single();

    if (!proximaRodada) return null;

    const { data: primeiraMissao } = await supabase
        .from('missoes')
        .select('id')
        .eq('rodada_id', proximaRodada.id)
        .order('ordem', { ascending: true })
        .limit(1)
        .single();

    return primeiraMissao?.id || null;
}

// Helper: Buscar próximas N missões (atravessa rodadas)
async function getProximasMissoes(missaoAtualId: string, quantidade: number = 2): Promise<string[]> {
    // Buscar missão atual
    const { data: missaoAtual, error: missaoError } = await supabase
        .from('missoes')
        .select('id, ordem, rodada_id, rodadas(preparatorio_id, ordem)')
        .eq('id', missaoAtualId)
        .single();

    if (missaoError || !missaoAtual) return [];

    const preparatorioId = (missaoAtual.rodadas as any)?.preparatorio_id;
    const rodadaAtualOrdem = (missaoAtual.rodadas as any)?.ordem;
    if (!preparatorioId) return [];

    const proximasMissoes: string[] = [];

    // 1. Buscar missões restantes na rodada atual
    const { data: missoesNaRodada } = await supabase
        .from('missoes')
        .select('id')
        .eq('rodada_id', missaoAtual.rodada_id)
        .gt('ordem', missaoAtual.ordem)
        .order('ordem', { ascending: true })
        .limit(quantidade);

    if (missoesNaRodada) {
        proximasMissoes.push(...missoesNaRodada.map(m => m.id));
    }

    // 2. Se ainda não tem o suficiente, buscar das próximas rodadas
    if (proximasMissoes.length < quantidade) {
        const { data: proximasRodadas } = await supabase
            .from('rodadas')
            .select('id')
            .eq('preparatorio_id', preparatorioId)
            .gt('ordem', rodadaAtualOrdem)
            .order('ordem', { ascending: true });

        if (proximasRodadas) {
            for (const rodada of proximasRodadas) {
                if (proximasMissoes.length >= quantidade) break;

                const { data: missoes } = await supabase
                    .from('missoes')
                    .select('id')
                    .eq('rodada_id', rodada.id)
                    .order('ordem', { ascending: true })
                    .limit(quantidade - proximasMissoes.length);

                if (missoes) {
                    proximasMissoes.push(...missoes.map(m => m.id));
                }
            }
        }
    }

    return proximasMissoes.slice(0, quantidade);
}

// Endpoint: Gerar conteúdo em background (fire-and-forget)
app.post('/api/missao/gerar-conteudo-background', async (req, res) => {
    const { missao_id } = req.body;

    if (!missao_id) {
        res.status(400).json({ success: false, error: 'missao_id é obrigatório' });
        return;
    }

    console.log(`[BackgroundContent] Recebida requisição para missão ${missao_id}`);

    // Responde imediatamente
    res.json({ success: true, message: 'Geração iniciada em background' });

    // Executa em background
    gerarConteudoMissaoBackground(missao_id).catch(err => {
        console.error(`[BackgroundContent] Erro não tratado:`, err);
    });
});

// Endpoint: Gerar resumo Reta Final para uma missão específica
app.post('/api/missao/gerar-resumo-reta-final', async (req, res) => {
    const { missao_id, dias_para_prova = 30 } = req.body;

    if (!missao_id) {
        res.status(400).json({ success: false, error: 'missao_id é obrigatório' });
        return;
    }

    console.log(`[RetaFinal] Recebida requisição para missão ${missao_id}`);

    // Buscar conteúdo existente
    const { data: conteudo } = await supabase
        .from('missao_conteudos')
        .select('texto_content, reta_final_status')
        .eq('missao_id', missao_id)
        .single();

    if (!conteudo?.texto_content) {
        res.status(400).json({
            success: false,
            error: 'Missão não tem conteúdo gerado. Gere o conteúdo normal primeiro.'
        });
        return;
    }

    if (conteudo.reta_final_status === 'completed') {
        res.json({ success: true, message: 'Resumo Reta Final já existe' });
        return;
    }

    // Responde imediatamente
    res.json({ success: true, message: 'Geração de resumo Reta Final iniciada em background' });

    // Executa em background
    gerarResumoRetaFinal(missao_id, conteudo.texto_content, dias_para_prova).catch(err => {
        console.error(`[RetaFinal] Erro não tratado:`, err);
    });
});

// Endpoint: Gerar resumos Reta Final para todas as missões de um preparatório
app.post('/api/preparatorio/gerar-resumos-reta-final', async (req, res) => {
    const { preparatorio_id, dias_para_prova = 30 } = req.body;

    if (!preparatorio_id) {
        res.status(400).json({ success: false, error: 'preparatorio_id é obrigatório' });
        return;
    }

    console.log(`[RetaFinal] Gerando resumos para preparatório ${preparatorio_id}...`);

    // Buscar todas as missões com conteúdo completo mas sem resumo Reta Final
    const { data: missoes, error } = await supabase
        .from('missao_conteudos')
        .select(`
            missao_id,
            texto_content,
            missoes!inner(
                id,
                rodadas!inner(
                    preparatorio_id
                )
            )
        `)
        .eq('status', 'completed')
        .neq('reta_final_status', 'completed')
        .not('texto_content', 'is', null);

    if (error) {
        res.status(500).json({ success: false, error: error.message });
        return;
    }

    // Filtrar pelo preparatório
    const missoesFiltradas = (missoes || []).filter((m: any) =>
        m.missoes?.rodadas?.preparatorio_id === preparatorio_id
    );

    if (missoesFiltradas.length === 0) {
        res.json({ success: true, message: 'Todas as missões já têm resumo Reta Final' });
        return;
    }

    // Responde imediatamente
    res.json({
        success: true,
        message: `Geração de ${missoesFiltradas.length} resumos Reta Final iniciada em background`
    });

    // Executa em background (sequencialmente para não sobrecarregar)
    (async () => {
        for (const missao of missoesFiltradas) {
            if (missao.texto_content) {
                await gerarResumoRetaFinal(missao.missao_id, missao.texto_content, dias_para_prova);
            }
        }
        console.log(`[RetaFinal] ✅ Resumos gerados para ${missoesFiltradas.length} missões`);
    })().catch(err => {
        console.error(`[RetaFinal] Erro ao gerar resumos em batch:`, err);
    });
});

// Endpoint: Gerar conteúdo para múltiplas missões (usado na criação do preparatório)
app.post('/api/preparatorio/gerar-conteudo-inicial', async (req, res) => {
    const { preparatorio_id, quantidade = 2 } = req.body;

    if (!preparatorio_id) {
        res.status(400).json({ success: false, error: 'preparatorio_id é obrigatório' });
        return;
    }

    console.log(`[BackgroundContent] Gerando conteúdo inicial para preparatório ${preparatorio_id}...`);

    // Responde imediatamente
    res.json({ success: true, message: `Geração de ${quantidade} missões iniciada em background` });

    // Busca e gera em background
    (async () => {
        // Apenas missões do tipo 'padrao' têm conteúdo a ser gerado
        const missoes = await getPrimeirasMissoesPadrao(preparatorio_id, quantidade);
        console.log(`[BackgroundContent] Encontradas ${missoes.length} missões padrao para gerar`);

        for (const missaoId of missoes) {
            await gerarConteudoMissaoBackground(missaoId);
        }
    })().catch(err => {
        console.error(`[BackgroundContent] Erro ao gerar conteúdo inicial:`, err);
    });
});

// Endpoint: Trigger geração da missão 2 posições à frente (chamado quando aluno acessa uma missão)
// Exemplo: Aluno na missão 1 → gera missão 3 | Aluno na missão 2 → gera missão 4
// Isso garante que sempre há 1 missão pronta à frente do aluno
app.post('/api/missao/trigger-proxima', async (req, res) => {
    const { missao_id } = req.body;

    if (!missao_id) {
        res.status(400).json({ success: false, error: 'missao_id é obrigatório' });
        return;
    }

    // Responde imediatamente
    res.json({ success: true, message: 'Pré-geração iniciada em background' });

    // Verifica e gera em background
    (async () => {
        // Buscar as próximas 2 missões, mas só gerar a segunda (2 posições à frente)
        const proximasMissoes = await getProximasMissoes(missao_id, 2);

        if (proximasMissoes.length < 2) {
            console.log(`[BackgroundContent] Menos de 2 missões restantes após ${missao_id}`);
            // Se só tem 1 missão restante, gerar ela
            if (proximasMissoes.length === 1) {
                const missaoId = proximasMissoes[0];
                const { data: existingContent } = await supabase
                    .from('missao_conteudos')
                    .select('status')
                    .eq('missao_id', missaoId)
                    .maybeSingle();

                if (!existingContent || (existingContent.status !== 'completed' && existingContent.status !== 'generating')) {
                    console.log(`[BackgroundContent] Gerando última missão disponível: ${missaoId}`);
                    await gerarConteudoMissaoBackground(missaoId);
                }
            }
            return;
        }

        // Pegar a missão 2 posições à frente (índice 1)
        const missaoAFrente = proximasMissoes[1];

        // Verificar se já tem conteúdo
        const { data: existingContent } = await supabase
            .from('missao_conteudos')
            .select('status')
            .eq('missao_id', missaoAFrente)
            .maybeSingle();

        if (existingContent?.status === 'completed' || existingContent?.status === 'generating') {
            console.log(`[BackgroundContent] Missão ${missaoAFrente} (N+2) já tem/está gerando conteúdo`);
            return;
        }

        console.log(`[BackgroundContent] Gerando missão ${missaoAFrente} (2 posições à frente de ${missao_id})`);
        await gerarConteudoMissaoBackground(missaoAFrente);
    })().catch(err => {
        console.error(`[BackgroundContent] Erro ao trigger próxima:`, err);
    });
});

// ==================== ENDPOINTS DE GERAÇÃO DE RODADAS ====================

// Endpoint para analisar prioridade das matérias via IA
app.post('/api/preparatorio/analisar-prioridade', async (req, res) => {
    try {
        const { preparatorio_id } = req.body;

        if (!preparatorio_id) {
            res.status(400).json({
                success: false,
                error: "preparatorio_id é obrigatório"
            });
            return;
        }

        console.log(`[Prioridade] Analisando prioridade para preparatório ${preparatorio_id}...`);

        const agent = mastra.getAgent("materiaPriorityAgent");

        if (!agent) {
            res.status(500).json({ success: false, error: "Agente não encontrado" });
            return;
        }

        const result = await agent.generate([
            {
                role: "user",
                content: `Analise as matérias do preparatório ${preparatorio_id} e sugira a ordem de prioridade para estudo.

Use as ferramentas disponíveis para:
1. Buscar informações do preparatório
2. Buscar estatísticas da banca (se disponível)

Retorne a lista de matérias ordenada por prioridade com justificativas.`,
            },
        ]);

        // Extrair JSON da resposta
        const responseText = result.text || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            console.error('[Prioridade] Não foi possível extrair JSON:', responseText.substring(0, 200));
            res.status(500).json({
                success: false,
                error: "Não foi possível processar a análise. Tente novamente."
            });
            return;
        }

        try {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log(`[Prioridade] Análise concluída: ${parsed.materias?.length || 0} matérias`);
            res.json({ success: true, data: parsed });
        } catch (parseError) {
            console.error('[Prioridade] Erro ao parsear JSON:', parseError);
            res.status(500).json({
                success: false,
                error: "Erro ao processar resposta da IA"
            });
        }

    } catch (error: any) {
        console.error("[Prioridade] Erro:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// Endpoint para gerar rodadas e missões
app.post('/api/preparatorio/gerar-rodadas', async (req, res) => {
    try {
        const {
            preparatorio_id,
            materias_ordenadas,
            config,
            substituir_existentes = true,
            persistir = true,
            banca
        } = req.body;

        if (!preparatorio_id) {
            res.status(400).json({
                success: false,
                error: "preparatorio_id é obrigatório"
            });
            return;
        }

        console.log(`[Rodadas] Gerando rodadas para preparatório ${preparatorio_id}...`);

        // Configuração padrão
        const configuracao: ConfiguracaoGeracao = {
            materias_por_rodada: config?.materias_por_rodada || 5,
            max_topicos_por_missao: config?.max_topicos_por_missao || 3,
            incluir_revisao_op: config?.incluir_revisao_op !== false,
            incluir_tecnicas_op: config?.incluir_tecnicas_op !== false,
            incluir_simulado: config?.incluir_simulado !== false,
            gerar_filtros_questoes: config?.gerar_filtros_questoes !== false,
        };

        // Se não foram fornecidas matérias ordenadas, buscar do banco
        let materias: MateriaOrdenada[];

        if (materias_ordenadas && materias_ordenadas.length > 0) {
            materias = materias_ordenadas;
        } else {
            materias = await buscarMateriasComTopicos(preparatorio_id);
        }

        if (materias.length === 0) {
            res.status(400).json({
                success: false,
                error: "Nenhuma matéria com tópicos encontrada no edital"
            });
            return;
        }

        console.log(`[Rodadas] ${materias.length} matérias encontradas, gerando...`);

        // Buscar configurações de rodadas do banco
        const settings = await getRodadasSettings();

        // Gerar rodadas
        const resultado = gerarRodadas(materias, configuracao, settings);

        if (!resultado.success) {
            res.status(500).json({
                success: false,
                error: resultado.error || "Erro ao gerar rodadas"
            });
            return;
        }

        console.log(`[Rodadas] Geradas ${resultado.estatisticas.total_rodadas} rodadas com ${resultado.estatisticas.total_missoes} missões`);

        // Persistir se solicitado
        if (persistir) {
            console.log(`[Rodadas] Persistindo no banco de dados...`);

            const resultadoPersistencia = await persistirRodadas(
                preparatorio_id,
                resultado.rodadas,
                substituir_existentes,
                configuracao.gerar_filtros_questoes,
                banca
            );

            if (!resultadoPersistencia.success) {
                res.status(500).json({
                    success: false,
                    error: resultadoPersistencia.error || "Erro ao salvar rodadas"
                });
                return;
            }

            console.log(`[Rodadas] Persistido: ${resultadoPersistencia.rodadas_criadas} rodadas, ${resultadoPersistencia.missoes_criadas} missões`);

            res.json({
                success: true,
                data: {
                    ...resultado,
                    persistencia: resultadoPersistencia,
                }
            });
        } else {
            // Apenas retornar preview
            res.json({
                success: true,
                data: resultado,
            });
        }

    } catch (error: any) {
        console.error("[Rodadas] Erro:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// Endpoint para buscar matérias com tópicos (para o frontend)
app.get('/api/preparatorio/:id/materias', async (req, res) => {
    try {
        const { id } = req.params;

        const materias = await buscarMateriasComTopicos(id);

        res.json({
            success: true,
            data: materias,
        });

    } catch (error: any) {
        console.error("[Materias] Erro:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// ==================== ENDPOINT DE CRIAÇÃO AUTOMÁTICA DE PREPARATÓRIO VIA PDF ====================

interface EtapaProgresso {
    etapa: string;
    status: 'pending' | 'in_progress' | 'completed' | 'error';
    detalhes?: string;
    hidden?: boolean; // Etapas ocultas do frontend mas ainda executam
    progress?: { current: number; total: number }; // Progresso detalhado para etapas longas
}

/**
 * Endpoint para criar preparatório completo a partir de um PDF de edital
 *
 * POST /api/preparatorio/from-pdf
 * Body: FormData com campo 'pdf' contendo o arquivo PDF
 *
 * O processo inclui:
 * 1. Análise do PDF via IA (Gemini 3 Flash)
 * 2. Criação do preparatório
 * 3. Criação do edital verticalizado
 * 4. Geração de rodadas e missões
 * 5. Criação de mensagens de incentivo
 * 6. Ativação do preparatório
 */
app.post('/api/preparatorio/from-pdf', upload.single('pdf'), async (req, res) => {
    const startTime = Date.now();
    let preparatorioId: string | null = null;

    const etapas: EtapaProgresso[] = [
        { etapa: 'Analisando PDF', status: 'pending' },
        { etapa: 'Criando preparatório', status: 'pending' },
        { etapa: 'Gerando imagem de capa', status: 'pending' },
        { etapa: 'Criando edital verticalizado', status: 'pending' },
        { etapa: 'Criando mensagens de incentivo', status: 'pending' },
        { etapa: 'Finalizando', status: 'pending' },
    ];

    try {
        // Validar arquivo PDF
        if (!req.file) {
            res.status(400).json({
                success: false,
                error: 'Arquivo PDF é obrigatório',
                etapas,
            });
            return;
        }

        console.log(`[FromPDF] Iniciando processo com arquivo de ${(req.file.size / 1024 / 1024).toFixed(2)}MB`);

        // ========== ETAPA 1: ANÁLISE DO PDF ==========
        etapas[0].status = 'in_progress';
        console.log('[FromPDF] Etapa 1: Analisando PDF com IA...');

        const agent = mastra.getAgent("editalFullAnalyzerAgent");

        if (!agent) {
            etapas[0].status = 'error';
            etapas[0].detalhes = 'Agente não encontrado';
            res.status(500).json({
                success: false,
                error: 'Agente editalFullAnalyzerAgent não encontrado',
                etapas,
            });
            return;
        }

        // Converter PDF para base64
        const pdfBase64 = req.file.buffer.toString('base64');

        // Chamar agente com o PDF
        const analysisResult = await agent.generate([
            {
                role: 'user',
                content: [
                    {
                        type: 'file',
                        data: pdfBase64,
                        mimeType: 'application/pdf',
                    },
                    {
                        type: 'text',
                        text: 'Analise este edital de concurso público e extraia todas as informações no formato JSON especificado nas suas instruções.',
                    },
                ],
            },
        ]);

        // Extrair JSON da resposta
        const responseText = analysisResult.text || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            etapas[0].status = 'error';
            etapas[0].detalhes = 'Não foi possível extrair informações do PDF';
            console.error('[FromPDF] Resposta do agente:', responseText.substring(0, 500));
            res.status(500).json({
                success: false,
                error: 'Não foi possível extrair informações do PDF. Verifique se o arquivo é um edital válido.',
                etapas,
            });
            return;
        }

        let analise;
        try {
            analise = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            etapas[0].status = 'error';
            etapas[0].detalhes = 'Erro ao processar resposta da IA';
            res.status(500).json({
                success: false,
                error: 'Erro ao processar a análise do PDF',
                etapas,
            });
            return;
        }

        // Validar estrutura básica
        if (!analise.infoBasica || !analise.estrutura) {
            etapas[0].status = 'error';
            etapas[0].detalhes = 'Estrutura de dados incompleta';
            res.status(500).json({
                success: false,
                error: 'A análise do PDF retornou dados incompletos',
                etapas,
            });
            return;
        }

        etapas[0].status = 'completed';
        etapas[0].detalhes = `Extraídos: ${analise.estrutura.blocos?.length || 0} blocos`;
        console.log(`[FromPDF] Análise concluída: ${analise.infoBasica.nome}`);

        // ========== ETAPA 2: CRIAR PREPARATÓRIO ==========
        etapas[1].status = 'in_progress';
        console.log('[FromPDF] Etapa 2: Criando preparatório...');

        const resultadoPrep = await criarPreparatorio({
            nome: analise.infoBasica.nome || 'Novo Preparatório',
            banca: analise.infoBasica.banca,
            orgao: analise.infoBasica.orgao,
            cargo: analise.infoBasica.cargo,
            nivel: analise.infoBasica.nivel,
            escolaridade: analise.infoBasica.escolaridade,
            requisitos: analise.infoBasica.requisitos,
            salario: analise.infoBasica.salario,
            vagas: analise.infoBasica.vagas,
            carga_horaria: analise.infoBasica.carga_horaria,
            taxa_inscricao: analise.infoBasica.taxa_inscricao,
            inscricoes_inicio: analise.infoBasica.inscricoes_inicio,
            inscricoes_fim: analise.infoBasica.inscricoes_fim,
            data_prevista: analise.infoBasica.data_prevista,
            regiao: analise.infoBasica.regiao,
            modalidade: analise.infoBasica.modalidade,
        });

        if (!resultadoPrep.success || !resultadoPrep.preparatorio_id) {
            etapas[1].status = 'error';
            etapas[1].detalhes = resultadoPrep.error;
            res.status(500).json({
                success: false,
                error: resultadoPrep.error || 'Erro ao criar preparatório',
                etapas,
            });
            return;
        }

        preparatorioId = resultadoPrep.preparatorio_id;
        etapas[1].status = 'completed';
        etapas[1].detalhes = `ID: ${preparatorioId}`;
        console.log(`[FromPDF] Preparatório criado: ${preparatorioId}`);

        // ========== ETAPA 3: GERAR IMAGEM DE CAPA ==========
        etapas[2].status = 'in_progress';
        console.log('[FromPDF] Etapa 3: Gerando imagem de capa com IA...');

        const imagemUrl = await gerarImagemCapa({
            nome: analise.infoBasica.nome || 'Preparatório',
            banca: analise.infoBasica.banca,
            orgao: analise.infoBasica.orgao,
            cargo: analise.infoBasica.cargo,
            preparatorioId,
        });

        if (imagemUrl) {
            // Atualizar preparatório com a imagem
            await supabase
                .from('preparatorios')
                .update({ imagem_capa: imagemUrl })
                .eq('id', preparatorioId);

            etapas[2].status = 'completed';
            etapas[2].detalhes = 'Imagem gerada com sucesso';
            console.log(`[FromPDF] Imagem de capa gerada: ${imagemUrl}`);
        } else {
            etapas[2].status = 'completed';
            etapas[2].detalhes = 'Pulado (opcional)';
            console.log('[FromPDF] Imagem de capa não gerada (continuando sem imagem)');
        }

        // ========== ETAPA 4: CRIAR EDITAL VERTICALIZADO ==========
        etapas[3].status = 'in_progress';
        console.log('[FromPDF] Etapa 4: Criando edital verticalizado...');

        const resultadoEdital = await criarEditalVerticalizado(
            preparatorioId,
            analise.estrutura as EditalEstrutura
        );

        if (!resultadoEdital.success) {
            etapas[3].status = 'error';
            etapas[3].detalhes = resultadoEdital.error;
            // Rollback: deletar preparatório
            await deletarPreparatorio(preparatorioId);
            res.status(500).json({
                success: false,
                error: resultadoEdital.error || 'Erro ao criar edital verticalizado',
                etapas,
            });
            return;
        }

        etapas[3].status = 'completed';
        etapas[3].detalhes = `${resultadoEdital.blocos_criados} blocos, ${resultadoEdital.materias_criadas} matérias, ${resultadoEdital.topicos_criados} tópicos`;
        console.log(`[FromPDF] Edital criado: ${resultadoEdital.topicos_criados} tópicos`);

        // Auto-configurar filtros do edital via IA
        console.log('[FromPDF] Auto-configurando filtros do edital...');
        try {
            const autoConfigResult = await autoConfigureEditalFilters(preparatorioId);
            if (autoConfigResult.success) {
                console.log(`[FromPDF] Filtros auto-configurados: ${autoConfigResult.itemsConfigured}/${autoConfigResult.itemsProcessed} itens`);
            } else {
                console.error('[FromPDF] Erro na auto-configuração:', autoConfigResult.error);
            }
        } catch (autoConfigError) {
            console.error('[FromPDF] Erro ao auto-configurar filtros:', autoConfigError);
            // Non-blocking - continua mesmo se falhar
        }

        // Salvar raio-x (sem rodadas - serão criadas depois manualmente)
        const raioX = {
            analise_automatica: true,
            data_analise: new Date().toISOString(),
            total_blocos: resultadoEdital.blocos_criados,
            total_materias: resultadoEdital.materias_criadas,
            total_topicos: resultadoEdital.topicos_criados,
            total_rodadas: 0,
            total_missoes: 0,
        };

        await atualizarRaioX(preparatorioId, raioX);

        // ========== ETAPA 5: CRIAR MENSAGENS DE INCENTIVO ==========
        etapas[4].status = 'in_progress';
        console.log('[FromPDF] Etapa 5: Criando mensagens de incentivo...');

        const resultadoMensagens = await criarMensagensIncentivoPadrao(preparatorioId);

        etapas[4].status = 'completed';
        etapas[4].detalhes = `${resultadoMensagens.mensagens_criadas} mensagens`;
        console.log(`[FromPDF] Mensagens criadas: ${resultadoMensagens.mensagens_criadas}`);

        // ========== ETAPA 6: FINALIZAR ==========
        etapas[5].status = 'in_progress';
        console.log('[FromPDF] Etapa 6: Finalizando...');

        // Preparatório fica inativo até as rodadas serem criadas manualmente
        console.log(`[FromPDF] ✅ Preparatório criado (aguardando criação de rodadas)`);
        etapas[5].status = 'completed';
        etapas[5].detalhes = 'Preparatório criado com sucesso';

        const tempoTotal = Date.now() - startTime;
        console.log(`[FromPDF] Processo concluído em ${(tempoTotal / 1000).toFixed(1)}s`);

        // Retornar resultado completo
        res.json({
            success: true,
            preparatorio: {
                id: preparatorioId,
                slug: resultadoPrep.slug,
                nome: analise.infoBasica.nome,
                banca: analise.infoBasica.banca,
                orgao: analise.infoBasica.orgao,
                cargo: analise.infoBasica.cargo,
            },
            estatisticas: {
                blocos: resultadoEdital.blocos_criados,
                materias: resultadoEdital.materias_criadas,
                topicos: resultadoEdital.topicos_criados,
                subtopicos: resultadoEdital.subtopicos_criados,
                rodadas: 0,
                missoes: 0,
                mensagens_incentivo: resultadoMensagens.mensagens_criadas,
                tempo_total_ms: tempoTotal,
            },
            etapas,
        });

    } catch (error: any) {
        console.error('[FromPDF] Erro:', error);

        // Rollback se preparatório foi criado
        if (preparatorioId) {
            console.log(`[FromPDF] Rollback: deletando preparatório ${preparatorioId}`);
            await deletarPreparatorio(preparatorioId);
        }

        // Marcar etapa atual como erro
        const etapaAtual = etapas.find(e => e.status === 'in_progress');
        if (etapaAtual) {
            etapaAtual.status = 'error';
            etapaAtual.detalhes = error.message;
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Erro interno ao processar PDF',
            etapas,
        });
    }
});

// ==================== ENDPOINT SSE PARA CRIAÇÃO COM PROGRESSO EM TEMPO REAL ====================

app.post('/api/preparatorio/from-pdf-stream', upload.single('pdf'), async (req, res) => {
    // Configurar SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const sendEvent = (event: string, data: any) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const startTime = Date.now();
    let preparatorioId: string | null = null;

    const etapas: EtapaProgresso[] = [
        { etapa: 'Analisando PDF', status: 'pending' },
        { etapa: 'Criando preparatório', status: 'pending' },
        { etapa: 'Gerando imagem de capa', status: 'pending' },
        { etapa: 'Criando edital verticalizado', status: 'pending' },
        { etapa: 'Configurando filtros', status: 'pending' }, // Nova etapa com progresso real
        { etapa: 'Criando mensagens de incentivo', status: 'pending', hidden: true },
        { etapa: 'Finalizando', status: 'pending', hidden: true },
    ];

    const updateEtapa = (index: number, status: EtapaProgresso['status'], detalhes?: string, progress?: { current: number; total: number }) => {
        etapas[index].status = status;
        if (detalhes) etapas[index].detalhes = detalhes;
        if (progress) etapas[index].progress = progress;
        sendEvent('progress', { etapas, currentStep: index });
    };

    try {
        // Validar arquivo PDF
        if (!req.file) {
            sendEvent('error', { error: 'Arquivo PDF é obrigatório', etapas });
            res.end();
            return;
        }

        console.log(`[FromPDF-SSE] Iniciando processo com arquivo de ${(req.file.size / 1024 / 1024).toFixed(2)}MB`);

        // ========== ETAPA 1: ANÁLISE DO PDF ==========
        updateEtapa(0, 'in_progress');
        console.log('[FromPDF-SSE] Etapa 1: Analisando PDF com IA...');

        const agent = mastra.getAgent("editalFullAnalyzerAgent");

        if (!agent) {
            updateEtapa(0, 'error', 'Agente não encontrado');
            sendEvent('error', { error: 'Agente editalFullAnalyzerAgent não encontrado', etapas });
            res.end();
            return;
        }

        const pdfBase64 = req.file.buffer.toString('base64');

        const analysisResult = await agent.generate([
            {
                role: 'user',
                content: [
                    { type: 'file', data: pdfBase64, mimeType: 'application/pdf' },
                    { type: 'text', text: 'Analise este edital de concurso público e extraia todas as informações no formato JSON especificado nas suas instruções.' },
                ],
            },
        ]);

        const responseText = analysisResult.text || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            updateEtapa(0, 'error', 'Não foi possível extrair informações do PDF');
            sendEvent('error', { error: 'Não foi possível extrair informações do PDF', etapas });
            res.end();
            return;
        }

        let analise;
        try {
            analise = JSON.parse(jsonMatch[0]);
        } catch {
            updateEtapa(0, 'error', 'Erro ao processar resposta da IA');
            sendEvent('error', { error: 'Erro ao processar a análise do PDF', etapas });
            res.end();
            return;
        }

        if (!analise.infoBasica || !analise.estrutura) {
            updateEtapa(0, 'error', 'Estrutura do edital incompleta');
            sendEvent('error', { error: 'A análise não retornou a estrutura esperada', etapas });
            res.end();
            return;
        }

        updateEtapa(0, 'completed', `${analise.estrutura.blocos?.length || 0} blocos identificados`);
        console.log(`[FromPDF-SSE] Análise concluída: ${analise.estrutura.blocos?.length || 0} blocos`);

        // ========== ETAPA 2: CRIAR PREPARATÓRIO ==========
        updateEtapa(1, 'in_progress');
        console.log('[FromPDF-SSE] Etapa 2: Criando preparatório...');

        const resultadoPrep = await criarPreparatorio(analise.infoBasica);

        if (!resultadoPrep.success || !resultadoPrep.preparatorio_id) {
            updateEtapa(1, 'error', resultadoPrep.error);
            sendEvent('error', { error: resultadoPrep.error || 'Erro ao criar preparatório', etapas });
            res.end();
            return;
        }

        preparatorioId = resultadoPrep.preparatorio_id;
        updateEtapa(1, 'completed', `Slug: ${resultadoPrep.slug}`);
        console.log(`[FromPDF-SSE] Preparatório criado: ${preparatorioId}`);

        // ========== ETAPA 3: GERAR IMAGEM DE CAPA ==========
        updateEtapa(2, 'in_progress');
        console.log('[FromPDF-SSE] Etapa 3: Gerando imagem de capa...');

        const imagemUrl = await gerarImagemCapa({
            nome: analise.infoBasica.nome,
            banca: analise.infoBasica.banca,
            orgao: analise.infoBasica.orgao,
            cargo: analise.infoBasica.cargo,
            preparatorioId,
        });

        if (imagemUrl) {
            updateEtapa(2, 'completed', 'Imagem gerada com sucesso');
        } else {
            updateEtapa(2, 'completed', 'Usando imagem padrão');
        }

        // ========== ETAPA 4: CRIAR EDITAL VERTICALIZADO ==========
        updateEtapa(3, 'in_progress');
        console.log('[FromPDF-SSE] Etapa 4: Criando edital verticalizado...');

        const resultadoEdital = await criarEditalVerticalizado(preparatorioId, analise.estrutura);

        if (!resultadoEdital.success) {
            updateEtapa(3, 'error', resultadoEdital.error);
            await deletarPreparatorio(preparatorioId);
            sendEvent('error', { error: resultadoEdital.error || 'Erro ao criar edital', etapas });
            res.end();
            return;
        }

        updateEtapa(3, 'completed', `${resultadoEdital.blocos_criados} blocos, ${resultadoEdital.materias_criadas} matérias, ${resultadoEdital.topicos_criados} tópicos`);
        const totalItems = resultadoEdital.blocos_criados + resultadoEdital.materias_criadas + resultadoEdital.topicos_criados + resultadoEdital.subtopicos_criados;
        console.log(`[FromPDF-SSE] Edital criado: ${totalItems} itens`);

        // ========== ETAPA 5: CONFIGURAR FILTROS (com progresso real) ==========
        updateEtapa(4, 'in_progress', 'Iniciando...');
        console.log('[FromPDF-SSE] Etapa 5: Auto-configurando filtros do edital...');

        try {
            // Callback de progresso para atualizar SSE em tempo real
            const onFilterProgress: AutoConfigProgressCallback = (current, total, itemName) => {
                const percentage = Math.round((current / total) * 100);
                updateEtapa(4, 'in_progress', `${current}/${total} itens (${percentage}%)`, { current, total });
            };

            const autoConfigResult = await autoConfigureEditalFilters(preparatorioId, onFilterProgress);
            if (autoConfigResult.success) {
                console.log(`[FromPDF-SSE] Filtros auto-configurados: ${autoConfigResult.itemsConfigured}/${autoConfigResult.itemsProcessed} itens`);
                updateEtapa(4, 'completed', `${autoConfigResult.itemsConfigured}/${autoConfigResult.itemsProcessed} filtros configurados`);
            } else {
                console.error('[FromPDF-SSE] Erro na auto-configuração:', autoConfigResult.error);
                updateEtapa(4, 'completed', 'Concluído com avisos');
            }
        } catch (autoConfigError) {
            console.error('[FromPDF-SSE] Erro ao auto-configurar filtros:', autoConfigError);
            updateEtapa(4, 'completed', 'Concluído com erros');
            // Non-blocking - continua mesmo se falhar
        }

        // Salvar raio-x (sem rodadas - serão criadas depois manualmente)
        const raioX = {
            analise_automatica: true,
            data_analise: new Date().toISOString(),
            total_blocos: resultadoEdital.blocos_criados,
            total_materias: resultadoEdital.materias_criadas,
            total_topicos: resultadoEdital.topicos_criados,
            total_rodadas: 0,
            total_missoes: 0,
        };
        await atualizarRaioX(preparatorioId, raioX);

        // ========== ETAPA 6: CRIAR MENSAGENS DE INCENTIVO (oculta) ==========
        updateEtapa(5, 'in_progress');
        console.log('[FromPDF-SSE] Etapa 6: Criando mensagens de incentivo...');

        const resultadoMensagens = await criarMensagensIncentivoPadrao(preparatorioId);

        updateEtapa(5, 'completed', `${resultadoMensagens.mensagens_criadas} mensagens`);
        console.log(`[FromPDF-SSE] Mensagens criadas: ${resultadoMensagens.mensagens_criadas}`);

        // ========== ETAPA 7: FINALIZAR (oculta) ==========
        updateEtapa(6, 'in_progress');
        console.log('[FromPDF-SSE] Etapa 7: Finalizando...');

        // Preparatório fica inativo até as rodadas serem criadas manualmente
        console.log(`[FromPDF-SSE] ✅ Preparatório criado (aguardando criação de rodadas)`);
        updateEtapa(6, 'completed', 'Preparatório criado com sucesso');

        const tempoTotal = Date.now() - startTime;
        console.log(`[FromPDF-SSE] Processo concluído em ${(tempoTotal / 1000).toFixed(1)}s`);

        // Enviar resultado final
        sendEvent('complete', {
            success: true,
            preparatorio: {
                id: preparatorioId,
                slug: resultadoPrep.slug,
                nome: analise.infoBasica.nome,
                banca: analise.infoBasica.banca,
                orgao: analise.infoBasica.orgao,
                cargo: analise.infoBasica.cargo,
            },
            estatisticas: {
                blocos: resultadoEdital.blocos_criados,
                materias: resultadoEdital.materias_criadas,
                topicos: resultadoEdital.topicos_criados,
                subtopicos: resultadoEdital.subtopicos_criados,
                rodadas: 0,
                missoes: 0,
                mensagens_incentivo: resultadoMensagens.mensagens_criadas,
                tempo_total_ms: tempoTotal,
            },
            etapas,
        });

        res.end();

    } catch (error: any) {
        console.error('[FromPDF-SSE] Erro:', error);

        if (preparatorioId) {
            console.log(`[FromPDF-SSE] Rollback: deletando preparatório ${preparatorioId}`);
            await deletarPreparatorio(preparatorioId);
        }

        const etapaAtual = etapas.find(e => e.status === 'in_progress');
        if (etapaAtual) {
            etapaAtual.status = 'error';
            etapaAtual.detalhes = error.message;
        }

        sendEvent('error', {
            error: error.message || 'Erro interno ao processar PDF',
            etapas,
        });

        res.end();
    }
});

// ==================== ENDPOINT JSON PARA CRIAÇÃO COM VALIDAÇÃO DE RODADAS ====================

/**
 * POST /api/preparatorio/from-pdf-preview
 *
 * Fluxo em duas fases:
 * Fase 1 (este endpoint): Analisa PDF → Cria preparatório → Cria edital → Gera preview das rodadas
 * Fase 2 (confirm-rodadas): Usuário valida ordem → Persiste rodadas → Finaliza
 *
 * Retorna JSON com os dados do preview ou erro
 */
app.post('/api/preparatorio/from-pdf-preview', upload.single('pdf'), async (req, res) => {
    req.setTimeout(5 * 60 * 1000);

    const startTime = Date.now();
    let preparatorioId: string | null = null;

    try {
        // Validar arquivo PDF
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Arquivo PDF é obrigatório',
            });
        }

        console.log(`[FromPDF-Preview] Iniciando processo com arquivo de ${(req.file.size / 1024 / 1024).toFixed(2)}MB`);

        // ========== ETAPA 1: ANÁLISE DO PDF ==========
        console.log('[FromPDF-Preview] Etapa 1: Analisando PDF com IA...');

        const agent = mastra.getAgent("editalFullAnalyzerAgent");

        if (!agent) {
            return res.status(500).json({
                success: false,
                error: 'Agente editalFullAnalyzerAgent não encontrado',
            });
        }

        const pdfBase64 = req.file.buffer.toString('base64');

        const analysisResult = await agent.generate([
            {
                role: 'user',
                content: [
                    { type: 'file', data: pdfBase64, mimeType: 'application/pdf' },
                    { type: 'text', text: 'Analise este edital de concurso público e extraia todas as informações no formato JSON especificado nas suas instruções.' },
                ],
            },
        ]);

        const responseText = analysisResult.text || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            return res.status(400).json({
                success: false,
                error: 'Não foi possível extrair informações do PDF',
            });
        }

        let analise;
        try {
            analise = JSON.parse(jsonMatch[0]);
        } catch {
            return res.status(400).json({
                success: false,
                error: 'Erro ao processar a análise do PDF',
            });
        }

        if (!analise.infoBasica || !analise.estrutura) {
            return res.status(400).json({
                success: false,
                error: 'A análise não retornou a estrutura esperada',
            });
        }

        console.log(`[FromPDF-Preview] Análise concluída: ${analise.estrutura.blocos?.length || 0} blocos`);

        // ========== ETAPA 2: CRIAR PREPARATÓRIO ==========
        console.log('[FromPDF-Preview] Etapa 2: Criando preparatório...');

        const resultadoPrep = await criarPreparatorio(analise.infoBasica);

        if (!resultadoPrep.success || !resultadoPrep.preparatorio_id) {
            return res.status(500).json({
                success: false,
                error: resultadoPrep.error || 'Erro ao criar preparatório',
            });
        }

        preparatorioId = resultadoPrep.preparatorio_id;
        console.log(`[FromPDF-Preview] Preparatório criado: ${preparatorioId}`);

        // ========== ETAPA 3: GERAR IMAGEM DE CAPA ==========
        console.log('[FromPDF-Preview] Etapa 3: Gerando imagem de capa...');

        const imagemUrl = await gerarImagemCapa({
            nome: analise.infoBasica.nome,
            banca: analise.infoBasica.banca,
            orgao: analise.infoBasica.orgao,
            cargo: analise.infoBasica.cargo,
            preparatorioId,
        });

        console.log(`[FromPDF-Preview] Imagem: ${imagemUrl ? 'gerada' : 'usando padrão'}`);

        // ========== ETAPA 4: CRIAR EDITAL VERTICALIZADO ==========
        console.log('[FromPDF-Preview] Etapa 4: Criando edital verticalizado...');

        const resultadoEdital = await criarEditalVerticalizado(preparatorioId, analise.estrutura);

        if (!resultadoEdital.success) {
            await deletarPreparatorio(preparatorioId);
            return res.status(500).json({
                success: false,
                error: resultadoEdital.error || 'Erro ao criar edital',
            });
        }

        console.log(`[FromPDF-Preview] Edital criado`);

        // Auto-configurar filtros do edital via IA
        console.log('[FromPDF-Preview] Auto-configurando filtros do edital...');
        try {
            const autoConfigResult = await autoConfigureEditalFilters(preparatorioId);
            if (autoConfigResult.success) {
                console.log(`[FromPDF-Preview] Filtros auto-configurados: ${autoConfigResult.itemsConfigured}/${autoConfigResult.itemsProcessed} itens`);
            } else {
                console.error('[FromPDF-Preview] Erro na auto-configuração:', autoConfigResult.error);
            }
        } catch (autoConfigError) {
            console.error('[FromPDF-Preview] Erro ao auto-configurar filtros:', autoConfigError);
            // Non-blocking - continua mesmo se falhar
        }

        // ========== ETAPA 5: GERAR PRÉVIA DAS RODADAS ==========
        console.log('[FromPDF-Preview] Etapa 5: Gerando prévia das rodadas...');

        // Buscar matérias com tópicos (já ordenadas com Português primeiro)
        const materias = await buscarMateriasComTopicos(preparatorioId);

        if (materias.length === 0) {
            await deletarPreparatorio(preparatorioId);
            return res.status(400).json({
                success: false,
                error: 'Nenhuma matéria com tópicos foi encontrada',
            });
        }

        // Buscar configurações de rodadas do banco
        const rodadasSettings = await getRodadasSettings();

        // Gerar rodadas sem persistir
        const config: ConfiguracaoGeracao = {
            materias_por_rodada: rodadasSettings.materias_por_rodada,
            max_topicos_por_missao: rodadasSettings.topicos_por_missao_com_subtopicos,
            incluir_revisao_op: true,
            incluir_tecnicas_op: true,
            incluir_simulado: true,
            gerar_filtros_questoes: true,
        };

        const resultadoRodadas = gerarRodadas(materias, config, rodadasSettings);

        if (!resultadoRodadas.success) {
            await deletarPreparatorio(preparatorioId);
            return res.status(500).json({
                success: false,
                error: resultadoRodadas.error || 'Erro ao gerar rodadas',
            });
        }

        const tempoTotal = Date.now() - startTime;
        console.log(`[FromPDF-Preview] Análise concluída em ${(tempoTotal / 1000).toFixed(1)}s - Aguardando confirmação`);

        // Retornar preview para o usuário validar/reordenar
        return res.json({
            success: true,
            preparatorioId,
            preparatorioInfo: {
                slug: resultadoPrep.slug,
                nome: analise.infoBasica.nome,
                banca: analise.infoBasica.banca,
                orgao: analise.infoBasica.orgao,
                cargo: analise.infoBasica.cargo,
            },
            materias: materias.map(m => ({
                id: m.id,
                titulo: m.titulo,
                prioridade: m.prioridade,
                topicosCount: m.topicos.length,
            })),
            rodadasPreview: resultadoRodadas.rodadas,
            estatisticas: {
                blocos: resultadoEdital.blocos_criados,
                materias: resultadoEdital.materias_criadas,
                topicos: resultadoEdital.topicos_criados,
                subtopicos: resultadoEdital.subtopicos_criados,
                rodadas: resultadoRodadas.estatisticas.total_rodadas,
                missoes: resultadoRodadas.estatisticas.total_missoes,
                tempo_analise_ms: tempoTotal,
            },
        });

    } catch (error: any) {
        console.error('[FromPDF-Preview] Erro:', error);

        if (preparatorioId) {
            console.log(`[FromPDF-Preview] Rollback: deletando preparatório ${preparatorioId}`);
            await deletarPreparatorio(preparatorioId);
        }

        return res.status(500).json({
            success: false,
            error: error.message || 'Erro interno ao processar PDF',
        });
    }
});

/**
 * POST /api/preparatorio/confirm-rodadas
 *
 * Confirma as rodadas após validação/reordenação do usuário
 *
 * Body: {
 *   preparatorioId: string,
 *   materiasOrdenadas: Array<{ id: string, prioridade: number }>,
 *   banca?: string,
 *   raioX?: object - Dados do Raio-X (análise de prova anterior)
 * }
 */
app.post('/api/preparatorio/confirm-rodadas', express.json(), async (req, res) => {
    // Timeout de 10 minutos para permitir geração completa das missões
    req.setTimeout(10 * 60 * 1000);

    const { preparatorioId, materiasOrdenadas, banca, sistemaHibrido, raioX: raioXFromFrontend } = req.body;

    if (!preparatorioId || !materiasOrdenadas) {
        return res.status(400).json({
            success: false,
            error: 'preparatorioId e materiasOrdenadas são obrigatórios',
        });
    }

    console.log(`[ConfirmRodadas] Iniciando para preparatório: ${preparatorioId} (híbrido: ${sistemaHibrido})`);

    try {
        // Buscar matérias com tópicos
        let materias = await buscarMateriasComTopicos(preparatorioId);

        if (materias.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Nenhuma matéria com tópicos encontrada',
            });
        }

        // Reordenar conforme o usuário especificou
        const ordemMap = new Map<string, number>();
        for (const m of materiasOrdenadas) {
            ordemMap.set(m.id, m.prioridade);
        }

        materias = materias
            .sort((a, b) => {
                const prioA = ordemMap.get(a.id) ?? a.prioridade;
                const prioB = ordemMap.get(b.id) ?? b.prioridade;
                return prioA - prioB;
            })
            .map((m, idx) => ({
                ...m,
                prioridade: idx + 1,
            }));

        console.log(`[ConfirmRodadas] Matérias reordenadas: ${materias.map(m => m.titulo).join(', ')}`);

        // Se for sistema híbrido, não gerar rodadas automaticamente
        if (sistemaHibrido) {
            // Apenas salvar a ordem das matérias no banco
            const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
            const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
            const supabase = createClient(supabaseUrl, supabaseKey);

            // Atualizar ordem das matérias na tabela correta (edital_verticalizado_items)
            for (const materia of materias) {
                await supabase
                    .from('edital_verticalizado_items')
                    .update({ ordem: materia.prioridade })
                    .eq('id', materia.id);
            }

            // Salvar raio-x (incluindo dados de prova anterior se fornecidos)
            const raioX = {
                analise_automatica: false,
                sistema_hibrido: true,
                data_analise: new Date().toISOString(),
                ordem_materias: materias.map(m => ({ id: m.id, titulo: m.titulo, prioridade: m.prioridade })),
                // Incluir dados do Raio-X da prova anterior se fornecidos pelo frontend
                ...(raioXFromFrontend && {
                    prova_anterior: {
                        total_questoes: raioXFromFrontend.total_questoes,
                        tipo_predominante: raioXFromFrontend.tipo_predominante,
                        banca_identificada: raioXFromFrontend.banca_identificada,
                        distribuicao: raioXFromFrontend.distribuicao,
                        analisado_em: raioXFromFrontend.analisado_em,
                    },
                }),
            };
            await atualizarRaioX(preparatorioId, raioX);

            // Criar mensagens de incentivo
            const resultadoMensagens = await criarMensagensIncentivoPadrao(preparatorioId);
            console.log(`[ConfirmRodadas] Mensagens criadas: ${resultadoMensagens.mensagens_criadas}`);

            // Atualizar status para montagem em andamento
            await supabase
                .from('preparatorios')
                .update({ montagem_status: 'em_andamento' })
                .eq('id', preparatorioId);

            console.log(`[ConfirmRodadas] Sistema híbrido configurado, redirecionando para montagem manual`);

            return res.json({
                success: true,
                sistemaHibrido: true,
                estatisticas: {
                    materias: materias.length,
                    mensagens_incentivo: resultadoMensagens.mensagens_criadas,
                },
            });
        }

        // Buscar configurações de rodadas do banco
        const rodadasSettings = await getRodadasSettings();

        // Fluxo original: Gerar rodadas automaticamente
        const config: ConfiguracaoGeracao = {
            materias_por_rodada: rodadasSettings.materias_por_rodada,
            max_topicos_por_missao: rodadasSettings.topicos_por_missao_com_subtopicos,
            incluir_revisao_op: true,
            incluir_tecnicas_op: true,
            incluir_simulado: true,
            gerar_filtros_questoes: true,
        };

        const resultadoRodadas = gerarRodadas(materias, config, rodadasSettings);

        if (!resultadoRodadas.success) {
            return res.status(500).json({
                success: false,
                error: resultadoRodadas.error || 'Erro ao gerar rodadas',
            });
        }

        // Persistir rodadas
        const resultadoPersistencia = await persistirRodadas(
            preparatorioId,
            resultadoRodadas.rodadas,
            true,
            true,
            banca
        );

        if (!resultadoPersistencia.success) {
            return res.status(500).json({
                success: false,
                error: resultadoPersistencia.error || 'Erro ao salvar rodadas',
            });
        }

        console.log(`[ConfirmRodadas] Rodadas persistidas: ${resultadoPersistencia.rodadas_criadas}`);

        // Salvar raio-x (incluindo dados de prova anterior se fornecidos)
        const raioX = {
            analise_automatica: true,
            data_analise: new Date().toISOString(),
            ordem_materias: materias.map(m => ({ id: m.id, titulo: m.titulo, prioridade: m.prioridade })),
            total_rodadas: resultadoRodadas.estatisticas.total_rodadas,
            total_missoes: resultadoRodadas.estatisticas.total_missoes,
            // Incluir dados do Raio-X da prova anterior se fornecidos pelo frontend
            ...(raioXFromFrontend && {
                prova_anterior: {
                    total_questoes: raioXFromFrontend.total_questoes,
                    tipo_predominante: raioXFromFrontend.tipo_predominante,
                    banca_identificada: raioXFromFrontend.banca_identificada,
                    distribuicao: raioXFromFrontend.distribuicao,
                    analisado_em: raioXFromFrontend.analisado_em,
                },
            }),
        };
        await atualizarRaioX(preparatorioId, raioX);

        // Criar mensagens de incentivo
        const resultadoMensagens = await criarMensagensIncentivoPadrao(preparatorioId);
        console.log(`[ConfirmRodadas] Mensagens criadas: ${resultadoMensagens.mensagens_criadas}`);

        // Marcar como "gerando missões" para o painel admin mostrar o status
        await supabase
            .from('preparatorios')
            .update({ montagem_status: 'em_andamento' })
            .eq('id', preparatorioId);

        console.log(`[ConfirmRodadas] Status atualizado para 'em_andamento' - geração em background`);

        // Iniciar geração de missões em BACKGROUND (fire-and-forget)
        // Isso permite que o usuário saia da página e a geração continue
        (async () => {
            const TIMEOUT_MS = 5 * 60 * 1000;
            const POLL_INTERVAL_MS = 3000;
            const startTime = Date.now();

            try {
                // Pequeno delay para garantir que a transação do banco foi commitada
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Buscar apenas missões do tipo 'padrao' (as que têm conteúdo a ser gerado)
                const missoes = await getPrimeirasMissoesPadrao(preparatorioId, 2);
                console.log(`[ConfirmRodadas-BG] Gerando conteúdo para ${missoes.length} missões do tipo 'padrao'...`);

                if (missoes.length === 0) {
                    console.warn(`[ConfirmRodadas-BG] ⚠️ Nenhuma missão do tipo 'padrao' encontrada`);
                    // Mesmo sem missões, ativar o preparatório
                    await supabase
                        .from('preparatorios')
                        .update({ 
                            montagem_status: 'concluida',
                            is_active: true 
                        })
                        .eq('id', preparatorioId);
                    console.log(`[ConfirmRodadas-BG] ✅ Preparatório ativado (sem missões para gerar)`);
                    return;
                }

                // Iniciar geração de todas as missões
                for (const missaoId of missoes) {
                    try {
                        await gerarConteudoMissaoBackground(missaoId);
                    } catch (err) {
                        console.error(`[ConfirmRodadas-BG] ❌ Erro na missão ${missaoId}:`, err);
                    }
                }

                // Aguardar até que todas as missões tenham status 'completed'
                console.log(`[ConfirmRodadas-BG] Aguardando conclusão (timeout: 5min)...`);

                let missoesCompletas = 0;
                while (Date.now() - startTime < TIMEOUT_MS) {
                    const { data: conteudos } = await supabase
                        .from('missao_conteudos')
                        .select('missao_id, status')
                        .in('missao_id', missoes);

                    const completedCount = conteudos?.filter(c => c.status === 'completed').length || 0;
                    const failedCount = conteudos?.filter(c => c.status === 'failed').length || 0;

                    if (completedCount + failedCount >= missoes.length) {
                        missoesCompletas = completedCount;
                        console.log(`[ConfirmRodadas-BG] ✅ ${completedCount} completas, ${failedCount} falharam`);
                        break;
                    }

                    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
                }

                // Verificar timeout
                if (Date.now() - startTime >= TIMEOUT_MS) {
                    const { data: conteudos } = await supabase
                        .from('missao_conteudos')
                        .select('missao_id, status')
                        .in('missao_id', missoes);
                    missoesCompletas = conteudos?.filter(c => c.status === 'completed').length || 0;
                    console.warn(`[ConfirmRodadas-BG] ⚠️ Timeout. ${missoesCompletas}/${missoes.length} completas`);
                }

                // Atualizar status final do preparatório
                if (missoesCompletas > 0) {
                    await supabase
                        .from('preparatorios')
                        .update({ 
                            montagem_status: 'concluida',
                            is_active: true 
                        })
                        .eq('id', preparatorioId);
                    console.log(`[ConfirmRodadas-BG] ✅ Preparatório ativado e montagem concluída`);
                } else {
                    // Marcar como erro para o admin ver
                    await supabase
                        .from('preparatorios')
                        .update({ montagem_status: 'pendente' })
                        .eq('id', preparatorioId);
                    console.warn(`[ConfirmRodadas-BG] ⚠️ Nenhuma missão gerada, voltando para pendente`);
                }

            } catch (error) {
                console.error('[ConfirmRodadas-BG] Erro fatal:', error);
                await supabase
                    .from('preparatorios')
                    .update({ montagem_status: 'pendente' })
                    .eq('id', preparatorioId);
            }
        })().catch(err => {
            console.error('[ConfirmRodadas-BG] Erro não tratado:', err);
        });

        // Retornar imediatamente - a geração continua em background
        return res.json({
            success: true,
            generating: true, // Indica que a geração está em andamento
            message: 'Rodadas criadas. A geração do conteúdo das missões está em andamento.',
            estatisticas: {
                rodadas: resultadoPersistencia.rodadas_criadas,
                missoes: resultadoPersistencia.missoes_criadas,
                vinculos: resultadoPersistencia.vinculos_criados,
                filtros: resultadoPersistencia.filtros_criados,
                mensagens_incentivo: resultadoMensagens.mensagens_criadas,
            },
        });

    } catch (error: any) {
        console.error('[ConfirmRodadas] Erro:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro ao confirmar rodadas',
        });
    }
});

/**
 * DELETE /api/preparatorio/cancel-creation/:preparatorioId
 *
 * Cancela a criação de um preparatório (usado se o usuário desistir na fase de validação)
 */
app.delete('/api/preparatorio/cancel-creation/:preparatorioId', async (req, res) => {
    const { preparatorioId } = req.params;

    if (!preparatorioId) {
        return res.status(400).json({
            success: false,
            error: 'preparatorioId é obrigatório',
        });
    }

    console.log(`[CancelCreation] Deletando preparatório: ${preparatorioId}`);

    try {
        const deleted = await deletarPreparatorio(preparatorioId);

        if (deleted) {
            return res.json({ success: true });
        } else {
            return res.status(500).json({
                success: false,
                error: 'Não foi possível deletar o preparatório',
            });
        }
    } catch (error: any) {
        console.error('[CancelCreation] Erro:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro ao cancelar criação',
        });
    }
});

// =====================================================
// MISSION BUILDER ENDPOINTS
// Sistema híbrido de montagem manual de missões
// =====================================================

/**
 * GET /api/preparatorio/:id/builder-state
 * Retorna o estado completo do builder para montagem de missões
 */
app.get('/api/preparatorio/:id/builder-state', async (req, res) => {
    const { id: preparatorioId } = req.params;

    if (!preparatorioId) {
        return res.status(400).json({
            success: false,
            error: 'preparatorioId é obrigatório',
        });
    }

    console.log(`[Builder] Buscando estado para preparatório: ${preparatorioId}`);

    try {
        const state = await getBuilderState(preparatorioId);
        return res.json({ success: true, data: state });
    } catch (error: any) {
        console.error('[Builder] Erro ao buscar estado:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro ao buscar estado do builder',
        });
    }
});

/**
 * GET /api/preparatorio/:id/materias/:materiaId/topicos
 * Retorna os tópicos disponíveis de uma matéria
 */
app.get('/api/preparatorio/:id/materias/:materiaId/topicos', async (req, res) => {
    const { id: preparatorioId, materiaId } = req.params;

    if (!preparatorioId || !materiaId) {
        return res.status(400).json({
            success: false,
            error: 'preparatorioId e materiaId são obrigatórios',
        });
    }

    console.log(`[Builder] Buscando tópicos da matéria ${materiaId}`);

    try {
        const topicos = await getTopicosDisponiveis(materiaId, preparatorioId);
        return res.json({ success: true, data: topicos });
    } catch (error: any) {
        console.error('[Builder] Erro ao buscar tópicos:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro ao buscar tópicos',
        });
    }
});

/**
 * POST /api/preparatorio/:id/missoes
 * Cria uma nova missão (estudo ou revisão)
 */
app.post('/api/preparatorio/:id/missoes', async (req, res) => {
    const { id: preparatorioId } = req.params;
    const { rodada_id, materia_id, assuntos_ids, tipo, tema, assunto, revisao_criterios } = req.body;

    if (!preparatorioId || !rodada_id) {
        return res.status(400).json({
            success: false,
            error: 'preparatorioId e rodada_id são obrigatórios',
        });
    }

    try {
        // Missão de revisão: não precisa de materia_id e assuntos_ids
        if (tipo === 'revisao') {
            console.log(`[Builder] Criando missão de revisão na rodada ${rodada_id}`);

            // Contar revisões existentes na rodada para definir ordem e parte
            const { data: revisoesExistentes } = await supabase
                .from('missoes')
                .select('id')
                .eq('rodada_id', rodada_id)
                .eq('tipo', 'revisao');

            const revisaoParte = (revisoesExistentes?.length || 0) + 1;

            // Critérios padrão: apenas questões erradas
            const criterios = revisao_criterios || ['erradas'];

            const { data: novaMissao, error } = await supabase
                .from('missoes')
                .insert({
                    rodada_id,
                    numero: '8',
                    tipo: 'revisao',
                    tema: tema || 'REVISÃO OUSE PASSAR',
                    assunto: assunto || null,
                    ordem: 8,
                    revisao_parte: revisaoParte > 1 ? revisaoParte : null,
                    revisao_criterios: criterios,
                })
                .select()
                .single();

            if (error) {
                throw new Error(`Erro ao criar missão de revisão: ${error.message}`);
            }

            return res.json({ success: true, data: novaMissao });
        }

        // Missão de estudo: precisa de materia_id e assuntos_ids
        if (!materia_id || !assuntos_ids?.length) {
            return res.status(400).json({
                success: false,
                error: 'materia_id e assuntos_ids são obrigatórios para missões de estudo',
            });
        }

        console.log(`[Builder] Criando missão de estudo na rodada ${rodada_id} com ${assuntos_ids.length} tópicos`);

        const missao = await createMissao(preparatorioId, {
            rodada_id,
            materia_id,
            assuntos_ids,
            tipo: tipo || 'estudo',
        });
        return res.json({ success: true, data: missao });
    } catch (error: any) {
        console.error('[Builder] Erro ao criar missão:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro ao criar missão',
        });
    }
});

/**
 * DELETE /api/preparatorio/:id/missoes/:missaoId
 * Deleta uma missão
 */
app.delete('/api/preparatorio/:id/missoes/:missaoId', async (req, res) => {
    const { missaoId } = req.params;

    if (!missaoId) {
        return res.status(400).json({
            success: false,
            error: 'missaoId é obrigatório',
        });
    }

    console.log(`[Builder] Deletando missão: ${missaoId}`);

    try {
        await deleteMissao(missaoId);
        return res.json({ success: true });
    } catch (error: any) {
        console.error('[Builder] Erro ao deletar missão:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro ao deletar missão',
        });
    }
});

/**
 * PUT /api/preparatorio/:id/missoes/:missaoId
 * Atualiza uma missão existente
 */
app.put('/api/preparatorio/:id/missoes/:missaoId', async (req, res) => {
    const { missaoId } = req.params;
    const { tema, assunto, materia, acao, instrucoes } = req.body;

    if (!missaoId) {
        return res.status(400).json({
            success: false,
            error: 'missaoId é obrigatório',
        });
    }

    console.log(`[Builder] Atualizando missão: ${missaoId}`);

    try {
        // Montar objeto de update apenas com campos fornecidos
        const updateData: Record<string, any> = {};
        if (tema !== undefined) updateData.tema = tema;
        if (assunto !== undefined) updateData.assunto = assunto;
        if (materia !== undefined) updateData.materia = materia;
        if (acao !== undefined) updateData.acao = acao;
        if (instrucoes !== undefined) updateData.instrucoes = instrucoes;

        const { data, error } = await supabase
            .from('missoes')
            .update(updateData)
            .eq('id', missaoId)
            .select()
            .single();

        if (error) {
            throw new Error(`Erro ao atualizar missão: ${error.message}`);
        }

        return res.json({ success: true, data });
    } catch (error: any) {
        console.error('[Builder] Erro ao atualizar missão:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro ao atualizar missão',
        });
    }
});

/**
 * POST /api/preparatorio/:id/rodadas
 * Cria uma nova rodada com as 3 missões obrigatórias
 */
app.post('/api/preparatorio/:id/rodadas', async (req, res) => {
    const { id: preparatorioId } = req.params;
    const { numero, titulo } = req.body;

    if (!preparatorioId) {
        return res.status(400).json({
            success: false,
            error: 'preparatorioId é obrigatório',
        });
    }

    console.log(`[Builder] Criando nova rodada para preparatório: ${preparatorioId}`);

    try {
        const rodada = await createRodada(preparatorioId, { numero, titulo });
        return res.json({ success: true, data: rodada });
    } catch (error: any) {
        console.error('[Builder] Erro ao criar rodada:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro ao criar rodada',
        });
    }
});

/**
 * DELETE /api/preparatorio/:id/rodadas/:rodadaId
 * Deleta uma rodada e todas suas missões
 */
app.delete('/api/preparatorio/:id/rodadas/:rodadaId', async (req, res) => {
    const { rodadaId } = req.params;

    if (!rodadaId) {
        return res.status(400).json({
            success: false,
            error: 'rodadaId é obrigatório',
        });
    }

    console.log(`[Builder] Deletando rodada: ${rodadaId}`);

    try {
        await deleteRodada(rodadaId);
        return res.json({ success: true });
    } catch (error: any) {
        console.error('[Builder] Erro ao deletar rodada:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro ao deletar rodada',
        });
    }
});

/**
 * POST /api/preparatorio/:id/rodadas/:rodadaId/revisao-extra
 * Adiciona uma missão extra de revisão
 */
app.post('/api/preparatorio/:id/rodadas/:rodadaId/revisao-extra', async (req, res) => {
    const { rodadaId } = req.params;

    if (!rodadaId) {
        return res.status(400).json({
            success: false,
            error: 'rodadaId é obrigatório',
        });
    }

    console.log(`[Builder] Adicionando revisão extra na rodada: ${rodadaId}`);

    try {
        const revisao = await addRevisaoExtra(rodadaId);
        return res.json({ success: true, data: revisao });
    } catch (error: any) {
        console.error('[Builder] Erro ao adicionar revisão extra:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro ao adicionar revisão extra',
        });
    }
});

/**
 * GET /api/preparatorio/:id/rodadas/:rodadaId/missoes
 * Retorna as missões de uma rodada
 */
app.get('/api/preparatorio/:id/rodadas/:rodadaId/missoes', async (req, res) => {
    const { rodadaId } = req.params;

    if (!rodadaId) {
        return res.status(400).json({
            success: false,
            error: 'rodadaId é obrigatório',
        });
    }

    try {
        const missoes = await getMissoesPorRodada(rodadaId);
        return res.json({ success: true, data: missoes });
    } catch (error: any) {
        console.error('[Builder] Erro ao buscar missões:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro ao buscar missões',
        });
    }
});

/**
 * POST /api/preparatorio/:id/finalizar-montagem
 * Finaliza a montagem do preparatório
 */
app.post('/api/preparatorio/:id/finalizar-montagem', async (req, res) => {
    const { id: preparatorioId } = req.params;

    if (!preparatorioId) {
        return res.status(400).json({
            success: false,
            error: 'preparatorioId é obrigatório',
        });
    }

    console.log(`[Builder] Finalizando montagem do preparatório: ${preparatorioId}`);

    try {
        const result = await finalizarMontagem(preparatorioId);

        // IMPORTANTE: Disparar geração automática das primeiras 2 missões em background
        // Isso garante que o conteúdo estará pronto quando o primeiro aluno acessar
        if (result.success) {
            // ========== OTIMIZAÇÃO DE FILTROS POR IA ==========
            // Adapta os termos de matéria/assunto do edital para os termos do banco de questões
            console.log(`[Builder] Disparando otimização de filtros por IA para ${preparatorioId}...`);
            otimizarFiltrosPreparatorio(preparatorioId)
                .then(otimizacaoResult => {
                    if (otimizacaoResult.success) {
                        console.log(`[Builder] Filtros otimizados: ${otimizacaoResult.missoesOtimizadas}/${otimizacaoResult.missoesProcessadas} missões adaptadas`);
                        // Log das adaptações feitas
                        for (const adaptacao of otimizacaoResult.adaptacoes) {
                            if (adaptacao.observacoes.length > 0) {
                                console.log(`[Builder] Adaptações missão ${adaptacao.missaoId}:`);
                                for (const obs of adaptacao.observacoes) {
                                    console.log(`  - ${obs}`);
                                }
                            }
                        }
                    } else {
                        console.error(`[Builder] Erro na otimização de filtros:`, otimizacaoResult.error);
                    }
                })
                .catch(err => {
                    console.error(`[Builder] Erro ao otimizar filtros:`, err.message);
                });

            console.log(`[Builder] Disparando geração automática de conteúdo para ${preparatorioId}...`);

            // Buscar as primeiras 2 missões do tipo 'padrao' (as que têm conteúdo)
            const primeiras = await getPrimeirasMissoesPadrao(preparatorioId, 2);

            if (primeiras.length > 0) {
                console.log(`[Builder] Gerando conteúdo para missões: ${primeiras.join(', ')}`);

                // Gerar em background (fire-and-forget)
                for (const missaoId of primeiras) {
                    gerarConteudoMissaoBackground(missaoId)
                        .then(success => {
                            console.log(`[Builder] Conteúdo gerado para missão ${missaoId}: ${success ? 'OK' : 'FALHOU'}`);
                        })
                        .catch(err => {
                            console.error(`[Builder] Erro ao gerar conteúdo para missão ${missaoId}:`, err.message);
                        });
                }
            } else {
                console.log(`[Builder] Nenhuma missão de estudo encontrada para gerar conteúdo`);
            }
        }

        return res.json(result);
    } catch (error: any) {
        console.error('[Builder] Erro ao finalizar montagem:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro ao finalizar montagem',
        });
    }
});

/**
 * Otimizar filtros de questões de um preparatório usando IA
 * Endpoint para rodar manualmente ou reprocessar
 */
app.post('/api/preparatorio/:id/otimizar-filtros', async (req, res) => {
    const { id: preparatorioId } = req.params;

    if (!preparatorioId) {
        return res.status(400).json({
            success: false,
            error: 'preparatorioId é obrigatório',
        });
    }

    console.log(`[FiltrosAdapter] Iniciando otimização manual para ${preparatorioId}...`);

    try {
        const result = await otimizarFiltrosPreparatorio(preparatorioId);

        if (result.success) {
            console.log(`[FiltrosAdapter] Otimização concluída: ${result.missoesOtimizadas}/${result.missoesProcessadas} missões`);
        }

        return res.json(result);
    } catch (error: any) {
        console.error('[FiltrosAdapter] Erro:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro ao otimizar filtros',
        });
    }
});

/**
 * Sugerir filtros de questões para uma missão usando IA
 * Endpoint chamado durante a criação/edição de missão
 */
app.post('/api/missao/sugerir-filtros', async (req, res) => {
    const { materiaEdital, assuntoEdital, banca, cargo, escolaridade, modalidade } = req.body;

    if (!materiaEdital) {
        return res.status(400).json({
            success: false,
            error: 'materiaEdital é obrigatório',
        });
    }

    console.log(`[SugerirFiltros] Sugerindo filtros para: ${materiaEdital} - ${assuntoEdital || 'sem assunto'}`);

    try {
        const result = await sugerirFiltrosMissao({
            materiaEdital,
            assuntoEdital,
            banca,
            cargo,
            escolaridade,
            modalidade,
        });

        if (result.success) {
            console.log(`[SugerirFiltros] Filtros sugeridos: ${JSON.stringify(result.filtrosSugeridos)}`);
        }

        return res.json(result);
    } catch (error: any) {
        console.error('[SugerirFiltros] Erro:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro ao sugerir filtros',
        });
    }
});

// ==================== EMAIL ENDPOINTS ====================

/**
 * Testar conexão com Resend
 */
app.post('/api/email/test', async (req, res) => {
    try {
        // Buscar API key do banco
        const { data: settings, error } = await supabase
            .from('email_settings')
            .select('valor')
            .eq('chave', 'resend_api_key')
            .single();

        if (error || !settings?.valor) {
            return res.json({
                success: false,
                error: 'API Key do Resend não configurada',
            });
        }

        // Testar fazendo uma requisição simples ao Resend
        const response = await fetch('https://api.resend.com/domains', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${settings.valor}`,
            },
        });

        if (response.ok) {
            return res.json({ success: true });
        } else {
            const errorData = await response.json();
            return res.json({
                success: false,
                error: errorData.message || 'Erro ao conectar com Resend',
            });
        }
    } catch (error: any) {
        console.error('[Email] Erro ao testar conexão:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro ao testar conexão',
        });
    }
});

/**
 * Enviar e-mail de boas-vindas
 */
app.post('/api/email/send-welcome', async (req, res) => {
    const { produto, destinatarioEmail, destinatarioNome } = req.body;

    if (!produto || !destinatarioEmail) {
        return res.status(400).json({
            success: false,
            error: 'produto e destinatarioEmail são obrigatórios',
        });
    }

    console.log(`[Email] Enviando e-mail de boas-vindas para ${destinatarioEmail} (${produto})`);

    try {
        // Buscar configurações
        const { data: settingsData, error: settingsError } = await supabase
            .from('email_settings')
            .select('chave, valor');

        if (settingsError) {
            throw new Error('Erro ao buscar configurações de e-mail');
        }

        const settings: Record<string, string> = {};
        for (const row of settingsData || []) {
            settings[row.chave] = row.valor;
        }

        if (!settings.resend_api_key) {
            return res.json({
                success: false,
                error: 'API Key do Resend não configurada',
            });
        }

        if (settings.emails_ativos === 'false') {
            return res.json({
                success: false,
                error: 'E-mails estão desativados',
            });
        }

        // Buscar template
        const { data: template, error: templateError } = await supabase
            .from('email_templates')
            .select('*')
            .eq('produto', produto)
            .eq('ativo', true)
            .single();

        if (templateError || !template) {
            return res.json({
                success: false,
                error: `Template não encontrado para o produto: ${produto}`,
            });
        }

        // Substituir variáveis
        const variaveis: Record<string, string> = {
            nome: destinatarioNome || 'Aluno',
            email: destinatarioEmail,
            produto: template.nome_produto,
        };

        let corpoHtml = template.corpo_html;
        let corpoTexto = template.corpo_texto;
        let assunto = template.assunto;

        for (const [key, value] of Object.entries(variaveis)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            corpoHtml = corpoHtml.replace(regex, value);
            corpoTexto = corpoTexto.replace(regex, value);
            assunto = assunto.replace(regex, value);
        }

        // Criar log
        const { data: logData, error: logError } = await supabase
            .from('email_logs')
            .insert({
                template_id: template.id,
                destinatario_email: destinatarioEmail,
                destinatario_nome: destinatarioNome,
                assunto,
                status: 'pending',
            })
            .select()
            .single();

        const logId = logData?.id;

        // Enviar via Resend
        const remetenteEmail = settings.remetente_email || 'noreply@ousepassar.com.br';
        const remetenteNome = settings.remetente_nome || 'Ouse Passar';

        const sendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.resend_api_key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `${remetenteNome} <${remetenteEmail}>`,
                to: [destinatarioEmail],
                subject: assunto,
                html: corpoHtml,
                text: corpoTexto,
            }),
        });

        const sendResult = await sendResponse.json();

        // Atualizar log
        if (sendResponse.ok && sendResult.id) {
            await supabase
                .from('email_logs')
                .update({
                    status: 'sent',
                    resend_id: sendResult.id,
                    enviado_em: new Date().toISOString(),
                })
                .eq('id', logId);

            console.log(`[Email] E-mail enviado com sucesso: ${sendResult.id}`);
            return res.json({ success: true, resendId: sendResult.id });
        } else {
            await supabase
                .from('email_logs')
                .update({
                    status: 'failed',
                    erro: sendResult.message || 'Erro desconhecido',
                })
                .eq('id', logId);

            console.error('[Email] Erro ao enviar:', sendResult);
            return res.json({
                success: false,
                error: sendResult.message || 'Erro ao enviar e-mail',
            });
        }
    } catch (error: any) {
        console.error('[Email] Erro:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro ao enviar e-mail',
        });
    }
});

// ==================== STORE ENDPOINTS ====================

/**
 * Listar categorias da loja
 */
app.get('/api/store/categories', async (req, res) => {
    try {
        const categories = await storeService.getCategories();
        return res.json({ success: true, categories });
    } catch (error: any) {
        console.error('[Store] Erro ao buscar categorias:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Listar produtos da loja (com filtros opcionais)
 */
app.get('/api/store/products', async (req, res) => {
    try {
        const { category, type, featured, search } = req.query;
        const products = await storeService.getProducts({
            category_slug: category as string,
            product_type: type as string,
            is_featured: featured === 'true',
            search: search as string,
        });
        return res.json({ success: true, products });
    } catch (error: any) {
        console.error('[Store] Erro ao buscar produtos:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Buscar produto por ID
 */
app.get('/api/store/products/:id', async (req, res) => {
    try {
        const product = await storeService.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Produto não encontrado' });
        }
        return res.json({ success: true, product });
    } catch (error: any) {
        console.error('[Store] Erro ao buscar produto:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Produtos em destaque
 */
app.get('/api/store/featured', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 6;
        const products = await storeService.getFeaturedProducts(limit);
        return res.json({ success: true, products });
    } catch (error: any) {
        console.error('[Store] Erro ao buscar produtos em destaque:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Comprar produto com moedas
 */
app.post('/api/store/purchase/coins', async (req, res) => {
    try {
        const { userId, itemId, quantity } = req.body;
        if (!userId || !itemId) {
            return res.status(400).json({ success: false, error: 'userId e itemId são obrigatórios' });
        }
        const result = await storeService.purchaseWithCoins(userId, itemId, quantity || 1);
        return res.json(result);
    } catch (error: any) {
        console.error('[Store] Erro ao comprar produto:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Histórico de compras do usuário
 */
app.get('/api/store/purchases/:userId', async (req, res) => {
    try {
        const purchases = await storeService.getUserPurchases(req.params.userId);
        return res.json({ success: true, purchases });
    } catch (error: any) {
        console.error('[Store] Erro ao buscar compras:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Inventário do usuário
 */
app.get('/api/store/inventory/:userId', async (req, res) => {
    try {
        const inventory = await storeService.getUserInventory(req.params.userId);
        return res.json({ success: true, inventory });
    } catch (error: any) {
        console.error('[Store] Erro ao buscar inventário:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Equipar item do inventário
 */
app.post('/api/store/inventory/:inventoryId/equip', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId é obrigatório' });
        }
        const result = await storeService.equipItem(userId, req.params.inventoryId);
        return res.json(result);
    } catch (error: any) {
        console.error('[Store] Erro ao equipar item:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Boosts ativos do usuário
 */
app.get('/api/store/boosts/:userId', async (req, res) => {
    try {
        const boosts = await storeService.getUserActiveBoosts(req.params.userId);
        return res.json({ success: true, boosts });
    } catch (error: any) {
        console.error('[Store] Erro ao buscar boosts:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Usar boost
 */
app.post('/api/store/boosts/:boostId/use', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId é obrigatório' });
        }
        const result = await storeService.useBoost(req.params.boostId, userId);
        return res.json(result);
    } catch (error: any) {
        console.error('[Store] Erro ao usar boost:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Ativar modo Reta Final
 */
app.post('/api/trails/:trailId/reta-final', async (req, res) => {
    try {
        const { userId, dataProva } = req.body;
        if (!userId || !dataProva) {
            return res.status(400).json({ success: false, error: 'userId e dataProva são obrigatórios' });
        }
        const result = await storeService.activateRetaFinal(userId, req.params.trailId, dataProva);
        return res.json(result);
    } catch (error: any) {
        console.error('[Store] Erro ao ativar Reta Final:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * Status do Reta Final
 */
app.get('/api/trails/:trailId/reta-final/:userId', async (req, res) => {
    try {
        const status = await storeService.getRetaFinalStatus(req.params.userId, req.params.trailId);
        return res.json({ success: true, status });
    } catch (error: any) {
        console.error('[Store] Erro ao buscar status Reta Final:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== STORE ADMIN ENDPOINTS ====================

/**
 * [Admin] Listar todas categorias
 */
app.get('/api/admin/store/categories', async (req, res) => {
    try {
        const categories = await storeService.getAllCategories();
        return res.json({ success: true, categories });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * [Admin] Criar categoria
 */
app.post('/api/admin/store/categories', async (req, res) => {
    try {
        const category = await storeService.createCategory(req.body);
        return res.json({ success: true, category });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * [Admin] Atualizar categoria
 */
app.put('/api/admin/store/categories/:id', async (req, res) => {
    try {
        const category = await storeService.updateCategory(req.params.id, req.body);
        return res.json({ success: true, category });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * [Admin] Deletar categoria
 */
app.delete('/api/admin/store/categories/:id', async (req, res) => {
    try {
        await storeService.deleteCategory(req.params.id);
        return res.json({ success: true });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * [Admin] Listar todos produtos
 */
app.get('/api/admin/store/products', async (req, res) => {
    try {
        const products = await storeService.getAllProducts();
        return res.json({ success: true, products });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * [Admin] Criar produto
 */
app.post('/api/admin/store/products', async (req, res) => {
    try {
        const product = await storeService.createProduct(req.body);
        return res.json({ success: true, product });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * [Admin] Atualizar produto
 */
app.put('/api/admin/store/products/:id', async (req, res) => {
    try {
        const product = await storeService.updateProduct(req.params.id, req.body);
        return res.json({ success: true, product });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * [Admin] Deletar produto
 */
app.delete('/api/admin/store/products/:id', async (req, res) => {
    try {
        await storeService.deleteProduct(req.params.id);
        return res.json({ success: true });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * [Admin] Listar todas compras
 */
app.get('/api/admin/store/purchases', async (req, res) => {
    try {
        const { status, limit } = req.query;
        const purchases = await storeService.getAllPurchases({
            status: status as string,
            limit: limit ? parseInt(limit as string) : undefined,
        });
        return res.json({ success: true, purchases });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * [Admin] Estatísticas da loja
 */
app.get('/api/admin/store/stats', async (req, res) => {
    try {
        const stats = await storeService.getStoreStats();
        return res.json({ success: true, stats });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * [Admin] Sincronizar preparatórios com a loja
 */
app.post('/api/admin/store/sync-preparatorios', async (req, res) => {
    try {
        const result = await storeService.syncPreparatoriosToStore();
        return res.json({ success: true, ...result });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PDF Generation Endpoint
 * Generates a PDF for simulado exams using Puppeteer
 */
app.post('/api/pdf/simulado', async (req, res) => {
    try {
        const {
            simuladoName,
            preparatorioName,
            studentName,
            cargo,
            questions,
            totalTime,
            provaNumber,
        } = req.body;

        if (!simuladoName || !questions || questions.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: simuladoName and questions',
            });
        }

        console.log(`Generating PDF for simulado: ${simuladoName} with ${questions.length} questions`);

        const pdfBuffer = await generateSimuladoPDF({
            simuladoName,
            preparatorioName,
            studentName: studentName || 'Aluno',
            cargo,
            questions,
            totalTime: totalTime || 180,
            provaNumber: provaNumber || 0,
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${simuladoName.replace(/[^a-zA-Z0-9]/g, '_')}_Prova_${(provaNumber || 0) + 1}.pdf"`
        );
        res.send(pdfBuffer);

        console.log(`PDF generated successfully: ${pdfBuffer.length} bytes`);
    } catch (error: any) {
        console.error('Error generating PDF:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate PDF',
        });
    }
});

// ============================================================================
// PDF DE CURRICULO - Pesca Talentos
// ============================================================================

import { generateCurriculumPDF, sanitizeFileName, CurriculumData, CurriculumType } from './services/curriculoPdfService.js';

/**
 * POST /api/pdf/curriculo/simples
 * Gera PDF de curriculo simples (preto e branco, ideal para email)
 */
app.post('/api/pdf/curriculo/simples', async (req, res) => {
    try {
        const data: CurriculumData = req.body;

        // Validacao basica
        if (!data.candidateName) {
            return res.status(400).json({
                success: false,
                error: 'O campo candidateName e obrigatorio',
            });
        }

        console.log(`[PDF Simples] Gerando curriculo para: ${data.candidateName}`);

        // Gerar PDF simples
        const pdfBuffer = await generateCurriculumPDF(data, 'simples');

        // Configurar headers de resposta
        const fileName = `Curriculo_Simples_${sanitizeFileName(data.candidateName)}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        console.log(`[PDF Simples] Curriculo gerado com sucesso: ${fileName} (${pdfBuffer.length} bytes)`);

        return res.send(pdfBuffer);
    } catch (error: any) {
        console.error('[PDF Simples] Erro ao gerar curriculo:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro interno ao gerar PDF',
        });
    }
});

/**
 * POST /api/pdf/curriculo/completo
 * Gera PDF de curriculo completo (com foto e layout profissional colorido)
 */
app.post('/api/pdf/curriculo/completo', async (req, res) => {
    try {
        const data: CurriculumData = req.body;

        // Validacao basica
        if (!data.candidateName) {
            return res.status(400).json({
                success: false,
                error: 'O campo candidateName e obrigatorio',
            });
        }

        console.log(`[PDF Completo] Gerando curriculo para: ${data.candidateName}`);

        // Gerar PDF completo
        const pdfBuffer = await generateCurriculumPDF(data, 'completo');

        // Configurar headers de resposta
        const fileName = `Curriculo_Completo_${sanitizeFileName(data.candidateName)}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        console.log(`[PDF Completo] Curriculo gerado com sucesso: ${fileName} (${pdfBuffer.length} bytes)`);

        return res.send(pdfBuffer);
    } catch (error: any) {
        console.error('[PDF Completo] Erro ao gerar curriculo:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro interno ao gerar PDF',
        });
    }
});

/**
 * POST /api/preparatorio/analyze-prova
 * Analisa PDF de prova anterior e extrai o Raio-X (distribuição de questões por matéria)
 *
 * Body: FormData com campo 'pdf' contendo o arquivo PDF da prova anterior
 * Query params opcionais:
 *   - materias: JSON array com as matérias do edital para fazer match
 *
 * Retorna:
 * {
 *   success: true,
 *   raioX: {
 *     total_questoes: number,
 *     tipo_predominante: 'multipla_escolha' | 'certo_errado',
 *     banca_identificada: string | null,
 *     distribuicao: { materia: string, quantidade: number, percentual: number }[],
 *     analisado_em: string
 *   }
 * }
 */
app.post('/api/preparatorio/analyze-prova', upload.single('pdf'), async (req, res) => {
    const startTime = Date.now();

    try {
        // Validar arquivo PDF
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Arquivo PDF da prova anterior é obrigatório',
            });
        }

        console.log(`[Raio-X] Iniciando análise de prova com arquivo de ${(req.file.size / 1024 / 1024).toFixed(2)}MB`);

        // Obter matérias do edital se fornecidas (para match)
        let materiasEdital: string[] = [];
        if (req.body.materias) {
            try {
                materiasEdital = JSON.parse(req.body.materias);
            } catch (e) {
                console.log('[Raio-X] Não foi possível parsear matérias do edital, continuando sem match');
            }
        }

        // Obter o agente de análise de prova
        const agent = mastra.getAgent("provaAnalyzerAgent");

        if (!agent) {
            return res.status(500).json({
                success: false,
                error: 'Agente provaAnalyzerAgent não encontrado',
            });
        }

        // Preparar o PDF em base64
        const pdfBase64 = req.file.buffer.toString('base64');

        // Preparar contexto com matérias do edital
        const contextText = materiasEdital.length > 0
            ? `Analise esta prova de concurso e extraia o Raio-X (distribuição de questões por matéria).

CONTEXTO: O edital do concurso tem as seguintes matérias:
${materiasEdital.map((m, i) => `${i + 1}. ${m}`).join('\n')}

Tente fazer o match das matérias identificadas na prova com as matérias do edital acima.`
            : 'Analise esta prova de concurso e extraia o Raio-X (distribuição de questões por matéria).';

        // Chamar o agente com o PDF
        const analysisResult = await agent.generate([
            {
                role: 'user',
                content: [
                    { type: 'file', data: pdfBase64, mimeType: 'application/pdf' },
                    { type: 'text', text: contextText },
                ],
            },
        ]);

        const responseText = analysisResult.text || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            console.error('[Raio-X] Não foi possível extrair JSON da resposta:', responseText.substring(0, 500));
            return res.status(400).json({
                success: false,
                error: 'Não foi possível extrair informações da prova',
            });
        }

        let raioXRaw;
        try {
            raioXRaw = JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error('[Raio-X] Erro ao parsear JSON:', e);
            return res.status(400).json({
                success: false,
                error: 'Erro ao processar a análise da prova',
            });
        }

        // Validar estrutura básica
        if (!raioXRaw.distribuicao || !Array.isArray(raioXRaw.distribuicao)) {
            return res.status(400).json({
                success: false,
                error: 'A análise não retornou a distribuição de questões esperada',
            });
        }

        // Processar resultado (calcular percentuais, adicionar timestamp)
        const total = raioXRaw.total_questoes || raioXRaw.distribuicao.reduce((sum: number, d: any) => sum + d.quantidade, 0);

        const raioX = {
            total_questoes: total,
            tipo_predominante: raioXRaw.tipo_predominante || 'multipla_escolha',
            banca_identificada: raioXRaw.banca_identificada || null,
            distribuicao: raioXRaw.distribuicao.map((d: any) => ({
                materia: d.materia,
                quantidade: d.quantidade,
                percentual: Math.round((d.quantidade / total) * 100 * 10) / 10,
            })),
            analisado_em: new Date().toISOString(),
        };

        const elapsed = Date.now() - startTime;
        console.log(`[Raio-X] Análise concluída em ${elapsed}ms: ${raioX.total_questoes} questões, ${raioX.distribuicao.length} matérias`);

        return res.json({
            success: true,
            raioX,
        });

    } catch (error: any) {
        console.error('[Raio-X] Erro na análise:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro ao analisar prova anterior',
        });
    }
});

// Start the Express server

// ============================================================================
// ENDPOINT: Gerar conteúdo da missão (com suporte a regeneração e instruções extras)
// ============================================================================
app.post('/api/missao/gerar-conteudo', async (req, res) => {
    try {
        const { missaoId, materia, assunto, instrucoes, instrucoesAdicionais } = req.body;

        if (!missaoId) {
            return res.status(400).json({ success: false, error: 'missaoId é obrigatório' });
        }

        console.log(`[GerarConteudo] Iniciando geração para missão ${missaoId}...`);
        if (instrucoesAdicionais) {
            console.log(`[GerarConteudo] Instruções adicionais: ${instrucoesAdicionais.substring(0, 100)}...`);
        }

        // 1. Deletar conteúdo existente (forçar regeneração)
        const { error: deleteError } = await supabase
            .from('missao_conteudos')
            .delete()
            .eq('missao_id', missaoId);

        if (deleteError) {
            console.warn(`[GerarConteudo] Erro ao deletar conteúdo existente:`, deleteError);
        }

        // 2. Criar registro como "generating"
        const { data: contentRecord, error: insertError } = await supabase
            .from('missao_conteudos')
            .insert({
                missao_id: missaoId,
                texto_content: '',
                status: 'generating',
                modelo_texto: 'gemini-3-flash-preview',
            })
            .select('id')
            .single();

        if (insertError) {
            throw new Error(`Erro ao criar registro: ${insertError.message}`);
        }

        const contentId = contentRecord.id;

        // 3. Buscar informações da missão
        const missaoInfo = await getMissaoInfo(missaoId);
        if (!missaoInfo) {
            throw new Error('Missão não encontrada');
        }

        // 4. Buscar tópicos do edital
        const editalItemIds = await getMissaoEditalItems(missaoId);
        const topicos = editalItemIds.length > 0
            ? await getEditalItemsTitulos(editalItemIds)
            : [assunto || missaoInfo.assunto || 'Tema geral'];

        // 5. Buscar filtros e questões
        const filtros = await getMissaoFiltros(missaoId);
        const questoes = await buscarQuestoesScrapping(filtros, topicos, 20);

        console.log(`[GerarConteudo] ${questoes.length} questões encontradas para missão ${missaoId}`);

        // 6. Montar prompt
        let prompt: string;

        if (questoes.length === 0) {
            prompt = `
## Contexto da Missão

**Matéria:** ${materia || missaoInfo.materia || 'Matéria não especificada'}

**Tópicos do Edital para Estudo:**
${topicos.map((t: string) => `- ${t}`).join('\n')}

${instrucoesAdicionais ? `**Instruções Específicas do Professor:**\n${instrucoesAdicionais}\n` : ''}

---

**ATENÇÃO:** Não foram encontradas questões específicas para esta missão.
Crie uma aula teórica completa sobre "${topicos[0] || materia || missaoInfo.materia || 'o tema'}" baseada nos tópicos do edital acima.
A aula deve cobrir os conceitos fundamentais, exemplos práticos, e preparar o aluno para questões que cobrem esses tópicos.
`;
        } else {
            prompt = `
## Contexto da Missão

**Matéria:** ${materia || missaoInfo.materia || 'Matéria não especificada'}

**Tópicos do Edital:**
${topicos.map((t: string) => `- ${t}`).join('\n')}

${instrucoesAdicionais ? `**Instruções Específicas do Professor:**\n${instrucoesAdicionais}\n` : ''}

**Questões para Análise (${questoes.length} questões):**

${questoes.map((q: QuestaoFormatada) => `
### Questão ${q.numero} (${q.banca} ${q.ano})

**Enunciado:** ${q.enunciado}

**Alternativas:**
${q.alternativas.map((a: { letter: string; text: string }) => `${a.letter}) ${a.text}`).join('\n')}

**Gabarito:** ${q.gabarito}

**Comentário da banca/professor:** ${q.comentario}
`).join('\n---\n')}

---

Com base nas questões acima, crie uma aula completa sobre "${topicos[0] || materia || missaoInfo.materia || 'o tema'}".
A aula deve preparar o aluno para responder questões similares às apresentadas.
`;
        }

        // 7. Gerar conteúdo com IA
        const contentAgent = mastra.getAgent("contentGeneratorAgent");
        if (!contentAgent) throw new Error('contentGeneratorAgent não encontrado');

        console.log(`[GerarConteudo] Gerando texto para missão ${missaoId}...`);
        const contentResult = await contentAgent.generate([{ role: 'user', content: prompt }]);
        let textoContent = contentResult.text || '';

        console.log(`[GerarConteudo] Texto gerado (${textoContent.length} chars) para missão ${missaoId}`);

        // 7.5. Gerar e incorporar imagens educacionais (se habilitado)
        let imagensGeradas: string[] = [];
        if (missaoInfo.gerar_imagem !== false && textoContent.length > 500) {
            console.log(`[GerarConteudo] Gerando imagens educacionais para missão ${missaoId}...`);
            const imageResult = await gerarEIncorporarImagensEducacionais(
                textoContent,
                materia || missaoInfo.materia || 'Concursos',
                missaoId
            );
            textoContent = imageResult.textoContent;
            imagensGeradas = imageResult.imagensGeradas;
            console.log(`[GerarConteudo] ${imagensGeradas.length} imagens incorporadas ao conteúdo`);
        }

        // 8. Gerar roteiro para áudio
        const audioAgent = mastra.getAgent("audioScriptAgent");
        let roteiro = '';
        if (audioAgent && textoContent) {
            console.log(`[GerarConteudo] Gerando roteiro de áudio para missão ${missaoId}...`);
            const audioResult = await audioAgent.generate([{
                role: 'user',
                content: `Adapte o seguinte texto em Markdown para narração em áudio:\n\n${textoContent}`
            }]);
            roteiro = audioResult.text || '';
            console.log(`[GerarConteudo] Roteiro gerado (${roteiro.length} chars)`);
        }

        // 9. Gerar TTS (em background - responder primeiro)
        let audioUrl: string | null = null;
        let audioProcessing = false;

        if (roteiro && roteiro.length > 100) {
            audioProcessing = true;

            // Gerar áudio em background
            (async () => {
                try {
                    console.log(`[GerarConteudo] Gerando TTS para missão ${missaoId} (${roteiro.length} chars)...`);

                    const client = getGeminiClient();
                    if (client) {
                        const audioResponse = await client.models.generateContent({
                            model: 'gemini-2.5-flash-preview-tts',
                            contents: [{
                                parts: [{
                                    text: roteiro
                                }]
                            }],
                            config: {
                                responseModalities: ['AUDIO'],
                                speechConfig: {
                                    voiceConfig: {
                                        prebuiltVoiceConfig: {
                                            voiceName: 'Kore'
                                        }
                                    }
                                }
                            }
                        });

                        const audioData = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

                        if (audioData) {
                            // Convert PCM to WAV
                            const pcmBuffer = Buffer.from(audioData, 'base64');
                            const sampleRate = 24000;
                            const numChannels = 1;
                            const bitsPerSample = 16;
                            const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
                            const blockAlign = numChannels * (bitsPerSample / 8);

                            const wavHeader = Buffer.alloc(44);
                            wavHeader.write('RIFF', 0);
                            wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
                            wavHeader.write('WAVE', 8);
                            wavHeader.write('fmt ', 12);
                            wavHeader.writeUInt32LE(16, 16);
                            wavHeader.writeUInt16LE(1, 20);
                            wavHeader.writeUInt16LE(numChannels, 22);
                            wavHeader.writeUInt32LE(sampleRate, 24);
                            wavHeader.writeUInt32LE(byteRate, 28);
                            wavHeader.writeUInt16LE(blockAlign, 32);
                            wavHeader.writeUInt16LE(bitsPerSample, 34);
                            wavHeader.write('data', 36);
                            wavHeader.writeUInt32LE(pcmBuffer.length, 40);

                            const audioBuffer = Buffer.concat([wavHeader, pcmBuffer]);
                            const fileName = `missao-${missaoId}-${Date.now()}.wav`;

                            const { error: uploadError } = await supabase.storage
                                .from('missao-audios')
                                .upload(fileName, audioBuffer, {
                                    contentType: 'audio/wav',
                                    upsert: true,
                                });

                            if (!uploadError) {
                                const { data: publicUrlData } = supabase.storage
                                    .from('missao-audios')
                                    .getPublicUrl(fileName);

                                const generatedAudioUrl = publicUrlData?.publicUrl || null;

                                // Atualizar registro com URL do áudio
                                await supabase
                                    .from('missao_conteudos')
                                    .update({ audio_url: generatedAudioUrl, modelo_audio: 'google-tts' })
                                    .eq('id', contentId);

                                console.log(`[GerarConteudo] Áudio uploaded: ${generatedAudioUrl}`);
                            }
                        }
                    }
                } catch (ttsError) {
                    console.warn(`[GerarConteudo] TTS falhou para missão ${missaoId}:`, ttsError);
                }
            })();
        }

        // 10. Atualizar registro com conteúdo (status completed, áudio pode vir depois)
        const { error: updateError } = await supabase
            .from('missao_conteudos')
            .update({
                texto_content: textoContent,
                topicos_analisados: topicos,
                questoes_analisadas: questoes.map(q => q.numero),
                imagens_educacionais: imagensGeradas,
                status: 'completed',
            })
            .eq('id', contentId);

        if (updateError) {
            throw updateError;
        }

        console.log(`[GerarConteudo] ✅ Conteúdo gerado com sucesso para missão ${missaoId}`);

        res.json({
            success: true,
            texto: textoContent,
            audioUrl: audioUrl,
            audioProcessing: audioProcessing,
            questoesAnalisadas: questoes.length,
            imagensGeradas: imagensGeradas.length,
        });

    } catch (error: any) {
        console.error('[GerarConteudo] Erro:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao gerar conteúdo'
        });
    }
});

// ============================================================================
// ENDPOINT: Extrair Gabarito com IA
// ============================================================================

app.post('/api/questao/extrair-gabarito', async (req, res) => {
    try {
        const { questaoId } = req.body;

        if (!questaoId) {
            return res.status(400).json({
                success: false,
                error: "questaoId é obrigatório"
            });
        }

        console.log(`[GabaritoExtractor] Processando questão ${questaoId}...`);

        // Buscar dados da questão
        const { data: questao, error: fetchError } = await questionsDb
            .from('questoes_concurso')
            .select('id, enunciado, alternativas, comentario')
            .eq('id', questaoId)
            .single();

        if (fetchError || !questao) {
            console.error('[GabaritoExtractor] Questão não encontrada:', fetchError);
            return res.status(404).json({
                success: false,
                error: "Questão não encontrada"
            });
        }

        if (!questao.comentario) {
            // Sem comentário, não há como extrair
            await questionsDb
                .from('questoes_concurso')
                .update({ ativo: false })
                .eq('id', questaoId);

            // Atualiza fila como falha
            await questionsDb
                .from('questoes_pendentes_ia')
                .update({
                    status: 'falha',
                    erro: 'Questão sem comentário',
                    processed_at: new Date().toISOString()
                })
                .eq('questao_id', questaoId);

            return res.json({
                success: true,
                extracted: false,
                reason: "Questão sem comentário"
            });
        }

        // Chamar agente de IA
        const agent = mastra.getAgent("gabaritoExtractorAgent");
        if (!agent) {
            console.error('[GabaritoExtractor] Agente não encontrado');
            return res.status(500).json({
                success: false,
                error: "Agente não encontrado"
            });
        }

        const prompt = `
## QUESTÃO ID: ${questaoId}

### ENUNCIADO:
${questao.enunciado || 'N/A'}

### ALTERNATIVAS:
${JSON.stringify(questao.alternativas, null, 2) || 'N/A'}

### COMENTÁRIO/EXPLICAÇÃO:
${questao.comentario}

---
Analise o comentário acima e extraia o gabarito correto.`;

        const result = await agent.generate([
            { role: "user", content: prompt }
        ]);

        // Parse da resposta
        const jsonMatch = result.text?.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.log(`[GabaritoExtractor] Não foi possível parsear resposta da IA para questão ${questaoId}`);

            await questionsDb
                .from('questoes_concurso')
                .update({ ativo: false })
                .eq('id', questaoId);

            await questionsDb
                .from('questoes_pendentes_ia')
                .update({
                    status: 'falha',
                    erro: 'IA não retornou JSON válido',
                    processed_at: new Date().toISOString()
                })
                .eq('questao_id', questaoId);

            return res.json({
                success: true,
                extracted: false,
                reason: "IA não conseguiu extrair gabarito"
            });
        }

        let parsed;
        try {
            parsed = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            console.error('[GabaritoExtractor] Erro ao parsear JSON:', parseError);
            return res.json({
                success: true,
                extracted: false,
                reason: "Erro ao parsear resposta da IA"
            });
        }

        // Verifica confiança mínima
        if (!parsed.gabarito || parsed.confianca < 0.7) {
            console.log(`[GabaritoExtractor] Questão ${questaoId}: Confiança baixa (${parsed.confianca})`);

            await questionsDb
                .from('questoes_concurso')
                .update({ ativo: false })
                .eq('id', questaoId);

            await questionsDb
                .from('questoes_pendentes_ia')
                .update({
                    status: 'falha',
                    erro: `Confiança insuficiente: ${parsed.confianca}`,
                    processed_at: new Date().toISOString()
                })
                .eq('questao_id', questaoId);

            return res.json({
                success: true,
                extracted: false,
                reason: `Confiança insuficiente: ${parsed.confianca}`,
                data: parsed
            });
        }

        // Valida formato do gabarito
        const gabaritoNormalizado = parsed.gabarito.toUpperCase().trim();
        if (!/^[A-E]$|^[CE]$/.test(gabaritoNormalizado)) {
            console.log(`[GabaritoExtractor] Questão ${questaoId}: Gabarito inválido "${parsed.gabarito}"`);

            await questionsDb
                .from('questoes_pendentes_ia')
                .update({
                    status: 'falha',
                    erro: `Gabarito inválido: ${parsed.gabarito}`,
                    processed_at: new Date().toISOString()
                })
                .eq('questao_id', questaoId);

            return res.json({
                success: true,
                extracted: false,
                reason: `Gabarito inválido: ${parsed.gabarito}`
            });
        }

        // Atualiza questão com gabarito extraído
        const { error: updateError } = await questionsDb
            .from('questoes_concurso')
            .update({
                gabarito: gabaritoNormalizado,
                ativo: true,
                gabarito_auto_extraido: true,
                gabarito_metodo: 'ia'
            })
            .eq('id', questaoId);

        if (updateError) {
            console.error('[GabaritoExtractor] Erro ao atualizar questão:', updateError);
            return res.status(500).json({
                success: false,
                error: "Erro ao atualizar questão"
            });
        }

        // Atualiza fila como concluído
        await questionsDb
            .from('questoes_pendentes_ia')
            .update({
                status: 'concluido',
                processed_at: new Date().toISOString()
            })
            .eq('questao_id', questaoId);

        console.log(`[GabaritoExtractor] Questão ${questaoId}: Gabarito "${gabaritoNormalizado}" extraído (confiança: ${parsed.confianca})`);

        return res.json({
            success: true,
            extracted: true,
            data: {
                gabarito: gabaritoNormalizado,
                confianca: parsed.confianca,
                motivo: parsed.motivo
            }
        });

    } catch (error: any) {
        console.error("[GabaritoExtractor] Erro:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// ============================================================================
// ENDPOINT: Processar fila de questões pendentes
// ============================================================================

app.post('/api/questoes/processar-fila-gabaritos', async (req, res) => {
    try {
        const { limite = 50 } = req.body;

        console.log(`[GabaritoExtractor] Iniciando processamento da fila (limite: ${limite})...`);

        // Buscar questões pendentes
        const { data: pendentes, error: fetchError } = await questionsDb
            .from('questoes_pendentes_ia')
            .select('questao_id')
            .eq('status', 'pendente')
            .lt('tentativas', 3)
            .order('created_at', { ascending: true })
            .limit(limite);

        if (fetchError) {
            console.error('[GabaritoExtractor] Erro ao buscar fila:', fetchError);
            return res.status(500).json({
                success: false,
                error: "Erro ao buscar fila de pendentes"
            });
        }

        if (!pendentes || pendentes.length === 0) {
            console.log('[GabaritoExtractor] Nenhuma questão pendente na fila');
            return res.json({
                success: true,
                processadas: 0,
                sucesso: 0,
                falha: 0,
                message: "Nenhuma questão pendente"
            });
        }

        console.log(`[GabaritoExtractor] ${pendentes.length} questões para processar`);

        let sucesso = 0;
        let falha = 0;

        for (const item of pendentes) {
            try {
                // Marcar como processando e incrementar tentativas
                await questionsDb
                    .from('questoes_pendentes_ia')
                    .update({
                        status: 'processando',
                        tentativas: (await questionsDb
                            .from('questoes_pendentes_ia')
                            .select('tentativas')
                            .eq('questao_id', item.questao_id)
                            .single()
                        ).data?.tentativas + 1 || 1
                    })
                    .eq('questao_id', item.questao_id);

                // Buscar dados da questão
                const { data: questao, error: questaoError } = await questionsDb
                    .from('questoes_concurso')
                    .select('id, enunciado, alternativas, comentario')
                    .eq('id', item.questao_id)
                    .single();

                if (questaoError || !questao || !questao.comentario) {
                    await questionsDb
                        .from('questoes_pendentes_ia')
                        .update({
                            status: 'falha',
                            erro: 'Questão não encontrada ou sem comentário',
                            processed_at: new Date().toISOString()
                        })
                        .eq('questao_id', item.questao_id);
                    falha++;
                    continue;
                }

                // Chamar agente de IA
                const agent = mastra.getAgent("gabaritoExtractorAgent");
                if (!agent) {
                    falha++;
                    continue;
                }

                const prompt = `
## QUESTÃO ID: ${questao.id}

### ENUNCIADO:
${questao.enunciado || 'N/A'}

### ALTERNATIVAS:
${JSON.stringify(questao.alternativas, null, 2) || 'N/A'}

### COMENTÁRIO/EXPLICAÇÃO:
${questao.comentario}

---
Analise o comentário acima e extraia o gabarito correto.`;

                const result = await agent.generate([
                    { role: "user", content: prompt }
                ]);

                const jsonMatch = result.text?.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    await questionsDb
                        .from('questoes_pendentes_ia')
                        .update({
                            status: 'falha',
                            erro: 'IA não retornou JSON',
                            processed_at: new Date().toISOString()
                        })
                        .eq('questao_id', item.questao_id);
                    falha++;
                    continue;
                }

                const parsed = JSON.parse(jsonMatch[0]);

                if (!parsed.gabarito || parsed.confianca < 0.7) {
                    await questionsDb
                        .from('questoes_concurso')
                        .update({ ativo: false })
                        .eq('id', item.questao_id);

                    await questionsDb
                        .from('questoes_pendentes_ia')
                        .update({
                            status: 'falha',
                            erro: `Confiança baixa: ${parsed.confianca}`,
                            processed_at: new Date().toISOString()
                        })
                        .eq('questao_id', item.questao_id);
                    falha++;
                    continue;
                }

                // Valida e salva gabarito
                const gabaritoNormalizado = parsed.gabarito.toUpperCase().trim();
                if (!/^[A-E]$|^[CE]$/.test(gabaritoNormalizado)) {
                    await questionsDb
                        .from('questoes_pendentes_ia')
                        .update({
                            status: 'falha',
                            erro: `Gabarito inválido: ${parsed.gabarito}`,
                            processed_at: new Date().toISOString()
                        })
                        .eq('questao_id', item.questao_id);
                    falha++;
                    continue;
                }

                await questionsDb
                    .from('questoes_concurso')
                    .update({
                        gabarito: gabaritoNormalizado,
                        ativo: true,
                        gabarito_auto_extraido: true,
                        gabarito_metodo: 'ia'
                    })
                    .eq('id', item.questao_id);

                await questionsDb
                    .from('questoes_pendentes_ia')
                    .update({
                        status: 'concluido',
                        processed_at: new Date().toISOString()
                    })
                    .eq('questao_id', item.questao_id);

                console.log(`[GabaritoExtractor] Questão ${item.questao_id}: OK (${gabaritoNormalizado})`);
                sucesso++;

            } catch (err: any) {
                console.error(`[GabaritoExtractor] Erro na questão ${item.questao_id}:`, err.message);
                falha++;

                await questionsDb
                    .from('questoes_pendentes_ia')
                    .update({
                        status: 'pendente', // Volta para pendente para retry
                        erro: err.message
                    })
                    .eq('questao_id', item.questao_id);
            }

            // Delay entre processamentos para não sobrecarregar API
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`[GabaritoExtractor] Processamento concluído: ${sucesso} sucesso, ${falha} falhas`);

        return res.json({
            success: true,
            processadas: pendentes.length,
            sucesso,
            falha
        });

    } catch (error: any) {
        console.error("[GabaritoExtractor] Erro no processamento da fila:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// ============================================================================
// ENDPOINT: Status da fila de gabaritos
// ============================================================================

app.get('/api/questoes/fila-gabaritos/status', async (req, res) => {
    try {
        // Contar por status
        const { data: counts, error } = await questionsDb
            .from('questoes_pendentes_ia')
            .select('status');

        if (error) {
            return res.status(500).json({
                success: false,
                error: "Erro ao buscar status da fila"
            });
        }

        const statusCounts = {
            pendente: 0,
            processando: 0,
            concluido: 0,
            falha: 0
        };

        for (const item of counts || []) {
            if (item.status in statusCounts) {
                statusCounts[item.status as keyof typeof statusCounts]++;
            }
        }

        return res.json({
            success: true,
            total: counts?.length || 0,
            ...statusCounts
        });

    } catch (error: any) {
        console.error("[GabaritoExtractor] Erro ao buscar status:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// ============================================================================
// FORMATAÇÃO DE COMENTÁRIOS - Endpoints para melhorar formatação de comentários
// ============================================================================

app.post('/api/comentario/formatar', async (req, res) => {
    try {
        const { questaoId } = req.body;

        if (!questaoId) {
            return res.status(400).json({
                success: false,
                error: "questaoId é obrigatório"
            });
        }

        console.log(`[ComentarioFormatter] Processando questão ${questaoId}...`);

        // Buscar dados da questão (incluindo enunciado para contexto)
        const { data: questao, error: fetchError } = await questionsDb
            .from('questoes_concurso')
            .select('id, enunciado, comentario, comentario_formatado, materia, gabarito')
            .eq('id', questaoId)
            .single();

        if (fetchError || !questao) {
            console.error('[ComentarioFormatter] Questão não encontrada:', fetchError);
            return res.status(404).json({
                success: false,
                error: "Questão não encontrada"
            });
        }

        if (!questao.comentario || questao.comentario.trim() === '') {
            // Sem comentário para formatar
            await questionsDb
                .from('comentarios_pendentes_formatacao')
                .update({
                    status: 'ignorado',
                    erro: 'Questão sem comentário',
                    processed_at: new Date().toISOString()
                })
                .eq('questao_id', questaoId);

            return res.json({
                success: true,
                formatted: false,
                reason: "Questão sem comentário"
            });
        }

        if (questao.comentario_formatado) {
            // Já foi formatado
            await questionsDb
                .from('comentarios_pendentes_formatacao')
                .update({
                    status: 'ignorado',
                    erro: 'Já formatado anteriormente',
                    processed_at: new Date().toISOString()
                })
                .eq('questao_id', questaoId);

            return res.json({
                success: true,
                formatted: false,
                reason: "Comentário já foi formatado"
            });
        }

        // Chamar agente de IA
        const agent = mastra.getAgent("comentarioFormatterAgent");
        if (!agent) {
            console.error('[ComentarioFormatter] Agente não encontrado');
            return res.status(500).json({
                success: false,
                error: "Agente não encontrado"
            });
        }

        const prompt = `Formate o seguinte comentário de questão de concurso.

## CONTEXTO DA QUESTÃO
**Matéria:** ${questao.materia || 'Não informada'}
**Gabarito:** ${questao.gabarito || 'Não informado'}

**Enunciado:**
${questao.enunciado || 'Não disponível'}

## COMENTÁRIO PARA FORMATAR
${questao.comentario}`;

        const response = await agent.generate(prompt);
        const responseText = typeof response.text === 'string' ? response.text : String(response.text);

        // Limpar resposta e fazer parse do JSON
        let cleanedResponse = responseText
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();

        let result;
        try {
            result = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error('[ComentarioFormatter] Erro ao parsear resposta:', parseError);
            console.error('[ComentarioFormatter] Resposta raw:', responseText);

            await questionsDb
                .from('comentarios_pendentes_formatacao')
                .update({
                    status: 'falha',
                    erro: 'Erro ao parsear resposta da IA',
                    processed_at: new Date().toISOString()
                })
                .eq('questao_id', questaoId);

            return res.json({
                success: true,
                formatted: false,
                reason: "Erro ao parsear resposta da IA"
            });
        }

        // Verificar se temos um comentário formatado válido
        if (!result.comentarioFormatado || result.confianca < 0.5) {
            await questionsDb
                .from('comentarios_pendentes_formatacao')
                .update({
                    status: 'falha',
                    erro: `Confiança baixa: ${result.confianca}`,
                    processed_at: new Date().toISOString()
                })
                .eq('questao_id', questaoId);

            return res.json({
                success: true,
                formatted: false,
                reason: result.motivo || "Formatação com baixa confiança"
            });
        }

        // Atualizar questão com comentário formatado
        const { error: updateError } = await questionsDb
            .from('questoes_concurso')
            .update({
                comentario: result.comentarioFormatado,
                comentario_formatado: true,
                comentario_formatado_at: new Date().toISOString()
            })
            .eq('id', questaoId);

        if (updateError) {
            console.error('[ComentarioFormatter] Erro ao atualizar questão:', updateError);

            await questionsDb
                .from('comentarios_pendentes_formatacao')
                .update({
                    status: 'falha',
                    erro: 'Erro ao salvar no banco',
                    processed_at: new Date().toISOString()
                })
                .eq('questao_id', questaoId);

            return res.status(500).json({
                success: false,
                error: "Erro ao atualizar questão"
            });
        }

        // Marcar como concluído na fila
        await questionsDb
            .from('comentarios_pendentes_formatacao')
            .update({
                status: 'concluido',
                processed_at: new Date().toISOString()
            })
            .eq('questao_id', questaoId);

        console.log(`[ComentarioFormatter] Questão ${questaoId} formatada com sucesso!`);

        return res.json({
            success: true,
            formatted: true,
            alteracoes: result.alteracoes,
            confianca: result.confianca
        });

    } catch (error: any) {
        console.error("[ComentarioFormatter] Erro:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

app.post('/api/comentarios/processar-fila-formatacao', async (req, res) => {
    try {
        const { limite = 50 } = req.body;

        console.log(`[ComentarioFormatter] Iniciando processamento da fila (limite: ${limite})...`);

        // Buscar questões pendentes
        const { data: pendentes, error: fetchError } = await questionsDb
            .from('comentarios_pendentes_formatacao')
            .select('questao_id')
            .eq('status', 'pendente')
            .lt('tentativas', 3)
            .order('created_at', { ascending: true })
            .limit(limite);

        if (fetchError) {
            console.error('[ComentarioFormatter] Erro ao buscar fila:', fetchError);
            return res.status(500).json({
                success: false,
                error: "Erro ao buscar fila de pendentes"
            });
        }

        if (!pendentes || pendentes.length === 0) {
            console.log('[ComentarioFormatter] Nenhuma questão pendente na fila');
            return res.json({
                success: true,
                processadas: 0,
                sucesso: 0,
                falha: 0,
                message: "Nenhuma questão pendente"
            });
        }

        console.log(`[ComentarioFormatter] ${pendentes.length} questões para processar`);

        let sucesso = 0;
        let falha = 0;

        for (const item of pendentes) {
            try {
                // Marcar como processando e incrementar tentativas
                await questionsDb
                    .from('comentarios_pendentes_formatacao')
                    .update({
                        status: 'processando',
                        tentativas: (await questionsDb
                            .from('comentarios_pendentes_formatacao')
                            .select('tentativas')
                            .eq('questao_id', item.questao_id)
                            .single()).data?.tentativas + 1 || 1
                    })
                    .eq('questao_id', item.questao_id);

                // Buscar questão (incluindo enunciado para contexto)
                const { data: questao } = await questionsDb
                    .from('questoes_concurso')
                    .select('id, enunciado, comentario, comentario_formatado, materia, gabarito')
                    .eq('id', item.questao_id)
                    .single();

                if (!questao || !questao.comentario || questao.comentario.trim() === '') {
                    await questionsDb
                        .from('comentarios_pendentes_formatacao')
                        .update({
                            status: 'ignorado',
                            erro: 'Sem comentário',
                            processed_at: new Date().toISOString()
                        })
                        .eq('questao_id', item.questao_id);
                    falha++;
                    continue;
                }

                if (questao.comentario_formatado) {
                    await questionsDb
                        .from('comentarios_pendentes_formatacao')
                        .update({
                            status: 'ignorado',
                            erro: 'Já formatado',
                            processed_at: new Date().toISOString()
                        })
                        .eq('questao_id', item.questao_id);
                    continue;
                }

                // Chamar agente de IA
                const agent = mastra.getAgent("comentarioFormatterAgent");
                if (!agent) {
                    falha++;
                    continue;
                }

                const prompt = `Formate o seguinte comentário de questão de concurso.

## CONTEXTO DA QUESTÃO
**Matéria:** ${questao.materia || 'Não informada'}
**Gabarito:** ${questao.gabarito || 'Não informado'}

**Enunciado:**
${questao.enunciado || 'Não disponível'}

## COMENTÁRIO PARA FORMATAR
${questao.comentario}`;
                const response = await agent.generate(prompt);
                const responseText = typeof response.text === 'string' ? response.text : String(response.text);

                let cleanedResponse = responseText
                    .replace(/```json\s*/g, '')
                    .replace(/```\s*/g, '')
                    .trim();

                let result;
                try {
                    result = JSON.parse(cleanedResponse);
                } catch {
                    await questionsDb
                        .from('comentarios_pendentes_formatacao')
                        .update({
                            status: 'falha',
                            erro: 'Erro ao parsear resposta',
                            processed_at: new Date().toISOString()
                        })
                        .eq('questao_id', item.questao_id);
                    falha++;
                    continue;
                }

                if (!result.comentarioFormatado || result.confianca < 0.5) {
                    await questionsDb
                        .from('comentarios_pendentes_formatacao')
                        .update({
                            status: 'falha',
                            erro: `Confiança baixa: ${result.confianca}`,
                            processed_at: new Date().toISOString()
                        })
                        .eq('questao_id', item.questao_id);
                    falha++;
                    continue;
                }

                // Atualizar questão
                const { error: updateError } = await questionsDb
                    .from('questoes_concurso')
                    .update({
                        comentario: result.comentarioFormatado,
                        comentario_formatado: true,
                        comentario_formatado_at: new Date().toISOString()
                    })
                    .eq('id', item.questao_id);

                if (updateError) {
                    await questionsDb
                        .from('comentarios_pendentes_formatacao')
                        .update({
                            status: 'falha',
                            erro: 'Erro ao salvar',
                            processed_at: new Date().toISOString()
                        })
                        .eq('questao_id', item.questao_id);
                    falha++;
                    continue;
                }

                // Marcar como concluído
                await questionsDb
                    .from('comentarios_pendentes_formatacao')
                    .update({
                        status: 'concluido',
                        processed_at: new Date().toISOString()
                    })
                    .eq('questao_id', item.questao_id);

                sucesso++;

            } catch (itemError: any) {
                console.error(`[ComentarioFormatter] Erro na questão ${item.questao_id}:`, itemError);
                await questionsDb
                    .from('comentarios_pendentes_formatacao')
                    .update({
                        status: 'falha',
                        erro: itemError.message || 'Erro desconhecido',
                        processed_at: new Date().toISOString()
                    })
                    .eq('questao_id', item.questao_id);
                falha++;
            }
        }

        console.log(`[ComentarioFormatter] Processamento concluído: ${sucesso} sucesso, ${falha} falha`);

        return res.json({
            success: true,
            processadas: pendentes.length,
            sucesso,
            falha
        });

    } catch (error: any) {
        console.error("[ComentarioFormatter] Erro geral:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

app.get('/api/comentarios/fila-formatacao/status', async (req, res) => {
    try {
        // Buscar estatísticas REAIS do banco de questões (não da fila)
        const { data: stats, error } = await questionsDb.rpc('get_comentarios_stats');

        if (error) {
            // Fallback: calcular manualmente se a função não existir
            console.log('[ComentarioFormatter] Função RPC não existe, calculando manualmente...');

            // Contar total de questões com comentário (usar 'estimated' pois 'exact' faz timeout)
            const { count: totalComComentario } = await questionsDb
                .from('questoes_concurso')
                .select('*', { count: 'estimated', head: true })
                .not('comentario', 'is', null);

            // Contar formatadas
            const { count: formatadas } = await questionsDb
                .from('questoes_concurso')
                .select('*', { count: 'estimated', head: true })
                .eq('comentario_formatado', true);

            // Contar da fila (para processando)
            const { data: filaStatus } = await questionsDb
                .from('comentarios_pendentes_formatacao')
                .select('status');

            let processando = 0;
            let falha = 0;
            for (const item of filaStatus || []) {
                if (item.status === 'processando') processando++;
                if (item.status === 'falha') falha++;
            }

            const pendentes = (totalComComentario || 0) - (formatadas || 0) - processando;

            return res.json({
                success: true,
                total: totalComComentario || 0,
                pendente: Math.max(0, pendentes),
                processando,
                concluido: formatadas || 0,
                falha,
                ignorado: 0
            });
        }

        return res.json({
            success: true,
            ...stats
        });

    } catch (error: any) {
        console.error("[ComentarioFormatter] Erro ao buscar status:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// ============================================================================
// Endpoint SIMPLIFICADO: Processar pendentes diretamente do banco
// ============================================================================
app.post('/api/comentarios/processar-pendentes', async (req, res) => {
    try {
        const { limite = 50 } = req.body;

        console.log(`[ComentarioFormatter] Processando ${limite} questões pendentes diretamente do banco...`);

        // Buscar questões diretamente do banco que precisam ser formatadas
        const { data: questoes, error: fetchError } = await questionsDb
            .from('questoes_concurso')
            .select('id, comentario')
            .not('comentario', 'is', null)
            .or('comentario_formatado.is.null,comentario_formatado.eq.false')
            .limit(limite);

        if (fetchError) {
            console.error('[ComentarioFormatter] Erro ao buscar questões:', fetchError);
            return res.status(500).json({
                success: false,
                error: 'Erro ao buscar questões pendentes'
            });
        }

        if (!questoes || questoes.length === 0) {
            return res.json({
                success: true,
                message: 'Nenhuma questão pendente para processar',
                sucesso: 0,
                falha: 0,
                total: 0
            });
        }

        console.log(`[ComentarioFormatter] Encontradas ${questoes.length} questões para processar`);

        let sucesso = 0;
        let falha = 0;

        for (const questao of questoes) {
            try {
                if (!questao.comentario || questao.comentario.trim() === '') {
                    continue;
                }

                // Chamar a API do Anthropic para formatar
                const systemPrompt = `Você é um especialista em formatação de comentários de questões de concurso.
Sua tarefa é reformatar comentários de questões para ficarem mais claros e organizados em Markdown.

REGRAS:
1. Use títulos (##) para separar seções quando apropriado
2. Use **negrito** para termos importantes
3. Use listas (-) quando houver enumerações
4. Mantenha o conteúdo técnico intacto
5. NÃO adicione informações novas
6. NÃO remova informações existentes
7. Corrija erros de português quando encontrar
8. Use > para citações de leis ou doutrinas`;

                const userPrompt = `Formate o seguinte comentário de questão de concurso em Markdown limpo e organizado:

${questao.comentario}

Responda APENAS com um JSON no formato:
{
  "comentarioFormatado": "texto formatado em markdown",
  "confianca": 0.95
}`;

                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: 'claude-3-5-haiku-20241022',
                        max_tokens: 4096,
                        messages: [
                            { role: 'user', content: userPrompt }
                        ],
                        system: systemPrompt
                    })
                });

                if (!response.ok) {
                    console.error(`[ComentarioFormatter] Erro API Anthropic para questão ${questao.id}:`, response.status);
                    falha++;
                    continue;
                }

                const apiResponse = await response.json();
                const responseText = apiResponse.content?.[0]?.text || '';

                let result;
                try {
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    const cleanedResponse = jsonMatch ? jsonMatch[0] : responseText;
                    result = JSON.parse(cleanedResponse);
                } catch {
                    console.error(`[ComentarioFormatter] Erro ao parsear resposta para questão ${questao.id}`);
                    falha++;
                    continue;
                }

                if (!result.comentarioFormatado || result.confianca < 0.5) {
                    falha++;
                    continue;
                }

                // Atualizar no banco
                const { error: updateError } = await questionsDb
                    .from('questoes_concurso')
                    .update({
                        comentario: result.comentarioFormatado,
                        comentario_formatado: true
                    })
                    .eq('id', questao.id);

                if (updateError) {
                    console.error(`[ComentarioFormatter] Erro ao atualizar questão ${questao.id}:`, updateError);
                    falha++;
                } else {
                    sucesso++;
                }

            } catch (itemError: any) {
                console.error(`[ComentarioFormatter] Erro na questão ${questao.id}:`, itemError);
                falha++;
            }
        }

        console.log(`[ComentarioFormatter] Processamento concluído: ${sucesso} sucesso, ${falha} falhas`);

        return res.json({
            success: true,
            sucesso,
            falha,
            total: questoes.length,
            message: `Processadas ${sucesso} questões com sucesso`
        });

    } catch (error: any) {
        console.error("[ComentarioFormatter] Erro geral:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// Endpoint para popular fila de formatação
app.post('/api/comentarios/fila-formatacao/popular', async (req, res) => {
    try {
        const { limite = 1000, materiaFilter, reprocessarFalhas = false } = req.body;

        console.log(`[ComentarioFormatter] Populando fila (limite: ${limite}, materia: ${materiaFilter || 'todas'}, reprocessar falhas: ${reprocessarFalhas})...`);

        // Buscar questões que precisam ser formatadas
        let query = questionsDb
            .from('questoes_concurso')
            .select('id')
            .eq('comentario_formatado', false)
            .not('comentario', 'is', null)
            .neq('comentario', '')
            .eq('ativo', true)
            .limit(limite);

        if (materiaFilter) {
            query = query.eq('materia', materiaFilter);
        }

        const { data: questoes, error: fetchError } = await query;

        if (fetchError) {
            console.error('[ComentarioFormatter] Erro ao buscar questões:', fetchError);
            return res.status(500).json({
                success: false,
                error: "Erro ao buscar questões"
            });
        }

        if (!questoes || questoes.length === 0) {
            return res.json({
                success: true,
                message: "Nenhuma questão pendente encontrada",
                adicionadas: 0
            });
        }

        // Se reprocessarFalhas, primeiro remove as falhas existentes para essas questões
        if (reprocessarFalhas) {
            await questionsDb
                .from('comentarios_pendentes_formatacao')
                .delete()
                .in('questao_id', questoes.map(q => q.id))
                .eq('status', 'falha');
        }

        // Verificar quais já estão na fila
        const { data: jaEnfileiradas } = await questionsDb
            .from('comentarios_pendentes_formatacao')
            .select('questao_id')
            .in('questao_id', questoes.map(q => q.id));

        const idsJaEnfileirados = new Set((jaEnfileiradas || []).map(q => q.questao_id));
        const novasQuestoes = questoes.filter(q => !idsJaEnfileirados.has(q.id));

        if (novasQuestoes.length === 0) {
            return res.json({
                success: true,
                message: "Todas as questões já estão na fila",
                adicionadas: 0,
                jaEnfileiradas: questoes.length
            });
        }

        // Inserir na fila
        const registros = novasQuestoes.map(q => ({
            questao_id: q.id,
            status: 'pendente',
            tentativas: 0,
            created_at: new Date().toISOString()
        }));

        const { error: insertError } = await questionsDb
            .from('comentarios_pendentes_formatacao')
            .insert(registros);

        if (insertError) {
            console.error('[ComentarioFormatter] Erro ao inserir na fila:', insertError);
            return res.status(500).json({
                success: false,
                error: "Erro ao inserir na fila"
            });
        }

        console.log(`[ComentarioFormatter] ${novasQuestoes.length} questões adicionadas à fila`);

        return res.json({
            success: true,
            adicionadas: novasQuestoes.length,
            jaEnfileiradas: idsJaEnfileirados.size,
            totalEncontradas: questoes.length
        });

    } catch (error: any) {
        console.error("[ComentarioFormatter] Erro ao popular fila:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// Endpoint para resetar questões com falha para reprocessamento
app.post('/api/comentarios/fila-formatacao/resetar-falhas', async (req, res) => {
    try {
        const { limite = 500 } = req.body;

        // Buscar questões com falha
        const { data: falhas, error: fetchError } = await questionsDb
            .from('comentarios_pendentes_formatacao')
            .select('questao_id')
            .eq('status', 'falha')
            .lt('tentativas', 5)
            .limit(limite);

        if (fetchError) {
            return res.status(500).json({
                success: false,
                error: "Erro ao buscar falhas"
            });
        }

        if (!falhas || falhas.length === 0) {
            return res.json({
                success: true,
                message: "Nenhuma falha para resetar",
                resetadas: 0
            });
        }

        // Resetar para pendente
        const { error: updateError } = await questionsDb
            .from('comentarios_pendentes_formatacao')
            .update({
                status: 'pendente',
                erro: null,
                processed_at: null
            })
            .in('questao_id', falhas.map(f => f.questao_id));

        if (updateError) {
            return res.status(500).json({
                success: false,
                error: "Erro ao resetar falhas"
            });
        }

        console.log(`[ComentarioFormatter] ${falhas.length} falhas resetadas para reprocessamento`);

        return res.json({
            success: true,
            resetadas: falhas.length
        });

    } catch (error: any) {
        console.error("[ComentarioFormatter] Erro ao resetar falhas:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// ============================================================================
// ENUNCIADO FORMATTER - Endpoints para formatação de enunciados
// ============================================================================

// Status da fila de formatação de enunciados
app.get('/api/enunciados/fila-formatacao/status', async (req, res) => {
    try {
        // Contar total de questões (usar 'estimated' pois 'exact' faz timeout em tabelas grandes)
        const { count: total } = await questionsDb
            .from('questoes_concurso')
            .select('*', { count: 'estimated', head: true });

        // Contar formatadas
        const { count: formatadas } = await questionsDb
            .from('questoes_concurso')
            .select('*', { count: 'estimated', head: true })
            .eq('enunciado_formatado', true);

        // Contar da fila (para processando e falhas)
        const { data: filaStatus } = await questionsDb
            .from('enunciados_pendentes_formatacao')
            .select('status');

        let processando = 0;
        let falha = 0;
        let ignorado = 0;
        for (const item of filaStatus || []) {
            if (item.status === 'processando') processando++;
            if (item.status === 'falha') falha++;
            if (item.status === 'ignorado') ignorado++;
        }

        const pendentes = (total || 0) - (formatadas || 0) - ignorado;

        return res.json({
            success: true,
            total: total || 0,
            pendente: Math.max(0, pendentes),
            processando,
            concluido: formatadas || 0,
            falha,
            ignorado
        });

    } catch (error: any) {
        console.error("[EnunciadoFormatter] Erro ao buscar status:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// Processar enunciados pendentes
app.post('/api/enunciados/processar-pendentes', async (req, res) => {
    try {
        const { limite = 50 } = req.body;

        console.log(`[EnunciadoFormatter] Processando ${limite} questões pendentes...`);

        // Buscar questões que precisam ser formatadas (incluindo imagens)
        const { data: questoes, error: fetchError } = await questionsDb
            .from('questoes_concurso')
            .select('id, enunciado, materia, imagens_enunciado')
            .not('enunciado', 'is', null)
            .or('enunciado_formatado.is.null,enunciado_formatado.eq.false')
            .limit(limite);

        if (fetchError) {
            console.error('[EnunciadoFormatter] Erro ao buscar questões:', fetchError);
            return res.status(500).json({
                success: false,
                error: 'Erro ao buscar questões pendentes'
            });
        }

        if (!questoes || questoes.length === 0) {
            return res.json({
                success: true,
                message: 'Nenhuma questão pendente para processar',
                sucesso: 0,
                falha: 0,
                ignorado: 0,
                total: 0
            });
        }

        console.log(`[EnunciadoFormatter] Encontradas ${questoes.length} questões para processar`);

        const agent = mastra.getAgent("enunciadoFormatterAgent");
        if (!agent) {
            console.error('[EnunciadoFormatter] Agente não encontrado');
            return res.status(500).json({
                success: false,
                error: "Agente de formatação de enunciados não encontrado"
            });
        }

        let sucesso = 0;
        let falha = 0;
        let ignorado = 0;

        for (const questao of questoes) {
            try {
                if (!questao.enunciado || questao.enunciado.trim() === '') {
                    ignorado++;
                    continue;
                }

                // Verificar se precisa de formatação:
                // - Tem HTML (tags, comentários Angular)
                // - Tem imagens não embedadas
                // - É texto corrido (poucas quebras de linha)
                const hasHtml = /<[^>]+>|<!--/.test(questao.enunciado);
                const hasImages = questao.imagens_enunciado &&
                    questao.imagens_enunciado !== '[]' &&
                    questao.imagens_enunciado !== '{}' &&
                    !questao.imagens_enunciado.includes('icone-aviso');
                const lineBreaks = (questao.enunciado.match(/\n/g) || []).length;

                // Só pular se já está bem formatado E não tem HTML E não tem imagens pendentes
                if (lineBreaks > 3 && !hasHtml && !hasImages) {
                    await questionsDb
                        .from('questoes_concurso')
                        .update({ enunciado_formatado: true })
                        .eq('id', questao.id);
                    ignorado++;
                    continue;
                }

                // Preparar lista de imagens
                let imagensArray: string[] = [];
                if (questao.imagens_enunciado) {
                    try {
                        // Pode vir como array JSON ou como string com chaves
                        let imgStr = questao.imagens_enunciado;
                        if (imgStr.startsWith('{') && imgStr.endsWith('}')) {
                            // Formato: {url1,url2}
                            imgStr = '[' + imgStr.slice(1, -1).split(',').map((u: string) => `"${u.trim()}"`).join(',') + ']';
                        }
                        imagensArray = JSON.parse(imgStr);
                        // Filtrar ícones de aviso
                        imagensArray = imagensArray.filter((url: string) => !url.includes('icone-aviso'));
                    } catch (e) {
                        // Ignorar erro de parse
                    }
                }

                // Montar prompt com imagens
                let prompt = `Formate o seguinte enunciado de questão de concurso:

ENUNCIADO:
${questao.enunciado}`;

                if (imagensArray.length > 0) {
                    prompt += `

IMAGENS (embede no local apropriado do texto):
${JSON.stringify(imagensArray)}`;
                }

                const response = await agent.generate(prompt);
                const responseText = typeof response.text === 'string' ? response.text : String(response.text);

                // Limpar resposta e fazer parse do JSON
                let cleanedResponse = responseText
                    .replace(/```json\s*/g, '')
                    .replace(/```\s*/g, '')
                    .trim();

                let result;
                try {
                    result = JSON.parse(cleanedResponse);
                } catch (parseError) {
                    console.error(`[EnunciadoFormatter] Erro ao parsear resposta para questão ${questao.id}`);
                    falha++;

                    await questionsDb
                        .from('enunciados_pendentes_formatacao')
                        .update({
                            status: 'falha',
                            erro: 'Erro ao parsear resposta da IA',
                            processed_at: new Date().toISOString()
                        })
                        .eq('questao_id', questao.id);
                    continue;
                }

                // Verificar se temos um enunciado formatado válido
                if (!result.enunciadoFormatado || result.confianca < 0.5) {
                    // Confiança baixa - ignorar
                    await questionsDb
                        .from('enunciados_pendentes_formatacao')
                        .update({
                            status: 'ignorado',
                            erro: `Confiança baixa: ${result.confianca}`,
                            processed_at: new Date().toISOString()
                        })
                        .eq('questao_id', questao.id);

                    // Marcar como formatado para não reprocessar
                    await questionsDb
                        .from('questoes_concurso')
                        .update({ enunciado_formatado: true })
                        .eq('id', questao.id);

                    ignorado++;
                    continue;
                }

                // Atualizar questão com enunciado formatado
                const { error: updateError } = await questionsDb
                    .from('questoes_concurso')
                    .update({
                        enunciado: result.enunciadoFormatado,
                        enunciado_formatado: true
                    })
                    .eq('id', questao.id);

                if (updateError) {
                    console.error(`[EnunciadoFormatter] Erro ao atualizar questão ${questao.id}:`, updateError);

                    await questionsDb
                        .from('enunciados_pendentes_formatacao')
                        .update({
                            status: 'falha',
                            erro: 'Erro ao salvar no banco',
                            processed_at: new Date().toISOString()
                        })
                        .eq('questao_id', questao.id);

                    falha++;
                } else {
                    await questionsDb
                        .from('enunciados_pendentes_formatacao')
                        .update({
                            status: 'concluido',
                            erro: null,
                            processed_at: new Date().toISOString()
                        })
                        .eq('questao_id', questao.id);

                    sucesso++;
                }

            } catch (itemError: any) {
                console.error(`[EnunciadoFormatter] Erro na questão ${questao.id}:`, itemError);
                falha++;
            }
        }

        console.log(`[EnunciadoFormatter] Processamento concluído: ${sucesso} sucesso, ${falha} falhas, ${ignorado} ignorados`);

        return res.json({
            success: true,
            sucesso,
            falha,
            ignorado,
            total: questoes.length,
            message: `Processadas ${sucesso} questões com sucesso`
        });

    } catch (error: any) {
        console.error("[EnunciadoFormatter] Erro geral:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// Formatar um enunciado específico
app.post('/api/enunciado/formatar', async (req, res) => {
    try {
        const { questaoId } = req.body;

        if (!questaoId) {
            return res.status(400).json({
                success: false,
                error: "ID da questão é obrigatório"
            });
        }

        console.log(`[EnunciadoFormatter] Processando questão ${questaoId}...`);

        // Buscar dados da questão (incluindo imagens)
        const { data: questao, error: fetchError } = await questionsDb
            .from('questoes_concurso')
            .select('id, enunciado, enunciado_formatado, materia, imagens_enunciado')
            .eq('id', questaoId)
            .single();

        if (fetchError || !questao) {
            console.error('[EnunciadoFormatter] Questão não encontrada:', fetchError);
            return res.status(404).json({
                success: false,
                error: "Questão não encontrada"
            });
        }

        if (!questao.enunciado || questao.enunciado.trim() === '') {
            return res.json({
                success: true,
                formatted: false,
                reason: "Questão sem enunciado"
            });
        }

        if (questao.enunciado_formatado) {
            return res.json({
                success: true,
                formatted: false,
                reason: "Enunciado já foi formatado"
            });
        }

        // Chamar agente de IA
        const agent = mastra.getAgent("enunciadoFormatterAgent");
        if (!agent) {
            console.error('[EnunciadoFormatter] Agente não encontrado');
            return res.status(500).json({
                success: false,
                error: "Agente não encontrado"
            });
        }

        // Preparar lista de imagens
        let imagensArray: string[] = [];
        if (questao.imagens_enunciado) {
            try {
                let imgStr = questao.imagens_enunciado;
                if (imgStr.startsWith('{') && imgStr.endsWith('}')) {
                    imgStr = '[' + imgStr.slice(1, -1).split(',').map((u: string) => `"${u.trim()}"`).join(',') + ']';
                }
                imagensArray = JSON.parse(imgStr);
                imagensArray = imagensArray.filter((url: string) => !url.includes('icone-aviso'));
            } catch (e) {
                // Ignorar erro de parse
            }
        }

        // Montar prompt com imagens
        let prompt = `Formate o seguinte enunciado de questão de concurso:

ENUNCIADO:
${questao.enunciado}`;

        if (imagensArray.length > 0) {
            prompt += `

IMAGENS (embede no local apropriado do texto):
${JSON.stringify(imagensArray)}`;
        }

        const response = await agent.generate(prompt);
        const responseText = typeof response.text === 'string' ? response.text : String(response.text);

        // Limpar resposta e fazer parse do JSON
        let cleanedResponse = responseText
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();

        let result;
        try {
            result = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error('[EnunciadoFormatter] Erro ao parsear resposta:', parseError);
            return res.json({
                success: true,
                formatted: false,
                reason: "Erro ao parsear resposta da IA"
            });
        }

        // Verificar se temos um enunciado formatado válido
        if (!result.enunciadoFormatado || result.confianca < 0.5) {
            return res.json({
                success: true,
                formatted: false,
                reason: result.motivo || "Formatação com baixa confiança"
            });
        }

        // Atualizar questão com enunciado formatado
        const { error: updateError } = await questionsDb
            .from('questoes_concurso')
            .update({
                enunciado: result.enunciadoFormatado,
                enunciado_formatado: true
            })
            .eq('id', questaoId);

        if (updateError) {
            console.error('[EnunciadoFormatter] Erro ao atualizar questão:', updateError);
            return res.status(500).json({
                success: false,
                error: "Erro ao salvar no banco"
            });
        }

        return res.json({
            success: true,
            formatted: true,
            alteracoes: result.alteracoes,
            confianca: result.confianca
        });

    } catch (error: any) {
        console.error("[EnunciadoFormatter] Erro:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// Resetar falhas para reprocessamento
app.post('/api/enunciados/fila-formatacao/resetar-falhas', async (req, res) => {
    try {
        const { limite = 500 } = req.body;

        // Buscar questões com falha
        const { data: falhas, error: fetchError } = await questionsDb
            .from('enunciados_pendentes_formatacao')
            .select('questao_id')
            .eq('status', 'falha')
            .limit(limite);

        if (fetchError) {
            return res.status(500).json({
                success: false,
                error: "Erro ao buscar falhas"
            });
        }

        if (!falhas || falhas.length === 0) {
            return res.json({
                success: true,
                message: "Nenhuma falha para resetar",
                resetadas: 0
            });
        }

        // Resetar para pendente
        const { error: updateError } = await questionsDb
            .from('enunciados_pendentes_formatacao')
            .update({
                status: 'pendente',
                erro: null,
                processed_at: null
            })
            .in('questao_id', falhas.map(f => f.questao_id));

        if (updateError) {
            return res.status(500).json({
                success: false,
                error: "Erro ao resetar falhas"
            });
        }

        // Também resetar a flag nas questões
        await questionsDb
            .from('questoes_concurso')
            .update({ enunciado_formatado: false })
            .in('id', falhas.map(f => f.questao_id));

        console.log(`[EnunciadoFormatter] ${falhas.length} falhas resetadas para reprocessamento`);

        return res.json({
            success: true,
            resetadas: falhas.length
        });

    } catch (error: any) {
        console.error("[EnunciadoFormatter] Erro ao resetar falhas:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// ============================================================================
// ADMIN PANEL - Endpoints para interface de monitoramento
// ============================================================================

// Lista de itens na fila de formatação (com paginação)
app.get('/api/admin/comentarios/queue', async (req, res) => {
    try {
        const status = req.query.status as string | undefined;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = (page - 1) * limit;

        // Primeiro, contar o total de itens
        let countQuery = questionsDb
            .from('comentarios_pendentes_formatacao')
            .select('*', { count: 'exact', head: true });

        if (status && status !== 'all') {
            countQuery = countQuery.eq('status', status);
        }

        const { count: total, error: countError } = await countQuery;

        if (countError) {
            console.error("[Admin] Erro ao contar fila:", countError);
        }

        // Buscar itens com paginação
        let query = questionsDb
            .from('comentarios_pendentes_formatacao')
            .select('*')
            .order('processed_at', { ascending: false, nullsFirst: false })
            .range(offset, offset + limit - 1);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            return res.status(500).json({
                success: false,
                error: "Erro ao buscar fila"
            });
        }

        const totalItems = total || 0;
        const totalPages = Math.ceil(totalItems / limit);

        return res.json({
            success: true,
            items: data || [],
            total: totalItems,
            page,
            limit,
            totalPages
        });

    } catch (error: any) {
        console.error("[Admin] Erro ao buscar fila:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// Detalhes de uma questão específica
app.get('/api/admin/questao/:id', async (req, res) => {
    try {
        const questaoId = parseInt(req.params.id);

        if (isNaN(questaoId)) {
            return res.status(400).json({
                success: false,
                error: "ID da questão inválido"
            });
        }

        const { data: questao, error } = await questionsDb
            .from('questoes_concurso')
            .select('id, enunciado, alternativas, comentario, comentario_formatado, materia, assunto, banca, ano, gabarito')
            .eq('id', questaoId)
            .single();

        if (error || !questao) {
            return res.status(404).json({
                success: false,
                error: "Questão não encontrada"
            });
        }

        return res.json({
            success: true,
            questao
        });

    } catch (error: any) {
        console.error("[Admin] Erro ao buscar questão:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// Cadernos do scraper
app.get('/api/admin/scraper/cadernos', async (req, res) => {
    try {
        const { data, error } = await questionsDb
            .from('tec_cadernos')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(20);

        if (error) {
            return res.status(500).json({
                success: false,
                error: "Erro ao buscar cadernos"
            });
        }

        return res.json({
            success: true,
            cadernos: data || []
        });

    } catch (error: any) {
        console.error("[Admin] Erro ao buscar cadernos:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// Contas TecConcursos
app.get('/api/admin/scraper/accounts', async (req, res) => {
    try {
        const { data, error } = await questionsDb
            .from('tec_accounts')
            .select('id, email, login_status, last_used_at, is_busy')
            .order('last_used_at', { ascending: false, nullsFirst: true });

        if (error) {
            return res.status(500).json({
                success: false,
                error: "Erro ao buscar contas"
            });
        }

        return res.json({
            success: true,
            accounts: data || []
        });

    } catch (error: any) {
        console.error("[Admin] Erro ao buscar contas:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// ============================================================================
// ASSUNTOS TAXONOMY ENDPOINTS
// ============================================================================

// Listar todas as matérias disponíveis para taxonomia
app.get('/api/taxonomia/materias', async (req, res) => {
    try {
        const { data, error } = await questionsDb
            .from('assuntos_mapeamento')
            .select('materia')
            .order('materia');

        if (error) {
            return res.status(500).json({
                success: false,
                error: "Erro ao buscar matérias"
            });
        }

        // Agrupar e contar assuntos por matéria
        const materiasCounts: Record<string, number> = {};
        for (const item of data || []) {
            if (item.materia) {
                materiasCounts[item.materia] = (materiasCounts[item.materia] || 0) + 1;
            }
        }

        const materias = Object.entries(materiasCounts)
            .map(([materia, count]) => ({ materia, assuntosCount: count }))
            .sort((a, b) => a.materia.localeCompare(b.materia));

        return res.json({
            success: true,
            materias,
            total: materias.length
        });

    } catch (error: any) {
        console.error("[Taxonomia] Erro ao buscar matérias:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// Status geral da taxonomia (MUST come before :materia routes)
app.get('/api/taxonomia/status', async (req, res) => {
    try {
        // Total de assuntos
        const { count: totalAssuntos } = await questionsDb
            .from('assuntos_mapeamento')
            .select('*', { count: 'exact', head: true });

        // Assuntos classificados
        const { count: classificados } = await questionsDb
            .from('assuntos_mapeamento')
            .select('*', { count: 'exact', head: true })
            .not('taxonomia_id', 'is', null);

        // Total de nós de taxonomia
        const { count: totalNos } = await questionsDb
            .from('assuntos_taxonomia')
            .select('*', { count: 'exact', head: true });

        // Matérias únicas
        const { data: materias } = await questionsDb
            .from('assuntos_mapeamento')
            .select('materia');

        const materiasUnicas = new Set(materias?.map(m => m.materia) || []);

        // Matérias com taxonomia
        const { data: materiasComTaxonomia } = await questionsDb
            .from('assuntos_taxonomia')
            .select('materia');

        const materiasProcessadas = new Set(materiasComTaxonomia?.map(m => m.materia) || []);

        return res.json({
            success: true,
            totalAssuntos: totalAssuntos || 0,
            classificados: classificados || 0,
            naoClassificados: (totalAssuntos || 0) - (classificados || 0),
            totalNos: totalNos || 0,
            totalMaterias: materiasUnicas.size,
            materiasProcessadas: materiasProcessadas.size,
            percentualClassificado: totalAssuntos
                ? Math.round(((classificados || 0) / totalAssuntos) * 100)
                : 0
        });

    } catch (error: any) {
        console.error("[Taxonomia] Erro ao buscar status:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// Listar assuntos de uma matéria específica
app.get('/api/taxonomia/:materia/assuntos', async (req, res) => {
    try {
        const { materia } = req.params;

        const { data, error } = await questionsDb
            .from('assuntos_mapeamento')
            .select('assunto_original, taxonomia_id, questoes_count')
            .eq('materia', materia)
            .order('assunto_original');

        if (error) {
            return res.status(500).json({
                success: false,
                error: "Erro ao buscar assuntos"
            });
        }

        const classificados = data?.filter(a => a.taxonomia_id) || [];
        const naoClassificados = data?.filter(a => !a.taxonomia_id) || [];

        return res.json({
            success: true,
            materia,
            assuntos: data,
            total: data?.length || 0,
            classificados: classificados.length,
            naoClassificados: naoClassificados.length
        });

    } catch (error: any) {
        console.error("[Taxonomia] Erro ao buscar assuntos:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// Obter taxonomia de todas as matérias principais (para dropdown de assuntos)
// IMPORTANTE: Este endpoint deve vir ANTES do /api/taxonomia/:materia
app.get('/api/taxonomia/all', async (req, res) => {
    try {
        // Função para buscar todos os dados usando paginação (para bypasser limite de 1000 do Supabase)
        const fetchAllPaginated = async (rpcName: string, pageSize = 1000) => {
            const allData: any[] = [];
            let offset = 0;
            let hasMore = true;

            while (hasMore) {
                const { data, error } = await questionsDb
                    .rpc(rpcName)
                    .range(offset, offset + pageSize - 1);

                if (error) throw error;

                if (data && data.length > 0) {
                    allData.push(...data);
                    offset += pageSize;
                    hasMore = data.length === pageSize;
                } else {
                    hasMore = false;
                }
            }
            return allData;
        };

        // Buscar todos os dados usando paginação
        const [taxonomiaData, mapeamentoData] = await Promise.all([
            fetchAllPaginated('get_all_taxonomia'),
            fetchAllPaginated('get_all_taxonomia_mapeamentos')
        ]);

        // Obter lista única de matérias
        const materiasUnicas = [...new Set(taxonomiaData.map((t: any) => t.materia).filter(Boolean))];

        // Criar mapa de assuntos por taxonomia_id
        const assuntosPorTaxonomia = new Map<number, string[]>();
        for (const map of mapeamentoData) {
            if (!assuntosPorTaxonomia.has(map.taxonomia_id)) {
                assuntosPorTaxonomia.set(map.taxonomia_id, []);
            }
            assuntosPorTaxonomia.get(map.taxonomia_id)!.push(map.assunto_original);
        }

        // Construir árvore hierárquica por matéria
        const buildTree = (items: any[], parentId: number | null = null): any[] => {
            return items
                .filter(item => item.parent_id === parentId)
                .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                .map(item => ({
                    id: item.id,
                    codigo: item.codigo,
                    nome: item.nome,
                    nivel: item.nivel,
                    ordem: item.ordem,
                    materia: item.materia,
                    parent_id: item.parent_id,
                    assuntos_originais: assuntosPorTaxonomia.get(item.id) || [],
                    filhos: buildTree(items.filter(i => i.materia === item.materia), item.id)
                }));
        };

        // Agrupar por matéria
        const taxonomiaByMateria: Record<string, any[]> = {};
        for (const materia of materiasUnicas) {
            const materiaItems = taxonomiaData.filter(t => t.materia === materia);
            taxonomiaByMateria[materia] = buildTree(materiaItems);
        }

        return res.json({
            success: true,
            taxonomiaByMateria,
            totalMaterias: materiasUnicas.length,
            totalNodes: taxonomiaData.length,
            totalAssuntosMapeados: mapeamentoData.length
        });

    } catch (error: any) {
        console.error("[Taxonomia] Erro ao buscar taxonomia geral:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// Obter taxonomia existente de uma matéria
app.get('/api/taxonomia/:materia', async (req, res) => {
    try {
        const { materia } = req.params;

        // Buscar taxonomia e mapeamentos em paralelo
        const [taxonomiaResult, mapeamentoResult] = await Promise.all([
            questionsDb
                .from('assuntos_taxonomia')
                .select('*')
                .eq('materia', materia)
                .order('ordem')
                .limit(5000),
            questionsDb
                .from('assuntos_mapeamento')
                .select('assunto_original, taxonomia_id')
                .eq('materia', materia)
                .not('taxonomia_id', 'is', null)
                .limit(10000)
        ]);

        if (taxonomiaResult.error) {
            return res.status(500).json({
                success: false,
                error: "Erro ao buscar taxonomia"
            });
        }

        const taxonomiaData = taxonomiaResult.data || [];
        const mapeamentoData = mapeamentoResult.data || [];

        // Criar mapa de assuntos por taxonomia_id
        const assuntosPorTaxonomia = new Map<number, string[]>();
        for (const map of mapeamentoData) {
            if (!assuntosPorTaxonomia.has(map.taxonomia_id)) {
                assuntosPorTaxonomia.set(map.taxonomia_id, []);
            }
            assuntosPorTaxonomia.get(map.taxonomia_id)!.push(map.assunto_original);
        }

        // Construir árvore hierárquica com assuntos_originais
        const buildTree = (items: any[], parentId: number | null = null): any[] => {
            return items
                .filter(item => item.parent_id === parentId)
                .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                .map(item => ({
                    id: item.id,
                    codigo: item.codigo,
                    nome: item.nome,
                    nivel: item.nivel,
                    ordem: item.ordem,
                    materia: item.materia,
                    parent_id: item.parent_id,
                    assuntos_originais: assuntosPorTaxonomia.get(item.id) || [],
                    filhos: buildTree(items, item.id)
                }));
        };

        const tree = buildTree(taxonomiaData);

        return res.json({
            success: true,
            materia,
            taxonomia: tree,
            totalNodes: taxonomiaData.length,
            totalAssuntosMapeados: mapeamentoData.length
        });

    } catch (error: any) {
        console.error("[Taxonomia] Erro ao buscar taxonomia:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// Processar taxonomia de uma matéria usando IA
app.post('/api/taxonomia/processar', async (req, res) => {
    try {
        const { materia } = req.body;

        if (!materia) {
            return res.status(400).json({
                success: false,
                error: "materia é obrigatório"
            });
        }

        console.log(`[Taxonomia] Processando matéria: ${materia}`);

        // Buscar assuntos da matéria (ALL assuntos, we'll filter classified ones after)
        const { data: assuntos, error: fetchError } = await questionsDb
            .from('assuntos_mapeamento')
            .select('assunto_original, questoes_count, taxonomia_id')
            .eq('materia', materia)
            .order('questoes_count', { ascending: false });

        console.log(`[Taxonomia] Query result - total: ${assuntos?.length || 0}, error: ${fetchError?.message || 'none'}`);

        if (fetchError) {
            console.error('[Taxonomia] Fetch error:', fetchError);
            return res.status(500).json({
                success: false,
                error: "Erro ao buscar assuntos: " + fetchError.message
            });
        }

        // Filter only unclassified ones
        const assuntosNaoClassificados = assuntos?.filter(a => a.taxonomia_id === null) || [];
        console.log(`[Taxonomia] Assuntos não classificados: ${assuntosNaoClassificados.length}`);

        if (assuntosNaoClassificados.length === 0) {
            return res.json({
                success: true,
                message: "Todos os assuntos já estão classificados",
                processados: 0
            });
        }

        // Use filtered list
        const assuntosParaProcessar = assuntosNaoClassificados;

        console.log(`[Taxonomia] Encontrados ${assuntosParaProcessar.length} assuntos não classificados`);

        // Chamar agente de IA
        const agent = mastra.getAgent("assuntosTaxonomiaAgent");
        if (!agent) {
            console.error('[Taxonomia] Agente não encontrado');
            return res.status(500).json({
                success: false,
                error: "Agente não encontrado"
            });
        }

        const assuntosLista = assuntosParaProcessar.map(a => a.assunto_original);
        const prompt = `Matéria: "${materia}"\nAssuntos: ${JSON.stringify(assuntosLista)}`;

        console.log(`[Taxonomia] Chamando agente com ${assuntosLista.length} assuntos...`);
        const response = await agent.generate(prompt);
        const responseText = typeof response.text === 'string' ? response.text : String(response.text);

        // Limpar e parsear resposta
        let cleanedResponse = responseText
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim();

        let result;
        try {
            result = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error('[Taxonomia] Erro ao parsear resposta:', parseError);
            console.error('[Taxonomia] Resposta raw:', responseText.substring(0, 500));
            return res.status(500).json({
                success: false,
                error: "Erro ao parsear resposta da IA"
            });
        }

        console.log(`[Taxonomia] Taxonomia gerada com ${result.taxonomia?.length || 0} tópicos principais`);

        // Salvar taxonomia no banco
        const savedNodes: any[] = [];

        const saveNode = async (node: any, parentId: string | null = null) => {
            const { data: inserted, error: insertError } = await questionsDb
                .from('assuntos_taxonomia')
                .insert({
                    materia,
                    codigo: node.codigo,
                    nome: node.nome,
                    nivel: node.nivel,
                    parent_id: parentId,
                    ordem: node.ordem
                })
                .select()
                .single();

            if (insertError) {
                console.error('[Taxonomia] Erro ao inserir nó:', insertError);
                return null;
            }

            savedNodes.push(inserted);

            // Mapear assuntos originais para este nó
            if (node.assuntos_originais && node.assuntos_originais.length > 0) {
                for (const assuntoOriginal of node.assuntos_originais) {
                    await questionsDb
                        .from('assuntos_mapeamento')
                        .update({ taxonomia_id: inserted.id })
                        .eq('materia', materia)
                        .eq('assunto_original', assuntoOriginal);
                }
            }

            // Processar filhos recursivamente
            if (node.filhos && node.filhos.length > 0) {
                for (const filho of node.filhos) {
                    await saveNode(filho, inserted.id);
                }
            }

            return inserted;
        };

        // Deletar taxonomia existente da matéria
        await questionsDb
            .from('assuntos_taxonomia')
            .delete()
            .eq('materia', materia);

        // Resetar mapeamentos
        await questionsDb
            .from('assuntos_mapeamento')
            .update({ taxonomia_id: null })
            .eq('materia', materia);

        // Salvar nova taxonomia
        for (const topico of result.taxonomia || []) {
            await saveNode(topico);
        }

        console.log(`[Taxonomia] Salvos ${savedNodes.length} nós de taxonomia`);

        return res.json({
            success: true,
            materia,
            nodosCreados: savedNodes.length,
            estatisticas: result.estatisticas,
            naoClassificados: result.nao_classificados || []
        });

    } catch (error: any) {
        console.error("[Taxonomia] Erro ao processar:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// Processar todas as matérias em batch
app.post('/api/taxonomia/processar-batch', async (req, res) => {
    try {
        const { limite = 5 } = req.body;

        console.log(`[Taxonomia] Iniciando processamento em batch (limite: ${limite})...`);

        // Buscar matérias que ainda não têm taxonomia
        const { data: materiasData } = await questionsDb
            .from('assuntos_mapeamento')
            .select('materia')
            .is('taxonomia_id', null);

        const materiasCounts: Record<string, number> = {};
        for (const item of materiasData || []) {
            if (item.materia) {
                materiasCounts[item.materia] = (materiasCounts[item.materia] || 0) + 1;
            }
        }

        const materiasParaProcessar = Object.entries(materiasCounts)
            .sort((a, b) => b[1] - a[1])  // Ordenar por mais assuntos primeiro
            .slice(0, limite)
            .map(([materia]) => materia);

        console.log(`[Taxonomia] Matérias para processar: ${materiasParaProcessar.join(', ')}`);

        const resultados: any[] = [];

        for (const materia of materiasParaProcessar) {
            try {
                console.log(`[Taxonomia] Processando ${materia}...`);

                // Chamar o endpoint de processamento individual
                const { data: assuntos } = await questionsDb
                    .from('assuntos_mapeamento')
                    .select('assunto_original, questoes_count')
                    .eq('materia', materia)
                    .is('taxonomia_id', null)
                    .order('questoes_count', { ascending: false });

                if (!assuntos || assuntos.length === 0) {
                    resultados.push({ materia, status: 'skip', reason: 'Sem assuntos pendentes' });
                    continue;
                }

                const agent = mastra.getAgent("assuntosTaxonomiaAgent");
                if (!agent) {
                    resultados.push({ materia, status: 'error', reason: 'Agente não encontrado' });
                    continue;
                }

                const assuntosLista = assuntos.map(a => a.assunto_original);
                const prompt = `Matéria: "${materia}"\nAssuntos: ${JSON.stringify(assuntosLista)}`;

                const response = await agent.generate(prompt);
                const responseText = typeof response.text === 'string' ? response.text : String(response.text);

                let cleanedResponse = responseText
                    .replace(/```json\s*/g, '')
                    .replace(/```\s*/g, '')
                    .trim();

                let result;
                try {
                    result = JSON.parse(cleanedResponse);
                } catch {
                    resultados.push({ materia, status: 'error', reason: 'Parse error' });
                    continue;
                }

                // Deletar e recriar taxonomia
                await questionsDb.from('assuntos_taxonomia').delete().eq('materia', materia);
                await questionsDb.from('assuntos_mapeamento').update({ taxonomia_id: null }).eq('materia', materia);

                let nodeCount = 0;
                const saveNode = async (node: any, parentId: string | null = null) => {
                    const { data: inserted } = await questionsDb
                        .from('assuntos_taxonomia')
                        .insert({
                            materia,
                            codigo: node.codigo,
                            nome: node.nome,
                            nivel: node.nivel,
                            parent_id: parentId,
                            ordem: node.ordem
                        })
                        .select()
                        .single();

                    if (inserted) {
                        nodeCount++;
                        if (node.assuntos_originais) {
                            for (const assuntoOriginal of node.assuntos_originais) {
                                await questionsDb
                                    .from('assuntos_mapeamento')
                                    .update({ taxonomia_id: inserted.id })
                                    .eq('materia', materia)
                                    .eq('assunto_original', assuntoOriginal);
                            }
                        }
                        if (node.filhos) {
                            for (const filho of node.filhos) {
                                await saveNode(filho, inserted.id);
                            }
                        }
                    }
                };

                for (const topico of result.taxonomia || []) {
                    await saveNode(topico);
                }

                resultados.push({
                    materia,
                    status: 'success',
                    assuntosProcessados: assuntos.length,
                    nodosCreados: nodeCount
                });

            } catch (itemError: any) {
                console.error(`[Taxonomia] Erro em ${materia}:`, itemError);
                resultados.push({ materia, status: 'error', reason: itemError.message });
            }
        }

        console.log(`[Taxonomia] Batch concluído: ${resultados.filter(r => r.status === 'success').length} sucesso`);

        return res.json({
            success: true,
            processadas: resultados.length,
            resultados
        });

    } catch (error: any) {
        console.error("[Taxonomia] Erro no batch:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// Processar matérias grandes em chunks (para matérias com muitos assuntos)
app.post('/api/taxonomia/processar-grande', async (req, res) => {
    try {
        const { materia, chunkSize = 60 } = req.body;

        if (!materia) {
            return res.status(400).json({
                success: false,
                error: "materia é obrigatório"
            });
        }

        console.log(`[Taxonomia-Grande] Processando matéria grande: ${materia} (chunks de ${chunkSize})`);

        // Buscar TODOS os assuntos da matéria
        const { data: todosAssuntos, error: fetchError } = await questionsDb
            .from('assuntos_mapeamento')
            .select('assunto_original, questoes_count, taxonomia_id')
            .eq('materia', materia)
            .order('questoes_count', { ascending: false });

        if (fetchError) {
            console.error('[Taxonomia-Grande] Fetch error:', fetchError);
            return res.status(500).json({
                success: false,
                error: "Erro ao buscar assuntos: " + fetchError.message
            });
        }

        // Filtrar não classificados
        const assuntosNaoClassificados = todosAssuntos?.filter(a => a.taxonomia_id === null) || [];
        console.log(`[Taxonomia-Grande] Total: ${todosAssuntos?.length}, Não classificados: ${assuntosNaoClassificados.length}`);

        if (assuntosNaoClassificados.length === 0) {
            return res.json({
                success: true,
                message: "Todos os assuntos já estão classificados",
                processados: 0
            });
        }

        const agent = mastra.getAgent("assuntosTaxonomiaAgent");
        if (!agent) {
            return res.status(500).json({
                success: false,
                error: "Agente não encontrado"
            });
        }

        // Dividir em chunks
        const chunks: string[][] = [];
        const assuntosLista = assuntosNaoClassificados.map(a => a.assunto_original);
        for (let i = 0; i < assuntosLista.length; i += chunkSize) {
            chunks.push(assuntosLista.slice(i, i + chunkSize));
        }

        console.log(`[Taxonomia-Grande] Dividido em ${chunks.length} chunks`);

        // Limpar taxonomia existente
        await questionsDb.from('assuntos_taxonomia').delete().eq('materia', materia);
        await questionsDb.from('assuntos_mapeamento').update({ taxonomia_id: null }).eq('materia', materia);

        let totalNodos = 0;
        let totalClassificados = 0;
        const erros: string[] = [];

        // Processar cada chunk
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            console.log(`[Taxonomia-Grande] Processando chunk ${i + 1}/${chunks.length} (${chunk.length} assuntos)`);

            try {
                const prompt = `Matéria: "${materia}"\nAssuntos: ${JSON.stringify(chunk)}\n\nNOTA: Este é o lote ${i + 1} de ${chunks.length}. Organize estes assuntos em uma taxonomia hierárquica.`;

                const response = await agent.generate(prompt);
                const responseText = typeof response.text === 'string' ? response.text : String(response.text);

                let cleanedResponse = responseText
                    .replace(/```json\s*/g, '')
                    .replace(/```\s*/g, '')
                    .trim();

                let result;
                try {
                    result = JSON.parse(cleanedResponse);
                } catch (parseErr) {
                    console.error(`[Taxonomia-Grande] Parse error no chunk ${i + 1}:`, parseErr);
                    erros.push(`Chunk ${i + 1}: Parse error`);
                    continue;
                }

                // Salvar taxonomia do chunk
                // Usamos códigos prefixados com o número do chunk para evitar conflitos
                const saveNode = async (node: any, parentId: string | null = null) => {
                    // Prefixar código com número do chunk
                    const codigoPrefixado = `${i + 1}.${node.codigo}`;

                    const { data: inserted } = await questionsDb
                        .from('assuntos_taxonomia')
                        .insert({
                            materia,
                            codigo: codigoPrefixado,
                            nome: node.nome,
                            nivel: node.nivel,
                            parent_id: parentId,
                            ordem: node.ordem + (i * 100) // Offset de ordem por chunk
                        })
                        .select()
                        .single();

                    if (inserted) {
                        totalNodos++;
                        if (node.assuntos_originais && node.assuntos_originais.length > 0) {
                            for (const assuntoOriginal of node.assuntos_originais) {
                                const { error: updateErr } = await questionsDb
                                    .from('assuntos_mapeamento')
                                    .update({ taxonomia_id: inserted.id })
                                    .eq('materia', materia)
                                    .eq('assunto_original', assuntoOriginal);

                                if (!updateErr) totalClassificados++;
                            }
                        }
                        if (node.filhos && node.filhos.length > 0) {
                            for (const filho of node.filhos) {
                                await saveNode(filho, inserted.id);
                            }
                        }
                    }
                };

                for (const topico of result.taxonomia || []) {
                    await saveNode(topico);
                }

                console.log(`[Taxonomia-Grande] Chunk ${i + 1} concluído: ${result.taxonomia?.length || 0} tópicos`);

            } catch (chunkError: any) {
                console.error(`[Taxonomia-Grande] Erro no chunk ${i + 1}:`, chunkError);
                erros.push(`Chunk ${i + 1}: ${chunkError.message}`);
            }

            // Pequena pausa entre chunks para não sobrecarregar a API
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`[Taxonomia-Grande] Concluído: ${totalNodos} nodos, ${totalClassificados} classificados`);

        return res.json({
            success: true,
            materia,
            chunks: chunks.length,
            nodosCreados: totalNodos,
            assuntosClassificados: totalClassificados,
            erros: erros.length > 0 ? erros : undefined
        });

    } catch (error: any) {
        console.error("[Taxonomia-Grande] Erro geral:", error);
        return res.status(500).json({
            success: false,
            error: error.message || "Erro interno"
        });
    }
});

// ============================================
// Scraper Routes - Sistema de Scraping de Questões
// ============================================

// Registrar rotas do scraper
const scraperRoutes = createScraperRoutes(questionsDbUrl, questionsDbKey);
app.use('/api/scraper', scraperRoutes);

// Registrar rotas do TecConcursos Scraper (autônomo)
const tecScraperRoutes = createTecConcursosScraperRoutes();
app.use('/api/tec-scraper', tecScraperRoutes);

// Endpoint para status dos cron jobs
app.get('/api/scraper/cron-status', (req, res) => {
    const imageStatus = getImageProcessorStatus();
    const reviewerStatus = getQuestionReviewerStatus();
    const gabaritoStatus = getGabaritoExtractorStatus();
    const formatterStatus = getFormatterProcessorStatus();
    const materiaStatus = getMateriaClassifierStatus();

    res.json({
        success: true,
        imageProcessor: {
            isProcessing: imageStatus.isProcessing,
            lastRun: imageStatus.lastRun,
            totalProcessed: imageStatus.totalProcessed,
        },
        questionReviewer: {
            isProcessing: reviewerStatus.isProcessing,
            lastRun: reviewerStatus.lastRun,
            totalReviewed: reviewerStatus.totalReviewed,
        },
        gabaritoExtractor: {
            isProcessing: gabaritoStatus.isProcessing,
            lastRun: gabaritoStatus.lastRun,
            stats: gabaritoStatus.stats,
        },
        comentarioFormatter: {
            isProcessing: formatterStatus.comentarios.isProcessing,
            lastRun: formatterStatus.comentarios.lastRun,
            totalProcessed: formatterStatus.comentarios.totalProcessed,
            totalFailed: formatterStatus.comentarios.totalFailed,
        },
        enunciadoFormatter: {
            isProcessing: formatterStatus.enunciados.isProcessing,
            lastRun: formatterStatus.enunciados.lastRun,
            totalProcessed: formatterStatus.enunciados.totalProcessed,
            totalFailed: formatterStatus.enunciados.totalFailed,
        },
        materiaClassifier: {
            isProcessing: materiaStatus.isProcessing,
            lastRun: materiaStatus.lastRun,
            stats: materiaStatus.stats,
        },
    });
});

// Endpoint para executar classificação de matérias manualmente
app.post('/api/scraper/classify-materias', async (req, res) => {
    const { limit = 10 } = req.body;

    try {
        const result = await runMateriaClassification(
            questionsDbUrl,
            questionsDbKey,
            { limit }
        );

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
    }
});

// ============================================
// Question Generator API
// ============================================

// In-memory tracking para jobs de geração de questões
const questionGenerationJobs = new Map<string, {
    status: 'running' | 'completed' | 'error';
    totalRequested: number;
    totalGenerated: number;
    totalSaved: number;
    error?: string;
    startedAt: Date;
    completedAt?: Date;
}>();

// Função auxiliar para formatar comentários das questões geradas
async function formatQuestionsComments(
    questions: Array<{
        enunciado: string;
        alternativas: Array<{ letter: string; text: string }>;
        gabarito: string;
        justificativa_gabarito: string;
    }>,
    materia: string
): Promise<typeof questions> {
    const agent = mastra.getAgent("comentarioFormatterAgent");
    if (!agent) {
        console.warn('[QuestionGenerator] Agente de formatação não encontrado, usando comentários sem formatação');
        return questions;
    }

    const formattedQuestions = [];

    for (const question of questions) {
        try {
            const prompt = `Formate o seguinte comentário de questão de concurso.

## CONTEXTO DA QUESTÃO
**Matéria:** ${materia || 'Não informada'}
**Gabarito:** ${question.gabarito || 'Não informado'}

**Enunciado:**
${question.enunciado || 'Não disponível'}

## COMENTÁRIO PARA FORMATAR
${question.justificativa_gabarito}`;

            const response = await agent.generate(prompt);
            const responseText = typeof response.text === 'string' ? response.text : String(response.text);

            // Limpar resposta e fazer parse do JSON
            let cleanedResponse = responseText
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();

            try {
                const result = JSON.parse(cleanedResponse);

                if (result.comentarioFormatado && result.confianca >= 0.5) {
                    formattedQuestions.push({
                        ...question,
                        justificativa_gabarito: result.comentarioFormatado
                    });
                    console.log(`[QuestionGenerator] Comentário formatado com confiança ${result.confianca}`);
                } else {
                    // Usar comentário original se a formatação tiver baixa confiança
                    formattedQuestions.push(question);
                    console.log(`[QuestionGenerator] Mantendo comentário original (confiança: ${result.confianca || 'N/A'})`);
                }
            } catch (parseError) {
                console.warn('[QuestionGenerator] Erro ao parsear resposta do formatador, usando comentário original');
                formattedQuestions.push(question);
            }
        } catch (formatError) {
            console.warn('[QuestionGenerator] Erro ao formatar comentário, usando original:', formatError);
            formattedQuestions.push(question);
        }
    }

    return formattedQuestions;
}

// Função auxiliar para gerar questões em batches (processamento em background)
async function generateQuestionsInBackground(
    jobId: string,
    params: QuestionGenerationParams,
    references: any[]
) {
    const BATCH_SIZE = 10; // Gerar 10 questões por vez
    const totalBatches = Math.ceil(params.quantidade / BATCH_SIZE);
    let totalGenerated = 0;
    let totalSaved = 0;

    console.log(`[QuestionGenerator] Job ${jobId}: Iniciando geração de ${params.quantidade} questões em ${totalBatches} batches`);

    try {
        for (let batch = 0; batch < totalBatches; batch++) {
            const remaining = params.quantidade - totalGenerated;
            const batchSize = Math.min(BATCH_SIZE, remaining);

            console.log(`[QuestionGenerator] Job ${jobId}: Batch ${batch + 1}/${totalBatches} - Gerando ${batchSize} questões...`);

            // Criar params para este batch
            const batchParams = { ...params, quantidade: batchSize };

            try {
                // Gerar questões do batch
                const result = await generateQuestions(questionGeneratorAgent, batchParams, references);

                // Formatar comentários usando o agente de formatação
                const formattedQuestions = await formatQuestionsComments(result.questoes, params.materia);

                // Salvar imediatamente no banco
                const savedIds = await saveGeneratedQuestions(
                    formattedQuestions,
                    params,
                    questionsDbUrl,
                    questionsDbKey
                );

                totalGenerated += formattedQuestions.length;
                totalSaved += savedIds.length;

                // Atualizar status do job
                const job = questionGenerationJobs.get(jobId);
                if (job) {
                    job.totalGenerated = totalGenerated;
                    job.totalSaved = totalSaved;
                }

                console.log(`[QuestionGenerator] Job ${jobId}: Batch ${batch + 1} concluído - ${totalSaved}/${params.quantidade} questões salvas`);

            } catch (batchError) {
                console.error(`[QuestionGenerator] Job ${jobId}: Erro no batch ${batch + 1}:`, batchError);
                // Continua para o próximo batch mesmo com erro
            }
        }

        // Marcar job como concluído
        const job = questionGenerationJobs.get(jobId);
        if (job) {
            job.status = 'completed';
            job.completedAt = new Date();
            job.totalGenerated = totalGenerated;
            job.totalSaved = totalSaved;
        }

        console.log(`[QuestionGenerator] Job ${jobId}: Concluído! ${totalSaved} questões geradas e salvas.`);

    } catch (error) {
        console.error(`[QuestionGenerator] Job ${jobId}: Erro geral:`, error);
        const job = questionGenerationJobs.get(jobId);
        if (job) {
            job.status = 'error';
            job.error = error instanceof Error ? error.message : 'Erro desconhecido';
            job.completedAt = new Date();
        }
    }

    // Limpar job da memória após 1 hora
    setTimeout(() => {
        questionGenerationJobs.delete(jobId);
    }, 60 * 60 * 1000);
}

// POST /api/questions/generate - Gerar questões com IA (agora em background)
app.post('/api/questions/generate', async (req, res) => {
    try {
        const params: QuestionGenerationParams = req.body;

        // Validação básica
        if (!params.banca || !params.materia || !params.tipo || !params.escolaridade || !params.quantidade) {
            res.status(400).json({
                success: false,
                error: 'Parâmetros obrigatórios: banca, materia, tipo, escolaridade, quantidade'
            });
            return;
        }

        if (params.quantidade < 1 || params.quantidade > 200) {
            res.status(400).json({
                success: false,
                error: 'Quantidade deve estar entre 1 e 200'
            });
            return;
        }

        console.log('[QuestionGenerator] Iniciando geração:', params);

        // Buscar questões de referência
        const references = await fetchReferenceQuestions(
            params,
            questionsDbUrl,
            questionsDbKey
        );

        // Para matérias novas (sem referências), não bloqueia - gera sem exemplos
        if (references.length < 3) {
            console.log(`[QuestionGenerator] Poucas referências (${references.length}), gerando com contexto mínimo`);
        }

        console.log(`[QuestionGenerator] Encontradas ${references.length} questões de referência`);

        // Criar job ID único
        const jobId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Registrar job
        questionGenerationJobs.set(jobId, {
            status: 'running',
            totalRequested: params.quantidade,
            totalGenerated: 0,
            totalSaved: 0,
            startedAt: new Date()
        });

        // Iniciar geração em background (não bloqueia a resposta)
        setImmediate(() => {
            generateQuestionsInBackground(jobId, params, references);
        });

        // Retornar imediatamente com o job ID
        res.json({
            success: true,
            jobId,
            message: `Geração de ${params.quantidade} questões iniciada em background. As questões aparecerão na aba "Pendentes" conforme forem sendo geradas.`,
            questions: [], // Vazio, questões aparecerão na aba pendentes
            totalGenerated: 0,
            totalSaved: 0
        });

    } catch (error) {
        console.error('[QuestionGenerator] Erro:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao gerar questões'
        });
    }
});

// GET /api/questions/generate/status/:jobId - Verificar status do job
app.get('/api/questions/generate/status/:jobId', async (req, res) => {
    const { jobId } = req.params;
    const job = questionGenerationJobs.get(jobId);

    if (!job) {
        res.status(404).json({
            success: false,
            error: 'Job não encontrado ou expirado'
        });
        return;
    }

    res.json({
        success: true,
        job: {
            jobId,
            ...job
        }
    });
});

// POST /api/questions/generate-comment - Gerar comentário para questão
app.post('/api/questions/generate-comment', async (req, res) => {
    try {
        const { questionId, enunciado, alternativas, gabarito } = req.body;

        if (!enunciado || !alternativas || !gabarito) {
            res.status(400).json({
                success: false,
                error: 'Parâmetros obrigatórios: enunciado, alternativas, gabarito'
            });
            return;
        }

        console.log(`[QuestionGenerator] Gerando comentário para questão ${questionId || 'nova'}`);

        const comentario = await generateQuestionComment(questionGeneratorAgent, {
            enunciado,
            alternativas,
            gabarito
        });

        // Se tiver questionId, atualiza no banco
        if (questionId) {
            const supabase = createClient(questionsDbUrl, questionsDbKey);
            await supabase
                .from('questoes_concurso')
                .update({ comentario, updated_at: new Date().toISOString() })
                .eq('id', questionId);
        }

        res.json({
            success: true,
            comentario
        });

    } catch (error) {
        console.error('[QuestionGenerator] Erro ao gerar comentário:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao gerar comentário'
        });
    }
});

// GET /api/questions/generated - Listar questões geradas por IA
app.get('/api/questions/generated', async (req, res) => {
    try {
        const { status, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const offset = (pageNum - 1) * limitNum;

        const supabase = createClient(questionsDbUrl, questionsDbKey);

        let query = supabase
            .from('questoes_concurso')
            .select('*', { count: 'exact' })
            .eq('is_ai_generated', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + limitNum - 1);

        if (status) {
            query = query.eq('generation_status', status);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({
            success: true,
            questions: data || [],
            total: count || 0,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil((count || 0) / limitNum)
        });

    } catch (error) {
        console.error('[QuestionGenerator] Erro ao listar questões:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao listar questões'
        });
    }
});

// PUT /api/questions/generated/:id - Atualizar questão gerada
app.put('/api/questions/generated/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Campos permitidos para atualização
        const allowedFields = [
            'enunciado', 'alternativas', 'gabarito', 'comentario',
            'materia', 'assunto', 'banca', 'generation_status'
        ];

        const sanitizedUpdates: Record<string, any> = {};
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                sanitizedUpdates[field] = updates[field];
            }
        }

        sanitizedUpdates.updated_at = new Date().toISOString();

        const supabase = createClient(questionsDbUrl, questionsDbKey);
        const { data, error } = await supabase
            .from('questoes_concurso')
            .update(sanitizedUpdates)
            .eq('id', id)
            .eq('is_ai_generated', true)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            question: data
        });

    } catch (error) {
        console.error('[QuestionGenerator] Erro ao atualizar questão:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao atualizar questão'
        });
    }
});

// PUT /api/questions/generated/:id/publish - Publicar questão gerada
app.put('/api/questions/generated/:id/publish', async (req, res) => {
    try {
        const { id } = req.params;

        const supabase = createClient(questionsDbUrl, questionsDbKey);
        const { data, error } = await supabase
            .from('questoes_concurso')
            .update({
                generation_status: 'published',
                ativo: true,
                published_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('is_ai_generated', true)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            question: data
        });

    } catch (error) {
        console.error('[QuestionGenerator] Erro ao publicar questão:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao publicar questão'
        });
    }
});

// DELETE /api/questions/generated/:id - Excluir ou rejeitar questão gerada
app.delete('/api/questions/generated/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { softDelete = true } = req.query;

        const supabase = createClient(questionsDbUrl, questionsDbKey);

        if (softDelete === 'true' || softDelete === true) {
            // Soft delete - marca como rejeitada
            const { error } = await supabase
                .from('questoes_concurso')
                .update({
                    generation_status: 'rejected',
                    ativo: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('is_ai_generated', true);

            if (error) throw error;
        } else {
            // Hard delete - remove do banco
            const { error } = await supabase
                .from('questoes_concurso')
                .delete()
                .eq('id', id)
                .eq('is_ai_generated', true);

            if (error) throw error;
        }

        res.json({ success: true });

    } catch (error) {
        console.error('[QuestionGenerator] Erro ao excluir questão:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao excluir questão'
        });
    }
});

// GET /api/questions/filters - Obter opções de filtros (bancas, materias, assuntos)
app.get('/api/questions/filters', async (req, res) => {
    try {
        const supabase = createClient(questionsDbUrl, questionsDbKey);

        // Usar RPC com cache para obter todas as opções de filtro
        const { data, error } = await supabase.rpc('get_all_filter_options');

        if (error) {
            throw error;
        }

        // O RPC retorna: { materias, bancas, orgaos, anos, cargos }
        const result = data as {
            materias: string[];
            bancas: string[];
            orgaos: string[];
            anos: number[];
            cargos: string[];
        };

        res.json({
            success: true,
            bancas: result.bancas || [],
            materias: result.materias || [],
            orgaos: result.orgaos || [],
            anos: result.anos || [],
            cargos: result.cargos || []
        });

    } catch (error) {
        console.error('[QuestionGenerator] Erro ao buscar filtros:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao buscar filtros'
        });
    }
});

// GET /api/questions/assuntos - Buscar assuntos por matéria
app.get('/api/questions/assuntos', async (req, res) => {
    try {
        const { materia } = req.query;

        if (!materia) {
            res.status(400).json({
                success: false,
                error: 'Parâmetro obrigatório: materia'
            });
            return;
        }

        const supabase = createClient(questionsDbUrl, questionsDbKey);

        // Usar RPC para buscar todos os assuntos mapeados por matéria
        const { data, error } = await supabase.rpc('get_all_assuntos_by_materia', {
            p_materia: materia as string
        });

        if (error) {
            throw error;
        }

        const assuntos = (data || []).map((row: { assunto: string }) => row.assunto);

        res.json({
            success: true,
            assuntos
        });

    } catch (error) {
        console.error('[QuestionGenerator] Erro ao buscar assuntos:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao buscar assuntos'
        });
    }
});

// ============================================
// Iniciar Cron Jobs
// ============================================

// Cron job para processar imagens (a cada 2 minutos)
const imageProcessorInterval = startImageProcessorCron(
    questionsDbUrl,
    questionsDbKey,
    2 * 60 * 1000 // 2 minutos
);

// Cron job para revisar questões com IA (a cada 10 minutos)
// Agora usa Vertex AI diretamente via AI SDK
const questionReviewerInterval = startQuestionReviewerCron(
    questionsDbUrl,
    questionsDbKey,
    10 * 60 * 1000 // 10 minutos
);

// Cron job para extrair gabaritos de questões sem resposta (a cada 5 minutos)
// Agora usa Vertex AI diretamente via AI SDK
const gabaritoExtractorInterval = startGabaritoExtractorCron(
    questionsDbUrl,
    questionsDbKey,
    5 * 60 * 1000 // 5 minutos
);

// Cron job para formatação de comentários (a cada 1 minuto, 30 por lote)
// Agora usa Vertex AI diretamente via AI SDK
startComentarioFormatterCron(
    questionsDbUrl,
    questionsDbKey,
    60 * 1000, // 1 minuto
    30 // 30 questões por lote (~1800/hora)
);

// Cron job para formatação de enunciados (a cada 1 minuto, 30 por lote)
// Agora usa Vertex AI diretamente via AI SDK
startEnunciadoFormatterCron(
    questionsDbUrl,
    questionsDbKey,
    60 * 1000, // 1 minuto
    30 // 30 questões por lote (~1800/hora)
);

// Cron job para classificação de matérias (a cada 1 minuto, 50 por lote)
// Com 500ms entre requisições, 50 questões levam ~25s, deixando margem para o próximo ciclo
startMateriaClassifierCron(
    questionsDbUrl,
    questionsDbKey,
    60 * 1000, // 1 minuto
    50 // 50 questões por lote (~3000/hora)
);

console.log('[Server] Cron jobs de scraping e formatação iniciados');

// ============================================
// Cron job para atualizar caches de filtros (a cada 1 hora)
// ============================================

const FILTER_CACHE_REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hora

async function refreshFilterCaches() {
    console.log('[FilterCache] Iniciando atualização dos caches de filtros...');

    try {
        const supabase = createClient(questionsDbUrl, questionsDbKey);

        // Atualizar cache de opções de filtro
        const { error: filterError } = await supabase.rpc('refresh_filter_options_cache');
        if (filterError) {
            console.error('[FilterCache] Erro ao atualizar filter_options_cache:', filterError);
        } else {
            console.log('[FilterCache] filter_options_cache atualizado com sucesso');
        }

        // Atualizar cache de assuntos por matéria
        const { error: assuntosError } = await supabase.rpc('refresh_assuntos_cache');
        if (assuntosError) {
            console.error('[FilterCache] Erro ao atualizar assuntos_cache:', assuntosError);
        } else {
            console.log('[FilterCache] assuntos_by_materia_cache atualizado com sucesso');
        }

    } catch (error) {
        console.error('[FilterCache] Erro geral ao atualizar caches:', error);
    }
}

// Iniciar cron job de cache
setInterval(refreshFilterCaches, FILTER_CACHE_REFRESH_INTERVAL);
console.log(`[FilterCache] Cron job iniciado (intervalo: ${FILTER_CACHE_REFRESH_INTERVAL / 1000 / 60} minutos)`);

// Endpoint para forçar atualização manual do cache
app.post('/api/admin/refresh-filter-cache', async (req, res) => {
    try {
        await refreshFilterCaches();
        res.json({
            success: true,
            message: 'Caches de filtros atualizados com sucesso'
        });
    } catch (error) {
        console.error('[FilterCache] Erro ao atualizar caches manualmente:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro ao atualizar caches'
        });
    }
});

// ============================================

app.listen(PORT, () => {
    console.log(`Mastra Agent Server running on http://localhost:${PORT}`);
    console.log(`Scraper API disponível em http://localhost:${PORT}/api/scraper`);
});

const MCP_PORT = 4111;

// Start the MCP Server on a separate port for MCP clients using SSE transport
const mcpHttpServer = http.createServer(async (req, res) => {
    // Enable CORS for MCP clients
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = new URL(req.url || '', `http://localhost:${MCP_PORT}`);

    if (url.pathname === '/mcp' || url.pathname.startsWith('/mcp/')) {
        try {
            await ousePassarMcpServer.startHTTP({
                url,
                httpPath: '/mcp',
                req,
                res,
            });
        } catch (error) {
            console.error('[MCP] Error handling request:', error);
            res.writeHead(500);
            res.end('Internal Server Error');
        }
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

mcpHttpServer.setTimeout(5 * 60 * 1000);

mcpHttpServer.listen(MCP_PORT, () => {
    console.log(`MCP Server running on http://localhost:${MCP_PORT}/mcp`);
    console.log(`\nConnect with Claude Desktop, Cursor, or any MCP client using:`);
    console.log(`  URL: http://localhost:${MCP_PORT}/mcp`);
});
