/**
 * Escapes HTML characters to prevent XSS.
 */
function escapeHtml(text) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escapes regex special characters.
 */
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Highlights matches of query within text using <mark style="background-color: #ffe066">.
 */
export function highlightText(text, query) {
  if (text == null) return '';
  const str = String(text);
  if (!query || !query.trim()) {
    return escapeHtml(str);
  }

  const trimmed = query.trim();
  const regex = new RegExp(`(${escapeRegex(trimmed)})`, 'gi');
  const parts = str.split(regex);

  return parts
    .map((part) => {
      if (part.toLowerCase() === trimmed.toLowerCase()) {
        return `<mark style="background-color: #ffe066; padding: 0 2px; border-radius: 2px;">${escapeHtml(part)}</mark>`;
      }
      return escapeHtml(part);
    })
    .join('');
}
