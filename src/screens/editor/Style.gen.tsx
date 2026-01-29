/* TypeScript file generated from Style.res by genType. */

/* eslint-disable */
/* tslint:disable */

export type align = "Left" | "Center" | "Right";

export type fontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export type size = { readonly width: number; readonly height: number };

export type background = {
  readonly color: string; 
  readonly strokeColor: (undefined | string); 
  readonly strokeWidth: number; 
  readonly opacity: number; 
  readonly paddingX: number; 
  readonly paddingY: number; 
  readonly borderRadius: number
};

export type wordAnimationBackground = {
  readonly color: string; 
  readonly opacity: number; 
  readonly paddingX: number; 
  readonly paddingY: number; 
  readonly borderRadius: number
};

export type wordAnimationFont = { readonly color: (undefined | string); readonly fontWeight: (undefined | fontWeight) };

export type wordAnimationPop = { readonly scale: number };

export type wordAnimation = {
  readonly showBackground: boolean; 
  readonly background: wordAnimationBackground; 
  readonly showFont: boolean; 
  readonly font: wordAnimationFont; 
  readonly showPop: boolean; 
  readonly pop: wordAnimationPop
};

export type style = {
  readonly x: number; 
  readonly y: number; 
  readonly fontFamily: string; 
  readonly fontWeight: fontWeight; 
  readonly fontSizePx: number; 
  readonly color: string; 
  readonly strokeColor: (undefined | string); 
  readonly strokeWidth: number; 
  readonly align: align; 
  readonly blockSize: size; 
  readonly fontVariants: fontWeight[]; 
  readonly showBackground: boolean; 
  readonly background: background; 
  readonly showWordAnimation: boolean; 
  readonly wordAnimation: wordAnimation
};

export type changeStyleAction = 
    "ResetFontVariants"
  | "ToggleBackground"
  | "ToggleWordAnimation"
  | { TAG: "Resize"; _0: size }
  | { TAG: "SetAlign"; _0: align }
  | { TAG: "SetBackground"; _0: background }
  | { TAG: "SetBlockHeight"; _0: number }
  | { TAG: "SetBlockWidth"; _0: number }
  | { TAG: "SetColor"; _0: string }
  | { TAG: "SetFontFamily"; _0: string }
  | { TAG: "SetFontSizePx"; _0: number }
  | { TAG: "SetFontVariants"; _0: fontWeight[] }
  | { TAG: "SetFontWeight"; _0: fontWeight }
  | { TAG: "SetPosition"; _0: number; _1: number }
  | { TAG: "SetStrokeColor"; _0: string }
  | { TAG: "SetStrokeWidth"; _0: number }
  | { TAG: "SetWordAnimation"; _0: wordAnimation };

export type stylePreferences = {
  readonly fontFamily: string; 
  readonly fontWeight: fontWeight; 
  readonly fontSizePx: number; 
  readonly color: string; 
  readonly strokeColor: (undefined | string); 
  readonly strokeWidth: number; 
  readonly align: align; 
  readonly showBackground: boolean; 
  readonly background: background; 
  readonly showWordAnimation: boolean; 
  readonly wordAnimation: wordAnimation; 
  readonly x: (undefined | number); 
  readonly y: (undefined | number); 
  readonly videoWidth: (undefined | number); 
  readonly videoHeight: (undefined | number)
};
