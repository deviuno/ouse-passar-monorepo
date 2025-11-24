import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  folder = 'article-images'
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

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('A imagem deve ter no máximo 5MB');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

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
      const bucketIndex = pathParts.findIndex(part => part === 'blog-images');

      if (bucketIndex !== -1) {
        const filePath = pathParts.slice(bucketIndex + 1).join('/');

        // Delete from Supabase Storage
        await supabase.storage
          .from('blog-images')
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
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 p-3 text-red-400 text-xs">
          {error}
        </div>
      )}

      {value ? (
        <div className="relative group">
          <div className="border border-white/10 overflow-hidden bg-brand-dark">
            <img
              src={value}
              alt="Preview"
              className="w-full h-auto max-h-64 object-cover"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-sm transition-colors opacity-0 group-hover:opacity-100"
            title="Remover imagem"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-white/20 hover:border-brand-yellow bg-brand-dark hover:bg-brand-card p-8 flex flex-col items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-brand-yellow mb-3 animate-spin" />
              <p className="text-white text-sm font-bold">Fazendo upload...</p>
            </>
          ) : (
            <>
              <div className="bg-brand-yellow/10 p-4 rounded-full mb-3">
                <Upload className="w-8 h-8 text-brand-yellow" />
              </div>
              <p className="text-white text-sm font-bold mb-1">Clique para fazer upload</p>
              <p className="text-gray-500 text-xs">PNG, JPG, WEBP até 5MB</p>
            </>
          )}
        </button>
      )}

      {/* Alternative: URL input */}
      {!value && !uploading && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-brand-dark px-2 text-gray-500 uppercase">ou</span>
          </div>
        </div>
      )}

      {!value && !uploading && (
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            URL da imagem
          </label>
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/imagem.jpg"
            className="w-full bg-brand-card border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-brand-yellow transition-colors"
          />
        </div>
      )}
    </div>
  );
};
