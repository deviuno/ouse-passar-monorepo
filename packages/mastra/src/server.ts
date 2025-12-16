import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { mastra } from './mastra/index.js';
import { ousePassarMcpServer } from './mastra/mcp/mcpServer.js';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

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
app.use(express.json());

const PORT = 4000;

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

**Gabarito Oficial:** ${question.gabarito}
${question.comentario ? `\n**Comentário Base:** ${question.comentario}` : ''}
${question.isPegadinha ? `\n⚠️ **Esta questão é uma pegadinha!** ${question.explicacaoPegadinha || ''}` : ''}

---

**Perfil do Aluno:** ${user.name || 'Aluno'} (Nível ${user.level || 1}, ${user.xp || 0} XP)
        `.trim();

        console.log(`[Tutor] Processing message from ${user.name} on thread ${currentThreadId}...`);

        // Use the agent's generate method with memory context
        const result = await agent.generate([
            { role: "user", content: questionContext },
            { role: "assistant", content: "Entendido! Estou analisando a questão. Como posso te ajudar?" },
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

// Supabase client for audio cache
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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

// Audio Generation Endpoints using Gemini TTS
const getGeminiClient = () => {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
};

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
