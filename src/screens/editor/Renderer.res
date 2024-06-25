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

type rendererState = {
  x: int,
  y: int,
  fontFamily: string,
  fontWeight: fontWeight,
  fontSizePx: int,
  color: string,
  strokeColor: string,
  strokeWidth: int,
  blockWidth: int,
  blockHeight: int,
  align: align,
}

type rendererAction =
  | SetX(int)
  | SetY(int)
  | SetFontFamily(string)
  | SetFontWeight(fontWeight)
  | SetFontSizePx(int)
  | SetColor(string)
  | SetStrokeColor(string)
  | SetStrokeWidth(int)
  | SetBlockWidth(int)
  | SetBlockHeight(int)
  | SetAlign(align)

module Observer: UseObservable.Observable
  with type t = rendererState
  and type action = rendererAction = {
  type t = rendererState
  type action = rendererAction

  let initial = {
    x: 0,
    y: 0,
    fontFamily: "Arial",
    fontWeight: Regular,
    fontSizePx: 16,
    color: "#fff",
    strokeColor: "black",
    strokeWidth: 0,
    blockWidth: 0,
    blockHeight: 0,
    align: Center,
  }

  let reducer = (state, action) =>
    switch action {
    | SetX(x) => {...state, x}
    | SetY(y) => {...state, y}
    | SetFontFamily(fontFamily) => {...state, fontFamily}
    | SetFontWeight(fontWeight) => {...state, fontWeight}
    | SetFontSizePx(fontSizePx) => {...state, fontSizePx}
    | SetColor(color) => {...state, color}
    | SetStrokeColor(strokeColor) => {...state, strokeColor}
    | SetStrokeWidth(strokeWidth) => {...state, strokeWidth}
    | SetBlockWidth(blockWidth) => {...state, blockWidth}
    | SetBlockHeight(blockHeight) => {...state, blockHeight}
    | SetAlign(align) => {...state, align}
    }
}

include UseObservable.MakeObserver(Observer)

@send
external drawVideoImage: (
  Webapi.Canvas.Canvas2d.t,
  ~imageData: Webapi.Dom.Element.t,
  ~dx: int=?,
  ~dy: int=?,
  ~dirtyWidth: int=?,
  ~dirtyHeight: int=?,
) => unit = "drawImage"

let renderVideoFrame = (videoMeta, videoElement) => (
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
