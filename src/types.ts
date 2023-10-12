import { Identifier, JSDoc, JSDocTag, Node, PropertySignature, SyntaxKind } from 'typescript';

import { SUPPORTED_JSDOC_TAG_NAMES } from './constants';

export type FileTuple = [string, string];

/**
 * Типы поддерживаемых файлов
 */
export enum TemplateFileTypes {
  ENUM_DECLARATION = 'enumDeclaration.hbs',
  TYPE_DECLARATION = 'typeDeclaration.hbs',
}

/**
 * Информация о свойствах типа/enum'а в SourceFile
 */
export type SourceFileInfo = Record<string, TemplateFileTypes> & {
  /**
   * Тип файла
   */
  _$fileType?: TemplateFileTypes;
  /**
   * Имя файла
   */
  _$fileName?: string;
};

/**
 * Определение типов для SourceFile
 */
export type Types = Record<string, TypeCacheRecord>;

/**
 * Нода свойства с определенным jsDoc'ом
 */
export interface NodeWithDocs extends PropertySignature {
  jsDoc: JSDoc[];
}

/**
 * Тип поддерживаемых JSDoc тэгов
 */
type SupportedJsDocTagName = (typeof SUPPORTED_JSDOC_TAG_NAMES)[number];

type TypeCacheRecord = {
  kind: SyntaxKind;
  aliasedTo: SyntaxKind;
  node: Node;
};

export interface SupportedJSDocTag extends JSDocTag {
  tagName: Identifier & { text: SupportedJsDocTagName };
}
