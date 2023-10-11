import { SyntaxKind, Node, PropertySignature, JSDoc, Identifier, JSDocTag } from 'typescript';
export type FileTuple = [string, string];

type TypeCacheRecord = {
  kind: SyntaxKind;
  aliasedTo: SyntaxKind;
  node: Node;
};

export type Types = Record<string, TypeCacheRecord>;

export interface NodeWithDocs extends PropertySignature {
  jsDoc: JSDoc[];
}

export const SUPPORTED_JSDOC_TAGNAMES = ['mockType', 'mockRange'] as const;
type SupportedJsDocTagName = (typeof SUPPORTED_JSDOC_TAGNAMES)[number];

export interface SupportedJSDocTag extends JSDocTag {
  tagName: Identifier & { text: SupportedJsDocTagName };
}

declare global {
  interface MOCKS_GENERATOR {
    __MOCKS_GENERATOR_OPTIONS__: {
      files: FileTuple[];
    };
  }
}
