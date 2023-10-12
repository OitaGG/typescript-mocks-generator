import ts from 'typescript';

import { Types } from '@root/types';

/**
 * Дефолтные параметры для обработки определения типа/enum'а и т.д., которое мы встретили в файле
 */
export type CommonDeclarationProcessingParams = {
  /**
   * Узел AST-дерева, соответствующий определению типа/enum'а
   */
  node: ts.Node;
  /**
   * Наименование определения
   */
  aliasName?: string;
  /**
   * Ссылки на интерфейсы и типы из AST дерева файла
   */
  types: Types;
  /**
   * AST-дерево файла
   */
  sourceFile: ts.SourceFile;
  /**
   * Аккумулятор значений, полученных в результате обработки определения
   */
  accumulator: Record<string, any>;
};
