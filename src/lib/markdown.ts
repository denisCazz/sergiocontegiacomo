import { marked } from 'marked';

marked.use({ mangle: false, headerIds: true, breaks: true });

export function renderMarkdown(source?: string | null) {
  if (!source) {
    return '';
  }

  const trimmed = source.trim();

  // Support rich-text HTML (e.g. Quill) without running it through the Markdown parser.
  // This keeps the stored HTML intact and improves rendering consistency.
  if (trimmed.startsWith('<')) {
    // Quill often inserts empty paragraphs like <p><br></p> to represent blank lines.
    // In long-form rendering (Tailwind Typography), those can become overly tall gaps.
    // Convert them to simple line breaks.
    return source
      .replace(/<p>\s*(?:&nbsp;|\u00a0)?\s*<br\s*\/?\s*>\s*<\/?p>/gi, '<br>')
      .replace(/<p>\s*(?:&nbsp;|\u00a0)?\s*<\/?p>/gi, '');
  }

  return marked.parse(source) as string;
}
