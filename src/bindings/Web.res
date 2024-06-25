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

  let isFocusable = el =>
    switch el->Webapi.Dom.Element.tagName {
    | "TEXTAREA" | "SELECT" | "INPUT" | "BUTTON" | "A" => true
    | _ =>
      switch el->Webapi.Dom.Element.getAttribute("role") {
      | Some("slider") | Some("input") | Some("button") | Some("checkbox") | Some("link") => true
      | _ => false
      }
    }
}

module Video = {
  type t = Webapi.Dom.Element.t

  @send external play: t => unit = "play"
  @send external pause: t => unit = "pause"
  @get external currentTime: t => float = "currentTime"
  @get external paused: t => bool = "paused"
  @set external setCurrentTime: (t, float) => unit = "currentTime"
  @send external setVolume: (t, float) => unit = "volume"
  @send external setPlaybackRate: (t, float) => unit = "playbackRate"

  let onSeeked = (video, cb) => {
    video
    ->Webapi.Dom.Element.asEventTarget
    ->Webapi.Dom.EventTarget.addEventListener("seeked", _ => cb())
  }
}
