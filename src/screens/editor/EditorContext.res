open Webapi
module DocumentEvent = Dom.EventTarget.Impl(Dom.Window)

@genType
type editorContext = {
  ctx: module(Types.Ctx),
  videoMeta: Types.videoMeta,
  dom: Types.dom,
  getImmediatePlayerState: unit => Player.state,
  getImmediateStyleState: unit => Style.style,
  playerImmediateDispatch: Player.action => unit,
  usePlayer: unit => (Player.state, Player.action => unit),
  useStyle: unit => (Style.style, Style.changeStyleAction => unit),
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
  module StyleObserver = Style.MakeRendererObservable(Ctx)

  @react.component @genType
  let make = (~children) => {
    let usePlayer = () => {
      (PlayerObserver.useObservable(), PlayerObserver.dispatch)
    }

    let useStyle = () => {
      (StyleObserver.useObservable(), StyleObserver.dispatch)
    }

    let ctx = {
      ctx: module(Ctx),
      dom: Ctx.dom,
      videoMeta: Ctx.videoMeta,
      usePlayer,
      getImmediatePlayerState: PlayerObserver.get,
      playerImmediateDispatch: PlayerObserver.dispatch,
      useStyle,
      getImmediateStyleState: StyleObserver.get,
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
  ~audioBuffer: option<WebAudio.AudioBuffer.t>,
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
