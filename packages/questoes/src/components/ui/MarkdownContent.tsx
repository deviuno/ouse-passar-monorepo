import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidDiagram } from './MermaidDiagram';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Renderizar blocos de código mermaid como diagramas
          code(props: any) {
            const { className: codeClassName, children } = props;
            const match = /language-(\w+)/.exec(codeClassName || '');
            const language = match ? match[1] : '';
            const codeContent = String(children).replace(/\n$/, '');

            // Se for mermaid, renderizar como diagrama
            if (language === 'mermaid') {
              return <MermaidDiagram chart={codeContent} className="my-4" />;
            }

            // Para outros blocos de código, renderizar normalmente
            if (language) {
              return (
                <pre className="bg-[#1A1A1A] rounded-lg p-4 overflow-x-auto my-4">
                  <code className={`language-${language} text-sm text-[#E0E0E0]`}>
                    {codeContent}
                  </code>
                </pre>
              );
            }

            // Código inline
            return (
              <code className="bg-[#3A3A3A] px-1.5 py-0.5 rounded text-[#FFB800] text-sm">
                {children}
              </code>
            );
          },

          // Estilizar outros elementos
          h1: (props: any) => (
            <h1 className="text-2xl font-bold text-[#FFB800] mt-6 mb-4">{props.children}</h1>
          ),
          h2: (props: any) => (
            <h2 className="text-xl font-bold text-[#FFB800] mt-5 mb-3">{props.children}</h2>
          ),
          h3: (props: any) => (
            <h3 className="text-lg font-semibold text-[#FFB800] mt-4 mb-2">{props.children}</h3>
          ),
          h4: (props: any) => (
            <h4 className="text-base font-semibold text-white mt-3 mb-2">{props.children}</h4>
          ),
          p: (props: any) => (
            <p className="text-[#E0E0E0] mb-4 leading-relaxed">{props.children}</p>
          ),
          ul: (props: any) => (
            <ul className="list-disc list-inside mb-4 space-y-2 text-[#E0E0E0]">{props.children}</ul>
          ),
          ol: (props: any) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 text-[#E0E0E0]">{props.children}</ol>
          ),
          li: (props: any) => (
            <li className="text-[#E0E0E0]">{props.children}</li>
          ),
          blockquote: (props: any) => (
            <blockquote className="border-l-4 border-[#FFB800] pl-4 py-2 my-4 bg-[#252525] rounded-r-lg text-[#A0A0A0] italic">
              {props.children}
            </blockquote>
          ),
          strong: (props: any) => (
            <strong className="font-semibold text-[#FFB800]">{props.children}</strong>
          ),
          em: (props: any) => (
            <em className="italic text-[#A0A0A0]">{props.children}</em>
          ),
          a: (props: any) => (
            <a href={props.href} className="text-[#FFB800] hover:underline" target="_blank" rel="noopener noreferrer">
              {props.children}
            </a>
          ),
          hr: () => (
            <hr className="border-[#3A3A3A] my-6" />
          ),
          table: (props: any) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-[#3A3A3A] rounded-lg overflow-hidden">
                {props.children}
              </table>
            </div>
          ),
          thead: (props: any) => (
            <thead className="bg-[#252525]">{props.children}</thead>
          ),
          tbody: (props: any) => (
            <tbody className="divide-y divide-[#3A3A3A]">{props.children}</tbody>
          ),
          tr: (props: any) => (
            <tr className="hover:bg-[#2A2A2A]">{props.children}</tr>
          ),
          th: (props: any) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#FFB800] border-b border-[#3A3A3A]">
              {props.children}
            </th>
          ),
          td: (props: any) => (
            <td className="px-4 py-3 text-sm text-[#E0E0E0]">{props.children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownContent;
