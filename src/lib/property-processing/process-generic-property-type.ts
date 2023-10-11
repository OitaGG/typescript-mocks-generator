import ts from 'typescript';

import { generatePrimitive } from '@lib/utils/falso-generators';

import { CommonProcessPropertyParams } from './types';

/**
 * Преобразовать свойство, для которого не указан JSDoc
 */
export const processGenericPropertyType = ({
  accumulator,
  node,
  propertyName,
  kind,
}: CommonProcessPropertyParams) => {
  // Если тип литерал - просто возвращаем сам литерал
  if (node && node.type && ts.isLiteralTypeNode(node.type)) {
    accumulator[propertyName] = getLiteralTypeValue(node.type as ts.LiteralTypeNode);
    return;
  }

  accumulator[propertyName] = generatePrimitive(kind!);
};

/**
 * Получить значение для литерального типа
 * @param {LiteralTypeNode} node нода с литеральным типом
 * @example {literal: true}
 */
const getLiteralTypeValue = (node: ts.LiteralTypeNode) => {
  const { literal } = node;
  // Boolean Literal
  if (literal.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  } else if (literal.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
    // String Literal
  } else if (literal.kind === ts.SyntaxKind.StringLiteral) {
    return literal.text ? literal.text : '';
    // Numeric Literal
  } else {
    // The text IS a string, but the output value has to be a numeric value
    return Number((literal as ts.NumericLiteral).text);
  }
};
