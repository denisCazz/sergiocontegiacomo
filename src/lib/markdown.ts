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
    // Also decode HTML entities like &amp; to &, &lt; to <, etc.
    let html = source
      .replace(/<p>\s*(?:&nbsp;|\u00a0)?\s*<br\s*\/?\s*>\s*<\/?p>/gi, '<br>')
      .replace(/<p>\s*(?:&nbsp;|\u00a0)?\s*<\/?p>/gi, '');
    
    // Decode common HTML entities
    html = html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
    
    return html;
  }

  return marked.parse(source) as string;
}
