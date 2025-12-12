import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PreparatorioImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export const PreparatorioImageUpload: React.FC<PreparatorioImageUploadProps> = ({
  value,
  onChange
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      setError('');

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('O arquivo deve ser uma imagem');
      }

      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        throw new Error('A imagem deve ter no maximo 100MB');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `capa-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('preparatorios')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('preparatorios')
        .getPublicUrl(fileName);

      onChange(data.publicUrl);
    } catch (err: any) {
      console.error('Erro no upload:', err);
      setError(err.message || 'Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      // Extract file path from URL
      const url = new URL(value);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === 'preparatorios');

      if (bucketIndex !== -1) {
        const filePath = pathParts.slice(bucketIndex + 1).join('/');

        // Delete from Supabase Storage
        await supabase.storage
          .from('preparatorios')
          .remove([filePath]);
      }

      onChange('');
      setError('');
    } catch (err: any) {
      console.error('Erro ao remover imagem:', err);
      // Even if deletion fails, clear the URL
      onChange('');
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 p-2 text-red-400 text-xs">
          {error}
        </div>
      )}

      {value ? (
        <div className="relative group">
          <div className="border border-white/10 overflow-hidden bg-brand-dark">
            <img
              src={value}
              alt="Capa do preparatorio"
              className="w-full h-32 object-cover"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-sm transition-colors opacity-0 group-hover:opacity-100"
            title="Remover imagem"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-white/20 hover:border-brand-yellow bg-brand-dark hover:bg-brand-card p-4 flex flex-col items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 text-brand-yellow mb-2 animate-spin" />
              <p className="text-white text-xs font-bold">Fazendo upload...</p>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-brand-yellow mb-2" />
              <p className="text-white text-xs font-bold mb-1">Clique para upload</p>
              <p className="text-gray-500 text-xs">PNG, JPG, WEBP ate 100MB</p>
            </>
          )}
        </button>
      )}
    </div>
  );
};
