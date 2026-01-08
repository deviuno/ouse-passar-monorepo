import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ImageUploaderProps {
    value: string;
    onChange: (url: string) => void;
    bucket?: string;
    folder?: string;
    label?: string;
    description?: string;
    aspectRatio?: string; // '16/9', '1/1', etc. for UI hints
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
    value,
    onChange,
    bucket = 'course-images',
    folder = 'offers', // Default folder
    label = 'Imagem',
    description = 'Arraste uma imagem ou clique para selecionar',
    aspectRatio
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleUpload(files[0]);
        }
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleUpload(files[0]);
        }
    }, []);

    const handleUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Por favor, selecione apenas arquivos de imagem.');
            return;
        }

        // Max 5MB
        if (file.size > 5 * 1024 * 1024) {
            setError('A imagem deve ter no máximo 5MB.');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = folder ? `${folder}/${fileName}` : fileName;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            onChange(data.publicUrl);
        } catch (err: any) {
            console.error('Erro ao fazer upload da imagem:', err);
            setError('Erro ao enviar a imagem. Tente novamente.');
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        onChange('');
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
                {label}
            </label>

            {value ? (
                <div className="relative group">
                    <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/20" style={{ aspectRatio: aspectRatio || 'video' }}>
                        <img
                            src={value}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-5 h-5" />
                                Remover
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
            ${isDragOver ? 'border-brand-yellow bg-brand-yellow/10' : 'border-white/10 hover:border-brand-yellow/50 hover:bg-white/5'}
            ${error ? 'border-red-500/50 bg-red-500/5' : ''}
            bg-brand-darker
          `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={uploading}
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center justify-center py-4">
                            <Loader2 className="w-8 h-8 text-brand-yellow animate-spin mb-3" />
                            <p className="text-gray-400 text-sm">Enviando imagem...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-2">
                            <Upload className={`w-8 h-8 mb-3 ${isDragOver ? 'text-brand-yellow' : 'text-gray-500'}`} />
                            <p className="text-gray-300 font-medium mb-1">
                                {isDragOver ? 'Solte a imagem aqui' : 'Clique para selecionar'}
                            </p>
                            <p className="text-gray-500 text-xs">
                                {description}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p className="text-red-400 text-xs mt-1">
                    {error}
                </p>
            )}
        </div>
    );
};
