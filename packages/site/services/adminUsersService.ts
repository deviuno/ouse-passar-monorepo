import { supabase } from '../lib/supabase';
import { AdminUser, UserRole, UserGender, Lead, LeadDifficulty, LeadGender, EducationLevel } from '../lib/database.types';

// ==================== ADMIN USERS ====================

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  created_by?: string;
  avatar_url?: string;
  genero?: UserGender;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  name?: string;
  role?: UserRole;
  is_active?: boolean;
  avatar_url?: string | null;
  genero?: UserGender | null;
}

// Função auxiliar para validar UUID
const isValidUUID = (str: string | undefined): boolean => {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const adminUsersService = {
  async getAll(): Promise<AdminUser[]> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<AdminUser | null> {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(input: CreateUserInput): Promise<AdminUser> {
    const insertData: {
      email: string;
      password_hash: string;
      name: string;
      role: UserRole;
      created_by?: string | null;
      avatar_url?: string;
      genero?: UserGender;
    } = {
      email: input.email,
      password_hash: input.password, // Em produção, usar hash
      name: input.name,
      role: input.role
    };

    if (input.genero) insertData.genero = input.genero;

    if (input.created_by && isValidUUID(input.created_by)) {
      insertData.created_by = input.created_by;
    }

    if (input.avatar_url) {
      insertData.avatar_url = input.avatar_url;
    }

    const { data, error } = await supabase
      .from('admin_users')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: UpdateUserInput): Promise<AdminUser> {
    const updateData: {
      email?: string;
      name?: string;
      role?: UserRole;
      password_hash?: string;
      is_active?: boolean;
      avatar_url?: string | null;
      genero?: UserGender | null;
    } = {};

    if (input.email) updateData.email = input.email;
    if (input.name) updateData.name = input.name;
    if (input.role) updateData.role = input.role;
    if (input.password) updateData.password_hash = input.password;
    if (typeof input.is_active === 'boolean') updateData.is_active = input.is_active;
    if (input.avatar_url !== undefined) updateData.avatar_url = input.avatar_url;
    if (input.genero !== undefined) updateData.genero = input.genero;

    const { data, error } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async toggleActive(id: string, is_active: boolean): Promise<void> {
    const { error } = await supabase
      .from('admin_users')
      .update({ is_active })
      .eq('id', id);

    if (error) throw error;
  }
};

// ==================== LEADS ====================

export interface CreateLeadInput {
  nome: string;
  sexo?: LeadGender;
  email?: string;
  telefone?: string;
  concurso_almejado: string;
  nivel_escolaridade?: EducationLevel;
  trabalha?: boolean;
  e_concursado?: boolean;
  possui_curso_concurso?: boolean;
  qual_curso?: string;
  minutos_domingo?: number;
  minutos_segunda?: number;
  minutos_terca?: number;
  minutos_quarta?: number;
  minutos_quinta?: number;
  minutos_sexta?: number;
  minutos_sabado?: number;
  hora_acordar?: string;
  hora_dormir?: string;
  principais_dificuldades?: LeadDifficulty[];
  dificuldade_outros?: string;
  vendedor_id?: string;
}

export interface UpdateLeadInput extends Partial<CreateLeadInput> {
  planejamento_id?: string;
  status?: string;
}

export interface LeadWithVendedor extends Lead {
  vendedor?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export const leadsService = {
  async getAll(): Promise<LeadWithVendedor[]> {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        vendedor:admin_users!leads_vendedor_id_fkey (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByVendedor(vendedorId: string): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('vendedor_id', vendedorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Lead | null> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(input: CreateLeadInput): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .insert({
        nome: input.nome,
        sexo: input.sexo,
        email: input.email,
        telefone: input.telefone,
        concurso_almejado: input.concurso_almejado,
        nivel_escolaridade: input.nivel_escolaridade,
        trabalha: input.trabalha ?? false,
        e_concursado: input.e_concursado ?? false,
        possui_curso_concurso: input.possui_curso_concurso ?? false,
        qual_curso: input.qual_curso,
        minutos_domingo: input.minutos_domingo ?? 0,
        minutos_segunda: input.minutos_segunda ?? 0,
        minutos_terca: input.minutos_terca ?? 0,
        minutos_quarta: input.minutos_quarta ?? 0,
        minutos_quinta: input.minutos_quinta ?? 0,
        minutos_sexta: input.minutos_sexta ?? 0,
        minutos_sabado: input.minutos_sabado ?? 0,
        hora_acordar: input.hora_acordar || '06:00',
        hora_dormir: input.hora_dormir || '22:00',
        principais_dificuldades: input.principais_dificuldades ?? [],
        dificuldade_outros: input.dificuldade_outros,
        vendedor_id: input.vendedor_id,
        status: 'apresentacao'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: UpdateLeadInput): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async linkPlanejamento(leadId: string, planejamentoId: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .update({
        planejamento_id: planejamentoId,
        status: 'planejamento_gerado'
      })
      .eq('id', leadId);

    if (error) throw error;
  },

  async search(query: string, limit: number = 10): Promise<Lead[]> {
    if (!query || query.length < 2) return [];

    const searchTerm = `%${query}%`;

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .or(`nome.ilike.${searchTerm},email.ilike.${searchTerm},telefone.ilike.${searchTerm}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
};
