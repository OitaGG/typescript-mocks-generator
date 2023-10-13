import ts from 'typescript';

import { isSupportedJSDocTag } from '@root/guards';
import { NodeWithDocs, SupportedJSDocTag } from '@root/types';

import { generatePrimitive } from '@lib/utils/falso-generators';

/**
 * Определить какой из методов @ngneat/falso подходит для свойства на основе его JSDoc
 */
export function processJsDocs(
  node: NodeWithDocs,
  accumulator: Record<string, any>,
  property: string
) {
  const [tag] = findSupportedJSDocTags(node.jsDoc);
  const tagValue = extractTagValue(tag);

  switch (tag.tagName.text) {
    case 'mockType':
      accumulator[property] = generatePrimitive(node.kind, tagValue);
      break;

    case 'mockRange':
      // TODO
      break;

    default:
      throw new Error(`Unexpected tagName: ${tag.tagName.text}`);
  }
}

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
