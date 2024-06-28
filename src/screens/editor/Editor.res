open Types
open Hooks

@genType
let a = Js.Dict.empty

@genType.as("Editor") @react.component
let make = (~subtitles, ~transcriptionInProgress) => {
  let (isFullScreen, fullScreenToggler) = Hooks.useToggle(false)
  let ctx = EditorContext.useEditorContext()
  let layout = useEditorLayout(~isFullScreen)

  React.useEffect0(() => {
    ctx.dom.canvasRef.current
    ->Js.Nullable.toOption
    ->Belt.Option.forEach(Js.Console.log2("Happy video hacking! Your preview will be rendered at"))

    None
  })

  let subtitlesTitle = if !transcriptionInProgress {
    "Subtitles"->React.string
  } else {
    <div className="gap-2 inline-flex items-center">
      <Spinner />
      <span> {"Subtitles"->React.string} </span>
    </div>
  }

  let styleTitle = React.string("Style")

  <div id="fframes-editor" className="w-screen h-screen bg-zinc-900 overflow-hidden relative">
    <div className="overflow-auto flex justify-center w-full">
      {// MediaList
      layout.mediaControls
      ->Belt.Option.map(size =>
        <div
          style={size->UseEditorLayout.sizeToStyle}
          className="@container col-span-2 h-full overflow-auto flex flex-col p-4 border-r border-zinc-800">
          <div className="@2xl:hidden flex items-center flex-col mb-6 pt-1 gap-2">
            <Tabs
              defaultIndex=1
              tabs=[
                {
                  id: "subtitles",
                  name: subtitlesTitle,
                  content: <ChunksList subtitles />,
                },
                {
                  id: "style",
                  name: styleTitle,
                  content: <StyleEditor />,
                },
              ]
            />
          </div>
          <div className="hidden @2xl:flex divide-x divide-zinc-700">
            <div className="pr-6 flex-1 flex flex-col justify-center gap-y-4">
              <h2 className="mx-auto text-xl"> {subtitlesTitle} </h2>
              <ChunksList subtitles />
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
        <EditorCanvas
          subtitles
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
    <Dock fullScreenToggler />
  </div>
}
