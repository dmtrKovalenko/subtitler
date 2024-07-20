open Types

type align = Left | Center | Right

type fontWeight =
  | @as(100) Thin
  | @as(200) ExtraLight
  | @as(300) Light
  | @as(400) Regular
  | @as(500) Medium
  | @as(600) SemiBold
  | @as(700) Bold
  | @as(800) ExtraBold
  | @as(900) Black

let all_font_weights = [Thin, ExtraLight, Light, Regular, Medium, SemiBold, Bold, ExtraBold, Black]

type size = {
  width: int,
  height: int,
}

@genType
type style = {
  x: int,
  y: int,
  fontFamily: string,
  fontWeight: fontWeight,
  fontSizePx: int,
  color: string,
  strokeColor: option<string>,
  align: align,
  blockSize: size,
  fontVariants: array<fontWeight>,
}

@genType
type changeStyleAction =
  | SetPosition(int, int)
  | SetFontFamily(string)
  | SetFontWeight(fontWeight)
  | SetFontSizePx(int)
  | SetColor(string)
  | SetStrokeColor(string)
  | SetBlockWidth(int)
  | SetBlockHeight(int)
  | SetAlign(align)
  | Resize(size)
  | SetFontVariants(array<fontWeight>)
  | ResetFontVariants

module type StyleObservable = UseObservable.Observable
  with type t = style
  and type action = changeStyleAction

module MakeRendererObservable = (Ctx: Ctx) => UseObservable.MakeObserver({
  type t = style
  type action = changeStyleAction

  let width = if Ctx.videoMeta.width > Ctx.videoMeta.height {
    Ctx.videoMeta.width / 4
  } else {
    Ctx.videoMeta.width / 3 * 2
  }

  let center = Ctx.videoMeta.width / 2 - width / 2
  let fontSizePx = Ctx.videoMeta.height / 30

  let initial = {
    x: center,
    y: if Ctx.videoMeta.width > Ctx.videoMeta.height {
      Ctx.videoMeta.height - Ctx.videoMeta.height / 6
    } else {
      Ctx.videoMeta.height / 7
    },
    fontFamily: "Inter",
    fontWeight: Regular,
    fontSizePx,
    color: "#ffffff",
    strokeColor: None,
    blockSize: {width, height: fontSizePx},
    align: Center,
    fontVariants: all_font_weights,
  }

  let reducer = (state, action) =>
    switch action {
    | SetPosition(x, y) => {...state, x, y}
    | SetFontFamily(fontFamily) => {...state, fontFamily}
    | SetFontWeight(fontWeight) => {...state, fontWeight}
    | SetFontSizePx(fontSizePx) => {...state, fontSizePx}
    | SetColor(color) => {...state, color}
    | SetStrokeColor(strokeColor) => {...state, strokeColor: Some(strokeColor)}
    | SetBlockWidth(blockWidth) => {
        ...state,
        blockSize: {width: blockWidth, height: state.blockSize.height},
      }
    | SetBlockHeight(blockHeight) => {
        ...state,
        blockSize: {width: state.blockSize.width, height: blockHeight},
      }
    | SetAlign(align) => {...state, align}
    | Resize(size) => {...state, blockSize: size}
    | SetFontVariants(variants) if !Array.includes(variants, state.fontWeight) => {
        ...state,
        fontWeight: Array.includes(variants, Regular)
          ? Regular
          : variants[0]->Option.getOr(Regular),
        fontVariants: variants,
      }
    | SetFontVariants(fontVariants) => {...state, fontVariants}
    | ResetFontVariants => {...state, fontVariants: all_font_weights}
    }
})
