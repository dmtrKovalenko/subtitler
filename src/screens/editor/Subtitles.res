type timestamp = (float, Js.nullable<float>)

@genType
type subtitleCue = {
  id: option<float>,
  text: string,
  timestamp: timestamp,
}

let start = chunk => chunk.timestamp->fst
let end = chunk => chunk.timestamp->snd

@genType
type currentPlayingCue = {
  currentIndex: int,
  currentCue: subtitleCue,
}

let isChunkDisplayed = (range, ts, nextRange) => {
  switch (range->start, range->end, nextRange->Option.map(start)) {
  | (start, Js.Nullable.Null | Js.Nullable.Undefined, Some(nextStart)) =>
    start <= ts && ts < nextStart
  | (start, Js.Nullable.Null | Js.Nullable.Undefined, None) => ts >= start
  | (start, Js.Nullable.Value(end), _) => start <= ts && ts < end
  }
}

let lookupCurrentCue = (~subtitles, ~timestamp) => {
  subtitles
  ->Array.findIndexWithIndex((subtitle, i) => {
    isChunkDisplayed(subtitle, timestamp, subtitles->Array.get(i + 1))
  })
  ->(index => index < 0 ? None : Some(index))
  ->Option.map(currentIndex => {
    let currentCue = subtitles->Array.getUnsafe(currentIndex)

    {
      currentIndex,
      currentCue,
    }
  })
}

let lookUpLastPlayedCue = (~subtitles, ~timestamp) => {
  subtitles->Array.reduceRightWithIndex(None, (acc, subtitle, index) => {
    switch acc {
    | None if isChunkDisplayed(subtitle, timestamp, subtitles->Array.get(index + 1)) =>
      Some({
        currentIndex: index,
        currentCue: subtitle,
      })
    | _ => acc
    }
  })
}

// tries to match current or next cue based on the previous one or lookup from the start
@gentype
let getOrLookupCurrentCue = (~timestamp, ~subtitles, ~prevCue) => {
  switch prevCue {
  | None => lookupCurrentCue(~subtitles, ~timestamp)
  | Some(ctx)
    if isChunkDisplayed(ctx.currentCue, timestamp, subtitles->Array.get(ctx.currentIndex + 1)) =>
    Some(ctx)
  | Some(ctx) =>
    subtitles
    ->Array.get(ctx.currentIndex + 1)
    ->Option.flatMap(nextCue => {
      if isChunkDisplayed(nextCue, timestamp, subtitles->Array.get(ctx.currentIndex + 2)) {
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

let averageChunkLength = (subtitles: array<subtitleCue>) => {
  let totalCharacters = subtitles->Array.reduce(0, (acc, subtitle) => {
    acc + subtitle.text->String.length
  })

  totalCharacters / subtitles->Array.length
}

let addChunkId = (chunk: subtitleCue) => {
  {
    ...chunk,
    id: Some(Math.random()),
  }
}

let fillChunksIds = (subtitles: array<subtitleCue>) => subtitles->Array.map(addChunkId)

// Simple alghortim taking into account word level timestamps
// and combining them into chunks of a given max size
let resizeChunks = (wordChunks, ~maxSize) => {
  let resizedChunks = []
  let chunkInProgressRef = ref(None)

  let wordlen = chunkA => {
    chunkA.text->String.trim->String.length
  }

  wordChunks->Array.forEach(chunk => {
    // we need to keep the populate ids for every chunk on this step
    let chunk = chunk->addChunkId

    switch chunkInProgressRef.contents {
    | None => chunkInProgressRef := Some(chunk)
    | Some(chunkInProgress) if chunk->wordlen + chunkInProgress->wordlen < maxSize =>
      chunkInProgressRef :=
        Some({
          id: Some(Math.random()),
          text: chunkInProgress.text ++ chunk.text,
          timestamp: (chunkInProgress.timestamp->fst, chunk.timestamp->snd),
        })
    | Some(chunkInProgress) =>
      resizedChunks->Array.push(chunkInProgress)
      chunkInProgressRef := Some(chunk)
    }
  })

  chunkInProgressRef.contents->Option.forEach(chunk => Array.push(resizedChunks, chunk))

  resizedChunks
}

let editChunkText = (chunks, index, newText) => {
  chunks->Array.mapWithIndex((chunk, i) => {
    if i == index {
      {
        ...chunk,
        text: newText,
      }
    } else {
      chunk
    }
  })
}

let sortChunks = chunks => {
  Array.toSorted(chunks, (a, b) => {
    let (startA, _) = a.timestamp
    let (startB, _) = b.timestamp

    startA -. startB
  })
}

let editChunkTimestamp = (chunks, index, newTimestamp) => {
  chunks
  ->Utils.Log.andReturn
  ->Array.mapWithIndex((chunk, i) => {
    if i == index {
      {
        ...chunk,
        timestamp: newTimestamp,
      }
    } else {
      chunk
    }
  })
  ->Utils.Log.andReturn
  ->sortChunks
}

let removeChunk = (chunks, index, ~joinSiblingsTimestamps) => {
  let chunkToRemove = chunks->Array.get(index)

  chunkToRemove
  ->Option.map(chunkToRemove => {
    chunks->Utils.Array.filterMapWithIndex((chunk, i) => {
      switch i {
      | i if i == index => None
      | i if joinSiblingsTimestamps && i == index - 1 =>
        Some({
          ...chunk,
          timestamp: (chunk->start, chunkToRemove->end),
        })
      | i if joinSiblingsTimestamps && i == index + 1 =>
        Some({
          ...chunk,
          timestamp: (
            chunkToRemove->end->Js.Nullable.toOption->Option.getOr(chunk->start),
            chunk->end,
          ),
        })
      | _ => Some(chunk)
      }
    })
  })
  ->Utils.Log.andReturn
  ->Option.getOr(chunks)
}
