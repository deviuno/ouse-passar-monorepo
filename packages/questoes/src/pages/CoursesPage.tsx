import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Package, Play, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../stores';
import { coursesService, Course } from '../services/coursesService';
import { getOptimizedImageUrl } from '../utils/image';

// Netflix-style course card component
function CourseCard({ course, onOpen }: { course: Course; onOpen: (slug: string) => void }) {
    const posterImage = getOptimizedImageUrl(
        course.poster_image_url || course.thumbnail_url,
        400
    );
    const progress = course.progress || 0;
    const isCompleted = progress >= 100;

    return (
        <motion.div
            whileHover={{ scale: 1.05, zIndex: 10 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpen(course.slug)}
            className="relative flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] cursor-pointer group"
        >
            {/* Card Container */}
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-lg">
                {/* Poster Image */}
                {posterImage ? (
                    <img
                        src={posterImage}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-brand)]/20 to-[var(--color-bg-elevated)]">
                        <Package size={40} className="text-[var(--color-text-muted)]" />
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                {/* Completed Badge */}
                {isCompleted && (
                    <div className="absolute top-2 right-2 bg-[var(--color-success)] text-white p-1.5 rounded-full shadow-lg">
                        <CheckCircle size={14} />
                    </div>
                )}

                {/* Play Button - Shows on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="bg-[var(--color-brand)] rounded-full p-3 shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <Play size={24} className="text-black fill-current ml-0.5" />
                    </div>
                </div>

                {/* Progress Bar */}
                {progress > 0 && !isCompleted && (
                    <div className="absolute bottom-0 left-0 right-0">
                        <div className="h-1 bg-white/20">
                            <div
                                className="h-full bg-[var(--color-brand)] transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-semibold text-sm line-clamp-2 drop-shadow-lg leading-tight">
                        {course.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-white/70 text-xs">
                            {course.total_lessons || 0} aulas
                        </span>
                        {progress > 0 && !isCompleted && (
                            <span className="text-[var(--color-brand)] text-xs font-medium">
                                {Math.round(progress)}%
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// Horizontal scrolling row component
function CourseRow({
    title,
    courses,
    onOpen
}: {
    title: string;
    courses: Course[];
    onOpen: (slug: string) => void;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        const ref = scrollRef.current;
        if (ref) {
            ref.addEventListener('scroll', checkScroll);
            return () => ref.removeEventListener('scroll', checkScroll);
        }
    }, [courses]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = scrollRef.current.clientWidth * 0.8;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (courses.length === 0) return null;

    return (
        <div className="relative group/row mb-8">
            {/* Row Title */}
            <h2 className="text-lg font-semibold text-[var(--color-text-main)] mb-4 px-4 md:px-0">
                {title}
            </h2>

            {/* Scroll Container */}
            <div className="relative">
                {/* Left Scroll Button */}
                {canScrollLeft && (
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-r from-[var(--color-bg-main)] to-transparent flex items-center justify-start pl-2 opacity-0 group-hover/row:opacity-100 transition-opacity"
                    >
                        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-full p-2 shadow-lg hover:bg-[var(--color-border)] transition-colors">
                            <ChevronLeft size={20} className="text-[var(--color-text-main)]" />
                        </div>
                    </button>
                )}

                {/* Right Scroll Button */}
                {canScrollRight && (
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-l from-[var(--color-bg-main)] to-transparent flex items-center justify-end pr-2 opacity-0 group-hover/row:opacity-100 transition-opacity"
                    >
                        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-full p-2 shadow-lg hover:bg-[var(--color-border)] transition-colors">
                            <ChevronRight size={20} className="text-[var(--color-text-main)]" />
                        </div>
                    </button>
                )}

                {/* Courses Scroll Area */}
                <div
                    ref={scrollRef}
                    className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-0 pb-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {courses.map((course) => (
                        <CourseCard
                            key={course.id}
                            course={course}
                            onOpen={onOpen}
                        />
                    ))}
                </div>
            </div>
        </div>
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

        const course = courses.find(c => c.slug === slug);
        if (!course) return;

        if (course.is_free) {
            await coursesService.enrollInCourse(profile.id, course.id);
        }

        navigate(`/cursos/${slug}`);
    };

    // Categorize courses
    const inProgressCourses = courses.filter(c => (c.progress || 0) > 0 && (c.progress || 0) < 100);
    const completedCourses = courses.filter(c => (c.progress || 0) >= 100);
    const notStartedCourses = courses.filter(c => !c.progress || c.progress === 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-[var(--color-brand)] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-main)] pb-24">
            {/* Header */}
            <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-main)] mb-1">
                    Meus Cursos
                </h1>
                <p className="text-[var(--color-text-sec)]">
                    Acesse suas vídeo aulas e materiais complementares
                </p>
            </div>

            {/* Empty State */}
            {courses.length === 0 && (
                <div className="px-4 md:px-6 max-w-7xl mx-auto">
                    <div className="text-center py-16 bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border)]">
                        <Package className="w-16 h-16 mx-auto mb-4 text-[var(--color-text-muted)] opacity-30" />
                        <h2 className="text-lg font-medium text-[var(--color-text-main)] mb-2">
                            Nenhum curso encontrado
                        </h2>
                        <p className="text-[var(--color-text-muted)] max-w-md mx-auto mb-6">
                            Você ainda não está matriculado em nenhum curso. Visite a loja para explorar nossos conteúdos.
                        </p>
                        <button
                            onClick={() => navigate('/loja')}
                            className="bg-[var(--color-brand)] text-black font-semibold px-6 py-3 rounded-xl hover:brightness-110 transition-all"
                        >
                            Ir para a Loja
                        </button>
                    </div>
                </div>
            )}

            {/* Course Rows */}
            {courses.length > 0 && (
                <div className="max-w-7xl mx-auto md:px-6">
                    {/* Continue Watching */}
                    <CourseRow
                        title="Continuar Assistindo"
                        courses={inProgressCourses}
                        onOpen={handleOpenCourse}
                    />

                    {/* Not Started */}
                    <CourseRow
                        title="Começar a Estudar"
                        courses={notStartedCourses}
                        onOpen={handleOpenCourse}
                    />

                    {/* Completed */}
                    <CourseRow
                        title="Concluídos"
                        courses={completedCourses}
                        onOpen={handleOpenCourse}
                    />

                    {/* All Courses (if no categorization) */}
                    {inProgressCourses.length === 0 && notStartedCourses.length === 0 && completedCourses.length === 0 && (
                        <CourseRow
                            title="Todos os Cursos"
                            courses={courses}
                            onOpen={handleOpenCourse}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
