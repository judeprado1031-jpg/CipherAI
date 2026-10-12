import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  const renderedContent = useMemo(() => {
    if (!content) return '';

    let text = content;

    // Replace display math $$...$$
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
      try {
        const rendered = katex.renderToString(math.trim(), {
          displayMode: true,
          throwOnError: false,
        });
        return `<div class="my-3 py-2 px-3 overflow-x-auto rounded-xl border text-center font-mono text-xs sm:text-sm shadow-sm" style="background-color: var(--bg-input); border-color: var(--border-subtle); color: var(--color-primary);">${rendered}</div>`;
      } catch {
        return `<pre class="font-mono text-xs p-2 rounded-lg my-2 overflow-x-auto" style="background-color: var(--bg-input); color: var(--color-accent);">${math}</pre>`;
      }
    });

    // Replace inline math $...$
    text = text.replace(/\$([^\$\n]+?)\$/g, (match, math) => {
      if (/^\d+(\.\d+)?(\s*(million|k|billion))?$/.test(math.trim())) {
        return match;
      }
      try {
        const rendered = katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
        });
        return `<span class="inline-block px-1 font-mono font-semibold" style="color: var(--color-accent);">${rendered}</span>`;
      } catch {
        return match;
      }
    });

    // Parse simple Markdown tables
    text = text.replace(/((\|.+?\|\r?\n)+)/g, (tableMatch) => {
      const lines = tableMatch.trim().split(/\r?\n/);
      if (lines.length < 2) return tableMatch;

      let tableHtml =
        '<div class="overflow-x-auto my-3 rounded-xl border shadow-sm" style="border-color: var(--border-subtle); background-color: var(--bg-card);"><table class="w-full text-left border-collapse text-xs sm:text-sm">';

      let isHeader = true;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.startsWith('|')) continue;

        if (/^\|(\s*[-:]+\s*\|)+$/.test(line)) {
          isHeader = false;
          continue;
        }

        const cells = line.split('|').slice(1, -1).map((c) => c.trim());
        if (isHeader && i === 0) {
          tableHtml +=
            '<thead class="border-b font-bold uppercase tracking-wider text-[11px]" style="background-color: var(--bg-input); border-color: var(--border-subtle); color: var(--text-main);"><tr>';
          cells.forEach((c) => {
            tableHtml += `<th class="py-2.5 px-3.5 border-b" style="border-color: var(--border-subtle);">${c}</th>`;
          });
          tableHtml += '</tr></thead><tbody>';
        } else {
          tableHtml +=
            '<tr class="border-b transition-colors" style="border-color: var(--border-subtle);">';
          cells.forEach((c) => {
            tableHtml += `<td class="py-2 px-3.5 font-mono text-xs" style="color: var(--text-main);">${c}</td>`;
          });
          tableHtml += '</tr>';
        }
      }
      tableHtml += '</tbody></table></div>';
      return tableHtml;
    });

    // Format headers
    text = text.replace(
      /^### (.*$)/gim,
      '<h3 class="text-base sm:text-lg font-bold mt-4 mb-2 flex items-center gap-2 tracking-tight" style="color: var(--color-primary);">$1</h3>'
    );
    text = text.replace(
      /^#### (.*$)/gim,
      '<h4 class="text-sm sm:text-base font-semibold mt-3 mb-1.5" style="color: var(--text-main); opacity: 0.9;">$1</h4>'
    );
    text = text.replace(
      /^## (.*$)/gim,
      '<h2 class="text-lg sm:text-xl font-extrabold mt-5 mb-2.5 tracking-tight border-b pb-1.5" style="color: var(--text-main); border-color: var(--border-subtle);">$1</h2>'
    );

    // Bold & italic
    text = text.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-bold" style="color: var(--text-main);">$1</strong>'
    );
    text = text.replace(
      /\*(.*?)\*/g,
      '<em class="italic" style="color: var(--text-muted);">$1</em>'
    );

    // Bullet lists
    text = text.replace(
      /^\s*-\s+(.*$)/gim,
      '<li class="ml-4 list-disc my-0.5" style="color: var(--text-main);">$1</li>'
    );
    text = text.replace(
      /^\s*\d+\.\s+(.*$)/gim,
      '<li class="ml-4 list-decimal my-0.5" style="color: var(--text-main);">$1</li>'
    );

    // Paragraph line breaks
    text = text.replace(/\n\n/g, '<div class="h-2.5"></div>');

    return text;
  }, [content]);

  return (
    <div
      className={`max-w-none text-sm sm:text-base leading-relaxed break-words ${className}`}
      style={{ color: 'var(--text-main)' }}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};
