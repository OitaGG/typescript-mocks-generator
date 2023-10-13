import ts from 'typescript';

import { processPropertyTypeReference } from '@lib/property-processing/process-type-reference-property-type';
import { CommonProcessPropertyParams } from '@lib/property-processing/types';
import { generatePrimitive } from '@lib/utils/falso-generators';
import { normilizeRecordTypeName } from '@lib/utils/types';

/**
 * Обработать свойство-Record
 */
export const processRecordPropertyType = ({
  types,
  typeName,
  sourceFile,
}: CommonProcessPropertyParams): string => {
  const [keyTypeName, valueTypeName] = normilizeRecordTypeName(typeName);

  let keyGenerator = '';
  let valueGenerator = '';
  const keyTypeNameNode = types[keyTypeName];
  const valueTypeNameNode = types[valueTypeName];

  // Определяем key - если node для него существует, значит это не примитив, а type reference
  // TODO: подумать, могут ли быть corner-кейсы
  if (keyTypeNameNode) {
    keyGenerator = processPropertyTypeReference({
      node: keyTypeNameNode as unknown as ts.PropertySignature,
      propertyName: 'key',
      kind: keyTypeNameNode.kind,
      typeName: keyTypeName,
      types,
      sourceFile,
    });
  } else {
    keyGenerator = generatePrimitive(ts.SyntaxKind.StringKeyword);
  }

  if (valueTypeNameNode) {
    valueGenerator = processPropertyTypeReference({
      node: valueTypeNameNode as unknown as ts.PropertySignature,
      propertyName: 'value',
      kind: valueTypeNameNode.kind,
      typeName: valueTypeName,
      types,
      sourceFile,
    });
  } else {
    valueGenerator = generatePrimitive(ts.SyntaxKind.StringKeyword);
  }

  // TODO: Генерация объекта с несколькими свойствами
  return `{[${keyGenerator}]: ${valueGenerator}}`;
};
