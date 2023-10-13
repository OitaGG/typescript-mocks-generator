import ts from 'typescript';

import { CommonDeclarationProcessingParams } from '@lib/declaration-processing/types';
import { unknownPropertyProcessing } from '@lib/property-processing/unknown-property-processing';

/**
 * Обработать определение типов
 * На выходе получим объекты с информацией о пересечении типов
 */
export const aliasDeclarationProcessing = ({
  node,
  sourceFile,
  types,
  accumulator,
  aliasName,
}: CommonDeclarationProcessingParams) => {
  if (aliasName) {
    accumulator[aliasName] = {};
    accumulator = accumulator[aliasName];
  }

  // Пересечение типов через оператор &
  if (
    ts.isIntersectionTypeNode(node) ||
    (ts.isParenthesizedTypeNode(node) && ts.isIntersectionTypeNode(node.type))
  ) {
    const intersectionNode = ts.isIntersectionTypeNode(node)
      ? node
      : (node.type as ts.IntersectionTypeNode);

    intersectionNode.types.forEach((type) => {
      if (ts.isTypeReferenceNode(type)) {
        accumulator._$intersections = accumulator._$intersections ?? [];
        accumulator._$intersections.push(
          type ? ((type.typeName as ts.Identifier).escapedText as string) : ''
        );

        return;
      }

      aliasDeclarationProcessing({
        node: type,
        accumulator,
        sourceFile,
        types,
      });
    });

    return;
  }

  node.forEachChild((child) => {
    // Обрабатываем только свойства определения типов
    if (ts.isPropertySignature(child)) {
      unknownPropertyProcessing({ node: child, accumulator, sourceFile, types });
    }
  });
};
