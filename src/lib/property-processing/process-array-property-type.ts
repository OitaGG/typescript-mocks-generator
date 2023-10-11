import ts from 'typescript';

import { Types } from '@root/types';

import { aliasDeclarationProcessing } from '@lib/declaration-processing/alias-declaration-processing';
import { generateFalsoArray, generatePrimitive } from '@lib/utils/falso-generators';

import { processPropertyTypeReference } from './process-type-reference-property-type';
import { CommonProcessPropertyParams } from './types';

type ProcessArrayPropertyTypeParams = CommonProcessPropertyParams & {
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
 * Преобразовать определение свойства типа "Массив" чего-либо
 */
export const processArrayPropertyType = ({
  accumulator,
  kind,
  node,
  propertyName,
  typeName,
  sourceFile,
  types,
}: ProcessArrayPropertyTypeParams) => {
  typeName = typeName.replace('[', '').replace(']', '');
  typeName = normalizeNamespaceTypeName(typeName);

  const result = [];

  if (ts.isArrayTypeNode(node)) {
    kind = (node as ts.ArrayTypeNode)?.elementType?.kind;
  } else if (ts.isTypeNode(node)) {
    kind = node.kind;
  } else if ((node.type as ts.ArrayTypeNode).elementType) {
    kind = (node.type as ts.ArrayTypeNode).elementType.kind;
  }

  const isPrimitiveType =
    kind === ts.SyntaxKind.StringKeyword ||
    kind === ts.SyntaxKind.BooleanKeyword ||
    kind === ts.SyntaxKind.NumberKeyword;

  switch (kind) {
    // Если массив является примитивом - просто заполняем его генерируемыми данными
    case ts.SyntaxKind.StringKeyword:
    case ts.SyntaxKind.BooleanKeyword:
    case ts.SyntaxKind.NumberKeyword:
      accumulator[propertyName] = generateFalsoArray(generatePrimitive(kind!));
      break;
    case ts.SyntaxKind.TypeReference: {
      const innerAccumulator: Record<string, unknown> = {};
      processPropertyTypeReference({
        node,
        accumulator: innerAccumulator,
        types,
        sourceFile,
        propertyName: 'body',
        kind,
        typeName,
      });

      // TODO: сделать так, чтобы генерировалась generateCollection
      accumulator[propertyName] = generateFalsoArray(innerAccumulator['body']);

      break;
    }
    default: {
      const innerAccumulator = {};
      processFile({ sourceFile, types, accumulator: innerAccumulator, typeName });
      accumulator[propertyName] = generateFalsoArray(innerAccumulator);
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
