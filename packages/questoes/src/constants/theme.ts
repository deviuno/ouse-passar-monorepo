// Cores e estilos do tema

export const COLORS = {
  // Brand
  BRAND: '#FFB800',
  BRAND_LIGHT: '#FFD54F',
  BRAND_DARK: '#E6A500',

  // Backgrounds
  BG_MAIN: '#1A1A1A',
  BG_CARD: '#252525',
  BG_ELEVATED: '#2D2D2D',
  BG_OVERLAY: 'rgba(0, 0, 0, 0.7)',

  // Text
  TEXT_MAIN: '#FFFFFF',
  TEXT_SEC: '#A0A0A0',
  TEXT_MUTED: '#6E6E6E',

  // Status
  SUCCESS: '#2ECC71',
  SUCCESS_LIGHT: '#58D68D',
  ERROR: '#E74C3C',
  ERROR_LIGHT: '#EC7063',
  WARNING: '#F39C12',
  INFO: '#3498DB',

  // Mission Status Colors
  MISSION_LOCKED: '#4A4A4A',
  MISSION_AVAILABLE: '#3498DB',
  MISSION_IN_PROGRESS: '#F39C12',
  MISSION_COMPLETED: '#2ECC71',
  MISSION_MASSIFICATION: '#E74C3C',

  // League Colors
  LEAGUE_FERRO: '#6E6E6E',
  LEAGUE_BRONZE: '#CD7F32',
  LEAGUE_PRATA: '#C0C0C0',
  LEAGUE_OURO: '#FFD700',
  LEAGUE_DIAMANTE: '#B9F2FF',
};

export const GRADIENTS = {
  BRAND: 'linear-gradient(135deg, #FFB800 0%, #FFD54F 100%)',
  SUCCESS: 'linear-gradient(135deg, #2ECC71 0%, #58D68D 100%)',
  ERROR: 'linear-gradient(135deg, #E74C3C 0%, #EC7063 100%)',
  DARK: 'linear-gradient(180deg, #252525 0%, #1A1A1A 100%)',
};

export const SHADOWS = {
  SM: '0 1px 2px rgba(0, 0, 0, 0.3)',
  MD: '0 4px 6px rgba(0, 0, 0, 0.4)',
  LG: '0 10px 15px rgba(0, 0, 0, 0.5)',
  XL: '0 20px 25px rgba(0, 0, 0, 0.6)',
  GLOW_BRAND: '0 0 20px rgba(255, 184, 0, 0.4)',
  GLOW_SUCCESS: '0 0 20px rgba(46, 204, 113, 0.4)',
};

export const ANIMATIONS = {
  DURATION_FAST: '150ms',
  DURATION_NORMAL: '300ms',
  DURATION_SLOW: '500ms',
  EASING_DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  EASING_BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// Assets
export const LOGO_URL = 'https://i.ibb.co/dJLPGVb7/ouse-passar-logo-n.webp';
export const DEFAULT_AVATAR_URL = 'https://i.pravatar.cc/150?u=ousepassar';

// Breakpoints
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
};
