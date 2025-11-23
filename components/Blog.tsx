import React from 'react';
import { ArrowLeft, Calendar, Clock, ChevronRight, Hash, Eye } from 'lucide-react';
import { BlogPost } from '../types';

interface BlogListProps {
  onSelectPost: (post: BlogPost) => void;
}

// Data for Concursos Públicos
const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'Edital da PF 2025: O que esperar das matérias de T.I. e Contabilidade?',
    excerpt: 'Análise completa baseada no histórico da banca Cebraspe. Descubra quais tópicos de Python e RLM devem ser prioridade absoluta no seu ciclo.',
    content: `
      <h2>O Peso da Tecnologia na PF</h2>
      <p>Desde 2018, a Polícia Federal mudou seu perfil. Não basta mais saber Direito Penal. Hoje, <strong>T.I., Contabilidade e Português</strong> representam quase 50% da prova de Agente e Escrivão.</p>
      
      <h2>Estratégia Cebraspe</h2>
      <p>A banca Cebraspe (antigo Cespe) pune o chute. Uma errada anula uma certa. A estratégia aqui não é saber tudo, mas saber o que deixar em branco.</p>

      <h3>Tópicos Quentes de T.I.</h3>
      <ul>
        <li>Noções de Big Data e Hadoop</li>
        <li>Python (Sintaxe básica e bibliotecas pandas/numpy)</li>
        <li>Segurança da Informação e Criptografia</li>
      </ul>
      
      <p>Na Contabilidade, foque em CPC 00, Balanço Patrimonial e DRE. Não perca tempo com contabilidade avançada se não domina a base.</p>
    `,
    author: 'Prof. Ricardo Silva',
    date: '15 Mar 2024',
    category: 'Polícia Federal',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop',
    readTime: '7 min'
  },
  {
    id: '2',
    title: 'Como conciliar Trabalho e Estudo para Concursos',
    excerpt: 'O guia definitivo para quem tem pouco tempo. Técnicas de estudo ativo, Pomodoro e como usar o tempo de deslocamento a seu favor.',
    content: '<p>Conteúdo completo sobre rotina...</p>',
    author: 'Coach Amanda',
    date: '10 Mar 2024',
    category: 'Produtividade',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000&auto=format&fit=crop',
    readTime: '5 min'
  },
  {
    id: '3',
    title: 'Redação Nota Máxima em Tribunais: Estrutura Coringa',
    excerpt: 'Modelos de esqueleto de redação para temas de atualidades. Como garantir 90% da nota na discursiva sem ser um expert no tema.',
    content: '<p>Técnicas de redação...</p>',
    author: 'Prof. Marcos',
    date: '05 Mar 2024',
    category: 'Discursivas',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1000&auto=format&fit=crop',
    readTime: '8 min'
  }
];

export const BlogList: React.FC<BlogListProps> = ({ onSelectPost }) => {
  return (
    <div className="bg-brand-dark min-h-screen py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
            <div>
                <h1 className="text-4xl md:text-5xl font-black text-white font-display uppercase tracking-tight mb-4">
                    Blog <span className="text-brand-yellow">Tático</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl">
                    Inteligência, análise de editais e técnicas de estudo. Conteúdo para quem joga o jogo profissional.
                </p>
            </div>
            
            {/* Categories Pills */}
            <div className="flex gap-2 mt-6 md:mt-0 flex-wrap justify-end">
                {['Todos', 'Polícia Federal', 'Tribunais', 'Produtividade', 'Redação'].map((cat) => (
                    <button key={cat} className="px-4 py-2 border border-white/10 text-xs font-bold uppercase text-gray-300 hover:border-brand-yellow hover:text-brand-yellow transition-colors bg-brand-card">
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BLOG_POSTS.map((post) => (
            <article 
              key={post.id} 
              className="group bg-brand-card border border-white/5 overflow-hidden hover:border-brand-yellow/50 transition-all duration-300 cursor-pointer flex flex-col h-full hover:shadow-[0_0_20px_rgba(255,184,0,0.1)]"
              onClick={() => onSelectPost(post)}
            >
              <div className="relative overflow-hidden h-52">
                <div className="absolute inset-0 bg-brand-dark/20 group-hover:bg-transparent transition-colors z-10"></div>
                <img 
                  src={post.imageUrl} 
                  alt={post.title} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 grayscale group-hover:grayscale-0"
                />
                <div className="absolute top-4 left-4 z-20 bg-brand-yellow text-brand-darker px-3 py-1 text-xs font-black uppercase tracking-wide">
                  {post.category}
                </div>
              </div>
              
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center text-gray-500 text-xs mb-4 space-x-4 font-mono uppercase">
                  <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {post.date}</span>
                  <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {post.readTime}</span>
                </div>
                
                <h2 className="text-xl font-bold text-white mb-4 group-hover:text-brand-yellow transition-colors leading-tight">
                  {post.title}
                </h2>
                
                <p className="text-gray-400 text-sm mb-6 line-clamp-3 flex-1 leading-relaxed border-l-2 border-white/10 pl-4">
                  {post.excerpt}
                </p>
                
                <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                    <span className="text-xs font-bold text-gray-500 uppercase">Por {post.author}</span>
                    <span className="flex items-center text-brand-yellow text-xs font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                        Ler Artigo <ChevronRight className="ml-1 w-3 h-3" />
                    </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

interface BlogPostViewProps {
  post: BlogPost;
  onBack: () => void;
}

export const BlogPostView: React.FC<BlogPostViewProps> = ({ post, onBack }) => {
  return (
    <article className="bg-brand-dark min-h-screen py-24">
      {/* Progress Bar placeholder */}
      <div className="fixed top-0 left-0 h-1 bg-brand-yellow w-full z-50 origin-left transform scale-x-0 animate-[progress_1s_ease-out_forwards]"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-500 hover:text-brand-yellow mb-12 transition-colors uppercase text-xs font-bold tracking-widest group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar para a Base
        </button>

        <header className="mb-12 text-center">
          <div className="inline-flex items-center space-x-2 mb-6">
             <span className="px-3 py-1 bg-brand-yellow/10 border border-brand-yellow/20 text-brand-yellow text-xs font-black uppercase">
                {post.category}
             </span>
             <span className="text-gray-500 text-xs font-mono uppercase">• {post.readTime} leitura</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-8 leading-[1.1] font-display">
            {post.title}
          </h1>
          
          <div className="flex items-center justify-center space-x-6">
             <div className="text-right">
                <p className="text-sm font-bold text-white uppercase">{post.author}</p>
                <p className="text-xs text-gray-500">Especialista em Concursos</p>
             </div>
             <div className="w-12 h-12 rounded-full bg-brand-card border border-brand-yellow p-1">
                <img src={`https://ui-avatars.com/api/?name=${post.author}&background=FFB800&color=000`} alt={post.author} className="rounded-full w-full h-full" />
             </div>
          </div>
        </header>

        <div className="w-full aspect-video rounded-sm overflow-hidden mb-16 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark to-transparent opacity-60"></div>
            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
        </div>

        <div className="prose prose-lg prose-invert max-w-none 
            prose-headings:font-display prose-headings:font-black prose-headings:text-white prose-headings:uppercase
            prose-p:text-gray-300 prose-p:font-light prose-p:leading-8
            prose-a:text-brand-yellow prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white prose-strong:font-bold
            prose-ul:marker:text-brand-yellow
            prose-li:text-gray-300
        ">
             <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
        
        {/* CTA Box */}
        <div className="mt-20 bg-brand-yellow relative overflow-hidden rounded-sm p-10 md:p-14 text-center">
            <div className="relative z-10">
                <h3 className="text-3xl font-black text-brand-darker mb-4 font-display uppercase">Não estude errado.</h3>
                <p className="text-brand-darker/80 mb-8 max-w-xl mx-auto font-medium">
                    Esse conteúdo é apenas a ponta do iceberg. Nossa plataforma completa tem o cronograma exato para sua aprovação.
                </p>
                <button className="bg-brand-darker text-white px-8 py-4 font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl">
                    Destravar Minha Aprovação
                </button>
            </div>
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full mix-blend-overlay blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </div>
      </div>
    </article>
  );
};