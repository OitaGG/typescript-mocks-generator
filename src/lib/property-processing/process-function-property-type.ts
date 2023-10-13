import ts from 'typescript';

import { Types } from '@root/types';

import { generatePrimitive } from '@lib/utils/falso-generators';

import { processPropertyTypeReference } from './process-type-reference-property-type';

type ProcessFunctionPropertyTypeParams = {
  /**
   * Узел AST-дерева файла - свойство определения типа
   */
  node: ts.PropertySignature;
  /**
   * Наименование свойства
   */
  propertyName: string;
  /**
   * AST-дерево файла
   */
  sourceFile: ts.SourceFile;
  /**
   * Ссылки на интерфейсы и типы из AST дерева файла
   */
  types: Types;
};

/**
 * Generate a function for a call signature of a property of an interface.
 * Uses the `new Function` constructor and stringifies any internal function
 * declarations/calls or returned complex types.
 */
export const processFunctionPropertyType = ({
  node,
  sourceFile,
  types,
}: ProcessFunctionPropertyTypeParams) => {
  // TODO process args from parameters of function
  const args = '';
  let body = '';

  const funcNode = (ts.isTypeNode(node) ? node : node.type) as ts.FunctionTypeNode;
  const returnType = funcNode.type;

  switch (returnType.kind) {
    case ts.SyntaxKind.TypeReference:
      const typeReferenceGenerator = processPropertyTypeReference({
        node,
        types,
        sourceFile,
        propertyName: 'body',
        kind: returnType.kind,
        typeName: ((returnType as ts.TypeReferenceNode).typeName as ts.Identifier).text,
      });

      return `return ${typeReferenceGenerator}`;
    default:
      return `return ${JSON.stringify(generatePrimitive(returnType.kind))}`;
  }
};
