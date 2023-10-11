import { PropertySignature, SyntaxKind } from 'typescript';

/**
 * Базовые свойства для хелперов преобразования свойств без jsDoc
 */
export type CommonProcessPropertyParams = {
  /**
   * Аккумулятор всех свойств
   */
  accumulator: Record<string, any>;
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
};
