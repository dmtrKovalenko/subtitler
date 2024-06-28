open Webapi
module DocumentEvent = Dom.EventTarget.Impl(Dom.Window)

@genType
type editorContext = {
  ctx: module(Types.Ctx),
  videoMeta: Types.videoMeta,
  dom: Types.dom,
  getImmediatePlayerState: unit => Player.state,
  usePlayer: unit => (Player.state, Player.action => unit),
}

let editorContext = React.createContext(None)
let providerElement = React.Context.provider(editorContext)

@genType
let useEditorContext = () => {
  let context = React.useContext(editorContext)

  switch context {
  | Some(context) => context
  | _ => failwith("Missing editorContext.")
  }
}

module MakeEditorContext = (Ctx: Types.Ctx) => {
  module PlayerObserver = Player.MakePlayer(Ctx)

  @react.component @genType
  let make = (~children) => {
    let usePlayer = () => {
      (PlayerObserver.useObservable(), PlayerObserver.dispatch)
    }

    let ctx = {
      ctx: module(Ctx),
      dom: Ctx.dom,
      videoMeta: Ctx.videoMeta,
      usePlayer,
      getImmediatePlayerState: PlayerObserver.get,
    }

    providerElement->React.createElement({
      value: Some(ctx),
      children,
    })
  }
}

module type ReactComponent = {
  @react.component
  let make: (~children: React.element) => React.element
}

@genType
let makeEditorContextComponent = (
  ~videoMeta: Types.videoMeta,
  ~videoElement: React.ref<Webapi.Dom.Element.t>,
  ~timelineVideoElement: React.ref<Webapi.Dom.Element.t>,
  ~subtitlesRef: React.ref<array<Subtitles.subtitleCue>>,
  ~canvasRef: React.ref<Js.nullable<Webapi.Dom.Element.t>>,
  ~audioBuffer: WebAudio.AudioBuffer.t,
): module(ReactComponent) => {
  module Ctx: Types.Ctx = {
    let dom: Types.dom = {
      videoElement: videoElement.current,
      timelineVideoElement: timelineVideoElement.current,
      canvasRef,
    }
    let videoMeta = videoMeta
    let subtitlesRef = subtitlesRef
    let audioBuffer = audioBuffer
  }

  module Context = MakeEditorContext(Ctx)

  module(
    {
      @react.component
      let make = (~children) => <Context> {children} </Context>
    }
  )
}
