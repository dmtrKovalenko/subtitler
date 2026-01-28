// Word-level timestamp preservation with stable pause boundaries

@genType
type transcriptionState =
  | TranscriptionInProgress
  | SubtitlesReady({
      // Word chunks - updated when text is edited
      wordChunks: array<WordTimestamps.wordChunk>,
      // Original pause boundary timestamps - NEVER modified after init
      // These are the END timestamps of words that had a pause after them
      pauseAfterIndices: array<int>, // indices of words that have a pause AFTER them
      // Current cue groupings - indices into wordChunks
      cueRanges: array<(int, int)>,
      size: int,
    })

@genType
type subtitlesManager = {
  activeSubtitles: array<Subtitles.subtitleCue>,
  transcriptionState: transcriptionState,
  subtitlesRef: React.ref<array<Subtitles.subtitleCue>>,
  resizeSubtitles: int => unit,
  removeChunk: (int, ~joinSiblingsTimestamps: bool) => unit,
  editText: (int, string) => unit,
  editTimestamp: (int, Subtitles.timestamp) => unit,
  getWordChunksForCue: int => option<array<WordTimestamps.wordChunk>>,
  // Functions for adding/splitting cues
  hasPauseBefore: int => bool,
  hasPauseAfter: int => bool,
  addCueBefore: int => unit,
  addCueAfter: int => unit,
  splitCue: (int, int) => unit, // (cueIndex, splitAtWordIndex)
}

let subtitleCueToWordChunk = (cue: Subtitles.subtitleCue): WordTimestamps.wordChunk => {
  text: cue.text,
  timestamp: cue.timestamp,
}

let detectPauseIndices = (wordChunks: array<WordTimestamps.wordChunk>): array<int> => {
  let pauseIndices: array<int> = []

  wordChunks->Array.forEachWithIndex((chunk, i) => {
    let nextChunk = wordChunks->Array.get(i + 1)

    switch nextChunk {
    | Some(next) =>
      let thisEnd = chunk.timestamp->snd->Js.Nullable.toOption->Option.getOr(chunk.timestamp->fst)
      let nextStart = next.timestamp->fst
      if nextStart -. thisEnd > 0.2 {
        pauseIndices->Array.push(i)
      }
    | None => () // Last word, no pause after
    }
  })

  pauseIndices
}

// Group word indices by pause boundaries
// Returns array of (startIdx, endIdx) for each group
let groupByPauses = (wordCount: int, pauseAfterIndices: array<int>): array<(int, int)> => {
  if wordCount == 0 {
    []
  } else {
    let groups: array<(int, int)> = []
    let currentStart = ref(0)

    pauseAfterIndices->Array.forEach(pauseAfterIdx => {
      if pauseAfterIdx >= currentStart.contents && pauseAfterIdx < wordCount {
        groups->Array.push((currentStart.contents, pauseAfterIdx))
        currentStart := pauseAfterIdx + 1
      }
    })

    // Add final group if there are remaining words
    if currentStart.contents < wordCount {
      groups->Array.push((currentStart.contents, wordCount - 1))
    }

    groups
  }
}

// Resize groups into cue ranges based on character count
let resizeGroupsToRanges = (
  wordChunks: array<WordTimestamps.wordChunk>,
  groups: array<(int, int)>,
  ~maxSize: int,
): array<(int, int)> => {
  groups->Array.flatMap(((groupStart, groupEnd)) => {
    let groupWords = wordChunks->Array.slice(~start=groupStart, ~end=groupEnd + 1)
    let totalLength =
      groupWords->Array.reduce(0, (acc, w) => acc + w.text->String.trim->String.length)

    if totalLength > maxSize && Array.length(groupWords) > 1 {
      let relation = totalLength->float_of_int /. maxSize->float_of_int
      let subChunkSize = Math.ceil(Array.length(groupWords)->float_of_int /. relation)->int_of_float

      let ranges: array<(int, int)> = []
      let numSubChunks =
        Math.ceil(
          Array.length(groupWords)->float_of_int /. subChunkSize->float_of_int,
        )->int_of_float

      for i in 0 to numSubChunks - 1 {
        let localStart = i * subChunkSize
        let localEnd = min((i + 1) * subChunkSize - 1, Array.length(groupWords) - 1)

        if localStart <= localEnd {
          ranges->Array.push((groupStart + localStart, groupStart + localEnd))
        }
      }
      ranges
    } else {
      [(groupStart, groupEnd)]
    }
  })
}

let calculateCueRanges = (
  wordChunks: array<WordTimestamps.wordChunk>,
  pauseAfterIndices: array<int>,
  ~size: int,
): array<(int, int)> => {
  let groups = groupByPauses(Array.length(wordChunks), pauseAfterIndices)
  resizeGroupsToRanges(wordChunks, groups, ~maxSize=size)
}

let buildCueFromRange = (
  wordChunks: array<WordTimestamps.wordChunk>,
  startIdx: int,
  endIdx: int,
): Subtitles.subtitleCue => {
  let words = wordChunks->Array.slice(~start=startIdx, ~end=endIdx + 1)

  let firstWord = words->Array.getUnsafe(0)
  let lastWord = words->Array.getUnsafe(Array.length(words) - 1)

  // Join word texts - preserve punctuation and user edits
  let combinedText =
    words
    ->Array.map(w => w.text->String.trim)
    ->Array.filter(s => s !== "")
    ->Array.join(" ")

  {
    id: Some(Math.random()),
    text: combinedText,
    isInProgress: None,
    timestamp: (firstWord->WordTimestamps.start, lastWord->WordTimestamps.end_),
  }
}

let buildCuesFromRanges = (
  wordChunks: array<WordTimestamps.wordChunk>,
  cueRanges: array<(int, int)>,
): array<Subtitles.subtitleCue> => {
  cueRanges->Array.map(((startIdx, endIdx)) => buildCueFromRange(wordChunks, startIdx, endIdx))
}

let updatePauseIndicesAfterEdit = (
  pauseAfterIndices: array<int>,
  editedCueStart: int,
  editedCueEnd: int,
  oldWordCount: int,
  newWordCount: int,
): array<int> => {
  let delta = newWordCount - oldWordCount

  if delta == 0 {
    pauseAfterIndices
  } else {
    pauseAfterIndices->Array.filterMap(idx => {
      if idx < editedCueStart {
        // Before edited range - unchanged
        Some(idx)
      } else if idx >= editedCueStart && idx <= editedCueEnd {
        // Inside edited range - scale proportionally or remove if range shrinks
        if newWordCount == 0 {
          None
        } else {
          let relativePos = (idx - editedCueStart)->float_of_int /. oldWordCount->float_of_int
          let newIdx = editedCueStart + (relativePos *. newWordCount->float_of_int)->int_of_float

          // Only keep if it's not at the very end of the new range (pause would be after the cue)
          if newIdx < editedCueStart + newWordCount - 1 {
            Some(newIdx)
          } else {
            None
          }
        }
      } else {
        // After edited range - shift by delta
        Some(idx + delta)
      }
    })
  }
}

// Update cue ranges after word count changes
let updateRangesAfterEdit = (
  cueRanges: array<(int, int)>,
  editedCueIndex: int,
  oldWordCount: int,
  newWordCount: int,
): array<(int, int)> => {
  let delta = newWordCount - oldWordCount

  if delta == 0 {
    cueRanges
  } else {
    cueRanges->Array.mapWithIndex((range, i) => {
      let (startIdx, endIdx) = range
      if i == editedCueIndex {
        (startIdx, startIdx + newWordCount - 1)
      } else if i > editedCueIndex {
        (startIdx + delta, endIdx + delta)
      } else {
        range
      }
    })
  }
}

// Minimum gap threshold in seconds to consider as a "pause" for adding cues
let pauseThreshold = 0.1

@genType
let useChunksState = (~subtitles, ~transcriptionInProgress, ~default_chunk_size) => {
  let subtitlesRef = React.useRef(subtitles)
  let (transcriptionState, setTranscriptionState) = React.useState(_ => TranscriptionInProgress)

  switch (transcriptionInProgress, transcriptionState) {
  | (false, TranscriptionInProgress) if Array.length(subtitles) > 0 =>
    let wordChunks = subtitles->Array.map(subtitleCueToWordChunk)
    let pauseAfterIndices = detectPauseIndices(wordChunks)
    let cueRanges = calculateCueRanges(wordChunks, pauseAfterIndices, ~size=default_chunk_size)

    setTranscriptionState(_ => SubtitlesReady({
      wordChunks,
      pauseAfterIndices,
      cueRanges,
      size: default_chunk_size,
    }))
  | _ => ()
  }

  let activeSubtitles = switch transcriptionState {
  | TranscriptionInProgress => subtitles
  | SubtitlesReady({wordChunks, cueRanges}) => buildCuesFromRanges(wordChunks, cueRanges)
  }

  subtitlesRef.current = activeSubtitles

  React.useMemo2(() => {
    activeSubtitles,
    transcriptionState,
    subtitlesRef,
    removeChunk: (index, ~joinSiblingsTimestamps as _) => {
      switch transcriptionState {
      | SubtitlesReady({wordChunks, pauseAfterIndices, cueRanges, size}) =>
        switch cueRanges->Array.get(index) {
        | Some((startIdx, endIdx)) =>
          let removedWordCount = endIdx - startIdx + 1

          // Remove words in range
          let newWordChunks = wordChunks->Array.filterWithIndex((_, i) => {
            i < startIdx || i > endIdx
          })

          // Update pause indices
          let newPauseIndices = pauseAfterIndices->Array.filterMap(idx => {
            if idx < startIdx {
              Some(idx)
            } else if idx <= endIdx {
              None // Remove pauses inside deleted range
            } else {
              Some(idx - removedWordCount)
            }
          })

          // Update ranges
          let newCueRanges =
            cueRanges
            ->Array.filterWithIndex((_, i) => i != index)
            ->Array.map(((s, e)) => {
              if s > endIdx {
                (s - removedWordCount, e - removedWordCount)
              } else {
                (s, e)
              }
            })

          setTranscriptionState(_ => SubtitlesReady({
            wordChunks: newWordChunks,
            pauseAfterIndices: newPauseIndices,
            cueRanges: newCueRanges,
            size,
          }))
        | None => ()
        }
      | TranscriptionInProgress => ()
      }
    },
    resizeSubtitles: newSize => {
      switch transcriptionState {
      | SubtitlesReady({wordChunks, pauseAfterIndices}) =>
        // Recalculate cue ranges with SAME pause boundaries
        let newCueRanges = calculateCueRanges(wordChunks, pauseAfterIndices, ~size=newSize)
        setTranscriptionState(_ => SubtitlesReady({
          wordChunks,
          pauseAfterIndices,
          cueRanges: newCueRanges,
          size: newSize,
        }))
      | TranscriptionInProgress => ()
      }
    },
    editText: (index, newText) => {
      switch transcriptionState {
      | SubtitlesReady({wordChunks, pauseAfterIndices, cueRanges, size}) =>
        switch cueRanges->Array.get(index) {
        | Some((startIdx, endIdx)) =>
          let oldWordCount = endIdx - startIdx + 1

          let cueWords = wordChunks->Array.slice(~start=startIdx, ~end=endIdx + 1)

          let newCueWords = WordTimestamps.applyTextEdit(cueWords, newText)
          let newWordCount = Array.length(newCueWords)

          if newWordCount == 0 {
            // Don't allow empty - keep at least one word with empty text
            let firstWord = cueWords->Array.getUnsafe(0)
            let lastWord = cueWords->Array.getUnsafe(Array.length(cueWords) - 1)
            let emptyWord: WordTimestamps.wordChunk = {
              text: "",
              timestamp: (firstWord->WordTimestamps.start, lastWord->WordTimestamps.end_),
            }

            let wordsBefore = wordChunks->Array.slice(~start=0, ~end=startIdx)
            let wordsAfter = wordChunks->Array.sliceToEnd(~start=endIdx + 1)
            let newWordChunks = wordsBefore->Array.concat([emptyWord])->Array.concat(wordsAfter)

            let newPauseIndices = updatePauseIndicesAfterEdit(
              pauseAfterIndices,
              startIdx,
              endIdx,
              oldWordCount,
              1,
            )
            let newCueRanges = updateRangesAfterEdit(cueRanges, index, oldWordCount, 1)

            setTranscriptionState(_ => SubtitlesReady({
              wordChunks: newWordChunks,
              pauseAfterIndices: newPauseIndices,
              cueRanges: newCueRanges,
              size,
            }))
          } else {
            // Splice new words into the master array
            let wordsBefore = wordChunks->Array.slice(~start=0, ~end=startIdx)
            let wordsAfter = wordChunks->Array.sliceToEnd(~start=endIdx + 1)
            let newWordChunks = wordsBefore->Array.concat(newCueWords)->Array.concat(wordsAfter)

            // Update pause indices and cue ranges
            let newPauseIndices = updatePauseIndicesAfterEdit(
              pauseAfterIndices,
              startIdx,
              endIdx,
              oldWordCount,
              newWordCount,
            )
            let newCueRanges = updateRangesAfterEdit(cueRanges, index, oldWordCount, newWordCount)

            setTranscriptionState(_ => SubtitlesReady({
              wordChunks: newWordChunks,
              pauseAfterIndices: newPauseIndices,
              cueRanges: newCueRanges,
              size,
            }))
          }
        | None => ()
        }
      | TranscriptionInProgress => ()
      }
    },
    editTimestamp: (index, newTimestamp) => {
      switch transcriptionState {
      | SubtitlesReady({wordChunks, pauseAfterIndices, cueRanges, size}) =>
        switch cueRanges->Array.get(index) {
        | Some((startIdx, endIdx)) =>
          let (newStart, newEnd) = newTimestamp

          let newWordChunks = wordChunks->Array.mapWithIndex((word, i) => {
            if i == startIdx {
              {
                ...word,
                timestamp: (newStart, word.timestamp->snd),
              }
            } else if i == endIdx {
              {
                ...word,
                timestamp: (word.timestamp->fst, newEnd),
              }
            } else {
              word
            }
          })

          setTranscriptionState(_ => SubtitlesReady({
            wordChunks: newWordChunks,
            pauseAfterIndices,
            cueRanges,
            size,
          }))
        | None => ()
        }
      | TranscriptionInProgress => ()
      }
    },
    getWordChunksForCue: cueIndex => {
      switch transcriptionState {
      | SubtitlesReady({wordChunks, cueRanges}) =>
        switch cueRanges->Array.get(cueIndex) {
        | Some((startIdx, endIdx)) =>
          Some(wordChunks->Array.slice(~start=startIdx, ~end=endIdx + 1))
        | None => None
        }
      | TranscriptionInProgress => None
      }
    },
    hasPauseBefore: cueIndex => {
      switch transcriptionState {
      | SubtitlesReady({wordChunks, cueRanges}) =>
        switch (cueRanges->Array.get(cueIndex), cueRanges->Array.get(cueIndex - 1)) {
        | (Some((startIdx, _)), Some((_, prevEndIdx))) =>
          // Get current cue's first word start time
          let currentStart =
            wordChunks->Array.get(startIdx)->Option.map(w => w.timestamp->fst)->Option.getOr(0.0)
          // Get previous cue's last word end time
          let prevEnd =
            wordChunks
            ->Array.get(prevEndIdx)
            ->Option.flatMap(w => w.timestamp->snd->Js.Nullable.toOption)
            ->Option.getOr(0.0)
          currentStart -. prevEnd > pauseThreshold
        | (Some((startIdx, _)), None) =>
          // First cue - check if there's a gap from 0
          let currentStart =
            wordChunks->Array.get(startIdx)->Option.map(w => w.timestamp->fst)->Option.getOr(0.0)
          currentStart > pauseThreshold
        | _ => false
        }
      | TranscriptionInProgress => false
      }
    },
    hasPauseAfter: cueIndex => {
      switch transcriptionState {
      | SubtitlesReady({wordChunks, cueRanges}) =>
        switch (cueRanges->Array.get(cueIndex), cueRanges->Array.get(cueIndex + 1)) {
        | (Some((_, endIdx)), Some((nextStartIdx, _))) =>
          // Get current cue's last word end time
          let currentEnd =
            wordChunks
            ->Array.get(endIdx)
            ->Option.flatMap(w => w.timestamp->snd->Js.Nullable.toOption)
            ->Option.getOr(0.0)
          // Get next cue's first word start time
          let nextStart =
            wordChunks
            ->Array.get(nextStartIdx)
            ->Option.map(w => w.timestamp->fst)
            ->Option.getOr(0.0)
          nextStart -. currentEnd > pauseThreshold
        | (Some((_, endIdx)), None) =>
          // Last cue - there's always "space" after the last cue
          // Check if the cue has an end time (if not, we can't add after)
          wordChunks
          ->Array.get(endIdx)
          ->Option.flatMap(w => w.timestamp->snd->Js.Nullable.toOption)
          ->Option.isSome
        | _ => false
        }
      | TranscriptionInProgress => false
      }
    },
    addCueBefore: cueIndex => {
      switch transcriptionState {
      | SubtitlesReady({wordChunks, pauseAfterIndices, cueRanges, size}) =>
        switch cueRanges->Array.get(cueIndex) {
        | Some((startIdx, _)) =>
          // Get the gap timing
          let currentStart =
            wordChunks->Array.get(startIdx)->Option.map(w => w.timestamp->fst)->Option.getOr(0.0)

          let gapStart = switch cueRanges->Array.get(cueIndex - 1) {
          | Some((_, prevEndIdx)) =>
            wordChunks
            ->Array.get(prevEndIdx)
            ->Option.flatMap(w => w.timestamp->snd->Js.Nullable.toOption)
            ->Option.getOr(0.0)
          | None => 0.0
          }

          // Create a new empty word chunk for the gap
          let newWordChunk: WordTimestamps.wordChunk = {
            text: "",
            timestamp: (gapStart, Js.Nullable.return(currentStart)),
          }

          // Insert the word chunk before the current cue's words
          let wordsBefore = wordChunks->Array.slice(~start=0, ~end=startIdx)
          let wordsAfter = wordChunks->Array.sliceToEnd(~start=startIdx)
          let newWordChunks = wordsBefore->Array.concat([newWordChunk])->Array.concat(wordsAfter)

          // Update pause indices (shift all by 1 that are >= startIdx)
          let newPauseIndices = pauseAfterIndices->Array.map(idx => idx >= startIdx ? idx + 1 : idx)

          // Update cue ranges - only shift ranges at or after insertion point
          let newCueRange = (startIdx, startIdx) // Single word cue at insertion point
          let shiftedRanges = cueRanges->Array.map(((s, e)) => {
            // Only shift ranges that are at or after the insertion point
            if s >= startIdx {
              (s + 1, e + 1)
            } else {
              (s, e)
            }
          })
          let newCueRanges =
            shiftedRanges
            ->Array.slice(~start=0, ~end=cueIndex)
            ->Array.concat([newCueRange])
            ->Array.concat(shiftedRanges->Array.sliceToEnd(~start=cueIndex))

          setTranscriptionState(_ => SubtitlesReady({
            wordChunks: newWordChunks,
            pauseAfterIndices: newPauseIndices,
            cueRanges: newCueRanges,
            size,
          }))
        | None => ()
        }
      | TranscriptionInProgress => ()
      }
    },
    addCueAfter: cueIndex => {
      switch transcriptionState {
      | SubtitlesReady({wordChunks, pauseAfterIndices, cueRanges, size}) =>
        switch cueRanges->Array.get(cueIndex) {
        | Some((_, endIdx)) =>
          // Get the gap timing
          let currentEnd =
            wordChunks
            ->Array.get(endIdx)
            ->Option.flatMap(w => w.timestamp->snd->Js.Nullable.toOption)
            ->Option.getOr(0.0)

          let gapEnd = switch cueRanges->Array.get(cueIndex + 1) {
          | Some((nextStartIdx, _)) =>
            wordChunks
            ->Array.get(nextStartIdx)
            ->Option.map(w => w.timestamp->fst)
            ->Option.getOr(0.0)
          | None =>
            // Last cue - extend slightly after current end
            currentEnd +. 1.0
          }

          // Create a new empty word chunk for the gap
          let newWordChunk: WordTimestamps.wordChunk = {
            text: "",
            timestamp: (currentEnd, Js.Nullable.return(gapEnd)),
          }

          // Insert the word chunk after the current cue's words
          let insertIdx = endIdx + 1
          let wordsBefore = wordChunks->Array.slice(~start=0, ~end=insertIdx)
          let wordsAfter = wordChunks->Array.sliceToEnd(~start=insertIdx)
          let newWordChunks = wordsBefore->Array.concat([newWordChunk])->Array.concat(wordsAfter)

          // Update pause indices (shift all by 1 that are >= insertIdx)
          let newPauseIndices =
            pauseAfterIndices->Array.map(idx => idx >= insertIdx ? idx + 1 : idx)

          // Update cue ranges - add new cue after current, shift only subsequent ranges
          let newCueRange = (insertIdx, insertIdx) // Single word cue
          let rangesBefore = cueRanges->Array.slice(~start=0, ~end=cueIndex + 1)
          let rangesAfter =
            cueRanges
            ->Array.sliceToEnd(~start=cueIndex + 1)
            ->Array.map(((s, e)) => (s + 1, e + 1)) // Only shift ranges after insertion
          let newCueRanges = rangesBefore->Array.concat([newCueRange])->Array.concat(rangesAfter)

          setTranscriptionState(_ => SubtitlesReady({
            wordChunks: newWordChunks,
            pauseAfterIndices: newPauseIndices,
            cueRanges: newCueRanges,
            size,
          }))
        | None => ()
        }
      | TranscriptionInProgress => ()
      }
    },
    splitCue: (cueIndex, splitAtWordIndex) => {
      switch transcriptionState {
      | SubtitlesReady({wordChunks, pauseAfterIndices, cueRanges, size}) =>
        switch cueRanges->Array.get(cueIndex) {
        | Some((startIdx, endIdx)) =>
          let wordCount = endIdx - startIdx + 1

          // Validate split index
          if splitAtWordIndex > 0 && splitAtWordIndex < wordCount {
            // Calculate the absolute index where we split
            let absoluteSplitIdx = startIdx + splitAtWordIndex

            // Create two new ranges from the original
            let firstRange = (startIdx, absoluteSplitIdx - 1)
            let secondRange = (absoluteSplitIdx, endIdx)

            // Update cue ranges
            let rangesBefore = cueRanges->Array.slice(~start=0, ~end=cueIndex)
            let rangesAfter = cueRanges->Array.sliceToEnd(~start=cueIndex + 1)
            let newCueRanges =
              rangesBefore
              ->Array.concat([firstRange, secondRange])
              ->Array.concat(rangesAfter)

            setTranscriptionState(_ => SubtitlesReady({
              wordChunks,
              pauseAfterIndices,
              cueRanges: newCueRanges,
              size,
            }))
          }
        | None => ()
        }
      | TranscriptionInProgress => ()
      }
    },
  }, (transcriptionState, subtitles))
}

@react.component
let make = React.memo((~subtitlesManager, ~title: React.element) => {
  let ctx = EditorContext.useEditorContext()
  let (player, _) = ctx.usePlayer()

  // Track which cue is being split and the preview split index
  let (splitPreviewState, setSplitPreviewState) = React.useState(_ => None) // (cueIndex, splitAt)

  // Track which cue should be focused (for newly added cues)
  let (focusCueIndex, setFocusCueIndex) = React.useState(_ => None)

  <>
    <div
      className="sticky -top-px z-10 py-2 flex flex-col w-full bg-zinc-950 md:bg-zinc-900/95 md:backdrop-blur-sm border-b border-zinc-800/50">
      <h2 className="mx-auto text-xl pb-2"> {title} </h2>
      {switch subtitlesManager.transcriptionState {
      | SubtitlesReady({size}) =>
        <>
          <h3 className="text-center font-medium text-white/95">
            {React.string(`Cue size ${size->Int.toString} characters`)}
          </h3>
          <Slider
            disabled=false
            value={size}
            min={5}
            max={200}
            step={1}
            onValueChange=subtitlesManager.resizeSubtitles
          />
        </>
      | TranscriptionInProgress =>
        <p className="text-center pb-4 px-2 text-balance text-sm text-gray-500">
          {"Transcription in progress. Once finished you'll be able to edit and resize generated subtitles."->React.string}
        </p>
      }}
    </div>
    <div className="flex flex-1 ml-1.5 pb-4 min-h-0 flex-col gap-6">
      {subtitlesManager.activeSubtitles
      ->Array.mapWithIndex((chunk, index) =>
        <ChunkEditor
          index
          current={player.currentPlayingCue
          ->Option.map(cue => cue.currentIndex === index)
          ->Option.getOr(false)}
          readonly={subtitlesManager.transcriptionState == TranscriptionInProgress}
          chunk
          key={switch chunk.id {
          | Some(id) => id->Float.toString
          | _ => `${index->Int.toString}-${chunk.text}`
          }}
          removeChunk=subtitlesManager.removeChunk
          onTextChange=subtitlesManager.editText
          onTimestampChange=subtitlesManager.editTimestamp
          hasPauseBefore={subtitlesManager.hasPauseBefore(index)}
          hasPauseAfter={subtitlesManager.hasPauseAfter(index)}
          wordChunks={subtitlesManager.getWordChunksForCue(index)->Option.getOr([])}
          onAddBefore={() => {
            subtitlesManager.addCueBefore(index)
            // Focus the newly added cue (inserted at same index, pushing current down)
            setFocusCueIndex(_ => Some(index))
          }}
          onAddAfter={() => {
            subtitlesManager.addCueAfter(index)
            // Focus the newly added cue (inserted at index + 1)
            setFocusCueIndex(_ => Some(index + 1))
          }}
          onSplit={splitIdx => {
            subtitlesManager.splitCue(index, splitIdx)
            // Focus the second cue (newly created from split) at index + 1
            setFocusCueIndex(_ => Some(index + 1))
          }}
          splitPreview={splitPreviewState->Option.flatMap(
            ((cueIdx, splitAt)) => cueIdx == index ? Some(splitAt) : None,
          )}
          onSplitPreviewChange={preview =>
            setSplitPreviewState(_ => preview->Option.map(splitAt => (index, splitAt)))}
          isAnySplitPreviewActive={splitPreviewState->Option.isSome}
          shouldFocus={focusCueIndex->Option.map(i => i == index)->Option.getOr(false)}
          onFocused={() => setFocusCueIndex(_ => None)}
        />
      )
      ->React.array}
    </div>
  </>
})
