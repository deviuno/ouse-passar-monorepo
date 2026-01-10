// EAD Types - Ouse Passar Academy
// Tipagens para sistema EAD com integração Supabase

// ============================================
// ENUMS E TIPOS BASE
// ============================================

export type DifficultyLevel = 'iniciante' | 'intermediario' | 'avancado';
export type CourseStatus = 'draft' | 'published' | 'archived';
export type AccessType = 'lifetime' | 'subscription' | 'rental';
export type ContentType = 'video' | 'text' | 'quiz' | 'exercise';
export type VideoProvider = 'panda' | 'youtube' | 'vimeo' | 'bunny' | 'other';
export type EnrollmentStatus = 'active' | 'completed' | 'expired' | 'cancelled';
export type PaymentProvider = 'guru' | 'manual' | 'free' | 'subscription';
export type FileType = 'pdf' | 'doc' | 'xls' | 'zip' | 'image' | 'audio' | 'video' | 'other';

// Tipos para exibição de cards
export type CourseDisplayFormat = 'card' | 'netflix';
export type CourseBadgeType = 'premium' | 'new' | 'promo' | 'price' | 'free';
export type BadgePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface CourseBadge {
  type: CourseBadgeType;
  position: BadgePosition;
  enabled: boolean;
  customText?: string;
}

// ============================================
// FILTROS
// ============================================

export interface CourseFilters {
  search?: string;
  categoryId?: string;
  difficulty?: DifficultyLevel;
  isFree?: boolean;
  status?: CourseStatus;
  sortBy?: 'popular' | 'recent' | 'rating' | 'price_asc' | 'price_desc' | 'title';
}

// ============================================
// CATEGORIAS
// ============================================

export interface EadCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parentId: string | null;
  parent?: EadCategory | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed
  coursesCount?: number;
}

// Tipo para formulário de categoria
export interface EadCategoryFormData {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

// ============================================
// CURSOS
// ============================================

export interface EadCourse {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  shortDescription: string | null;
  categoryId: string | null;
  instructorId: string | null;

  // Mídia
  thumbnailUrl: string | null;
  coverImageUrl: string | null;
  previewVideoUrl: string | null;

  // Exibição de Cards
  displayFormat: CourseDisplayFormat;
  posterImageUrl: string | null;
  badges: CourseBadge[];

  // Configurações
  difficultyLevel: DifficultyLevel;
  estimatedDurationHours: number;

  // Preço e acesso
  isFree: boolean;
  price: number | null;
  originalPrice: number | null;
  accessType: AccessType;
  accessDays: number | null;
  includedInSubscription: boolean;

  // Integrações
  guruProductId: string | null;
  checkoutUrl: string | null;

  // Gamificação
  pointsOnComplete: number;

  // Status
  status: CourseStatus;
  publishedAt: string | null;

  // Metadata
  tags: string[];
  requirements: string[];
  whatYouLearn: string[];
  targetAudience: string[];

  // Estatísticas
  enrolledCount: number;
  completionRate: number;
  averageRating: number;
  reviewsCount: number;
  totalLessons: number;
  totalModules: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Relacionamentos (opcional)
  category?: EadCategory | null;
  modules?: EadModule[];
}

// Tipo para formulário de curso
export interface EadCourseFormData {
  title: string;
  slug: string;
  subtitle?: string;
  description?: string;
  shortDescription?: string;
  categoryId?: string | null;
  thumbnailUrl?: string;
  coverImageUrl?: string;
  previewVideoUrl?: string;
  displayFormat?: CourseDisplayFormat;
  posterImageUrl?: string;
  badges?: CourseBadge[];
  difficultyLevel?: DifficultyLevel;
  estimatedDurationHours?: number;
  isFree?: boolean;
  price?: number | null;
  originalPrice?: number | null;
  accessType?: AccessType;
  accessDays?: number | null;
  includedInSubscription?: boolean;
  guruProductId?: string;
  pointsOnComplete?: number;
  status?: CourseStatus;
  tags?: string[];
  requirements?: string[];
  whatYouLearn?: string[];
  targetAudience?: string[];
}

// ============================================
// MÓDULOS
// ============================================

export interface EadModule {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  isFree: boolean;
  isActive: boolean;
  isLocked: boolean;
  releaseAfterDays: number;
  estimatedDurationMinutes: number;
  createdAt: string;
  updatedAt: string;

  // Relacionamentos (opcional)
  lessons?: EadLesson[];

  // Computed
  totalLessons?: number;
  completedLessons?: number;
}

export interface EadModuleFormData {
  title: string;
  description?: string;
  sortOrder?: number;
  isFree?: boolean;
  isActive?: boolean;
  isLocked?: boolean;
  releaseAfterDays?: number;
  estimatedDurationMinutes?: number;
}

// ============================================
// AULAS
// ============================================

export interface EadLesson {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  description: string | null;

  // Conteúdo
  contentType: ContentType;
  videoUrl: string | null;
  videoDurationSeconds: number;
  videoProvider: VideoProvider;
  textContent: string | null;

  // Configurações
  sortOrder: number;
  isFree: boolean;
  isActive: boolean;
  requiresCompletion: boolean;

  // Gamificação
  pointsOnComplete: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Relacionamentos (opcional)
  materials?: EadMaterial[];

  // Computed (para UI)
  isCompleted?: boolean;
  progress?: number;
}

export interface EadLessonFormData {
  title: string;
  slug: string;
  description?: string;
  contentType?: ContentType;
  videoUrl?: string;
  videoDurationSeconds?: number;
  videoProvider?: VideoProvider;
  textContent?: string;
  sortOrder?: number;
  isFree?: boolean;
  isActive?: boolean;
  requiresCompletion?: boolean;
  pointsOnComplete?: number;
}

// ============================================
// MATERIAIS
// ============================================

export interface EadMaterial {
  id: string;
  courseId: string | null;
  lessonId: string | null;
  title: string;
  description: string | null;
  fileType: FileType;
  fileUrl: string;
  fileSizeBytes: number | null;
  downloadCount: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface EadMaterialFormData {
  title: string;
  description?: string;
  fileType?: FileType;
  fileUrl: string;
  fileSizeBytes?: number;
  sortOrder?: number;
  isActive?: boolean;
}

// ============================================
// MATRÍCULAS
// ============================================

export interface EadEnrollment {
  id: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;

  // Progresso
  progressPercentage: number;
  completedLessonsCount: number;
  lastLessonId: string | null;
  lastAccessedAt: string | null;

  // Datas
  enrolledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;

  // Pagamento
  transactionId: string | null;
  paymentProvider: PaymentProvider;

  // Certificado
  certificateIssued: boolean;
  certificateId: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Relacionamentos (opcional)
  course?: EadCourse;
}

// ============================================
// PROGRESSO DE AULAS
// ============================================

export interface EadLessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  enrollmentId: string;

  // Progresso
  watchedSeconds: number;
  progressPercentage: number;
  isCompleted: boolean;
  completedAt: string | null;

  // Metadata
  lastPositionSeconds: number;
  lastWatchedAt: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CERTIFICADOS
// ============================================

export interface EadCertificate {
  id: string;
  userId: string;
  courseId: string;
  enrollmentId: string;
  certificateCode: string;
  studentName: string;
  courseTitle: string;
  completionDate: string;
  hoursCompleted: number | null;
  pdfUrl: string | null;
  issuedAt: string;

  // Relacionamentos (opcional)
  course?: EadCourse;
}

// ============================================
// TIPOS PARA API / DATABASE
// ============================================

// Conversão snake_case para camelCase (Supabase -> Frontend)
export interface EadCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EadCourseRow {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  instructor_id: string | null;
  thumbnail_url: string | null;
  cover_image_url: string | null;
  preview_video_url: string | null;
  display_format: CourseDisplayFormat;
  poster_image_url: string | null;
  badges: CourseBadge[];
  difficulty_level: DifficultyLevel;
  estimated_duration_hours: number;
  is_free: boolean;
  price: number | null;
  original_price: number | null;
  access_type: AccessType;
  access_days: number | null;
  included_in_subscription: boolean;
  guru_product_id: string | null;
  checkout_url: string | null;
  points_on_complete: number;
  status: CourseStatus;
  published_at: string | null;
  tags: string[];
  requirements: string[];
  what_you_learn: string[];
  target_audience: string[];
  enrolled_count: number;
  completion_rate: number;
  average_rating: number;
  reviews_count: number;
  total_lessons: number;
  created_at: string;
  updated_at: string;
  category?: EadCategoryRow | null;
}

export interface EadModuleRow {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_free: boolean;
  is_active: boolean;
  is_locked: boolean;
  release_after_days: number;
  estimated_duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface EadLessonRow {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  description: string | null;
  content_type: ContentType;
  video_url: string | null;
  video_duration_seconds: number;
  video_provider: VideoProvider;
  text_content: string | null;
  sort_order: number;
  is_free: boolean;
  is_active: boolean;
  requires_completion: boolean;
  points_on_complete: number;
  created_at: string;
  updated_at: string;
}

export interface EadMaterialRow {
  id: string;
  course_id: string | null;
  lesson_id: string | null;
  title: string;
  description: string | null;
  file_type: FileType;
  file_url: string;
  file_size_bytes: number | null;
  download_count: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface EadEnrollmentRow {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  progress_percentage: number;
  completed_lessons_count: number;
  last_lesson_id: string | null;
  last_accessed_at: string | null;
  enrolled_at: string;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  transaction_id: string | null;
  payment_provider: PaymentProvider;
  certificate_issued: boolean;
  certificate_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EadLessonProgressRow {
  id: string;
  user_id: string;
  lesson_id: string;
  enrollment_id: string;
  watched_seconds: number;
  progress_percentage: number;
  is_completed: boolean;
  completed_at: string | null;
  last_position_seconds: number;
  last_watched_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EadCertificateRow {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_id: string;
  certificate_code: string;
  student_name: string;
  course_title: string;
  completion_date: string;
  hours_completed: number | null;
  pdf_url: string | null;
  issued_at: string;
}

// ============================================
// HELPERS DE CONVERSÃO
// ============================================

export function categoryRowToCategory(row: EadCategoryRow): EadCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon,
    color: row.color,
    parentId: row.parent_id,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function courseRowToCourse(row: EadCourseRow): EadCourse {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle,
    description: row.description,
    shortDescription: row.short_description,
    categoryId: row.category_id,
    instructorId: row.instructor_id,
    thumbnailUrl: row.thumbnail_url,
    coverImageUrl: row.cover_image_url,
    previewVideoUrl: row.preview_video_url,
    displayFormat: row.display_format || 'card',
    posterImageUrl: row.poster_image_url,
    badges: row.badges || [],
    difficultyLevel: row.difficulty_level,
    estimatedDurationHours: row.estimated_duration_hours,
    isFree: row.is_free,
    price: row.price,
    originalPrice: row.original_price,
    accessType: row.access_type,
    accessDays: row.access_days,
    includedInSubscription: row.included_in_subscription,
    guruProductId: row.guru_product_id,
    checkoutUrl: row.checkout_url,
    pointsOnComplete: row.points_on_complete,
    status: row.status,
    publishedAt: row.published_at,
    tags: row.tags || [],
    requirements: row.requirements || [],
    whatYouLearn: row.what_you_learn || [],
    targetAudience: row.target_audience || [],
    enrolledCount: row.enrolled_count,
    completionRate: row.completion_rate,
    averageRating: row.average_rating,
    reviewsCount: row.reviews_count,
    totalLessons: row.total_lessons,
    totalModules: 0, // Computed from modules relationship
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: row.category ? categoryRowToCategory(row.category) : null,
  };
}

export function moduleRowToModule(row: EadModuleRow): EadModule {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    description: row.description,
    sortOrder: row.sort_order,
    isFree: row.is_free,
    isActive: row.is_active,
    isLocked: row.is_locked,
    releaseAfterDays: row.release_after_days,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function lessonRowToLesson(row: EadLessonRow): EadLesson {
  return {
    id: row.id,
    moduleId: row.module_id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    contentType: row.content_type,
    videoUrl: row.video_url,
    videoDurationSeconds: row.video_duration_seconds,
    videoProvider: row.video_provider,
    textContent: row.text_content,
    sortOrder: row.sort_order,
    isFree: row.is_free,
    isActive: row.is_active,
    requiresCompletion: row.requires_completion,
    pointsOnComplete: row.points_on_complete,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function materialRowToMaterial(row: EadMaterialRow): EadMaterial {
  return {
    id: row.id,
    courseId: row.course_id,
    lessonId: row.lesson_id,
    title: row.title,
    description: row.description,
    fileType: row.file_type,
    fileUrl: row.file_url,
    fileSizeBytes: row.file_size_bytes,
    downloadCount: row.download_count,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export function enrollmentRowToEnrollment(row: EadEnrollmentRow): EadEnrollment {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    status: row.status,
    progressPercentage: row.progress_percentage,
    completedLessonsCount: row.completed_lessons_count,
    lastLessonId: row.last_lesson_id,
    lastAccessedAt: row.last_accessed_at,
    enrolledAt: row.enrolled_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    expiresAt: row.expires_at,
    transactionId: row.transaction_id,
    paymentProvider: row.payment_provider,
    certificateIssued: row.certificate_issued,
    certificateId: row.certificate_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function lessonProgressRowToProgress(row: EadLessonProgressRow): EadLessonProgress {
  return {
    id: row.id,
    userId: row.user_id,
    lessonId: row.lesson_id,
    enrollmentId: row.enrollment_id,
    watchedSeconds: row.watched_seconds,
    progressPercentage: row.progress_percentage,
    isCompleted: row.is_completed,
    completedAt: row.completed_at,
    lastPositionSeconds: row.last_position_seconds,
    lastWatchedAt: row.last_watched_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================
// HELPERS DE CONVERSÃO INVERSA (Frontend -> Database)
// ============================================

export function categoryToRow(category: Partial<EadCategory>): Partial<EadCategoryRow> {
  const row: Partial<EadCategoryRow> = {};
  if (category.name !== undefined) row.name = category.name;
  if (category.slug !== undefined) row.slug = category.slug;
  if (category.description !== undefined) row.description = category.description;
  if (category.icon !== undefined) row.icon = category.icon;
  if (category.color !== undefined) row.color = category.color;
  if (category.parentId !== undefined) row.parent_id = category.parentId;
  if (category.sortOrder !== undefined) row.sort_order = category.sortOrder;
  if (category.isActive !== undefined) row.is_active = category.isActive;
  return row;
}

export function courseToRow(course: Partial<EadCourse>): Partial<EadCourseRow> {
  const row: Partial<EadCourseRow> = {};
  if (course.title !== undefined) row.title = course.title;
  if (course.slug !== undefined) row.slug = course.slug;
  if (course.subtitle !== undefined) row.subtitle = course.subtitle;
  if (course.description !== undefined) row.description = course.description;
  if (course.shortDescription !== undefined) row.short_description = course.shortDescription;
  if (course.categoryId !== undefined) row.category_id = course.categoryId;
  if (course.instructorId !== undefined) row.instructor_id = course.instructorId;
  if (course.thumbnailUrl !== undefined) row.thumbnail_url = course.thumbnailUrl;
  if (course.coverImageUrl !== undefined) row.cover_image_url = course.coverImageUrl;
  if (course.previewVideoUrl !== undefined) row.preview_video_url = course.previewVideoUrl;
  if (course.displayFormat !== undefined) row.display_format = course.displayFormat;
  if (course.posterImageUrl !== undefined) row.poster_image_url = course.posterImageUrl;
  if (course.badges !== undefined) row.badges = course.badges;
  if (course.difficultyLevel !== undefined) row.difficulty_level = course.difficultyLevel;
  if (course.estimatedDurationHours !== undefined) row.estimated_duration_hours = course.estimatedDurationHours;
  if (course.isFree !== undefined) row.is_free = course.isFree;
  if (course.price !== undefined) row.price = course.price;
  if (course.originalPrice !== undefined) row.original_price = course.originalPrice;
  if (course.accessType !== undefined) row.access_type = course.accessType;
  if (course.accessDays !== undefined) row.access_days = course.accessDays;
  if (course.includedInSubscription !== undefined) row.included_in_subscription = course.includedInSubscription;
  if (course.guruProductId !== undefined) row.guru_product_id = course.guruProductId;
  if (course.checkoutUrl !== undefined) row.checkout_url = course.checkoutUrl;
  if (course.pointsOnComplete !== undefined) row.points_on_complete = course.pointsOnComplete;
  if (course.status !== undefined) row.status = course.status;
  if (course.publishedAt !== undefined) row.published_at = course.publishedAt;
  if (course.tags !== undefined) row.tags = course.tags;
  if (course.requirements !== undefined) row.requirements = course.requirements;
  if (course.whatYouLearn !== undefined) row.what_you_learn = course.whatYouLearn;
  if (course.targetAudience !== undefined) row.target_audience = course.targetAudience;
  return row;
}

export function moduleToRow(module: Partial<EadModule>): Partial<EadModuleRow> {
  const row: Partial<EadModuleRow> = {};
  if (module.courseId !== undefined) row.course_id = module.courseId;
  if (module.title !== undefined) row.title = module.title;
  if (module.description !== undefined) row.description = module.description;
  if (module.sortOrder !== undefined) row.sort_order = module.sortOrder;
  if (module.isFree !== undefined) row.is_free = module.isFree;
  if (module.isActive !== undefined) row.is_active = module.isActive;
  if (module.isLocked !== undefined) row.is_locked = module.isLocked;
  if (module.releaseAfterDays !== undefined) row.release_after_days = module.releaseAfterDays;
  if (module.estimatedDurationMinutes !== undefined) row.estimated_duration_minutes = module.estimatedDurationMinutes;
  return row;
}

export function lessonToRow(lesson: Partial<EadLesson>): Partial<EadLessonRow> {
  const row: Partial<EadLessonRow> = {};
  if (lesson.moduleId !== undefined) row.module_id = lesson.moduleId;
  if (lesson.title !== undefined) row.title = lesson.title;
  if (lesson.slug !== undefined) row.slug = lesson.slug;
  if (lesson.description !== undefined) row.description = lesson.description;
  if (lesson.contentType !== undefined) row.content_type = lesson.contentType;
  if (lesson.videoUrl !== undefined) row.video_url = lesson.videoUrl;
  if (lesson.videoDurationSeconds !== undefined) row.video_duration_seconds = lesson.videoDurationSeconds;
  if (lesson.videoProvider !== undefined) row.video_provider = lesson.videoProvider;
  if (lesson.textContent !== undefined) row.text_content = lesson.textContent;
  if (lesson.sortOrder !== undefined) row.sort_order = lesson.sortOrder;
  if (lesson.isFree !== undefined) row.is_free = lesson.isFree;
  if (lesson.isActive !== undefined) row.is_active = lesson.isActive;
  if (lesson.requiresCompletion !== undefined) row.requires_completion = lesson.requiresCompletion;
  if (lesson.pointsOnComplete !== undefined) row.points_on_complete = lesson.pointsOnComplete;
  return row;
}

export function materialToRow(material: Partial<EadMaterial>): Partial<EadMaterialRow> {
  const row: Partial<EadMaterialRow> = {};
  if (material.courseId !== undefined) row.course_id = material.courseId;
  if (material.lessonId !== undefined) row.lesson_id = material.lessonId;
  if (material.title !== undefined) row.title = material.title;
  if (material.description !== undefined) row.description = material.description;
  if (material.fileType !== undefined) row.file_type = material.fileType;
  if (material.fileUrl !== undefined) row.file_url = material.fileUrl;
  if (material.fileSizeBytes !== undefined) row.file_size_bytes = material.fileSizeBytes;
  if (material.sortOrder !== undefined) row.sort_order = material.sortOrder;
  if (material.isActive !== undefined) row.is_active = material.isActive;
  return row;
}

// ============================================
// TIPOS UTILITÁRIOS
// ============================================

// Curso com módulos e aulas expandidos
export interface EadCourseWithContent extends EadCourse {
  modules: (EadModule & {
    lessons: EadLesson[];
  })[];
}

// Aula com navegação
export interface EadLessonWithNavigation extends EadLesson {
  prevLesson: EadLesson | null;
  nextLesson: EadLesson | null;
  module: EadModule;
  courseTitle: string;
  courseSlug: string;
}

// Enrollment com curso
export interface EadEnrollmentWithCourse extends EadEnrollment {
  course: EadCourse;
}

// Progresso do curso para UI
export interface CourseProgress {
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  lastLesson: EadLesson | null;
  isCompleted: boolean;
}
