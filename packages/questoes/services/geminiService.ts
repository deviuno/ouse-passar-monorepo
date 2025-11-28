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

export const chatWithTutor = async (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string,
  questionContext: ParsedQuestion
): Promise<string> => {
  const client = getClient();
  if (!client) return "Erro: Chave de API não configurada.";

  const systemInstruction = `
    Você é o Tutor IA do app "Ouse Passar". Seu objetivo é ajudar o aluno a entender a questão atual.
    
    Dados da Questão Atual:
    Matéria: ${questionContext.materia}
    Banca: ${questionContext.banca}
    Enunciado: ${questionContext.enunciado}
    Gabarito: ${questionContext.gabarito}
    
    Regras:
    1. Responda dúvidas específicas sobre essa questão.
    2. Seja breve, motivador e use linguagem acessível.
    3. Se o aluno errar, explique o erro sem julgar.
    4. Use emojis ocasionalmente.
  `;

  try {
    // Construct chat history in the format expected by the SDK
    const previousHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    const chat = client.chats.create({
      model: 'gemini-2.5-flash',
      config: { systemInstruction },
      history: previousHistory,
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "Desculpe, não entendi.";
  } catch (error) {
    console.error("Erro no chat:", error);
    return "Tive um problema técnico. Tente novamente.";
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