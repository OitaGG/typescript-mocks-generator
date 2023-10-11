require('module-alias/register')

import { readFilesFromDirectory } from '@lib/read-files';
import { typesFilesProcessing } from '@lib/types-files-processing';
import { Command } from 'commander';


const program = new Command();

/**
 * Опции генерации моков
 */
export type GenerateOptions = {
  /**
   * Путь до папки с typescript-типами
   */
  inputPath: string;
  /**
   * Путь до папки с выходными данными-генераторами
   */
  outputPath: string;
  /**
   * Имя аннотации моковых-типов в typescript-типах
   */
  annotationName?: string;
};

program
  .version('1.0.0')
  .description('An example CLI for managing a directory')
  .requiredOption('-i, --input  <value>', 'Директория с типами (входная)')
  .requiredOption('-o, --output  <value>', 'Директория с моками (выходная)')
  .parse(process.argv);

const options = program.opts();

/**
 * Функция генерации моков
 *
 * @param {GenerateOptions} options опции генерации моков
 */
export const mocksGenerator = async (options: GenerateOptions) => {
  return readFilesFromDirectory(options.inputPath).then((files) => {
    // @ts-ignore
    global.__MOCKS_GENERATOR_OPTIONS__ = {
      files,
      inputPath: options.inputPath,
      outputPath: options.outputPath,
    };

    typesFilesProcessing({ files });
  });
};

mocksGenerator({ inputPath: options.input, outputPath: options.output });
