open CanvasSize
open Belt

@react.component
let make = (~size) => {
  let controlsCanvasRef = React.useRef(Js.Nullable.null)
  let editorContext = EditorContext.useEditorContext()
  let (player, _) = editorContext.usePlayer()

  useCanvasScale(controlsCanvasRef, size)

  <canvas
    className="absolute inset-0"
    style={ReactDOMStyle.make(
      ~height=`${size.height->Float.toString}px`,
      ~width=`${size.width->Float.toString}px`,
      (),
    )}
    width={`${size.width->Js.Math.floor->Int.toString}px`}
    height={`${size.height->Js.Math.floor->Int.toString}px`}
    ref={ReactDOM.Ref.domRef(controlsCanvasRef)}
  />
}
