import { CommonDeclarationProcessingParams } from '@lib/declaration-processing/types';
import { processEnumProperty } from '@lib/property-processing/process-enum-property-type';

/**
 * Обработать определение Enum, встретившееся нам в файле
 */
export const enumDeclarationProcessing = ({
  aliasName,
  types,
  accumulator,
}: CommonDeclarationProcessingParams) => {
  accumulator.enum = processEnumProperty({ types, typeName: aliasName! });
};
