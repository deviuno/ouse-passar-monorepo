// Durações disponíveis para podcast (em minutos) - máximo 10 min devido limite da API
export const PODCAST_DURATIONS = [
  { value: 3, label: '3 minutos', description: 'Rápido e direto' },
  { value: 5, label: '5 minutos', description: 'Introdução ao tema' },
  { value: 10, label: '10 minutos', description: 'Episódio completo' },
];

// Estilos musicais disponíveis
export const MUSIC_STYLES = [
  { value: 'pop', label: 'Pop' },
  { value: 'rock', label: 'Rock' },
  { value: 'sertanejo', label: 'Sertanejo' },
  { value: 'funk', label: 'Funk Melody' },
  { value: 'pagode', label: 'Pagode' },
  { value: 'samba', label: 'Samba' },
  { value: 'forro', label: 'Forró' },
  { value: 'mpb', label: 'MPB' },
  { value: 'bossa_nova', label: 'Bossa Nova' },
  { value: 'axe', label: 'Axé' },
  { value: 'rap', label: 'Rap/Hip-Hop' },
  { value: 'trap', label: 'Trap' },
  { value: 'reggae', label: 'Reggae' },
  { value: 'gospel', label: 'Gospel' },
  { value: 'country', label: 'Country' },
  { value: 'folk', label: 'Folk' },
  { value: 'indie', label: 'Indie' },
  { value: 'electronic', label: 'Eletrônica' },
  { value: 'house', label: 'House' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'blues', label: 'Blues' },
  { value: 'classical', label: 'Clássica' },
  { value: 'opera', label: 'Ópera' },
  { value: 'musical', label: 'Musical/Teatro' },
  { value: 'infantil', label: 'Infantil' },
  { value: 'jingle', label: 'Jingle/Comercial' },
];

// Music quality models
export const MUSIC_QUALITY_OPTIONS = [
  { value: 'V5', label: 'Premium (Recomendado)' },
  { value: 'V4_5ALL', label: 'Alta qualidade - Estrutura musical' },
  { value: 'V4_5PLUS', label: 'Alta qualidade - Tons ricos' },
  { value: 'V4_5', label: 'Padrão (até 8 min)' },
  { value: 'V4', label: 'Básico (até 4 min)' },
];
