import ts from 'typescript';

/**
 * Убрать из typeName обозначения массива
 * @param {string} typeName имя типа
 */
export const normilizeArrayTypeName = (typeName: string) =>
  typeName
    .replace(/(Array|IterableArray|)\</, '')
    .replace('>', '')
    .replace('[', '')
    .replace(']', '');

/**
 * Убрать из typeName обнозначения Record
 * @param {string} typeName имя типа
 */
export const normilizeRecordTypeName = (typeName: string) =>
  typeName
    .replace(/Record\</, '')
    .replace('>', '')
    .split(',')
    .map((name) => name.trim());

// Guards
/**
 * Является ли тип массивом
 *
 * @param {string} typeName имя типа
 */
export const isArrayTypeName = (typeName: string) =>
  typeName.startsWith('Array<') || typeName.startsWith('IterableArray<') || typeName.endsWith('[]');

/**
 * Является ли тип Record'ом
 *
 * @param {string} typeName имя типа
 */
export const isRecordTypeName = (typeName: string) => typeName.startsWith('Record');

/**
 * Является ли тип примитивным
 *
 * @param {ts.SyntaxKind} typeName имя типа
 */
export const isPrimitiveTypeName = (typeName: ts.SyntaxKind) =>
  typeName === ts.SyntaxKind.StringKeyword ||
  typeName === ts.SyntaxKind.NumberKeyword ||
  typeName === ts.SyntaxKind.BooleanKeyword;
