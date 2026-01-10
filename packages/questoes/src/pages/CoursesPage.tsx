import React, { useState, useEffect } from 'react';
import { Loader2, Package } from 'lucide-react';
import { Button, StaggerContainer, StaggerItem } from '../components/ui';
import { CourseCard, NetflixCard } from '../components/course';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { coursesService, Course } from '../services/coursesService';

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
                <>
                    {/* Traditional Cards (16:9) */}
                    {courses.filter(c => c.display_format !== 'netflix').length > 0 && (
                        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                            {courses
                                .filter(c => c.display_format !== 'netflix')
                                .map((course) => (
                                    <StaggerItem key={course.id}>
                                        <CourseCard
                                            course={course}
                                            onOpen={handleOpenCourse}
                                        />
                                    </StaggerItem>
                                ))}
                        </StaggerContainer>
                    )}

                    {/* Netflix Cards (5:7 Poster) */}
                    {courses.filter(c => c.display_format === 'netflix').length > 0 && (
                        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {courses
                                .filter(c => c.display_format === 'netflix')
                                .map((course) => (
                                    <StaggerItem key={course.id}>
                                        <NetflixCard
                                            course={course}
                                            onOpen={handleOpenCourse}
                                        />
                                    </StaggerItem>
                                ))}
                        </StaggerContainer>
                    )}
                </>
            )}
        </div>
    );
}
