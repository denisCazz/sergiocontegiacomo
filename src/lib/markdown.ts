import { marked } from 'marked';

marked.use({ mangle: false, headerIds: true, breaks: true });

export function renderMarkdown(source?: string | null) {
  if (!source) {
    return '';
  }

  return marked.parse(source) as string;
}
