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

export interface Lesson {
    id: string;
    module_id: string;
    title: string;
    slug: string;
    description?: string;
    content_type?: string;
    video_url?: string;
    video_duration_seconds?: number;
    text_content?: string;
    sort_order: number;
    is_free: boolean;
    is_active: boolean;
    requires_completion?: boolean;
    points_on_complete?: number;
    video_provider?: string;
    // Computed fields
    is_completed?: boolean;
    progress_percentage?: number;
    thumbnail_url?: string;
}

export interface Module {
    id: string;
    course_id: string;
    title: string;
    sort_order: number;
    is_active: boolean;
    lessons: Lesson[];
}

export interface LessonProgress {
    id: string;
    user_id: string;
    lesson_id: string;
    enrollment_id: string;
    watch_time_seconds: number;
    progress_percentage: number;
    is_completed: boolean;
    completed_at?: string;
    last_position_seconds: number;
}

export interface LessonMaterial {
    id: string;
    lesson_id: string;
    title: string;
    description?: string;
    file_type?: string;
    file_url: string;
    file_size_bytes?: number;
    sort_order: number;
}

export interface LessonComment {
    id: string;
    lesson_id: string;
    user_id: string;
    parent_id?: string;
    content: string;
    is_pinned: boolean;
    is_instructor_reply: boolean;
    likes_count: number;
    created_at: string;
    updated_at: string;
    // Joined fields
    user?: {
        name: string;
        avatar_url?: string;
    };
    replies?: LessonComment[];
    is_liked?: boolean;
}

/**
 * Extracts thumbnail URL from PandaVideo embed URL
 * Example: https://player-vz-69adbbef-538.tv.pandavideo.com.br/embed/?v=15d41bdf-a886-46e3-9f89-03e16df1f798
 * Returns: https://b-vz-69adbbef-538.tv.pandavideo.com.br/15d41bdf-a886-46e3-9f89-03e16df1f798/thumbnail.jpg
 */
export function getPandaVideoThumbnail(videoUrl?: string): string | undefined {
    if (!videoUrl) return undefined;

    // Extract the video ID from the URL
    const match = videoUrl.match(/[?&]v=([a-f0-9-]+)/i);
    if (!match) return undefined;

    const videoId = match[1];

    // Extract the base URL pattern (vz-XXXXX-XXX)
    const baseMatch = videoUrl.match(/vz-[a-f0-9]+-[a-f0-9]+/i);
    if (!baseMatch) return undefined;

    const basePattern = baseMatch[0];

    return `https://b-${basePattern}.tv.pandavideo.com.br/${videoId}/thumbnail.jpg`;
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
    async getCourseBySlug(slug: string, userId?: string): Promise<any | null> {
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

            // Get user's lesson progress if userId provided
            let lessonProgressMap: Record<string, LessonProgress> = {};
            if (userId) {
                const { data: enrollment } = await supabase
                    .from('ead_enrollments')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('course_id', course.id)
                    .maybeSingle();

                if (enrollment) {
                    const { data: progress } = await supabase
                        .from('ead_lesson_progress')
                        .select('*')
                        .eq('enrollment_id', enrollment.id);

                    if (progress) {
                        lessonProgressMap = progress.reduce((acc, p) => {
                            acc[p.lesson_id] = p;
                            return acc;
                        }, {} as Record<string, LessonProgress>);
                    }
                }
            }

            // Merge progress into lessons and sort lessons
            const modulesWithProgress = (modules || []).map(module => ({
                ...module,
                lessons: (module.lessons || [])
                    .sort((a: Lesson, b: Lesson) => a.sort_order - b.sort_order)
                    .map((lesson: Lesson) => ({
                        ...lesson,
                        is_completed: lessonProgressMap[lesson.id]?.is_completed || false,
                        progress_percentage: lessonProgressMap[lesson.id]?.progress_percentage || 0,
                        thumbnail_url: getPandaVideoThumbnail(lesson.video_url)
                    }))
            }));

            return {
                ...course,
                modules: modulesWithProgress
            };
        } catch (err) {
            console.error('Error getting course:', err);
            return null;
        }
    },

    /**
     * Mark a lesson as completed
     */
    async markLessonCompleted(userId: string, lessonId: string, courseId: string): Promise<boolean> {
        try {
            // Get enrollment
            const { data: enrollment } = await supabase
                .from('ead_enrollments')
                .select('id')
                .eq('user_id', userId)
                .eq('course_id', courseId)
                .maybeSingle();

            if (!enrollment) return false;

            // Upsert lesson progress
            const { error } = await supabase
                .from('ead_lesson_progress')
                .upsert({
                    user_id: userId,
                    lesson_id: lessonId,
                    enrollment_id: enrollment.id,
                    is_completed: true,
                    completed_at: new Date().toISOString(),
                    progress_percentage: 100
                }, {
                    onConflict: 'user_id,lesson_id'
                });

            if (error) {
                // If unique constraint doesn't exist, try insert/update separately
                const { data: existing } = await supabase
                    .from('ead_lesson_progress')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('lesson_id', lessonId)
                    .maybeSingle();

                if (existing) {
                    await supabase
                        .from('ead_lesson_progress')
                        .update({
                            is_completed: true,
                            completed_at: new Date().toISOString(),
                            progress_percentage: 100
                        })
                        .eq('id', existing.id);
                } else {
                    await supabase
                        .from('ead_lesson_progress')
                        .insert({
                            user_id: userId,
                            lesson_id: lessonId,
                            enrollment_id: enrollment.id,
                            is_completed: true,
                            completed_at: new Date().toISOString(),
                            progress_percentage: 100
                        });
                }
            }

            // Update course enrollment progress
            await this.updateCourseProgress(userId, courseId);

            return true;
        } catch (err) {
            console.error('Error marking lesson completed:', err);
            return false;
        }
    },

    /**
     * Update course overall progress
     */
    async updateCourseProgress(userId: string, courseId: string): Promise<void> {
        try {
            // Get total lessons count
            const { data: modules } = await supabase
                .from('ead_modules')
                .select('id')
                .eq('course_id', courseId)
                .eq('is_active', true);

            if (!modules || modules.length === 0) return;

            const moduleIds = modules.map(m => m.id);

            const { count: totalLessons } = await supabase
                .from('ead_lessons')
                .select('id', { count: 'exact', head: true })
                .in('module_id', moduleIds)
                .eq('is_active', true);

            // Get completed lessons count
            const { data: enrollment } = await supabase
                .from('ead_enrollments')
                .select('id')
                .eq('user_id', userId)
                .eq('course_id', courseId)
                .maybeSingle();

            if (!enrollment) return;

            const { count: completedLessons } = await supabase
                .from('ead_lesson_progress')
                .select('id', { count: 'exact', head: true })
                .eq('enrollment_id', enrollment.id)
                .eq('is_completed', true);

            // Calculate progress percentage
            const progress = totalLessons ? Math.round(((completedLessons || 0) / totalLessons) * 100) : 0;

            // Update enrollment
            await supabase
                .from('ead_enrollments')
                .update({ progress_percentage: progress })
                .eq('id', enrollment.id);
        } catch (err) {
            console.error('Error updating course progress:', err);
        }
    },

    /**
     * Get lesson materials
     */
    async getLessonMaterials(lessonId: string): Promise<LessonMaterial[]> {
        try {
            const { data, error } = await supabase
                .from('ead_materials')
                .select('*')
                .eq('lesson_id', lessonId)
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (error) return [];
            return data || [];
        } catch (err) {
            console.error('Error getting materials:', err);
            return [];
        }
    },

    /**
     * Get lesson comments
     */
    async getLessonComments(lessonId: string, userId?: string): Promise<LessonComment[]> {
        try {
            const { data: comments, error } = await supabase
                .from('ead_lesson_comments')
                .select('*')
                .eq('lesson_id', lessonId)
                .is('parent_id', null)
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });

            if (error || !comments) return [];

            // Get user profiles
            const userIds = [...new Set(comments.map(c => c.user_id))];
            const { data: profiles } = await supabase
                .from('user_profiles')
                .select('id, name, avatar_url')
                .in('id', userIds);

            const profileMap = (profiles || []).reduce((acc, p) => {
                acc[p.id] = { name: p.name, avatar_url: p.avatar_url };
                return acc;
            }, {} as Record<string, { name: string; avatar_url?: string }>);

            // Get replies
            const commentIds = comments.map(c => c.id);
            const { data: replies } = await supabase
                .from('ead_lesson_comments')
                .select('*')
                .in('parent_id', commentIds)
                .order('created_at', { ascending: true });

            // Get user likes if userId provided
            let userLikes: Set<string> = new Set();
            if (userId) {
                const { data: likes } = await supabase
                    .from('ead_comment_likes')
                    .select('comment_id')
                    .eq('user_id', userId);
                userLikes = new Set((likes || []).map(l => l.comment_id));
            }

            // Get reply user profiles
            const replyUserIds = [...new Set((replies || []).map(r => r.user_id))];
            const { data: replyProfiles } = await supabase
                .from('user_profiles')
                .select('id, name, avatar_url')
                .in('id', replyUserIds);

            const replyProfileMap = (replyProfiles || []).reduce((acc, p) => {
                acc[p.id] = { name: p.name, avatar_url: p.avatar_url };
                return acc;
            }, {} as Record<string, { name: string; avatar_url?: string }>);

            // Build comments with replies
            return comments.map(comment => ({
                ...comment,
                user: profileMap[comment.user_id],
                is_liked: userLikes.has(comment.id),
                replies: (replies || [])
                    .filter(r => r.parent_id === comment.id)
                    .map(reply => ({
                        ...reply,
                        user: replyProfileMap[reply.user_id],
                        is_liked: userLikes.has(reply.id)
                    }))
            }));
        } catch (err) {
            console.error('Error getting comments:', err);
            return [];
        }
    },

    /**
     * Add a comment to a lesson
     */
    async addComment(lessonId: string, userId: string, content: string, parentId?: string): Promise<LessonComment | null> {
        try {
            const { data, error } = await supabase
                .from('ead_lesson_comments')
                .insert({
                    lesson_id: lessonId,
                    user_id: userId,
                    content,
                    parent_id: parentId || null
                })
                .select()
                .single();

            if (error) return null;

            // Get user profile
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('name, avatar_url')
                .eq('id', userId)
                .single();

            return {
                ...data,
                user: profile || { name: 'Usuário' }
            };
        } catch (err) {
            console.error('Error adding comment:', err);
            return null;
        }
    },

    /**
     * Toggle like on a comment
     */
    async toggleCommentLike(commentId: string, userId: string): Promise<boolean> {
        try {
            // Check if already liked
            const { data: existing } = await supabase
                .from('ead_comment_likes')
                .select('id')
                .eq('comment_id', commentId)
                .eq('user_id', userId)
                .maybeSingle();

            if (existing) {
                // Unlike
                await supabase
                    .from('ead_comment_likes')
                    .delete()
                    .eq('id', existing.id);

                // Decrement count
                await supabase.rpc('decrement_comment_likes', { comment_id: commentId });
                return false;
            } else {
                // Like
                await supabase
                    .from('ead_comment_likes')
                    .insert({ comment_id: commentId, user_id: userId });

                // Increment count
                await supabase.rpc('increment_comment_likes', { comment_id: commentId });
                return true;
            }
        } catch (err) {
            console.error('Error toggling like:', err);
            return false;
        }
    },

    /**
     * Get all lessons for a course (flat list for navigation)
     */
    getAllLessons(modules: Module[]): Lesson[] {
        return modules.flatMap(module =>
            module.lessons.map(lesson => ({
                ...lesson,
                module_id: module.id
            }))
        );
    },

    /**
     * Get next and previous lessons
     */
    getAdjacentLessons(modules: Module[], currentLessonId: string): { prev: Lesson | null; next: Lesson | null } {
        const allLessons = this.getAllLessons(modules);
        const currentIndex = allLessons.findIndex(l => l.id === currentLessonId);

        return {
            prev: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
            next: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null
        };
    }
};
