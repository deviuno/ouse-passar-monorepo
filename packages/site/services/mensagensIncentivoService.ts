import { supabase } from '../lib/supabase';

// Mensagens template baseadas no PRF (serão adaptadas para cada cargo)
const MENSAGENS_TEMPLATE = [
  {
    template: "Sua dedicação vai te levar longe! Siga firme no planejamento.",
    contextual: "Sua dedicação vai te levar longe! {simbologia} está cada vez mais perto."
  },
  {
    template: "Cada missão concluída é um passo mais perto da sua aprovação!",
    contextual: "Cada missão concluída é um passo mais perto de {conquistar}!"
  },
  {
    template: "Disciplina e constância são as chaves do sucesso. Você consegue!",
    contextual: "Disciplina e constância são as chaves do sucesso. {vocativo}, você consegue!"
  },
  {
    template: "O esforço de hoje é a vitória de amanhã. Continue firme!",
    contextual: "O esforço de hoje é a vitória de amanhã. {motivacao}"
  },
  {
    template: "Acredite no seu potencial. {simbolo} espera por você!",
    contextual: "Acredite no seu potencial. {simbolo} espera por você!"
  },
  {
    template: "Não desista! Os melhores resultados vêm para quem persiste.",
    contextual: "Não desista! {cargo_destino} é para quem persiste."
  },
  {
    template: "Sua determinação é sua maior arma. Use-a todos os dias!",
    contextual: "{vocativo}, sua determinação é sua maior arma!"
  },
  {
    template: "Lembre-se: a dor do treinamento é temporária, a glória da aprovação é permanente!",
    contextual: "A dor do estudo é temporária, {gloria} é permanente!"
  },
  {
    template: "Você está no caminho certo. Confie no processo!",
    contextual: "{vocativo}, você está no caminho certo. Confie no processo!"
  },
  {
    template: "Cada hora de estudo te aproxima do seu objetivo. Siga em frente!",
    contextual: "Cada hora de estudo te aproxima de {objetivo}. Siga em frente!"
  }
];

// Mapeamento de cargos para contextos personalizados
interface CargoContext {
  vocativo: string;
  simbolo: string;
  simbologia: string;
  conquistar: string;
  motivacao: string;
  cargo_destino: string;
  gloria: string;
  objetivo: string;
}

// Função para determinar contexto baseado no cargo
function getCargoContext(cargo: string, orgao?: string): CargoContext {
  const cargoLower = cargo.toLowerCase();
  const orgaoLower = (orgao || '').toLowerCase();

  // Juízes
  if (cargoLower.includes('juiz') || cargoLower.includes('magistr')) {
    return {
      vocativo: 'Nobre doutor(a)',
      simbolo: 'A toga',
      simbologia: 'A magistratura',
      conquistar: 'vestir a toga',
      motivacao: 'A justiça precisa de você!',
      cargo_destino: 'A magistratura',
      gloria: 'a honra de julgar',
      objetivo: 'seu lugar no tribunal'
    };
  }

  // Promotores/Procuradores
  if (cargoLower.includes('promotor') || cargoLower.includes('procurador')) {
    return {
      vocativo: 'Futuro(a) membro do MP',
      simbolo: 'A tribuna do Ministério Público',
      simbologia: 'O Parquet',
      conquistar: 'defender a sociedade',
      motivacao: 'A justiça precisa da sua voz!',
      cargo_destino: 'O Ministério Público',
      gloria: 'a missão de acusar',
      objetivo: 'seu lugar no MP'
    };
  }

  // Delegados
  if (cargoLower.includes('delegado')) {
    return {
      vocativo: 'Futuro(a) delegado(a)',
      simbolo: 'A carteira de delegado',
      simbologia: 'A autoridade policial',
      conquistar: 'comandar investigações',
      motivacao: 'A segurança pública precisa de você!',
      cargo_destino: 'A delegacia',
      gloria: 'a autoridade de investigar',
      objetivo: 'sua carteira de delegado'
    };
  }

  // Polícia Federal
  if (cargoLower.includes('agente') && (cargoLower.includes('federal') || orgaoLower.includes('federal') || orgaoLower.includes('pf'))) {
    return {
      vocativo: 'Futuro(a) agente federal',
      simbolo: 'O distintivo da PF',
      simbologia: 'A Polícia Federal',
      conquistar: 'vestir o colete da PF',
      motivacao: 'O Brasil precisa de você!',
      cargo_destino: 'A Polícia Federal',
      gloria: 'servir ao país',
      objetivo: 'seu distintivo federal'
    };
  }

  // PRF
  if (cargoLower.includes('prf') || cargoLower.includes('rodoviári') || (cargoLower.includes('policial') && orgaoLower.includes('rodoviári'))) {
    return {
      vocativo: 'Futuro(a) PRF',
      simbolo: 'A farda da PRF',
      simbologia: 'A Polícia Rodoviária Federal',
      conquistar: 'patrulhar as estradas',
      motivacao: 'As estradas esperam por você!',
      cargo_destino: 'A PRF',
      gloria: 'proteger as rodovias',
      objetivo: 'sua farda azul'
    };
  }

  // Auditor Fiscal
  if (cargoLower.includes('auditor') || cargoLower.includes('fiscal')) {
    return {
      vocativo: 'Futuro(a) auditor(a)',
      simbolo: 'O cargo de auditor',
      simbologia: 'A carreira fiscal',
      conquistar: 'garantir a justiça tributária',
      motivacao: 'O fisco precisa de você!',
      cargo_destino: 'A Receita Federal',
      gloria: 'a autoridade fiscal',
      objetivo: 'sua nomeação'
    };
  }

  // Analista
  if (cargoLower.includes('analista')) {
    return {
      vocativo: 'Futuro(a) analista',
      simbolo: 'O cargo',
      simbologia: 'A carreira pública',
      conquistar: 'sua aprovação',
      motivacao: 'Continue firme!',
      cargo_destino: 'O serviço público',
      gloria: 'a estabilidade',
      objetivo: 'sua nomeação'
    };
  }

  // Técnico
  if (cargoLower.includes('técnico') || cargoLower.includes('tecnico')) {
    return {
      vocativo: 'Futuro(a) servidor(a)',
      simbolo: 'O cargo público',
      simbologia: 'A carreira pública',
      conquistar: 'sua aprovação',
      motivacao: 'Você está quase lá!',
      cargo_destino: 'O serviço público',
      gloria: 'a estabilidade',
      objetivo: 'sua posse'
    };
  }

  // Defensor Público
  if (cargoLower.includes('defensor')) {
    return {
      vocativo: 'Futuro(a) defensor(a)',
      simbolo: 'A Defensoria Pública',
      simbologia: 'A defesa dos mais necessitados',
      conquistar: 'defender quem precisa',
      motivacao: 'Os mais vulneráveis precisam de você!',
      cargo_destino: 'A Defensoria',
      gloria: 'a missão de defender',
      objetivo: 'seu lugar na Defensoria'
    };
  }

  // Oficial de Justiça
  if (cargoLower.includes('oficial') && cargoLower.includes('justiça')) {
    return {
      vocativo: 'Futuro(a) oficial',
      simbolo: 'O mandado judicial',
      simbologia: 'A Justiça',
      conquistar: 'cumprir mandados',
      motivacao: 'A Justiça precisa de você!',
      cargo_destino: 'O Poder Judiciário',
      gloria: 'servir à Justiça',
      objetivo: 'sua nomeação'
    };
  }

  // Escrivão
  if (cargoLower.includes('escrivão') || cargoLower.includes('escrivao')) {
    return {
      vocativo: 'Futuro(a) escrivão(ã)',
      simbolo: 'A carteira funcional',
      simbologia: 'A carreira policial',
      conquistar: 'documentar investigações',
      motivacao: 'A Polícia precisa de você!',
      cargo_destino: 'A Polícia',
      gloria: 'servir à segurança',
      objetivo: 'sua nomeação'
    };
  }

  // Perito
  if (cargoLower.includes('perito')) {
    return {
      vocativo: 'Futuro(a) perito(a)',
      simbolo: 'O jaleco de perito',
      simbologia: 'A perícia criminal',
      conquistar: 'desvendar crimes',
      motivacao: 'A ciência forense precisa de você!',
      cargo_destino: 'A perícia',
      gloria: 'a arte de investigar',
      objetivo: 'seu lugar na perícia'
    };
  }

  // Militar (PM, Bombeiro)
  if (cargoLower.includes('soldado') || cargoLower.includes('militar') || cargoLower.includes('bombeiro') || cargoLower.includes('pm')) {
    const isBombeiro = cargoLower.includes('bombeiro');
    return {
      vocativo: isBombeiro ? 'Futuro(a) bombeiro(a)' : 'Futuro(a) militar',
      simbolo: isBombeiro ? 'O capacete de bombeiro' : 'A farda militar',
      simbologia: isBombeiro ? 'O Corpo de Bombeiros' : 'A corporação',
      conquistar: isBombeiro ? 'salvar vidas' : 'proteger a sociedade',
      motivacao: isBombeiro ? 'Vidas dependem de você!' : 'A segurança pública precisa de você!',
      cargo_destino: isBombeiro ? 'Os Bombeiros' : 'A PM',
      gloria: isBombeiro ? 'a honra de salvar' : 'servir e proteger',
      objetivo: isBombeiro ? 'seu lugar no Corpo de Bombeiros' : 'sua farda'
    };
  }

  // Default - cargo genérico
  return {
    vocativo: 'Futuro(a) servidor(a)',
    simbolo: 'O cargo dos seus sonhos',
    simbologia: 'A aprovação',
    conquistar: 'sua aprovação',
    motivacao: 'Continue firme nos estudos!',
    cargo_destino: 'O serviço público',
    gloria: 'a estabilidade',
    objetivo: 'sua aprovação'
  };
}

// Função para gerar mensagens personalizadas
function gerarMensagensPersonalizadas(cargo: string, orgao?: string): string[] {
  const context = getCargoContext(cargo, orgao);

  return MENSAGENS_TEMPLATE.map(msg => {
    let mensagem = msg.contextual;

    // Substituir placeholders
    mensagem = mensagem.replace(/{vocativo}/g, context.vocativo);
    mensagem = mensagem.replace(/{simbolo}/g, context.simbolo);
    mensagem = mensagem.replace(/{simbologia}/g, context.simbologia);
    mensagem = mensagem.replace(/{conquistar}/g, context.conquistar);
    mensagem = mensagem.replace(/{motivacao}/g, context.motivacao);
    mensagem = mensagem.replace(/{cargo_destino}/g, context.cargo_destino);
    mensagem = mensagem.replace(/{gloria}/g, context.gloria);
    mensagem = mensagem.replace(/{objetivo}/g, context.objetivo);

    return mensagem;
  });
}

// Serviço de mensagens de incentivo
export const mensagensIncentivoService = {
  // Criar mensagens de incentivo para um preparatório
  async createForPreparatorio(
    preparatorioId: string,
    cargo?: string,
    orgao?: string
  ): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      // Se não tiver cargo, usa mensagens genéricas
      const mensagens = gerarMensagensPersonalizadas(cargo || 'Servidor Público', orgao);

      // Preparar dados para inserção
      const mensagensData = mensagens.map((mensagem, index) => ({
        preparatorio_id: preparatorioId,
        mensagem,
        ordem: index + 1,
        is_active: true
      }));

      // Inserir no banco
      const { data, error } = await supabase
        .from('mensagens_incentivo')
        .insert(mensagensData)
        .select();

      if (error) throw error;

      return { success: true, count: data?.length || 0 };
    } catch (error: any) {
      console.error('Erro ao criar mensagens de incentivo:', error);
      return { success: false, count: 0, error: error.message };
    }
  },

  // Buscar mensagens de um preparatório
  async getByPreparatorio(preparatorioId: string) {
    const { data, error } = await supabase
      .from('mensagens_incentivo')
      .select('*')
      .eq('preparatorio_id', preparatorioId)
      .order('ordem');

    if (error) throw error;
    return data || [];
  },

  // Atualizar uma mensagem
  async update(id: string, mensagem: string) {
    const { error } = await supabase
      .from('mensagens_incentivo')
      .update({ mensagem })
      .eq('id', id);

    if (error) throw error;
  },

  // Deletar mensagens de um preparatório
  async deleteByPreparatorio(preparatorioId: string) {
    const { error } = await supabase
      .from('mensagens_incentivo')
      .delete()
      .eq('preparatorio_id', preparatorioId);

    if (error) throw error;
  },

  // Regenerar mensagens (deleta e cria novas)
  async regenerate(preparatorioId: string, cargo?: string, orgao?: string) {
    await this.deleteByPreparatorio(preparatorioId);
    return this.createForPreparatorio(preparatorioId, cargo, orgao);
  }
};

export { gerarMensagensPersonalizadas, getCargoContext };
