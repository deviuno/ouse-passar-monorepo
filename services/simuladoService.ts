import { supabase } from '../lib/supabase';
import type { Json } from '../lib/database.types';

// ============================================================================
// TYPES
// ============================================================================

export type CourseType = 'simulado' | 'preparatorio';
export type EditalStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface QuestionFilters {
  materias?: string[];
  bancas?: string[];
  anos?: number[];
  orgaos?: string[];
  assuntos?: string[];
  excludeIds?: number[];
  limit?: number;
}

export interface AIAnalysis {
  concurso: {
    nome: string;
    orgao: string;
    banca: string;
    ano: number;
    cargos: string[];
  };
  materias: MateriaIdentificada[];
  filtros_sugeridos: QuestionFilters;
  resumo: string;
}

export interface MateriaIdentificada {
  nome_edital: string;
  nome_banco: string;
  peso: number;
  assuntos: string[];
  questoes_encontradas?: number;
}

export interface Edital {
  id: string;
  course_id: string | null;
  file_url: string;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  status: EditalStatus;
  ai_analysis: AIAnalysis | null;
  suggested_filters: QuestionFilters | null;
  matched_questions_count: number | null;
  concurso_nome: string | null;
  orgao: string | null;
  banca: string | null;
  ano: number | null;
  cargos: string[] | null;
  processing_log: string | null;
  error_message: string | null;
  uploaded_at: string;
  processed_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  n8n_execution_id: string | null;
  webhook_response: any | null;
}

export interface Course {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  price: number | null;
  is_active: boolean;
  course_type: CourseType;
  question_filters: QuestionFilters;
  questions_count: number;
  edital_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  edital?: Edital | null;
}

export interface CreateCourseInput {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  image_url?: string;
  price?: number;
  course_type: CourseType;
  question_filters?: QuestionFilters;
  questions_count?: number;
  is_active?: boolean;
}

export interface UpdateCourseInput extends Partial<CreateCourseInput> {
  is_active?: boolean;
  question_filters?: QuestionFilters;
  questions_count?: number;
  edital_id?: string;
}

// ============================================================================
// COURSES CRUD
// ============================================================================

/**
 * Get all courses with optional filtering
 */
export async function getCourses(options?: {
  type?: CourseType;
  activeOnly?: boolean;
  includeEdital?: boolean;
}): Promise<{ courses: Course[]; error?: string }> {
  try {
    let query = supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.type) {
      query = query.eq('course_type', options.type);
    }

    if (options?.activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    const courses: Course[] = (data || []).map((item) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      icon: item.icon,
      image_url: item.image_url,
      price: item.price,
      is_active: item.is_active,
      course_type: item.course_type,
      question_filters: item.question_filters as QuestionFilters,
      questions_count: item.questions_count,
      edital_id: item.edital_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
      edital: null,
    }));

    return { courses };
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    return { courses: [], error: error.message };
  }
}

/**
 * Get a single course by ID
 */
export async function getCourseById(id: string): Promise<{ course: Course | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return { course: null };
    }

    const course: Course = {
      id: data.id,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      icon: data.icon,
      image_url: data.image_url,
      price: data.price,
      is_active: data.is_active,
      course_type: data.course_type,
      question_filters: data.question_filters as QuestionFilters,
      questions_count: data.questions_count,
      edital_id: data.edital_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      edital: null,
    };

    return { course };
  } catch (error: any) {
    console.error('Error fetching course:', error);
    return { course: null, error: error.message };
  }
}

/**
 * Create a new course
 */
export async function createCourse(input: CreateCourseInput): Promise<{ course: Course | null; error?: string }> {
  try {
    // Use provided questions_count or fallback to filter limit
    const questionsCount = input.questions_count ?? input.question_filters?.limit ?? 0;

    const { data, error } = await supabase
      .from('courses')
      .insert({
        title: input.title,
        subtitle: input.subtitle || null,
        description: input.description || null,
        icon: input.icon || null,
        image_url: input.image_url || null,
        price: input.price || null,
        course_type: input.course_type,
        is_active: input.is_active ?? false,
        question_filters: (input.question_filters || {}) as unknown as Json,
        questions_count: questionsCount,
      })
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return { course: null };
    }

    const course: Course = {
      id: data.id,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      icon: data.icon,
      image_url: data.image_url,
      price: data.price,
      is_active: data.is_active,
      course_type: data.course_type,
      question_filters: data.question_filters as QuestionFilters,
      questions_count: data.questions_count,
      edital_id: data.edital_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      edital: null,
    };

    return { course };
  } catch (error: any) {
    console.error('Error creating course:', error);
    return { course: null, error: error.message };
  }
}

/**
 * Update a course
 */
export async function updateCourse(id: string, input: UpdateCourseInput): Promise<{ course: Course | null; error?: string }> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.subtitle !== undefined) updateData.subtitle = input.subtitle;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.icon !== undefined) updateData.icon = input.icon;
    if (input.image_url !== undefined) updateData.image_url = input.image_url;
    if (input.price !== undefined) updateData.price = input.price;
    if (input.course_type !== undefined) updateData.course_type = input.course_type;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;
    if (input.question_filters !== undefined) updateData.question_filters = input.question_filters;
    if (input.questions_count !== undefined) updateData.questions_count = input.questions_count;
    if (input.edital_id !== undefined) updateData.edital_id = input.edital_id;

    const { data, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return { course: null };
    }

    const course: Course = {
      id: data.id,
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      icon: data.icon,
      image_url: data.image_url,
      price: data.price,
      is_active: data.is_active,
      course_type: data.course_type,
      question_filters: data.question_filters as QuestionFilters,
      questions_count: data.questions_count,
      edital_id: data.edital_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      edital: null,
    };

    return { course };
  } catch (error: any) {
    console.error('Error updating course:', error);
    return { course: null, error: error.message };
  }
}

/**
 * Delete a course
 */
export async function deleteCourse(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting course:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// EDITAIS CRUD
// ============================================================================

/**
 * Helper function to convert database edital row to Edital type
 */
function mapEditalRow(row: any): Edital {
  return {
    id: row.id,
    course_id: row.course_id,
    file_url: row.file_url,
    file_name: row.file_name,
    file_size: row.file_size,
    file_type: row.file_type,
    status: row.status,
    ai_analysis: row.ai_analysis as AIAnalysis | null,
    suggested_filters: row.suggested_filters as QuestionFilters | null,
    matched_questions_count: row.matched_questions_count,
    concurso_nome: row.concurso_nome,
    orgao: row.orgao,
    banca: row.banca,
    ano: row.ano,
    cargos: row.cargos,
    processing_log: row.processing_log,
    error_message: row.error_message,
    uploaded_at: row.uploaded_at,
    processed_at: row.processed_at,
    approved_at: row.approved_at,
    approved_by: row.approved_by,
    n8n_execution_id: row.n8n_execution_id,
    webhook_response: row.webhook_response,
  };
}

/**
 * Upload edital PDF to storage and create record
 */
export async function uploadEdital(
  courseId: string,
  file: File
): Promise<{ edital: Edital | null; error?: string }> {
  try {
    // Generate unique file name
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${courseId}/${timestamp}_${sanitizedName}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('editais')
      .upload(filePath, file, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('editais')
      .getPublicUrl(filePath);

    // For private buckets, use signed URL
    const { data: signedUrlData } = await supabase.storage
      .from('editais')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

    const fileUrl = signedUrlData?.signedUrl || urlData.publicUrl;

    // Create edital record
    const { data, error } = await supabase
      .from('editais')
      .insert({
        course_id: courseId,
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Update course with edital_id
    await supabase
      .from('courses')
      .update({ edital_id: data.id })
      .eq('id', courseId);

    return { edital: mapEditalRow(data) };
  } catch (error: any) {
    console.error('Error uploading edital:', error);
    return { edital: null, error: error.message };
  }
}

/**
 * Create edital from URL (for external links)
 */
export async function createEditalFromUrl(
  courseId: string,
  url: string,
  fileName?: string
): Promise<{ edital: Edital | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('editais')
      .insert({
        course_id: courseId,
        file_url: url,
        file_name: fileName || 'edital.pdf',
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Update course with edital_id
    await supabase
      .from('courses')
      .update({ edital_id: data.id })
      .eq('id', courseId);

    return { edital: mapEditalRow(data) };
  } catch (error: any) {
    console.error('Error creating edital from URL:', error);
    return { edital: null, error: error.message };
  }
}

/**
 * Get edital by ID
 */
export async function getEditalById(id: string): Promise<{ edital: Edital | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('editais')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return { edital: data ? mapEditalRow(data) : null };
  } catch (error: any) {
    console.error('Error fetching edital:', error);
    return { edital: null, error: error.message };
  }
}

/**
 * Get edital by course ID
 */
export async function getEditalByCourseId(courseId: string): Promise<{ edital: Edital | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('editais')
      .select('*')
      .eq('course_id', courseId)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return { edital: data ? mapEditalRow(data) : null };
  } catch (error: any) {
    console.error('Error fetching edital by course:', error);
    return { edital: null, error: error.message };
  }
}

/**
 * Update edital status (called by n8n webhook)
 */
export async function updateEditalStatus(
  editalId: string,
  status: EditalStatus,
  data?: {
    ai_analysis?: AIAnalysis;
    suggested_filters?: QuestionFilters;
    matched_questions_count?: number;
    concurso_nome?: string;
    orgao?: string;
    banca?: string;
    ano?: number;
    cargos?: string[];
    processing_log?: string;
    error_message?: string;
    n8n_execution_id?: string;
    webhook_response?: any;
  }
): Promise<{ edital: Edital | null; error?: string }> {
  try {
    const updateData: any = {
      status,
    };

    if (status === 'completed') {
      updateData.processed_at = new Date().toISOString();
    }

    if (data) {
      if (data.ai_analysis !== undefined) updateData.ai_analysis = data.ai_analysis;
      if (data.suggested_filters !== undefined) updateData.suggested_filters = data.suggested_filters;
      if (data.matched_questions_count !== undefined) updateData.matched_questions_count = data.matched_questions_count;
      if (data.concurso_nome !== undefined) updateData.concurso_nome = data.concurso_nome;
      if (data.orgao !== undefined) updateData.orgao = data.orgao;
      if (data.banca !== undefined) updateData.banca = data.banca;
      if (data.ano !== undefined) updateData.ano = data.ano;
      if (data.cargos !== undefined) updateData.cargos = data.cargos;
      if (data.processing_log !== undefined) updateData.processing_log = data.processing_log;
      if (data.error_message !== undefined) updateData.error_message = data.error_message;
      if (data.n8n_execution_id !== undefined) updateData.n8n_execution_id = data.n8n_execution_id;
      if (data.webhook_response !== undefined) updateData.webhook_response = data.webhook_response;
    }

    const { data: result, error } = await supabase
      .from('editais')
      .update(updateData)
      .eq('id', editalId)
      .select()
      .single();

    if (error) throw error;

    return { edital: result ? mapEditalRow(result) : null };
  } catch (error: any) {
    console.error('Error updating edital status:', error);
    return { edital: null, error: error.message };
  }
}

// ============================================================================
// N8N WEBHOOK INTEGRATION
// ============================================================================

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

export interface N8NWebhookPayload {
  edital_id: string;
  course_id: string;
  file_url: string;
  file_name: string;
  course_title: string;
  course_type: CourseType;
  callback_url: string;
}

/**
 * Trigger n8n workflow to process edital
 */
export async function triggerEditalProcessing(
  editalId: string
): Promise<{ success: boolean; executionId?: string; error?: string }> {
  try {
    if (!N8N_WEBHOOK_URL) {
      console.warn('N8N_WEBHOOK_URL not configured, skipping webhook');
      return { success: false, error: 'Webhook URL not configured' };
    }

    // Get edital and course data
    const { edital, error: editalError } = await getEditalById(editalId);
    if (editalError || !edital) {
      throw new Error(editalError || 'Edital not found');
    }

    const { course, error: courseError } = await getCourseById(edital.course_id || '');
    if (courseError || !course) {
      throw new Error(courseError || 'Course not found');
    }

    // Update status to processing
    await updateEditalStatus(editalId, 'processing');

    // Build callback URL for n8n to update status
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const callbackUrl = `${supabaseUrl}/rest/v1/editais?id=eq.${editalId}`;

    // Prepare payload
    const payload: N8NWebhookPayload = {
      edital_id: editalId,
      course_id: course.id,
      file_url: edital.file_url,
      file_name: edital.file_name || 'edital.pdf',
      course_title: course.title,
      course_type: course.course_type,
      callback_url: callbackUrl,
    };

    // Send to n8n
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Update edital with execution ID if provided
    if (result.executionId) {
      await updateEditalStatus(editalId, 'processing', {
        n8n_execution_id: result.executionId,
        webhook_response: result,
      });
    }

    return { success: true, executionId: result.executionId };
  } catch (error: any) {
    console.error('Error triggering edital processing:', error);

    // Update status to error
    await updateEditalStatus(editalId, 'error', {
      error_message: error.message,
    });

    return { success: false, error: error.message };
  }
}

// ============================================================================
// FILTER APPROVAL
// ============================================================================

/**
 * Approve filters and activate course
 */
export async function approveFilters(
  courseId: string,
  filters: QuestionFilters,
  questionsCount: number
): Promise<{ course: Course | null; error?: string }> {
  try {
    // Update course with approved filters
    const { course, error: courseError } = await updateCourse(courseId, {
      question_filters: filters,
      questions_count: questionsCount,
      is_active: true,
    });

    if (courseError) throw new Error(courseError);

    // Get edital and mark as approved
    const { edital } = await getEditalByCourseId(courseId);
    if (edital) {
      await supabase
        .from('editais')
        .update({
          approved_at: new Date().toISOString(),
          suggested_filters: filters as unknown as Json,
          matched_questions_count: questionsCount,
        })
        .eq('id', edital.id);
    }

    return { course };
  } catch (error: any) {
    console.error('Error approving filters:', error);
    return { course: null, error: error.message };
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get courses statistics
 */
export async function getCoursesStats(): Promise<{
  total: number;
  active: number;
  simulados: number;
  preparatorios: number;
  pendingEditais: number;
}> {
  try {
    const { data: courses } = await supabase
      .from('courses')
      .select('id, is_active, course_type');

    const { data: editais } = await supabase
      .from('editais')
      .select('id, status')
      .in('status', ['pending', 'processing']);

    const coursesList = courses || [];

    return {
      total: coursesList.length,
      active: coursesList.filter(c => c.is_active).length,
      simulados: coursesList.filter(c => c.course_type === 'simulado').length,
      preparatorios: coursesList.filter(c => c.course_type === 'preparatorio').length,
      pendingEditais: editais?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      total: 0,
      active: 0,
      simulados: 0,
      preparatorios: 0,
      pendingEditais: 0,
    };
  }
}
