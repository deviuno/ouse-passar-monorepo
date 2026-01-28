import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronDown,
    ChevronRight,
    CheckCircle,
    Circle,
    Loader2,
    PlayCircle,
    SkipBack,
    SkipForward,
    FileText,
    Download,
    MessageCircle,
    Send,
    Heart,
    User,
    Clock,
    BookOpen
} from 'lucide-react';
import { useAuthStore } from '../stores';
import {
    coursesService,
    Lesson,
    Module,
    LessonMaterial,
    LessonComment,
    getPandaVideoThumbnail
} from '../services/coursesService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CourseData {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    modules: Module[];
}

// Tab type for the content area
type ContentTab = 'content' | 'materials' | 'comments';

// Comment component
function CommentItem({
    comment,
    onLike,
    onReply,
    isReply = false
}: {
    comment: LessonComment;
    onLike: (id: string) => void;
    onReply: (id: string) => void;
    isReply?: boolean;
}) {
    return (
        <div className={`flex gap-3 ${isReply ? 'ml-10 mt-3' : ''}`}>
            <div className="flex-shrink-0">
                {comment.user?.avatar_url ? (
                    <img
                        src={comment.user.avatar_url}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg-main)] flex items-center justify-center">
                        <User size={14} className="text-[var(--color-text-muted)]" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--color-text-main)]">
                        {comment.user?.name || 'Usuário'}
                    </span>
                    {comment.is_instructor_reply && (
                        <span className="text-xs bg-[var(--color-brand)]/20 text-[var(--color-brand)] px-2 py-0.5 rounded-full">
                            Instrutor
                        </span>
                    )}
                    <span className="text-xs text-[var(--color-text-muted)]">
                        {formatDistanceToNow(new Date(comment.created_at), { locale: ptBR, addSuffix: true })}
                    </span>
                </div>
                <p className="text-sm text-[var(--color-text-sec)] mt-1 whitespace-pre-wrap">
                    {comment.content}
                </p>
                <div className="flex items-center gap-4 mt-2">
                    <button
                        onClick={() => onLike(comment.id)}
                        className={`flex items-center gap-1 text-xs transition-colors ${comment.is_liked
                            ? 'text-[var(--color-error)]'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-error)]'
                            }`}
                    >
                        <Heart size={14} className={comment.is_liked ? 'fill-current' : ''} />
                        {comment.likes_count > 0 && comment.likes_count}
                    </button>
                    {!isReply && (
                        <button
                            onClick={() => onReply(comment.id)}
                            className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors"
                        >
                            <MessageCircle size={14} />
                            Responder
                        </button>
                    )}
                </div>
                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3">
                        {comment.replies.map(reply => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                onLike={onLike}
                                onReply={onReply}
                                isReply
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CourseViewPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { profile } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<CourseData | null>(null);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    // New states
    const [activeTab, setActiveTab] = useState<ContentTab>('content');
    const [materials, setMaterials] = useState<LessonMaterial[]>([]);
    const [comments, setComments] = useState<LessonComment[]>([]);
    const [loadingMaterials, setLoadingMaterials] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [markingComplete, setMarkingComplete] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (slug && profile?.id) {
            loadCourse();
        }
    }, [slug, profile?.id]);

    useEffect(() => {
        if (currentLesson) {
            loadLessonData();
        }
    }, [currentLesson?.id]);

    const loadCourse = async () => {
        if (!slug || !profile?.id) return;
        setLoading(true);
        try {
            const data = await coursesService.getCourseBySlug(slug, profile.id);
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

    const loadLessonData = async () => {
        if (!currentLesson || !profile?.id) return;

        // Load materials
        setLoadingMaterials(true);
        const mats = await coursesService.getLessonMaterials(currentLesson.id);
        setMaterials(mats);
        setLoadingMaterials(false);

        // Load comments
        setLoadingComments(true);
        const comms = await coursesService.getLessonComments(currentLesson.id, profile.id);
        setComments(comms);
        setLoadingComments(false);
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
        setActiveTab('content');
    };

    const handleMarkComplete = async () => {
        if (!currentLesson || !profile?.id || !course) return;
        setMarkingComplete(true);
        const success = await coursesService.markLessonCompleted(profile.id, currentLesson.id, course.id);
        if (success) {
            // Update local state
            setCurrentLesson({ ...currentLesson, is_completed: true });
            // Reload course to update progress
            await loadCourse();
        }
        setMarkingComplete(false);
    };

    const handleNavigate = (direction: 'prev' | 'next') => {
        if (!course || !currentLesson) return;
        const { prev, next } = coursesService.getAdjacentLessons(course.modules, currentLesson.id);
        const targetLesson = direction === 'prev' ? prev : next;
        if (targetLesson) {
            selectLesson(targetLesson);
            // Expand the module containing the target lesson
            const targetModule = course.modules.find(m =>
                m.lessons.some(l => l.id === targetLesson.id)
            );
            if (targetModule) {
                setExpandedModules(new Set([...expandedModules, targetModule.id]));
            }
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !currentLesson || !profile?.id) return;
        setSubmittingComment(true);
        const comment = await coursesService.addComment(
            currentLesson.id,
            profile.id,
            newComment.trim(),
            replyingTo || undefined
        );
        if (comment) {
            if (replyingTo) {
                // Add reply to existing comment
                setComments(prev => prev.map(c => {
                    if (c.id === replyingTo) {
                        return { ...c, replies: [...(c.replies || []), comment] };
                    }
                    return c;
                }));
            } else {
                // Add new top-level comment
                setComments(prev => [comment, ...prev]);
            }
            setNewComment('');
            setReplyingTo(null);
        }
        setSubmittingComment(false);
    };

    const handleLike = async (commentId: string) => {
        if (!profile?.id) return;
        const isNowLiked = await coursesService.toggleCommentLike(commentId, profile.id);
        setComments(prev => prev.map(c => {
            if (c.id === commentId) {
                return {
                    ...c,
                    is_liked: isNowLiked,
                    likes_count: isNowLiked ? c.likes_count + 1 : c.likes_count - 1
                };
            }
            if (c.replies) {
                return {
                    ...c,
                    replies: c.replies.map(r => {
                        if (r.id === commentId) {
                            return {
                                ...r,
                                is_liked: isNowLiked,
                                likes_count: isNowLiked ? r.likes_count + 1 : r.likes_count - 1
                            };
                        }
                        return r;
                    })
                };
            }
            return c;
        }));
    };

    const adjacentLessons = course && currentLesson
        ? coursesService.getAdjacentLessons(course.modules, currentLesson.id)
        : { prev: null, next: null };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        return `${mins} min`;
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Calculate course progress
    const courseProgress = React.useMemo(() => {
        if (!course) return { completed: 0, total: 0, percentage: 0 };
        const allLessons = course.modules.flatMap(m => m.lessons);
        const completed = allLessons.filter(l => l.is_completed).length;
        const total = allLessons.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { completed, total, percentage };
    }, [course]);

    // Calculate module progress
    const getModuleProgress = (module: Module) => {
        const completed = module.lessons.filter(l => l.is_completed).length;
        const total = module.lessons.length;
        return { completed, total };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[var(--color-bg-main)]">
                <Loader2 className="w-8 h-8 text-[var(--color-brand)] animate-spin" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[var(--color-bg-main)]">
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
            <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
                <button
                    onClick={() => navigate('/cursos')}
                    className="p-2 hover:bg-[var(--color-bg-main)] rounded-lg transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-[var(--color-text-main)]" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-base font-semibold text-[var(--color-text-main)] truncate">{course.title}</h1>
                    {currentLesson && (
                        <p className="text-sm text-[var(--color-text-sec)] truncate">{currentLesson.title}</p>
                    )}
                </div>

                {/* Toggle Sidebar (Mobile) */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden p-2 hover:bg-[var(--color-bg-main)] rounded-lg transition-colors"
                >
                    <BookOpen size={18} className="text-[var(--color-text-main)]" />
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Video Player */}
                    <div className="flex-shrink-0 bg-black">
                        {currentLesson?.video_url ? (
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
                        ) : (
                            <div className="aspect-video flex items-center justify-center bg-[var(--color-bg-elevated)]">
                                <div className="text-center text-[var(--color-text-muted)]">
                                    <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                    <p>Selecione uma aula para começar</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation and Complete Buttons - Below Video */}
                    {currentLesson && (
                        <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)]">
                            {/* Previous Button */}
                            <button
                                onClick={() => handleNavigate('prev')}
                                disabled={!adjacentLessons.prev}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[var(--color-bg-main)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <SkipBack size={18} className="text-[var(--color-text-main)]" />
                                <span className="text-sm text-[var(--color-text-main)] hidden sm:inline">Anterior</span>
                            </button>

                            {/* Complete Button */}
                            {!currentLesson.is_completed ? (
                                <button
                                    onClick={handleMarkComplete}
                                    disabled={markingComplete}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-brand)] text-black font-semibold rounded-xl hover:brightness-110 disabled:opacity-50 transition-all"
                                >
                                    {markingComplete ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <CheckCircle size={18} />
                                    )}
                                    Concluir Aula
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-success)]/10 text-[var(--color-success)] font-semibold rounded-xl">
                                    <CheckCircle size={18} />
                                    Concluída
                                </div>
                            )}

                            {/* Next Button */}
                            <button
                                onClick={() => handleNavigate('next')}
                                disabled={!adjacentLessons.next}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[var(--color-bg-main)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="text-sm text-[var(--color-text-main)] hidden sm:inline">Próxima</span>
                                <SkipForward size={18} className="text-[var(--color-text-main)]" />
                            </button>
                        </div>
                    )}

                    {/* Content Tabs */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        {/* Tab Headers */}
                        <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
                            {[
                                { id: 'content' as ContentTab, label: 'Conteúdo', icon: FileText },
                                { id: 'materials' as ContentTab, label: 'Materiais', icon: Download },
                                { id: 'comments' as ContentTab, label: 'Comentários', icon: MessageCircle }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === tab.id
                                        ? 'text-[var(--color-brand)]'
                                        : 'text-[var(--color-text-sec)] hover:text-[var(--color-text-main)]'
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-brand)]"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <AnimatePresence mode="wait">
                                {/* Content Tab */}
                                {activeTab === 'content' && currentLesson && (
                                    <motion.div
                                        key="content"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <h2 className="text-lg font-semibold text-[var(--color-text-main)]">
                                                {currentLesson.title}
                                            </h2>
                                            {currentLesson.video_duration_seconds && (
                                                <div className="flex items-center gap-2 text-sm text-[var(--color-text-sec)] mt-1">
                                                    <Clock size={14} />
                                                    {formatDuration(currentLesson.video_duration_seconds)}
                                                </div>
                                            )}
                                        </div>

                                        {currentLesson.description && (
                                            <p className="text-[var(--color-text-sec)]">
                                                {currentLesson.description}
                                            </p>
                                        )}

                                        {currentLesson.text_content && (
                                            <div className="prose prose-invert max-w-none">
                                                <div
                                                    className="text-[var(--color-text-sec)] whitespace-pre-wrap"
                                                    dangerouslySetInnerHTML={{ __html: currentLesson.text_content }}
                                                />
                                            </div>
                                        )}

                                        {!currentLesson.description && !currentLesson.text_content && (
                                            <p className="text-[var(--color-text-muted)] italic">
                                                Nenhum conteúdo adicional para esta aula.
                                            </p>
                                        )}
                                    </motion.div>
                                )}

                                {/* Materials Tab */}
                                {activeTab === 'materials' && (
                                    <motion.div
                                        key="materials"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        {loadingMaterials ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="w-6 h-6 text-[var(--color-brand)] animate-spin" />
                                            </div>
                                        ) : materials.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Download className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)] opacity-30" />
                                                <p className="text-[var(--color-text-muted)]">
                                                    Nenhum material disponível para esta aula.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {materials.map(material => (
                                                    <a
                                                        key={material.id}
                                                        href={material.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 p-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-brand)] transition-colors"
                                                    >
                                                        <div className="p-2 bg-[var(--color-brand)]/10 rounded-lg">
                                                            <Download size={18} className="text-[var(--color-brand)]" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-[var(--color-text-main)] truncate">
                                                                {material.title}
                                                            </p>
                                                            <p className="text-xs text-[var(--color-text-muted)]">
                                                                {material.file_type?.toUpperCase()} • {formatFileSize(material.file_size_bytes)}
                                                            </p>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Comments Tab */}
                                {activeTab === 'comments' && (
                                    <motion.div
                                        key="comments"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-4"
                                    >
                                        {/* Comment Input */}
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0">
                                                {profile?.avatar_url ? (
                                                    <img
                                                        src={profile.avatar_url}
                                                        alt=""
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg-main)] flex items-center justify-center">
                                                        <User size={14} className="text-[var(--color-text-muted)]" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                {replyingTo && (
                                                    <div className="flex items-center gap-2 mb-2 text-xs text-[var(--color-text-sec)]">
                                                        <span>Respondendo a um comentário</span>
                                                        <button
                                                            onClick={() => setReplyingTo(null)}
                                                            className="text-[var(--color-error)] hover:underline"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                        placeholder={replyingTo ? 'Escreva sua resposta...' : 'Adicione um comentário...'}
                                                        className="flex-1 px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                                    />
                                                    <button
                                                        onClick={handleAddComment}
                                                        disabled={!newComment.trim() || submittingComment}
                                                        className="p-2 bg-[var(--color-brand)] text-black rounded-xl hover:brightness-110 disabled:opacity-50 transition-all"
                                                    >
                                                        {submittingComment ? (
                                                            <Loader2 size={18} className="animate-spin" />
                                                        ) : (
                                                            <Send size={18} />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comments List */}
                                        {loadingComments ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="w-6 h-6 text-[var(--color-brand)] animate-spin" />
                                            </div>
                                        ) : comments.length === 0 ? (
                                            <div className="text-center py-8">
                                                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)] opacity-30" />
                                                <p className="text-[var(--color-text-muted)]">
                                                    Seja o primeiro a comentar!
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {comments.map(comment => (
                                                    <CommentItem
                                                        key={comment.id}
                                                        comment={comment}
                                                        onLike={handleLike}
                                                        onReply={setReplyingTo}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Modules and Lessons */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 360, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="hidden lg:flex flex-col bg-[var(--color-bg-elevated)] border-l border-[var(--color-border)] overflow-hidden"
                        >
                            {/* Progress Header */}
                            <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-main)]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-[var(--color-text-sec)] uppercase tracking-wider">
                                        Progresso do Curso
                                    </span>
                                    <span className="text-sm font-bold text-[var(--color-brand)]">
                                        {courseProgress.percentage}%
                                    </span>
                                </div>
                                <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[var(--color-brand)] rounded-full transition-all duration-500"
                                        style={{ width: `${courseProgress.percentage}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {course.modules.map((module) => {
                                    const moduleProgress = getModuleProgress(module);
                                    return (
                                        <div key={module.id} className="border-b border-[var(--color-border)]/40 last:border-0">
                                            <button
                                                onClick={() => toggleModule(module.id)}
                                                className="w-full flex items-center gap-3 px-4 py-4 text-left transition-all duration-200 hover:bg-[var(--color-bg-main)]/30"
                                            >
                                                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition-colors bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                                                    {expandedModules.has(module.id) ? (
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-semibold truncate block text-[var(--color-text-main)]">
                                                        {module.title}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-[var(--color-text-muted)]">
                                                            {moduleProgress.completed}/{moduleProgress.total} aulas
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                            <AnimatePresence>
                                                {expandedModules.has(module.id) && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                        className="overflow-hidden bg-[var(--color-bg-main)]/20"
                                                    >
                                                        <div className="py-2 flex flex-col gap-[5px]">
                                                            {module.lessons.map((lesson) => (
                                                                <button
                                                                    key={lesson.id}
                                                                    onClick={() => selectLesson(lesson)}
                                                                    className={`group flex items-center gap-3 py-1.5 px-4 transition-colors relative min-h-[3rem] text-left ${
                                                                        currentLesson?.id === lesson.id
                                                                            ? 'bg-[var(--color-brand)]/5 text-[var(--color-brand)]'
                                                                            : 'hover:bg-[var(--color-bg-main)]/50 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
                                                                    }`}
                                                                >
                                                                    {/* Active indicator */}
                                                                    {currentLesson?.id === lesson.id && (
                                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-brand)] rounded-r-full" />
                                                                    )}

                                                                    {/* Thumbnail */}
                                                                    <div className={`flex-shrink-0 transition-colors relative ${
                                                                        lesson.is_completed
                                                                            ? 'text-[var(--color-success)]/70'
                                                                            : 'text-[var(--color-text-muted)]/50 group-hover:text-[var(--color-text-muted)]'
                                                                    }`}>
                                                                        <div className="relative w-16 h-9 rounded overflow-hidden border border-[var(--color-border)]/50 bg-black/10">
                                                                            {lesson.thumbnail_url ? (
                                                                                <img
                                                                                    alt=""
                                                                                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                                                                                        lesson.is_completed ? 'opacity-50' : 'opacity-90 hover:opacity-100'
                                                                                    }`}
                                                                                    src={lesson.thumbnail_url}
                                                                                />
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-main)]">
                                                                                    <PlayCircle className="w-4 h-4 text-[var(--color-text-muted)]" />
                                                                                </div>
                                                                            )}
                                                                            {lesson.is_completed && (
                                                                                <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-main)]/20 backdrop-blur-[1px]">
                                                                                    <CheckCircle className="w-4 h-4 text-[var(--color-success)] drop-shadow-md" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Title */}
                                                                    <span className={`text-sm flex-1 leading-tight line-clamp-2 ${
                                                                        currentLesson?.id === lesson.id ? 'font-medium' : ''
                                                                    }`}>
                                                                        {lesson.title}
                                                                    </span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile Sidebar Overlay */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden fixed inset-0 bg-black/50 z-40"
                            />
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                className="lg:hidden fixed right-0 top-0 bottom-0 w-80 bg-[var(--color-bg-elevated)] border-l border-[var(--color-border)] z-50 flex flex-col"
                            >
                                {/* Header with close button */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
                                    <h2 className="text-sm font-semibold text-[var(--color-text-main)]">Conteúdo do Curso</h2>
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="p-1 hover:bg-[var(--color-bg-main)] rounded-lg transition-colors"
                                    >
                                        <ChevronRight size={18} className="text-[var(--color-text-main)]" />
                                    </button>
                                </div>

                                {/* Progress Header */}
                                <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-main)]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-[var(--color-text-sec)] uppercase tracking-wider">
                                            Progresso do Curso
                                        </span>
                                        <span className="text-sm font-bold text-[var(--color-brand)]">
                                            {courseProgress.percentage}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[var(--color-brand)] rounded-full transition-all duration-500"
                                            style={{ width: `${courseProgress.percentage}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Modules List */}
                                <div className="flex-1 overflow-y-auto">
                                    {course.modules.map((module) => {
                                        const moduleProgress = getModuleProgress(module);
                                        return (
                                            <div key={module.id} className="border-b border-[var(--color-border)]/40 last:border-0">
                                                <button
                                                    onClick={() => toggleModule(module.id)}
                                                    className="w-full flex items-center gap-3 px-4 py-4 text-left transition-all duration-200 hover:bg-[var(--color-bg-main)]/30"
                                                >
                                                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition-colors bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                                                        {expandedModules.has(module.id) ? (
                                                            <ChevronDown className="w-3.5 h-3.5" />
                                                        ) : (
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm font-semibold truncate block text-[var(--color-text-main)]">
                                                            {module.title}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-[var(--color-text-muted)]">
                                                                {moduleProgress.completed}/{moduleProgress.total} aulas
                                                            </span>
                                                        </div>
                                                    </div>
                                                </button>
                                                <AnimatePresence>
                                                    {expandedModules.has(module.id) && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                            className="overflow-hidden bg-[var(--color-bg-main)]/20"
                                                        >
                                                            <div className="py-2 flex flex-col gap-[5px]">
                                                                {module.lessons.map((lesson) => (
                                                                    <button
                                                                        key={lesson.id}
                                                                        onClick={() => {
                                                                            selectLesson(lesson);
                                                                            setSidebarOpen(false);
                                                                        }}
                                                                        className={`group flex items-center gap-3 py-1.5 px-4 transition-colors relative min-h-[3rem] text-left ${
                                                                            currentLesson?.id === lesson.id
                                                                                ? 'bg-[var(--color-brand)]/5 text-[var(--color-brand)]'
                                                                                : 'hover:bg-[var(--color-bg-main)]/50 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
                                                                        }`}
                                                                    >
                                                                        {/* Active indicator */}
                                                                        {currentLesson?.id === lesson.id && (
                                                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-brand)] rounded-r-full" />
                                                                        )}

                                                                        {/* Thumbnail */}
                                                                        <div className={`flex-shrink-0 transition-colors relative ${
                                                                            lesson.is_completed
                                                                                ? 'text-[var(--color-success)]/70'
                                                                                : 'text-[var(--color-text-muted)]/50 group-hover:text-[var(--color-text-muted)]'
                                                                        }`}>
                                                                            <div className="relative w-14 h-8 rounded overflow-hidden border border-[var(--color-border)]/50 bg-black/10">
                                                                                {lesson.thumbnail_url ? (
                                                                                    <img
                                                                                        alt=""
                                                                                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                                                                                            lesson.is_completed ? 'opacity-50' : 'opacity-90 hover:opacity-100'
                                                                                        }`}
                                                                                        src={lesson.thumbnail_url}
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-main)]">
                                                                                        <PlayCircle className="w-3 h-3 text-[var(--color-text-muted)]" />
                                                                                    </div>
                                                                                )}
                                                                                {lesson.is_completed && (
                                                                                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-main)]/20 backdrop-blur-[1px]">
                                                                                        <CheckCircle className="w-3 h-3 text-[var(--color-success)] drop-shadow-md" />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Title */}
                                                                        <span className={`text-sm flex-1 leading-tight line-clamp-2 ${
                                                                            currentLesson?.id === lesson.id ? 'font-medium' : ''
                                                                        }`}>
                                                                            {lesson.title}
                                                                        </span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
