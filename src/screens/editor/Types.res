@genType
type videoMeta = {
  width: int,
  height: int,
  duration: float,
}

type style = {
  fontFamily: string,
  fontSizePx: int,
  color: string,
  strokeColor: string,
  strokeWidth: int,
}

type renderVideoFrame = (
  Webapi.Canvas.Canvas2d.t,
  ~dx: int=?,
  ~dy: int=?,
  ~dirtyWidth: int=?,
  ~dirtyHeight: int=?,
) => unit

@genType
module type Ctx = {
  let videoElement: Webapi.Dom.Element.t
  let videoMeta: videoMeta
  let canvasRef: React.ref<Js.nullable<Webapi.Dom.Element.t>>
  let subtitlesRef: array<Subtitles.subtitleCue>

  let renderVideoFrame: renderVideoFrame
}
