open Types
open Hooks

@genType
let a = Js.Dict.empty

@genType.as("Editor") @react.component
let make = (~subtitles) => {
  let (isFullScreen, fullScreenToggler) = Hooks.useToggle(false)
  let ctx = EditorContext.useEditorContext()
  let layout = useEditorLayout(~isFullScreen)

  React.useEffect0(() => {
    ctx.canvasRef.current
    ->Js.Nullable.toOption
    ->Belt.Option.forEach(Js.Console.log2("Happy video hacking! Your preview will be rendered at"))

    None
  })

  <div id="fframes-editor" className="w-screen h-screen bg-zinc-900 overflow-hidden relative">
    <div className="overflow-auto flex justify-center w-full">
      {// MediaList
      layout.mediaControls
      ->Belt.Option.map(size =>
        <div
          style={size->UseEditorLayout.sizeToStyle}
          className="col-span-2 h-full overflow-auto flex flex-col p-4 border-r border-zinc-800">
          <div className="flex items-center flex-col mb-6 pt-1 gap-2">
            <Tabs
              defaultIndex=1
              tabs=[
                {
                  id: "subtitles",
                  name: "Subtitles"->React.string,
                  content: <ChunksList subtitles />,
                },
                {
                  id: "style",
                  name: "Style"->React.string,
                  content: <StyleEditor />,
                },
              ]
            />
          </div>
        </div>
      )
      ->Option.getOr(React.null)}
      // Preview
      <div className="relative" style={UseEditorLayout.sizeToStyle(layout.preview)}>
        <canvas
          id="editor-preview"
          ref={ReactDOM.Ref.domRef(ctx.canvasRef)}
          width={ctx.videoMeta.width->Int.toString}
          height={ctx.videoMeta.height->Int.toString}
          style={ReactDOMStyle.make(
            ~width=`${ctx.videoMeta.width->Int.toString}px`,
            ~height=`${ctx.videoMeta.height->Int.toString}px`,
            ~transform=`scale(${layout.preview.scale->Js.Float.toString})`,
            (),
          )}
          className="bg-black origin-top-left"
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
