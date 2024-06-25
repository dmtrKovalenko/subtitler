@react.component @module("./EditorCanvas")
external make: (
  ~width: int,
  ~height: int,
  ~style: ReactDOM.Style.t,
  ~className: string,
  ~subtitles: array<Subtitles.subtitleCue>,
) => React.element = "EditorCanvas"
