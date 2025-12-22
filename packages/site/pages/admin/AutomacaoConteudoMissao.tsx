import React from 'react';
import {
    Zap,
    Server,
    Database,
    ArrowRight,
    CheckCircle,
    FileText,
    Cpu,
    Workflow,
    Play,
    Users,
    BookOpen,
    AlertTriangle,
    Code,
    Terminal,
    RefreshCw,
} from 'lucide-react';

/**
 * Página de documentação técnica sobre automação de geração de conteúdo de missões.
 * Acesso apenas via URL direta: /admin/automacao-conteudo-missao
 * Nenhum link deve apontar para esta página.
 */
export function AutomacaoConteudoMissao() {
    return (
        <div className="min-h-screen bg-brand-darker p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-brand-yellow to-amber-500 rounded-lg flex items-center justify-center">
                            <Cpu className="w-6 h-6 text-black" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Automação de Conteúdo de Missões</h1>
                            <p className="text-gray-400">Documentação Técnica do Servidor Mastra</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4">
                        <span className="px-3 py-1 bg-brand-yellow/20 text-brand-yellow text-sm rounded-full font-medium">
                            Mastra Server
                        </span>
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full font-medium">
                            Gemini AI
                        </span>
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-full font-medium">
                            Express.js
                        </span>
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    <div className="bg-brand-card border border-white/10 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Server className="w-5 h-5 text-brand-yellow" />
                            <h3 className="font-semibold text-white">Servidor</h3>
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">localhost:4000</p>
                        <p className="text-gray-400 text-sm">Porta padrão do Mastra</p>
                    </div>
                    <div className="bg-brand-card border border-white/10 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Cpu className="w-5 h-5 text-blue-400" />
                            <h3 className="font-semibold text-white">Agentes IA</h3>
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">6 Agentes</p>
                        <p className="text-gray-400 text-sm">Configurados no Mastra</p>
                    </div>
                    <div className="bg-brand-card border border-white/10 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Zap className="w-5 h-5 text-green-400" />
                            <h3 className="font-semibold text-white">Modelo</h3>
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">Gemini 3 Pro</p>
                        <p className="text-gray-400 text-sm">Preview para conteúdo</p>
                    </div>
                </div>

                {/* Agentes Section */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-brand-yellow" />
                        Agentes de IA Configurados
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            {
                                name: 'contentGeneratorAgent',
                                model: 'gemini-3-pro-preview',
                                description: 'Gera aulas didáticas completas (~2000 palavras) baseadas nos tópicos e questões da missão.',
                                color: 'text-brand-yellow',
                                bgColor: 'bg-brand-yellow/10',
                            },
                            {
                                name: 'audioScriptAgent',
                                model: 'gemini-3-pro-preview',
                                description: 'Adapta o texto gerado para narração de áudio natural, removendo formatação e adicionando transições.',
                                color: 'text-purple-400',
                                bgColor: 'bg-purple-500/10',
                            },
                            {
                                name: 'tutorAgent',
                                model: 'gemini-2.0-flash',
                                description: 'Mentor virtual que responde dúvidas dos alunos durante as questões e aulas.',
                                color: 'text-blue-400',
                                bgColor: 'bg-blue-500/10',
                            },
                            {
                                name: 'editalFullAnalyzerAgent',
                                model: 'gemini-2.0-flash',
                                description: 'Analisa PDF do edital e extrai estrutura completa (blocos, matérias, tópicos).',
                                color: 'text-green-400',
                                bgColor: 'bg-green-500/10',
                            },
                            {
                                name: 'editalParserAgent',
                                model: 'gemini-2.0-flash',
                                description: 'Parseia texto do edital quando colado manualmente pelo admin.',
                                color: 'text-orange-400',
                                bgColor: 'bg-orange-500/10',
                            },
                            {
                                name: 'materiaPriorityAgent',
                                model: 'gemini-2.0-flash',
                                description: 'Sugere ordem de prioridade de estudo das matérias com base na banca.',
                                color: 'text-pink-400',
                                bgColor: 'bg-pink-500/10',
                            },
                        ].map((agent) => (
                            <div key={agent.name} className={`${agent.bgColor} border border-white/5 rounded-lg p-5`}>
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className={`font-mono font-semibold ${agent.color}`}>{agent.name}</h3>
                                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">{agent.model}</span>
                                </div>
                                <p className="text-gray-300 text-sm">{agent.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Flow Section 1: Initial Generation */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Play className="w-5 h-5 text-brand-yellow" />
                        Fluxo 1: Geração Inicial (Primeiras 2 Missões)
                    </h2>
                    <div className="bg-brand-card border border-white/10 rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded font-mono">
                                POST /api/preparatorio/:id/finalizar-montagem
                            </span>
                        </div>
                        <p className="text-gray-300 mb-6">
                            Quando o administrador clica em "Finalizar" na tela de montagem de missões, o sistema automaticamente
                            inicia a geração de conteúdo para as <strong className="text-white">2 primeiras missões de estudo</strong>.
                            Isso garante que o conteúdo estará pronto quando o primeiro aluno acessar.
                        </p>

                        {/* Flow Diagram */}
                        <div className="bg-brand-darker/50 rounded-lg p-6 overflow-x-auto">
                            <div className="flex items-center gap-4 min-w-max">
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center mb-2">
                                        <Users className="w-8 h-8 text-blue-400" />
                                    </div>
                                    <span className="text-sm text-gray-400">Admin</span>
                                </div>
                                <ArrowRight className="w-6 h-6 text-gray-600" />
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-brand-yellow/20 rounded-lg flex items-center justify-center mb-2">
                                        <CheckCircle className="w-8 h-8 text-brand-yellow" />
                                    </div>
                                    <span className="text-sm text-gray-400">Finalizar</span>
                                </div>
                                <ArrowRight className="w-6 h-6 text-gray-600" />
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center mb-2">
                                        <Server className="w-8 h-8 text-purple-400" />
                                    </div>
                                    <span className="text-sm text-gray-400">Server</span>
                                </div>
                                <ArrowRight className="w-6 h-6 text-gray-600" />
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mb-2">
                                        <Database className="w-8 h-8 text-green-400" />
                                    </div>
                                    <span className="text-sm text-gray-400">Missões 1-2</span>
                                </div>
                                <ArrowRight className="w-6 h-6 text-gray-600" />
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-brand-yellow/20 rounded-lg flex items-center justify-center mb-2">
                                        <Cpu className="w-8 h-8 text-brand-yellow" />
                                    </div>
                                    <span className="text-sm text-gray-400">IA Gera</span>
                                </div>
                                <ArrowRight className="w-6 h-6 text-gray-600" />
                                <div className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mb-2">
                                        <FileText className="w-8 h-8 text-green-400" />
                                    </div>
                                    <span className="text-sm text-gray-400">Conteúdo</span>
                                </div>
                            </div>
                        </div>

                        {/* Code Block */}
                        <div className="mt-6 bg-[#1e1e1e] rounded-lg overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d] border-b border-white/10">
                                <Terminal className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-400">server.ts - Linhas 3628-3651</span>
                            </div>
                            <pre className="p-4 text-sm overflow-x-auto">
                                <code className="text-gray-300">
                                    {`// Após finalizar montagem com sucesso
if (result.success) {
    console.log('[Builder] Disparando geração automática...');
    
    // Buscar as primeiras 2 missões de estudo
    const primeiras = await getPrimeirasMissoes(preparatorioId, 2);
    
    if (primeiras.length > 0) {
        // Gerar em background (fire-and-forget)
        for (const missaoId of primeiras) {
            gerarConteudoMissaoBackground(missaoId)
                .then(success => console.log(\`Missão \${missaoId}: OK\`))
                .catch(err => console.error(err));
        }
    }
}`}
                                </code>
                            </pre>
                        </div>
                    </div>
                </section>

                {/* Flow Section 2: Cascade N+2 */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-brand-yellow" />
                        Fluxo 2: Geração em Cascata (N+2)
                    </h2>
                    <div className="bg-brand-card border border-white/10 rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-sm rounded font-mono">
                                POST /api/missao/trigger-proxima
                            </span>
                        </div>
                        <p className="text-gray-300 mb-6">
                            Quando um aluno acessa a missão <strong className="text-white">N</strong>, o sistema automaticamente
                            pré-gera a missão <strong className="text-white">N+2</strong>. Isso garante que sempre há conteúdo
                            pronto 2 passos à frente do aluno.
                        </p>

                        {/* Cascade Diagram */}
                        <div className="bg-brand-darker/50 rounded-lg p-6 mb-6">
                            <h4 className="text-white font-medium mb-4">Exemplo do Fluxo:</h4>
                            <div className="space-y-3">
                                {[
                                    { aluno: 'Missão 1', gera: 'Missão 3', status: 'Missão 2 já existe (gerada na criação)' },
                                    { aluno: 'Missão 2', gera: 'Missão 4', status: 'Missão 3 já existe (gerada no passo anterior)' },
                                    { aluno: 'Missão 3', gera: 'Missão 5', status: 'Missão 4 já existe (gerada no passo anterior)' },
                                    { aluno: 'Missão 4', gera: 'Missão 6', status: 'E assim por diante...' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2 min-w-[120px]">
                                            <Users className="w-4 h-4 text-blue-400" />
                                            <span className="text-blue-400">Aluno em {item.aluno}</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-600" />
                                        <div className="flex items-center gap-2 min-w-[120px]">
                                            <Cpu className="w-4 h-4 text-brand-yellow" />
                                            <span className="text-brand-yellow">Gera {item.gera}</span>
                                        </div>
                                        <span className="text-gray-500">({item.status})</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Why N+2 */}
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <h4 className="text-green-400 font-medium mb-2 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Por que N+2 e não N+1?
                            </h4>
                            <p className="text-gray-300 text-sm">
                                Se gerássemos apenas N+1, o aluno poderia terminar a missão atual antes da próxima estar pronta.
                                Com N+2, sempre há uma "folga" - a missão imediatamente seguinte já está pronta enquanto a próxima é gerada.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Main Function Section */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Code className="w-5 h-5 text-brand-yellow" />
                        Função Principal: gerarConteudoMissaoBackground
                    </h2>
                    <div className="bg-brand-card border border-white/10 rounded-lg p-6">
                        <p className="text-gray-300 mb-6">
                            Esta é a função central que gera todo o conteúdo didático. Localizada em{' '}
                            <code className="text-brand-yellow bg-brand-yellow/10 px-2 py-0.5 rounded">server.ts linhas 1362-1600</code>.
                        </p>

                        {/* Steps */}
                        <div className="space-y-4">
                            {[
                                { step: 1, title: 'Deduplicação', desc: 'Verifica se já está gerando (evita duplicatas)', icon: RefreshCw },
                                { step: 2, title: 'Verificar Existência', desc: 'Checa tabela missao_conteudos', icon: Database },
                                { step: 3, title: 'Reset Travados', desc: 'Se status "generating" há >5 min, reseta', icon: AlertTriangle },
                                { step: 4, title: 'Criar Registro', desc: 'Insere com status "generating"', icon: FileText },
                                { step: 5, title: 'Buscar Dados', desc: 'Matéria, assuntos, preparatório', icon: Database },
                                { step: 6, title: 'Buscar Questões', desc: 'Chama buscarQuestoesScrapping (~15 questões)', icon: BookOpen },
                                { step: 7, title: 'Gerar Conteúdo', desc: 'Chama contentGeneratorAgent com prompt', icon: Cpu },
                                { step: 8, title: 'Salvar Resultado', desc: 'Atualiza com texto e status "completed"', icon: CheckCircle },
                            ].map((item) => (
                                <div key={item.step} className="flex items-start gap-4 bg-brand-darker/50 rounded-lg p-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-brand-yellow/20 rounded-full flex items-center justify-center">
                                        <span className="text-brand-yellow font-bold text-sm">{item.step}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <item.icon className="w-4 h-4 text-gray-400" />
                                            <h4 className="text-white font-medium">{item.title}</h4>
                                        </div>
                                        <p className="text-gray-400 text-sm">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Database Section */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Database className="w-5 h-5 text-brand-yellow" />
                        Tabelas do Banco de Dados
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* missao_conteudos */}
                        <div className="bg-brand-card border border-white/10 rounded-lg overflow-hidden">
                            <div className="bg-brand-yellow/10 px-4 py-3 border-b border-white/10">
                                <h3 className="font-mono text-brand-yellow">missao_conteudos</h3>
                            </div>
                            <div className="p-4">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-gray-400 text-left">
                                            <th className="pb-2">Campo</th>
                                            <th className="pb-2">Tipo</th>
                                            <th className="pb-2">Descrição</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-300">
                                        <tr><td className="py-1 font-mono text-blue-400">id</td><td>uuid</td><td>PK</td></tr>
                                        <tr><td className="py-1 font-mono text-blue-400">missao_id</td><td>uuid</td><td>FK missoes</td></tr>
                                        <tr><td className="py-1 font-mono text-blue-400">texto_content</td><td>text</td><td>Aula (MD)</td></tr>
                                        <tr><td className="py-1 font-mono text-blue-400">audio_url</td><td>text</td><td>URL áudio</td></tr>
                                        <tr><td className="py-1 font-mono text-blue-400">status</td><td>text</td><td>generating/completed/failed</td></tr>
                                        <tr><td className="py-1 font-mono text-blue-400">modelo_texto</td><td>text</td><td>Ex: gemini-3-pro</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* missoes */}
                        <div className="bg-brand-card border border-white/10 rounded-lg overflow-hidden">
                            <div className="bg-purple-500/10 px-4 py-3 border-b border-white/10">
                                <h3 className="font-mono text-purple-400">missoes</h3>
                            </div>
                            <div className="p-4">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-gray-400 text-left">
                                            <th className="pb-2">Campo</th>
                                            <th className="pb-2">Tipo</th>
                                            <th className="pb-2">Descrição</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-300">
                                        <tr><td className="py-1 font-mono text-blue-400">id</td><td>uuid</td><td>PK</td></tr>
                                        <tr><td className="py-1 font-mono text-blue-400">rodada_id</td><td>uuid</td><td>FK rodadas</td></tr>
                                        <tr><td className="py-1 font-mono text-blue-400">numero</td><td>text</td><td>"1", "2", etc.</td></tr>
                                        <tr><td className="py-1 font-mono text-blue-400">tipo</td><td>text</td><td>padrao/revisao/acao</td></tr>
                                        <tr><td className="py-1 font-mono text-blue-400">materia</td><td>text</td><td>Nome matéria</td></tr>
                                        <tr><td className="py-1 font-mono text-blue-400">assunto</td><td>text</td><td>Tópicos (\n sep)</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Endpoints Section */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Workflow className="w-5 h-5 text-brand-yellow" />
                        Endpoints Principais
                    </h2>
                    <div className="bg-brand-card border border-white/10 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-brand-darker/50 text-gray-400 text-left">
                                    <th className="px-4 py-3">Método</th>
                                    <th className="px-4 py-3">Endpoint</th>
                                    <th className="px-4 py-3">Descrição</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-300">
                                {[
                                    { method: 'POST', endpoint: '/api/missao/gerar-conteudo-background', desc: 'Dispara geração de N missões' },
                                    { method: 'POST', endpoint: '/api/missao/trigger-proxima', desc: 'Pré-gera missão N+2' },
                                    { method: 'POST', endpoint: '/api/preparatorio/:id/finalizar-montagem', desc: 'Finaliza e gera primeiras 2' },
                                    { method: 'POST', endpoint: '/api/preparatorio/from-pdf-preview', desc: 'Analisa PDF e cria preparatório' },
                                    { method: 'POST', endpoint: '/api/preparatorio/gerar-imagem-capa', desc: 'Gera imagem de capa via IA' },
                                    { method: 'POST', endpoint: '/api/tutor', desc: 'Mentor virtual (chat)' },
                                ].map((item, i) => (
                                    <tr key={i} className="border-t border-white/5 hover:bg-white/5">
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-mono ${item.method === 'POST' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {item.method}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-brand-yellow">{item.endpoint}</td>
                                        <td className="px-4 py-3">{item.desc}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Troubleshooting Section */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-brand-yellow" />
                        Troubleshooting
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                problem: 'Conteúdo não gera',
                                solutions: [
                                    'Verificar se VITE_GEMINI_API_KEY está configurada',
                                    'Verificar logs do servidor para erros',
                                    'Verificar se há questões na tabela questoes_scrapping para o tópico',
                                ],
                            },
                            {
                                problem: 'Conteúdo trava em "generating"',
                                solutions: [
                                    'O sistema auto-reseta após 5 minutos',
                                    'Ou deletar manualmente da tabela missao_conteudos',
                                ],
                            },
                            {
                                problem: 'Questões erradas no conteúdo',
                                solutions: [
                                    'Verificar função buscarQuestoesScrapping',
                                    'Conferir se os tópicos da missão (campo assunto) estão corretos',
                                ],
                            },
                        ].map((item, i) => (
                            <div key={i} className="bg-red-500/5 border border-red-500/20 rounded-lg p-5">
                                <h4 className="text-red-400 font-medium mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    {item.problem}
                                </h4>
                                <ul className="space-y-2">
                                    {item.solutions.map((sol, j) => (
                                        <li key={j} className="flex items-start gap-2 text-gray-300 text-sm">
                                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                            {sol}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer */}
                <div className="text-center py-8 border-t border-white/10">
                    <p className="text-gray-500 text-sm">
                        Documentação técnica para desenvolvedores • Servidor Mastra v1.0
                    </p>
                    <p className="text-gray-600 text-xs mt-2">
                        Arquivo: packages/mastra/src/server.ts
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AutomacaoConteudoMissao;
