import ts from 'typescript';

import { Types } from '@root/types';

import { getFalsoRandomArrayItem } from '@lib/utils/falso-generators';

type ProcessEnumPropertyParams = {
  /**
   * Аккумулятор всех свойств
   */
  accumulator: Record<string, any>;
  /**
   * Наименование свойства
   */
  propertyName: string;
  /**
   * Тип свойства
   * @example Array<Reference>
   */
  typeName: string;
  /**
   * Ссылки на интерфейсы и типы из AST дерева файла
   */
  types: Types;
};

/**
 * Получить данные для свойства типа enum - берем все значения enum'ом и берем рандомный индекс
 */
export const processEnumProperty = ({
  accumulator,
  typeName,
  propertyName,
  types,
}: ProcessEnumPropertyParams) => {
  const node = types[typeName].node;

  if (!node) {
    return;
  }

  const members = (node as ts.EnumDeclaration).members;
  const membersText = members.map((el) => el.initializer?.getText()) ?? [];

  switch (members?.[0]?.initializer?.kind) {
    case ts.SyntaxKind.NumericLiteral:
      accumulator[propertyName] = `Number(${getFalsoRandomArrayItem(membersText)})`;
      break;
    case ts.SyntaxKind.StringLiteral:
      accumulator[propertyName] = getFalsoRandomArrayItem(membersText);
      break;
    default:
      break;
  }
};
