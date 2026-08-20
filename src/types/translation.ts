/**
 * tranz-video - Translation, Lexer, and Pedagogical Rendering Data Models
 */

export interface TranslationPair {
  src: string;
  pho: string;
  trans: string;
  vocab: string;
}

export type ParsedModelOutput =
  | { type: 'empty'; pairs: TranslationPair[]; raw: string }
  | { type: 'pairs'; pairs: TranslationPair[]; raw: string }
  | { type: 'raw'; pairs: TranslationPair[]; raw: string };
