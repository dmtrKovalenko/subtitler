type timestamp = (float, Js.nullable<float>)

@genType
type subtitleCue = {
  id: option<float>,
  text: string,
  isInProgress: option<bool>,
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

let splitChunksByPauses = wordChunks => {
  let splitChunks = []

  wordChunks->Array.forEachWithIndex((chunk, i) => {
    let prevWordChunk = wordChunks->Array.get(i - 1)
    let prevChunkGroup = splitChunks->Utils.Array.last

    switch (prevWordChunk, prevChunkGroup) {
    | (None, _) | (_, None) => splitChunks->Array.push([chunk])
    | (Some(prevChunk), Some(_))
      if prevChunk
      ->end
      ->Js.Nullable.toOption
      ->Option.map(prevEnd => chunk->start -. prevEnd > 0.2)
      ->Option.getOr(false) =>
      splitChunks->Array.push([chunk])
    | (Some(_), Some(lastChunkGroup)) => lastChunkGroup->Array.push(chunk)
    }
  })

  splitChunks
}

let trim_syntax_ending_punctuation_regexp = %re("/[.,!?。！？]$/")

let resizeChunks = (chunkGroups, ~maxSize) => {
  chunkGroups
  ->Array.flatMap(group => {
    let totalGroupCharLength = group->Array.reduce(0, (acc, chunk) => {
      acc + chunk.text->String.length
    })

    if totalGroupCharLength > maxSize {
      let relation = totalGroupCharLength->float_of_int /. maxSize->float_of_int
      let subChunkSize = Math.ceil(Array.length(group)->float_of_int /. relation)->int_of_float

      let subChunks = []
      for i in 0 to relation->int_of_float {
        let subChunk = group->Array.slice(~start=i * subChunkSize, ~end=(i + 1) * subChunkSize)

        if subChunk->Array.length > 0 {
          subChunks->Array.push({
            id: Some(Math.random()),
            text: subChunk->Array.reduce("", (acc, chunk) => {
              acc ++ chunk.text
            }),
            isInProgress: (subChunk->Array.getUnsafe(0)).isInProgress,
            timestamp: (
              subChunk
              ->Array.get(0)
              ->Option.getExn(~message="Missing original chunk when calculating subgroup")
              ->start,
              subChunk
              ->Utils.Array.last
              ->Option.getExn(~message="Missing original chunk when calculating subgroup")
              ->end,
            ),
          })
        }
      }

      subChunks
    } else {
      let combinedText = group->Array.reduce("", (acc, chunk) => {
        acc ++ chunk.text
      })

      [
        {
          id: Some(Math.random()),
          text: combinedText,
          isInProgress: (group->Array.getUnsafe(0)).isInProgress,
          timestamp: (
            group->Array.getUnsafe(0)->start,
            group->Array.getUnsafe(group->Array.length - 1)->end,
          ),
        },
      ]
    }
  })
  ->Array.map(chunk => {
    {
      ...chunk,
      text: chunk.text
      ->String.trim
      ->String.replaceRegExp(trim_syntax_ending_punctuation_regexp, ""),
    }
  })
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
  ->Option.getOr(chunks)
}
