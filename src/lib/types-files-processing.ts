import ts from 'typescript';

import { FileTuple, Types } from '../types';
import { aliasDeclarationProcessing } from './declaration-processing/alias-declaration-processing';
import { enumDeclarationProcessing } from './declaration-processing/enum-declaration-processing';
import { writeMocks } from './write-mocks';

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
export const typesFilesProcessing = ({ files }: TypesFilesProcessingParams) => {
  const sourcesFiles = files.map(([name, content]) =>
    ts.createSourceFile(name, content, ts.ScriptTarget.ES2015, true)
  );

  sourcesFiles.forEach((sourceFile) => {
    const sourceFileInfo: Record<string, unknown> = {};

    // Собираем определения типов для конкретного файла
    const types = collectTypes(sourceFile);

    // Проходимся по всем определениям типов
    ts.forEachChild(sourceFile, (node) => {
      if (node.kind === ts.SyntaxKind.EnumDeclaration) {
        const enumDeclaration = node as ts.EnumDeclaration;

        enumDeclarationProcessing({
          aliasName: enumDeclaration?.name?.text,
          node: enumDeclaration,
          sourceFile,
          types,
          accumulator: sourceFileInfo,
        });
      }

      // TODO: В файле проходимся только по определению типа, этот момент ломает гибкость решения, когда в файле к примеру могут быть type и enum
      if (node.kind !== ts.SyntaxKind.TypeAliasDeclaration) {
        return;
      }

      const aliasDeclaration = node as ts.TypeAliasDeclaration;

      aliasDeclarationProcessing({
        aliasName: aliasDeclaration?.name?.text,
        node: aliasDeclaration?.type,
        sourceFile,
        types,
        accumulator: sourceFileInfo,
      });
    });

    writeMocks({ sourceFileInfo, sourceFile });
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
