import ts from 'typescript';

import { Types } from '@root/types';

import { getFalsoRandomArrayItem } from '@lib/utils/falso-generators';

type ProcessEnumPropertyParams = {
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
export const processEnumProperty = ({ typeName, types }: ProcessEnumPropertyParams): string => {
  const node = types[typeName].node;

  const members = (node as ts.EnumDeclaration).members;
  const membersText = members.map((el) => el.initializer?.getText()) ?? [];

  switch (members?.[0]?.initializer?.kind) {
    case ts.SyntaxKind.NumericLiteral:
      return `Number(${getFalsoRandomArrayItem(membersText)})`;
    case ts.SyntaxKind.StringLiteral:
      return getFalsoRandomArrayItem(membersText);
    default:
      throw new Error('Unknown enum property initializer kind');
  }
};
