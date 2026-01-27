@react.component @module("./EditorCanvas")
external make: (
  ~transcriptionInProgress: bool,
  ~width: int,
  ~height: int,
  ~style: ReactDOM.Style.t,
  ~className: string,
  ~subtitles: array<Subtitles.subtitleCue>,
  ~subtitlesManager: ChunksList.subtitlesManager=?,
) => React.element = "EditorCanvas"
