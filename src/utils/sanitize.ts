import DOMPurify from 'dompurify';

export const sanitize = (content: string): string => {
  return DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    // Add hook to enforce rel="noopener noreferrer" for external links
    uponSanitizeAttribute: (node, data) => {
      if (data.attrName === 'target' && data.attrValue === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
      }
    },
  });
};

export const sanitizeUrl = (url: string): string => {
  const clean = DOMPurify.sanitize(url, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  if (clean.startsWith('javascript:') || clean.startsWith('data:') || clean.startsWith('vbscript:')) {
    return '';
  }
  return clean;
};
