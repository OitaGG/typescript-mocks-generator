import ts from 'typescript';

export const supportedPrimitiveTypes: { [key: string]: boolean } = {
  [ts.SyntaxKind.NumberKeyword]: true,
  [ts.SyntaxKind.StringKeyword]: true,
  [ts.SyntaxKind.BooleanKeyword]: true,
  [ts.SyntaxKind.ObjectKeyword]: true,
  [ts.SyntaxKind.AnyKeyword]: true,
};
