import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Send, Reply, ChevronDown, ChevronUp, User } from 'lucide-react';
import {
  QuestionComment,
  fetchQuestionComments,
  createComment,
  voteComment,
  getRelativeTime,
} from '../../services/commentsService';
import { getOptimizedImageUrl } from '../../utils/image';

interface CommentsSectionProps {
  questionId: number;
  userId: string | null;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

// Componente individual de comentário
const CommentItem: React.FC<{
  comment: QuestionComment;
  userId: string | null;
  onReply: (parentId: string) => void;
  onVote: (commentId: string, voteType: 'like' | 'dislike') => void;
  isReply?: boolean;
}> = ({ comment, userId, onReply, onVote, isReply = false }) => {
  const [showReplies, setShowReplies] = useState(true);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!userId || isVoting) return;
    setIsVoting(true);
    await onVote(comment.id, voteType);
    setIsVoting(false);
  };

  const userName = comment.user?.name || 'Usuário';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className={`flex flex-col ${isReply ? 'ml-8 pl-4 border-l-2 border-[var(--color-border)]' : ''}`}>
      <div className="flex items-start space-x-3 mb-2">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFB800] to-[#FF8C00] flex items-center justify-center text-black font-bold text-sm shrink-0">
          {comment.user?.avatar_url ? (
            <img src={getOptimizedImageUrl(comment.user.avatar_url, 64, 80)} alt={userName} className="w-full h-full rounded-full object-cover" loading="lazy" />
          ) : (
            userInitial
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-sm text-[var(--color-text-main)] truncate">{userName}</span>
            <span className="text-xs text-[var(--color-text-sec)] shrink-0">{getRelativeTime(comment.created_at)}</span>
          </div>
          <p className="text-sm text-[var(--color-text-main)] leading-relaxed break-words">{comment.content}</p>

          {/* Actions */}
          <div className="flex items-center space-x-4 mt-2">
            <button
              onClick={() => handleVote('like')}
              disabled={!userId || isVoting}
              className={`flex items-center space-x-1 text-xs transition-colors ${comment.user_vote === 'like'
                  ? 'text-[var(--color-brand)]'
                  : userId
                    ? 'text-[var(--color-text-sec)] hover:text-[var(--color-text-main)]'
                    : 'text-[var(--color-text-muted)] cursor-not-allowed'
                }`}
            >
              <ThumbsUp size={14} className={comment.user_vote === 'like' ? 'fill-[var(--color-brand)]' : ''} />
              <span>{comment.likes_count}</span>
            </button>
            <button
              onClick={() => handleVote('dislike')}
              disabled={!userId || isVoting}
              className={`flex items-center space-x-1 text-xs transition-colors ${comment.user_vote === 'dislike'
                  ? 'text-[#E74C3C]'
                  : userId
                    ? 'text-[var(--color-text-sec)] hover:text-[var(--color-text-main)]'
                    : 'text-[var(--color-text-muted)] cursor-not-allowed'
                }`}
            >
              <ThumbsDown size={14} className={comment.user_vote === 'dislike' ? 'fill-[#E74C3C]' : ''} />
              <span>{comment.dislikes_count}</span>
            </button>
            {!isReply && userId && (
              <button
                onClick={() => onReply(comment.id)}
                className="text-xs text-[var(--color-text-sec)] hover:text-[var(--color-text-main)] font-medium flex items-center"
              >
                <Reply size={14} className="mr-1" />
                Responder
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center text-xs text-[var(--color-brand)] hover:text-[var(--color-brand-light)] mb-2 ml-11"
          >
            {showReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span className="ml-1">{comment.replies.length} {comment.replies.length === 1 ? 'resposta' : 'respostas'}</span>
          </button>
          {showReplies && (
            <div className="space-y-3">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  userId={userId}
                  onReply={onReply}
                  onVote={onVote}
                  isReply={true}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Componente principal da seção de comentários
const CommentsSection: React.FC<CommentsSectionProps> = ({ questionId, userId, onShowToast }) => {
  const [comments, setComments] = useState<QuestionComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregar comentários
  useEffect(() => {
    const loadComments = async () => {
      setIsLoading(true);
      const data = await fetchQuestionComments(questionId, userId);
      setComments(data);
      setIsLoading(false);
    };

    loadComments();
  }, [questionId, userId]);

  // Enviar comentário
  const handleSubmit = async () => {
    if (!userId) {
      onShowToast?.('Faça login para comentar', 'info');
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const comment = await createComment(questionId, userId, newComment, replyingTo);

    if (comment) {
      if (replyingTo) {
        // Adicionar resposta ao comentário pai
        setComments(prev =>
          prev.map(c => {
            if (c.id === replyingTo) {
              return {
                ...c,
                replies: [...(c.replies || []), comment],
              };
            }
            return c;
          })
        );
      } else {
        // Adicionar novo comentário principal
        setComments(prev => [...prev, comment]);
      }

      setNewComment('');
      setReplyingTo(null);
      onShowToast?.('Comentário enviado!', 'success');
    } else {
      onShowToast?.('Erro ao enviar comentário', 'error');
    }

    setIsSubmitting(false);
  };

  // Votar em comentário
  const handleVote = async (commentId: string, voteType: 'like' | 'dislike') => {
    if (!userId) {
      onShowToast?.('Faça login para votar', 'info');
      return;
    }

    const result = await voteComment(commentId, userId, voteType);

    if (result.success) {
      // Atualizar estado local
      setComments(prev =>
        prev.map(c => updateCommentVote(c, commentId, voteType, result.action))
      );
    }
  };

  // Helper para atualizar votos no estado local
  const updateCommentVote = (
    comment: QuestionComment,
    targetId: string,
    voteType: 'like' | 'dislike',
    action: 'added' | 'changed' | 'removed'
  ): QuestionComment => {
    if (comment.id === targetId) {
      let newLikes = comment.likes_count;
      let newDislikes = comment.dislikes_count;
      let newUserVote: 'like' | 'dislike' | null = comment.user_vote || null;

      if (action === 'added') {
        if (voteType === 'like') newLikes++;
        else newDislikes++;
        newUserVote = voteType;
      } else if (action === 'removed') {
        if (voteType === 'like') newLikes = Math.max(0, newLikes - 1);
        else newDislikes = Math.max(0, newDislikes - 1);
        newUserVote = null;
      } else if (action === 'changed') {
        if (voteType === 'like') {
          newLikes++;
          newDislikes = Math.max(0, newDislikes - 1);
        } else {
          newDislikes++;
          newLikes = Math.max(0, newLikes - 1);
        }
        newUserVote = voteType;
      }

      return {
        ...comment,
        likes_count: newLikes,
        dislikes_count: newDislikes,
        user_vote: newUserVote,
      };
    }

    // Verificar nas respostas
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: comment.replies.map(r => updateCommentVote(r, targetId, voteType, action)),
      };
    }

    return comment;
  };

  // Cancelar resposta
  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment('');
  };

  // Encontrar nome do usuário que está sendo respondido
  const getReplyingToName = (): string => {
    if (!replyingTo) return '';
    const findComment = (comments: QuestionComment[]): string => {
      for (const c of comments) {
        if (c.id === replyingTo) return c.user?.name || 'Usuário';
        if (c.replies) {
          const found = findComment(c.replies);
          if (found) return found;
        }
      }
      return '';
    };
    return findComment(comments);
  };

  return (
    <div className="mt-6">
      <h4 className="text-sm font-bold text-[var(--color-text-main)] mb-4 flex items-center">
        <MessageSquare size={16} className="mr-2" />
        Comentários da Comunidade
        {comments.length > 0 && (
          <span className="ml-2 text-xs text-gray-500">({comments.length})</span>
        )}
      </h4>

      {/* Input de novo comentário */}
      <div className="mb-6">
        {replyingTo && (
          <div className="flex items-center justify-between bg-[var(--color-bg-elevated)] px-3 py-2 rounded-t-lg border border-b-0 border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-text-sec)]">
              Respondendo a <span className="text-[var(--color-brand)]">{getReplyingToName()}</span>
            </span>
            <button onClick={cancelReply} className="text-xs text-gray-500 hover:text-white">
              Cancelar
            </button>
          </div>
        )}
        <div className={`flex items-center bg-[var(--color-bg-elevated)] border border-[var(--color-border)] ${replyingTo ? 'rounded-b-lg' : 'rounded-lg'}`}>
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder={userId ? 'Escreva um comentário...' : 'Faça login para comentar'}
            disabled={!userId || isSubmitting}
            className="flex-1 bg-transparent px-4 py-3 text-sm text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={!userId || !newComment.trim() || isSubmitting}
            className="p-3 text-[var(--color-brand)] hover:text-[var(--color-brand-light)] disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Lista de comentários */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-700" />
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded w-24 mb-2" />
                <div className="h-3 bg-gray-700 rounded w-full mb-1" />
                <div className="h-3 bg-gray-700 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare size={32} className="mx-auto text-gray-600 mb-2" />
          <p className="text-gray-500 text-sm">Nenhum comentário ainda.</p>
          <p className="text-gray-600 text-xs">Seja o primeiro a comentar!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              userId={userId}
              onReply={setReplyingTo}
              onVote={handleVote}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
