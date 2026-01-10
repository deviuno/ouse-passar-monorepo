import { supabase } from './supabaseClient';

export type CourseDisplayFormat = 'card' | 'netflix';
export type CourseBadgeType = 'premium' | 'new' | 'promo' | 'price' | 'free';
export type BadgePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface CourseBadge {
    type: CourseBadgeType;
    position: BadgePosition;
    enabled: boolean;
    customText?: string;
}

export interface Course {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnail_url: string;
    cover_image_url: string;
    category_id: string;
    difficulty_level: string;
    estimated_duration_hours: number;
    is_free: boolean;
    price?: number | null;
    published_at: string;
    total_lessons: number;
    // Display format fields
    display_format: CourseDisplayFormat;
    poster_image_url?: string | null;
    badges: CourseBadge[];
    // Computed/joined fields
    progress?: number;
    is_enrolled?: boolean;
}

export const coursesService = {
    /**
     * Fetches courses for the user.
     * For now, returns all published free courses (no enrollment required).
     * In the future, this can be enhanced to check enrollments for paid courses.
     */
    async getUserCourses(userId: string): Promise<Course[]> {
        try {
            // Fetch all published free courses
            const { data: courses, error: coursesError } = await supabase
                .from('ead_courses')
                .select('*')
                .eq('status', 'published')
                .eq('is_free', true);

            if (coursesError) {
                console.error('Error fetching courses:', coursesError);
                return [];
            }

            // Check if user has progress for any courses
            const { data: enrollments } = await supabase
                .from('ead_enrollments')
                .select('course_id, progress_percentage')
                .eq('user_id', userId)
                .eq('status', 'active');

            // Merge progress info
            const result = (courses || []).map(course => {
                const enrollment = enrollments?.find(e => e.course_id === course.id);
                return {
                    ...course,
                    progress: enrollment?.progress_percentage || 0,
                    is_enrolled: !!enrollment
                };
            });

            return result;
        } catch (err) {
            console.error('Unexpected error in getUserCourses:', err);
            return [];
        }
    },

    /**
     * Fetches all available courses (store view)
     */
    async getAvailableCourses(userId: string): Promise<Course[]> {
        const { data, error } = await supabase
            .from('ead_courses')
            .select('*')
            .eq('status', 'published');

        if (error) return [];
        return data as Course[];
    },

    /**
     * Enrolls user in a course (automatic for free courses)
     */
    async enrollInCourse(userId: string, courseId: string): Promise<boolean> {
        try {
            // Check if already enrolled
            const { data: existing } = await supabase
                .from('ead_enrollments')
                .select('id')
                .eq('user_id', userId)
                .eq('course_id', courseId)
                .maybeSingle();

            if (existing) return true;

            // Create enrollment
            const { error } = await supabase
                .from('ead_enrollments')
                .insert({
                    user_id: userId,
                    course_id: courseId,
                    status: 'active',
                    enrolled_at: new Date().toISOString(),
                    progress_percentage: 0
                });

            return !error;
        } catch (err) {
            console.error('Error enrolling:', err);
            return false;
        }
    },

    /**
     * Gets course details with modules and lessons
     */
    async getCourseBySlug(slug: string): Promise<any | null> {
        try {
            const { data: course, error } = await supabase
                .from('ead_courses')
                .select('*')
                .eq('slug', slug)
                .eq('status', 'published')
                .single();

            if (error || !course) return null;

            // Get modules with lessons
            const { data: modules } = await supabase
                .from('ead_modules')
                .select('*, lessons:ead_lessons(*)')
                .eq('course_id', course.id)
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            return {
                ...course,
                modules: modules || []
            };
        } catch (err) {
            console.error('Error getting course:', err);
            return null;
        }
    }
};
