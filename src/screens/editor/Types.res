@genType
type videoMeta = {
  width: int,
  height: int,
  duration: float,
}

@genType
type dom = {
  videoElement: Webapi.Dom.Element.t,
  timelineVideoElement: Webapi.Dom.Element.t,
  canvasRef: React.ref<Js.Nullable.t<Webapi.Dom.Element.t>>,
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
  let dom: dom
  let videoMeta: videoMeta
  let subtitlesRef: React.ref<array<Subtitles.subtitleCue>>
  let audioBuffer: WebAudio.AudioBuffer.t
}
