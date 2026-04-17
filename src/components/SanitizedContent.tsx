import React from 'react';
import { sanitize } from '../utils/sanitize';

interface SanitizedContentProps {
  content: string;
  className?: string;
  tagName?: any;
}

export const SanitizedContent: React.FC<SanitizedContentProps> = ({ 
  content, 
  className = '', 
  tagName: Tag = 'div' 
}) => {
  const clean = sanitize(content);
  
  return (
    <Tag 
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
};
