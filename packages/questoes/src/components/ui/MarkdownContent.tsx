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
                <pre className="bg-[var(--color-bg-card)] rounded-lg p-4 overflow-x-auto my-4 border border-[var(--color-border)]">
                  <code className={`language-${language} text-sm text-[var(--color-text-main)]`}>
                    {codeContent}
                  </code>
                </pre>
              );
            }

            // Código inline
            return (
              <code className="bg-[var(--color-bg-elevated)] px-1.5 py-0.5 rounded text-[var(--color-brand)] text-sm font-mono">
                {children}
              </code>
            );
          },

          // Estilizar outros elementos
          h1: (props: any) => (
            <h1 className="text-2xl font-bold text-[var(--color-brand)] mt-6 mb-4">{props.children}</h1>
          ),
          h2: (props: any) => (
            <h2 className="text-xl font-bold text-[var(--color-brand)] mt-5 mb-3">{props.children}</h2>
          ),
          h3: (props: any) => (
            <h3 className="text-lg font-semibold text-[var(--color-brand)] mt-4 mb-2">{props.children}</h3>
          ),
          h4: (props: any) => (
            <h4 className="text-base font-semibold text-[var(--color-text-main)] mt-3 mb-2">{props.children}</h4>
          ),
          p: (props: any) => (
            <p className="text-[var(--color-text-main)] mb-4 leading-relaxed">{props.children}</p>
          ),
          ul: (props: any) => (
            <ul className="list-disc list-inside mb-4 space-y-2 text-[var(--color-text-main)]">{props.children}</ul>
          ),
          ol: (props: any) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 text-[var(--color-text-main)]">{props.children}</ol>
          ),
          li: (props: any) => (
            <li className="text-[var(--color-text-main)]">{props.children}</li>
          ),
          blockquote: (props: any) => (
            <blockquote className="border-l-4 border-[var(--color-brand)] pl-4 py-2 my-4 bg-[var(--color-bg-card)] rounded-r-lg text-[var(--color-text-sec)] italic">
              {props.children}
            </blockquote>
          ),
          strong: (props: any) => (
            <strong className="font-semibold text-[var(--color-brand)]">{props.children}</strong>
          ),
          em: (props: any) => (
            <em className="italic text-[var(--color-text-sec)]">{props.children}</em>
          ),
          a: (props: any) => (
            <a href={props.href} className="text-[var(--color-brand)] hover:underline" target="_blank" rel="noopener noreferrer">
              {props.children}
            </a>
          ),
          hr: () => (
            <hr className="border-[var(--color-border)] my-6" />
          ),
          table: (props: any) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-[var(--color-border)] rounded-lg overflow-hidden">
                {props.children}
              </table>
            </div>
          ),
          thead: (props: any) => (
            <thead className="bg-[var(--color-bg-elevated)]">{props.children}</thead>
          ),
          tbody: (props: any) => (
            <tbody className="divide-y divide-[var(--color-border)]">{props.children}</tbody>
          ),
          tr: (props: any) => (
            <tr className="hover:bg-[var(--color-bg-elevated)]">{props.children}</tr>
          ),
          th: (props: any) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--color-brand)] border-b border-[var(--color-border)]">
              {props.children}
            </th>
          ),
          td: (props: any) => (
            <td className="px-4 py-3 text-sm text-[var(--color-text-main)]">{props.children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownContent;
