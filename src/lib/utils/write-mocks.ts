import { writeFile } from 'fs';
import { basename, relative, resolve } from 'path';
import prettier from 'prettier';
import ts from 'typescript';

import { SourceFileInfo, TemplateFileTypes } from '@root/types';

import { collectImports } from './resolve-file-imports';

/**
 * Параметры хелпера записи моковых генераторов
 */
type WriteMocksParams = {
  /**
   * Информация о файле
   */
  sourceFileInfo: SourceFileInfo;
  /**
   * Исходный файл
   */
  sourceFile: ts.SourceFile;
  /**
   * Шаблоны
   */
  templates: Record<TemplateFileTypes, HandlebarsTemplateDelegate>;
};

/**
 * Сохранить моковые генераторы в файлы
 */
export const writeMocks = async ({ sourceFileInfo, sourceFile, templates }: WriteMocksParams) => {
  // @ts-ignore
  const { inputPath, outputPath } = global.__MOCKS_GENERATOR_OPTIONS__;
  const { _$fileName } = sourceFileInfo;

  // Собираем все импорты
  const imports = collectImports(sourceFile);

  const resolvedOutputPath = resolve(process.cwd(), outputPath);
  const resolvedInputPath = resolve(process.cwd(), inputPath);
  const outputFile = resolve(resolvedOutputPath, basename(sourceFile.fileName));

  const res = templates?.[sourceFileInfo._$fileType!]?.({
    // Информация об импортах
    hasImports: !!imports.length,
    generatorsImports: [...imports],
    typeFileName: sourceFileInfo._$fileName,
    pathToTypeFile: `${relative(resolvedOutputPath, resolvedInputPath)}/${basename(
      sourceFile.fileName
    )}`,
    // @ts-ignore
    intersections: sourceFileInfo[_$fileName!]?._$intersections,
    declarations: getTemplateTypeProperties(sourceFileInfo),
  });

  const formattedCode = await prettier.format(res, {
    parser: 'typescript',
  });

  writeFile(outputFile, formattedCode, (err) => {
    err && console.error(err);
  });
};

// @ts-ignore

/**
 * Получить определения свойств для генератора
 */
const getTemplateTypeProperties = (sourceFileInfo: SourceFileInfo) => {
  if (sourceFileInfo._$fileType === TemplateFileTypes.ENUM_DECLARATION) {
    return sourceFileInfo?.enum;
  } else {
    return Object.entries(sourceFileInfo?.[sourceFileInfo?._$fileName as any] ?? {})
      .filter(([name]) => name !== '_$fileType' && name !== '_$intersections')
      .map(([name, value], i) => ({
        name,
        value,
      }));
  }
};
