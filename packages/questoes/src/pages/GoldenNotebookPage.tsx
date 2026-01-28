import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookMarked,
  Plus,
  Loader2,
  Search,
  Edit,
  Trash2,
  X,
  ChevronRight,
} from 'lucide-react';
import { Button, ConfirmModal } from '../components/ui';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores';
import {
  getUserGoldenNotebooks,
  getGoldenNotebookStats,
  createGoldenNotebook,
  updateGoldenNotebook,
  deleteGoldenNotebook,
  searchAnnotations,
  GoldenNotebook,
  CreateNotebookInput,
} from '../services/goldenNotebookService';

// Color palette for notebooks
const NOTEBOOK_COLORS = [
  { value: '#F59E0B', label: 'Dourado' },
  { value: '#3B82F6', label: 'Azul' },
  { value: '#10B981', label: 'Verde' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#F97316', label: 'Laranja' },
];

export const GoldenNotebookPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast, setHeaderOverride, clearHeaderOverride } = useUIStore();

  const [notebooks, setNotebooks] = useState<GoldenNotebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ totalNotebooks: 0, totalAnnotations: 0 });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<GoldenNotebook | null>(null);
  const [deletingNotebook, setDeletingNotebook] = useState<GoldenNotebook | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateNotebookInput>({
    nome: '',
    descricao: '',
    cor: '#F59E0B',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load notebooks and stats on mount
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [notebooksData, statsData] = await Promise.all([
          getUserGoldenNotebooks(user.id),
          getGoldenNotebookStats(user.id),
        ]);
        setNotebooks(notebooksData);
        setStats(statsData);
      } catch (error) {
        console.error('Erro ao carregar cadernos de ouro:', error);
        addToast('error', 'Erro ao carregar cadernos');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  // Search handler
  useEffect(() => {
    if (!searchQuery.trim() || !user?.id) {
      setSearchResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchAnnotations(user.id, searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Erro ao buscar:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, user?.id]);

  // Set up header
  useEffect(() => {
    setHeaderOverride({
      title: 'Minhas Anotações',
      showBackButton: true,
      backPath: '/questoes',
      hideIcon: true,
    });

    return () => {
      clearHeaderOverride();
    };
  }, []);

  const handleCreateNotebook = async () => {
    if (!user?.id || !formData.nome.trim()) {
      addToast('error', 'Preencha o nome do caderno');
      return;
    }

    setIsSaving(true);
    try {
      const newNotebook = await createGoldenNotebook(user.id, formData);
      setNotebooks((prev) => [newNotebook, ...prev]);
      setStats((prev) => ({ ...prev, totalNotebooks: prev.totalNotebooks + 1 }));
      setShowCreateModal(false);
      setFormData({ nome: '', descricao: '', cor: '#F59E0B' });
      addToast('success', 'Caderno criado com sucesso!');
    } catch (error: any) {
      if (error.code === '23505') {
        addToast('error', 'Já existe um caderno com esse nome');
      } else {
        addToast('error', 'Erro ao criar caderno');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateNotebook = async () => {
    if (!user?.id || !editingNotebook || !formData.nome.trim()) {
      addToast('error', 'Preencha o nome do caderno');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateGoldenNotebook(editingNotebook.id, user.id, formData);
      setNotebooks((prev) => prev.map((nb) => (nb.id === updated.id ? updated : nb)));
      setEditingNotebook(null);
      setFormData({ nome: '', descricao: '', cor: '#F59E0B' });
      addToast('success', 'Caderno atualizado!');
    } catch (error: any) {
      if (error.code === '23505') {
        addToast('error', 'Já existe um caderno com esse nome');
      } else {
        addToast('error', 'Erro ao atualizar caderno');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNotebook = async () => {
    if (!user?.id || !deletingNotebook) return;

    setIsDeleting(true);
    try {
      await deleteGoldenNotebook(deletingNotebook.id, user.id);
      setNotebooks((prev) => prev.filter((nb) => nb.id !== deletingNotebook.id));
      setStats((prev) => ({
        totalNotebooks: prev.totalNotebooks - 1,
        totalAnnotations: prev.totalAnnotations - deletingNotebook.anotacoes_count,
      }));
      setDeletingNotebook(null);
      addToast('success', 'Caderno excluído');
    } catch (error) {
      addToast('error', 'Erro ao excluir caderno');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (notebook: GoldenNotebook) => {
    setFormData({
      nome: notebook.nome,
      descricao: notebook.descricao || '',
      cor: notebook.cor,
    });
    setEditingNotebook(notebook);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingNotebook(null);
    setFormData({ nome: '', descricao: '', cor: '#F59E0B' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] flex items-center justify-center theme-transition">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-[var(--color-text-sec)]">Carregando cadernos...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-main)] flex items-center justify-center px-4 theme-transition">
        <div className="text-center">
          <BookMarked size={48} className="text-[var(--color-text-muted)] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-2">
            Faça login para acessar
          </h2>
          <p className="text-[var(--color-text-sec)] mb-6">
            Você precisa estar logado para ver seu Minhas Anotações.
          </p>
          <Button onClick={() => navigate('/auth')}>Fazer Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] px-4 py-6 theme-transition">
      <div className="max-w-4xl mx-auto">
        {/* Top Action Button */}
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => setShowCreateModal(true)}
            leftIcon={<Plus size={18} />}
          >
            Novo Caderno
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Buscar em todas as anotações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-amber-500 transition-colors"
          />
          {isSearching && (
            <Loader2 size={20} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-amber-500" />
          )}
        </div>

        {/* Search Results */}
        {searchQuery.trim() && searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-[var(--color-text-main)] mb-4">
              Resultados da busca ({searchResults.length})
            </h2>
            <div className="space-y-3">
              {searchResults.slice(0, 5).map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 cursor-pointer hover:border-amber-500/50 transition-colors"
                  onClick={() => navigate(`/minhas-anotacoes/${result.caderno_id}`)}
                >
                  <div className="flex items-center gap-2 text-xs text-amber-500 mb-2">
                    <BookMarked size={14} />
                    {result.caderno_nome}
                  </div>
                  {result.titulo && (
                    <h3 className="font-bold text-[var(--color-text-main)] mb-1">{result.titulo}</h3>
                  )}
                  <p className="text-sm text-[var(--color-text-sec)] line-clamp-2">
                    {result.conteudo}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {searchQuery.trim() && searchResults.length === 0 && !isSearching && (
          <div className="text-center py-8 mb-8">
            <p className="text-[var(--color-text-sec)]">Nenhuma anotação encontrada</p>
          </div>
        )}

        {/* Notebooks List */}
        {!searchQuery.trim() && (
          <>
            <h2 className="text-lg font-bold text-[var(--color-text-main)] mb-4">
              Meus Cadernos
            </h2>

            {notebooks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 px-4"
              >
                <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
                  <BookMarked size={40} className="text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-2">
                  Nenhum caderno ainda
                </h2>
                <p className="text-[var(--color-text-sec)] text-center max-w-md mb-6">
                  Crie seu primeiro Minhas Anotações para organizar suas anotações mais importantes.
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                >
                  Criar meu primeiro caderno
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {notebooks.map((notebook, index) => (
                  <motion.div
                    key={notebook.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/minhas-anotacoes/${notebook.id}`)}
                    className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 hover:border-amber-500/50 transition-colors theme-transition cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {/* Color indicator */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${notebook.cor}20` }}
                      >
                        <BookMarked size={24} style={{ color: notebook.cor }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[var(--color-text-main)] truncate">
                          {notebook.nome}
                        </h3>
                        <p className="text-sm text-[var(--color-text-sec)]">
                          {notebook.anotacoes_count} {notebook.anotacoes_count === 1 ? 'anotação' : 'anotações'}
                          {notebook.descricao && ` • ${notebook.descricao}`}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(notebook);
                          }}
                          className="p-2 hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors"
                        >
                          <Edit size={16} className="text-[var(--color-text-sec)]" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingNotebook(notebook);
                          }}
                          className="p-2 hover:bg-[var(--color-error)]/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} className="text-[var(--color-error)]" />
                        </button>
                        <ChevronRight size={20} className="text-[var(--color-text-muted)]" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {(showCreateModal || editingNotebook) && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeModal}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] z-50 overflow-hidden theme-transition"
              >
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                  <h3 className="font-bold text-[var(--color-text-main)]">
                    {editingNotebook ? 'Editar Caderno' : 'Novo Caderno'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors"
                  >
                    <X size={18} className="text-[var(--color-text-sec)]" />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm text-[var(--color-text-sec)] mb-2">
                      Nome do caderno
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Português - Crase"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm text-[var(--color-text-sec)] mb-2">
                      Descrição (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Descrição do caderno"
                      value={formData.descricao || ''}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      className="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  {/* Color picker */}
                  <div>
                    <label className="block text-sm text-[var(--color-text-sec)] mb-2">Cor</label>
                    <div className="flex gap-2">
                      {NOTEBOOK_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setFormData({ ...formData, cor: color.value })}
                          className={`w-10 h-10 rounded-full transition-all ${
                            formData.cor === color.value
                              ? 'ring-2 ring-offset-2 ring-offset-[var(--color-bg-card)]'
                              : ''
                          }`}
                          style={{
                            backgroundColor: color.value,
                          }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-[var(--color-border)] flex gap-3">
                  <Button variant="secondary" fullWidth onClick={closeModal}>
                    Cancelar
                  </Button>
                  <Button
                    fullWidth
                    onClick={editingNotebook ? handleUpdateNotebook : handleCreateNotebook}
                    disabled={isSaving || !formData.nome.trim()}
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : editingNotebook ? (
                      'Salvar'
                    ) : (
                      'Criar Caderno'
                    )}
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deletingNotebook}
          onClose={() => setDeletingNotebook(null)}
          onConfirm={handleDeleteNotebook}
          title="Excluir Caderno"
          message={`Tem certeza que deseja excluir o caderno "${deletingNotebook?.nome}"? Todas as anotações serão perdidas. Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          variant="danger"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default GoldenNotebookPage;
