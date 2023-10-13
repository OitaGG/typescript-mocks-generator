import ts, { PropertySignature, SyntaxKind } from 'typescript';

import { Types } from '@root/types';

/**
 * Базовые свойства для хелперов преобразования свойств без jsDoc
 */
export type CommonProcessPropertyParams = {
  /**
   * Наименование root-типа для которого идет генерация
   */
  rootTypeDeclarationName?: string;
  /**
   * Узел AST-дерева файла - свойство определения типа
   */
  node: PropertySignature;
  /**
   * Наименование свойства
   */
  propertyName: string;
  /**
   * Тип свойства
   */
  kind: SyntaxKind | null;
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
