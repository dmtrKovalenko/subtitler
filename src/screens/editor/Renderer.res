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

type size = {
  width: int,
  height: int,
}

type rendererState = {
  x: int,
  y: int,
  fontFamily: string,
  fontWeight: fontWeight,
  fontSizePx: int,
  color: string,
  strokeColor: option<string>,
  align: align,
  blockSize: size,
}

type rendererAction =
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

module RendererObservable: UseObservable.Observable
  with type t = rendererState
  and type action = rendererAction = {
  type t = rendererState
  type action = rendererAction

  let initial = {
    x: 0,
    y: 0,
    fontFamily: "Inter",
    fontWeight: Regular,
    fontSizePx: 44,
    color: "#ffffff",
    strokeColor: None,
    blockSize: {width: 200, height: 44},
    align: Center,
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
    }
}

module Observer = UseObservable.MakeObserver(RendererObservable)

@genType
let useStyle = Observer.useObservable
@genType
let dispatch = Observer.dispatch

@send
external drawVideoImage: (
  Webapi.Canvas.Canvas2d.t,
  ~imageData: Webapi.Dom.Element.t,
  ~dx: int=?,
  ~dy: int=?,
  ~dirtyWidth: int=?,
  ~dirtyHeight: int=?,
) => unit = "drawImage"

let renderVideoFrame = (videoMeta: Types.videoMeta, videoElement) => (
  ctx,
  ~dx=?,
  ~dy=?,
  ~dirtyWidth=?,
  ~dirtyHeight=?,
) => {
  drawVideoImage(
    ctx,
    ~imageData=videoElement,
    ~dx=dx->Option.getOr(0),
    ~dy=dy->Option.getOr(0),
    ~dirtyWidth=dirtyWidth->Option.getOr(videoMeta.width),
    ~dirtyHeight=dirtyHeight->Option.getOr(videoMeta.height),
  )
}
