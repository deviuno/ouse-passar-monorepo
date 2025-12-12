import React, { useState, useRef } from 'react';
import { Camera, Upload, User, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

export const Profile: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione uma imagem válida.');
            return;
        }

        // Validar tamanho (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 5MB.');
            return;
        }

        // Criar preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file || !user?.id) return;

        setUploading(true);
        setSuccess(false);

        try {
            // Gerar nome único para o arquivo
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Upload para o Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('profile-photos')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                // Se o bucket não existir, tentar criar
                if (uploadError.message.includes('not found')) {
                    throw new Error('Bucket de armazenamento não configurado. Entre em contato com o administrador.');
                }
                throw uploadError;
            }

            // Obter URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('profile-photos')
                .getPublicUrl(filePath);

            // Atualizar o avatar_url no banco de dados
            const { error: updateError } = await supabase
                .from('admin_users')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Atualizar o contexto de autenticação
            if (refreshUser) {
                await refreshUser();
            }

            setSuccess(true);
            setPreviewUrl(null);

            // Limpar input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            alert('Erro ao fazer upload da imagem. Tente novamente.');
        } finally {
            setUploading(false);
        }
    };

    const handleCancelPreview = () => {
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-black text-white font-display uppercase">Meu Perfil</h2>
                <p className="text-gray-500 mt-1">Gerencie suas informações pessoais</p>
            </div>

            <div className="bg-brand-card border border-white/5 rounded-sm overflow-hidden">
                {/* Header do card */}
                <div className="bg-brand-yellow/10 p-6 text-center border-b border-white/5">
                    <h3 className="text-white text-xl font-bold">{user?.name}</h3>
                    <span className="inline-block mt-2 text-[10px] bg-brand-yellow/20 text-brand-yellow px-3 py-1 rounded-full uppercase font-bold tracking-wide">
                        Estrategista
                    </span>
                </div>

                {/* Seção de foto */}
                <div className="p-8">
                    <h4 className="text-white font-bold text-sm uppercase mb-6 flex items-center">
                        <Camera className="w-4 h-4 mr-2 text-brand-yellow" />
                        Foto de Perfil
                    </h4>

                    <div className="flex flex-col items-center">
                        {/* Preview da foto atual ou nova */}
                        <div className="relative mb-6">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-brand-yellow/30 shadow-lg">
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : user?.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-brand-yellow/20 flex items-center justify-center">
                                        <User className="w-16 h-16 text-brand-yellow" />
                                    </div>
                                )}
                            </div>

                            {/* Indicador de sucesso */}
                            {success && (
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                                    <Check className="w-6 h-6 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Input de arquivo oculto */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {/* Botões de ação */}
                        {previewUrl ? (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancelPreview}
                                    disabled={uploading}
                                    className="px-6 py-3 border border-white/10 text-gray-400 font-bold uppercase text-xs hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="px-6 py-3 bg-brand-yellow text-brand-darker font-bold uppercase text-xs hover:bg-brand-yellow/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Salvar Foto
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-3 bg-brand-dark border border-white/10 text-white font-bold uppercase text-xs hover:border-brand-yellow/50 transition-colors flex items-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                {user?.avatar_url ? 'Alterar Foto' : 'Escolher Foto'}
                            </button>
                        )}

                        <p className="text-gray-500 text-xs mt-4 text-center">
                            Formatos aceitos: JPG, PNG, GIF<br />
                            Tamanho máximo: 5MB
                        </p>
                    </div>
                </div>

                {/* Informações do usuário */}
                <div className="p-6 bg-brand-dark/30 border-t border-white/5">
                    <h4 className="text-white font-bold text-sm uppercase mb-4">Informações da Conta</h4>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-gray-500 text-sm">Nome</span>
                            <span className="text-white text-sm font-medium">{user?.name}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-gray-500 text-sm">Email</span>
                            <span className="text-white text-sm font-medium">{user?.email}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-500 text-sm">Função</span>
                            <span className="text-brand-yellow text-sm font-medium capitalize">{user?.role}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
