import ts from 'typescript';

import { NodeWithDocs } from '@root/types';

import { findSupportedJSDocTags } from './utils/js-doc-helpers';

/**
 * Содержит ли нода JSDoc поддерживаемые JSDoc комментариий
 *
 * @param {NodeWithDocs} node узел с JSDoc комментарии
 */
export const isAnySuppportedJsDocs = (node: NodeWithDocs) =>
  !!findSupportedJSDocTags(node.jsDoc).length;

/**
 * Проверить является ли свойство "опциональным"
 *
 * @param {PropertySignature} node нода со свойством
 * @param {boolean} ignoreOptionalOperator флаг игнорирования optional-оператора
 */
export const isOptionalProperty = (
  node: ts.PropertySignature,
  ignoreOptionalOperator?: boolean
) => {
  const isUnion = node.type && node.type.kind === ts.SyntaxKind.UnionType;
  const isUnionWithNull = isUnion
    ? (node.type as ts.UnionTypeNode)?.types
        ?.map((type) => type.kind)
        .some((kind) => kind === ts.SyntaxKind.NullKeyword)
    : false;

  return ignoreOptionalOperator ? false : node.questionToken || (isUnion && isUnionWithNull);
};
