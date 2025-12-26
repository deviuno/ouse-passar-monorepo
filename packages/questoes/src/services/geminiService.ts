import { GoogleGenAI } from "@google/genai";
import { ParsedQuestion, Flashcard, EssayFeedback } from '../types';

// NOTE: In a production app, never expose API keys on the client side like this if possible.
// For Vite, environment variables must be prefixed with VITE_ and accessed via import.meta.env
const getClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("API Key missing. Please set VITE_GEMINI_API_KEY in your .env file.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateExplanation = async (question: ParsedQuestion): Promise<string> => {
  const client = getClient();
  if (!client) return "Erro: Chave de API não configurada.";

  const prompt = `
    Você é um professor expert em concursos públicos brasileiros.
    Explique didaticamente por que a alternativa correta é a (${question.gabarito}) para a seguinte questão:

    Matéria: ${question.materia}
    Enunciado: ${question.enunciado}
    Alternativas: ${question.parsedAlternativas.map(a => `${a.letter}) ${a.text}`).join(' ')}

    Seja direto e foque no raciocínio necessário para acertar. Use markdown para formatar.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar a explicação.";
  } catch (error) {
    console.error("Erro ao gerar explicação:", error);
    return "Erro ao conectar com o Professor IA.";
  }
};

// URL do Tutor IA (Mastra Agent Server)
const TUTOR_API_URL = `${import.meta.env.VITE_MASTRA_URL}/api/tutor` ||  'http://localhost:4000/api/tutor';

export interface TutorUserContext {
  id?: string;
  name?: string;
  level?: number;
  xp?: number;
  courseName?: string;
  streak?: number;
}

export interface TutorResponse {
  text: string;
  threadId: string;
}

export const chatWithTutor = async (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string,
  questionContext: ParsedQuestion,
  userContext?: TutorUserContext,
  threadId?: string
): Promise<TutorResponse> => {
  try {
    const response = await fetch(TUTOR_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: {
          id: questionContext.id,
          materia: questionContext.materia,
          assunto: questionContext.assunto,
          banca: questionContext.banca,
          orgao: questionContext.orgao,
          ano: questionContext.ano,
          enunciado: questionContext.enunciado,
          alternativas: questionContext.parsedAlternativas,
          gabarito: questionContext.gabarito,
          comentario: questionContext.comentario,
          isPegadinha: questionContext.isPegadinha,
          explicacaoPegadinha: questionContext.explicacaoPegadinha,
        },
        user: userContext || {},
        userMessage: newMessage,
        history: history,
        threadId: threadId,
      }),
    });

    const data = await response.json();

    if (data.success) {
      return {
        text: data.response,
        threadId: data.threadId,
      };
    } else {
      console.error('Erro do Tutor:', data.error);
      return {
        text: data.response || 'Tive um problema técnico. Tente novamente.',
        threadId: threadId || '',
      };
    }
  } catch (error) {
    console.error('Erro ao conectar com o Tutor:', error);
    return {
      text: 'Erro ao conectar com o Professor IA. Verifique sua conexão.',
      threadId: threadId || '',
    };
  }
};

export const generateFlashcards = async (questions: ParsedQuestion[]): Promise<Flashcard[]> => {
  const client = getClient();
  if (!client) return [];

  // Process only up to 3 questions at a time to avoid token limits/latency in this demo
  const targetQuestions = questions.slice(0, 3);

  const prompt = `
        Transforme as seguintes questões de concurso em Flashcards (Pergunta e Resposta Curta) para revisão.
        Retorne APENAS um JSON array válido no formato:
        [
            { "id": 123, "front": "Conceito chave da pergunta", "back": "Explicação direta da resposta correta" }
        ]

        Questões:
        ${targetQuestions.map(q => `
            ID: ${q.id}
            Enunciado: ${q.enunciado}
            Gabarito: ${q.gabarito}
            Alternativa Correta: ${q.parsedAlternativas.find(a => a.letter === q.gabarito)?.text}
        `).join('\n---')}
    `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const text = response.text || "[]";
    // Simple cleanup if MD code blocks are present (though responseMimeType handles most)
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const rawCards = JSON.parse(jsonStr);

    return rawCards.map((c: any) => {
      const originalQ = questions.find(q => q.id === c.id);
      return {
        id: `fc_${c.id}_${Date.now()}`,
        questionId: c.id,
        front: c.front,
        back: c.back,
        masteryLevel: 'new',
        materia: originalQ?.materia || 'Geral',
        assunto: originalQ?.assunto || 'Revisão'
      };
    });

  } catch (error) {
    console.error("Erro ao gerar flashcards:", error);
    return [];
  }
};

// Audio generation types and functions
export interface GeneratedAudio {
  audioUrl: string;
  type: 'explanation' | 'podcast';
  duration?: number;
}

const AUDIO_API_URL = `${import.meta.env.VITE_MASTRA_URL}/api/audio` ||  'http://localhost:4000/api/audio';

export const generateAudioExplanation = async (
  title: string,
  content: string
): Promise<GeneratedAudio | null> => {
  try {
    const response = await fetch(`${AUDIO_API_URL}/explanation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
      }),
    });

    const data = await response.json();

    if (data.success && data.audioData) {
      // Convert base64 PCM to playable audio URL
      const audioBlob = base64ToAudioBlob(data.audioData);
      const audioUrl = URL.createObjectURL(audioBlob);
      return {
        audioUrl,
        type: 'explanation',
      };
    }
    return null;
  } catch (error) {
    console.error('Error generating audio explanation:', error);
    return null;
  }
};

export const generatePodcast = async (
  title: string,
  content: string
): Promise<GeneratedAudio | null> => {
  try {
    const response = await fetch(`${AUDIO_API_URL}/podcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
      }),
    });

    const data = await response.json();

    if (data.success && data.audioData) {
      // Convert base64 PCM to playable audio URL
      const audioBlob = base64ToAudioBlob(data.audioData);
      const audioUrl = URL.createObjectURL(audioBlob);
      return {
        audioUrl,
        type: 'podcast',
      };
    }
    return null;
  } catch (error) {
    console.error('Error generating podcast:', error);
    return null;
  }
};

// Helper function to convert base64 PCM data to a playable audio blob
function base64ToAudioBlob(base64Data: string): Blob {
  // Decode base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // PCM specs from Gemini TTS: 24kHz, mono, 16-bit signed
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;

  // Create WAV header
  const wavHeader = createWavHeader(bytes.length, sampleRate, numChannels, bitsPerSample);

  // Combine header and PCM data
  const wavData = new Uint8Array(wavHeader.length + bytes.length);
  wavData.set(wavHeader, 0);
  wavData.set(bytes, wavHeader.length);

  return new Blob([wavData], { type: 'audio/wav' });
}

function createWavHeader(dataLength: number, sampleRate: number, numChannels: number, bitsPerSample: number): Uint8Array {
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export const analyzeEssay = async (topic: string, text: string): Promise<EssayFeedback | null> => {
  const client = getClient();
  if (!client) return null;

  const prompt = `
        Você é um corretor oficial da banca CEBRASPE. Avalie a seguinte redação de concurso.

        Tema: "${topic}"
        Texto do Aluno: "${text}"

        Retorne APENAS um JSON com o seguinte formato, sem markdown:
        {
            "score": (nota de 0 a 100),
            "maxScore": 100,
            "generalComment": "Comentário geral curto sobre a redação",
            "competencies": {
                "grammar": { "score": (0-30), "feedback": "Erros encontrados ou elogios" },
                "structure": { "score": (0-30), "feedback": "Coesão, parágrafos, conectivos" },
                "content": { "score": (0-40), "feedback": "Argumentação e fuga ao tema" }
            },
            "improvedParagraph": "Escolha o pior parágrafo e reescreva-o de forma culta e correta."
        }
    `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const jsonStr = (response.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("Erro ao corrigir redação:", error);
    return null;
  }
};
