import React, { useState, useEffect, useCallback } from 'react';
import { Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useScrollAnimation } from '../lib/useScrollAnimation';

interface Video {
  id: string;
  youtubeId: string;
  title: string;
  subtitle: string;
}

const VIDEOS: Video[] = [
  {
    id: '1',
    youtubeId: 'JQr3zDFoiz4',
    title: 'GABRIEL',
    subtitle: 'Aprovado na PF e PP'
  },
  {
    id: '2',
    youtubeId: '_g4fpZzdra8',
    title: 'JOÃO',
    subtitle: 'Aprovado na PRF'
  },
  {
    id: '3',
    youtubeId: 'fR7-XNZQ20g',
    title: 'VINICIUS',
    subtitle: 'Aprovado na PRF'
  },
  {
    id: '4',
    youtubeId: 'oLI2KkbaS2o',
    title: 'ALUNA',
    subtitle: 'Depoimento Ouse Passar'
  }
];

export const VideoTestimonials: React.FC = () => {
  const { ref: sectionRef, isVisible } = useScrollAnimation({ threshold: 0.2 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto rotation logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAutoPlaying && !isModalOpen) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % VIDEOS.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, isModalOpen]);

  const handleNext = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % VIDEOS.length);
  }, []);

  const handlePrev = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + VIDEOS.length) % VIDEOS.length);
  }, []);

  const openModal = (youtubeId: string) => {
    setActiveVideoId(youtubeId);
    setIsModalOpen(true);
    setIsAutoPlaying(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveVideoId(null);
    setIsAutoPlaying(true);
  };

  // Calculate indices for 3D effect (Left, Center, Right)
  const getSlideStyles = (index: number) => {
    // Normalize index difference to handle circular array
    const total = VIDEOS.length;
    let diff = (index - currentIndex) % total;
    if (diff < -total / 2) diff += total;
    if (diff > total / 2) diff -= total;

    // Center Item
    if (diff === 0) {
      return "z-20 scale-100 opacity-100 translate-x-0 rotate-y-0 blur-none";
    }
    // Right Item
    if (diff === 1 || diff === -(total - 1)) {
      return "z-10 scale-90 opacity-60 translate-x-[20%] -rotate-y-[25deg] blur-[1px] cursor-pointer hover:opacity-80";
    }
    // Left Item
    if (diff === -1 || diff === (total - 1)) {
      return "z-10 scale-90 opacity-60 -translate-x-[20%] rotate-y-[25deg] blur-[1px] cursor-pointer hover:opacity-80";
    }
    
    // Hidden Items (Behind)
    return "z-0 scale-75 opacity-0 translate-x-0 blur-xl pointer-events-none";
  };

  return (
    <section ref={sectionRef} className="py-24 bg-brand-dark overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        <h2 className={`text-4xl md:text-5xl font-black text-white font-display uppercase tracking-tight mb-16 relative inline-block scroll-animate ${isVisible ? 'visible animate-fade-in-up' : ''}`}>
          Aprovações
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-1/3 h-1 bg-brand-yellow"></div>
        </h2>

        {/* 3D Carousel Container */}
        <div className={`relative h-[300px] md:h-[400px] flex items-center justify-center perspective-[1000px] mx-auto max-w-5xl mb-12 scroll-animate ${isVisible ? 'visible animate-scale-in stagger-1' : ''}`}>
            
            {/* Navigation Buttons (Absolute) */}
            <button 
                onClick={handlePrev}
                className="absolute left-0 md:left-10 z-30 p-2 bg-brand-yellow/10 hover:bg-brand-yellow/80 rounded-full text-white transition-all backdrop-blur-sm"
            >
                <ChevronLeft className="w-8 h-8" />
            </button>
            <button 
                onClick={handleNext}
                className="absolute right-0 md:right-10 z-30 p-2 bg-brand-yellow/10 hover:bg-brand-yellow/80 rounded-full text-white transition-all backdrop-blur-sm"
            >
                <ChevronRight className="w-8 h-8" />
            </button>

            {VIDEOS.map((video, idx) => (
                <div
                    key={video.id}
                    className={`absolute w-[280px] md:w-[500px] aspect-video transition-all duration-700 ease-in-out transform-gpu ${getSlideStyles(idx)}`}
                    onClick={() => {
                        // If it's the center item, open modal. If side item, rotate to it.
                        if (idx === currentIndex) openModal(video.youtubeId);
                        else {
                           setIsAutoPlaying(false);
                           setCurrentIndex(idx);
                        }
                    }}
                >
                    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 group">
                        {/* Thumbnail */}
                        <img 
                            src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`} 
                            alt={video.title} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-300"
                        />
                        
                        {/* Overlay Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-yellow/90 rounded-full flex items-center justify-center mb-4 transform group-hover:scale-110 transition-transform shadow-lg cursor-pointer">
                                <Play className="w-8 h-8 text-brand-darker fill-current ml-1" />
                            </div>
                            
                            <div className="text-center">
                                <h3 className="text-3xl font-black text-white font-display uppercase tracking-wider drop-shadow-md">
                                    {video.title}
                                </h3>
                                <p className="text-brand-yellow font-bold uppercase text-sm tracking-widest bg-black/60 px-4 py-1 rounded-sm mt-2 inline-block">
                                    {video.subtitle}
                                </p>
                            </div>
                        </div>

                        {/* Ouse Passar Watermark */}
                        <div className="absolute bottom-4 left-0 right-0 text-center opacity-50">
                             <span className="text-[10px] font-black text-brand-yellow uppercase tracking-[0.3em]">Ouse Passar</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>

      </div>

      {/* Lightbox Modal */}
      {isModalOpen && activeVideoId && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <button 
                onClick={closeModal}
                className="absolute top-6 right-6 text-gray-400 hover:text-brand-yellow transition-colors"
            >
                <X className="w-10 h-10" />
            </button>

            <div className="w-full max-w-5xl aspect-video rounded-lg overflow-hidden shadow-[0_0_50px_rgba(255,184,0,0.2)] border border-brand-yellow/20 relative">
                <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`} 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                    className="absolute inset-0"
                ></iframe>
            </div>
        </div>
      )}
    </section>
  );
};