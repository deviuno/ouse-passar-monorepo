import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface DashboardStats {
  stats: {
    total: number;
    ultimas24h: number;
    ultimas1h: number;
    ultimos5min: number;
    materias: number;
    bancas: number;
    concursos: number;
  };
  velocidade: {
    questoes_por_minuto: number;
    ultima_questao: string | null;
    scraper_ativo: boolean;
    tempo_decorrido_minutos: number;
  };
  atividade_hora: { hora: number; count: number }[];
  ultimas_questoes: any[];
  questoes?: any[];
}

export class StatsScraperService {
  private db: SupabaseClient;
  private cache: {
    data: DashboardStats | null;
    timestamp: number;
  } = {
    data: null,
    timestamp: 0,
  };
  private cacheTTL = 15000; // 15 segundos

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.db = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Obtém estatísticas do dashboard com cache
   */
  async getDashboardStats(includeAllQuestions: boolean = false): Promise<DashboardStats> {
    const now = Date.now();

    // Verificar cache
    if (this.cache.data && now - this.cache.timestamp < this.cacheTTL) {
      return this.cache.data;
    }

    // Buscar dados frescos
    const stats = await this.fetchDashboardStats(includeAllQuestions);

    // Atualizar cache
    this.cache = {
      data: stats,
      timestamp: now,
    };

    return stats;
  }

  /**
   * Busca estatísticas do dashboard do banco
   */
  private async fetchDashboardStats(includeAllQuestions: boolean): Promise<DashboardStats> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last1h = new Date(now.getTime() - 60 * 60 * 1000);
    const last5min = new Date(now.getTime() - 5 * 60 * 1000);

    // Buscar contagens em paralelo
    const [
      totalResult,
      last24hResult,
      last1hResult,
      last5minResult,
      materiasResult,
      bancasResult,
      concursosResult,
      ultimasResult,
      atividadeResult,
    ] = await Promise.all([
      // Total
      this.db.from('questoes_concurso').select('id', { count: 'exact', head: true }),

      // Últimas 24h
      this.db
        .from('questoes_concurso')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', last24h.toISOString()),

      // Última 1h
      this.db
        .from('questoes_concurso')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', last1h.toISOString()),

      // Últimos 5min
      this.db
        .from('questoes_concurso')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', last5min.toISOString()),

      // Matérias distintas
      this.db
        .from('questoes_concurso')
        .select('materia')
        .not('materia', 'is', null),

      // Bancas distintas
      this.db
        .from('questoes_concurso')
        .select('banca')
        .not('banca', 'is', null),

      // Concursos distintos
      this.db
        .from('questoes_concurso')
        .select('concurso')
        .not('concurso', 'is', null),

      // Últimas 20 questões
      this.db
        .from('questoes_concurso')
        .select('id, materia, banca, concurso, enunciado, created_at')
        .order('created_at', { ascending: false })
        .limit(20),

      // Atividade por hora (últimas 24h)
      this.db
        .from('questoes_concurso')
        .select('created_at')
        .gte('created_at', last24h.toISOString()),
    ]);

    // Calcular matérias únicas
    const materiasUnicas = new Set(materiasResult.data?.map(r => r.materia) || []);
    const bancasUnicas = new Set(bancasResult.data?.map(r => r.banca) || []);
    const concursosUnicos = new Set(concursosResult.data?.map(r => r.concurso) || []);

    // Calcular velocidade baseado nas últimas 20 questões
    const ultimas20 = ultimasResult.data || [];
    let velocidade = {
      questoes_por_minuto: 0,
      ultima_questao: null as string | null,
      scraper_ativo: false,
      tempo_decorrido_minutos: 0,
    };

    if (ultimas20.length > 1) {
      const primeiraData = new Date(ultimas20[ultimas20.length - 1].created_at);
      const ultimaData = new Date(ultimas20[0].created_at);
      const diffMinutos = (ultimaData.getTime() - primeiraData.getTime()) / 60000;

      if (diffMinutos > 0) {
        velocidade.questoes_por_minuto = Math.round((ultimas20.length / diffMinutos) * 100) / 100;
        velocidade.tempo_decorrido_minutos = Math.round(diffMinutos * 100) / 100;
      }

      velocidade.ultima_questao = ultimas20[0].created_at;
      velocidade.scraper_ativo = new Date(ultimas20[0].created_at).getTime() > last5min.getTime();
    }

    // Calcular atividade por hora
    const atividadePorHora = new Map<number, number>();
    for (const q of atividadeResult.data || []) {
      const hora = new Date(q.created_at).getHours();
      atividadePorHora.set(hora, (atividadePorHora.get(hora) || 0) + 1);
    }

    const atividade_hora = Array.from(atividadePorHora.entries())
      .map(([hora, count]) => ({ hora, count }))
      .sort((a, b) => a.hora - b.hora);

    // Formatar últimas questões
    const ultimas_questoes = ultimas20.slice(0, 10).map(q => ({
      id: q.id,
      materia: q.materia,
      banca: q.banca,
      concurso: q.concurso,
      enunciado_preview: q.enunciado?.substring(0, 100) || '',
      enunciado: q.enunciado,
      created_at: q.created_at,
      segundos_atras: Math.floor((now.getTime() - new Date(q.created_at).getTime()) / 1000),
    }));

    const result: DashboardStats = {
      stats: {
        total: totalResult.count || 0,
        ultimas24h: last24hResult.count || 0,
        ultimas1h: last1hResult.count || 0,
        ultimos5min: last5minResult.count || 0,
        materias: materiasUnicas.size,
        bancas: bancasUnicas.size,
        concursos: concursosUnicos.size,
      },
      velocidade,
      atividade_hora,
      ultimas_questoes,
    };

    // Opcionalmente incluir todas as questões (para export)
    if (includeAllQuestions) {
      const { data: todasQuestoes } = await this.db
        .from('questoes_concurso')
        .select('id, materia, assunto, concurso, enunciado, gabarito, banca, ano, created_at')
        .order('created_at', { ascending: false });

      result.questoes = todasQuestoes || [];
    }

    return result;
  }

  /**
   * Limpa o cache manualmente
   */
  clearCache(): void {
    this.cache = {
      data: null,
      timestamp: 0,
    };
  }
}
