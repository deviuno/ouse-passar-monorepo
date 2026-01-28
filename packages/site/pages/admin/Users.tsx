import React, { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, X, User, Shield, ShoppingBag, Calendar, ChevronRight, ChevronLeft, Camera, Loader2, Search, Filter, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';
import { Tables } from '../../lib/database.types';
import { adminUsersService, UserRole, UserGender, AdminUser } from '../../services/adminUsersService';
import { useAuth } from '../../lib/AuthContext';
import { vendedorScheduleService } from '../../services/schedulingService';
import { SellerScheduleConfig } from '../../components/admin/SellerScheduleConfig';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

// Tipo para os tipos de usuário (incluindo teste grátis)
type UserTypeOption = UserRole | 'free_trial';

// Tipo para registros de teste grátis
interface PromotionalTrial {
    id: string;
    email: string;
    name: string | null;
    trial_days: number;
    campaign: string;
    redeemed_at: string | null;
    redeemed_by: string | null;
    expires_at: string | null;
    created_at: string;
}

// Tipo unificado para exibição na lista
interface ListItem {
    id: string;
    email: string;
    name: string;
    type: 'admin_user' | 'free_trial';
    role?: UserRole;
    is_active?: boolean;
    last_login?: string | null;
    avatar_url?: string | null;
    genero?: string | null;
    // Campos específicos de teste grátis
    trial_days?: number;
    trial_redeemed?: boolean;
    trial_expires_at?: string | null;
    created_at?: string | null;
}

// Opções de período de teste grátis
const TRIAL_PERIOD_OPTIONS = [
    { value: 7, label: '7 dias' },
    { value: 15, label: '15 dias' },
    { value: 30, label: '1 mês' },
    { value: 90, label: '3 meses' },
    { value: 180, label: '6 meses' },
    { value: 365, label: '1 ano' },
];

// Formatar período para exibição
const formatTrialPeriod = (days: number) => {
    if (days === 7) return '7 dias';
    if (days === 15) return '15 dias';
    if (days === 30) return '1 mês';
    if (days === 90) return '3 meses';
    if (days === 180) return '6 meses';
    if (days === 365) return '1 ano';
    return `${days} dias`;
};

export const Users: React.FC = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [users, setUsers] = useState<ListItem[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<ListItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<ListItem | null>(null);
    const [modalStep, setModalStep] = useState<1 | 2>(1);
    const [createdUserId, setCreatedUserId] = useState<string | null>(null);
    const [vendedoresWithSchedule, setVendedoresWithSchedule] = useState<Set<string>>(new Set());

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'cliente' as UserRole,
        genero: 'feminino' as UserGender,
        userType: 'cliente' as UserTypeOption,
        trialDays: 30 as number
    });

    // Avatar
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Modal de confirmação de exclusão
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; itemId: string | null; itemName: string; itemType: 'admin_user' | 'free_trial' | null }>({
        isOpen: false,
        itemId: null,
        itemName: '',
        itemType: null
    });
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    // Filter Logic
    useEffect(() => {
        let result = users;

        // Search Term (Name or Email)
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(item =>
                item.name.toLowerCase().includes(lowerTerm) ||
                item.email.toLowerCase().includes(lowerTerm)
            );
        }

        // Role Filter
        if (roleFilter !== 'all') {
            if (roleFilter === 'free_trial') {
                result = result.filter(item => item.type === 'free_trial');
            } else {
                result = result.filter(item => item.type === 'admin_user' && item.role === roleFilter);
            }
        }

        // Status Filter
        if (statusFilter !== 'all') {
            result = result.filter(item => {
                if (item.type === 'free_trial') {
                    // Para testes grátis: pendente = não resgatado, iniciado = resgatado
                    if (statusFilter === 'active') return item.trial_redeemed === true;
                    if (statusFilter === 'inactive') return item.trial_redeemed === false;
                    return true;
                } else {
                    // Para admin_users: ativo/inativo
                    const isActive = statusFilter === 'active';
                    return item.is_active === isActive;
                }
            });
        }

        setFilteredUsers(result);
    }, [users, searchTerm, roleFilter, statusFilter]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            // Carregar admin_users
            const adminUsers = await adminUsersService.getAll();

            // Converter admin_users para ListItem
            const adminListItems: ListItem[] = adminUsers.map(user => ({
                id: user.id,
                email: user.email,
                name: user.name,
                type: 'admin_user' as const,
                role: user.role,
                is_active: user.is_active ?? true,
                last_login: user.last_login,
                avatar_url: user.avatar_url,
                genero: user.genero,
                created_at: user.created_at
            }));

            // Carregar promotional_trials
            const { data: trials, error: trialsError } = await (supabase as any)
                .from('promotional_trials')
                .select('*')
                .order('created_at', { ascending: false });

            if (trialsError) {
                console.error('Erro ao carregar testes grátis:', trialsError);
            }

            // Converter trials para ListItem
            const trialListItems: ListItem[] = (trials || []).map((trial: PromotionalTrial) => ({
                id: trial.id,
                email: trial.email,
                name: trial.name || trial.email.split('@')[0], // Usa o nome ou a parte do email
                type: 'free_trial' as const,
                trial_days: trial.trial_days,
                trial_redeemed: trial.redeemed_at !== null, // Resgatado se redeemed_at não for null
                trial_expires_at: trial.expires_at,
                created_at: trial.created_at
            }));

            // Combinar as listas
            const allItems = [...adminListItems, ...trialListItems];
            setUsers(allItems);

            // Verificar quais vendedores têm agenda configurada
            const vendedores = adminUsers.filter(u => u.role === 'vendedor');
            const schedulePromises = vendedores.map(async v => {
                const hasSchedule = await vendedorScheduleService.hasSchedule(v.id);
                return { id: v.id, hasSchedule };
            });
            const results = await Promise.all(schedulePromises);
            const withSchedule = new Set(results.filter(r => r.hasSchedule).map(r => r.id));
            setVendedoresWithSchedule(withSchedule);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }
        setLoading(false);
    };

    const handleOpenModal = (item?: ListItem) => {
        if (item && item.type === 'admin_user') {
            setEditingUser(item);
            setFormData({
                name: item.name,
                email: item.email,
                password: '',
                role: item.role!,
                genero: (item.genero as UserGender) || 'feminino',
                userType: item.role!,
                trialDays: 30
            });
            setAvatarUrl(item.avatar_url || null);
            setCreatedUserId(item.id);
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'cliente',
                genero: 'feminino',
                userType: 'cliente',
                trialDays: 30
            });
            setAvatarUrl(null);
            setCreatedUserId(null);
        }
        setModalStep(1);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalStep(1);
        setCreatedUserId(null);
        setAvatarUrl(null);
        loadUsers(); // Recarregar para atualizar badges
    };

    // Upload de avatar
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione uma imagem');
            return;
        }

        // Validar tamanho (máximo 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 2MB');
            return;
        }

        setUploadingAvatar(true);

        try {
            // Gerar nome único para o arquivo
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Upload para o Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                // Se o bucket não existir, tentar criar
                if (uploadError.message.includes('bucket') || uploadError.message.includes('not found')) {
                    alert('Erro: Bucket de avatars não configurado. Configure o bucket "avatars" no Supabase Storage.');
                    return;
                }
                throw uploadError;
            }

            // Obter URL pública
            const { data: publicUrl } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl.publicUrl);

            // Se estiver editando um usuário, atualizar diretamente no banco
            if (editingUser) {
                await adminUsersService.update(editingUser.id, {
                    avatar_url: publicUrl.publicUrl
                });
            }
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            alert('Erro ao fazer upload da imagem');
        } finally {
            setUploadingAvatar(false);
            // Limpar o input para permitir selecionar o mesmo arquivo novamente
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Remover avatar
    const handleRemoveAvatar = async () => {
        if (!avatarUrl) return;

        setUploadingAvatar(true);

        try {
            // Extrair o path do arquivo da URL
            const urlParts = avatarUrl.split('/avatars/');
            if (urlParts.length > 1) {
                const filePath = `avatars/${urlParts[1]}`;
                await supabase.storage.from('avatars').remove([filePath]);
            }

            setAvatarUrl(null);

            // Se estiver editando um usuário, atualizar diretamente no banco
            if (editingUser) {
                await adminUsersService.update(editingUser.id, {
                    avatar_url: null
                });
            }
        } catch (error) {
            console.error('Erro ao remover avatar:', error);
            alert('Erro ao remover avatar');
        } finally {
            setUploadingAvatar(false);
        }
    };

    // Abre o modal de confirmação de exclusão
    const openDeleteModal = (item: ListItem) => {
        if (item.type === 'admin_user' && item.id === currentUser?.id) {
            alert('Você não pode excluir sua própria conta!');
            return;
        }
        setDeleteModal({
            isOpen: true,
            itemId: item.id,
            itemName: item.type === 'free_trial' ? item.email : item.name,
            itemType: item.type
        });
    };

    // Fecha o modal de confirmação
    const closeDeleteModal = () => {
        if (!isDeleting) {
            setDeleteModal({ isOpen: false, itemId: null, itemName: '', itemType: null });
        }
    };

    // Confirma a exclusão
    const handleConfirmDelete = async () => {
        if (!deleteModal.itemId || !deleteModal.itemType) return;

        setIsDeleting(true);
        try {
            if (deleteModal.itemType === 'admin_user') {
                await adminUsersService.delete(deleteModal.itemId);
            } else {
                // Deletar da tabela promotional_trials
                const { error } = await (supabase as any)
                    .from('promotional_trials')
                    .delete()
                    .eq('id', deleteModal.itemId);
                if (error) throw error;
            }
            loadUsers();
            closeDeleteModal();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert(deleteModal.itemType === 'free_trial' ? 'Erro ao excluir teste grátis' : 'Erro ao excluir usuário');
        }
        setIsDeleting(false);
    };

    const handleDelete = (item: ListItem) => {
        openDeleteModal(item);
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        if (id === currentUser?.id) {
            alert('Você não pode desativar sua própria conta!');
            return;
        }
        try {
            await adminUsersService.toggleActive(id, !currentStatus);
            loadUsers();
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            alert('Erro ao alterar status do usuário');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Se é teste grátis, inserir na tabela promotional_trials
            if (formData.userType === 'free_trial') {
                // Calcular data de expiração
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + formData.trialDays);

                // Inserir na tabela promotional_trials
                const { error: trialError } = await (supabase as any)
                    .from('promotional_trials')
                    .insert({
                        email: formData.email.toLowerCase(),
                        name: formData.name || null,
                        trial_days: formData.trialDays,
                        campaign: 'admin_manual',
                        created_at: new Date().toISOString()
                    });

                if (trialError) {
                    // Se o email já existe, atualizar
                    if (trialError.code === '23505') {
                        const { error: updateError } = await (supabase as any)
                            .from('promotional_trials')
                            .update({
                                name: formData.name || null,
                                trial_days: formData.trialDays,
                                redeemed_at: null,
                                redeemed_by: null,
                                expires_at: null
                            })
                            .eq('email', formData.email.toLowerCase());

                        if (updateError) throw updateError;
                    } else {
                        throw trialError;
                    }
                }

                handleCloseModal();
                toast.success(`Teste grátis de ${formatTrialPeriod(formData.trialDays)} liberado para ${formData.email}`);
                return;
            }

            if (editingUser) {
                await adminUsersService.update(editingUser.id, {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    genero: formData.role === 'vendedor' ? formData.genero : undefined,
                    ...(formData.password ? { password: formData.password } : {})
                });

                // Se é vendedor, ir para step 2 para configurar agenda
                if (formData.role === 'vendedor') {
                    setCreatedUserId(editingUser.id);
                    setModalStep(2);
                } else {
                    handleCloseModal();
                }
            } else {
                if (!formData.password) {
                    alert('A senha é obrigatória para novos usuários');
                    return;
                }
                const newUser = await adminUsersService.create({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    genero: formData.role === 'vendedor' ? formData.genero : undefined,
                    created_by: currentUser?.id,
                    avatar_url: avatarUrl || undefined
                });

                // Se é vendedor, ir para step 2 para configurar agenda
                if (formData.role === 'vendedor') {
                    setCreatedUserId(newUser.id);
                    setModalStep(2);
                } else {
                    handleCloseModal();
                }
            }
        } catch (error: unknown) {
            console.error('Erro ao salvar usuário:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            alert('Erro ao salvar usuário: ' + errorMessage);
        }
    };

    const handleScheduleSaved = () => {
        handleCloseModal();
    };

    const handleOpenScheduleConfig = (item: ListItem) => {
        if (item.type !== 'admin_user') return;
        setEditingUser(item);
        setCreatedUserId(item.id);
        setFormData({
            name: item.name,
            email: item.email,
            password: '',
            role: item.role!,
            genero: (item.genero as UserGender) || 'feminino',
            userType: item.role!,
            trialDays: 30
        });
        setModalStep(2);
        setIsModalOpen(true);
    };

    const getItemIconColor = (item: ListItem) => {
        if (item.type === 'free_trial') return 'text-green-400';
        switch (item.role) {
            case 'admin':
                return 'text-red-400';
            case 'vendedor':
                return 'text-blue-400';
            default:
                return 'text-gray-400';
        }
    };

    const getItemLabel = (item: ListItem) => {
        if (item.type === 'free_trial') {
            return `Teste (${formatTrialPeriod(item.trial_days || 30)})`;
        }
        switch (item.role) {
            case 'admin':
                return 'Administrador';
            case 'vendedor':
                return 'Vendedor';
            default:
                return 'Cliente';
        }
    };

    const getItemColor = (item: ListItem) => {
        if (item.type === 'free_trial') {
            return 'bg-green-500/20 text-green-400 border-green-500/30';
        }
        switch (item.role) {
            case 'admin':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'vendedor':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getItemStatus = (item: ListItem) => {
        if (item.type === 'free_trial') {
            return item.trial_redeemed ? 'Iniciado' : 'Pendente';
        }
        return item.is_active ? 'Ativo' : 'Inativo';
    };

    const getItemStatusColor = (item: ListItem) => {
        if (item.type === 'free_trial') {
            return item.trial_redeemed
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        }
        return item.is_active
            ? 'bg-green-500/20 text-green-400 border-green-500/30'
            : 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-white font-display uppercase">Usuários</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-brand-yellow text-brand-darker px-4 py-2 font-bold uppercase text-sm flex items-center hover:bg-brand-yellow/90 transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Usuário
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-brand-card border border-white/5 rounded-sm p-4 mb-6">
                <div className="flex items-center gap-4 flex-wrap">
                    {/* Search Input */}
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou e-mail..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-brand-dark border border-white/10 rounded-sm text-white text-sm pl-9 pr-3 py-2 outline-none focus:border-brand-yellow/50 transition-colors"
                        />
                    </div>

                    {/* Role Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm font-bold uppercase hidden sm:inline">Tipo:</span>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-brand-dark border border-white/10 rounded-sm text-white text-sm px-3 py-2 outline-none focus:border-brand-yellow/50 transition-colors"
                        >
                            <option value="all">Todos os Tipos</option>
                            <option value="admin">Administrador</option>
                            <option value="vendedor">Vendedor</option>
                            <option value="cliente">Cliente</option>
                            <option value="free_trial">Teste Grátis</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm font-bold uppercase hidden sm:inline">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-brand-dark border border-white/10 rounded-sm text-white text-sm px-3 py-2 outline-none focus:border-brand-yellow/50 transition-colors"
                        >
                            <option value="all">Todos os Status</option>
                            <option value="active">Ativo / Iniciado</option>
                            <option value="inactive">Inativo / Pendente</option>
                        </select>
                    </div>

                    {/* Clear Filters Button */}
                    {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setRoleFilter('all');
                                setStatusFilter('all');
                            }}
                            className="flex items-center gap-1 text-xs text-brand-yellow hover:text-brand-yellow/80 transition-colors"
                        >
                            <Filter className="w-3 h-3" />
                            Limpar filtros
                        </button>
                    )}
                </div>
            </div >

            {
                loading ? (
                    <div className="text-white" > Carregando...</div>
                ) : (
                    <div className="bg-brand-card border border-white/5 rounded-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-brand-dark/50">
                                <tr>
                                    <th className="text-left text-gray-400 text-xs font-bold uppercase p-4">Usuário</th>
                                    <th className="text-left text-gray-400 text-xs font-bold uppercase p-4">Tipo</th>
                                    <th className="text-left text-gray-400 text-xs font-bold uppercase p-4">Status</th>
                                    <th className="text-left text-gray-400 text-xs font-bold uppercase p-4">Último Login</th>
                                    <th className="text-right text-gray-400 text-xs font-bold uppercase p-4">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">
                                            Nenhum usuário encontrado com os filtros selecionados.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((item) => (
                                        <tr
                                            key={item.id}
                                            className={`hover:bg-white/5 transition-colors ${item.type === 'admin_user' && item.role === 'cliente' ? 'cursor-pointer' : ''}`}
                                            onClick={() => item.type === 'admin_user' && item.role === 'cliente' && navigate(`/admin/users/${item.id}`)}
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 overflow-hidden bg-brand-dark border border-white/10">
                                                        {item.avatar_url ? (
                                                            <img
                                                                src={item.avatar_url}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : item.type === 'free_trial' ? (
                                                            <Gift className={`w-5 h-5 ${getItemIconColor(item)}`} />
                                                        ) : (
                                                            <User className={`w-5 h-5 ${getItemIconColor(item)}`} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-bold">{item.type === 'free_trial' ? item.email : item.name}</p>
                                                        <p className="text-gray-500 text-xs">{item.type === 'free_trial' ? `Teste: ${formatTrialPeriod(item.trial_days || 30)}` : item.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded text-xs font-bold uppercase border ${getItemColor(item)}`}>
                                                    {getItemLabel(item)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                {item.type === 'free_trial' ? (
                                                    <span className={`px-3 py-1 rounded text-xs font-bold uppercase border ${getItemStatusColor(item)}`}>
                                                        {getItemStatus(item)}
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleActive(item.id, !!item.is_active);
                                                        }}
                                                        disabled={item.id === currentUser?.id}
                                                        className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${getItemStatusColor(item)} ${item.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                                                    >
                                                        {getItemStatus(item)}
                                                    </button>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className="text-gray-400 text-sm">
                                                    {item.type === 'free_trial'
                                                        ? (item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : '-')
                                                        : (item.last_login ? new Date(item.last_login).toLocaleString('pt-BR') : 'Nunca')
                                                    }
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-end space-x-2">
                                                    {item.type === 'admin_user' && item.role === 'vendedor' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenScheduleConfig(item);
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-brand-yellow transition-colors"
                                                            title="Configurar Agenda"
                                                        >
                                                            <Calendar className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {item.type === 'admin_user' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenModal(item);
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-brand-yellow transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(item);
                                                        }}
                                                        disabled={item.type === 'admin_user' && item.id === currentUser?.id}
                                                        className={`p-2 text-gray-400 hover:text-red-500 transition-colors ${item.type === 'admin_user' && item.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''
                                                            }`}
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )))}
                            </tbody>
                        </table>
                    </div>
                )}

            {/* Modal Multi-Step */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className={`bg-brand-card border border-white/10 w-full rounded-sm p-6 transition-all max-h-[90vh] overflow-y-auto ${modalStep === 2 ? 'max-w-2xl' : 'max-w-md'
                            }`}>
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xl font-bold text-white uppercase">
                                        {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                                    </h3>
                                    {formData.role === 'vendedor' && (
                                        <div className="flex items-center gap-2">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${modalStep === 1 ? 'bg-brand-yellow text-brand-darker' : 'bg-white/10 text-gray-400'
                                                }`}>
                                                1
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-gray-500" />
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${modalStep === 2 ? 'bg-brand-yellow text-brand-darker' : 'bg-white/10 text-gray-400'
                                                }`}>
                                                2
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <button onClick={handleCloseModal} className="text-gray-500 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {modalStep === 1 ? (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Avatar Uploader - apenas para usuários normais */}
                                    {formData.userType !== 'free_trial' && (
                                    <div className="flex flex-col items-center mb-4">
                                        <label className="block text-gray-400 text-xs font-bold uppercase mb-3">Foto de Perfil</label>
                                        <div className="relative">
                                            {/* Preview da imagem */}
                                            <div className="w-24 h-24 rounded-full bg-brand-dark border-2 border-white/10 flex items-center justify-center overflow-hidden">
                                                {uploadingAvatar ? (
                                                    <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
                                                ) : avatarUrl ? (
                                                    <img
                                                        src={avatarUrl}
                                                        alt="Avatar"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="w-10 h-10 text-gray-500" />
                                                )}
                                            </div>

                                            {/* Botão de upload sobreposto */}
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploadingAvatar}
                                                className="absolute bottom-0 right-0 w-8 h-8 bg-brand-yellow text-brand-darker rounded-full flex items-center justify-center hover:bg-yellow-400 transition-colors disabled:opacity-50"
                                                title="Alterar foto"
                                            >
                                                <Camera className="w-4 h-4" />
                                            </button>

                                            {/* Input de arquivo oculto */}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarUpload}
                                                className="hidden"
                                            />
                                        </div>

                                        {/* Botão remover */}
                                        {avatarUrl && !uploadingAvatar && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveAvatar}
                                                className="mt-2 text-red-400 text-xs hover:text-red-300 transition-colors flex items-center gap-1"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Remover foto
                                            </button>
                                        )}

                                        <p className="text-gray-600 text-xs mt-2">JPG, PNG ou GIF. Máx 2MB</p>
                                    </div>
                                    )}

                                    {/* Tipo de Usuário - Primeiro campo para controlar os demais */}
                                    <div>
                                        <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Tipo de Usuário</label>
                                        <select
                                            value={formData.userType}
                                            onChange={(e) => {
                                                const newType = e.target.value as UserTypeOption;
                                                setFormData({
                                                    ...formData,
                                                    userType: newType,
                                                    role: newType === 'free_trial' ? 'cliente' : newType as UserRole
                                                });
                                            }}
                                            className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                            disabled={!!editingUser}
                                        >
                                            <option value="cliente">Cliente</option>
                                            <option value="vendedor">Vendedor</option>
                                            <option value="admin">Administrador</option>
                                            {!editingUser && <option value="free_trial">Teste Grátis</option>}
                                        </select>
                                        {formData.userType === 'free_trial' && (
                                            <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                                                <Gift className="w-3 h-3" />
                                                O usuário receberá o período de teste ao se cadastrar com este e-mail
                                            </p>
                                        )}
                                        {formData.userType === 'vendedor' && (
                                            <p className="text-gray-500 text-xs mt-2 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                Após salvar, você poderá configurar a agenda do vendedor
                                            </p>
                                        )}
                                    </div>

                                    {/* Campo Nome */}
                                    <div>
                                        <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                                            Nome {formData.userType === 'free_trial' && <span className="text-gray-600">(opcional)</span>}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                            required={formData.userType !== 'free_trial'}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-xs font-bold uppercase mb-2">E-mail</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                            required
                                        />
                                    </div>

                                    {/* Senha - Apenas para usuários normais (não teste grátis) */}
                                    {formData.userType !== 'free_trial' && (
                                        <div>
                                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                                                Senha {editingUser && <span className="text-gray-600">(deixe em branco para manter)</span>}
                                            </label>
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                                required={!editingUser}
                                            />
                                        </div>
                                    )}

                                    {/* Período de Teste - Apenas para teste grátis */}
                                    {formData.userType === 'free_trial' && (
                                        <div>
                                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Período de Teste</label>
                                            <select
                                                value={formData.trialDays}
                                                onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) })}
                                                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                            >
                                                {TRIAL_PERIOD_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Campo de Gênero - apenas para vendedores */}
                                    {formData.userType === 'vendedor' && (
                                        <div>
                                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Gênero</label>
                                            <select
                                                value={formData.genero}
                                                onChange={(e) => setFormData({ ...formData, genero: e.target.value as UserGender })}
                                                className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                            >
                                                <option value="feminino">Feminino</option>
                                                <option value="masculino">Masculino</option>
                                            </select>
                                            <p className="text-gray-500 text-xs mt-2">
                                                Usado para textos como "Sua Especialista" ou "Seu Especialista"
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-4 flex justify-end space-x-4">
                                        <button
                                            type="button"
                                            onClick={handleCloseModal}
                                            className="px-6 py-3 text-gray-400 font-bold uppercase text-xs hover:text-white transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="bg-brand-yellow text-brand-darker px-8 py-3 font-bold uppercase text-xs hover:bg-brand-yellow/90 transition-colors flex items-center gap-2"
                                        >
                                            {formData.userType === 'vendedor' ? (
                                                <>
                                                    Próximo
                                                    <ChevronRight className="w-4 h-4" />
                                                </>
                                            ) : formData.userType === 'free_trial' ? (
                                                <>
                                                    <Gift className="w-4 h-4" />
                                                    Liberar Teste
                                                </>
                                            ) : (
                                                'Salvar'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div>
                                    <div className="mb-4 flex items-center gap-2">
                                        <button
                                            onClick={() => setModalStep(1)}
                                            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Voltar para dados do usuário
                                        </button>
                                    </div>

                                    {createdUserId && (
                                        <SellerScheduleConfig
                                            vendedorId={createdUserId}
                                            onSave={handleScheduleSaved}
                                            onCancel={handleCloseModal}
                                            showButtons={true}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Modal de confirmação de exclusão */}
            <ConfirmDeleteModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                title={deleteModal.itemType === 'free_trial' ? 'Excluir Teste Grátis' : 'Excluir Usuário'}
                message={deleteModal.itemType === 'free_trial'
                    ? `Tem certeza que deseja excluir o teste grátis para "${deleteModal.itemName}"? Esta ação não pode ser desfeita.`
                    : `Tem certeza que deseja excluir o usuário "${deleteModal.itemName}"? Esta ação não pode ser desfeita.`
                }
                itemName={deleteModal.itemName}
                isLoading={isDeleting}
            />
        </div >
    );
};
