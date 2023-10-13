import ts from 'typescript';

import { Types } from '@root/types';

import { aliasDeclarationProcessing } from '@lib/declaration-processing/alias-declaration-processing';
import { generateFalsoArray, generatePrimitive } from '@lib/utils/falso-generators';
import { normilizeArrayTypeName } from '@lib/utils/types';

import { processPropertyTypeReference } from './process-type-reference-property-type';
import { CommonProcessPropertyParams } from './types';

/**
 * Преобразовать определение свойства типа "Массив" чего-либо
 */
export const processArrayPropertyType = ({
  kind,
  node,
  typeName,
  sourceFile,
  types,
}: CommonProcessPropertyParams): string => {
  const normalizedTypeName = normalizeNamespaceTypeName(normilizeArrayTypeName(typeName));

  if (ts.isArrayTypeNode(node)) {
    kind = (node as ts.ArrayTypeNode)?.elementType?.kind;
  } else if (ts.isTypeNode(node)) {
    kind = node.kind;
  } else if ((node.type as ts.ArrayTypeNode)?.elementType) {
    kind = (node.type as ts.ArrayTypeNode).elementType.kind;
  }

  switch (kind) {
    // Если массив является примитивом - просто заполняем его генерируемыми данными
    case ts.SyntaxKind.StringKeyword:
    case ts.SyntaxKind.BooleanKeyword:
    case ts.SyntaxKind.NumberKeyword:
      return generateFalsoArray(generatePrimitive(kind!));
    case ts.SyntaxKind.TypeReference: {
      const typeReferenceGenerator = processPropertyTypeReference({
        node,
        types,
        sourceFile,
        propertyName: 'body',
        kind,
        typeName: normalizedTypeName,
      });

      // TODO: сделать так, чтобы генерировалась generateCollection
      return generateFalsoArray(typeReferenceGenerator);
    }
    default: {
      const innerAccumulator = {};
      processFile({
        sourceFile,
        types,
        accumulator: innerAccumulator,
        typeName: normalizedTypeName,
      });

      return generateFalsoArray(innerAccumulator);
    }
  }
};

type ProcessFileParam = {
  typeName: string;
  /**
   * AST-дерево файла
   */
  sourceFile: ts.SourceFile;
  /**
   * Ссылки на интерфейсы и типы из AST дерева файла
   */
  types: Types;
  /**
   * Аккумулятор значений, полученных в результате обработки определения типов
   */
  accumulator: Record<string, any>;
};

/**
 * Process an individual TS file given a TS AST object.
 */
export function processFile({ sourceFile, types, accumulator, typeName }: ProcessFileParam) {
  const processNode = (node: ts.Node) => {
    switch (node.kind) {
      // TODO: работа с интерфейсами
      case ts.SyntaxKind.TypeAliasDeclaration: {
        const type = (node as ts.TypeAliasDeclaration).type;
        const aliasName = (node as ts.TypeAliasDeclaration).name.text;

        if (typeName) {
          if (typeName === aliasName) {
            aliasDeclarationProcessing({ node: type, sourceFile, accumulator, types });
          }
        } else {
          aliasDeclarationProcessing({ node: type, sourceFile, accumulator, types, aliasName });
        }

        break;
      }
      default:
        break;
    }

    ts.forEachChild(node, processNode);
  };

  processNode(sourceFile);
}

const normalizeNamespaceTypeName = (typeName: string) => {
  return typeName.replace(/[a-zA-Z0-9]+\.([a-zA-Z0-9]+)/g, '$1');
};
