import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronRight, CheckCircle, Circle, Loader2, PlayCircle } from 'lucide-react';
import { useAuthStore } from '../stores';
import { coursesService } from '../services/coursesService';

interface Lesson {
    id: string;
    title: string;
    video_url: string;
    duration_minutes: number;
    sort_order: number;
    is_free: boolean;
}

interface Module {
    id: string;
    title: string;
    sort_order: number;
    lessons: Lesson[];
}

interface CourseData {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    modules: Module[];
}

export default function CourseViewPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { profile } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<CourseData | null>(null);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (slug) {
            loadCourse();
        }
    }, [slug]);

    const loadCourse = async () => {
        if (!slug) return;
        setLoading(true);
        try {
            const data = await coursesService.getCourseBySlug(slug);
            if (data) {
                setCourse(data);
                // Auto-select first lesson
                if (data.modules?.length > 0 && data.modules[0].lessons?.length > 0) {
                    setCurrentLesson(data.modules[0].lessons[0]);
                    setExpandedModules(new Set([data.modules[0].id]));
                }
            }
        } catch (error) {
            console.error('Error loading course:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleModule = (moduleId: string) => {
        const newExpanded = new Set(expandedModules);
        if (newExpanded.has(moduleId)) {
            newExpanded.delete(moduleId);
        } else {
            newExpanded.add(moduleId);
        }
        setExpandedModules(newExpanded);
    };

    const selectLesson = (lesson: Lesson) => {
        setCurrentLesson(lesson);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 text-[var(--color-brand)] animate-spin" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-4">Curso não encontrado</h2>
                <button
                    onClick={() => navigate('/cursos')}
                    className="text-[var(--color-brand)] hover:underline"
                >
                    Voltar para Meus Cursos
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-col bg-[var(--color-bg-main)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
                <button
                    onClick={() => navigate('/cursos')}
                    className="p-2 hover:bg-[var(--color-bg-main)] rounded-lg transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-[var(--color-text-main)]" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-[var(--color-text-main)]">{course.title}</h1>
                    {currentLesson && (
                        <p className="text-sm text-[var(--color-text-sec)]">{currentLesson.title}</p>
                    )}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Video Player Area */}
                <div className="flex-1 flex items-center justify-center bg-[var(--color-bg-main)] p-4 overflow-hidden">
                    {currentLesson?.video_url ? (
                        <div className="w-full h-full flex items-center justify-center">
                            {/* 16:9 Aspect Ratio Container */}
                            <div className="relative w-full max-w-full" style={{ maxHeight: 'calc(100vh - 80px)' }}>
                                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                    <iframe
                                        src={currentLesson.video_url}
                                        className="absolute top-0 left-0 w-full h-full"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                                        referrerPolicy="origin"
                                        title={currentLesson.title}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center">
                            <div className="text-center text-white/60">
                                <PlayCircle className="w-16 h-16 mx-auto mb-4" />
                                <p>Selecione uma aula para começar</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar - Modules and Lessons */}
                <div className="w-80 bg-[var(--color-bg-elevated)] border-l border-[var(--color-border)] overflow-y-auto flex-shrink-0">
                    <div className="p-4">
                        <h2 className="text-sm font-bold text-[var(--color-text-main)] mb-4">Conteúdo do Curso</h2>
                        {course.modules.map((module) => (
                            <div key={module.id} className="mb-2">
                                <button
                                    onClick={() => toggleModule(module.id)}
                                    className="w-full flex items-center justify-between p-3 bg-[var(--color-bg-main)] hover:bg-[var(--color-border)]/30 border border-transparent hover:border-[var(--color-border)] rounded-lg transition-colors"
                                >
                                    <span className="text-sm font-medium text-[var(--color-text-main)]">
                                        {module.title}
                                    </span>
                                    {expandedModules.has(module.id) ? (
                                        <ChevronDown className="w-4 h-4 text-[var(--color-text-sec)]" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-[var(--color-text-sec)]" />
                                    )}
                                </button>
                                {expandedModules.has(module.id) && (
                                    <div className="mt-1 space-y-1">
                                        {module.lessons.map((lesson) => (
                                            <button
                                                key={lesson.id}
                                                onClick={() => selectLesson(lesson)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${currentLesson?.id === lesson.id
                                                    ? 'bg-[var(--color-brand)]/10 border border-[var(--color-brand)]'
                                                    : 'hover:bg-[var(--color-bg-main)]'
                                                    }`}
                                            >
                                                <Circle className="w-4 h-4 flex-shrink-0 text-[var(--color-text-muted)]" />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm truncate ${currentLesson?.id === lesson.id
                                                        ? 'text-[var(--color-brand)] font-medium'
                                                        : 'text-[var(--color-text-main)]'
                                                        }`}>
                                                        {lesson.title}
                                                    </p>
                                                    {lesson.duration_minutes > 0 && (
                                                        <p className="text-xs text-[var(--color-text-muted)]">
                                                            {lesson.duration_minutes} min
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
