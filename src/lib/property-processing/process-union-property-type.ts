import ts from 'typescript';

import { SUPPORTED_PRIMITIVE_TYPES } from '@root/constants';
import { Types } from '@root/types';

import { randomRange } from '@lib/random';
import { getFalsoRandomArrayItem, getLiteralTypeValue } from '@lib/utils/falso-generators';

import { processArrayPropertyType } from './process-array-property-type';
import { processFunctionPropertyType } from './process-function-property-type';
import { processPropertyTypeReference } from './process-type-reference-property-type';
import { CommonProcessPropertyParams } from './types';

type ProcessUnionPropertyTypeParams = CommonProcessPropertyParams & {
  /**
   * Тип свойства
   * @example Array<Reference>
   */
  typeName: string;
  /**
   * AST-дерево файла
   */
  sourceFile: ts.SourceFile;
  /**
   * Ссылки на интерфейсы и типы из AST дерева файла
   */
  types: Types;
};

/**
 * Обработать union тип свойства
 */
export const processUnionPropertyType = ({
  accumulator,
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
        processPropertyTypeReference({
          node: node as unknown as ts.PropertySignature,
          accumulator: innerAccumulator,
          propertyName: `${propertyName}_${index}`,
          kind: node.kind,
          // @ts-ignore
          typeName: (node?.typeName as ts.Identifier)?.text,
          types,
          sourceFile,
        });
        break;
      case ts.SyntaxKind.ArrayType:
        processArrayPropertyType({
          node: node as unknown as ts.PropertySignature,
          propertyName: `${propertyName}_${index}`,
          accumulator: innerAccumulator,
          kind: node.kind,
          // @ts-ignore
          typeName: `${((node.elementType as ts.TypeReferenceNode)?.typeName as ts.Identifier)
            ?.text}`,
          sourceFile,
          types,
        });
        break;
      case ts.SyntaxKind.FunctionType:
        processFunctionPropertyType({
          node: node as unknown as ts.PropertySignature,
          accumulator,
          propertyName,
          sourceFile,
          types,
        });
        break;
      case ts.SyntaxKind.IndexedAccessType:
        // processIndexedAccessPropertyType(
        //   indexedAccessNode as ts.IndexedAccessTypeNode,
        //   output,
        //   property,
        //   options,
        //   types
        // );
        break;
      case ts.SyntaxKind.LiteralType:
        const literalIndex = randomRange(0, unionNodes.length - 1);
        accumulator[propertyName] = getLiteralTypeValue(
          unionNodes[literalIndex] as ts.LiteralTypeNode
        );
        break;
      default:
        if (SUPPORTED_PRIMITIVE_TYPES[node.kind]) {
          innerAccumulator[`primitive_${index}`] = node.getText();

          return;
        }

        throw Error(`Unsupported Union option type ${propertyName}: ${typeName}`);
    }
  });

  accumulator[propertyName] = getFalsoRandomArrayItem(Object.values(innerAccumulator));
};
