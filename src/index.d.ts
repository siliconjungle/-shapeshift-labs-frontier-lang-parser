import type { FrontierLangDocument } from '@shapeshift-labs/frontier-lang-kernel';
export interface ParseFrontierOptions { readonly id?: string; readonly name?: string; }
export declare function parseFrontierSource(source: string, options?: ParseFrontierOptions): FrontierLangDocument;
export declare function parseFrontierFile(name: string, source: string): FrontierLangDocument;
