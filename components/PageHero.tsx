import React, { ReactNode } from 'react';

interface PageHeroProps {
  title: string;
  titleHighlight?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export const PageHero: React.FC<PageHeroProps> = ({
  title,
  titleHighlight,
  description,
  children,
  className = ''
}) => {
  return (
    <div className={`w-full bg-brand-darker border-b border-white/10 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white font-display uppercase tracking-tight mb-6">
              {title} {titleHighlight && <span className="text-brand-yellow">{titleHighlight}</span>}
            </h1>
            {description && (
              <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {children && (
            <div className="w-full md:w-auto">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
