// WordTimestamps.res - Handles word-level timestamp preservation during text edits

@genType
type wordChunk = {
  text: string,
  timestamp: Subtitles.timestamp,
}

let start = (chunk: wordChunk) => chunk.timestamp->fst

let end_ = (chunk: wordChunk) => chunk.timestamp->snd

let normalizeWord = (s: string): string => {
  s
  ->String.toLowerCase
  ->String.replaceRegExp(%re("/[^a-z0-9\u00C0-\u024F]/g"), "") // Keep letters, numbers, accented chars
}

let tokenize = (text: string): array<string> => {
  text
  ->String.trim
  ->String.split(" ")
  ->Array.filter(s => s->String.trim !== "")
}

let computeLCS = (oldTokens: array<string>, newTokens: array<string>): array<(int, int)> => {
  let m = Array.length(oldTokens)
  let n = Array.length(newTokens)

  if m == 0 || n == 0 {
    []
  } else {
    // Normalize tokens for comparison
    let oldNormalized = oldTokens->Array.map(normalizeWord)
    let newNormalized = newTokens->Array.map(normalizeWord)

    // Build DP table
    let dp = Array.fromInitializer(~length=m + 1, _ => {
      Array.make(~length=n + 1, 0)
    })

    for i in 1 to m {
      for j in 1 to n {
        let dpRow = dp->Array.getUnsafe(i)
        let dpPrevRow = dp->Array.getUnsafe(i - 1)

        let oldNorm = oldNormalized->Array.getUnsafe(i - 1)
        let newNorm = newNormalized->Array.getUnsafe(j - 1)

        // Match if normalized versions are equal AND both are non-empty
        if oldNorm !== "" && newNorm !== "" && oldNorm == newNorm {
          dpRow->Array.setUnsafe(j, dpPrevRow->Array.getUnsafe(j - 1) + 1)
        } else {
          let fromTop = dpPrevRow->Array.getUnsafe(j)
          let fromLeft = dpRow->Array.getUnsafe(j - 1)
          dpRow->Array.setUnsafe(j, max(fromTop, fromLeft))
        }
      }
    }

    // Backtrack to find the actual LCS indices
    let result = []
    let i = ref(m)
    let j = ref(n)

    while i.contents > 0 && j.contents > 0 {
      let dpRow = dp->Array.getUnsafe(i.contents)
      let dpPrevRow = dp->Array.getUnsafe(i.contents - 1)

      let oldNorm = oldNormalized->Array.getUnsafe(i.contents - 1)
      let newNorm = newNormalized->Array.getUnsafe(j.contents - 1)

      if oldNorm !== "" && newNorm !== "" && oldNorm == newNorm {
        result->Array.push((i.contents - 1, j.contents - 1))
        i := i.contents - 1
        j := j.contents - 1
      } else if dpPrevRow->Array.getUnsafe(j.contents) > dpRow->Array.getUnsafe(j.contents - 1) {
        i := i.contents - 1
      } else {
        j := j.contents - 1
      }
    }

    // Result is built in reverse order, so reverse it
    result->Array.toReversed
  }
}

// Interpolate timestamps for inserted words in a gap
// Returns timestamps for `count` words in the range [prevEnd, nextStart]
let interpolateTimestamps = (~prevEnd: float, ~nextStart: float, ~count: int): array<
  Subtitles.timestamp,
> => {
  if count <= 0 {
    []
  } else {
    let gap = nextStart -. prevEnd
    let segmentDuration = if gap > 0.0 {
      gap /. Int.toFloat(count)
    } else {
      0.0
    }

    Array.fromInitializer(~length=count, i => {
      let startTime = prevEnd +. Int.toFloat(i) *. segmentDuration
      let endTime = prevEnd +. Int.toFloat(i + 1) *. segmentDuration
      (startTime, Js.Nullable.return(endTime))
    })
  }
}

let applyTextEdit = (oldWords: array<wordChunk>, newText: string): array<wordChunk> => {
  let newTokens = tokenize(newText)
  let oldCount = Array.length(oldWords)
  let newCount = Array.length(newTokens)

  // Handle empty new text - return empty array
  if newCount == 0 {
    []
  } else if oldCount == 0 {
    // Handle empty old words - return single chunk with new text
    [{text: newText, timestamp: (0.0, Js.Nullable.null)}]
  } else {
    let oldTokens = oldWords->Array.map(w => w.text)
    let matches = computeLCS(oldTokens, newTokens)

    // If no matches (complete rewrite), return single chunk with full time range
    if Array.length(matches) == 0 {
      let firstStart = oldWords->Array.getUnsafe(0)->start
      let lastEnd = oldWords->Array.getUnsafe(oldCount - 1)->end_
      [{text: newText, timestamp: (firstStart, lastEnd)}]
    } else {
      let result: array<wordChunk> = []
      let numMatches = Array.length(matches)

      // Get first and last match info
      let (firstMatchOldIdx, firstMatchNewIdx) = matches->Array.getUnsafe(0)
      let (lastMatchOldIdx, lastMatchNewIdx) = matches->Array.getUnsafe(numMatches - 1)

      // Check if there are old words BEFORE first match
      let hasOldWordsBefore = firstMatchOldIdx > 0
      // Check if there are old words AFTER last match
      let hasOldWordsAfter = lastMatchOldIdx < oldCount - 1

      // Handle tokens BEFORE the first match
      if firstMatchNewIdx > 0 {
        let newTokensBefore = newTokens->Array.slice(~start=0, ~end=firstMatchNewIdx)

        if hasOldWordsBefore {
          // Distribute new tokens across old timestamps before first match
          let oldWordsBefore = oldWords->Array.slice(~start=0, ~end=firstMatchOldIdx)
          let newCountBefore = Array.length(newTokensBefore)
          let oldCountBefore = Array.length(oldWordsBefore)

          // Assign old timestamps to first N new tokens
          let assignCount = min(newCountBefore, oldCountBefore)
          for i in 0 to assignCount - 1 {
            let token = newTokensBefore->Array.getUnsafe(i)
            let ts = (oldWordsBefore->Array.getUnsafe(i)).timestamp
            result->Array.push({text: token, timestamp: ts})
          }

          // If more new tokens than old, merge remainder into first match
          // (will be handled when adding first match)
        }
        // If no old words before, tokens will be merged into first match
      }

      // Compute startMergeText (tokens before first match that couldn't be assigned)
      let startMergeText = if firstMatchNewIdx > 0 && !hasOldWordsBefore {
        // All tokens before first match merge into it
        newTokens->Array.slice(~start=0, ~end=firstMatchNewIdx)->Array.join(" ")
      } else if firstMatchNewIdx > 0 && hasOldWordsBefore {
        // Check if there are excess tokens
        let newCountBefore = firstMatchNewIdx
        let oldCountBefore = firstMatchOldIdx
        if newCountBefore > oldCountBefore {
          newTokens->Array.slice(~start=oldCountBefore, ~end=firstMatchNewIdx)->Array.join(" ")
        } else {
          ""
        }
      } else {
        ""
      }

      // Process each match
      matches->Array.forEachWithIndex((match_, matchIdx) => {
        let (oldIdx, newIdx) = match_

        // Handle tokens BETWEEN previous match and current match
        if matchIdx > 0 {
          let (prevOldIdx, prevNewIdx) = matches->Array.getUnsafe(matchIdx - 1)

          // New tokens between matches
          let newTokensBetween = newTokens->Array.slice(~start=prevNewIdx + 1, ~end=newIdx)
          // Old words between matches
          let oldWordsBetween = oldWords->Array.slice(~start=prevOldIdx + 1, ~end=oldIdx)

          let newCountBetween = Array.length(newTokensBetween)
          let oldCountBetween = Array.length(oldWordsBetween)

          if newCountBetween > 0 {
            if oldCountBetween > 0 {
              // Assign old timestamps to first N new tokens
              let assignCount = min(newCountBetween, oldCountBetween)

              for i in 0 to assignCount - 1 {
                let token = newTokensBetween->Array.getUnsafe(i)
                let ts = (oldWordsBetween->Array.getUnsafe(i)).timestamp
                result->Array.push({text: token, timestamp: ts})
              }

              // Interpolate remaining new tokens
              if newCountBetween > oldCountBetween {
                let remainingNewTokens = newTokensBetween->Array.sliceToEnd(~start=assignCount)
                let lastUsedOld = oldWordsBetween->Array.getUnsafe(assignCount - 1)
                let prevEnd =
                  lastUsedOld->end_->Js.Nullable.toOption->Option.getOr(lastUsedOld->start)
                let nextStart = oldWords->Array.getUnsafe(oldIdx)->start

                let timestamps = interpolateTimestamps(
                  ~prevEnd,
                  ~nextStart,
                  ~count=Array.length(remainingNewTokens),
                )

                remainingNewTokens->Array.forEachWithIndex((token, i) => {
                  result->Array.push({text: token, timestamp: timestamps->Array.getUnsafe(i)})
                })
              }
            } else {
              // No old words in gap - interpolate all new tokens
              let prevEnd =
                oldWords
                ->Array.getUnsafe(prevOldIdx)
                ->end_
                ->Js.Nullable.toOption
                ->Option.getOr(oldWords->Array.getUnsafe(prevOldIdx)->start)
              let nextStart = oldWords->Array.getUnsafe(oldIdx)->start

              let timestamps = interpolateTimestamps(~prevEnd, ~nextStart, ~count=newCountBetween)

              newTokensBetween->Array.forEachWithIndex((token, i) => {
                result->Array.push({text: token, timestamp: timestamps->Array.getUnsafe(i)})
              })
            }
          }
        }

        // Add the matched word - USE THE NEW TOKEN (preserves user's punctuation/casing)
        let originalTs = (oldWords->Array.getUnsafe(oldIdx)).timestamp
        let matchedToken = newTokens->Array.getUnsafe(newIdx)

        // Merge with start tokens if first match
        let finalText = if matchIdx == 0 && startMergeText !== "" {
          startMergeText ++ " " ++ matchedToken
        } else {
          matchedToken
        }

        result->Array.push({text: finalText, timestamp: originalTs})
      })

      // Handle tokens AFTER the last match
      let newTokensAfterStart = lastMatchNewIdx + 1
      if newTokensAfterStart < newCount {
        let newTokensAfter = newTokens->Array.sliceToEnd(~start=newTokensAfterStart)
        let newCountAfter = Array.length(newTokensAfter)

        if hasOldWordsAfter {
          // Distribute new tokens across old timestamps after last match
          let oldWordsAfter = oldWords->Array.sliceToEnd(~start=lastMatchOldIdx + 1)
          let oldCountAfter = Array.length(oldWordsAfter)

          // Assign old timestamps to first N new tokens
          let assignCount = min(newCountAfter, oldCountAfter)
          for i in 0 to assignCount - 1 {
            let token = newTokensAfter->Array.getUnsafe(i)
            let ts = (oldWordsAfter->Array.getUnsafe(i)).timestamp
            result->Array.push({text: token, timestamp: ts})
          }

          // If more new tokens than old, merge remainder into last word
          if newCountAfter > oldCountAfter {
            let excessTokens = newTokensAfter->Array.sliceToEnd(~start=assignCount)
            let excessText = excessTokens->Array.join(" ")

            // Update last result item to include excess text
            let lastIdx = Array.length(result) - 1
            let lastChunk = result->Array.getUnsafe(lastIdx)
            result->Array.setUnsafe(
              lastIdx,
              {
                ...lastChunk,
                text: lastChunk.text ++ " " ++ excessText,
              },
            )
          }
        } else {
          // No old words after last match - merge all into last matched word
          let lastIdx = Array.length(result) - 1
          let lastChunk = result->Array.getUnsafe(lastIdx)
          result->Array.setUnsafe(
            lastIdx,
            {
              ...lastChunk,
              text: lastChunk.text ++ " " ++ newTokensAfter->Array.join(" "),
            },
          )
        }
      }

      result
    }
  }
}
