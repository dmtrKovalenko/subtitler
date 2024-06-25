@genType
type subtitleCue = {
  text: string,
  timestamp: (float, Js.nullable<float>),
}

@genType
type currentPlayingCue = {
  currentIndex: int,
  currentCue: subtitleCue,
}

let compareTsToRange = (range, ts) => {
  switch range {
  | (start, Js.Nullable.Null) => ts >= start
  | (start, Js.Nullable.Undefined) => ts >= start
  | (start, Js.Nullable.Value(end)) => start <= ts && ts < end
  }
}

let lookupCurrentCue = (~subtitles, ~timestamp) => {
  subtitles
  ->Belt.Array.getIndexBy(subtitle => {
    compareTsToRange(subtitle.timestamp, timestamp)
  })
  ->Option.map(currentIndex => {
    let currentCue = subtitles->Belt.Array.getUnsafe(currentIndex)

    {
      currentIndex,
      currentCue,
    }
  })
}

let resolveCurrentSubtitle = (~timestamp, ~subtitles, ~prevCue) => {
  switch prevCue {
  | None => lookupCurrentCue(~subtitles, ~timestamp)
  | Some(ctx) if compareTsToRange(ctx.currentCue.timestamp, timestamp) => Some(ctx)
  | Some(ctx) =>
    subtitles
    ->Array.get(ctx.currentIndex + 1)
    ->Option.flatMap(nextCue => {
      if compareTsToRange(nextCue.timestamp, timestamp) {
        Some({
          currentIndex: ctx.currentIndex + 1,
          currentCue: nextCue,
        })
      } else {
        lookupCurrentCue(~subtitles, ~timestamp)
      }
    })
  }
}
