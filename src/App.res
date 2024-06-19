type file
type fileList

@get external getFiles: 'a => array<string> = "files"
@get external length: ReactEvent.Form.t => int = "length"

@react.component
let make = () => {
  let canvasRef = React.useRef(Nullable.null)

  let onChange = e => {
    let file = e->ReactEvent.Form.currentTarget->getFiles->Belt.Array.getExn(0)
    canvasRef.current
    ->Js.Nullable.toOption
    ->Option.map(canvas => {
      Decode.start({
        dataUri: file,
        canvas,
        setStatus: status => {
          Js.log(status)
        },
      })
    })
    ->ignore
  }

  <div className="text-black">
    <canvas ref={ReactDOM.Ref.domRef(canvasRef)} width="400" height="400" />
    <input type_="file" onChange={onChange} accept="video/*" />
    <div className="p-6"> {"This fucking hard"->React.string} </div>
  </div>
}
