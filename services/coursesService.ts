import { supabase } from './supabaseClient';
import { Course } from '../types';
import { CourseQuestionFilters } from './questionsDbClient';

// Extended Course type with question filters
export interface DbCourseWithFilters {
  id: string;
  title: string;
  subtitle: string | null;
  icon: string | null;
  image_url: string | null;
  price: number | null;
  is_active: boolean;
  question_filters: CourseQuestionFilters | null;
  questions_count: number | null;
  description: string | null;
  block_size: number | null; // Quantidade de questões por bloco no simulado
  created_at: string;
  updated_at: string;
}

export interface CourseWithFilters extends Course {
  questionFilters?: CourseQuestionFilters;
  questionsCount?: number;
  description?: string;
  blockSize?: number;
}

// Transform DB course to app Course format
const transformCourse = (dbCourse: DbCourseWithFilters, isOwned: boolean = false): CourseWithFilters => ({
  id: dbCourse.id,
  title: dbCourse.title,
  subtitle: dbCourse.subtitle || '',
  icon: dbCourse.icon || '📚',
  image: dbCourse.image_url || undefined,
  isOwned,
  price: dbCourse.price ? `R$ ${dbCourse.price.toFixed(2).replace('.', ',')}` : undefined,
  questionFilters: dbCourse.question_filters || undefined,
  questionsCount: dbCourse.questions_count || undefined,
  description: dbCourse.description || undefined,
  blockSize: dbCourse.block_size || 20, // Default: 20 questões por bloco
});

// Fetch all available courses
export const fetchCourses = async (): Promise<Course[]> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_active', true)
    .order('title');

  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }

  return (data || []).map(c => transformCourse(c));
};

// Fetch courses with user ownership info
export const fetchCoursesWithOwnership = async (userId: string | null): Promise<Course[]> => {
  const courses = await fetchCourses();

  if (!userId) {
    // If no user, no courses are owned - user must enroll even in free courses
    return courses.map(c => ({
      ...c,
      isOwned: false,
    }));
  }

  // Fetch user's owned courses (includes both purchased and enrolled free courses)
  const { data: userCourses, error } = await supabase
    .from('user_courses')
    .select('course_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user courses:', error);
    return courses;
  }

  const ownedCourseIds = new Set((userCourses || []).map(uc => uc.course_id));

  // Only mark as owned if user has explicitly enrolled/purchased
  return courses.map(c => ({
    ...c,
    isOwned: ownedCourseIds.has(c.id),
  }));
};

// Get a single course by ID
export const fetchCourseById = async (courseId: string): Promise<Course | null> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (error) {
    console.error('Error fetching course:', error);
    return null;
  }

  return data ? transformCourse(data) : null;
};
