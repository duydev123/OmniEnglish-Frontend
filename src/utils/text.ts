/**
 * Utility to sanitize HTML strings into clean text with newlines for block elements.
 * Safely converts <div>, <p>, <br>, <li>, etc. into newline breaks and strips all HTML tags.
 */
export const cleanHtmlToText = (input: string | null | undefined): string => {
  if (!input) return '';
  if (!input.includes('<')) return input;

  // Replace block ending tags and <br> with newlines
  let formatted = input
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<tr\s*[\/]?>/gi, '\n');

  if (typeof document !== 'undefined') {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = formatted;
    formatted = tmp.textContent || tmp.innerText || '';
  } else {
    formatted = formatted.replace(/<[^>]*>/g, '');
  }

  return formatted
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
};
