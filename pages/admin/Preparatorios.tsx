import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, GraduationCap, Search } from 'lucide-react';

export const Preparatorios: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight font-display">
                        Preparatórios & Simulados
                    </h1>
                    <p className="text-gray-400 mt-1">Gerencie seus cursos preparatórios e simulados.</p>
                </div>
                <Link
                    to="/admin/preparatorios/new"
                    className="bg-brand-yellow text-brand-darker px-4 py-2 rounded-sm font-bold uppercase tracking-wide hover:bg-white transition-colors flex items-center"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Novo Preparatório
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-brand-card border border-white/5 p-4 rounded-sm flex gap-4">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Buscar preparatório..."
                        className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 pl-10 pr-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-brand-card border border-white/5 rounded-sm overflow-hidden">
                <div className="p-8 text-center text-gray-500">
                    <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Nenhum preparatório encontrado.</p>
                    <p className="text-sm mt-2">Clique no botão acima para criar o primeiro.</p>
                </div>
            </div>
        </div>
    );
};
