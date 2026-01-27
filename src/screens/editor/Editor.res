open Types
open Hooks
open ChunksList

@genType
let a = Js.Dict.empty

Js.Console.log("Happy subtitles making experience!")

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

  <div id="fframes-editor" className="w-screen h-screen bg-zinc-900 overflow-clip relative">
    <div className="overflow-auto flex justify-center w-full">
      {// MediaList
      layout.mediaControls
      ->Belt.Option.map(size =>
        <div
          style={size->UseEditorLayout.sizeToStyle}
          className="@container col-span-2 pt-2 h-full flex flex-col border-r border-zinc-800">
          <div className="@2xl:hidden flex-1 scrol-pb-4 flex items-center flex-col pt-1 px-4 gap-2">
            <Tabs
              defaultIndex=0
              tabs=[
                {
                  id: "subtitles",
                  name: subtitlesTitle,
                  content: <ChunksList subtitlesManager title={React.null} />,
                },
                {
                  id: "style",
                  name: styleTitle,
                  content: <StyleEditor />,
                },
              ]
            />
          </div>
          <div
            className="hidden @2xl:flex overflow-hidden px-4 pt-2 flex-1 max-h-full divide-x divide-zinc-700">
            <div
              className="pr-6 flex-1 flex max-h-full overflow-auto flex-col justify-center gap-y-4">
              <ChunksList subtitlesManager title={subtitlesTitle} />
            </div>
            <div className="pl-6 flex-1 flex flex-col gap-y-4">
              <h2 className="mx-auto text-xl"> {styleTitle} </h2>
              <StyleEditor />
            </div>
          </div>
        </div>
      )
      ->Option.getOr(React.null)}
      // Preview
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
        style={sectionSize->UseEditorLayout.sizeToStyle} className="shadow-lg w-screen bg-zinc-800">
        <Timeline sectionSize />
      </div>
    )
    ->Utils.Option.unwrapOr(React.null)}
    <Dock render fullScreenToggler subtitlesManager videoFileName />
  </div>
})
