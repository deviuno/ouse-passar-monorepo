import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Play, CheckCircle, Loader2, Package, Clock, BarChart } from 'lucide-react';
import { Card, Button, StaggerContainer, StaggerItem } from '../components/ui';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { coursesService, Course } from '../services/coursesService';
import { getOptimizedImageUrl } from '../utils/image';

function CourseCard({
    course,
    onOpen,
}: {
    course: Course;
    onOpen: (slug: string) => void;
}) {
    const coverImage = getOptimizedImageUrl(course.cover_image_url || course.thumbnail_url, 400);
    const progress = course.progress || 0;
    const isCompleted = progress >= 100;

    return (
        <Card
            hoverable
            onClick={() => onOpen(course.slug)}
            className="relative overflow-hidden h-full cursor-pointer group flex flex-col"
        >
            {/* Cover Image */}
            <div className="relative w-full aspect-video rounded-t-xl overflow-hidden bg-[#3A3A3A]">
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
                        <BookOpen size={40} className="text-white/30" />
                    </div>
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

                {/* Progress Badge */}
                {progress > 0 && (
                    <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex justify-between text-xs text-white mb-1">
                            <span>{Math.round(progress)}% Concluído</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--color-brand)]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Completed Badge */}
                {isCompleted && (
                    <div className="absolute top-2 left-2 bg-[#2ECC71] text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle size={12} />
                        Concluído
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                <h3 className="text-[var(--color-text-main)] font-medium text-base mb-2 line-clamp-2 group-hover:text-[var(--color-brand)] transition-colors">
                    {course.title}
                </h3>

                <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mt-auto mb-4">
                    <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{course.estimated_duration_hours || 0}h</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <BookOpen size={12} />
                        <span>{course.total_lessons || 0} aulas</span>
                    </div>
                    {course.difficulty_level && (
                        <div className="flex items-center gap-1 capitalize">
                            <BarChart size={12} />
                            <span>{course.difficulty_level}</span>
                        </div>
                    )}
                </div>

                <Button
                    size="sm"
                    className="w-full mt-auto"
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpen(course.slug);
                    }}
                >
                    {progress > 0 ? 'Continuar' : 'Iniciar'}
                </Button>
            </div>
        </Card>
    );
}

export default function CoursesPage() {
    const { profile } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<Course[]>([]);

    useEffect(() => {
        if (profile?.id) {
            loadCourses();
        }
    }, [profile?.id]);

    const loadCourses = async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
            const data = await coursesService.getUserCourses(profile.id);
            setCourses(data);
        } catch (error) {
            console.error('Error loading courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCourse = async (slug: string) => {
        if (!profile?.id) return;

        // Find course by slug
        const course = courses.find(c => c.slug === slug);
        if (!course) return;

        // Auto-enroll in free courses
        if (course.is_free) {
            await coursesService.enrollInCourse(profile.id, course.id);
        }

        // Navigate to course view
        navigate(`/cursos/${slug}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-[var(--color-brand)] animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 pb-24 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--color-text-main)] mb-2">Meus Cursos</h1>
                <p className="text-[var(--color-text-sec)]">
                    Acesse suas vídeo aulas e materiais complementares
                </p>
            </div>

            {/* Empty State */}
            {courses.length === 0 && (
                <div className="text-center py-16 text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border)]">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <h2 className="text-lg font-medium text-[var(--color-text-main)] mb-2">
                        Nenhum curso encontrado
                    </h2>
                    <p className="max-w-md mx-auto mb-6">
                        Você ainda não está matriculado em nenhum curso. Visite a loja para explorar nossos conteúdos.
                    </p>
                    <Button onClick={() => navigate('/loja')}>
                        Ir para a Loja
                    </Button>
                </div>
            )}

            {/* Courses Grid */}
            {courses.length > 0 && (
                <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {courses.map((course) => (
                        <StaggerItem key={course.id}>
                            <CourseCard
                                course={course}
                                onOpen={handleOpenCourse}
                            />
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            )}
        </div>
    );
}
