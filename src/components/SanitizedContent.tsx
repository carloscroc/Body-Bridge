import React from 'react';
import { sanitize } from '../utils/sanitize';

interface SanitizedContentProps {
  content: string;
  className?: string;
  tagName?: 'div' | 'span' | 'p' | 'article' | 'section';
}

const SAFE_TAGS = ['div', 'span', 'p', 'article', 'section'] as const;

export const SanitizedContent: React.FC<SanitizedContentProps> = ({
  content,
  className = '',
  tagName: Tag = 'div'
}) => {
  // Validate tagName
  if (!SAFE_TAGS.includes(Tag as any)) {
    console.warn(`Invalid tagName: ${Tag}, defaulting to 'div'`);
    Tag = 'div';
  }

  // Add input validation
  if (typeof content !== 'string') {
    console.warn('Invalid content type, expected string');
    return <Tag className={className} />;
  }

  // Add length limit to prevent DoS
  const MAX_CONTENT_LENGTH = 100000;
  const truncatedContent = content.length > MAX_CONTENT_LENGTH
    ? content.substring(0, MAX_CONTENT_LENGTH)
    : content;

  const clean = sanitize(truncatedContent);

  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
};
