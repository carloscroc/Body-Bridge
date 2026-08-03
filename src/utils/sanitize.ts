import DOMPurify from 'dompurify';

// Register hook once to enforce rel="noopener noreferrer" on target="_blank" links.
// `uponSanitizeAttribute` is a HOOK event, not a Config property — must be wired via addHook.
DOMPurify.addHook(
  'uponSanitizeAttribute',
  (node: Element | null, data: { attrName: string; attrValue: string }): void => {
    if (data.attrName === 'target' && data.attrValue === '_blank') {
      node?.setAttribute('rel', 'noopener noreferrer');
    }
  }
);

export const sanitize = (content: string): string => {
  return DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
};

export const sanitizeUrl = (url: string): string => {
  const clean = DOMPurify.sanitize(url, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  if (clean.startsWith('javascript:') || clean.startsWith('data:') || clean.startsWith('vbscript:')) {
    return '';
  }
  return clean;
};
