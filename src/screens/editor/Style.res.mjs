// Generated by ReScript, PLEASE EDIT WITH CARE

import * as Core__Option from "@rescript/core/src/Core__Option.res.mjs";
import * as UseObservable from "../../hooks/useObservable.res.mjs";

var all_font_weights = [
  100,
  200,
  300,
  400,
  500,
  600,
  700,
  800,
  900
];

var defaultBackground = {
  color: "#000000",
  strokeColor: undefined,
  strokeWidth: 1,
  opacity: 0.5,
  paddingX: 16,
  paddingY: 16,
  borderRadius: 32
};

function MakeRendererObservable(Ctx) {
  var width = Ctx.videoMeta.width > Ctx.videoMeta.height ? Ctx.videoMeta.width / 4 | 0 : ((Ctx.videoMeta.width / 3 | 0) << 1);
  var center = (Ctx.videoMeta.width / 2 | 0) - (width / 2 | 0) | 0;
  var fontSizePx = Ctx.videoMeta.height / 30 | 0;
  var initial_y = Ctx.videoMeta.width > Ctx.videoMeta.height ? Ctx.videoMeta.height - (Ctx.videoMeta.height / 6 | 0) | 0 : Ctx.videoMeta.height / 7 | 0;
  var initial_blockSize = {
    width: width,
    height: fontSizePx
  };
  var initial = {
    x: center,
    y: initial_y,
    fontFamily: "Inter",
    fontWeight: 400,
    fontSizePx: fontSizePx,
    color: "#ffffff",
    strokeColor: undefined,
    strokeWidth: 1,
    align: "Center",
    blockSize: initial_blockSize,
    fontVariants: all_font_weights,
    showBackground: false,
    background: defaultBackground
  };
  var reducer = function (state, action) {
    if (typeof action !== "object") {
      if (action === "ResetFontVariants") {
        return {
                x: state.x,
                y: state.y,
                fontFamily: state.fontFamily,
                fontWeight: state.fontWeight,
                fontSizePx: state.fontSizePx,
                color: state.color,
                strokeColor: state.strokeColor,
                strokeWidth: state.strokeWidth,
                align: state.align,
                blockSize: state.blockSize,
                fontVariants: all_font_weights,
                showBackground: state.showBackground,
                background: state.background
              };
      } else {
        return {
                x: state.x,
                y: state.y,
                fontFamily: state.fontFamily,
                fontWeight: state.fontWeight,
                fontSizePx: state.fontSizePx,
                color: state.color,
                strokeColor: state.strokeColor,
                strokeWidth: state.strokeWidth,
                align: state.align,
                blockSize: state.blockSize,
                fontVariants: state.fontVariants,
                showBackground: !state.showBackground,
                background: state.background
              };
      }
    }
    switch (action.TAG) {
      case "Resize" :
          return {
                  x: state.x,
                  y: state.y,
                  fontFamily: state.fontFamily,
                  fontWeight: state.fontWeight,
                  fontSizePx: state.fontSizePx,
                  color: state.color,
                  strokeColor: state.strokeColor,
                  strokeWidth: state.strokeWidth,
                  align: state.align,
                  blockSize: action._0,
                  fontVariants: state.fontVariants,
                  showBackground: state.showBackground,
                  background: state.background
                };
      case "SetAlign" :
          return {
                  x: state.x,
                  y: state.y,
                  fontFamily: state.fontFamily,
                  fontWeight: state.fontWeight,
                  fontSizePx: state.fontSizePx,
                  color: state.color,
                  strokeColor: state.strokeColor,
                  strokeWidth: state.strokeWidth,
                  align: action._0,
                  blockSize: state.blockSize,
                  fontVariants: state.fontVariants,
                  showBackground: state.showBackground,
                  background: state.background
                };
      case "SetBackground" :
          return {
                  x: state.x,
                  y: state.y,
                  fontFamily: state.fontFamily,
                  fontWeight: state.fontWeight,
                  fontSizePx: state.fontSizePx,
                  color: state.color,
                  strokeColor: state.strokeColor,
                  strokeWidth: state.strokeWidth,
                  align: state.align,
                  blockSize: state.blockSize,
                  fontVariants: state.fontVariants,
                  showBackground: state.showBackground,
                  background: action._0
                };
      case "SetBlockHeight" :
          return {
                  x: state.x,
                  y: state.y,
                  fontFamily: state.fontFamily,
                  fontWeight: state.fontWeight,
                  fontSizePx: state.fontSizePx,
                  color: state.color,
                  strokeColor: state.strokeColor,
                  strokeWidth: state.strokeWidth,
                  align: state.align,
                  blockSize: {
                    width: state.blockSize.width,
                    height: action._0
                  },
                  fontVariants: state.fontVariants,
                  showBackground: state.showBackground,
                  background: state.background
                };
      case "SetBlockWidth" :
          return {
                  x: state.x,
                  y: state.y,
                  fontFamily: state.fontFamily,
                  fontWeight: state.fontWeight,
                  fontSizePx: state.fontSizePx,
                  color: state.color,
                  strokeColor: state.strokeColor,
                  strokeWidth: state.strokeWidth,
                  align: state.align,
                  blockSize: {
                    width: action._0,
                    height: state.blockSize.height
                  },
                  fontVariants: state.fontVariants,
                  showBackground: state.showBackground,
                  background: state.background
                };
      case "SetColor" :
          return {
                  x: state.x,
                  y: state.y,
                  fontFamily: state.fontFamily,
                  fontWeight: state.fontWeight,
                  fontSizePx: state.fontSizePx,
                  color: action._0,
                  strokeColor: state.strokeColor,
                  strokeWidth: state.strokeWidth,
                  align: state.align,
                  blockSize: state.blockSize,
                  fontVariants: state.fontVariants,
                  showBackground: state.showBackground,
                  background: state.background
                };
      case "SetFontFamily" :
          return {
                  x: state.x,
                  y: state.y,
                  fontFamily: action._0,
                  fontWeight: state.fontWeight,
                  fontSizePx: state.fontSizePx,
                  color: state.color,
                  strokeColor: state.strokeColor,
                  strokeWidth: state.strokeWidth,
                  align: state.align,
                  blockSize: state.blockSize,
                  fontVariants: state.fontVariants,
                  showBackground: state.showBackground,
                  background: state.background
                };
      case "SetFontSizePx" :
          return {
                  x: state.x,
                  y: state.y,
                  fontFamily: state.fontFamily,
                  fontWeight: state.fontWeight,
                  fontSizePx: action._0,
                  color: state.color,
                  strokeColor: state.strokeColor,
                  strokeWidth: state.strokeWidth,
                  align: state.align,
                  blockSize: state.blockSize,
                  fontVariants: state.fontVariants,
                  showBackground: state.showBackground,
                  background: state.background
                };
      case "SetFontVariants" :
          var variants = action._0;
          if (variants.includes(state.fontWeight)) {
            return {
                    x: state.x,
                    y: state.y,
                    fontFamily: state.fontFamily,
                    fontWeight: state.fontWeight,
                    fontSizePx: state.fontSizePx,
                    color: state.color,
                    strokeColor: state.strokeColor,
                    strokeWidth: state.strokeWidth,
                    align: state.align,
                    blockSize: state.blockSize,
                    fontVariants: variants,
                    showBackground: state.showBackground,
                    background: state.background
                  };
          } else {
            return {
                    x: state.x,
                    y: state.y,
                    fontFamily: state.fontFamily,
                    fontWeight: variants.includes(400) ? 400 : Core__Option.getOr(variants[0], 400),
                    fontSizePx: state.fontSizePx,
                    color: state.color,
                    strokeColor: state.strokeColor,
                    strokeWidth: state.strokeWidth,
                    align: state.align,
                    blockSize: state.blockSize,
                    fontVariants: variants,
                    showBackground: state.showBackground,
                    background: state.background
                  };
          }
      case "SetFontWeight" :
          return {
                  x: state.x,
                  y: state.y,
                  fontFamily: state.fontFamily,
                  fontWeight: action._0,
                  fontSizePx: state.fontSizePx,
                  color: state.color,
                  strokeColor: state.strokeColor,
                  strokeWidth: state.strokeWidth,
                  align: state.align,
                  blockSize: state.blockSize,
                  fontVariants: state.fontVariants,
                  showBackground: state.showBackground,
                  background: state.background
                };
      case "SetPosition" :
          return {
                  x: action._0,
                  y: action._1,
                  fontFamily: state.fontFamily,
                  fontWeight: state.fontWeight,
                  fontSizePx: state.fontSizePx,
                  color: state.color,
                  strokeColor: state.strokeColor,
                  strokeWidth: state.strokeWidth,
                  align: state.align,
                  blockSize: state.blockSize,
                  fontVariants: state.fontVariants,
                  showBackground: state.showBackground,
                  background: state.background
                };
      case "SetStrokeColor" :
          return {
                  x: state.x,
                  y: state.y,
                  fontFamily: state.fontFamily,
                  fontWeight: state.fontWeight,
                  fontSizePx: state.fontSizePx,
                  color: state.color,
                  strokeColor: action._0,
                  strokeWidth: state.strokeWidth,
                  align: state.align,
                  blockSize: state.blockSize,
                  fontVariants: state.fontVariants,
                  showBackground: state.showBackground,
                  background: state.background
                };
      case "SetStrokeWidth" :
          return {
                  x: state.x,
                  y: state.y,
                  fontFamily: state.fontFamily,
                  fontWeight: state.fontWeight,
                  fontSizePx: state.fontSizePx,
                  color: state.color,
                  strokeColor: state.strokeColor,
                  strokeWidth: action._0,
                  align: state.align,
                  blockSize: state.blockSize,
                  fontVariants: state.fontVariants,
                  showBackground: state.showBackground,
                  background: state.background
                };
      
    }
  };
  return UseObservable.MakeObserver({
              initial: initial,
              reducer: reducer
            });
}

export {
  all_font_weights ,
  defaultBackground ,
  MakeRendererObservable ,
}
/* UseObservable Not a pure module */
