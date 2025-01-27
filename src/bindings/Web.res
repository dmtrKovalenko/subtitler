module Window = {
  @val @scope("window") external devicePixelRatio: float = "devicePixelRatio"
}

module Document = {
  @send external hasFocus: Webapi.Dom.Document.t => bool = "hasFocus"
}

module Element = {
  @get external style: Webapi.Dom.Element.t => {..} = "style"
  @get external firstChild: Webapi.Dom.Element.t => option<Webapi.Dom.Element.t> = "children[0]"

  let targetAsElement = %raw(`_ => _`)
}

@genType
let isFocusable = el =>
  switch el->Webapi.Dom.Element.tagName {
  | "TEXTAREA" | "SELECT" | "INPUT" | "BUTTON" | "A" => true
  | _ =>
    switch el->Webapi.Dom.Element.getAttribute("role") {
    | Some("slider")
    | Some("option")
    | Some("input")
    | Some("button")
    | Some("checkbox")
    | Some("link") => true
    | _ => false
    }
  }

let isFocusingInteractiveElement = () =>
  Webapi.Dom.document
  ->Webapi.Dom.Document.activeElement
  ->Option.map(isFocusable)
  ->Option.getOr(false)

module Video = {
  type t = Webapi.Dom.Element.t

  type readyState =
    | @as(0) HaveNothing
    | @as(1) HaveMetadata
    | @as(2) HaveCurrentData
    | @as(3) HaveFutureData
    | @as(4) HaveEnoughData

  @send external play: t => unit = "play"
  @send external pause: t => unit = "pause"
  @get external currentTime: t => float = "currentTime"
  @get external paused: t => bool = "paused"
  @set external setCurrentTime: (t, float) => unit = "currentTime"
  @set external setVolume: (t, float) => unit = "volume"
  @send external setPlaybackRate: (t, float) => unit = "playbackRate"
  @get external readyState: t => int = "readyState"

  @send
  external drawOnCanvas: (
    Webapi.Canvas.Canvas2d.t,
    t,
    ~dx: int=?,
    ~dy: int=?,
    ~dirtyWidth: int=?,
    ~dirtyHeight: int=?,
  ) => unit = "drawImage"

  let onSeeked = (video, cb) => {
    video
    ->Webapi.Dom.Element.asEventTarget
    ->Webapi.Dom.EventTarget.addEventListener("seeked", _ => cb())
  }

  let onSeekedOnce = (video, cb) => {
    video
    ->Webapi.Dom.Element.asEventTarget
    ->Webapi.Dom.EventTarget.addEventListenerWithOptions(
      "seeked",
      _ => cb(),
      {"passive": true, "once": true, "capture": false},
    )
  }

  let onLoadedData = (video, cb) => {
    video
    ->Webapi.Dom.Element.asEventTarget
    ->Webapi.Dom.EventTarget.addEventListener("loadeddata", _ => cb())
  }

  let onLoadedDataOnce = (video, cb) => {
    video
    ->Webapi.Dom.Element.asEventTarget
    ->Webapi.Dom.EventTarget.addEventListenerWithOptions(
      "loadeddata",
      _ => cb(),
      {"passive": true, "once": true, "capture": false},
    )
  }
}
