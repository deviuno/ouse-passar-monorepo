import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Methodology } from './components/Methodology';
import { WhyChoose } from './components/WhyChoose';
import { VideoTestimonials } from './components/VideoTestimonials';
import { BlogList, BlogPostView } from './components/Blog';
import { AIChat } from './components/AIChat';
import { Footer } from './components/Footer';
import { ViewState, BlogPost } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const handlePostSelect = (post: BlogPost) => {
    setSelectedPost(post);
    setCurrentView(ViewState.BLOG_POST);
    window.scrollTo(0, 0);
  };

  const handleViewChange = (view: ViewState) => {
    setCurrentView(view);
    if (view !== ViewState.BLOG_POST) {
      setSelectedPost(null);
    }
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-dark font-sans selection:bg-brand-yellow selection:text-brand-darker">
      <Navbar currentView={currentView} onChangeView={handleViewChange} />
      
      <main className="flex-grow">
        {currentView === ViewState.HOME && (
          <div className="animate-fade-in">
            <Hero />
            <Methodology />
            <WhyChoose />
            <VideoTestimonials />
            
            {/* CTA Section for Blog on Homepage */}
            <div className="py-20 bg-brand-darker border-t border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-yellow/5 skew-x-12"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-6 font-display">
                        A Inteligência vence a força
                    </h3>
                    <p className="text-gray-400 mb-8 text-lg">
                        Acesse nossas análises de editais e pare de estudar o que não cai na prova.
                    </p>
                    <button 
                      onClick={() => handleViewChange(ViewState.BLOG_LIST)}
                      className="inline-block border-2 border-brand-yellow text-brand-yellow px-8 py-3 font-bold uppercase tracking-widest hover:bg-brand-yellow hover:text-brand-darker transition-all duration-300"
                    >
                      Acessar QG de Conteúdo
                    </button>
                </div>
            </div>
          </div>
        )}

        {currentView === ViewState.MENTORSHIP && (
          <div className="animate-fade-in">
           <Methodology />
           <div className="py-32 text-center bg-brand-card">
              <h2 className="text-4xl font-black text-white font-display uppercase mb-4">Escolha seu Plano</h2>
              <p className="text-gray-400">Tabela de preços em construção.</p>
           </div>
          </div>
        )}

        {currentView === ViewState.BLOG_LIST && (
          <div className="animate-fade-in">
            <BlogList onSelectPost={handlePostSelect} />
          </div>
        )}

        {currentView === ViewState.BLOG_POST && selectedPost && (
          <div className="animate-fade-in">
            <BlogPostView post={selectedPost} onBack={() => handleViewChange(ViewState.BLOG_LIST)} />
          </div>
        )}
      </main>

      <AIChat />
      <Footer />
    </div>
  );
};

export default App;