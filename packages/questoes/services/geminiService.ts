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

// URL do webhook n8n para o Tutor IA
const N8N_TUTOR_WEBHOOK_URL = import.meta.env.VITE_N8N_TUTOR_WEBHOOK_URL || 'http://72.61.217.225:5678/webhook/tutor-chat';

export interface TutorUserContext {
  name?: string;
  level?: number;
  xp?: number;
  courseName?: string;
  streak?: number;
}

export const chatWithTutor = async (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string,
  questionContext: ParsedQuestion,
  userContext?: TutorUserContext
): Promise<string> => {
  try {
    const response = await fetch(N8N_TUTOR_WEBHOOK_URL, {
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
      }),
    });

    const data = await response.json();

    if (data.success) {
      return data.response;
    } else {
      console.error('Erro do Tutor:', data.error);
      return data.response || 'Tive um problema técnico. Tente novamente.';
    }
  } catch (error) {
    console.error('Erro ao conectar com o Tutor:', error);
    return 'Erro ao conectar com o Professor IA. Verifique sua conexão.';
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