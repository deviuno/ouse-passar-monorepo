import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Tag,
  ShoppingCart,
  Coins,
  DollarSign,
  Users,
  Zap,
  Shield,
  Sparkles,
  BookOpen,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

export const StoreDocumentation: React.FC = () => {
  const sections: DocSection[] = [
    {
      id: 'visao-geral',
      title: 'Visao Geral',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            O sistema de loja permite que usuarios comprem itens usando <span className="text-brand-yellow font-bold">moedas do sistema</span> (gamificacao) ou <span className="text-green-400 font-bold">dinheiro real (R$)</span>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-brand-dark/50 border border-white/5 rounded-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-5 h-5 text-brand-yellow" />
                <span className="text-white font-bold">Moedas do Sistema</span>
              </div>
              <p className="text-gray-400 text-sm">
                Usuarios ganham moedas ao completar questoes, missoes, manter streaks e subir de nivel. Estas moedas podem ser usadas para comprar itens virtuais.
              </p>
            </div>
            <div className="bg-brand-dark/50 border border-white/5 rounded-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-white font-bold">Dinheiro Real (R$)</span>
              </div>
              <p className="text-gray-400 text-sm">
                Produtos como preparatorios e simulados podem ter precos em reais. O pagamento e processado via plataforma de pagamento integrada.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'categorias',
      title: 'Categorias de Produtos',
      icon: Tag,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Os produtos sao organizados em categorias para facilitar a navegacao. Cada categoria tem um icone e cor unicos.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-brand-dark/50 border border-white/5 rounded-sm">
              <span className="text-2xl">👤</span>
              <div>
                <h4 className="text-white font-bold">Avatares</h4>
                <p className="text-gray-400 text-sm">Imagens de perfil exclusivas que os usuarios podem desbloquear e usar.</p>
                <p className="text-brand-yellow text-xs mt-1">Precos: 500 - 10.000 moedas</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-brand-dark/50 border border-white/5 rounded-sm">
              <span className="text-2xl">🚀</span>
              <div>
                <h4 className="text-white font-bold">Boosters</h4>
                <p className="text-gray-400 text-sm">Multiplicadores temporarios de XP e moedas. Duram 24 horas apos ativacao.</p>
                <p className="text-brand-yellow text-xs mt-1">Precos: 300 - 500 moedas</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-brand-dark/50 border border-white/5 rounded-sm">
              <span className="text-2xl">🛡️</span>
              <div>
                <h4 className="text-white font-bold">Protetores</h4>
                <p className="text-gray-400 text-sm">Protegem o streak (sequencia) do usuario de ser perdido por um dia de inatividade.</p>
                <p className="text-brand-yellow text-xs mt-1">Precos: 200 - 1.000 moedas</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-brand-dark/50 border border-white/5 rounded-sm">
              <span className="text-2xl">⚡</span>
              <div>
                <h4 className="text-white font-bold">Power-ups</h4>
                <p className="text-gray-400 text-sm">Ajudas durante questoes: revelar alternativa incorreta, pular questao, dicas.</p>
                <p className="text-brand-yellow text-xs mt-1">Precos: 150 - 250 moedas</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'tipos-item',
      title: 'Tipos de Item',
      icon: Package,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Cada produto tem um <span className="text-white font-bold">tipo de item</span> que determina como ele funciona no sistema.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-gray-400 font-bold uppercase text-xs py-2">Tipo</th>
                  <th className="text-left text-gray-400 font-bold uppercase text-xs py-2">Descricao</th>
                  <th className="text-left text-gray-400 font-bold uppercase text-xs py-2">Exemplo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="py-2 text-white">avatar</td>
                  <td className="py-2 text-gray-400">Imagem de perfil</td>
                  <td className="py-2 text-gray-400">Avatar Policial, Avatar Juiz</td>
                </tr>
                <tr>
                  <td className="py-2 text-white">boost</td>
                  <td className="py-2 text-gray-400">Multiplicador temporario</td>
                  <td className="py-2 text-gray-400">XP 2x, Moedas 2x</td>
                </tr>
                <tr>
                  <td className="py-2 text-white">powerup</td>
                  <td className="py-2 text-gray-400">Consumivel de uso unico</td>
                  <td className="py-2 text-gray-400">Streak Freeze, Revelar Alternativa</td>
                </tr>
                <tr>
                  <td className="py-2 text-white">preparatorio</td>
                  <td className="py-2 text-gray-400">Curso preparatorio completo</td>
                  <td className="py-2 text-gray-400">PCDF 2025, PCSC 2025</td>
                </tr>
                <tr>
                  <td className="py-2 text-white">simulado</td>
                  <td className="py-2 text-gray-400">Simulado de prova</td>
                  <td className="py-2 text-gray-400">Simulado Nacional</td>
                </tr>
                <tr>
                  <td className="py-2 text-white">theme</td>
                  <td className="py-2 text-gray-400">Tema visual</td>
                  <td className="py-2 text-gray-400">Tema Escuro, Tema Neon</td>
                </tr>
                <tr>
                  <td className="py-2 text-white">badge</td>
                  <td className="py-2 text-gray-400">Distintivo de perfil</td>
                  <td className="py-2 text-gray-400">Top 10 Semanal</td>
                </tr>
                <tr>
                  <td className="py-2 text-white">title</td>
                  <td className="py-2 text-gray-400">Titulo exibido no perfil</td>
                  <td className="py-2 text-gray-400">Mestre das Questoes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    {
      id: 'metadata',
      title: 'Metadata dos Produtos',
      icon: HelpCircle,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            O campo <code className="bg-brand-dark px-2 py-1 rounded text-brand-yellow">metadata</code> armazena informacoes especificas de cada tipo de produto em formato JSON.
          </p>
          <div className="space-y-3">
            <div className="bg-brand-dark/50 border border-white/5 rounded-sm p-4">
              <h4 className="text-white font-bold mb-2">Avatar</h4>
              <pre className="text-xs text-gray-400 bg-brand-dark p-2 rounded overflow-x-auto">
{`{
  "avatar_id": "policial",
  "rarity": "rare"  // common, uncommon, rare, epic, legendary
}`}
              </pre>
            </div>
            <div className="bg-brand-dark/50 border border-white/5 rounded-sm p-4">
              <h4 className="text-white font-bold mb-2">Boost (Multiplicador)</h4>
              <pre className="text-xs text-gray-400 bg-brand-dark p-2 rounded overflow-x-auto">
{`{
  "boost_type": "xp_multiplier",  // xp_multiplier, coins_multiplier
  "multiplier": 2,
  "duration_hours": 24
}`}
              </pre>
            </div>
            <div className="bg-brand-dark/50 border border-white/5 rounded-sm p-4">
              <h4 className="text-white font-bold mb-2">Power-up</h4>
              <pre className="text-xs text-gray-400 bg-brand-dark p-2 rounded overflow-x-auto">
{`{
  "powerup_type": "streak_freeze",  // streak_freeze, reveal_wrong, skip_question, hint
  "uses": 3
}`}
              </pre>
            </div>
            <div className="bg-brand-dark/50 border border-white/5 rounded-sm p-4">
              <h4 className="text-white font-bold mb-2">Preparatorio/Simulado</h4>
              <pre className="text-xs text-gray-400 bg-brand-dark p-2 rounded overflow-x-auto">
{`{
  "preparatorio_id": "uuid-do-preparatorio",
  "access_days": 365,
  "includes_bonus": true
}`}
              </pre>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'fluxo-compra',
      title: 'Fluxo de Compra',
      icon: ShoppingCart,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            O processo de compra varia conforme o tipo de pagamento selecionado pelo usuario.
          </p>
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                <Coins className="w-4 h-4 text-brand-yellow" />
                Compra com Moedas
              </h4>
              <ol className="list-decimal list-inside text-gray-400 text-sm space-y-1 ml-4">
                <li>Usuario seleciona o produto</li>
                <li>Sistema verifica saldo de moedas</li>
                <li>Se suficiente, debita as moedas e registra a compra</li>
                <li>Item e adicionado ao inventario do usuario</li>
                <li>Status da compra: <span className="text-green-400">completed</span></li>
              </ol>
            </div>
            <div>
              <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                Compra com Dinheiro (R$)
              </h4>
              <ol className="list-decimal list-inside text-gray-400 text-sm space-y-1 ml-4">
                <li>Usuario seleciona o produto</li>
                <li>Redirecionado para gateway de pagamento</li>
                <li>Status inicial: <span className="text-yellow-400">pending</span></li>
                <li>Apos confirmacao do pagamento: <span className="text-green-400">completed</span></li>
                <li>Item e liberado no inventario</li>
              </ol>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'produtos-exemplo',
      title: 'Produtos de Exemplo',
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Lista dos produtos iniciais criados no sistema, organizados por categoria:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-brand-dark/50 border border-purple-500/20 rounded-sm p-4">
              <h4 className="text-purple-400 font-bold mb-3 flex items-center gap-2">
                <span>👤</span> Avatares
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span className="text-gray-300">Avatar Estudante</span><span className="text-brand-yellow">500</span></li>
                <li className="flex justify-between"><span className="text-gray-300">Avatar Advogado</span><span className="text-brand-yellow">1.000</span></li>
                <li className="flex justify-between"><span className="text-gray-300">Avatar Policial</span><span className="text-brand-yellow">1.500</span></li>
                <li className="flex justify-between"><span className="text-gray-300">Avatar Juiz</span><span className="text-brand-yellow">5.000</span></li>
                <li className="flex justify-between"><span className="text-gray-300">Avatar Dourado Premium</span><span className="text-brand-yellow">10.000</span></li>
              </ul>
            </div>
            <div className="bg-brand-dark/50 border border-orange-500/20 rounded-sm p-4">
              <h4 className="text-orange-400 font-bold mb-3 flex items-center gap-2">
                <span>🚀</span> Boosters
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span className="text-gray-300">XP 2x (24h)</span><span className="text-brand-yellow">300</span></li>
                <li className="flex justify-between"><span className="text-gray-300">Moedas 2x (24h)</span><span className="text-brand-yellow">400</span></li>
                <li className="flex justify-between"><span className="text-gray-300">XP 3x (24h)</span><span className="text-brand-yellow">500</span></li>
              </ul>
            </div>
            <div className="bg-brand-dark/50 border border-green-500/20 rounded-sm p-4">
              <h4 className="text-green-400 font-bold mb-3 flex items-center gap-2">
                <span>🛡️</span> Protetores
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span className="text-gray-300">Protetor de Streak (1x)</span><span className="text-brand-yellow">200</span></li>
                <li className="flex justify-between"><span className="text-gray-300">Protetor de Streak (3x)</span><span className="text-brand-yellow">500</span></li>
                <li className="flex justify-between"><span className="text-gray-300">Protetor de Streak (7x)</span><span className="text-brand-yellow">1.000</span></li>
              </ul>
            </div>
            <div className="bg-brand-dark/50 border border-blue-500/20 rounded-sm p-4">
              <h4 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
                <span>⚡</span> Power-ups
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span className="text-gray-300">Revelar Alternativa (5x)</span><span className="text-brand-yellow">150</span></li>
                <li className="flex justify-between"><span className="text-gray-300">Pular Questao (3x)</span><span className="text-brand-yellow">200</span></li>
                <li className="flex justify-between"><span className="text-gray-300">Dica do Professor (5x)</span><span className="text-brand-yellow">250</span></li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/admin/loja"
          className="text-gray-400 hover:text-white flex items-center mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Loja
        </Link>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
          Documentacao da Loja
        </h1>
        <p className="text-gray-400 mt-1">
          Guia completo sobre o sistema de loja e produtos
        </p>
      </div>

      {/* Navigation */}
      <div className="bg-brand-card border border-white/10 rounded-sm p-4">
        <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Navegacao Rapida</h3>
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex items-center gap-2 px-3 py-2 bg-brand-dark/50 border border-white/5 rounded-sm text-sm text-gray-300 hover:text-white hover:border-brand-yellow/30 transition-colors"
            >
              <section.icon className="w-4 h-4" />
              {section.title}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div
            key={section.id}
            id={section.id}
            className="bg-brand-card border border-white/10 rounded-sm overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-yellow/10 rounded-sm flex items-center justify-center">
                <section.icon className="w-5 h-5 text-brand-yellow" />
              </div>
              <h2 className="text-xl font-bold text-white">{section.title}</h2>
            </div>
            <div className="p-6">
              {section.content}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="bg-brand-card border border-white/10 rounded-sm p-6">
        <h3 className="text-lg font-bold text-white mb-4">Links Uteis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/loja/categorias"
            className="flex items-center justify-between p-4 bg-brand-dark/50 border border-white/5 rounded-sm hover:border-brand-yellow/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-purple-400" />
              <span className="text-white">Gerenciar Categorias</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-brand-yellow" />
          </Link>
          <Link
            to="/admin/loja/produtos"
            className="flex items-center justify-between p-4 bg-brand-dark/50 border border-white/5 rounded-sm hover:border-brand-yellow/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-blue-400" />
              <span className="text-white">Gerenciar Produtos</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-brand-yellow" />
          </Link>
          <Link
            to="/admin/loja/pedidos"
            className="flex items-center justify-between p-4 bg-brand-dark/50 border border-white/5 rounded-sm hover:border-brand-yellow/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 text-green-400" />
              <span className="text-white">Ver Pedidos</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-brand-yellow" />
          </Link>
        </div>
      </div>
    </div>
  );
};
