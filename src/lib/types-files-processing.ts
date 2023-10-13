import ts from 'typescript';

import { FileTuple, SourceFileInfo, TemplateFileTypes, Types } from '@root/types';

import { getTemplatesFromFiles } from '@lib/utils/read-files';

import { aliasDeclarationProcessing } from './declaration-processing/alias-declaration-processing';
import { enumDeclarationProcessing } from './declaration-processing/enum-declaration-processing';
import { writeMocks } from './utils/write-mocks';

/**
 * Параметры хелпера для преобразования файлов типов в файлы-генераторы этих типов
 */
type TypesFilesProcessingParams = {
  /**
   * Список файлов
   */
  files: FileTuple[];
};

/**
 * Преобразовать файлы типов в файлы-генераторы этих типов
 */
export const typesFilesProcessing = async ({ files }: TypesFilesProcessingParams) => {
  const templates = await getTemplatesFromFiles();

  const sourcesFiles = files.map(([name, content]) =>
    ts.createSourceFile(name, content, ts.ScriptTarget.ES2015, true)
  );

  sourcesFiles.forEach((sourceFile) => {
    const sourceFileInfo: SourceFileInfo = {};

    // Собираем определения типов для конкретного файла
    const types = collectTypes(sourceFile);

    // Проходимся по всем определениям типов/энамов
    ts.forEachChild(sourceFile, (node) => {
      switch (node.kind) {
        // Если встретили в файле определения Enum'а
        case ts.SyntaxKind.EnumDeclaration: {
          const enumDeclaration = node as ts.EnumDeclaration;
          sourceFileInfo._$fileType = TemplateFileTypes.ENUM_DECLARATION;
          sourceFileInfo._$fileName = enumDeclaration?.name?.text;

          enumDeclarationProcessing({
            aliasName: enumDeclaration?.name?.text,
            node: enumDeclaration,
            sourceFile,
            types,
            accumulator: sourceFileInfo,
          });

          break;
        }

        // Если встретили в файле определения типа
        case ts.SyntaxKind.TypeAliasDeclaration: {
          const aliasDeclaration = node as ts.TypeAliasDeclaration;
          sourceFileInfo._$fileType = TemplateFileTypes.TYPE_DECLARATION;
          sourceFileInfo._$fileName = aliasDeclaration?.name?.text;

          aliasDeclarationProcessing({
            aliasName: aliasDeclaration?.name?.text,
            node: aliasDeclaration?.type,
            sourceFile,
            types,
            accumulator: sourceFileInfo,
          });

          break;
        }
        // TODO: В файле проходимся только по определению типа/энаму, этот момент ломает гибкость решения
        default:
          break;
      }
    });

    writeMocks({ sourceFileInfo, sourceFile, templates });
  });

  return null;
};

/**
 * Получить все ссылки на интерфейсы и типы из AST дерева
 *
 * @param {SourceFile} sourceFile AST дерево файла с типами
 */
const collectTypes = (sourceFile: ts.SourceFile) => {
  const types: Types = {};
  let modulePrefix = '';

  const processNode = (node?: ts.Node | ts.SourceFile) => {
    if (!node) {
      return;
    }

    const name = (node as ts.DeclarationStatement).name;
    const nodeName = name ? name.text : '';
    let aliasedTo: ts.SyntaxKind;

    // Обработать объявленные namespaces и modules
    if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
      modulePrefix = nodeName;

      processNode((node as ts.ModuleDeclaration)?.body);

      return;
    }

    if ((node as ts.TypeAliasDeclaration).type) {
      aliasedTo = (node as ts.TypeAliasDeclaration).type.kind;
    } else {
      aliasedTo = node.kind;
    }

    if (nodeName) {
      types[modulePrefix ? `${modulePrefix}.${nodeName}` : nodeName] = {
        kind: node.kind,
        aliasedTo,
        node,
      };
    }
    ts.forEachChild(node, processNode);
  };

  processNode(sourceFile);

  return types;
};
