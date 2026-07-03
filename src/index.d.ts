import type { FrontierLangDocument } from '@shapeshift-labs/frontier-lang-kernel';
export interface ParseFrontierOptions { readonly id?: string; readonly name?: string; readonly sourcePath?: string; }
export declare const FrontierSourceBlockKinds: readonly string[];
export interface FrontierSourcePosition {
  readonly line: number;
  readonly column: number;
  readonly offset: number;
}
export interface FrontierSourceSpan {
  readonly sourceId?: string;
  readonly path?: string;
  readonly blockId?: string;
  readonly blockKind?: string;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly start: FrontierSourcePosition;
  readonly end: FrontierSourcePosition;
}
export interface FrontierSourceSyntaxDiagnostic {
  readonly reason: 'unterminated-block' | 'unmatched-close-brace';
  readonly message: string;
  readonly location: FrontierSourcePosition;
}
export interface FrontierSourceChildSyntaxRecord {
  readonly kind: 'conversionConstraint';
  readonly name: string;
  readonly id?: string;
  readonly family?: string;
  readonly role?: string;
  readonly header: string;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly location: FrontierSourcePosition;
  readonly parentKind?: string;
  readonly parentId?: string;
  readonly parentName?: string;
  readonly moduleId?: string;
  readonly moduleName?: string;
  readonly sourceSpan?: FrontierSourceSpan;
  readonly recognized: boolean;
}
export interface FrontierSourceBlockSyntaxRecord {
  readonly kind: string;
  readonly name: string;
  readonly id?: string;
  readonly header: string;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly bodyStartOffset: number;
  readonly bodyEndOffset: number;
  readonly location: FrontierSourcePosition;
  readonly moduleId?: string;
  readonly moduleName?: string;
  readonly recognized: boolean;
  readonly malformed?: boolean;
  readonly diagnostics?: readonly FrontierSourceSyntaxDiagnostic[];
  readonly children?: readonly FrontierSourceChildSyntaxRecord[];
}
export interface FrontierUnknownSourceBlockSyntaxRecord extends FrontierSourceBlockSyntaxRecord {
  readonly recognized: false;
  readonly reason: 'unsupported-top-level-block';
}
export interface FrontierSourceSyntaxReport {
  readonly kind: 'frontier.lang.sourceSyntaxReport';
  readonly version: 1;
  readonly documentId: string;
  readonly documentName: string;
  readonly blocks: readonly FrontierSourceBlockSyntaxRecord[];
  readonly recognizedBlocks: readonly FrontierSourceBlockSyntaxRecord[];
  readonly unknownBlocks: readonly FrontierUnknownSourceBlockSyntaxRecord[];
  readonly summary: {
    readonly blockCount: number;
    readonly recognizedBlockCount: number;
    readonly unknownBlockCount: number;
    readonly malformedBlockCount: number;
    readonly childCount: number;
    readonly recognizedChildCount: number;
    readonly diagnosticCount: number;
    readonly recognizedKinds: readonly string[];
    readonly recognizedChildKinds: readonly string[];
    readonly unknownKinds: readonly string[];
    readonly failClosed: boolean;
    readonly unsupportedSyntax: boolean;
  };
  readonly diagnostics: readonly FrontierSourceSyntaxDiagnostic[];
  readonly metadata: {
    readonly sourceBytes: number;
    readonly autoMergeClaim: false;
    readonly semanticEquivalenceClaim: false;
  };
}
export declare function inspectFrontierSourceSyntax(source: string, options?: ParseFrontierOptions): FrontierSourceSyntaxReport;
export declare function parseFrontierSource(source: string, options?: ParseFrontierOptions): FrontierLangDocument;
export declare function parseFrontierFile(name: string, source: string): FrontierLangDocument;
