import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle, Loader2, AlertCircle, FileText, BrainCircuit, Database, CheckSquare, GraduationCap } from 'lucide-react';

export const NewPreparatorio: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'simulado' | 'preparatorio'>('simulado');
    const [editalLink, setEditalLink] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStep, setGenerationStep] = useState<number>(0);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleGenerate = () => {
        if (!name || !editalLink) return;

        setIsGenerating(true);
        setGenerationStep(1);

        // Simulate steps
        setTimeout(() => setGenerationStep(2), 2000); // Analisando edital
        setTimeout(() => setGenerationStep(3), 4500); // Relacionando com banco
        setTimeout(() => setGenerationStep(4), 7000); // Gerando simulado
        setTimeout(() => {
            setIsGenerating(false);
            setShowSuccess(true);
        }, 9000);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <Link to="/admin/preparatorios" className="text-gray-400 hover:text-white flex items-center mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para Preparatórios
                </Link>
                <h1 className="text-3xl font-black text-white uppercase tracking-tight font-display">
                    Novo Preparatório
                </h1>
            </div>

            <div className="bg-brand-card border border-white/5 rounded-sm p-8 space-y-8">
                {/* Basic Info */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Nome do Preparatório
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Simulado Polícia Federal 2025"
                            className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Descrição
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            placeholder="Descreva o objetivo deste preparatório..."
                            className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600 resize-none"
                        />
                    </div>
                </div>

                {/* Toggles */}
                <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                        Tipo de Conteúdo
                    </label>
                    <div className="flex gap-4">
                        {/* Simulado Toggle */}
                        <button
                            onClick={() => setType('simulado')}
                            className={`flex-1 py-4 px-6 rounded-sm border-2 transition-all flex items-center justify-center ${type === 'simulado'
                                ? 'border-brand-yellow bg-brand-yellow/10 text-brand-yellow'
                                : 'border-white/10 bg-brand-dark text-gray-400 hover:border-white/20'
                                }`}
                        >
                            <CheckSquare className="w-5 h-5 mr-3" />
                            <span className="font-bold uppercase tracking-wide">Simulado</span>
                        </button>

                        {/* Preparatório Toggle (Disabled) */}
                        <div className="flex-1 relative group cursor-not-allowed">
                            <button
                                disabled
                                className="w-full h-full py-4 px-6 rounded-sm border-2 border-white/5 bg-brand-dark/50 text-gray-600 flex items-center justify-center cursor-not-allowed"
                            >
                                <GraduationCap className="w-5 h-5 mr-3" />
                                <span className="font-bold uppercase tracking-wide">Preparatório</span>
                            </button>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-black border border-white/10 text-white text-xs p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center z-10">
                                Este recurso ainda não está disponível.
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edital Upload */}
                <div className="space-y-6 pt-6 border-t border-white/5">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Download do Edital
                        </label>
                        <div className="border-2 border-dashed border-white/10 rounded-sm p-8 text-center hover:border-brand-yellow/50 transition-colors cursor-pointer bg-brand-dark/30">
                            <Upload className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">Clique para fazer upload do arquivo PDF</p>
                            <p className="text-gray-600 text-xs mt-1">Máximo 10MB</p>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-brand-card text-gray-500 uppercase text-xs font-bold">Ou cole o link abaixo</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={editalLink}
                            onChange={(e) => setEditalLink(e.target.value)}
                            placeholder="https://exemplo.com/edital.pdf"
                            className="flex-1 bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={!name || !editalLink || isGenerating || showSuccess}
                            className={`px-8 font-bold uppercase tracking-wide rounded-sm transition-all flex items-center ${!name || !editalLink || isGenerating || showSuccess
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-brand-yellow text-brand-darker hover:bg-white'
                                }`}
                        >
                            {isGenerating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Gerar'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Simulation Modal Overlay */}
            {isGenerating && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-brand-card border border-white/10 rounded-lg p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                        {/* Background Glow */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-yellow to-transparent animate-pulse"></div>

                        <div className="space-y-6">
                            {/* Step 1: Analisando Edital */}
                            <div className={`flex items-center transition-opacity duration-500 ${generationStep >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-colors ${generationStep > 1 ? 'bg-green-500/20 text-green-500' : generationStep === 1 ? 'bg-brand-yellow/20 text-brand-yellow animate-pulse' : 'bg-white/5 text-gray-500'}`}>
                                    {generationStep > 1 ? <CheckCircle className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className={`font-bold ${generationStep === 1 ? 'text-brand-yellow' : 'text-white'}`}>Analisando Edital</p>
                                    <p className="text-xs text-gray-500">Buscando informações da banca, cargo e matérias...</p>
                                </div>
                            </div>

                            {/* Step 2: Relacionando com Banco */}
                            <div className={`flex items-center transition-opacity duration-500 ${generationStep >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-colors ${generationStep > 2 ? 'bg-green-500/20 text-green-500' : generationStep === 2 ? 'bg-brand-yellow/20 text-brand-yellow animate-pulse' : 'bg-white/5 text-gray-500'}`}>
                                    {generationStep > 2 ? <CheckCircle className="w-5 h-5" /> : <Database className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className={`font-bold ${generationStep === 2 ? 'text-brand-yellow' : 'text-white'}`}>Mapeando Questões</p>
                                    <p className="text-xs text-gray-500">Relacionando tópicos com nosso banco de dados...</p>
                                </div>
                            </div>

                            {/* Step 3: Gerando Simulado */}
                            <div className={`flex items-center transition-opacity duration-500 ${generationStep >= 3 ? 'opacity-100' : 'opacity-30'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 transition-colors ${generationStep > 3 ? 'bg-green-500/20 text-green-500' : generationStep === 3 ? 'bg-brand-yellow/20 text-brand-yellow animate-pulse' : 'bg-white/5 text-gray-500'}`}>
                                    {generationStep > 3 ? <CheckCircle className="w-5 h-5" /> : <BrainCircuit className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className={`font-bold ${generationStep === 3 ? 'text-brand-yellow' : 'text-white'}`}>Gerando Simulado</p>
                                    <p className="text-xs text-gray-500">Estruturando prova e gabarito...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {showSuccess && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-brand-card border border-brand-yellow/20 rounded-lg p-8 max-w-md w-full shadow-2xl text-center animate-scale-in">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase mb-2">Sucesso!</h2>
                        <p className="text-gray-400 mb-6">
                            Simulado gerado com <span className="text-brand-yellow font-bold">3488 questões</span> mapeadas do edital.
                        </p>
                        <button
                            onClick={() => navigate('/admin/preparatorios')}
                            className="w-full bg-brand-yellow text-brand-darker py-3 font-bold uppercase tracking-wide rounded-sm hover:bg-white transition-colors"
                        >
                            Ver Simulado
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
