/* TypeScript file generated from Style.res by genType. */

/* eslint-disable */
/* tslint:disable */

export type align = "Left" | "Center" | "Right";

export type fontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export type size = { readonly width: number; readonly height: number };

export type style = {
  readonly x: number; 
  readonly y: number; 
  readonly fontFamily: string; 
  readonly fontWeight: fontWeight; 
  readonly fontSizePx: number; 
  readonly color: string; 
  readonly strokeColor: (undefined | string); 
  readonly align: align; 
  readonly blockSize: size
};

export type changeStyleAction = 
    { TAG: "SetPosition"; _0: number; _1: number }
  | { TAG: "SetFontFamily"; _0: string }
  | { TAG: "SetFontWeight"; _0: fontWeight }
  | { TAG: "SetFontSizePx"; _0: number }
  | { TAG: "SetColor"; _0: string }
  | { TAG: "SetStrokeColor"; _0: string }
  | { TAG: "SetBlockWidth"; _0: number }
  | { TAG: "SetBlockHeight"; _0: number }
  | { TAG: "SetAlign"; _0: align }
  | { TAG: "Resize"; _0: size };
