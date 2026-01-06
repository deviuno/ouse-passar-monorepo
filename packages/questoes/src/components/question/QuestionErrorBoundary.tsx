import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, SkipForward } from 'lucide-react';

interface Props {
  children: ReactNode;
  onSkip?: () => void;
  onRetry?: () => void;
  questionId?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary para questões
 * Captura erros de renderização e mostra uma UI amigável
 * em vez de quebrar toda a aplicação
 */
class QuestionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[QuestionErrorBoundary] Erro ao renderizar questão:', {
      questionId: this.props.questionId,
      error: error.message,
      stack: errorInfo.componentStack
    });
  }

  public componentDidUpdate(prevProps: Props) {
    // Reset error state when question changes
    if (prevProps.questionId !== this.props.questionId && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  private handleSkip = () => {
    this.setState({ hasError: false, error: null });
    this.props.onSkip?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-[#1A1A1A] rounded-2xl border border-red-500/30">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>

          <h3 className="text-lg font-bold text-white mb-2">
            Questão com problema
          </h3>

          <p className="text-gray-400 text-center mb-6 max-w-md">
            Esta questão possui um problema de formatação e não pode ser exibida corretamente.
            {this.props.questionId && (
              <span className="block text-xs text-gray-500 mt-2">
                ID da questão: {this.props.questionId}
              </span>
            )}
          </p>

          <div className="flex gap-3">
            {this.props.onRetry && (
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
                Tentar novamente
              </button>
            )}

            {this.props.onSkip && (
              <button
                onClick={this.handleSkip}
                className="flex items-center gap-2 px-4 py-2 bg-[#FFB800] hover:bg-[#FFC933] text-black font-bold rounded-lg transition-colors"
              >
                <SkipForward size={16} />
                Pular questão
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default QuestionErrorBoundary;
