import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createVertex } from "@ai-sdk/google-vertex";

// Carrega variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Log para debug
console.log("[ModelProvider] GOOGLE_VERTEX_PROJECT:", process.env.GOOGLE_VERTEX_PROJECT);
console.log("[ModelProvider] GOOGLE_VERTEX_LOCATION:", process.env.GOOGLE_VERTEX_LOCATION);
console.log("[ModelProvider] GOOGLE_CLIENT_EMAIL:", process.env.GOOGLE_CLIENT_EMAIL);
console.log("[ModelProvider] GOOGLE_PRIVATE_KEY exists:", !!process.env.GOOGLE_PRIVATE_KEY);

// Configuração do Vertex AI com credenciais do Service Account
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

// Wrapper para compatibilidade com Mastra (V3 -> any para aceitar V1/V2)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const vertex = (modelId: string): any => vertexProvider(modelId);

// Modelos disponíveis no Vertex AI (versões estáveis GA)
// Documentação: https://cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions

// Mapeamento de modelos
export const models = {
  // Flash (rápido e econômico) - GA
  flash: vertex("gemini-2.5-flash"),

  // Pro (mais capaz) - GA
  pro: vertex("gemini-2.5-pro"),

  // Aliases para compatibilidade
  "gemini-2.5-flash": vertex("gemini-2.5-flash"),
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
