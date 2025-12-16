import { supabase } from './supabaseClient';

// Tipos para comentários
export interface CommentUser {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

export interface QuestionComment {
  id: string;
  question_id: number;
  user_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number;
  dislikes_count: number;
  created_at: string;
  updated_at: string;
  user?: CommentUser;
  replies?: QuestionComment[];
  user_vote?: 'like' | 'dislike' | null;
}

export interface CommentVote {
  id: string;
  comment_id: string;
  user_id: string;
  vote_type: 'like' | 'dislike';
}

// Buscar comentários de uma questão com respostas aninhadas
export const fetchQuestionComments = async (
  questionId: number,
  userId?: string | null
): Promise<QuestionComment[]> => {
  try {
    // Buscar todos os comentários da questão
    const { data: comments, error } = await supabase
      .from('question_comments')
      .select('*')
      .eq('question_id', questionId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }

    if (!comments || comments.length === 0) {
      return [];
    }

    // Buscar dados dos usuários separadamente
    const userIds = [...new Set(comments.map(c => c.user_id))];
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);

    const usersMap = new Map(users?.map(u => [u.id, u]) || []);

    // Buscar votos do usuário atual (se autenticado)
    let userVotes: Record<string, 'like' | 'dislike'> = {};
    if (userId) {
      const commentIds = comments.map(c => c.id);
      const { data: votes } = await supabase
        .from('comment_votes')
        .select('comment_id, vote_type')
        .eq('user_id', userId)
        .in('comment_id', commentIds);

      if (votes) {
        userVotes = votes.reduce((acc, v) => {
          acc[v.comment_id] = v.vote_type;
          return acc;
        }, {} as Record<string, 'like' | 'dislike'>);
      }
    }

    // Organizar comentários em estrutura hierárquica
    const commentsMap = new Map<string, QuestionComment>();
    const rootComments: QuestionComment[] = [];

    // Primeiro, criar o mapa de todos os comentários
    comments.forEach(comment => {
      const user = usersMap.get(comment.user_id);
      commentsMap.set(comment.id, {
        ...comment,
        user: user ? { id: user.id, name: user.name, avatar_url: user.avatar_url } : undefined,
        user_vote: userVotes[comment.id] || null,
        replies: [],
      });
    });

    // Depois, organizar em hierarquia
    commentsMap.forEach(comment => {
      if (comment.parent_id) {
        const parent = commentsMap.get(comment.parent_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return [];
  }
};

// Criar um novo comentário
export const createComment = async (
  questionId: number,
  userId: string,
  content: string,
  parentId?: string | null
): Promise<QuestionComment | null> => {
  try {
    const { data, error } = await supabase
      .from('question_comments')
      .insert({
        question_id: questionId,
        user_id: userId,
        content: content.trim(),
        parent_id: parentId || null,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return null;
    }

    // Buscar dados do usuário
    const { data: user } = await supabase
      .from('user_profiles')
      .select('id, name, avatar_url')
      .eq('id', userId)
      .single();

    return {
      ...data,
      user: user ? { id: user.id, name: user.name, avatar_url: user.avatar_url } : undefined,
      user_vote: null,
      replies: [],
    };
  } catch (error) {
    console.error('Failed to create comment:', error);
    return null;
  }
};

// Atualizar um comentário
export const updateComment = async (
  commentId: string,
  userId: string,
  content: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('question_comments')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating comment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to update comment:', error);
    return false;
  }
};

// Deletar um comentário (soft delete)
export const deleteComment = async (
  commentId: string,
  userId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('question_comments')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting comment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return false;
  }
};

// Votar em um comentário (like/dislike)
export const voteComment = async (
  commentId: string,
  userId: string,
  voteType: 'like' | 'dislike'
): Promise<{ success: boolean; action: 'added' | 'changed' | 'removed' }> => {
  try {
    // Verificar se já existe um voto
    const { data: existingVote } = await supabase
      .from('comment_votes')
      .select('id, vote_type')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingVote) {
      // Se o voto é do mesmo tipo, remover (toggle)
      if (existingVote.vote_type === voteType) {
        const { error } = await supabase
          .from('comment_votes')
          .delete()
          .eq('id', existingVote.id);

        if (error) {
          console.error('Error removing vote:', error);
          return { success: false, action: 'removed' };
        }

        return { success: true, action: 'removed' };
      } else {
        // Se o voto é diferente, atualizar
        const { error } = await supabase
          .from('comment_votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);

        if (error) {
          console.error('Error updating vote:', error);
          return { success: false, action: 'changed' };
        }

        return { success: true, action: 'changed' };
      }
    } else {
      // Criar novo voto
      const { error } = await supabase
        .from('comment_votes')
        .insert({
          comment_id: commentId,
          user_id: userId,
          vote_type: voteType,
        });

      if (error) {
        console.error('Error creating vote:', error);
        return { success: false, action: 'added' };
      }

      return { success: true, action: 'added' };
    }
  } catch (error) {
    console.error('Failed to vote:', error);
    return { success: false, action: 'added' };
  }
};

// Contar comentários de uma questão
export const countQuestionComments = async (questionId: number): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('question_comments')
      .select('id', { count: 'exact', head: true })
      .eq('question_id', questionId)
      .eq('is_deleted', false);

    if (error) {
      console.error('Error counting comments:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Failed to count comments:', error);
    return 0;
  }
};

// Helper para formatar tempo relativo
export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;
  if (diffWeek < 4) return `${diffWeek}sem`;
  return `${diffMonth}m`;
};
