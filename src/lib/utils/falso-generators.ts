import ts from 'typescript';

export const getLiteralTypeValue = (node: ts.LiteralTypeNode) => {
  const { literal } = node;
  // Boolean Literal
  if (literal.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  } else if (literal.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
    // String Literal
  } else if (literal.kind === ts.SyntaxKind.StringLiteral) {
    return literal.text ? literal.text : '';
    // Numeric Literal
  } else {
    // The text IS a string, but the output value has to be a numeric value
    return Number((literal as ts.NumericLiteral).text);
  }
};

/**
 * Генерация примитивных типов: string|number|boolean
 *
 * @param {string} property свойство
 * @param {SyntaxKind} primitiveType тип генерируемой переменной boolean|number|string
 * @param {string} mockType определения метода из @ngneat/falso для генерации значения, если его нет - берется тип переменной
 */
export const generatePrimitive = (primitiveType: ts.SyntaxKind, mockType?: string): string => {
  if (mockType) {
    return falsoWrapper(mockType);
  } else {
    if (!defaultTypeToMock[primitiveType]) {
      throw Error(`Unsupported Primitive type ${primitiveType}`);
    }

    return defaultTypeToMock[primitiveType]() as string;
  }
};

/**
 * Обертка для @ngneat/falso
 *
 * @param {string} mockType определения метода из @ngneat/falso для генерации значения, если его нет - берется тип переменной
 */
export const falsoWrapper = (mockType: string) => `falso.${mockType}()`;

/**
 * Получить случайный элемент из массива
 * @param {(string | undefined)[]} array массив
 */
export const getFalsoRandomArrayItem = (array: unknown[]) => `falso.rand([${array}])`;

/**
 *
 * @param mapper
 */
export const generateFalsoArray = (mapper: unknown) =>
  `new Array(falso.randNumber({ min: 1, max: 10 })).map(el => ${mapper})`;

export const defaultTypeToMock: {
  [index: number]: () => string | number | boolean | object;
} = {
  [ts.SyntaxKind.NumberKeyword]: () => falsoWrapper('randNumber'),
  [ts.SyntaxKind.StringKeyword]: () => falsoWrapper('randText'),
  [ts.SyntaxKind.BooleanKeyword]: () => falsoWrapper('randBoolean'),
  // TODO: Сделать нормальную генерацию object
  [ts.SyntaxKind.ObjectKeyword]: () => falsoWrapper('randText'),
  // TODO: Сделать нормальную генерацию any
  [ts.SyntaxKind.AnyKeyword]: () => falsoWrapper('randText'),
};
