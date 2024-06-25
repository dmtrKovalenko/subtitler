open Webapi
module DocumentEvent = Dom.EventTarget.Impl(Dom.Window)

@genType
type editorContext = {
  videoMeta: Types.videoMeta,
  canvasRef: React.ref<Js.nullable<Webapi.Dom.Element.t>>,
  getImmediatePlayerState: unit => Player.state,
  usePlayer: unit => (Player.state, Player.action => unit),
  seekUnsafe: (~ts: float, unit => unit) => unit,
  renderFrame: Types.renderVideoFrame,
}

let editorContext = React.createContext(None)
let providerElement = React.Context.provider(editorContext)

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

    React.useEffect0(() => {
      Ctx.canvasRef.current
      ->Js.Nullable.toOption
      ->Option.map(el => el->Webapi.Canvas.CanvasElement.getContext2d)
      ->Option.forEach(ctx => Ctx.renderVideoFrame(ctx))

      None
    })

    let ctx = {
      usePlayer,
      videoMeta: Ctx.videoMeta,
      canvasRef: Ctx.canvasRef,
      getImmediatePlayerState: PlayerObserver.get,
      seekUnsafe: (~ts, cb) => {
        Ctx.videoElement->Web.Video.setCurrentTime(ts)
        Ctx.videoElement->Web.Video.onSeeked(cb)
      },
      renderFrame: Ctx.renderVideoFrame,
    }

    React.createElement(
      providerElement,
      {
        value: Some(ctx),
        children,
      },
    )
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
  ~subtitlesRef: array<Types.subtitleCue>,
  ~canvasRef: React.ref<Js.nullable<Webapi.Dom.Element.t>>,
): module(ReactComponent) => {
  module Ctx: Types.Ctx = {
    let videoElement = videoElement.current
    let videoMeta = videoMeta
    let canvasRef = canvasRef
    let subtitlesRef = subtitlesRef
    let renderVideoFrame = Renderer.renderVideoFrame(videoMeta, videoElement)
  }

  module Context = MakeEditorContext(Ctx)

  module(
    {
      @react.component
      let make = (~children) => <Context> {children} </Context>
    }
  )
}
