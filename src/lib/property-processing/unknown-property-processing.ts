import ts from 'typescript';

import { isNodeWithJSDoc } from '@root/guards';
import { Types } from '@root/types';

import { processArrayPropertyType } from '@lib/property-processing/process-array-property-type';
import { processFunctionPropertyType } from '@lib/property-processing/process-function-property-type';
import { processPrimitivePropertyType } from '@lib/property-processing/process-primitive-property-type';
import { processPropertyTypeReference } from '@lib/property-processing/process-type-reference-property-type';
import { processUnionPropertyType } from '@lib/property-processing/process-union-property-type';
import { CommonProcessPropertyParams } from '@lib/property-processing/types';
import { isAnySuppportedJsDocs, isOptionalProperty } from '@lib/utils/checkers';
import { processJsDocs } from '@lib/utils/js-doc-helpers';

/**
 * Параметры метода преобразования свойств определения типов, на выходе сопоставляя свойству метод из nfalso
 */
type UnknownPropertyProcessingParams = {
  /**
   * Узел AST-дерева файла - свойство определения типа
   */
  node: ts.PropertySignature;
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
 * Обработать PropertySignature (property: type)
 */
export const unknownPropertyProcessing = ({
  node,
  accumulator,
  sourceFile,
  types,
  fillOptionalProperties = true,
}: UnknownPropertyProcessingParams) => {
  const processPropertySignature = (node: ts.PropertySignature) => {
    // Имя свойство
    const propertyName = node.name.getText();
    // Тип свойства
    let kind: ts.SyntaxKind | null = node?.type?.kind as ts.SyntaxKind;
    // Наименование типа свойства
    const typeName = node?.type?.getText() ?? '';

    // TODO: реализовать заполнение опционального свойства согласно указанному JSDoc или случайно
    if (isOptionalProperty(node) && !fillOptionalProperties) {
      return;
    }

    // Если нода содержит поддерживаемый JSDoc, в котором будет описан alias для типа - то используем этот jsDoc для генерации
    if (isNodeWithJSDoc(node) && isAnySuppportedJsDocs(node)) {
      processJsDocs(node, accumulator, propertyName);

      return;
    }

    const commonProperties: CommonProcessPropertyParams = {
      kind,
      node,
      propertyName,
      typeName,
      types,
      sourceFile,
    };

    let generator: unknown = '';

    // Обрабатываем свойство в зависимости от его типа
    switch (kind) {
      case ts.SyntaxKind.TypeReference:
        generator = processPropertyTypeReference(commonProperties);
        break;
      case ts.SyntaxKind.UnionType:
        console.log('hello');
        generator = processUnionPropertyType(commonProperties);
        break;
      case ts.SyntaxKind.ArrayType:
        generator = processArrayPropertyType(commonProperties);
        break;
      case ts.SyntaxKind.FunctionType:
        generator = processFunctionPropertyType(commonProperties);
        break;
      case ts.SyntaxKind.IndexedAccessType:
        // TODO: Обработка IndexedAccessType
        break;
      case ts.SyntaxKind.TupleType:
        // TODO: Обработка TupleType
        break;
      default:
        generator = processPrimitivePropertyType(commonProperties);
        break;
    }

    accumulator[propertyName] = generator;
  };

  processPropertySignature(node);
};
