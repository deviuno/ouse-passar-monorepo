import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CourseImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export const CourseImageUpload: React.FC<CourseImageUploadProps> = ({
  value,
  onChange,
  disabled = false,
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
      const filePath = fileName; // Só o nome do arquivo, bucket já é 'course-images'

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('course-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // If bucket doesn't exist, try using blog-images as fallback
        if (uploadError.message.includes('not found') || uploadError.message.includes('does not exist')) {
          const fallbackPath = `courses/${fileName}`;
          const { error: fallbackError } = await supabase.storage
            .from('blog-images')
            .upload(fallbackPath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (fallbackError) throw fallbackError;

          // Get public URL from fallback bucket
          const { data } = supabase.storage
            .from('blog-images')
            .getPublicUrl(fallbackPath);

          onChange(data.publicUrl);
          return;
        }
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('course-images')
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

  const handleRemove = () => {
    onChange('');
    setError('');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled || uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      uploadImage(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 p-3 text-red-400 text-xs rounded-sm">
          {error}
        </div>
      )}

      {value ? (
        <div className="relative group">
          <div className="border border-white/10 overflow-hidden bg-brand-dark rounded-sm">
            <img
              src={value}
              alt="Preview"
              className="w-full h-48 object-cover"
            />
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-sm transition-colors opacity-0 group-hover:opacity-100"
              title="Remover imagem"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`
            border-2 border-dashed rounded-sm p-8 flex flex-col items-center justify-center transition-colors
            ${disabled || uploading
              ? 'border-white/10 bg-brand-dark/50 cursor-not-allowed opacity-50'
              : 'border-white/20 hover:border-brand-yellow bg-brand-dark hover:bg-brand-card cursor-pointer'
            }
          `}
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
              <p className="text-white text-sm font-bold mb-1">Clique ou arraste para fazer upload</p>
              <p className="text-gray-500 text-xs">PNG, JPG, WEBP até 5MB</p>
              <p className="text-gray-600 text-xs mt-2">Recomendado: 1200x630px</p>
            </>
          )}
        </div>
      )}

      {/* URL input alternative */}
      {!value && !uploading && !disabled && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-brand-card px-2 text-gray-500 uppercase">ou</span>
            </div>
          </div>

          <div>
            <input
              type="url"
              placeholder="Cole a URL de uma imagem"
              onChange={(e) => {
                if (e.target.value) {
                  onChange(e.target.value);
                }
              }}
              className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white text-sm focus:outline-none focus:border-brand-yellow placeholder-gray-600"
            />
          </div>
        </>
      )}
    </div>
  );
};
