import ts from 'typescript';

import { isSupportedJSDocTag } from '@root/guards';
import { SupportedJSDocTag } from '@root/types';

/**
 * Найти mockType и mockRange JSDoc теги
 *
 * @param jsDocs JSDoc комментарии
 */
export const findSupportedJSDocTags = (jsDocs: ts.JSDoc[]): SupportedJSDocTag[] => {
  const supportedJsDocTags: SupportedJSDocTag[] = [];

  jsDocs?.forEach(
    (doc) =>
      doc.tags?.forEach((tag) => {
        if (isSupportedJSDocTag(tag)) {
          supportedJsDocTags.push(tag);
        }
      })
  );

  return supportedJsDocTags;
};

/**
 * Extract value from comment following JSDoc tag
 *
 * @param tag processed tag
 */
export const extractTagValue = (tag: ts.JSDocTag) => {
  let value = (tag.comment as string) || '';

  // Unwrap from braces
  return value.replace(/[\])}[{(]/g, '');
};
