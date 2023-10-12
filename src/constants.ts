import ts from 'typescript';

/**
 * Поддерживаемые JSDoc тэги для свойств типов
 */
export const SUPPORTED_JSDOC_TAG_NAMES = ['mockType', 'mockRange'] as const;

/**
 * Поддерживаемые примитивные типы
 */
export const SUPPORTED_PRIMITIVE_TYPES: Record<string, boolean> = {
  [ts.SyntaxKind.NumberKeyword]: true,
  [ts.SyntaxKind.StringKeyword]: true,
  [ts.SyntaxKind.BooleanKeyword]: true,
  [ts.SyntaxKind.ObjectKeyword]: true,
  [ts.SyntaxKind.AnyKeyword]: true,
};
