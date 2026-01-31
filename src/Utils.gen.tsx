/* TypeScript file generated from Utils.res by genType. */

/* eslint-disable */
/* tslint:disable */

import * as UtilsJS from './Utils.res.mjs';

/** * Trims only dots and commas from the start and end of each word.
   * Preserves all other punctuation like ?, !, apostrophes, etc.
   * Example: "Hello, world..." -> "Hello world"
   * Example: "What's up?" -> "What's up?"
   * Example: "don't stop!" -> "don't stop!" */
export const TextUtils_stripPunctuation: (text:string) => string = UtilsJS.TextUtils.stripPunctuation as any;

export const TextUtils: { 
/** * Trims only dots and commas from the start and end of each word.
   * Preserves all other punctuation like ?, !, apostrophes, etc.
   * Example: "Hello, world..." -> "Hello world"
   * Example: "What's up?" -> "What's up?"
   * Example: "don't stop!" -> "don't stop!" */
stripPunctuation: (text:string) => string } = UtilsJS.TextUtils as any;
