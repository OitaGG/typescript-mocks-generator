import ts from 'typescript';

import { processArrayPropertyType } from '@lib/property-processing/process-array-property-type';
import { processRecordPropertyType } from '@lib/property-processing/process-record-property-type';
import { isArrayTypeName, isRecordTypeName, normilizeArrayTypeName } from '@lib/utils/types';

import { processEnumProperty } from './process-enum-property-type';
import { CommonProcessPropertyParams } from './types';

type TypeCacheRecord = {
  kind: ts.SyntaxKind;
  aliasedTo: ts.SyntaxKind;
  node: ts.Node;
};

/**
 * Обработать typeReference свойство
 */
export const processPropertyTypeReference = ({
  node,
  propertyName,
  kind,
  typeName,
  types,
  sourceFile,
}: CommonProcessPropertyParams): string => {
  let normalizedTypeName: string;
  let isArray = false;
  const typeReference = (node as unknown as ts.MappedTypeNode).type as ts.NodeWithTypeArguments;

  switch (true) {
    // Record считается TypeReference - обрабатываем его отдельно
    case isRecordTypeName(typeName):
      return processRecordPropertyType({
        typeName,
        propertyName,
        kind,
        types,
        sourceFile,
        node,
      });
    //
    case isArrayTypeName(typeName):
      return processArrayPropertyType({
        typeName,
        propertyName,
        kind,
        types,
        sourceFile,
        node: types[normilizeArrayTypeName(typeName)] as unknown as ts.PropertySignature,
      });
    default:
      normalizedTypeName = typeName;
  }

  // Преобразование generic
  if (!!typeReference?.typeArguments?.length) {
    normalizedTypeName = ((typeReference as ts.TypeReferenceNode).typeName as ts.Identifier)
      .escapedText as string;
  }

  if (!types[normalizedTypeName]) {
    const error = `Type '${normalizedTypeName}' is not specified in the provided files but is required for property: '${propertyName}'. Please include it. File - ${sourceFile.fileName}`;

    throw new Error(error);
  }

  switch ((types[normalizedTypeName] as TypeCacheRecord).kind) {
    // Обрабатываем локальные enum'ы
    case ts.SyntaxKind.EnumDeclaration:
      return processEnumProperty({ types, typeName: normalizedTypeName });
    // Обрабатываем typeReference из другого файла - достаточно взять просто генератор (generateOne или generateMany)
    case ts.SyntaxKind.ImportSpecifier:
    case ts.SyntaxKind.ExportSpecifier:
      return isArray
        ? `$generator${normalizedTypeName}.generateCollection(falso.randNumber({min: 0, max: 10}))`
        : `$generator${normalizedTypeName}.generateOne()`;
    // Обрабатываем определения типов не из иморта, типы объявленные локально
    case ts.SyntaxKind.TypeAliasDeclaration:
      return 'generateOne()';
    default:
      // TODO:
      throw new Error('Unknown TypeReference kind');
  }
};
