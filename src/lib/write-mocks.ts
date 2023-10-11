import ts from 'typescript';

import { collectImports } from './resolve-file-imports';

import { resolve, relative, basename } from 'path';
import { EOL } from 'os';
import { writeFile } from 'fs';
import Handlebars from 'handlebars';
import { readFilesFromDirectory } from './read-files';

/**
 * Параметры хелпера записи моковых генераторов
 */
type WriteMocksParams = {
  /**
   * Информация о файле
   */
  sourceFileInfo: Record<string, unknown>;
  /**
   * Исходный файл
   */
  sourceFile: ts.SourceFile;
};

async function renderTemplate(data: unknown) {
  const source = await readFilesFromDirectory('./src/templates');

  const template = Handlebars.compile(source[0][1]);

  return template(data);
}

/**
 * Сохранить моковые генераторы в файлы
 */
export const writeMocks = async ({ sourceFileInfo, sourceFile }: WriteMocksParams) => {
  // @ts-ignore
  const { inputPath, outputPath } = global.__MOCKS_GENERATOR_OPTIONS__;

  // Собираем все импорты
  const imports = collectImports(sourceFile);

  const resolvedOutputPath = resolve(process.cwd(), outputPath);
  const resolvedInputPath = resolve(process.cwd(), inputPath);
  const outputFile = resolve(resolvedOutputPath, basename(sourceFile.fileName));
  // TODO: Что будет, если типов в файле будет больше чем 1?
  const typeFileName = Object.keys(sourceFileInfo)[0];

  const res = await renderTemplate({
    // Информация об импортах
    hasImports: !!imports.length,
    generatorsImports: [...imports],
    typeFileName,
    pathToTypeFile: `${relative(resolvedOutputPath, resolvedInputPath)}/${basename(
      sourceFile.fileName
    )}`,
    declarations: getTemplateTypeProperties(sourceFileInfo, typeFileName),
  });

  writeFile(outputFile, formatIndentation(formatCode(res)), (err) => {
    err && console.error(err);
  });
};

// @ts-ignore
/**
 * Получить определения свойств для генератора
 */
const getTemplateTypeProperties = (sourceFileInfo: Record<string, unknown>, typeName: string) =>
  // @ts-ignore
  Object.entries(sourceFileInfo?.[typeName] ?? {})
    .filter(([name]) => name !== '_$imports')
    .map(([name, value], i) => ({
      name,
      value,
    }));

export const formatCode = (s: string): string => {
  // @ts-ignore
  let indent: number = 0;
  let lines = s.split(EOL);
  lines = lines.map((line) => {
    line = line.trim().replace(/^\*/g, ' *');
    let i = indent;
    if (line.endsWith('(') || line.endsWith('{') || line.endsWith('[')) {
      indent++;
    }
    if ((line.startsWith(')') || line.startsWith('}') || line.startsWith(']')) && i) {
      indent--;
      i--;
    }
    const result = `${'\t'.repeat(i)}${line}`;
    if (result.trim() === '') {
      return '';
    }
    return result;
  });
  return lines.join(EOL);
};

export const formatIndentation = (s: string): string => {
  let lines = s.split(EOL);
  lines = lines.map((line) => line.replace(/\t/g, '  '));
  // Make sure we have a blank line at the end
  const content = lines.join(EOL);
  return `${content}${EOL}`;
};
