import ts from 'typescript';

import { isNodeWithJSDoc } from '@root/guards';
import { NodeWithDocs, Types } from '@root/types';

import { isAnySuppportedJsDocs, isOptionalProperty } from '@lib/checkers';
import { processArrayPropertyType } from '@lib/property-processing/process-array-property-type';
import { processGenericPropertyType } from '@lib/property-processing/process-generic-property-type';
import { processPropertyTypeReference } from '@lib/property-processing/process-type-reference-property-type';
import { processUnionPropertyType } from '@lib/property-processing/process-union-property-type';
import { generatePrimitive } from '@lib/utils/falso-generators';
import { extractTagValue, findSupportedJSDocTags } from '@lib/utils/js-doc-helpers';

/**
 * Параметры хелпера обработки определения типов
 */
type AliasDeclarationProcessingParams = {
  /**
   * Наименование определения типа
   */
  aliasName?: string;
  /**
   * Узел AST-дерева файла
   */
  node: ts.Node;
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
 * Обработать определение типов
 * На выходе получим объекты с информацией о пересечении типов
 *
 * @example UserDto = AbstractUserDto & CredentialsDto => { UserDto: { '_$intersections': [ 'AbstractUserDto', 'CredentialsDto' ] } }
 */
export const aliasDeclarationProcessing = ({
  node,
  sourceFile,
  types,
  accumulator,
  aliasName,
}: AliasDeclarationProcessingParams) => {
  if (aliasName) {
    accumulator[aliasName] = {};
    accumulator = accumulator[aliasName];
  }

  // Пересечение типов через оператор &
  if (ts.isIntersectionTypeNode(node)) {
    node.types.forEach((type) => {
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
    aliasDeclarationPropertyProcessing({ node: child, accumulator, sourceFile, types });
  });
};

/**
 * Параметры метода преобразования свойств определения типов, на выходе сопоставляя свойству метод из nfalso
 */
type AliasDeclarationPropertyProcessingParams = {
  /**
   * Узел AST-дерева файла - свойство определения типа
   */
  node: ts.Node;
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
  /**
   * Флаг - заполнять ли optional свойства
   * @default true
   */
  fillOptionalProperties?: boolean;
};

/**
 * Преобразовать свойств определения типов, на выходе сопоставляя свойству метод из nfalso
 */
const aliasDeclarationPropertyProcessing = ({
  node,
  accumulator,
  sourceFile,
  types,
  fillOptionalProperties = true,
}: AliasDeclarationPropertyProcessingParams) => {
  // Обрабатываем только свойства определения типов
  if (!ts.isPropertySignature(node)) {
    return;
  }

  /**
   * Обработка сигнатуры свойства
   */
  const processPropertySignature = (node: ts.PropertySignature) => {
    const propertyName = node.name.getText();
    let kind: ts.SyntaxKind | null = null;
    let typeName = '';

    if (isOptionalProperty(node) && !fillOptionalProperties) {
      return;
    }

    // Если нода содержит поддерживаемый JSDoc, в котором будет описан alias для типа - то используем этот jsDoc для генерации
    if (isNodeWithJSDoc(node) && isAnySuppportedJsDocs(node)) {
      processJsDocs(node, accumulator, propertyName);

      return;
    }

    // В противном случае используем тип свойства, взятый из node.type.getText()
    if (node.type) {
      kind = node.type.kind as ts.SyntaxKind;
      typeName = node.type.getText();
    }

    switch (kind) {
      case ts.SyntaxKind.TypeReference:
        processPropertyTypeReference({
          node,
          accumulator,
          typeName,
          propertyName,
          kind,
          types,
          sourceFile,
        });
        break;
      case ts.SyntaxKind.UnionType:
        processUnionPropertyType({
          node,
          propertyName,
          kind,
          accumulator,
          typeName,
          types,
          sourceFile,
        });
        break;
      case ts.SyntaxKind.TupleType:
        //     processTuplePropertyType(
        //       node.type as ts.TupleTypeNode,
        //       output,
        //       property,
        //       sourceFile,
        //       options,
        //       types
        //     );
        break;
      case ts.SyntaxKind.ArrayType:
        processArrayPropertyType({
          sourceFile,
          // @ts-ignore
          types,
          node,
          propertyName,
          kind,
          typeName,
          accumulator,
        });
        break;
      case ts.SyntaxKind.FunctionType:
        //     processFunctionPropertyType(node, output, property, sourceFile, options, types);
        break;
      case ts.SyntaxKind.IndexedAccessType:
        //     processIndexedAccessPropertyType(
        //       node.type as ts.IndexedAccessTypeNode,
        //       output,
        //       property,
        //       options,
        //       types
        //     );
        break;
      default:
        processGenericPropertyType({ accumulator, node, propertyName, kind });
        break;
    }
  };

  processPropertySignature(node);
};

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
