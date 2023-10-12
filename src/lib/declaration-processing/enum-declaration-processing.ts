import { CommonDeclarationProcessingParams } from '@lib/declaration-processing/types';
import { processEnumProperty } from '@lib/property-processing/process-enum-property-type';

/**
 * Обработать определение Enum, встретившееся нам в файле
 */
export const enumDeclarationProcessing = ({
  accumulator,
  sourceFile,
  aliasName,
  types,
  node,
}: CommonDeclarationProcessingParams) => {
  processEnumProperty({ accumulator, propertyName: 'enum', types, typeName: aliasName! });
};
