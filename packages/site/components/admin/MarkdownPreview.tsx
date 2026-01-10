/**
 * MarkdownPreview - Componente para pré-visualização de Markdown no admin
 *
 * Replica a mesma aparência que o aluno verá na página de questões
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Blocos de código
          code(props: any) {
            const { className: codeClassName, children } = props;
            const match = /language-(\w+)/.exec(codeClassName || '');
            const language = match ? match[1] : '';
            const codeContent = String(children).replace(/\n$/, '');

            // Bloco de código
            if (language) {
              return (
                <pre className="bg-[#1A1A1A] rounded-lg p-4 overflow-x-auto my-4 border border-white/10">
                  <code className={`language-${language} text-sm text-gray-200`}>
                    {codeContent}
                  </code>
                </pre>
              );
            }

            // Código inline
            return (
              <code className="bg-[#2A2A2A] px-1.5 py-0.5 rounded text-[#FFB800] text-sm font-mono">
                {children}
              </code>
            );
          },

          // Títulos
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

          // Parágrafos e texto
          p: (props: any) => (
            <p className="text-gray-200 mb-4 leading-relaxed">{props.children}</p>
          ),
          strong: (props: any) => (
            <strong className="font-semibold text-[#FFB800]">{props.children}</strong>
          ),
          em: (props: any) => (
            <em className="italic text-gray-400">{props.children}</em>
          ),

          // Listas
          ul: (props: any) => (
            <ul className="list-disc list-inside mb-4 space-y-2 text-gray-200">{props.children}</ul>
          ),
          ol: (props: any) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-200">{props.children}</ol>
          ),
          li: (props: any) => (
            <li className="text-gray-200">{props.children}</li>
          ),

          // Blockquote
          blockquote: (props: any) => (
            <blockquote className="border-l-4 border-[#FFB800] pl-4 py-2 my-4 bg-[#1A1A1A] rounded-r-lg text-gray-400 italic">
              {props.children}
            </blockquote>
          ),

          // Links
          a: (props: any) => (
            <a href={props.href} className="text-[#FFB800] hover:underline" target="_blank" rel="noopener noreferrer">
              {props.children}
            </a>
          ),

          // Separador
          hr: () => (
            <hr className="border-white/10 my-6" />
          ),

          // Tabelas
          table: (props: any) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-white/10 rounded-lg overflow-hidden">
                {props.children}
              </table>
            </div>
          ),
          thead: (props: any) => (
            <thead className="bg-[#1A1A1A]">{props.children}</thead>
          ),
          tbody: (props: any) => (
            <tbody className="divide-y divide-white/10">{props.children}</tbody>
          ),
          tr: (props: any) => (
            <tr className="hover:bg-white/5">{props.children}</tr>
          ),
          th: (props: any) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#FFB800] border-b border-white/10">
              {props.children}
            </th>
          ),
          td: (props: any) => (
            <td className="px-4 py-3 text-sm text-gray-200">{props.children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownPreview;
