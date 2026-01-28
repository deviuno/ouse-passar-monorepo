import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createVertex } from "@ai-sdk/google-vertex";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Carrega variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Log para debug
console.log("[ModelProvider] GOOGLE_VERTEX_PROJECT:", process.env.GOOGLE_VERTEX_PROJECT);
console.log("[ModelProvider] GOOGLE_VERTEX_LOCATION:", process.env.GOOGLE_VERTEX_LOCATION);
console.log("[ModelProvider] GOOGLE_CLIENT_EMAIL:", process.env.GOOGLE_CLIENT_EMAIL);
console.log("[ModelProvider] GOOGLE_PRIVATE_KEY exists:", !!process.env.GOOGLE_PRIVATE_KEY);
console.log("[ModelProvider] GOOGLE_GENERATIVE_AI_API_KEY exists:", !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);

// Configuração do Vertex AI com credenciais do Service Account (AI SDK v4)
const vertexProvider = createVertex({
  project: process.env.GOOGLE_VERTEX_PROJECT!,
  location: process.env.GOOGLE_VERTEX_LOCATION || "us-central1",
  googleAuthOptions: {
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL!,
      private_key: process.env.GOOGLE_PRIVATE_KEY!,
    },
  },
});

// Configuração do Google Generative AI (AI SDK v5 - compatível com stream())
const googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

// Wrapper para Vertex AI (AI SDK v4 - usar apenas para métodos não-streaming)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const vertex = (modelId: string): any => vertexProvider(modelId);

// Wrapper para Google AI (AI SDK v5 - compatível com stream() e generate())
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const google = (modelId: string): any => googleProvider(modelId);

// Modelos disponíveis no Vertex AI (versões estáveis GA)
// Documentação: https://cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions

// Mapeamento de modelos
export const models = {
  // Flash Lite (mais rápido e mais barato) - Padrão para a maioria dos agentes
  flash: vertex("gemini-2.5-flash-lite"),
  "flash-lite": vertex("gemini-2.5-flash-lite"),
  "gemini-2.5-flash-lite": vertex("gemini-2.5-flash-lite"),

  // Flash (rápido e econômico) - Para tarefas que precisam de mais capacidade
  "flash-full": vertex("gemini-2.5-flash"),
  "gemini-2.5-flash": vertex("gemini-2.5-flash"),

  // Pro (mais capaz) - Para tarefas complexas
  pro: vertex("gemini-2.5-pro"),
  "gemini-2.5-pro": vertex("gemini-2.5-pro"),
} as const;

// Função helper para obter modelo por nome
export function getModel(modelName: string) {
  if (modelName in models) {
    return models[modelName as keyof typeof models];
  }
  // Fallback para criar modelo dinamicamente
  return vertex(modelName);
}

// Exporta modelos padrão
export const flashModel = models.flash;
export const proModel = models.pro;
