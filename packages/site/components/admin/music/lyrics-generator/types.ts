// Tipos de áudio disponíveis
export type AudioType = 'musica' | 'podcast';

export interface SunoTrack {
  id: string;
  audioUrl: string;
  streamAudioUrl: string;
  imageUrl: string;
  prompt: string;
  modelName: string;
  title: string;
  tags: string;
  createTime: string;
  duration: number;
}

export interface MusicStatusResponse {
  success: boolean;
  taskId: string;
  status: string;
  statusLabel: string;
  isComplete: boolean;
  isFailed: boolean;
  tracks: SunoTrack[];
  errorMessage: string | null;
}

export interface SearchableSelectProps {
  label: string;
  items: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  allowCustom?: boolean;
  customLabel?: string;
}

export interface AudioPlayerProps {
  track: SunoTrack;
  index: number;
  materia?: string;
  assunto?: string;
  preparatorioId?: string;
  onDelete?: (trackId: string) => void;
  autoSaved?: boolean;
}
