import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, User, Shield, ShoppingBag } from 'lucide-react';
import { adminUsersService } from '../../services/adminUsersService';
import { AdminUser, UserRole } from '../../lib/database.types';
import { useAuth } from '../../lib/AuthContext';

export const Users: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'cliente' as UserRole
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await adminUsersService.getAll();
            setUsers(data);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }
        setLoading(false);
    };

    const handleOpenModal = (user?: AdminUser) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                role: user.role
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'cliente'
            });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (id === currentUser?.id) {
            alert('Você não pode excluir sua própria conta!');
            return;
        }
        if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;

        try {
            await adminUsersService.delete(id);
            loadUsers();
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            alert('Erro ao excluir usuário');
        }
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
            if (editingUser) {
                await adminUsersService.update(editingUser.id, {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    ...(formData.password ? { password: formData.password } : {})
                });
            } else {
                if (!formData.password) {
                    alert('A senha é obrigatória para novos usuários');
                    return;
                }
                await adminUsersService.create({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    created_by: currentUser?.id
                });
            }
            setIsModalOpen(false);
            loadUsers();
        } catch (error: unknown) {
            console.error('Erro ao salvar usuário:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            alert('Erro ao salvar usuário: ' + errorMessage);
        }
    };

    const getRoleIcon = (role: UserRole) => {
        switch (role) {
            case 'admin':
                return <Shield className="w-4 h-4 text-red-400" />;
            case 'vendedor':
                return <ShoppingBag className="w-4 h-4 text-blue-400" />;
            default:
                return <User className="w-4 h-4 text-gray-400" />;
        }
    };

    const getRoleLabel = (role: UserRole) => {
        switch (role) {
            case 'admin':
                return 'Administrador';
            case 'vendedor':
                return 'Vendedor';
            default:
                return 'Cliente';
        }
    };

    const getRoleColor = (role: UserRole) => {
        switch (role) {
            case 'admin':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'vendedor':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
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

            {loading ? (
                <div className="text-white">Carregando...</div>
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
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-brand-yellow/20 rounded-full flex items-center justify-center mr-3">
                                                {getRoleIcon(user.role)}
                                            </div>
                                            <div>
                                                <p className="text-white font-bold">{user.name}</p>
                                                <p className="text-gray-500 text-xs">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded text-xs font-bold uppercase border ${getRoleColor(user.role)}`}>
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleToggleActive(user.id, user.is_active)}
                                            disabled={user.id === currentUser?.id}
                                            className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors ${
                                                user.is_active
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'
                                            } ${user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {user.is_active ? 'Ativo' : 'Inativo'}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-gray-400 text-sm">
                                            {user.last_login
                                                ? new Date(user.last_login).toLocaleString('pt-BR')
                                                : 'Nunca'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => handleOpenModal(user)}
                                                className="p-2 text-gray-400 hover:text-brand-yellow transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                disabled={user.id === currentUser?.id}
                                                className={`p-2 text-gray-400 hover:text-red-500 transition-colors ${
                                                    user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-brand-card border border-white/10 w-full max-w-md rounded-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white uppercase">
                                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Nome</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                    required
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

                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Tipo de Usuário</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                    className="w-full bg-brand-dark border border-white/10 p-3 text-white focus:border-brand-yellow outline-none transition-colors"
                                >
                                    <option value="cliente">Cliente</option>
                                    <option value="vendedor">Vendedor</option>
                                    <option value="admin">Administrador</option>
                                </select>
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
