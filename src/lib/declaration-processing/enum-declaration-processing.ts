import ts from 'typescript';

import { Types } from '@root/types';

import { processEnumProperty } from '@lib/property-processing/process-enum-property-type';

/**
 * Параметры хелпера обработки определения типов
 */
type EnumDeclarationProcessingParams = {
  /**
   * Наименование определения типа
   */
  aliasName: string;
  /**
   * Узел AST-дерева файла
   */
  node: ts.Node;
  /**
   * Ссылки на интерфейсы и типы из AST дерева файла
   */
  types: Types;
  /**
   * AST-дерево файла
   */
  sourceFile: ts.SourceFile;
  /**
   * Аккумулятор значений, полученных в результате обработки определения типов
   */
  accumulator: Record<string, any>;
};

export const enumDeclarationProcessing = ({
  accumulator,
  sourceFile,
  aliasName,
  types,
  node,
}: EnumDeclarationProcessingParams) => {
  const cache = {};

  processEnumProperty({ accumulator: cache, propertyName: 'enum', types, typeName: aliasName });

  console.log(cache);
};
