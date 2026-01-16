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

// Modelos disponíveis
// Nota: No Vertex AI, os nomes dos modelos são diferentes do Google AI Studio
// gemini-3-flash-preview -> gemini-2.0-flash (ou gemini-1.5-flash)
// gemini-3-pro-preview -> gemini-2.0-pro (ou gemini-1.5-pro)

// Mapeamento de modelos
export const models = {
  // Flash (rápido e econômico)
  flash: vertex("gemini-3-flash-preview"),

  // Pro (mais capaz)
  pro: vertex("gemini-2.0-pro-exp-02-05"),

  // Aliases para compatibilidade
  "gemini-3-flash-preview": vertex("gemini-3-flash-preview"),
  "gemini-3-pro-preview": vertex("gemini-2.0-pro-exp-02-05"),
  "gemini-2.0-flash": vertex("gemini-3-flash-preview"),
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
