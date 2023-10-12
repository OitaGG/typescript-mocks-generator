import ts from 'typescript';

import { SUPPORTED_JSDOC_TAG_NAMES } from './constants';
import { NodeWithDocs, SupportedJSDocTag } from './types';

/**
 * Узел содержит jsDocs свойство
 *
 * @param {Node} node узел
 */
export const isNodeWithJSDoc = (node: ts.Node): node is NodeWithDocs =>
  Object.hasOwnProperty.call(node, 'jsDoc');

/**
 * Является ли JSDoc комментарий одним из поддерживаемых JSDoc тегов
 *
 * @param {JSDocTag} tag JSDoc тег
 */
export const isSupportedJSDocTag = (tag: ts.JSDocTag): tag is SupportedJSDocTag => {
  return (SUPPORTED_JSDOC_TAG_NAMES as readonly string[]).includes(tag.tagName.text);
};
