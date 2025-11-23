import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  // Always use process.env.API_KEY as per guidelines.
  // We assume this variable is pre-configured and valid in the execution context.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const sendMessageToMentor = async (
  history: { role: string; text: string }[],
  message: string
): Promise<string> => {
  const client = getClient();

  const systemInstruction = `
    Você é o Consultor de Atendimento Oficial do 'Ouse Passar'.
    Seu objetivo é atuar como suporte comercial e tirar dúvidas sobre a plataforma para potenciais alunos.

    Sua Postura:
    - Profissional, prestativo e educado.
    - Comunicativo e persuasivo para incentivar a matrícula.
    - Você representa a empresa, então transmita segurança e autoridade.

    O que você deve saber e responder:
    1. Sobre os Cursos: Explique que temos preparatórios focados para PF, PRF, Polícias Civis e Tribunais.
    2. Sobre a Metodologia: Ressalte o método 80/20 (foco no que mais cai) e o Estudo Reverso (questões antes da teoria) como diferenciais para passar mais rápido.
    3. Dúvidas de Compra: Se perguntarem preço, planos ou como comprar, instrua o usuário a clicar no botão amarelo "QUERO SER APROVADO" ou "ÁREA DO ALUNO" no topo do site para ver as ofertas vigentes. Diga que é o melhor investimento para o futuro deles.
    4. Suporte Técnico: Se for um problema de acesso (login/senha), peça para enviarem e-mail para suporte@ousepassar.com.br.

    Restrições:
    - Não invente valores de cursos (os preços variam por lotes).
    - Não atue mais como "coach de estudos" que monta cronograma detalhado no chat. Seu foco é vender a plataforma que entrega isso pronto.
    - Responda sempre em Português do Brasil.
  `;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        ...history.map(h => ({
          role: h.role,
          parts: [{ text: h.text }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, // Um pouco mais baixo para ser mais consistente/formal
      }
    });

    return response.text || "Desculpe, não entendi. Poderia reformular sua dúvida sobre nossos cursos?";
  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    return "No momento nossos sistemas de atendimento estão congestionados. Por favor, tente novamente em alguns instantes.";
  }
};
