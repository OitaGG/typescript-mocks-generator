import ts from 'typescript';

import { Types } from '@root/types';

import { generatePrimitive } from '@lib/utils/falso-generators';

import { processArrayPropertyType, processFile } from './process-array-property-type';
import { processEnumProperty } from './process-enum-property-type';
import { CommonProcessPropertyParams } from './types';

/**
 *
 */
type ProcessPropertyTypeReferenceParams = CommonProcessPropertyParams & {
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

type TypeCacheRecord = {
  kind: ts.SyntaxKind;
  aliasedTo: ts.SyntaxKind;
  node: ts.Node;
};

/**
 * Process an individual interface property.
 */
export const processPropertyTypeReference = ({
  node,
  propertyName,
  kind,
  typeName,
  accumulator,
  types,
  sourceFile,
}: ProcessPropertyTypeReferenceParams) => {
  let normalizedTypeName: string;
  let isArray = false;
  const typeReference: ts.NodeWithTypeArguments | undefined = (node as unknown as ts.MappedTypeNode)
    .type;

  // Преобразование массива referenc'ов, получаем только наименования reference
  if (typeName.startsWith('Array<') || typeName.startsWith('IterableArray<')) {
    isArray = true;
    normalizedTypeName = typeName.replace(/(Array|IterableArray)\</, '').replace('>', '');
  } else {
    normalizedTypeName = typeName;
  }

  // Преобразование generic
  if (!isArray && !!typeReference?.typeArguments?.length) {
    normalizedTypeName = ((typeReference as ts.TypeReferenceNode).typeName as ts.Identifier)
      .escapedText as string;
  }

  // TODO: Handle other generics
  if (normalizedTypeName !== typeName && isArray) {
    processArrayPropertyType({
      node,
      propertyName,
      kind,
      typeName: normalizedTypeName,
      accumulator,
      types,
      sourceFile,
    });

    return;
  }

  if (!types[normalizedTypeName]) {
    throw new Error(
      `Type '${normalizedTypeName}' is not specified in the provided files but is required for property: '${propertyName}'. Please include it.`
    );
  }

  switch ((types[normalizedTypeName] as TypeCacheRecord).kind) {
    // Обрабатываем локальные enum'ы
    case ts.SyntaxKind.EnumDeclaration:
      processEnumProperty({ accumulator, types, typeName: normalizedTypeName, propertyName });
      break;
    // Обрабатываем typeReference из другого файла - достаточно взять просто генератор (generateOne или generateMany)
    case ts.SyntaxKind.ImportSpecifier:
    case ts.SyntaxKind.ExportSpecifier:
      accumulator[propertyName] = isArray
        ? `$generator${normalizedTypeName}.generateCollection()`
        : `$generator${normalizedTypeName}.generateOne()`;
      accumulator._$imports = accumulator._$imports ?? [];
      accumulator._$imports.push(normalizedTypeName);
      break;
    // Обрабатываем все остальные typeReference
    default:
      const record = types[normalizedTypeName];

      if (record.kind !== record.aliasedTo) {
        const alias = record.aliasedTo;
        const isPrimitiveType =
          alias === ts.SyntaxKind.StringKeyword ||
          alias === ts.SyntaxKind.NumberKeyword ||
          alias === ts.SyntaxKind.BooleanKeyword;

        if (isPrimitiveType) {
          accumulator[propertyName] = generatePrimitive(alias);
        } else if (alias === ts.SyntaxKind.UnionType) {
          let parameters: string[] = [];

          if (record && record.node) {
            const typeParameters = (record.node as ts.TypeAliasDeclaration).typeParameters;

            if (typeParameters) {
              parameters = typeParameters.map((value) => value.name.escapedText as string);
            }

            const updatedArr = (
              (record.node as ts.TypeAliasDeclaration).type as ts.UnionOrIntersectionTypeNode
            ).types.map((t) => {
              const parameterIndex = (t as ts.TypeReferenceNode).typeName
                ? parameters.indexOf(
                    ((t as ts.TypeReferenceNode).typeName as ts.Identifier).escapedText as string
                  )
                : -1;
              if (parameterIndex > -1) {
                const propertyType: ts.NodeWithTypeArguments | undefined = (
                  node as ts.PropertySignature
                ).type;
                if (propertyType && propertyType.typeArguments) {
                  return propertyType.typeArguments[parameterIndex];
                }
              }
              return t;
            });
            //     (
            //       (record.node as ts.TypeAliasDeclaration).type as ts.UnionOrIntersectionTypeNode
            //     ).types = updatedArr as unknown as ts.NodeArray<ts.TypeNode>;
            //     processUnionPropertyType(
            //       record.node as ts.PropertySignature,
            //       output,
            //       property,
            //       typeName,
            //       record.kind,
            //       sourceFile,
            //       options,
            //       types
            //     );
          }
          //       } else if (alias === ts.SyntaxKind.TypeLiteral) {
          //         output[property] = {};
          //         processFile(sourceFile, output[property], options, types, typeName);
        } else {
          accumulator[propertyName] = {};
          processFile({ sourceFile, types, accumulator: accumulator[propertyName], typeName });
          break;
        }
      }
  }
};
