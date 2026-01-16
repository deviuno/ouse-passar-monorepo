import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class ImageScraperService {
  private db: SupabaseClient;
  private storageUrl: string;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.db = createClient(supabaseUrl, supabaseKey);
    this.storageUrl = supabaseUrl;
  }

  /**
   * Faz download de uma imagem de URL externa
   */
  async downloadImage(url: string): Promise<Buffer | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        console.error(`[ImageScraperService] Erro ao baixar imagem ${url}: HTTP ${response.status}`);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error(`[ImageScraperService] Exceção ao baixar imagem ${url}:`, error);
      return null;
    }
  }

  /**
   * Faz upload de uma imagem para o Supabase Storage
   */
  async uploadToStorage(
    buffer: Buffer,
    filename: string,
    bucket: string = 'imagem_enunciado'
  ): Promise<string | null> {
    try {
      const { data, error } = await this.db.storage
        .from(bucket)
        .upload(filename, buffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error(`[ImageScraperService] Erro ao fazer upload ${filename}:`, error);
        return null;
      }

      // Retornar URL pública
      const publicUrl = `${this.storageUrl}/storage/v1/object/public/${bucket}/${data.path}`;
      return publicUrl;
    } catch (error) {
      console.error(`[ImageScraperService] Exceção ao fazer upload ${filename}:`, error);
      return null;
    }
  }

  /**
   * Extrai URLs válidas de diversos formatos de armazenamento
   */
  private parseImageUrls(imagens: any): string[] {
    if (!imagens) return [];

    // Se já é um array, processar cada item
    if (Array.isArray(imagens)) {
      return imagens
        .map(url => this.cleanUrl(url))
        .filter(url => url && url.startsWith('http'));
    }

    // Se é string, pode ser vários formatos
    if (typeof imagens === 'string') {
      const str = imagens.trim();

      // Formato JSON array: ["url1", "url2"]
      if (str.startsWith('[')) {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) {
            return parsed
              .map(url => this.cleanUrl(url))
              .filter(url => url && url.startsWith('http'));
          }
        } catch {
          // Se falhar o parse JSON, tenta limpar manualmente
        }
      }

      // Formato PostgreSQL array: {url1,url2}
      if (str.startsWith('{') && str.endsWith('}')) {
        return str
          .slice(1, -1)
          .split(',')
          .map(url => this.cleanUrl(url))
          .filter(url => url && url.startsWith('http'));
      }

      // URL simples
      const cleaned = this.cleanUrl(str);
      if (cleaned && cleaned.startsWith('http')) {
        return [cleaned];
      }
    }

    return [];
  }

  /**
   * Limpa uma URL removendo caracteres extras
   */
  private cleanUrl(url: any): string {
    if (!url || typeof url !== 'string') return '';

    // Remove aspas, colchetes e espaços extras
    return url
      .replace(/^[\s\[\]"']+/, '')
      .replace(/[\s\[\]"']+$/, '')
      .trim();
  }

  /**
   * Processa todas as imagens de uma questão
   */
  async processQuestionImages(question: any): Promise<string[]> {
    const localUrls: string[] = [];

    // Parse das URLs de imagem usando método robusto
    const imageUrls = this.parseImageUrls(question.imagens_enunciado);

    if (imageUrls.length === 0) {
      console.log(`[ImageScraperService] Questão ${question.id} não tem imagens válidas para processar`);
      return [];
    }

    console.log(`[ImageScraperService] Processando ${imageUrls.length} imagens da questão ${question.id}`);

    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const filename = `questao_${question.id}_${i}.jpg`;

      try {
        // Download da imagem
        const buffer = await this.downloadImage(imageUrl);
        if (!buffer) {
          console.error(`[ImageScraperService] Falha ao baixar imagem ${i} da questão ${question.id}`);
          continue;
        }

        // Upload para Storage
        const publicUrl = await this.uploadToStorage(buffer, filename);
        if (!publicUrl) {
          console.error(`[ImageScraperService] Falha ao fazer upload da imagem ${i} da questão ${question.id}`);
          continue;
        }

        localUrls.push(publicUrl);
        console.log(`[ImageScraperService] Imagem ${i} da questão ${question.id} processada com sucesso`);
      } catch (error) {
        console.error(`[ImageScraperService] Erro ao processar imagem ${i} da questão ${question.id}:`, error);
      }
    }

    return localUrls;
  }

  /**
   * Atualiza questão com URLs locais
   */
  async updateQuestionWithLocalUrls(questionId: string, localUrls: string[]): Promise<boolean> {
    const { error } = await this.db
      .from('questoes_concurso')
      .update({
        imagens_enunciado_local: `{${localUrls.join(',')}}`,
      })
      .eq('id', questionId);

    if (error) {
      console.error(`[ImageScraperService] Erro ao atualizar URLs locais da questão ${questionId}:`, error);
      return false;
    }

    return true;
  }

  /**
   * Busca questões com imagens pendentes
   */
  async getQuestionsWithPendingImages(limit: number = 100): Promise<any[]> {
    const { data, error } = await this.db
      .from('questoes_concurso')
      .select('*')
      .not('imagens_enunciado', 'is', null)
      .neq('imagens_enunciado', '{}')
      .is('imagens_enunciado_local', null)
      .limit(limit);

    if (error) {
      console.error('[ImageScraperService] Erro ao buscar questões com imagens pendentes:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Processa um lote de questões
   */
  async processBatch(limit: number = 100): Promise<{
    processed: number;
    success: number;
    failed: number;
  }> {
    const questions = await this.getQuestionsWithPendingImages(limit);

    const result = {
      processed: questions.length,
      success: 0,
      failed: 0,
    };

    for (const question of questions) {
      try {
        const localUrls = await this.processQuestionImages(question);

        if (localUrls.length > 0) {
          const updated = await this.updateQuestionWithLocalUrls(question.id, localUrls);
          if (updated) {
            result.success++;
          } else {
            result.failed++;
          }
        } else {
          result.failed++;
        }
      } catch (error) {
        console.error(`[ImageScraperService] Erro ao processar questão ${question.id}:`, error);
        result.failed++;
      }
    }

    console.log(`[ImageScraperService] Lote processado: ${result.success} sucesso, ${result.failed} falhas de ${result.processed} questões`);

    return result;
  }
}
