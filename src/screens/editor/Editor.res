open Types
open Hooks
open ChunksList

@genType
let a = Js.Dict.empty

Js.Console.log("Happy subtitles making experience!")

let useIsMobile = () => {
  let (isMobile, setIsMobile) = React.useState(() =>
    Webapi.Dom.window->Webapi.Dom.Window.innerWidth < 768
  )

  React.useEffect0(() => {
    let handleResize = _ => {
      setIsMobile(_ => Webapi.Dom.window->Webapi.Dom.Window.innerWidth < 768)
    }
    Webapi.Dom.window->Webapi.Dom.Window.addEventListener("resize", handleResize)
    Some(() => Webapi.Dom.window->Webapi.Dom.Window.removeEventListener("resize", handleResize))
  })

  isMobile
}

let calcMobilePreviewScale = (videoWidth, videoHeight) => {
  let vw = Webapi.Dom.window->Webapi.Dom.Window.innerWidth->Int.toFloat -. 24.0
  let vh = Webapi.Dom.window->Webapi.Dom.Window.innerHeight->Int.toFloat *. 0.45
  Js.Math.min_float(vw /. videoWidth, vh /. videoHeight)
}

module MobileSeekSlider = {
  @react.component
  let make = (~duration: float) => {
    let ctx = EditorContext.useEditorContext()
    let (player, playerDispatch) = ctx.usePlayer()
    let handleSeek = Hooks.useEvent(value => playerDispatch(Player.Seek(value->Int.toFloat)))

    <div className="w-full px-4 py-2">
      <Slider
        disabled=false
        min=0
        max={duration->Float.toInt}
        step=1
        value={player.ts->Float.toInt}
        onValueChange=handleSeek
      />
      <div className="flex justify-between text-xs text-zinc-400 mt-1">
        <span> {player.ts->Utils.Duration.formatSeconds->React.string} </span>
        <span> {duration->Utils.Duration.formatSeconds->React.string} </span>
      </div>
    </div>
  }
}

module MobileCanvasStyle = {
  let make = (~width, ~height, ~scale) =>
    ReactDOMStyle.make(
      ~width=`${width->Int.toString}px`,
      ~height=`${height->Int.toString}px`,
      ~transform=`scale(${scale->Js.Float.toString})`,
      ~transformOrigin="top left",
      (),
    )
}

@genType.as("Editor") @react.component
let make = React.memo((
  ~subtitlesManager,
  ~render,
  ~rendererPreviewCanvasRef,
  ~renderCanvasKey,
  ~videoFileName,
  ~onResetPlayerState,
) => {
  let (isFullScreen, fullScreenToggler) = Hooks.useToggle(false)
  let ctx = EditorContext.useEditorContext()
  let layout = useEditorLayout(~isFullScreen)
  let isMobile = useIsMobile()

  let videoWidth = ctx.videoMeta.width->Int.toFloat
  let videoHeight = ctx.videoMeta.height->Int.toFloat

  React.useEffect0(() => {
    onResetPlayerState(() => ctx.playerImmediateDispatch(AbortRender))
    None
  })

  let transcriptionInProgress = subtitlesManager.transcriptionState == TranscriptionInProgress

  let subtitlesTitle = if transcriptionInProgress {
    <div className="gap-2 inline-flex items-center">
      <Spinner />
      <span> {"Transcribing"->React.string} </span>
    </div>
  } else {
    "Subtitles"->React.string
  }

  let lastIsTranscriptionInProgress = React.useRef(transcriptionInProgress)
  React.useLayoutEffect1(() => {
    if !transcriptionInProgress && lastIsTranscriptionInProgress.current {
      lastIsTranscriptionInProgress.current = true
      ctx.playerImmediateDispatch(UpdateCurrentCue)
    }
    None
  }, [subtitlesManager.transcriptionState])

  let styleTitle = React.string("Style")
  let previewTitle = React.string("Preview")

  let (mobileScale, setMobileScale) = React.useState(() =>
    calcMobilePreviewScale(videoWidth, videoHeight)
  )

  React.useEffect0(() => {
    let onResize = _ => setMobileScale(_ => calcMobilePreviewScale(videoWidth, videoHeight))
    Webapi.Dom.window->Webapi.Dom.Window.addEventListener("resize", onResize)
    Some(() => Webapi.Dom.window->Webapi.Dom.Window.removeEventListener("resize", onResize))
  })

  let mobileCanvasStyle = MobileCanvasStyle.make(
    ~width=ctx.videoMeta.width,
    ~height=ctx.videoMeta.height,
    ~scale=mobileScale,
  )

  let mobilePreviewContent =
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div
          className="relative shrink-0"
          style={ReactDOMStyle.make(
            ~width=`${(videoWidth *. mobileScale)->Js.Float.toString}px`,
            ~height=`${(videoHeight *. mobileScale)->Js.Float.toString}px`,
            (),
          )}>
          <canvas
            id="editor-preview"
            ref={ReactDOM.Ref.domRef(ctx.dom.canvasRef)}
            width={ctx.videoMeta.width->Int.toString}
            height={ctx.videoMeta.height->Int.toString}
            style=mobileCanvasStyle
            className="bg-black absolute inset-0"
          />
          <canvas
            key={renderCanvasKey->Int.toString}
            ref={ReactDOM.Ref.domRef(rendererPreviewCanvasRef)}
            width={ctx.videoMeta.width->Int.toString}
            height={ctx.videoMeta.height->Int.toString}
            style=mobileCanvasStyle
            className="absolute inset-0"
          />
          <EditorCanvas
            transcriptionInProgress
            subtitles=subtitlesManager.activeSubtitles
            subtitlesManager
            width=ctx.videoMeta.width
            height=ctx.videoMeta.height
            style=mobileCanvasStyle
            className="absolute inset-0"
          />
        </div>
      </div>
      <div className="shrink-0 bg-zinc-900/80 backdrop-blur-sm rounded-lg mx-3 mb-2 p-1">
        <MobileSeekSlider duration={ctx.videoMeta.duration} />
      </div>
    </div>

  if isMobile {
    <div
      id="fframes-editor"
      className="w-screen h-dvh bg-zinc-950 flex flex-col fixed inset-0 overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">
        <Tabs
          defaultIndex=0
          className="outline-none"
          tabs=[
            {
              id: "subtitles",
              name: subtitlesTitle,
              content: <div className="px-3 py-2">
                <ChunksList subtitlesManager title={React.null} />
              </div>,
            },
            {
              id: "style",
              name: styleTitle,
              content: <div className="px-3 py-2">
                <StyleEditor />
              </div>,
            },
            {
              id: "preview",
              name: previewTitle,
              content: mobilePreviewContent,
            },
          ]
        />
      </div>
      <div
        className="shrink-0 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm flex justify-center py-1">
        <Dock render fullScreenToggler subtitlesManager videoFileName />
      </div>
    </div>
  } else {
    <div
      id="fframes-editor"
      className="w-screen h-screen bg-zinc-900 overflow-hidden relative flex flex-col">
      <div className="flex justify-center w-full flex-1 min-h-0 overflow-hidden">
        {layout.mediaControls
        ->Belt.Option.map(size =>
          <div
            style={size->UseEditorLayout.sizeToStyle}
            className="@container col-span-2 pt-2 flex flex-col border-r border-zinc-800 overflow-hidden">
            <div
              className="@2xl:hidden flex-1 min-h-0 flex flex-col pt-1 px-2 gap-2 overflow-hidden">
              <Tabs
                defaultIndex=0
                tabs=[
                  {
                    id: "subtitles",
                    name: subtitlesTitle,
                    content: <ChunksList subtitlesManager title={React.null} />,
                  },
                  {id: "style", name: styleTitle, content: <StyleEditor />},
                ]
              />
            </div>
            <div
              className="hidden @2xl:flex overflow-hidden px-4 pt-2 flex-1 min-h-0 max-h-full divide-x divide-zinc-700">
              <div
                className="pr-6 flex-1 flex max-h-full overflow-auto flex-col justify-center gap-y-4">
                <ChunksList subtitlesManager title={subtitlesTitle} />
              </div>
              <div className="pl-6 flex-1 flex flex-col gap-y-4 overflow-auto">
                <h2 className="mx-auto text-xl"> {styleTitle} </h2>
                <StyleEditor />
              </div>
            </div>
          </div>
        )
        ->Option.getOr(React.null)}
        <div className="relative" style={UseEditorLayout.sizeToStyle(layout.preview)}>
          <canvas
            id="editor-preview"
            ref={ReactDOM.Ref.domRef(ctx.dom.canvasRef)}
            width={ctx.videoMeta.width->Int.toString}
            height={ctx.videoMeta.height->Int.toString}
            style={ReactDOMStyle.make(
              ~width=`${ctx.videoMeta.width->Int.toString}px`,
              ~height=`${ctx.videoMeta.height->Int.toString}px`,
              ~transform=`scale(${layout.preview.scale->Js.Float.toString})`,
              (),
            )}
            className="bg-black origin-top-left absolute left-0 top-0"
          />
          <canvas
            key={renderCanvasKey->Int.toString}
            ref={ReactDOM.Ref.domRef(rendererPreviewCanvasRef)}
            width={ctx.videoMeta.width->Int.toString}
            height={ctx.videoMeta.height->Int.toString}
            style={ReactDOMStyle.make(
              ~width=`${ctx.videoMeta.width->Int.toString}px`,
              ~height=`${ctx.videoMeta.height->Int.toString}px`,
              ~transform=`scale(${layout.preview.scale->Js.Float.toString})`,
              (),
            )}
            className="origin-top-left absolute left-0 top-0"
          />
          <EditorCanvas
            transcriptionInProgress
            subtitles=subtitlesManager.activeSubtitles
            subtitlesManager
            width=ctx.videoMeta.width
            height=ctx.videoMeta.height
            style={ReactDOMStyle.make(
              ~width=`${ctx.videoMeta.width->Int.toString}px`,
              ~height=`${ctx.videoMeta.height->Int.toString}px`,
              ~transform=`scale(${layout.preview.scale->Js.Float.toString})`,
              (),
            )}
            className="bg-transparent origin-top-left absolute left-0 top-0"
          />
        </div>
      </div>
      {layout.timeLine
      ->Belt.Option.map(sectionSize =>
        <div
          style={sectionSize->UseEditorLayout.sizeToStyle}
          className="shadow-lg w-screen bg-zinc-800 shrink-0">
          <Timeline sectionSize />
        </div>
      )
      ->Utils.Option.unwrapOr(React.null)}
      <Dock render fullScreenToggler subtitlesManager videoFileName />
    </div>
  }
})
