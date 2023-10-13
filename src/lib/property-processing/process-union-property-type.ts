import falso from '@ngneat/falso';
import ts from 'typescript';

import { SUPPORTED_PRIMITIVE_TYPES } from '@root/constants';
import { Types } from '@root/types';

import { getFalsoRandomArrayItem, getLiteralTypeValue } from '@lib/utils/falso-generators';

import { processArrayPropertyType } from './process-array-property-type';
import { processFunctionPropertyType } from './process-function-property-type';
import { processPropertyTypeReference } from './process-type-reference-property-type';
import { CommonProcessPropertyParams } from './types';

type ProcessUnionPropertyTypeParams = CommonProcessPropertyParams;

/**
 * Обработать union тип свойства
 */
export const processUnionPropertyType = ({
  node,
  propertyName,
  types,
  sourceFile,
  typeName,
}: ProcessUnionPropertyTypeParams) => {
  const unionNodes = node?.type
    ? ((node.type as ts.UnionTypeNode).types as ts.NodeArray<ts.TypeNode>)
    : [];

  const innerAccumulator: Record<string, string> = {};

  // Основная идея: проходимся по всем union-нодам и для них записываем генераторы в зависимости от типа ноды, после чего суммируем все генераторы в массиве и в runtime будет получать генератор по случайному индексу
  unionNodes.forEach((node, index) => {
    switch (node.kind) {
      case ts.SyntaxKind.TypeReference:
        return processPropertyTypeReference({
          node: node as unknown as ts.PropertySignature,
          propertyName: `${propertyName}_${index}`,
          kind: node.kind,
          // @ts-ignore
          typeName: (node?.typeName as ts.Identifier)?.text,
          types,
          sourceFile,
        });
      case ts.SyntaxKind.ArrayType:
        return processArrayPropertyType({
          node: node as unknown as ts.PropertySignature,
          propertyName: `${propertyName}_${index}`,
          kind: node.kind,
          // @ts-ignore
          typeName: `${((node.elementType as ts.TypeReferenceNode)?.typeName as ts.Identifier)
            ?.text}`,
          sourceFile,
          types,
        });
      case ts.SyntaxKind.FunctionType:
        return processFunctionPropertyType({
          node: node as unknown as ts.PropertySignature,
          propertyName,
          sourceFile,
          types,
        });
      case ts.SyntaxKind.IndexedAccessType:
        // processIndexedAccessPropertyType(
        //   indexedAccessNode as ts.IndexedAccessTypeNode,
        //   output,
        //   property,
        //   options,
        //   types
        // );
        return undefined;
      case ts.SyntaxKind.LiteralType:
        const literalIndex = falso.randNumber({ min: 0, max: unionNodes.length - 1 });
        return getLiteralTypeValue(unionNodes[literalIndex] as ts.LiteralTypeNode);
      default:
        if (SUPPORTED_PRIMITIVE_TYPES[node.kind]) {
          innerAccumulator[`primitive_${index}`] = node.getText();

          return;
        }

        throw Error(`Unsupported Union option type ${propertyName}: ${typeName}`);
    }
  });

  return getFalsoRandomArrayItem(Object.values(innerAccumulator));
};
