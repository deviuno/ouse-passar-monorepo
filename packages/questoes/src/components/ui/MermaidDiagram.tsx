import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';

// Inicializar mermaid com tema escuro
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#FFB800',
    primaryTextColor: '#1A1A1A',
    primaryBorderColor: '#FFB800',
    lineColor: '#A0A0A0',
    secondaryColor: '#3A3A3A',
    tertiaryColor: '#252525',
    background: '#1A1A1A',
    mainBkg: '#252525',
    nodeBorder: '#FFB800',
    clusterBkg: '#2A2A2A',
    titleColor: '#FFFFFF',
    edgeLabelBackground: '#2A2A2A',
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
  },
  fontFamily: 'Inter, system-ui, sans-serif',
});

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

/**
 * Sanitiza o código Mermaid para evitar erros de parse
 * - Remove parênteses de dentro dos nós (causa conflito com sintaxe Mermaid)
 * - Substitui caracteres especiais problemáticos
 */
function sanitizeMermaidCode(code: string): string {
  // Regex para encontrar conteúdo dentro de colchetes [], chaves {} e parênteses de nó
  // Substitui parênteses por colchetes ou remove
  let sanitized = code;

  // Substituir parênteses dentro de nós [...] por traços ou removê-los
  // Exemplo: [Ato Válido (Pas de Nullité)] -> [Ato Válido - Pas de Nullité]
  sanitized = sanitized.replace(/\[([^\]]*)\]/g, (match, content) => {
    // Substituir ( e ) por - dentro do conteúdo do nó
    const cleanContent = content
      .replace(/\s*\(/g, ' - ')
      .replace(/\)\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return `[${cleanContent}]`;
  });

  // Fazer o mesmo para nós com chaves {...}
  sanitized = sanitized.replace(/\{([^}]*)\}/g, (match, content) => {
    const cleanContent = content
      .replace(/\s*\(/g, ' - ')
      .replace(/\)\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return `{${cleanContent}}`;
  });

  return sanitized;
}

export function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Limpar o código do diagrama
        let cleanChart = chart
          .trim()
          .replace(/^```mermaid\s*/i, '')
          .replace(/```\s*$/, '')
          .trim();

        // Sanitizar para evitar erros de parse
        cleanChart = sanitizeMermaidCode(cleanChart);

        console.log('[Mermaid] Renderizando diagrama:', cleanChart.substring(0, 100) + '...');

        // Gerar ID único para o diagrama
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // Renderizar o diagrama
        const { svg: renderedSvg } = await mermaid.render(id, cleanChart);
        setSvg(renderedSvg);
        console.log('[Mermaid] Diagrama renderizado com sucesso');
      } catch (err: any) {
        console.error('[Mermaid] Erro ao renderizar diagrama:', err);
        setError(err.message || 'Erro ao renderizar diagrama');
      } finally {
        setIsLoading(false);
      }
    };

    renderChart();
  }, [chart]);

  if (isLoading) {
    return (
      <div className={`bg-[#252525] rounded-xl p-6 border border-[#3A3A3A] ${className}`}>
        <div className="flex items-center justify-center gap-3 text-[#A0A0A0]">
          <div className="w-5 h-5 border-2 border-[#FFB800] border-t-transparent rounded-full animate-spin" />
          <span>Carregando diagrama...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-[#252525] rounded-xl p-4 border border-[#3A3A3A] ${className}`}>
        <p className="text-[#A0A0A0] text-sm mb-2">Diagrama visual:</p>
        <pre className="text-xs text-[#E0E0E0] bg-[#1A1A1A] p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <div
      className={`mermaid-container bg-[#252525] rounded-xl p-4 border border-[#3A3A3A] overflow-x-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export default MermaidDiagram;
