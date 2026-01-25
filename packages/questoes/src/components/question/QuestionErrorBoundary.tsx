import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  children: ReactNode;
  onSkip?: () => void;
  onRetry?: () => void;
  questionId?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isSkipping: boolean;
}

/**
 * Error Boundary para questões
 * Captura erros de renderização e automaticamente pula para a próxima questão
 * O usuário nunca vê questões problemáticas
 */
class QuestionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isSkipping: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[QuestionErrorBoundary] Erro ao renderizar questão:', {
      questionId: this.props.questionId,
      error: error.message,
      stack: errorInfo.componentStack
    });

    // Automatically skip to next question after a brief delay
    if (this.props.onSkip) {
      this.setState({ isSkipping: true });
      setTimeout(() => {
        this.setState({ hasError: false, error: null, isSkipping: false });
        this.props.onSkip?.();
      }, 500);
    }
  }

  public componentDidUpdate(prevProps: Props) {
    // Reset error state when question changes
    if (prevProps.questionId !== this.props.questionId && this.state.hasError) {
      this.setState({ hasError: false, error: null, isSkipping: false });
    }
  }

  public render() {
    if (this.state.hasError || this.state.isSkipping) {
      // Show a brief loading indicator while skipping
      return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
          <Loader2 className="w-8 h-8 text-[var(--color-brand)] animate-spin" />
          <p className="text-[var(--color-text-sec)] mt-4 text-sm">
            Carregando próxima questão...
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default QuestionErrorBoundary;
