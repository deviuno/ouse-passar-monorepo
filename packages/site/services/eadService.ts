// EAD Service - Ouse Passar Academy
// Serviço para gerenciamento do sistema EAD

import { supabase } from '../lib/supabase';
import {
  EadCategory,
  EadCourse,
  EadModule,
  EadLesson,
  EadMaterial,
  EadEnrollment,
  EadLessonProgress,
  EadCertificate,
  EadCategoryRow,
  EadCourseRow,
  EadModuleRow,
  EadLessonRow,
  EadMaterialRow,
  EadEnrollmentRow,
  EadLessonProgressRow,
  CourseFilters,
  CourseStatus,
  categoryRowToCategory,
  courseRowToCourse,
  moduleRowToModule,
  lessonRowToLesson,
  materialRowToMaterial,
  enrollmentRowToEnrollment,
  lessonProgressRowToProgress,
  categoryToRow,
  courseToRow,
  moduleToRow,
  lessonToRow,
  materialToRow,
} from '../types/ead';

// ============================================
// CATEGORIAS
// ============================================

export async function getCategories(includeInactive = false): Promise<EadCategory[]> {
  let query = supabase
    .from('ead_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data as any[] || []).map(categoryRowToCategory);
}

export async function getCategoryBySlug(slug: string): Promise<EadCategory | null> {
  const { data, error } = await supabase
    .from('ead_categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? categoryRowToCategory(data as any) : null;
}

export async function getCategoryById(id: string): Promise<EadCategory | null> {
  const { data, error } = await supabase
    .from('ead_categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? categoryRowToCategory(data as any) : null;
}

export async function createCategory(category: Partial<EadCategory>): Promise<EadCategory> {
  const row = categoryToRow(category);
  const { data, error } = await (supabase as any)
    .from('ead_categories')
    .insert(row as any)
    .select()
    .single();

  if (error) throw error;
  return categoryRowToCategory(data as any);
}

export async function updateCategory(id: string, category: Partial<EadCategory>): Promise<EadCategory> {
  const row = categoryToRow(category);
  const { data, error } = await (supabase as any)
    .from('ead_categories')
    .update(row as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return categoryRowToCategory(data as any);
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('ead_categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function reorderCategories(categories: { id: string; sortOrder: number }[]): Promise<void> {
  for (const cat of categories) {
    const { error } = await supabase
      .from('ead_categories')
      .update({ sort_order: cat.sortOrder })
      .eq('id', cat.id);

    if (error) throw error;
  }
}

// ============================================
// CURSOS
// ============================================

export interface GetCoursesOptions {
  filters?: CourseFilters;
  page?: number;
  limit?: number;
  includeCategory?: boolean;
}

export async function getCourses(options: GetCoursesOptions = {}): Promise<{ courses: EadCourse[]; total: number }> {
  const { filters = {}, page = 1, limit = 20, includeCategory = true } = options;

  let query = supabase
    .from('ead_courses')
    .select(includeCategory ? '*, category:ead_categories(*)' : '*', { count: 'exact' });

  // Filtros
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters.difficulty) {
    query = query.eq('difficulty_level', filters.difficulty);
  }
  if (filters.isFree !== undefined) {
    query = query.eq('is_free', filters.isFree);
  }
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Ordenação
  switch (filters.sortBy) {
    case 'popular':
      query = query.order('enrolled_count', { ascending: false });
      break;
    case 'rating':
      query = query.order('average_rating', { ascending: false });
      break;
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'title':
      query = query.order('title', { ascending: true });
      break;
    case 'recent':
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Paginação
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  const courses = (data || []).map((row: any) => {
    const course = courseRowToCourse(row);
    if (row.category) {
      course.category = categoryRowToCategory(row.category);
    }
    return course;
  });

  return { courses, total: count || 0 };
}

export async function getPublishedCourses(options: Omit<GetCoursesOptions, 'filters'> & { filters?: Omit<CourseFilters, 'status'> } = {}): Promise<{ courses: EadCourse[]; total: number }> {
  return getCourses({
    ...options,
    filters: { ...options.filters, status: 'published' as CourseStatus },
  });
}

export async function getCourseBySlug(slug: string, includeModulesAndLessons = false): Promise<EadCourse | null> {
  const { data, error } = await supabase
    .from('ead_courses')
    .select('*, category:ead_categories(*)')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  if (!data) return null;

  const course = courseRowToCourse(data as any);
  if (data.category) {
    course.category = categoryRowToCategory(data.category as any);
  }

  if (includeModulesAndLessons) {
    course.modules = await getModulesByCourse(course.id, true);
  }

  return course;
}

export async function getCourseById(id: string, includeModulesAndLessons = false): Promise<EadCourse | null> {
  const { data, error } = await supabase
    .from('ead_courses')
    .select('*, category:ead_categories(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  if (!data) return null;

  const course = courseRowToCourse(data as any);
  if (data.category) {
    course.category = categoryRowToCategory(data.category as any);
  }

  if (includeModulesAndLessons) {
    course.modules = await getModulesByCourse(course.id, true);
  }

  return course;
}

export async function createCourse(course: Partial<EadCourse>): Promise<EadCourse> {
  const row = courseToRow(course);
  const { data, error } = await (supabase as any)
    .from('ead_courses')
    .insert(row as any)
    .select('*, category:ead_categories(*)')
    .single();

  if (error) throw error;

  const created = courseRowToCourse(data as any);
  if (data.category) {
    created.category = categoryRowToCategory(data.category as any);
  }
  return created;
}

export async function updateCourse(id: string, course: Partial<EadCourse>): Promise<EadCourse> {
  const row = courseToRow(course);

  // Se status mudou para published e não tem publishedAt, adicionar
  if (course.status === 'published') {
    const existing = await getCourseById(id);
    if (existing && !existing.publishedAt) {
      (row as any).published_at = new Date().toISOString();
    }
  }

  // Update without join to avoid RLS issues
  const { data, error } = await supabase
    .from('ead_courses')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  const updated = courseRowToCourse(data as any);

  // Fetch category separately if needed
  if (data.category_id) {
    const { data: categoryData } = await supabase
      .from('ead_categories')
      .select('*')
      .eq('id', data.category_id)
      .single();

    if (categoryData) {
      updated.category = categoryRowToCategory(categoryData as any);
    }
  }

  return updated;
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase
    .from('ead_courses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getFeaturedCourses(limit = 5): Promise<EadCourse[]> {
  const { data, error } = await supabase
    .from('ead_courses')
    .select('*, category:ead_categories(*)')
    .eq('status', 'published')
    .order('enrolled_count', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data as any[] || []).map((row: any) => {
    const course = courseRowToCourse(row);
    if (row.category) {
      course.category = categoryRowToCategory(row.category);
    }
    return course;
  });
}

export async function getFreeCourses(limit = 10): Promise<EadCourse[]> {
  const { data, error } = await supabase
    .from('ead_courses')
    .select('*, category:ead_categories(*)')
    .eq('status', 'published')
    .eq('is_free', true)
    .order('enrolled_count', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data as any[] || []).map((row: any) => {
    const course = courseRowToCourse(row);
    if (row.category) {
      course.category = categoryRowToCategory(row.category);
    }
    return course;
  });
}

// ============================================
// MÓDULOS
// ============================================

export async function getModulesByCourse(courseId: string, includeLessons = false): Promise<EadModule[]> {
  const { data, error } = await supabase
    .from('ead_modules')
    .select('*')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  const modules = (data as any[] || []).map(moduleRowToModule);

  if (includeLessons) {
    for (const mod of modules) {
      mod.lessons = await getLessonsByModule(mod.id);
      mod.totalLessons = mod.lessons.length;
    }
  }

  return modules;
}

export async function getModuleById(id: string): Promise<EadModule | null> {
  const { data, error } = await supabase
    .from('ead_modules')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? moduleRowToModule(data as any) : null;
}

export async function createModule(courseId: string, module: Partial<EadModule>): Promise<EadModule> {
  // Pegar próximo sort_order
  const { data: existing } = await supabase
    .from('ead_modules')
    .select('sort_order')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? (existing[0] as any).sort_order + 1 : 0;

  const row = {
    ...moduleToRow(module),
    course_id: courseId,
    sort_order: module.sortOrder ?? nextOrder,
  };

  const { data, error } = await supabase
    .from('ead_modules')
    .insert(row as any)
    .select()
    .single();

  if (error) throw error;
  return moduleRowToModule(data as any);
}

export async function updateModule(id: string, module: Partial<EadModule>): Promise<EadModule> {
  const row = moduleToRow(module);
  const { data, error } = await supabase
    .from('ead_modules')
    .update(row as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return moduleRowToModule(data as any);
}

export async function deleteModule(id: string): Promise<void> {
  const { error } = await supabase
    .from('ead_modules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function reorderModules(modules: { id: string; sortOrder: number }[]): Promise<void> {
  for (const mod of modules) {
    const { error } = await supabase
      .from('ead_modules')
      .update({ sort_order: mod.sortOrder })
      .eq('id', mod.id);

    if (error) throw error;
  }
}

// ============================================
// AULAS
// ============================================

export async function getLessonsByModule(moduleId: string): Promise<EadLesson[]> {
  const { data, error } = await supabase
    .from('ead_lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data as any[] || []).map(lessonRowToLesson);
}

export async function getLessonById(id: string): Promise<EadLesson | null> {
  const { data, error } = await supabase
    .from('ead_lessons')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? lessonRowToLesson(data as any) : null;
}

export async function getLessonBySlug(moduleId: string, slug: string): Promise<EadLesson | null> {
  const { data, error } = await supabase
    .from('ead_lessons')
    .select('*')
    .eq('module_id', moduleId)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? lessonRowToLesson(data as any) : null;
}

export async function createLesson(moduleId: string, lesson: Partial<EadLesson>): Promise<EadLesson> {
  // Pegar próximo sort_order
  const { data: existing } = await supabase
    .from('ead_lessons')
    .select('sort_order')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? (existing[0] as any).sort_order + 1 : 0;

  const row = {
    ...lessonToRow(lesson),
    module_id: moduleId,
    sort_order: lesson.sortOrder ?? nextOrder,
  };

  const { data, error } = await supabase
    .from('ead_lessons')
    .insert(row as any)
    .select()
    .single();

  if (error) throw error;
  return lessonRowToLesson(data as any);
}

export async function updateLesson(id: string, lesson: Partial<EadLesson>): Promise<EadLesson> {
  const row = lessonToRow(lesson);
  const { data, error } = await supabase
    .from('ead_lessons')
    .update(row as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return lessonRowToLesson(data as any);
}

export async function deleteLesson(id: string): Promise<void> {
  const { error } = await supabase
    .from('ead_lessons')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function reorderLessons(lessons: { id: string; sortOrder: number }[]): Promise<void> {
  for (const lesson of lessons) {
    const { error } = await supabase
      .from('ead_lessons')
      .update({ sort_order: lesson.sortOrder })
      .eq('id', lesson.id);

    if (error) throw error;
  }
}

// ============================================
// MATERIAIS
// ============================================

export async function getMaterialsByLesson(lessonId: string): Promise<EadMaterial[]> {
  const { data, error } = await (supabase as any)
    .from('ead_materials')
    .select('*')
    .eq('lesson_id', lessonId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data as any[] || []).map(materialRowToMaterial);
}

export async function getMaterialsByCourse(courseId: string): Promise<EadMaterial[]> {
  const { data, error } = await (supabase as any)
    .from('ead_materials')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data as any[] || []).map(materialRowToMaterial);
}

export async function createMaterial(material: Partial<EadMaterial> & { courseId?: string; lessonId?: string }): Promise<EadMaterial> {
  const row = {
    ...materialToRow(material),
    course_id: material.courseId,
    lesson_id: material.lessonId,
  };

  const { data, error } = await (supabase as any)
    .from('ead_materials')
    .insert(row as any)
    .select()
    .single();

  if (error) throw error;
  return materialRowToMaterial(data as any);
}

export async function updateMaterial(id: string, material: Partial<EadMaterial>): Promise<EadMaterial> {
  const row = materialToRow(material);
  const { data, error } = await (supabase as any)
    .from('ead_materials')
    .update(row as any)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return materialRowToMaterial(data as any);
}

export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('ead_materials')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function incrementMaterialDownload(id: string): Promise<void> {
  const { error } = await (supabase as any).rpc('increment_material_download', { material_id: id });

  // Se a função RPC não existir, fazer update manual
  if (error) {
    const { data: material } = await (supabase as any)
      .from('ead_materials')
      .select('download_count')
      .eq('id', id)
      .single();

    if (material) {
      await (supabase as any)
        .from('ead_materials')
        .update({ download_count: ((material as any).download_count || 0) + 1 })
        .eq('id', id);
    }
  }
}

// ============================================
// MATRÍCULAS
// ============================================

export async function getEnrollmentsByUser(userId: string): Promise<EadEnrollment[]> {
  const { data, error } = await supabase
    .from('ead_enrollments')
    .select('*, course:ead_courses(*, category:ead_categories(*))')
    .eq('user_id', userId)
    .order('last_accessed_at', { ascending: false, nullsFirst: false });

  if (error) throw error;

  return (data || []).map((row: any) => {
    const enrollment = enrollmentRowToEnrollment(row);
    if (row.course) {
      enrollment.course = courseRowToCourse(row.course);
      if (row.course.category) {
        enrollment.course.category = categoryRowToCategory(row.course.category);
      }
    }
    return enrollment;
  });
}

export async function getEnrollment(userId: string, courseId: string): Promise<EadEnrollment | null> {
  const { data, error } = await supabase
    .from('ead_enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? enrollmentRowToEnrollment(data as any) : null;
}

export async function createEnrollment(
  userId: string,
  courseId: string,
  options: {
    paymentProvider?: 'guru' | 'manual' | 'free' | 'subscription';
    transactionId?: string;
    expiresAt?: string;
  } = {}
): Promise<EadEnrollment> {
  const { paymentProvider = 'manual', transactionId, expiresAt } = options;

  const { data, error } = await supabase
    .from('ead_enrollments')
    .insert({
      user_id: userId,
      course_id: courseId,
      status: 'active',
      payment_provider: paymentProvider,
      transaction_id: transactionId,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) throw error;
  return enrollmentRowToEnrollment(data as any);
}

export async function updateEnrollmentStatus(
  id: string,
  status: 'active' | 'completed' | 'expired' | 'cancelled'
): Promise<EadEnrollment> {
  const updateData: any = { status };

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('ead_enrollments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return enrollmentRowToEnrollment(data as any);
}

// ============================================
// PROGRESSO DE AULAS
// ============================================

export async function getLessonProgress(userId: string, lessonId: string): Promise<EadLessonProgress | null> {
  const { data, error } = await supabase
    .from('ead_lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data ? lessonProgressRowToProgress(data as any) : null;
}

export async function getProgressByEnrollment(enrollmentId: string): Promise<EadLessonProgress[]> {
  const { data, error } = await supabase
    .from('ead_lesson_progress')
    .select('*')
    .eq('enrollment_id', enrollmentId);

  if (error) throw error;
  return (data as any[] || []).map(lessonProgressRowToProgress);
}

export async function updateLessonProgress(
  userId: string,
  lessonId: string,
  enrollmentId: string,
  progress: {
    watchedSeconds?: number;
    progressPercentage?: number;
    lastPositionSeconds?: number;
    isCompleted?: boolean;
  }
): Promise<EadLessonProgress> {
  const updateData: any = {
    user_id: userId,
    lesson_id: lessonId,
    enrollment_id: enrollmentId,
    last_watched_at: new Date().toISOString(),
  };

  if (progress.watchedSeconds !== undefined) {
    updateData.watched_seconds = progress.watchedSeconds;
  }
  if (progress.progressPercentage !== undefined) {
    updateData.progress_percentage = progress.progressPercentage;
  }
  if (progress.lastPositionSeconds !== undefined) {
    updateData.last_position_seconds = progress.lastPositionSeconds;
  }
  if (progress.isCompleted !== undefined) {
    updateData.is_completed = progress.isCompleted;
    if (progress.isCompleted) {
      updateData.completed_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from('ead_lesson_progress')
    .upsert(updateData, { onConflict: 'user_id,lesson_id' })
    .select()
    .single();

  if (error) throw error;
  return lessonProgressRowToProgress(data as any);
}

export async function markLessonComplete(
  userId: string,
  lessonId: string,
  enrollmentId: string
): Promise<EadLessonProgress> {
  return updateLessonProgress(userId, lessonId, enrollmentId, {
    isCompleted: true,
    progressPercentage: 100,
  });
}

// ============================================
// CERTIFICADOS
// ============================================

export async function getCertificatesByUser(userId: string): Promise<EadCertificate[]> {
  const { data, error } = await supabase
    .from('ead_certificates' as any)
    .select('*, course:ead_courses(*)')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false });

  if (error) throw error;
  return (data as any) || [];
}

export async function getCertificateByCode(code: string): Promise<EadCertificate | null> {
  const { data, error } = await supabase
    .from('ead_certificates' as any)
    .select('*, course:ead_courses(*)')
    .eq('certificate_code', code)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as any;
}

// ============================================
// ESTATÍSTICAS (Admin)
// ============================================

export async function getAcademyStats(): Promise<{
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  totalLessons: number;
  completedEnrollments: number;
}> {
  const [
    { count: totalCourses },
    { count: publishedCourses },
    { count: totalEnrollments },
    { count: totalLessons },
    { count: completedEnrollments },
  ] = await Promise.all([
    supabase.from('ead_courses').select('*', { count: 'exact', head: true }),
    supabase.from('ead_courses').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('ead_enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('ead_lessons').select('*', { count: 'exact', head: true }),
    supabase.from('ead_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
  ]);

  return {
    totalCourses: totalCourses || 0,
    publishedCourses: publishedCourses || 0,
    totalEnrollments: totalEnrollments || 0,
    totalLessons: totalLessons || 0,
    completedEnrollments: completedEnrollments || 0,
  };
}

// ============================================
// HELPERS
// ============================================

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
}

export function formatDuration(seconds: number): string {
  if (!seconds) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function getVideoProvider(url: string): 'panda' | 'youtube' | 'vimeo' | 'bunny' | 'other' {
  if (!url) return 'other';

  if (url.includes('pandavideo.com.br') || url.includes('pandavideo.com')) {
    return 'panda';
  }
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (url.includes('bunny.net') || url.includes('b-cdn.net')) {
    return 'bunny';
  }

  return 'other';
}
