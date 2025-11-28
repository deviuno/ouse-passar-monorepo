import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';

// New Schema Interface for 'autores_artigos'
interface Author {
    autor_id: string;
    nome: string;
    profissao: string;
    especialidades: string;
    missao: string;
    tom_de_voz: string;
    objetivo_final: string;
    horario: string | null;
    imagem_perfil: string | null; // Supabase returns bytea as hex string
    Assunto: string | null;
    ativo: boolean;
    data_criacao?: string;
}

export const Authors: React.FC = () => {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Temporary cast to any to resolve build errors with Supabase types
    const supabaseClient = supabase as any;

    // Form state
    const [formData, setFormData] = useState({
        nome: '',
        profissao: '',
        especialidades: '',
        missao: '',
        tom_de_voz: '',
        objetivo_final: '',
        horario: '',
        Assunto: '',
        imagem_perfil: null as File | null
    });

    useEffect(() => {
        loadAuthors();
    }, []);

    const loadAuthors = async () => {
        setLoading(true);
        const { data, error } = await supabaseClient
            .from('autores_artigos')
            .select('*')
            .order('nome');

        if (error) {
            console.error('Error loading authors:', error);
        } else {
            setAuthors(data || []);
        }
        setLoading(false);
    };

    // Helper to convert bytea hex string to base64 for display
    const getImageUrl = (hexString: string | null) => {
        if (!hexString) return null;

        try {
            // Remove \x prefix if present
            const hex = hexString.startsWith('\\x') ? hexString.slice(2) : hexString;

            // Convert hex to byte array
            const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);

            // Convert to blob and create URL
            const blob = new Blob([bytes], { type: 'image/jpeg' }); // Assuming JPEG/PNG
            return URL.createObjectURL(blob);
        } catch (e) {
            console.error('Error converting image:', e);
            return null;
        }
    };

    const handleOpenModal = (author?: Author) => {
        if (author) {
            setEditingAuthor(author);
            setFormData({
                nome: author.nome,
                profissao: author.profissao,
                especialidades: author.especialidades,
                missao: author.missao,
                tom_de_voz: author.tom_de_voz,
                objetivo_final: author.objetivo_final,
                horario: author.horario || '',
                Assunto: author.Assunto || '',
                imagem_perfil: null
            });
            setPreviewImage(getImageUrl(author.imagem_perfil));
        } else {
            setEditingAuthor(null);
            setFormData({
                nome: '',
                profissao: '',
                especialidades: '',
                missao: '',
                tom_de_voz: '',
                objetivo_final: '',
                horario: '',
                Assunto: '',
                imagem_perfil: null
            });
            setPreviewImage(null);
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este autor?')) return;

        const { error } = await supabaseClient
            .from('autores_artigos')
            .delete()
            .eq('autor_id', id);

        if (error) {
            console.error('Error deleting author:', error);
            alert('Erro ao excluir autor');
        } else {
            loadAuthors();
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        const { error } = await supabaseClient
            .from('autores_artigos')
            .update({ ativo: !currentStatus })
            .eq('autor_id', id);

        if (error) {
            console.error('Error toggling author status:', error);
            alert('Erro ao alterar status do autor');
        } else {
            loadAuthors();
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, imagem_perfil: file });
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const fileToHex = async (file: File): Promise<string> => {
        const buffer = await file.arrayBuffer();
        const byteArray = new Uint8Array(buffer);
        const hexString = Array.from(byteArray, function (byte) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('');
        return `\\x${hexString}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let imageHex = null;
        if (formData.imagem_perfil) {
            imageHex = await fileToHex(formData.imagem_perfil);
        }

        const authorData: any = {
            nome: formData.nome,
            profissao: formData.profissao,
            especialidades: formData.especialidades,
            missao: formData.missao,
            tom_de_voz: formData.tom_de_voz,
            objetivo_final: formData.objetivo_final,
            horario: formData.horario || null,
            "Assunto": formData.Assunto || null, // Note the quotes for case sensitivity if needed, though usually lowercase in PG
        };

        if (imageHex) {
            authorData.imagem_perfil = imageHex;
        }

        if (editingAuthor) {
            const { error } = await supabaseClient
                .from('autores_artigos')
                .update(authorData)
                .eq('autor_id', editingAuthor.autor_id);

            if (error) {
                console.error('Error updating author:', error);
                alert('Erro ao atualizar autor');
            } else {
                setIsModalOpen(false);
                loadAuthors();
            }
        } else {
            // Generate UUID for new author
            const newId = crypto.randomUUID();

            const { error } = await supabaseClient
                .from('autores_artigos')
                .insert({
                    autor_id: newId,
                    ...authorData
                });

            if (error) {
                console.error('Error creating author:', error);
                alert('Erro ao criar autor: ' + error.message);
            } else {
                setIsModalOpen(false);
                loadAuthors();
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-white font-display uppercase">Autores IA</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-brand-yellow text-brand-darker px-4 py-2 font-bold uppercase text-sm flex items-center hover:bg-brand-yellow/90 transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Autor
                </button>
            </div>

            {loading ? (
                <div className="text-white">Carregando...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {authors.map((author) => {
                        const imageUrl = getImageUrl(author.imagem_perfil);
                        return (
                            <div key={author.autor_id} className="bg-brand-card border border-white/5 p-6 rounded-sm flex flex-col">
                                <div className="flex items-center mb-4">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={author.nome}
                                            className="w-12 h-12 rounded-full border border-brand-yellow p-0.5 object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full border border-brand-yellow p-0.5 bg-brand-dark flex items-center justify-center">
                                            <ImageIcon className="w-6 h-6 text-gray-500" />
                                        </div>
                                    )}
                                    <div className="ml-4">
                                        <h3 className="text-white font-bold">{author.nome}</h3>
                                        <p className="text-gray-500 text-xs uppercase">{author.profissao}</p>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6 flex-1">
                                    <p className="text-gray-400 text-xs"><span className="text-brand-yellow">Especialidades:</span> {author.especialidades}</p>
                                    <p className="text-gray-400 text-xs line-clamp-2"><span className="text-brand-yellow">Missão:</span> {author.missao}</p>
                                    <div className="flex items-center mt-3">
                                        <span className="text-gray-400 text-xs mr-2">Status:</span>
                                        <button
                                            onClick={() => handleToggleActive(author.autor_id, author.ativo)}
                                            className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${author.ativo
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'
                                                }`}
                                        >
                                            {author.ativo ? 'Ativo' : 'Inativo'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-2 pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => handleOpenModal(author)}
                                        className="p-2 text-gray-400 hover:text-brand-yellow transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(author.autor_id)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-brand-card border border-white/10 w-full max-w-2xl rounded-sm p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white uppercase">
                                {editingAuthor ? 'Editar Autor' : 'Novo Autor'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Nome</label>
                                    <input
                                        type="text"
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                        className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Profissão</label>
                                    <input
                                        type="text"
                                        value={formData.profissao}
                                        onChange={(e) => setFormData({ ...formData, profissao: e.target.value })}
                                        className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Imagem de Perfil</label>
                                <div className="flex items-center space-x-4">
                                    {previewImage && (
                                        <img src={previewImage} alt="Preview" className="w-16 h-16 rounded-full object-cover border border-brand-yellow" />
                                    )}
                                    <label className="cursor-pointer bg-brand-dark border border-white/10 px-4 py-2 text-white text-xs font-bold uppercase hover:bg-white/5 transition-colors flex items-center">
                                        <Upload className="w-4 h-4 mr-2" />
                                        Escolher Imagem
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Especialidades</label>
                                <textarea
                                    value={formData.especialidades}
                                    onChange={(e) => setFormData({ ...formData, especialidades: e.target.value })}
                                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors h-20"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Missão</label>
                                <textarea
                                    value={formData.missao}
                                    onChange={(e) => setFormData({ ...formData, missao: e.target.value })}
                                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors h-20"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Tom de Voz</label>
                                    <input
                                        type="text"
                                        value={formData.tom_de_voz}
                                        onChange={(e) => setFormData({ ...formData, tom_de_voz: e.target.value })}
                                        className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Horário</label>
                                    <input
                                        type="time"
                                        value={formData.horario}
                                        onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                                        className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Objetivo Final</label>
                                <textarea
                                    value={formData.objetivo_final}
                                    onChange={(e) => setFormData({ ...formData, objetivo_final: e.target.value })}
                                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors h-20"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Assunto</label>
                                <input
                                    type="text"
                                    value={formData.Assunto}
                                    onChange={(e) => setFormData({ ...formData, Assunto: e.target.value })}
                                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                />
                            </div>

                            <div className="pt-4 flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 text-gray-400 font-bold uppercase text-xs hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-brand-yellow text-brand-darker px-8 py-3 font-bold uppercase text-xs hover:bg-brand-yellow/90 transition-colors"
                                >
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
