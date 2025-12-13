import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { studentService } from '../services/studentService';

export const StudentLogin: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await studentService.login(email, password);

            if (user) {
                // Salva no localStorage
                localStorage.setItem('ouse_student_user', JSON.stringify(user));

                // Redireciona para a página do planejamento
                navigate(redirectTo);
            } else {
                setError('E-mail ou senha incorretos');
            }
        } catch (err) {
            console.error('Erro no login:', err);
            setError('Erro ao fazer login. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-darker flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <img
                        src="https://i.ibb.co/dJLPGVb7/ouse-passar-logo-n.webp"
                        alt="Ouse Passar"
                        className="h-12 mx-auto mb-4"
                    />
                    <h1 className="text-2xl font-black text-white uppercase tracking-wide">
                        Acesse seu Planejamento
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Entre com os dados de acesso que você recebeu
                    </p>
                </div>

                {/* Card de Login */}
                <div className="bg-brand-card border border-white/10 rounded-sm p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Erro */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                                E-mail
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="seu@email.com"
                                    className="w-full bg-brand-dark border border-white/10 rounded-sm px-4 py-3 pl-12 text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-yellow/50 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Senha */}
                        <div>
                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">
                                Senha
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Sua senha"
                                    className="w-full bg-brand-dark border border-white/10 rounded-sm px-4 py-3 pl-12 text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-yellow/50 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Botão */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-yellow text-brand-darker py-4 font-bold uppercase tracking-wide hover:bg-brand-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                'Acessar Planejamento'
                            )}
                        </button>
                    </form>
                </div>

                {/* Rodapé */}
                <p className="text-center text-gray-600 text-sm mt-6">
                    Problemas para acessar? Entre em contato com seu consultor.
                </p>
            </div>
        </div>
    );
};
