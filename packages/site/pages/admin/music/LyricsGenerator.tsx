import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, Loader2, Copy, Check, Music, RefreshCw,
  Play, Pause, Download, AlertCircle, Volume2, Sparkles,
  Trash2, CheckCircle, Mic, Clock, VolumeX
} from 'lucide-react';
import { musicAdminService } from '../../../services/musicAdminService';
import { questionGeneratorService } from '../../../services/questionGeneratorService';
import { useAuth } from '../../../hooks/useAuth';
import {
  SearchableSelect,
  AudioPlayer,
  PODCAST_DURATIONS,
  MUSIC_STYLES,
  MUSIC_QUALITY_OPTIONS,
  AudioType,
  SunoTrack,
  MusicStatusResponse,
} from '../../../components/admin/music/lyrics-generator';

// ==================== COMPONENTE PRINCIPAL ====================

export const MusicLyricsGenerator: React.FC = () => {
  // Auth hook for getting current preparatorio
  const { currentPreparatorio } = useAuth();

  // Form state
  const [audioType, setAudioType] = useState<AudioType>('musica');
  const [materia, setMateria] = useState('');
  const [assunto, setAssunto] = useState('');
  const [estilo, setEstilo] = useState('pop');
  const [duracao, setDuracao] = useState(10); // Duração do podcast em minutos
  const [customTopic, setCustomTopic] = useState('');
  const [sunoModel, setSunoModel] = useState('V5');
  const [musicTitle, setMusicTitle] = useState('');

  // Data state
  const [materias, setMaterias] = useState<string[]>([]);
  const [assuntos, setAssuntos] = useState<string[]>([]);

  // Store initial assunto from URL to prevent reset
  const initialAssuntoRef = useRef<string | null>(null);

  // Loading states
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingAssuntos, setLoadingAssuntos] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [generatedLyrics, setGeneratedLyrics] = useState('');
  const [generatedPodcastScript, setGeneratedPodcastScript] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Music generation state
  const [generatingMusic, setGeneratingMusic] = useState(false);
  const [musicTaskId, setMusicTaskId] = useState<string | null>(null);
  const [musicStatus, setMusicStatus] = useState<string>('');
  const [musicStatusLabel, setMusicStatusLabel] = useState<string>('');
  const [generatedTracks, setGeneratedTracks] = useState<SunoTrack[]>([]);
  const [musicError, setMusicError] = useState('');

  // Podcast audio state
  const [generatingPodcastAudio, setGeneratingPodcastAudio] = useState(false);
  const [podcastAudioUrl, setPodcastAudioUrl] = useState<string | null>(null);
  const [podcastAudioError, setPodcastAudioError] = useState('');
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [podcastCurrentTime, setPodcastCurrentTime] = useState(0);
  const [podcastDuration, setPodcastDuration] = useState(0);
  const [showDeletePodcastConfirm, setShowDeletePodcastConfirm] = useState(false);
  const [approvingPodcast, setApprovingPodcast] = useState(false);
  const [podcastApproved, setPodcastApproved] = useState(false);
  const podcastAudioRef = useRef<HTMLAudioElement>(null);

  // Preparatorio state (for approving tracks)
  const [preparatorioId, setPreparatorioId] = useState<string | null>(null);

  // Audio request state (when generating from a student request)
  const [fromRequestId, setFromRequestId] = useState<string | null>(null);

  // Polling ref
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const MASTRA_URL = import.meta.env.VITE_MASTRA_URL || 'http://localhost:4000';

  // Sync preparatorioId with currentPreparatorio from useAuth
  useEffect(() => {
    if (currentPreparatorio?.id && !preparatorioId) {
      setPreparatorioId(currentPreparatorio.id);
    }
  }, [currentPreparatorio, preparatorioId]);

  // Load filters and URL params on mount
  useEffect(() => {
    loadFilters();
    // Get params from URL (can override currentPreparatorio)
    const urlParams = new URLSearchParams(window.location.search);
    const prepId = urlParams.get('preparatorio_id');
    if (prepId) {
      setPreparatorioId(prepId);
    }

    // Check if coming from an audio request
    const requestId = urlParams.get('fromRequest');
    if (requestId) {
      setFromRequestId(requestId);

      // Pre-fill form with request data
      const requestAudioType = urlParams.get('audioType');
      if (requestAudioType === 'music') {
        setAudioType('musica');
      } else if (requestAudioType === 'podcast') {
        setAudioType('podcast');
      }

      const requestMateria = urlParams.get('materia');
      if (requestMateria) {
        setMateria(requestMateria);
      }

      const requestAssunto = urlParams.get('assunto');
      if (requestAssunto) {
        initialAssuntoRef.current = requestAssunto;
        setAssunto(requestAssunto);
      }

      const requestEstilo = urlParams.get('estilo');
      if (requestEstilo) {
        setEstilo(requestEstilo);
      }

      const requestDuracao = urlParams.get('duracao');
      if (requestDuracao) {
        setDuracao(parseInt(requestDuracao, 10));
      }

      const requestTopico = urlParams.get('topico');
      if (requestTopico) {
        setCustomTopic(requestTopico);
      }
    }
  }, []);

  // Load assuntos when materia changes
  useEffect(() => {
    if (materia) {
      loadAssuntos(materia).then(() => {
        // Restore initial assunto from URL if it was set
        if (initialAssuntoRef.current) {
          setAssunto(initialAssuntoRef.current);
          initialAssuntoRef.current = null; // Clear after using
        }
      });
    } else {
      setAssuntos([]);
      setAssunto('');
    }
  }, [materia]);

  // Auto-generate title based on materia/assunto
  useEffect(() => {
    if (!musicTitle && (materia || assunto)) {
      const title = assunto || materia;
      setMusicTitle(title ? `${title} - Estudando com Música` : '');
    }
  }, [materia, assunto, musicTitle]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const loadFilters = async () => {
    try {
      setLoadingFilters(true);
      const result = await questionGeneratorService.getFilters();
      setMaterias(result.materias || []);
    } catch (err) {
      console.error('Error loading filters:', err);
    } finally {
      setLoadingFilters(false);
    }
  };

  const loadAssuntos = async (selectedMateria: string) => {
    try {
      setLoadingAssuntos(true);
      const result = await questionGeneratorService.getAssuntos(selectedMateria);
      setAssuntos(result.assuntos || []);
    } catch (err) {
      console.error('Error loading assuntos:', err);
      setAssuntos([]);
    } finally {
      setLoadingAssuntos(false);
    }
  };

  const handleGenerate = async () => {
    if (!materia && !customTopic) {
      setError('Selecione uma matéria ou informe um tópico personalizado.');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedLyrics('');
    setGeneratedPodcastScript('');
    setGeneratedTracks([]);
    setMusicTaskId(null);
    setMusicError('');

    try {
      if (audioType === 'musica') {
        // Generate music lyrics
        const response = await fetch(`${MASTRA_URL}/api/music/generate-lyrics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            materia: materia || undefined,
            assunto: assunto || undefined,
            estilo,
            customTopic: customTopic || undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao gerar letra');
        }

        const data = await response.json();
        setGeneratedLyrics(data.lyrics);
      } else {
        // Generate podcast script
        const response = await fetch(`${MASTRA_URL}/api/music/generate-podcast-script`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            materia: materia || undefined,
            assunto: assunto || undefined,
            duracao,
            customTopic: customTopic || undefined,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao gerar roteiro');
        }

        const data = await response.json();
        setGeneratedPodcastScript(data.script);
      }
    } catch (err: any) {
      console.error('Error generating:', err);
      setError(err.message || `Erro ao gerar ${audioType === 'musica' ? 'letra' : 'roteiro'}. Tente novamente.`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-save a track to database (as inactive)
  const autoSaveTrack = async (track: SunoTrack) => {
    try {
      // Get duration from audio
      const getAudioDuration = (url: string): Promise<number> => {
        return new Promise((resolve) => {
          const audio = new Audio();
          audio.addEventListener('loadedmetadata', () => {
            resolve(Math.round(audio.duration));
          });
          audio.addEventListener('error', () => resolve(0));
          audio.src = url;
        });
      };

      const duration = await getAudioDuration(track.audioUrl || track.streamAudioUrl);
      const trackTitle = track.title || musicTitle;

      // If this is from a student request, use completeAudioRequest to notify them
      if (fromRequestId) {
        const savedTrack = await musicAdminService.createTrack(preparatorioId || undefined, {
          title: trackTitle,
          artist: 'Ouse Passar IA',
          audio_url: track.audioUrl || track.streamAudioUrl,
          cover_url: track.imageUrl || undefined,
          duration_seconds: duration || track.duration || 0,
          is_podcast: false,
          materia: materia || undefined,
          assunto: assunto || undefined,
        });

        // Complete the request and notify the student
        await musicAdminService.completeAudioRequest(fromRequestId, savedTrack.id, trackTitle);
        console.log('[LyricsGenerator] Música salva e aluno notificado:', trackTitle);

        // Clear the request ID after first track is saved (only one notification)
        setFromRequestId(null);
      } else {
        await musicAdminService.createTrack(preparatorioId || undefined, {
          title: trackTitle,
          artist: 'Ouse Passar IA',
          audio_url: track.audioUrl || track.streamAudioUrl,
          cover_url: track.imageUrl || undefined,
          duration_seconds: duration || track.duration || 0,
          is_podcast: false,
          materia: materia || undefined,
          assunto: assunto || undefined,
        });
        console.log('[LyricsGenerator] Música auto-salva (inativa):', trackTitle);
      }

      return true;
    } catch (err: any) {
      console.error('Error auto-saving track:', err);
      return false;
    }
  };

  const checkMusicStatus = useCallback(async (taskId: string) => {
    try {
      const response = await fetch(`${MASTRA_URL}/api/music/status/${taskId}`);
      const data: MusicStatusResponse = await response.json();

      if (!data.success) {
        throw new Error(data.errorMessage || 'Erro ao verificar status');
      }

      setMusicStatus(data.status);
      setMusicStatusLabel(data.statusLabel);

      if (data.isComplete) {
        // Stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setGeneratingMusic(false);

        if (data.isFailed) {
          setMusicError(data.errorMessage || `Geração falhou: ${data.status}`);
        } else {
          setGeneratedTracks(data.tracks);

          // Auto-save all generated tracks as inactive
          for (const track of data.tracks) {
            await autoSaveTrack(track);
          }
          console.log(`[LyricsGenerator] ${data.tracks.length} faixas salvas automaticamente`);
        }
      }
    } catch (err: any) {
      console.error('Error checking music status:', err);
      setMusicError(err.message || 'Erro ao verificar status');
      setGeneratingMusic(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [MASTRA_URL, musicTitle, preparatorioId, materia, assunto, fromRequestId]);

  const handleGenerateMusic = async () => {
    if (!generatedLyrics) {
      setMusicError('Gere a letra primeiro antes de criar a música.');
      return;
    }

    if (!musicTitle.trim()) {
      setMusicError('Informe um título para a música.');
      return;
    }

    setGeneratingMusic(true);
    setMusicError('');
    setGeneratedTracks([]);
    setMusicStatus('');
    setMusicStatusLabel('');

    try {
      // Get the style label
      const styleLabel = MUSIC_STYLES.find(s => s.value === estilo)?.label || 'Pop';

      const response = await fetch(`${MASTRA_URL}/api/music/generate-music`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lyrics: generatedLyrics,
          style: styleLabel,
          title: musicTitle.trim(),
          model: sunoModel,
          instrumental: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao iniciar geração');
      }

      const data = await response.json();
      setMusicTaskId(data.taskId);
      setMusicStatusLabel('Iniciando geração...');

      // Start polling
      pollingIntervalRef.current = setInterval(() => {
        checkMusicStatus(data.taskId);
      }, 5000); // Poll every 5 seconds

      // Initial check
      setTimeout(() => checkMusicStatus(data.taskId), 2000);

    } catch (err: any) {
      console.error('Error generating music:', err);
      setMusicError(err.message || 'Erro ao gerar música. Tente novamente.');
      setGeneratingMusic(false);
    }
  };

  // Handle approving a track (save to music_tracks table)
  const handleApproveTrack = async (trackId: string) => {
    const track = generatedTracks.find(t => t.id === trackId);
    if (!track) return;

    try {
      // Get duration from audio
      const getAudioDuration = (url: string): Promise<number> => {
        return new Promise((resolve) => {
          const audio = new Audio();
          audio.addEventListener('loadedmetadata', () => {
            resolve(Math.round(audio.duration));
          });
          audio.addEventListener('error', () => resolve(0));
          audio.src = url;
        });
      };

      const duration = await getAudioDuration(track.audioUrl || track.streamAudioUrl);

      // Save to music_tracks table
      await musicAdminService.createTrack(preparatorioId || undefined, {
        title: track.title || musicTitle,
        artist: 'Ouse Passar IA',
        audio_url: track.audioUrl || track.streamAudioUrl,
        cover_url: track.imageUrl || undefined,
        duration_seconds: duration || track.duration || 0,
        is_podcast: false,
        materia: materia || undefined,
        assunto: assunto || undefined,
      });

      console.log('[LyricsGenerator] Música aprovada e salva (inativa):', track.title);
    } catch (err: any) {
      console.error('Error approving track:', err);
      setMusicError(err.message || 'Erro ao aprovar música');
      throw err;
    }
  };

  // Handle deleting a track from the list
  const handleDeleteTrack = (trackId: string) => {
    setGeneratedTracks(prev => prev.filter(t => t.id !== trackId));
  };

  const handleCopy = async () => {
    try {
      const contentToCopy = audioType === 'musica' ? generatedLyrics : generatedPodcastScript;
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying:', err);
    }
  };

  // Generate podcast audio using Gemini TTS
  const handleGeneratePodcastAudio = async () => {
    if (!generatedPodcastScript) {
      setPodcastAudioError('Gere o roteiro primeiro antes de criar o áudio.');
      return;
    }

    setGeneratingPodcastAudio(true);
    setPodcastAudioError('');
    setPodcastAudioUrl(null);
    setPodcastApproved(false);

    try {
      const response = await fetch(`${MASTRA_URL}/api/music/generate-podcast-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: generatedPodcastScript,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar áudio');
      }

      const data = await response.json();

      if (data.success && data.audio) {
        // Create a blob URL from base64 audio
        const audioBlob = base64ToBlob(data.audio, 'audio/wav');
        const audioUrl = URL.createObjectURL(audioBlob);
        setPodcastAudioUrl(audioUrl);
        console.log('[LyricsGenerator] Podcast audio generated successfully');

        // Auto-save podcast to database
        // Note: Using data URL for storage (blob URLs don't persist)
        const dataUrl = `data:audio/wav;base64,${data.audio}`;

        try {
          const title = `Ouse Passar Podcast - ${materia || assunto || 'Episódio'}`;

          // If this is from a student request, use completeAudioRequest to notify them
          if (fromRequestId) {
            const savedTrack = await musicAdminService.createTrack(preparatorioId || undefined, {
              title,
              artist: 'Diego & Glau',
              audio_url: dataUrl,
              cover_url: undefined,
              duration_seconds: 0,
              is_podcast: true,
              materia: materia || 'Geral',
              assunto: assunto || 'Conteúdo Geral',
            });

            // Complete the request and notify the student
            await musicAdminService.completeAudioRequest(fromRequestId, savedTrack.id, title);
            console.log('[LyricsGenerator] Podcast salvo e aluno notificado:', title);

            // Clear the request ID
            setFromRequestId(null);
          } else {
            await musicAdminService.createTrack(preparatorioId || undefined, {
              title,
              artist: 'Diego & Glau',
              audio_url: dataUrl, // Using data URL for persistence
              cover_url: undefined,
              duration_seconds: 0, // Will be updated when metadata loads
              is_podcast: true,
              materia: materia || 'Geral',
              assunto: assunto || 'Conteúdo Geral',
            });
            console.log('[LyricsGenerator] Podcast auto-salvo (inativo):', title);
          }

          setPodcastApproved(true); // Mark as saved
        } catch (saveErr: any) {
          console.error('Error auto-saving podcast:', saveErr);
          // Don't fail the whole operation if save fails
        }
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (err: any) {
      console.error('Error generating podcast audio:', err);
      setPodcastAudioError(err.message || 'Erro ao gerar áudio. Tente novamente.');
    } finally {
      setGeneratingPodcastAudio(false);
    }
  };

  // Helper function to convert base64 to Blob
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  // Toggle podcast audio playback
  const togglePodcastPlay = () => {
    if (!podcastAudioRef.current) return;

    if (isPlayingPodcast) {
      podcastAudioRef.current.pause();
    } else {
      podcastAudioRef.current.play();
    }
    setIsPlayingPodcast(!isPlayingPodcast);
  };

  // Download podcast audio
  const handleDownloadPodcastAudio = () => {
    if (!podcastAudioUrl) return;

    const a = document.createElement('a');
    a.href = podcastAudioUrl;
    a.download = `ouse-passar-podcast-${materia || 'audio'}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Handle podcast time update
  const handlePodcastTimeUpdate = () => {
    if (podcastAudioRef.current) {
      setPodcastCurrentTime(podcastAudioRef.current.currentTime);
    }
  };

  // Handle podcast loaded metadata
  const handlePodcastLoadedMetadata = () => {
    if (podcastAudioRef.current) {
      setPodcastDuration(podcastAudioRef.current.duration);
    }
  };

  // Handle podcast seek
  const handlePodcastSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (podcastAudioRef.current) {
      podcastAudioRef.current.currentTime = time;
      setPodcastCurrentTime(time);
    }
  };

  // Delete podcast audio
  const handleDeletePodcast = () => {
    setPodcastAudioUrl(null);
    setPodcastApproved(false);
    setPodcastCurrentTime(0);
    setPodcastDuration(0);
    setIsPlayingPodcast(false);
    setShowDeletePodcastConfirm(false);
  };

  // Approve podcast (save to music_tracks)
  const handleApprovePodcast = async () => {
    if (!podcastAudioUrl) {
      setPodcastAudioError('Gere o áudio primeiro antes de aprovar.');
      return;
    }

    setApprovingPodcast(true);
    setPodcastAudioError('');

    try {
      // We need to upload the blob to storage first or pass the URL
      // For now, we'll save the blob URL and let the admin decide
      const title = `Ouse Passar Podcast - ${materia || assunto || 'Episódio'}`;
      const categoryMateria = materia || 'Geral';
      const categoryAssunto = assunto || 'Conteúdo Geral';

      await musicAdminService.createTrack(preparatorioId || undefined, {
        title,
        artist: 'Diego & Glau',
        audio_url: podcastAudioUrl, // This is a blob URL - will need backend upload
        cover_url: undefined,
        duration_seconds: Math.round(podcastDuration),
        is_podcast: true,
        materia: categoryMateria,
        assunto: categoryAssunto,
      });

      setPodcastApproved(true);
      console.log('[LyricsGenerator] Podcast aprovado e salvo (inativo):', title);
    } catch (err: any) {
      console.error('Error approving podcast:', err);
      setPodcastAudioError(err.message || 'Erro ao aprovar podcast');
    } finally {
      setApprovingPodcast(false);
    }
  };

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setMateria('');
    setAssunto('');
    setEstilo('pop');
    setDuracao(10);
    setCustomTopic('');
    setGeneratedLyrics('');
    setGeneratedPodcastScript('');
    setError('');
    setMusicTitle('');
    setGeneratedTracks([]);
    setMusicTaskId(null);
    setMusicError('');
    setMusicStatus('');
    setMusicStatusLabel('');
    setPodcastAudioUrl(null);
    setPodcastAudioError('');
    setIsPlayingPodcast(false);
    setPodcastCurrentTime(0);
    setPodcastDuration(0);
    setPodcastApproved(false);
    setShowDeletePodcastConfirm(false);

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Request Banner */}
      {fromRequestId && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-blue-400 font-medium">Gerando a partir de solicitacao de aluno</p>
            <p className="text-gray-400 text-sm">
              Ao salvar, o aluno sera notificado automaticamente e o audio ficara disponivel para todos.
            </p>
          </div>
          <a
            href="/admin/music/solicitacoes"
            className="text-gray-400 hover:text-white text-sm underline"
          >
            Ver solicitacoes
          </a>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Wand2 className="w-7 h-7 text-brand-yellow" />
            Gerador de Áudio
          </h1>
          <p className="text-gray-400 mt-1">
            {audioType === 'musica'
              ? 'Gere letras de músicas educativas e transforme em áudio com IA usando o Suno.'
              : 'Gere roteiros de podcast educativos com IA e transforme em áudio.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-brand-card border border-white/5 rounded-lg p-6 space-y-5">
          <h2 className="text-lg font-bold text-white mb-4">Configurações</h2>

          {/* Tipo de Áudio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Tipo de Áudio
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setAudioType('musica');
                  setGeneratedPodcastScript('');
                }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${audioType === 'musica'
                  ? 'bg-brand-yellow text-brand-dark border-brand-yellow font-bold'
                  : 'bg-brand-dark text-gray-300 border-white/10 hover:border-white/20'
                  }`}
              >
                <Music className="w-5 h-5" />
                Música
              </button>
              <button
                type="button"
                onClick={() => {
                  setAudioType('podcast');
                  setGeneratedLyrics('');
                }}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${audioType === 'podcast'
                  ? 'bg-brand-yellow text-brand-dark border-brand-yellow font-bold'
                  : 'bg-brand-dark text-gray-300 border-white/10 hover:border-white/20'
                  }`}
              >
                <Mic className="w-5 h-5" />
                Podcast
              </button>
            </div>
          </div>

          {/* Matéria */}
          <SearchableSelect
            label="Matéria"
            items={materias}
            value={materia}
            onChange={(val) => {
              setMateria(val);
              setAssunto(''); // Reset assunto when materia changes
              setMusicTitle(''); // Reset title to regenerate
            }}
            placeholder="Selecione uma matéria..."
            isLoading={loadingFilters}
            allowCustom
            customLabel="Adicionar matéria"
          />

          {/* Assunto */}
          <SearchableSelect
            label="Assunto (opcional)"
            items={assuntos}
            value={assunto}
            onChange={(val) => {
              setAssunto(val);
              setMusicTitle(''); // Reset title to regenerate
            }}
            placeholder={materia ? "Selecione um assunto..." : "Selecione uma matéria primeiro"}
            isLoading={loadingAssuntos}
            disabled={!materia}
            allowCustom
            customLabel="Adicionar assunto"
          />

          {/* Estilo Musical (only for music) */}
          {audioType === 'musica' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estilo Musical
              </label>
              <select
                value={estilo}
                onChange={(e) => setEstilo(e.target.value)}
                className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-yellow/50"
              >
                {MUSIC_STYLES.map((style) => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Duração do Podcast (only for podcast) */}
          {audioType === 'podcast' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Duração do Podcast
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PODCAST_DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDuracao(d.value)}
                    className={`flex flex-col items-center justify-center px-3 py-3 rounded-lg border transition-all ${duracao === d.value
                      ? 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow'
                      : 'bg-brand-dark text-gray-300 border-white/10 hover:border-white/20'
                      }`}
                  >
                    <div className="flex items-center gap-1 font-medium">
                      <Clock className="w-4 h-4" />
                      {d.label}
                    </div>
                    <span className="text-xs text-gray-500 mt-1">{d.description}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                O Ouse Passar Podcast é apresentado por Diego (técnico) e Glau (dinâmica) - uma conversa natural e educativa.
              </p>
            </div>
          )}

          {/* Tópico Personalizado */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tópico Personalizado (opcional)
            </label>
            <textarea
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder={
                audioType === 'musica'
                  ? 'Descreva um tópico específico que deseja abordar na música...'
                  : 'Descreva um tópico específico que deseja abordar no podcast...'
              }
              rows={3}
              className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow/50 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading || (!materia && !customTopic)}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-yellow hover:bg-brand-yellow/90 disabled:bg-brand-yellow/50 disabled:cursor-not-allowed text-brand-dark font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {audioType === 'musica' ? 'Gerando Letra...' : 'Gerando Roteiro...'}
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  {audioType === 'musica' ? 'Gerar Letra' : 'Gerar Roteiro'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="space-y-6">
          {/* Content Card (Lyrics or Podcast Script) */}
          <div className="bg-brand-card border border-white/5 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {audioType === 'musica' ? (
                  <>
                    <Music className="w-5 h-5 text-brand-yellow" />
                    Letra Gerada
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 text-brand-yellow" />
                    Roteiro do Podcast
                  </>
                )}
              </h2>

              {(generatedLyrics || generatedPodcastScript) && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Editable textarea for lyrics/script */}
            <div className="relative">
              <textarea
                value={audioType === 'musica' ? generatedLyrics : generatedPodcastScript}
                onChange={(e) => {
                  if (audioType === 'musica') {
                    setGeneratedLyrics(e.target.value);
                  } else {
                    setGeneratedPodcastScript(e.target.value);
                  }
                }}
                placeholder={
                  audioType === 'musica'
                    ? 'Configure as opções e clique em "Gerar Letra" ou cole uma letra existente aqui...'
                    : 'Configure as opções e clique em "Gerar Roteiro" ou cole um roteiro existente aqui...\n\nO roteiro será um diálogo entre Diego e Glau'
                }
                className="w-full bg-brand-dark border border-white/10 rounded-lg p-4 min-h-[300px] max-h-[500px] text-gray-300 placeholder-gray-600 text-sm leading-relaxed font-sans resize-y focus:outline-none focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow/20"
              />
              {/* Helper text */}
              <div className="absolute bottom-2 right-2 text-xs text-gray-600">
                {audioType === 'musica' ? (
                  generatedLyrics ? `${generatedLyrics.length} caracteres` : 'Cole ou gere uma letra'
                ) : (
                  generatedPodcastScript ? `${generatedPodcastScript.length} caracteres` : 'Cole ou gere um roteiro'
                )}
              </div>
            </div>

            {/* Info about editing */}
            {((audioType === 'musica' && generatedLyrics) || (audioType === 'podcast' && generatedPodcastScript)) && (
              <p className="text-xs text-gray-500 mt-2">
                Você pode editar o texto acima antes de gerar o áudio, ou colar um conteúdo próprio.
              </p>
            )}
          </div>

          {/* Music Generation Card (only for music type) */}
          {audioType === 'musica' && generatedLyrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand-card border border-white/5 rounded-lg p-6"
            >
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-brand-yellow" />
                Gerar Música
              </h2>

              {/* Music Generation Form */}
              <div className="space-y-4 mb-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Título da Música
                  </label>
                  <input
                    type="text"
                    value={musicTitle}
                    onChange={(e) => setMusicTitle(e.target.value)}
                    placeholder="Ex: Direito Constitucional - A Música"
                    className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow/50"
                  />
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Qualidade do Áudio
                  </label>
                  <select
                    value={sunoModel}
                    onChange={(e) => setSunoModel(e.target.value)}
                    className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-yellow/50"
                  >
                    {MUSIC_QUALITY_OPTIONS.map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Music Error */}
              {musicError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm mb-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{musicError}</span>
                </div>
              )}

              {/* Generation Status */}
              {generatingMusic && (
                <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-brand-yellow animate-spin" />
                    <div>
                      <p className="text-brand-yellow font-medium flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        Compondo sua música educativa...
                      </p>
                      <p className="text-gray-400 text-sm mt-0.5">
                        {musicStatusLabel || 'Aguarde enquanto a música é produzida...'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-brand-yellow"
                        initial={{ width: '10%' }}
                        animate={{
                          width: musicStatus === 'PENDING' ? '20%'
                            : musicStatus === 'TEXT_SUCCESS' ? '50%'
                              : musicStatus === 'FIRST_SUCCESS' ? '75%'
                                : '90%'
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                      Tempo estimado: 2-3 minutos. A página verificará automaticamente.
                    </p>
                  </div>
                </div>
              )}

              {/* Generated Tracks */}
              {generatedTracks.length > 0 && (
                <div className="space-y-3 mb-4">
                  <h3 className="text-sm font-medium text-gray-400">
                    Músicas geradas ({generatedTracks.length} faixas):
                  </h3>
                  {generatedTracks.map((track, index) => (
                    <AudioPlayer
                      key={track.id}
                      track={track}
                      index={index}
                      materia={materia}
                      assunto={assunto}
                      preparatorioId={preparatorioId || undefined}
                      onDelete={handleDeleteTrack}
                      autoSaved={true}
                    />
                  ))}
                </div>
              )}

              {/* Generate Button */}
              {!generatingMusic && generatedTracks.length === 0 && (
                <button
                  onClick={handleGenerateMusic}
                  disabled={!musicTitle.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all"
                >
                  <Volume2 className="w-5 h-5" />
                  Gerar Música
                </button>
              )}

              {/* Regenerate Button */}
              {generatedTracks.length > 0 && (
                <button
                  onClick={handleGenerateMusic}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Gerar Novas Versões
                </button>
              )}

              {/* Info */}
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-xs">
                  <strong>Nota:</strong> Cada geração cria 2 versões da música. O processo leva cerca de 2-3 minutos.
                </p>
              </div>
            </motion.div>
          )}

          {/* Podcast Audio Generation Card (only for podcast type) */}
          {audioType === 'podcast' && generatedPodcastScript && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand-card border border-white/5 rounded-lg p-6"
            >
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Volume2 className="w-5 h-5 text-brand-yellow" />
                Gerar Áudio do Podcast
              </h2>

              {/* Audio element */}
              {podcastAudioUrl && (
                <audio
                  ref={podcastAudioRef}
                  src={podcastAudioUrl}
                  onEnded={() => setIsPlayingPodcast(false)}
                />
              )}

              {/* Error Message */}
              {podcastAudioError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm mb-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{podcastAudioError}</span>
                </div>
              )}

              {/* Generation Status */}
              {generatingPodcastAudio && (
                <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-brand-yellow animate-spin" />
                    <div>
                      <p className="text-brand-yellow font-medium flex items-center gap-2">
                        <VolumeX className="w-4 h-4" />
                        Silêncio! Diego e Glau estão gravando o Ouse Passar Podcast!
                      </p>
                      <p className="text-gray-400 text-sm mt-0.5">
                        Aguarde enquanto o episódio é produzido...
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-brand-yellow"
                        initial={{ width: '10%' }}
                        animate={{ width: '90%' }}
                        transition={{ duration: 30, ease: 'linear' }}
                      />
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                      O processo pode levar alguns minutos dependendo da duração do roteiro.
                    </p>
                  </div>
                </div>
              )}

              {/* Generated Audio Player - Standardized like music player */}
              {podcastAudioUrl && !generatingPodcastAudio && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-brand-dark border border-white/10 rounded-lg p-4 mb-4"
                >
                  <audio
                    ref={podcastAudioRef}
                    src={podcastAudioUrl}
                    onTimeUpdate={handlePodcastTimeUpdate}
                    onLoadedMetadata={handlePodcastLoadedMetadata}
                    onEnded={() => setIsPlayingPodcast(false)}
                  />

                  {/* Header with cover and info */}
                  <div className="flex items-start gap-4">
                    {/* Cover Image */}
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-pink-600/30">
                        <Mic className="w-8 h-8 text-gray-400" />
                      </div>
                      <button
                        onClick={togglePodcastPlay}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                      >
                        {isPlayingPodcast ? (
                          <Pause className="w-8 h-8 text-white" />
                        ) : (
                          <Play className="w-8 h-8 text-white" />
                        )}
                      </button>
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">
                        Ouse Passar Podcast - {materia || assunto || 'Episódio'}
                      </h4>
                      <p className="text-gray-500 text-sm mt-0.5">
                        Diego & Glau - {formatTime(podcastDuration)}
                      </p>

                      {/* Progress Bar */}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-gray-500 w-10">{formatTime(podcastCurrentTime)}</span>
                        <input
                          type="range"
                          min={0}
                          max={podcastDuration || 100}
                          value={podcastCurrentTime}
                          onChange={handlePodcastSeek}
                          className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-3
                            [&::-webkit-slider-thumb]:h-3
                            [&::-webkit-slider-thumb]:bg-brand-yellow
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <span className="text-xs text-gray-500 w-10 text-right">{formatTime(podcastDuration)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions - Full width row below */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                    <button
                      onClick={togglePodcastPlay}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-yellow text-brand-dark text-sm font-medium rounded-lg hover:bg-brand-yellow/90 transition-colors"
                    >
                      {isPlayingPodcast ? <Pause size={14} /> : <Play size={14} />}
                      {isPlayingPodcast ? 'Pausar' : 'Tocar'}
                    </button>

                    <button
                      onClick={handleDownloadPodcastAudio}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-gray-300 text-sm font-medium rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Download size={14} />
                      Baixar
                    </button>

                    {/* Saved Status */}
                    {podcastApproved && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 text-green-400 text-sm font-medium rounded-lg">
                        <CheckCircle size={14} />
                        Salvo
                      </span>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={() => setShowDeletePodcastConfirm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 text-red-400 text-sm font-medium rounded-lg hover:bg-red-600/30 transition-colors"
                    >
                      <Trash2 size={14} />
                      Excluir
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Delete Confirmation Modal */}
              <AnimatePresence>
                {showDeletePodcastConfirm && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
                    onClick={() => setShowDeletePodcastConfirm(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-brand-card border border-white/10 rounded-lg p-6 max-w-md mx-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                          <Trash2 className="w-5 h-5 text-red-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Excluir Podcast</h3>
                      </div>
                      <p className="text-gray-400 mb-6">
                        Tem certeza que deseja excluir este áudio do podcast? Esta ação não pode ser desfeita.
                      </p>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setShowDeletePodcastConfirm(false)}
                          className="px-4 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleDeletePodcast}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generate Button */}
              {!generatingPodcastAudio && !podcastAudioUrl && (
                <button
                  onClick={handleGeneratePodcastAudio}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-6 rounded-lg transition-all"
                >
                  <Volume2 className="w-5 h-5" />
                  Gerar Áudio do Podcast
                </button>
              )}

              {/* Regenerate Button */}
              {podcastAudioUrl && !generatingPodcastAudio && (
                <button
                  onClick={() => {
                    handleDeletePodcast();
                    // Will show generate button after deleting
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Gerar Novo Áudio
                </button>
              )}

              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-400 text-xs">
                  <strong>Sobre o podcast:</strong> O "Ouse Passar Podcast" é apresentado por
                  Diego (voz masculina) e Glau (voz feminina) em um formato de conversa natural e educativa.
                  O áudio é gerado em formato WAV de alta qualidade.
                </p>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MusicLyricsGenerator;
