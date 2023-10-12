import appRootPath from 'app-root-path';
import * as fs from 'fs';
import Handlebars from 'handlebars';
import { resolve } from 'path';
import { promisify } from 'util';

import { FileTuple, TemplateFileTypes } from '@root/types';

const asyncReadDir = promisify(fs.readdir);
const asyncReadFile = promisify(fs.readFile);

/**
 * Чтение списка файлов
 *
 * @param {string} dirname путь до директории с файлами
 * @param {string[]} fileNames список имен файлов
 */
export const readFiles = (dirname: string, fileNames: string[]) => {
  const filePromises = fileNames.map((file) => asyncReadFile(resolve(dirname, file)));

  return new Promise((resolve) => {
    Promise.all(filePromises).then((buffers) => {
      const contents: FileTuple[] = [];

      buffers.forEach((buffer, index) => contents.push([fileNames[index], buffer.toString()]));

      resolve(contents);
    });
  });
};

/**
 * Чтение всех файлов в директории
 *
 * @param {string} path путь до директории с файлами
 */
export async function readFilesFromDirectory(path: string): Promise<FileTuple[]> {
  const filesNames = (await asyncReadDir(path)) as string[];

  return (await readFiles(path, filesNames)) as FileTuple[];
}

/**
 * Получить handlebars шаблоны из файлов
 */
export const getTemplatesFromFiles = async () => {
  const source = await readFilesFromDirectory(appRootPath.resolve('./src/templates'));

  const templateFiles: Record<TemplateFileTypes, HandlebarsTemplateDelegate> = {} as Record<
    TemplateFileTypes,
    HandlebarsTemplateDelegate
  >;

  source.forEach(([name, fileBody]) => {
    templateFiles[name as TemplateFileTypes] = Handlebars.compile(fileBody);
  });

  return templateFiles;
};
