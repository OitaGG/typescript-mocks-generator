import { basename } from 'path';
import ts from 'typescript';

import { removeFileExtensionFromPath } from '@lib/utils/string-helpers';

/**
 * Информация об импорте
 */
type ImportInfo = {
  /**
   * Наименование импортированной сущности
   */
  aliasName: string;
  /**
   * Путь до файла
   */
  path: string;
};

/**
 * Собрать все импорты для файла
 * @param {ts.SourceFile} sourceFile файл
 */
export const collectImports = (sourceFile: ts.SourceFile) => {
  const imports: ImportInfo[] = [];

  function visitNode(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const namedBindings = node.importClause?.namedBindings;
      if (namedBindings) {
        if (ts.isNamedImports(namedBindings)) {
          for (const importSpecifier of namedBindings.elements) {
            imports.push({
              aliasName: importSpecifier.name.text,
              path: removeFileExtensionFromPath(`./${basename(importSpecifier.name.text)}`),
            });
          }
        } else if (ts.isNamespaceImport(namedBindings)) {
          imports.push({
            aliasName: namedBindings.name.text,
            path: removeFileExtensionFromPath(`./${basename(namedBindings.name.text)}`),
          });
        }
      }
    }
    ts.forEachChild(node, visitNode);
  }

  visitNode(sourceFile);

  return imports;
};
