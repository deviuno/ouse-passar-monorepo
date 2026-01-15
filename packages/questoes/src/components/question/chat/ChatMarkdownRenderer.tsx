import React from 'react';

// Simple markdown renderer for chat messages
export function renderMarkdown(text: string): React.ReactNode {
    // Split by lines to handle headings and lists
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const flushList = () => {
        if (currentList.length > 0 && listType) {
            const ListTag = listType === 'ol' ? 'ol' : 'ul';
            const listKey = `list-${elements.length}-${Date.now()}`;
            elements.push(
                <ListTag key={listKey} className={listType === 'ol' ? 'list-decimal ml-4 my-2' : 'list-disc ml-4 my-2'}>
                    {currentList.map((item, i) => <li key={`li-${i}`} className="my-1">{renderInline(item)}</li>)}
                </ListTag>
            );
            currentList = [];
            listType = null;
        }
    };

    const renderInline = (line: string): React.ReactNode => {
        // Handle bold (**text**) and inline code (`code`)
        const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-semibold text-[var(--color-brand)]">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
                return <code key={i} className="bg-[var(--color-bg-elevated)] px-1 rounded text-[var(--color-text-main)] border border-[var(--color-border)]">{part.slice(1, -1)}</code>;
            }
            return part;
        });
    };

    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        const lineKey = `line-${idx}`;

        // Headings
        if (trimmed.startsWith('### ')) {
            flushList();
            elements.push(<h4 key={lineKey} className="font-bold text-[var(--color-brand)] mt-3 mb-1 text-sm">{renderInline(trimmed.slice(4))}</h4>);
        } else if (trimmed.startsWith('## ')) {
            flushList();
            elements.push(<h3 key={lineKey} className="font-bold text-[var(--color-brand)] mt-3 mb-1">{renderInline(trimmed.slice(3))}</h3>);
        } else if (trimmed.startsWith('# ')) {
            flushList();
            elements.push(<h2 key={lineKey} className="font-bold text-[var(--color-brand)] mt-3 mb-2 text-lg">{renderInline(trimmed.slice(2))}</h2>);
        }
        // Unordered list
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            if (listType !== 'ul') flushList();
            listType = 'ul';
            currentList.push(trimmed.slice(2));
        }
        // Ordered list
        else if (/^\d+\.\s/.test(trimmed)) {
            if (listType !== 'ol') flushList();
            listType = 'ol';
            currentList.push(trimmed.replace(/^\d+\.\s/, ''));
        }
        // Horizontal rule
        else if (trimmed === '---' || trimmed === '***') {
            flushList();
            elements.push(<hr key={lineKey} className="border-[var(--color-border)] my-3" />);
        }
        // Empty line (paragraph break)
        else if (trimmed === '') {
            flushList();
            elements.push(<div key={lineKey} className="h-2" />);
        }
        // Regular paragraph
        else {
            flushList();
            elements.push(<p key={lineKey} className="my-1">{renderInline(trimmed)}</p>);
        }
    });

    flushList();
    return <div className="space-y-1">{elements}</div>;
}
