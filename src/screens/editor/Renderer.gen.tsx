/* TypeScript file generated from Renderer.res by genType. */

/* eslint-disable */
/* tslint:disable */

import * as RendererJS from './Renderer.res.mjs';

export type align = "Left" | "Center" | "Right";

export type fontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export type size = { readonly width: number; readonly height: number };

export type rendererState = {
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

export type rendererAction = 
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

export type RendererObservable_t = rendererState;

export type RendererObservable_action = rendererAction;

export const useStyle: () => RendererObservable_t = RendererJS.useStyle as any;

export const dispatch: (_1:RendererObservable_action) => void = RendererJS.dispatch as any;
