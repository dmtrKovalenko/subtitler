type transcriptionState =
  | TranscriptionInProgress
  | SubtitlesNotEdited({resizedSubtitles: array<Subtitles.subtitleCue>, size: int})
  | SubtitlesEdited(array<Subtitles.subtitleCue>)

type subtitlesManager = {
  activeSubtitles: array<Subtitles.subtitleCue>,
  transcriptionState: transcriptionState,
  subtitlesRef: React.ref<array<Subtitles.subtitleCue>>,
  resizeSubtitles: int => unit,
  removeChunk: (int, ~joinSiblingsTimestamps: bool) => unit,
  editText: (int, string) => unit,
  editTimestamp: (int, Subtitles.timestamp) => unit,
}

@genType
let useChunksState = (~subtitles, ~transcriptionInProgress, ~default_chunk_size) => {
  let subtitlesRef = React.useRef(subtitles)
  let (transcriptionState, setTranscriptionState) = React.useState(_ => TranscriptionInProgress)

  switch (transcriptionInProgress, transcriptionState) {
  | (false, TranscriptionInProgress) if Array.length(subtitles) > 0 =>
    setTranscriptionState(_ => SubtitlesNotEdited({
      resizedSubtitles: subtitles
      ->Subtitles.splitChunksByPauses
      ->Subtitles.resizeChunks(~maxSize=default_chunk_size),
      size: default_chunk_size,
    }))
  | _ => ()
  }

  let activeSubtitles = switch transcriptionState {
  | TranscriptionInProgress => subtitles
  | SubtitlesNotEdited({resizedSubtitles, size: _}) => resizedSubtitles
  | SubtitlesEdited(subtitles) => subtitles
  }

  subtitlesRef.current = activeSubtitles

  React.useMemo2(() => {
    activeSubtitles,
    transcriptionState,
    subtitlesRef,
    removeChunk: (index, ~joinSiblingsTimestamps) =>
      setTranscriptionState(_ => SubtitlesEdited(
        activeSubtitles->Subtitles.removeChunk(index, ~joinSiblingsTimestamps),
      )),
    resizeSubtitles: newSize => {
      setTranscriptionState(_ => SubtitlesNotEdited({
        resizedSubtitles: subtitles
        ->Subtitles.splitChunksByPauses
        ->Subtitles.resizeChunks(~maxSize=newSize),
        size: newSize,
      }))
    },
    editText: (index, newText) =>
      setTranscriptionState(_ => SubtitlesEdited(
        activeSubtitles->Subtitles.editChunkText(index, newText),
      )),
    editTimestamp: (index, newTimestamp) =>
      setTranscriptionState(_ => SubtitlesEdited(
        activeSubtitles->Subtitles.editChunkTimestamp(index, newTimestamp),
      )),
  }, (transcriptionState, subtitles))
}

@react.component
let make = React.memo((~subtitlesManager) => {
  let ctx = EditorContext.useEditorContext()
  let (player, _) = ctx.usePlayer()

  <div className="flex flex-1 pb-4 min-h-0 flex-col gap-6">
    {switch subtitlesManager.transcriptionState {
    | SubtitlesNotEdited({size}) =>
      <div className="flex flex-col w-full">
        <h2 className="text-center font-medium text-white/95">
          {React.string(`Cue size ${size->Int.toString} characters`)}
        </h2>
        <Slider
          disabled=false
          value={size}
          min={5}
          max={200}
          step={1}
          onValueChange=subtitlesManager.resizeSubtitles
        />
        <p className="text-center px-2 text-balance text-sm text-gray-500">
          {"Change the size each individual subtitle cue by dragging the slider above. Make sure you won't be able to resize cues after editing."->React.string}
        </p>
      </div>
    | TranscriptionInProgress =>
      <p className="text-center px-2 text-balance text-sm text-gray-500">
        {"Transciption in progress. Once finished you'll be able to edit and resize generated subtitles."->React.string}
      </p>
    | _ => React.null
    }}
    {subtitlesManager.activeSubtitles
    ->Array.mapWithIndex((chunk, index) =>
      <ChunkEditor
        index
        current={player.currentPlayingCue
        ->Option.map(cue => cue.currentIndex === index)
        ->Option.getOr(false)}
        readonly={subtitlesManager.transcriptionState == TranscriptionInProgress}
        chunk
        // while keep rerendering on any text change, but
        // after streaming stopped we allow the editing so no need to kill the whole component
        key={switch chunk.id {
        | Some(id) => id->Float.toString
        | _ => `${index->Int.toString}-${chunk.text}`
        }}
        removeChunk=subtitlesManager.removeChunk
        onTextChange=subtitlesManager.editText
        onTimestampChange=subtitlesManager.editTimestamp
      />
    )
    ->React.array}
  </div>
})
