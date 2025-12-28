/**
 * Serviço de Cache de Áudio
 * Gerencia o cache de áudios gerados para evitar regeneração desnecessária
 * Áudios são compartilhados entre usuários (cache por hash do conteúdo)
 */

import { supabase } from './supabaseClient';

export type AudioCacheType = 'explanation' | 'podcast';

export interface AudioCacheEntry {
  id: string;
  content_hash: string;
  audio_type: AudioCacheType;
  audio_url: string;
  title?: string;
  created_at: string;
}

/**
 * Gera hash MD5-like do conteúdo para usar como chave de cache
 * Usa uma implementação simples de hash para o browser
 */
async function generateContentHash(title: string, content: string): Promise<string> {
  const text = `${title}::${content}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // Usar SubtleCrypto para gerar hash SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Retornar apenas os primeiros 32 caracteres (suficiente para evitar colisões)
  return hashHex.substring(0, 32);
}

/**
 * Verifica se existe cache para o conteúdo
 */
export async function checkAudioCache(
  title: string,
  content: string,
  audioType: AudioCacheType
): Promise<AudioCacheEntry | null> {
  try {
    const contentHash = await generateContentHash(title, content);

    const { data, error } = await supabase
      .from('audio_cache')
      .select('*')
      .eq('content_hash', contentHash)
      .eq('audio_type', audioType)
      .single();

    if (error || !data) {
      return null;
    }

    // Verificar se a URL do áudio ainda é válida
    if (!data.audio_url) {
      return null;
    }

    return data as AudioCacheEntry;
  } catch (error) {
    console.error('[AudioCache] Error checking cache:', error);
    return null;
  }
}

/**
 * Salva áudio no cache (Storage + registro na tabela)
 */
export async function saveAudioToCache(
  title: string,
  content: string,
  audioType: AudioCacheType,
  audioBlob: Blob
): Promise<AudioCacheEntry | null> {
  try {
    const contentHash = await generateContentHash(title, content);

    // Gerar nome único para o arquivo
    const fileName = `${audioType}/${contentHash}.wav`;

    // Upload para o Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-cache')
      .upload(fileName, audioBlob, {
        contentType: 'audio/wav',
        upsert: true, // Sobrescrever se existir
      });

    if (uploadError) {
      console.error('[AudioCache] Upload error:', uploadError);
      return null;
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('audio-cache')
      .getPublicUrl(fileName);

    const audioUrl = urlData.publicUrl;

    // Verificar se já existe um registro com esse hash
    const { data: existingData } = await supabase
      .from('audio_cache')
      .select('*')
      .eq('content_hash', contentHash)
      .eq('audio_type', audioType)
      .single();

    let cacheData = existingData;

    if (existingData) {
      // Atualizar registro existente
      const { data: updatedData, error: updateError } = await supabase
        .from('audio_cache')
        .update({
          audio_url: audioUrl,
          title: title.substring(0, 255),
        })
        .eq('id', existingData.id)
        .select()
        .single();

      if (updateError) {
        console.error('[AudioCache] Update error:', updateError);
      } else {
        cacheData = updatedData;
      }
    } else {
      // Inserir novo registro
      const { data: insertedData, error: insertError } = await supabase
        .from('audio_cache')
        .insert({
          content_hash: contentHash,
          audio_type: audioType,
          audio_url: audioUrl,
          title: title.substring(0, 255),
        })
        .select()
        .single();

      if (insertError) {
        console.error('[AudioCache] Insert error:', insertError);
        // Mesmo com erro no banco, podemos retornar a URL
        return {
          id: '',
          content_hash: contentHash,
          audio_type: audioType,
          audio_url: audioUrl,
          title,
          created_at: new Date().toISOString(),
        };
      } else {
        cacheData = insertedData;
      }
    }

    if (!cacheData) {
      return {
        id: '',
        content_hash: contentHash,
        audio_type: audioType,
        audio_url: audioUrl,
        title,
        created_at: new Date().toISOString(),
      };
    }

    console.log('[AudioCache] Audio cached successfully:', contentHash);
    return cacheData as AudioCacheEntry;
  } catch (error) {
    console.error('[AudioCache] Error saving to cache:', error);
    return null;
  }
}

/**
 * Converte base64 PCM para Blob WAV (copiado de geminiService)
 */
export function base64ToAudioBlob(base64Data: string): Blob {
  // Decode base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // PCM specs from Gemini TTS: 24kHz, mono, 16-bit signed
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;

  // Create WAV header
  const wavHeader = createWavHeader(bytes.length, sampleRate, numChannels, bitsPerSample);

  // Combine header and PCM data
  const wavData = new Uint8Array(wavHeader.length + bytes.length);
  wavData.set(wavHeader, 0);
  wavData.set(bytes, wavHeader.length);

  return new Blob([wavData], { type: 'audio/wav' });
}

function createWavHeader(dataLength: number, sampleRate: number, numChannels: number, bitsPerSample: number): Uint8Array {
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// URL do API de áudio (mesma do geminiService)
const AUDIO_API_URL = import.meta.env.VITE_MASTRA_URL
  ? `${import.meta.env.VITE_MASTRA_URL}/api/audio`
  : 'http://localhost:4000/api/audio';

export interface GeneratedAudioWithCache {
  audioUrl: string;
  type: AudioCacheType;
  fromCache: boolean;
}

/**
 * Gera explicação em áudio com cache
 * Verifica cache primeiro, se não existir, gera e salva
 */
export async function generateAudioWithCache(
  title: string,
  content: string
): Promise<GeneratedAudioWithCache | null> {
  try {
    // 1. Verificar cache
    const cached = await checkAudioCache(title, content, 'explanation');
    if (cached) {
      console.log('[AudioCache] Cache hit for explanation:', cached.content_hash);
      return {
        audioUrl: cached.audio_url,
        type: 'explanation',
        fromCache: true,
      };
    }

    console.log('[AudioCache] Cache miss for explanation, generating...');

    // 2. Gerar novo áudio via API
    const response = await fetch(`${AUDIO_API_URL}/explanation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content }),
    });

    const data = await response.json();

    if (!data.success || !data.audioData) {
      console.error('[AudioCache] API error:', data);
      return null;
    }

    // 3. Converter base64 para blob
    const audioBlob = base64ToAudioBlob(data.audioData);

    // 4. Salvar no cache (Storage + DB)
    const cacheEntry = await saveAudioToCache(title, content, 'explanation', audioBlob);

    if (cacheEntry) {
      return {
        audioUrl: cacheEntry.audio_url,
        type: 'explanation',
        fromCache: false,
      };
    }

    // Fallback: criar URL temporária se o cache falhar
    const tempUrl = URL.createObjectURL(audioBlob);
    return {
      audioUrl: tempUrl,
      type: 'explanation',
      fromCache: false,
    };
  } catch (error) {
    console.error('[AudioCache] Error generating audio:', error);
    return null;
  }
}

/**
 * Gera podcast com cache
 * Verifica cache primeiro, se não existir, gera e salva
 */
export async function generatePodcastWithCache(
  title: string,
  content: string
): Promise<GeneratedAudioWithCache | null> {
  try {
    // 1. Verificar cache
    const cached = await checkAudioCache(title, content, 'podcast');
    if (cached) {
      console.log('[AudioCache] Cache hit for podcast:', cached.content_hash);
      return {
        audioUrl: cached.audio_url,
        type: 'podcast',
        fromCache: true,
      };
    }

    console.log('[AudioCache] Cache miss for podcast, generating...');

    // 2. Gerar novo podcast via API
    const response = await fetch(`${AUDIO_API_URL}/podcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content }),
    });

    const data = await response.json();

    if (!data.success || !data.audioData) {
      console.error('[AudioCache] API error:', data);
      return null;
    }

    // 3. Converter base64 para blob
    const audioBlob = base64ToAudioBlob(data.audioData);

    // 4. Salvar no cache (Storage + DB)
    const cacheEntry = await saveAudioToCache(title, content, 'podcast', audioBlob);

    if (cacheEntry) {
      return {
        audioUrl: cacheEntry.audio_url,
        type: 'podcast',
        fromCache: false,
      };
    }

    // Fallback: criar URL temporária se o cache falhar
    const tempUrl = URL.createObjectURL(audioBlob);
    return {
      audioUrl: tempUrl,
      type: 'podcast',
      fromCache: false,
    };
  } catch (error) {
    console.error('[AudioCache] Error generating podcast:', error);
    return null;
  }
}

export default {
  checkAudioCache,
  saveAudioToCache,
  base64ToAudioBlob,
  generateAudioWithCache,
  generatePodcastWithCache,
};
