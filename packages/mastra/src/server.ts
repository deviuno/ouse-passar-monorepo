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
    MateriaOrdenada,
    ConfiguracaoGeracao,
    EditalEstrutura,
} from './mastra/agents/rodadasGeneratorAgent.js';
import multer from 'multer';

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
        const { history, userMessage, question, user, threadId } = req.body;

        const agent = mastra.getAgent("tutorAgent");

        if (!agent) {
            res.status(500).json({ success: false, error: "Agent not found" });
            return;
        }

        // Generate thread ID based on question if not provided
        const currentThreadId = threadId || `question-${question.id || Date.now()}`;
        const resourceId = user.id || user.name || 'anonymous';

        // Format alternatives if they are an array of objects
        const alternativesText = Array.isArray(question.alternativas)
            ? question.alternativas.map((a: any) => `${a.letter || ''}) ${a.text || JSON.stringify(a)}`).join('\n')
            : JSON.stringify(question.alternativas);

        // Construct the context as a system message
        const questionContext = `
📋 **CONTEXTO DA QUESTÃO ATUAL**

**Matéria:** ${question.materia || 'Geral'}
**Assunto:** ${question.assunto || 'Geral'}
**Banca:** ${question.banca || 'N/A'}
**Ano:** ${question.ano || 'N/A'}

**Enunciado:**
${question.enunciado}

**Alternativas:**
${alternativesText}

---
⚠️ **GABARITO OFICIAL (VERDADE ABSOLUTA): ${question.gabarito}**
A alternativa "${question.gabarito}" é a resposta CORRETA. Use engenharia reversa para explicar POR QUE ela está certa.
---
${question.comentario ? `\n**Comentário Base:** ${question.comentario}` : ''}
${question.isPegadinha ? `\n⚠️ **Esta questão é uma pegadinha!** ${question.explicacaoPegadinha || ''}` : ''}

**Perfil do Aluno:** ${user.name || 'Aluno'} (Nível ${user.level || 1}, ${user.xp || 0} XP)
        `.trim();

        console.log(`[Tutor] Processing message from ${user.name} on thread ${currentThreadId}...`);

        // Use the agent's generate method with memory context
        const result = await agent.generate([
            { role: "user", content: questionContext },
            { role: "assistant", content: `Entendido! Analisei a questão e confirmei que o gabarito oficial é a alternativa **${question.gabarito}**. Vou usar essa informação como base para minhas explicações. Como posso te ajudar?` },
            { role: "user", content: userMessage }
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

// Supabase client for main database
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Supabase client for questions/scrapping database
const questionsDbUrl = process.env.VITE_QUESTIONS_DB_URL || '';
const questionsDbKey = process.env.VITE_QUESTIONS_DB_ANON_KEY || '';
const questionsDb = createClient(questionsDbUrl, questionsDbKey);

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
 * Gera uma imagem de capa profissional para o preparatório usando Gemini
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
        console.log(`[ImagemCapa] Gerando imagem para: ${info.nome}`);

        // Prompt otimizado para gerar uma capa motivacional focada no cargo
        const cargoDescricao = info.cargo?.toLowerCase() || '';

        // Mapear cargo para contexto visual específico
        let profissaoContexto = 'a successful professional in a modern office';
        let ambiente = 'professional office environment';

        if (cargoDescricao.includes('juiz') || cargoDescricao.includes('magistrad')) {
            profissaoContexto = 'a confident judge in elegant black robes, standing proudly in a beautiful courtroom';
            ambiente = 'majestic courtroom with wooden details and scales of justice';
        } else if (cargoDescricao.includes('promotor') || cargoDescricao.includes('procurador')) {
            profissaoContexto = 'a confident prosecutor in formal attire, standing proud in a courthouse';
            ambiente = 'elegant courthouse interior';
        } else if (cargoDescricao.includes('delegado')) {
            profissaoContexto = 'a proud police chief in professional attire, radiating authority and success';
            ambiente = 'modern police headquarters';
        } else if (cargoDescricao.includes('policial') || cargoDescricao.includes('agente') && (cargoDescricao.includes('prf') || cargoDescricao.includes('pf') || cargoDescricao.includes('polícia'))) {
            profissaoContexto = 'a proud federal police officer in uniform, standing tall and confident';
            ambiente = 'impressive federal building entrance';
        } else if (cargoDescricao.includes('auditor') || cargoDescricao.includes('fiscal')) {
            profissaoContexto = 'a successful tax auditor in elegant business attire, confident posture';
            ambiente = 'modern government financial office';
        } else if (cargoDescricao.includes('analista')) {
            profissaoContexto = 'a successful analyst in professional business attire, confident and accomplished';
            ambiente = 'modern government office with city view';
        } else if (cargoDescricao.includes('técnico')) {
            profissaoContexto = 'a successful public servant in professional attire, proud of achievement';
            ambiente = 'modern public institution';
        } else if (cargoDescricao.includes('professor') || cargoDescricao.includes('docente')) {
            profissaoContexto = 'a happy professor in a university setting, inspiring and accomplished';
            ambiente = 'prestigious university classroom';
        } else if (cargoDescricao.includes('médico') || cargoDescricao.includes('perito')) {
            profissaoContexto = 'a confident doctor in white coat, successful and caring';
            ambiente = 'modern hospital or clinic';
        } else if (cargoDescricao.includes('defensor')) {
            profissaoContexto = 'a proud public defender in formal attire, champion of justice';
            ambiente = 'elegant law office';
        } else if (cargoDescricao.includes('escrivão') || cargoDescricao.includes('cartório')) {
            profissaoContexto = 'a professional notary in elegant attire, accomplished and reliable';
            ambiente = 'prestigious notary office';
        } else if (cargoDescricao.includes('militar') || cargoDescricao.includes('bombeiro')) {
            profissaoContexto = 'a proud military professional or firefighter in dress uniform, heroic posture';
            ambiente = 'impressive military or fire station';
        }

        const prompt = `Create an inspiring, aspirational cover image for a Brazilian public exam preparation course.

MAIN SUBJECT: ${profissaoContexto}
The person should look:
- Genuinely happy and fulfilled
- At the peak of their career
- Confident and successful
- Professional but approachable
- Like someone who achieved their dream

ENVIRONMENT: ${ambiente}

MOOD AND FEELING:
- Triumphant, like someone who just achieved a life goal
- Warm, golden lighting suggesting success and a bright future
- Inspiring and motivational
- Premium and aspirational

COMPOSITION:
- Cinematic, professional photography style
- Shallow depth of field, subject in sharp focus
- Beautiful bokeh in background
- 16:9 aspect ratio
- Rich, warm color grading
- Professional lighting with subtle rim light

${info.orgao ? `Context: This is for ${info.orgao}` : ''}
${info.cargo ? `Specific role: ${info.cargo}` : ''}

CRITICAL: Do NOT include any text, words, letters, numbers, logos, or watermarks in the image.
The image should make viewers WANT to be this person - successful, happy, and transformed by achieving their dream.`;

        // Adicionar timeout de 30 segundos para não travar indefinidamente
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Timeout: geração de imagem demorou mais de 30 segundos')), 30000);
        });

        const generatePromise = client.models.generateContent({
            model: 'gemini-2.0-flash-exp-image-generation', // Modelo específico para geração de imagem
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

        console.log('[ImagemCapa] Imagem gerada, fazendo upload para Supabase...');

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

        return imageUrl;

    } catch (error: any) {
        console.error('[ImagemCapa] Erro ao gerar imagem:', error.message || error);
        return null;
    }
}

// ==================== ENDPOINT PARA GERAÇÃO DE IMAGEM DE CAPA ====================

/**
 * Gera o prompt contextualizado para a imagem de capa baseado no cargo
 */
function gerarPromptImagemCapa(cargo: string, orgao?: string): { prompt: string; promptUsuario: string } {
    const cargoDescricao = cargo?.toLowerCase() || '';

    // Mapear cargo para descrição amigável em português
    let profissaoDescricao = 'profissional';
    let contextoVisual = 'em um ambiente de trabalho moderno';

    if (cargoDescricao.includes('juiz') || cargoDescricao.includes('magistrad')) {
        profissaoDescricao = 'Juiz(a) de Direito';
        contextoVisual = 'em um tribunal elegante, usando toga preta';
    } else if (cargoDescricao.includes('promotor') || cargoDescricao.includes('procurador')) {
        profissaoDescricao = 'Promotor(a) de Justiça';
        contextoVisual = 'em um fórum de justiça, com postura confiante';
    } else if (cargoDescricao.includes('delegado')) {
        profissaoDescricao = 'Delegado(a) de Polícia';
        contextoVisual = 'em uma delegacia moderna, transmitindo autoridade';
    } else if (cargoDescricao.includes('agente') && (cargoDescricao.includes('polícia') || cargoDescricao.includes('policia') || cargoDescricao.includes('civil'))) {
        profissaoDescricao = 'Agente de Polícia Civil';
        contextoVisual = 'exercendo sua função com orgulho e dedicação';
    } else if (cargoDescricao.includes('policial') || cargoDescricao.includes('prf') || cargoDescricao.includes('pf')) {
        profissaoDescricao = 'Policial Federal';
        contextoVisual = 'em uniforme, em frente a um prédio federal imponente';
    } else if (cargoDescricao.includes('auditor') || cargoDescricao.includes('fiscal')) {
        profissaoDescricao = 'Auditor(a) Fiscal';
        contextoVisual = 'em um escritório governamental sofisticado';
    } else if (cargoDescricao.includes('analista')) {
        profissaoDescricao = 'Analista';
        contextoVisual = 'em um ambiente corporativo moderno com vista para a cidade';
    } else if (cargoDescricao.includes('técnico')) {
        profissaoDescricao = 'Técnico(a)';
        contextoVisual = 'em uma instituição pública moderna';
    } else if (cargoDescricao.includes('professor') || cargoDescricao.includes('docente')) {
        profissaoDescricao = 'Professor(a)';
        contextoVisual = 'em uma sala de aula universitária prestigiada';
    } else if (cargoDescricao.includes('médico') || cargoDescricao.includes('perito')) {
        profissaoDescricao = 'Médico(a) Perito(a)';
        contextoVisual = 'em um ambiente hospitalar moderno';
    } else if (cargoDescricao.includes('defensor')) {
        profissaoDescricao = 'Defensor(a) Público(a)';
        contextoVisual = 'em um escritório de advocacia elegante';
    } else if (cargoDescricao.includes('escrivão') || cargoDescricao.includes('cartório')) {
        profissaoDescricao = 'Escrivão(ã)';
        contextoVisual = 'em um cartório ou delegacia';
    } else if (cargoDescricao.includes('militar') || cargoDescricao.includes('bombeiro')) {
        profissaoDescricao = 'Bombeiro(a) Militar';
        contextoVisual = 'em uniforme de gala, com postura heroica';
    } else if (cargo) {
        profissaoDescricao = cargo;
    }

    // Prompt amigável para o usuário
    const promptUsuario = `${profissaoDescricao} feliz por ter sido aprovado(a) no concurso${orgao ? ` do ${orgao}` : ''}, ${contextoVisual}, exercendo sua função com prazer e realização profissional.`;

    // Prompt técnico completo para a IA - otimizado para qualidade profissional
    const prompt = `MANDATORY FORMAT: HORIZONTAL LANDSCAPE IMAGE (16:9 aspect ratio, wider than tall)

Create a premium, magazine-quality cover photograph for a Brazilian public exam preparation course.

SUBJECT: A successful ${profissaoDescricao} at work${orgao ? ` at ${orgao}` : ''}.
- Professional, confident posture
- Natural, genuine expression of satisfaction
- Wearing appropriate professional attire
- ${contextoVisual}

PHOTOGRAPHY STYLE:
- High-end editorial/corporate photography
- Shot with professional DSLR camera
- 85mm portrait lens with f/1.8 aperture
- Soft, natural lighting with professional studio quality
- Shallow depth of field, subject in crisp focus
- Elegant bokeh in background
- Color grading: warm, premium tones (similar to LinkedIn professional photos)

COMPOSITION RULES:
- MUST be HORIZONTAL/LANDSCAPE orientation (16:9)
- Rule of thirds positioning
- Subject positioned slightly off-center
- Clean, uncluttered background
- Professional workspace or institutional environment visible

ABSOLUTELY FORBIDDEN - DO NOT INCLUDE:
- ANY text, letters, words, or numbers
- ANY logos, watermarks, or badges
- ANY overlays or graphic elements
- ANY handwritten elements
- ANY signs or plaques with writing

The final image must look like a premium stock photo suitable for a Fortune 500 company website.`;

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
            model: 'gemini-2.0-flash-exp-image-generation',
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

        console.log('[ImagemCapa API] Imagem gerada, fazendo upload...');

        // Upload para Supabase Storage
        const fileName = `capa-ai-${Date.now()}-${Math.random().toString(36).substring(2)}.png`;
        const buffer = Buffer.from(imageData, 'base64');

        const { error: uploadError } = await supabase.storage
            .from('preparatorios')
            .upload(fileName, buffer, {
                contentType: 'image/png',
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
            model: 'gemini-2.0-flash',
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
            model: 'gemini-2.0-flash',
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

        // Limitar texto para evitar timeout (máx ~5000 chars)
        const textoLimitado = text.length > 5000 ? text.substring(0, 5000) + '...' : text;

        // Generate TTS audio using Gemini 2.5 Flash TTS
        // Ref: https://ai.google.dev/gemini-api/docs/speech-generation
        const audioResponse = await client.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{
                parts: [{
                    text: `Leia o seguinte texto de forma clara, natural e didática em português brasileiro, como um professor explicando:\n\n${textoLimitado}`
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

    // Fallback: buscar por banca se tiver nos filtros
    if (questoes.length < limite && filtros?.bancas?.length > 0) {
        const { data, error } = await questionsDb
            .from('questoes_concurso')
            .select('*')
            .in('banca', filtros.bancas)
            .limit(limite - questoes.length);

        if (!error && data) {
            for (const q of data) {
                if (!questoes.find(existing => existing.id === q.id)) {
                    questoes.push(q);
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

// Função principal: Gerar conteúdo de uma missão em background
async function gerarConteudoMissaoBackground(missaoId: string): Promise<boolean> {
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
                return true;
            }
            if (existingContent.status === 'generating') {
                console.log(`[BackgroundContent] Geração já em andamento para missão ${missaoId}`);
                return false;
            }
        }

        // 2. Criar registro como "generating"
        const { data: contentRecord, error: insertError } = await supabase
            .from('missao_conteudos')
            .insert({
                missao_id: missaoId,
                texto_content: '',
                status: 'generating',
                modelo_texto: 'gemini-2.5-pro-preview',
            })
            .select('id')
            .single();

        if (insertError) {
            if (insertError.code === '23505') {
                console.log(`[BackgroundContent] Conteúdo já em criação (race condition)`);
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
        const prompt = `
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

        const contentAgent = mastra.getAgent("contentGeneratorAgent");
        if (!contentAgent) throw new Error('contentGeneratorAgent não encontrado');

        console.log(`[BackgroundContent] Gerando texto para missão ${missaoId}...`);
        const contentResult = await contentAgent.generate([{ role: 'user', content: prompt }]);
        const textoContent = contentResult.text || '';

        console.log(`[BackgroundContent] Texto gerado (${textoContent.length} chars) para missão ${missaoId}`);

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

        // 8. Gerar TTS (opcional, não bloqueia se falhar)
        let audioUrl: string | null = null;
        if (roteiro && roteiro.length > 100) {
            try {
                console.log(`[BackgroundContent] Gerando TTS para missão ${missaoId}...`);

                const client = getGeminiClient();
                if (client) {
                    const textoLimitado = roteiro.length > 5000 ? roteiro.substring(0, 5000) + '...' : roteiro;

                    const audioResponse = await client.models.generateContent({
                        model: 'gemini-2.5-flash-preview-tts',
                        contents: [{
                            parts: [{
                                text: `Leia o seguinte texto de forma clara, natural e didática em português brasileiro, como um professor explicando:\n\n${textoLimitado}`
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
                status: 'completed',
                modelo_audio: audioUrl ? 'google-tts' : null,
            })
            .eq('id', contentId);

        if (updateError) {
            throw updateError;
        }

        console.log(`[BackgroundContent] ✅ Conteúdo gerado com sucesso para missão ${missaoId}`);
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
    }
}

// Helper: Buscar primeiras N missões de um preparatório
async function getPrimeirasMissoes(preparatorioId: string, limite: number = 2): Promise<string[]> {
    const { data: rodadas, error } = await supabase
        .from('rodadas')
        .select('id')
        .eq('preparatorio_id', preparatorioId)
        .order('ordem', { ascending: true })
        .limit(1);

    if (error || !rodadas?.length) return [];

    const { data: missoes, error: missoesError } = await supabase
        .from('missoes')
        .select('id')
        .eq('rodada_id', rodadas[0].id)
        .order('ordem', { ascending: true })
        .limit(limite);

    if (missoesError || !missoes) return [];

    return missoes.map(m => m.id);
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
        const missoes = await getPrimeirasMissoes(preparatorio_id, quantidade);
        console.log(`[BackgroundContent] Encontradas ${missoes.length} missões para gerar`);

        for (const missaoId of missoes) {
            await gerarConteudoMissaoBackground(missaoId);
        }
    })().catch(err => {
        console.error(`[BackgroundContent] Erro ao gerar conteúdo inicial:`, err);
    });
});

// Endpoint: Trigger geração da próxima missão (chamado quando aluno acessa uma missão)
app.post('/api/missao/trigger-proxima', async (req, res) => {
    const { missao_id } = req.body;

    if (!missao_id) {
        res.status(400).json({ success: false, error: 'missao_id é obrigatório' });
        return;
    }

    // Responde imediatamente
    res.json({ success: true, message: 'Verificação iniciada' });

    // Verifica e gera em background
    (async () => {
        const proximaMissaoId = await getProximaMissao(missao_id);

        if (!proximaMissaoId) {
            console.log(`[BackgroundContent] Nenhuma próxima missão após ${missao_id}`);
            return;
        }

        // Verificar se próxima já tem conteúdo
        const { data: existingContent } = await supabase
            .from('missao_conteudos')
            .select('status')
            .eq('missao_id', proximaMissaoId)
            .maybeSingle();

        if (existingContent?.status === 'completed' || existingContent?.status === 'generating') {
            console.log(`[BackgroundContent] Próxima missão ${proximaMissaoId} já tem/está gerando conteúdo`);
            return;
        }

        console.log(`[BackgroundContent] Iniciando geração para próxima missão ${proximaMissaoId}`);
        await gerarConteudoMissaoBackground(proximaMissaoId);
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
            missoes_por_rodada: config?.missoes_por_rodada || 5,
            max_topicos_por_missao: config?.max_topicos_por_missao || 3,
            incluir_revisoes: config?.incluir_revisoes !== false,
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

        // Gerar rodadas
        const resultado = gerarRodadas(materias, configuracao);

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
        { etapa: 'Gerando rodadas e missões', status: 'pending' },
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

        // ========== ETAPA 5: GERAR RODADAS E MISSÕES ==========
        etapas[4].status = 'in_progress';
        console.log('[FromPDF] Etapa 4: Gerando rodadas e missões...');

        // Buscar matérias com tópicos
        const materias = await buscarMateriasComTopicos(preparatorioId);

        if (materias.length === 0) {
            etapas[4].status = 'error';
            etapas[4].detalhes = 'Nenhuma matéria com tópicos encontrada';
            // Rollback
            await deletarPreparatorio(preparatorioId);
            res.status(500).json({
                success: false,
                error: 'Nenhuma matéria com tópicos foi encontrada no edital',
                etapas,
            });
            return;
        }

        // Configuração padrão
        const config: ConfiguracaoGeracao = {
            missoes_por_rodada: 5,
            max_topicos_por_missao: 3,
            incluir_revisoes: true,
            incluir_simulado: true,
            gerar_filtros_questoes: true,
        };

        // Gerar rodadas
        const resultadoRodadas = gerarRodadas(materias, config);

        if (!resultadoRodadas.success) {
            etapas[4].status = 'error';
            etapas[4].detalhes = resultadoRodadas.error;
            await deletarPreparatorio(preparatorioId);
            res.status(500).json({
                success: false,
                error: resultadoRodadas.error || 'Erro ao gerar rodadas',
                etapas,
            });
            return;
        }

        // Persistir rodadas
        const resultadoPersistencia = await persistirRodadas(
            preparatorioId,
            resultadoRodadas.rodadas,
            true, // substituir existentes
            true, // gerar filtros
            analise.infoBasica.banca || undefined
        );

        if (!resultadoPersistencia.success) {
            etapas[4].status = 'error';
            etapas[4].detalhes = resultadoPersistencia.error;
            await deletarPreparatorio(preparatorioId);
            res.status(500).json({
                success: false,
                error: resultadoPersistencia.error || 'Erro ao salvar rodadas',
                etapas,
            });
            return;
        }

        etapas[4].status = 'completed';
        etapas[4].detalhes = `${resultadoRodadas.estatisticas.total_rodadas} rodadas, ${resultadoRodadas.estatisticas.total_missoes} missões`;
        console.log(`[FromPDF] Rodadas criadas: ${resultadoRodadas.estatisticas.total_rodadas}`);

        // Salvar raio-x com estatísticas
        const raioX = {
            analise_automatica: true,
            data_analise: new Date().toISOString(),
            total_blocos: resultadoEdital.blocos_criados,
            total_materias: resultadoEdital.materias_criadas,
            total_topicos: resultadoEdital.topicos_criados,
            total_rodadas: resultadoRodadas.estatisticas.total_rodadas,
            total_missoes: resultadoRodadas.estatisticas.total_missoes,
            missoes_estudo: resultadoRodadas.estatisticas.missoes_estudo,
            missoes_revisao: resultadoRodadas.estatisticas.missoes_revisao,
        };

        await atualizarRaioX(preparatorioId, raioX);

        // ========== ETAPA 6: CRIAR MENSAGENS DE INCENTIVO ==========
        etapas[5].status = 'in_progress';
        console.log('[FromPDF] Etapa 6: Criando mensagens de incentivo...');

        const resultadoMensagens = await criarMensagensIncentivoPadrao(preparatorioId);

        etapas[5].status = 'completed';
        etapas[5].detalhes = `${resultadoMensagens.mensagens_criadas} mensagens`;
        console.log(`[FromPDF] Mensagens criadas: ${resultadoMensagens.mensagens_criadas}`);

        // ========== ETAPA 7: FINALIZAR ==========
        etapas[6].status = 'in_progress';
        console.log('[FromPDF] Etapa 7: Finalizando...');

        // Ativar preparatório
        const ativado = await ativarPreparatorio(preparatorioId);

        if (!ativado) {
            console.warn('[FromPDF] Preparatório não foi ativado automaticamente');
        }

        etapas[6].status = 'completed';
        etapas[6].detalhes = 'Preparatório ativado';

        // Trigger geração de conteúdo das primeiras missões em background (silencioso)
        console.log('[FromPDF] Iniciando geração de conteúdo em background...');
        (async () => {
            const missoes = await getPrimeirasMissoes(preparatorioId, 2);
            console.log(`[FromPDF] Background: Gerando conteúdo para ${missoes.length} missões`);
            for (const missaoId of missoes) {
                await gerarConteudoMissaoBackground(missaoId);
            }
        })().catch(err => {
            console.error('[FromPDF] Erro na geração de conteúdo em background:', err);
        });

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
                rodadas: resultadoRodadas.estatisticas.total_rodadas,
                missoes: resultadoRodadas.estatisticas.total_missoes,
                mensagens_incentivo: resultadoMensagens.mensagens_criadas,
                tempo_processamento_ms: tempoTotal,
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
        { etapa: 'Gerando rodadas e missões', status: 'pending' },
        { etapa: 'Criando mensagens de incentivo', status: 'pending' },
        { etapa: 'Finalizando', status: 'pending' },
    ];

    const updateEtapa = (index: number, status: EtapaProgresso['status'], detalhes?: string) => {
        etapas[index].status = status;
        if (detalhes) etapas[index].detalhes = detalhes;
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

        // ========== ETAPA 5: GERAR RODADAS E MISSÕES ==========
        updateEtapa(4, 'in_progress');
        console.log('[FromPDF-SSE] Etapa 5: Gerando rodadas e missões...');

        const materias = await buscarMateriasComTopicos(preparatorioId);

        if (materias.length === 0) {
            updateEtapa(4, 'error', 'Nenhuma matéria com tópicos encontrada');
            await deletarPreparatorio(preparatorioId);
            sendEvent('error', { error: 'Nenhuma matéria com tópicos foi encontrada', etapas });
            res.end();
            return;
        }

        const config: ConfiguracaoGeracao = {
            missoes_por_rodada: 5,
            max_topicos_por_missao: 3,
            incluir_revisoes: true,
            incluir_simulado: true,
            gerar_filtros_questoes: true,
        };

        const resultadoRodadas = gerarRodadas(materias, config);

        if (!resultadoRodadas.success) {
            updateEtapa(4, 'error', resultadoRodadas.error);
            await deletarPreparatorio(preparatorioId);
            sendEvent('error', { error: resultadoRodadas.error || 'Erro ao gerar rodadas', etapas });
            res.end();
            return;
        }

        const resultadoPersistencia = await persistirRodadas(
            preparatorioId,
            resultadoRodadas.rodadas,
            true,
            true,
            analise.infoBasica.banca || undefined
        );

        if (!resultadoPersistencia.success) {
            updateEtapa(4, 'error', resultadoPersistencia.error);
            await deletarPreparatorio(preparatorioId);
            sendEvent('error', { error: resultadoPersistencia.error || 'Erro ao salvar rodadas', etapas });
            res.end();
            return;
        }

        updateEtapa(4, 'completed', `${resultadoRodadas.estatisticas.total_rodadas} rodadas, ${resultadoRodadas.estatisticas.total_missoes} missões`);
        console.log(`[FromPDF-SSE] Rodadas criadas: ${resultadoRodadas.estatisticas.total_rodadas}`);

        // Salvar raio-x
        const raioX = {
            analise_automatica: true,
            data_analise: new Date().toISOString(),
            total_blocos: resultadoEdital.blocos_criados,
            total_materias: resultadoEdital.materias_criadas,
            total_topicos: resultadoEdital.topicos_criados,
            total_rodadas: resultadoRodadas.estatisticas.total_rodadas,
            total_missoes: resultadoRodadas.estatisticas.total_missoes,
        };
        await atualizarRaioX(preparatorioId, raioX);

        // ========== ETAPA 6: CRIAR MENSAGENS DE INCENTIVO ==========
        updateEtapa(5, 'in_progress');
        console.log('[FromPDF-SSE] Etapa 6: Criando mensagens de incentivo...');

        const resultadoMensagens = await criarMensagensIncentivoPadrao(preparatorioId);

        updateEtapa(5, 'completed', `${resultadoMensagens.mensagens_criadas} mensagens`);
        console.log(`[FromPDF-SSE] Mensagens criadas: ${resultadoMensagens.mensagens_criadas}`);

        // ========== ETAPA 7: FINALIZAR ==========
        updateEtapa(6, 'in_progress');
        console.log('[FromPDF-SSE] Etapa 7: Finalizando...');

        await ativarPreparatorio(preparatorioId);

        updateEtapa(6, 'completed', 'Preparatório ativado');

        // Trigger geração de conteúdo das primeiras missões em background (silencioso)
        console.log('[FromPDF-SSE] Iniciando geração de conteúdo em background...');
        (async () => {
            const missoes = await getPrimeirasMissoes(preparatorioId, 2);
            console.log(`[FromPDF-SSE] Background: Gerando conteúdo para ${missoes.length} missões`);
            for (const missaoId of missoes) {
                await gerarConteudoMissaoBackground(missaoId);
            }
        })().catch(err => {
            console.error('[FromPDF-SSE] Erro na geração de conteúdo em background:', err);
        });

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
                rodadas: resultadoRodadas.estatisticas.total_rodadas,
                missoes: resultadoRodadas.estatisticas.total_missoes,
                mensagens_incentivo: resultadoMensagens.mensagens_criadas,
                tempo_processamento_ms: tempoTotal,
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

// ==================== ENDPOINT SSE PARA CRIAÇÃO COM VALIDAÇÃO DE RODADAS ====================

/**
 * POST /api/preparatorio/from-pdf-preview
 *
 * Fluxo em duas fases:
 * Fase 1 (este endpoint): Analisa PDF → Cria preparatório → Cria edital → Gera preview das rodadas
 * Fase 2 (confirm-rodadas): Usuário valida ordem → Persiste rodadas → Finaliza
 *
 * Eventos SSE:
 * - progress: { etapas, currentStep }
 * - preview: { preparatorioId, materias, rodadasPreview, estatisticas } - Aguarda confirmação do usuário
 * - error: { error, etapas }
 */
app.post('/api/preparatorio/from-pdf-preview', upload.single('pdf'), async (req, res) => {
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
        { etapa: 'Gerando prévia das rodadas', status: 'pending' },
    ];

    const updateEtapa = (index: number, status: EtapaProgresso['status'], detalhes?: string) => {
        etapas[index].status = status;
        if (detalhes) etapas[index].detalhes = detalhes;
        sendEvent('progress', { etapas, currentStep: index });
    };

    try {
        // Validar arquivo PDF
        if (!req.file) {
            sendEvent('error', { error: 'Arquivo PDF é obrigatório', etapas });
            res.end();
            return;
        }

        console.log(`[FromPDF-Preview] Iniciando processo com arquivo de ${(req.file.size / 1024 / 1024).toFixed(2)}MB`);

        // ========== ETAPA 1: ANÁLISE DO PDF ==========
        updateEtapa(0, 'in_progress');
        console.log('[FromPDF-Preview] Etapa 1: Analisando PDF com IA...');

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
        console.log(`[FromPDF-Preview] Análise concluída: ${analise.estrutura.blocos?.length || 0} blocos`);

        // ========== ETAPA 2: CRIAR PREPARATÓRIO ==========
        updateEtapa(1, 'in_progress');
        console.log('[FromPDF-Preview] Etapa 2: Criando preparatório...');

        const resultadoPrep = await criarPreparatorio(analise.infoBasica);

        if (!resultadoPrep.success || !resultadoPrep.preparatorio_id) {
            updateEtapa(1, 'error', resultadoPrep.error);
            sendEvent('error', { error: resultadoPrep.error || 'Erro ao criar preparatório', etapas });
            res.end();
            return;
        }

        preparatorioId = resultadoPrep.preparatorio_id;
        updateEtapa(1, 'completed', `Slug: ${resultadoPrep.slug}`);
        console.log(`[FromPDF-Preview] Preparatório criado: ${preparatorioId}`);

        // ========== ETAPA 3: GERAR IMAGEM DE CAPA ==========
        updateEtapa(2, 'in_progress');
        console.log('[FromPDF-Preview] Etapa 3: Gerando imagem de capa...');

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
        console.log('[FromPDF-Preview] Etapa 4: Criando edital verticalizado...');

        const resultadoEdital = await criarEditalVerticalizado(preparatorioId, analise.estrutura);

        if (!resultadoEdital.success) {
            updateEtapa(3, 'error', resultadoEdital.error);
            await deletarPreparatorio(preparatorioId);
            sendEvent('error', { error: resultadoEdital.error || 'Erro ao criar edital', etapas });
            res.end();
            return;
        }

        updateEtapa(3, 'completed', `${resultadoEdital.blocos_criados} blocos, ${resultadoEdital.materias_criadas} matérias, ${resultadoEdital.topicos_criados} tópicos`);
        console.log(`[FromPDF-Preview] Edital criado`);

        // ========== ETAPA 5: GERAR PRÉVIA DAS RODADAS ==========
        updateEtapa(4, 'in_progress');
        console.log('[FromPDF-Preview] Etapa 5: Gerando prévia das rodadas...');

        // Buscar matérias com tópicos (já ordenadas com Português primeiro)
        const materias = await buscarMateriasComTopicos(preparatorioId);

        if (materias.length === 0) {
            updateEtapa(4, 'error', 'Nenhuma matéria com tópicos encontrada');
            await deletarPreparatorio(preparatorioId);
            sendEvent('error', { error: 'Nenhuma matéria com tópicos foi encontrada', etapas });
            res.end();
            return;
        }

        // Gerar rodadas sem persistir
        const config: ConfiguracaoGeracao = {
            missoes_por_rodada: 5,
            max_topicos_por_missao: 3,
            incluir_revisoes: true,
            incluir_simulado: true,
            gerar_filtros_questoes: true,
        };

        const resultadoRodadas = gerarRodadas(materias, config);

        if (!resultadoRodadas.success) {
            updateEtapa(4, 'error', resultadoRodadas.error);
            await deletarPreparatorio(preparatorioId);
            sendEvent('error', { error: resultadoRodadas.error || 'Erro ao gerar rodadas', etapas });
            res.end();
            return;
        }

        updateEtapa(4, 'completed', `${resultadoRodadas.estatisticas.total_rodadas} rodadas, ${resultadoRodadas.estatisticas.total_missoes} missões`);
        console.log(`[FromPDF-Preview] Prévia gerada: ${resultadoRodadas.estatisticas.total_rodadas} rodadas`);

        const tempoTotal = Date.now() - startTime;
        console.log(`[FromPDF-Preview] Análise concluída em ${(tempoTotal / 1000).toFixed(1)}s - Aguardando confirmação`);

        // Enviar preview para o usuário validar/reordenar
        sendEvent('preview', {
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
            etapas,
        });

        res.end();

    } catch (error: any) {
        console.error('[FromPDF-Preview] Erro:', error);

        if (preparatorioId) {
            console.log(`[FromPDF-Preview] Rollback: deletando preparatório ${preparatorioId}`);
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

/**
 * POST /api/preparatorio/confirm-rodadas
 *
 * Confirma as rodadas após validação/reordenação do usuário
 *
 * Body: {
 *   preparatorioId: string,
 *   materiasOrdenadas: Array<{ id: string, prioridade: number }>,
 *   banca?: string
 * }
 */
app.post('/api/preparatorio/confirm-rodadas', express.json(), async (req, res) => {
    const { preparatorioId, materiasOrdenadas, banca } = req.body;

    if (!preparatorioId || !materiasOrdenadas) {
        return res.status(400).json({
            success: false,
            error: 'preparatorioId e materiasOrdenadas são obrigatórios',
        });
    }

    console.log(`[ConfirmRodadas] Iniciando para preparatório: ${preparatorioId}`);

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

        // Gerar rodadas com a nova ordem
        const config: ConfiguracaoGeracao = {
            missoes_por_rodada: 5,
            max_topicos_por_missao: 3,
            incluir_revisoes: true,
            incluir_simulado: true,
            gerar_filtros_questoes: true,
        };

        const resultadoRodadas = gerarRodadas(materias, config);

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

        // Salvar raio-x
        const raioX = {
            analise_automatica: true,
            data_analise: new Date().toISOString(),
            ordem_materias: materias.map(m => ({ id: m.id, titulo: m.titulo, prioridade: m.prioridade })),
            total_rodadas: resultadoRodadas.estatisticas.total_rodadas,
            total_missoes: resultadoRodadas.estatisticas.total_missoes,
        };
        await atualizarRaioX(preparatorioId, raioX);

        // Criar mensagens de incentivo
        const resultadoMensagens = await criarMensagensIncentivoPadrao(preparatorioId);
        console.log(`[ConfirmRodadas] Mensagens criadas: ${resultadoMensagens.mensagens_criadas}`);

        // Ativar preparatório
        await ativarPreparatorio(preparatorioId);
        console.log(`[ConfirmRodadas] Preparatório ativado`);

        // Trigger geração de conteúdo das primeiras missões em background (silencioso)
        (async () => {
            const missoes = await getPrimeirasMissoes(preparatorioId, 2);
            console.log(`[ConfirmRodadas] Background: Gerando conteúdo para ${missoes.length} missões`);
            for (const missaoId of missoes) {
                await gerarConteudoMissaoBackground(missaoId);
            }
        })().catch(err => {
            console.error('[ConfirmRodadas] Erro na geração de conteúdo em background:', err);
        });

        return res.json({
            success: true,
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

// Start the Express server
app.listen(PORT, () => {
    console.log(`Mastra Agent Server running on http://localhost:${PORT}`);
});

// Start the MCP Server on a separate port for MCP clients using SSE transport
const MCP_PORT = 4111;

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

mcpHttpServer.listen(MCP_PORT, () => {
    console.log(`MCP Server running on http://localhost:${MCP_PORT}/mcp`);
    console.log(`\nConnect with Claude Desktop, Cursor, or any MCP client using:`);
    console.log(`  URL: http://localhost:${MCP_PORT}/mcp`);
});
