open Test

// Helper to create word chunk
let word = (text, startTs, endTs): WordTimestamps.wordChunk => {
  text,
  timestamp: (startTs, endTs),
}

// Helper for nullable end time
let ts = (_, endTs) => Js.Nullable.return(endTs)

// Helper to get text from result at index
let getText = (result: array<WordTimestamps.wordChunk>, idx) => (result->Array.getUnsafe(idx)).text

// Helper to get start timestamp from result at index
let getStart = (result: array<WordTimestamps.wordChunk>, idx) =>
  (result->Array.getUnsafe(idx)).timestamp->fst

// ============================================================================
// TOKENIZE TESTS
// ============================================================================

test("tokenize: basic", () => {
  let result = WordTimestamps.tokenize("hello world")
  Assert.intEqual(Array.length(result), 2)
  Assert.stringEqual(result->Array.getUnsafe(0), "hello")
  Assert.stringEqual(result->Array.getUnsafe(1), "world")
})

test("tokenize: extra spaces", () => {
  let result = WordTimestamps.tokenize("  hello   world  ")
  Assert.intEqual(Array.length(result), 2)
  Assert.stringEqual(result->Array.getUnsafe(0), "hello")
  Assert.stringEqual(result->Array.getUnsafe(1), "world")
})

test("tokenize: empty string", () => {
  let result = WordTimestamps.tokenize("")
  Assert.intEqual(Array.length(result), 0)
})

test("tokenize: single word", () => {
  let result = WordTimestamps.tokenize("hello")
  Assert.intEqual(Array.length(result), 1)
  Assert.stringEqual(result->Array.getUnsafe(0), "hello")
})

// ============================================================================
// LCS TESTS
// ============================================================================

test("computeLCS: identical arrays", () => {
  let result = WordTimestamps.computeLCS(["hello", "world"], ["hello", "world"])
  Assert.intEqual(Array.length(result), 2)
  Assert.intEqual(result->Array.getUnsafe(0)->fst, 0)
  Assert.intEqual(result->Array.getUnsafe(0)->snd, 0)
  Assert.intEqual(result->Array.getUnsafe(1)->fst, 1)
  Assert.intEqual(result->Array.getUnsafe(1)->snd, 1)
})

test("computeLCS: no matches", () => {
  let result = WordTimestamps.computeLCS(["hello", "world"], ["goodbye", "moon"])
  Assert.intEqual(Array.length(result), 0)
})

test("computeLCS: partial match", () => {
  let result = WordTimestamps.computeLCS(["hello", "world"], ["hello", "earth"])
  Assert.intEqual(Array.length(result), 1)
  Assert.intEqual(result->Array.getUnsafe(0)->fst, 0)
  Assert.intEqual(result->Array.getUnsafe(0)->snd, 0)
})

test("computeLCS: insertion in middle", () => {
  let result = WordTimestamps.computeLCS(["hello", "world"], ["hello", "beautiful", "world"])
  Assert.intEqual(Array.length(result), 2)
  // hello matches at (0, 0)
  Assert.intEqual(result->Array.getUnsafe(0)->fst, 0)
  Assert.intEqual(result->Array.getUnsafe(0)->snd, 0)
  // world matches at (1, 2)
  Assert.intEqual(result->Array.getUnsafe(1)->fst, 1)
  Assert.intEqual(result->Array.getUnsafe(1)->snd, 2)
})

// ============================================================================
// APPLY TEXT EDIT TESTS
// ============================================================================

test("applyTextEdit: no changes", () => {
  let words = [word("hello", 0.0, ts(0.0, 0.5)), word("world", 0.5, ts(0.5, 1.0))]
  let result = WordTimestamps.applyTextEdit(words, "hello world")

  Assert.intEqual(Array.length(result), 2)
  Assert.stringEqual(getText(result, 0), "hello")
  Assert.stringEqual(getText(result, 1), "world")
  Assert.floatEqual(getStart(result, 0), 0.0)
  Assert.floatEqual(getStart(result, 1), 0.5)
})

test("applyTextEdit: simple word replacement", () => {
  let words = [word("hello", 0.0, ts(0.0, 0.5)), word("world", 0.5, ts(0.5, 1.0))]
  let result = WordTimestamps.applyTextEdit(words, "hello earth")

  Assert.intEqual(Array.length(result), 2)
  Assert.stringEqual(getText(result, 0), "hello")
  Assert.stringEqual(getText(result, 1), "earth")
  // earth should inherit world's timestamp
  Assert.floatEqual(getStart(result, 1), 0.5)
})

test("applyTextEdit: word insertion in middle with gap merges into next match", () => {
  let words = [word("hello", 0.0, ts(0.0, 0.4)), word("world", 0.8, ts(0.8, 1.0))]
  let result = WordTimestamps.applyTextEdit(words, "hello beautiful world")

  // Inserted word should merge with the next matched word
  Assert.intEqual(Array.length(result), 2)
  Assert.stringEqual(getText(result, 0), "hello")
  Assert.stringEqual(getText(result, 1), "beautiful world")
  Assert.floatEqual(getStart(result, 0), 0.0)
  Assert.floatEqual(getStart(result, 1), 0.8)
})

test("applyTextEdit: word insertion at START merges with first word", () => {
  let words = [word("starting", 0.5, ts(0.5, 1.0))]
  let result = WordTimestamps.applyTextEdit(words, "I'm starting")

  Assert.intEqual(Array.length(result), 1)
  Assert.stringEqual(getText(result, 0), "I'm starting")
  // Should keep original timestamp
  Assert.floatEqual(getStart(result, 0), 0.5)
})

test("applyTextEdit: word insertion at END merges with last word", () => {
  let words = [word("ending", 0.0, ts(0.0, 0.5))]
  let result = WordTimestamps.applyTextEdit(words, "ending now")

  Assert.intEqual(Array.length(result), 1)
  Assert.stringEqual(getText(result, 0), "ending now")
  Assert.floatEqual(getStart(result, 0), 0.0)
})

test("applyTextEdit: multiple words inserted at START", () => {
  let words = [word("world", 0.5, ts(0.5, 1.0))]
  let result = WordTimestamps.applyTextEdit(words, "hello beautiful world")

  Assert.intEqual(Array.length(result), 1)
  Assert.stringEqual(getText(result, 0), "hello beautiful world")
  Assert.floatEqual(getStart(result, 0), 0.5)
})

test("applyTextEdit: multiple words inserted at END", () => {
  let words = [word("hello", 0.0, ts(0.0, 0.5))]
  let result = WordTimestamps.applyTextEdit(words, "hello beautiful world")

  Assert.intEqual(Array.length(result), 1)
  Assert.stringEqual(getText(result, 0), "hello beautiful world")
  Assert.floatEqual(getStart(result, 0), 0.0)
})

test("applyTextEdit: word deletion middle", () => {
  let words = [
    word("hello", 0.0, ts(0.0, 0.3)),
    word("beautiful", 0.3, ts(0.3, 0.6)),
    word("world", 0.6, ts(0.6, 1.0)),
  ]
  let result = WordTimestamps.applyTextEdit(words, "hello world")

  Assert.intEqual(Array.length(result), 2)
  Assert.stringEqual(getText(result, 0), "hello")
  Assert.stringEqual(getText(result, 1), "world")
  Assert.floatEqual(getStart(result, 0), 0.0)
  Assert.floatEqual(getStart(result, 1), 0.6)
})

test("applyTextEdit: word deletion at START", () => {
  let words = [word("oh", 0.0, ts(0.0, 0.3)), word("hello", 0.3, ts(0.3, 1.0))]
  let result = WordTimestamps.applyTextEdit(words, "hello")

  Assert.intEqual(Array.length(result), 1)
  Assert.stringEqual(getText(result, 0), "hello")
  Assert.floatEqual(getStart(result, 0), 0.3)
})

test("applyTextEdit: word deletion at END", () => {
  let words = [word("hello", 0.0, ts(0.0, 0.7)), word("there", 0.7, ts(0.7, 1.0))]
  let result = WordTimestamps.applyTextEdit(words, "hello")

  Assert.intEqual(Array.length(result), 1)
  Assert.stringEqual(getText(result, 0), "hello")
  Assert.floatEqual(getStart(result, 0), 0.0)
})

test("applyTextEdit: multiple insertions in middle merge into next match", () => {
  let words = [word("hello", 0.0, ts(0.0, 0.4)), word("world", 0.8, ts(0.8, 1.0))]
  let result = WordTimestamps.applyTextEdit(words, "hello big beautiful world")

  // All inserted words should merge with the next matched word
  Assert.intEqual(Array.length(result), 2)
  Assert.stringEqual(getText(result, 0), "hello")
  Assert.stringEqual(getText(result, 1), "big beautiful world")
  Assert.floatEqual(getStart(result, 0), 0.0)
  Assert.floatEqual(getStart(result, 1), 0.8)
})

test("applyTextEdit: mixed replacement and middle insertion", () => {
  let words = [
    word("hey", 0.0, ts(0.0, 0.3)),
    word("hello", 0.3, ts(0.3, 0.5)),
    word("world", 0.7, ts(0.7, 1.0)),
  ]
  let result = WordTimestamps.applyTextEdit(words, "hey helo beautiful world")

  // LCS matches "hey" (0,0) and "world" (2,3)
  // "helo" gets "hello"'s timestamp, "beautiful" merges with "world"
  Assert.intEqual(Array.length(result), 3)
  Assert.stringEqual(getText(result, 0), "hey")
  Assert.stringEqual(getText(result, 1), "helo")
  Assert.stringEqual(getText(result, 2), "beautiful world")
  Assert.floatEqual(getStart(result, 0), 0.0)
  Assert.floatEqual(getStart(result, 1), 0.3)
  Assert.floatEqual(getStart(result, 2), 0.7)
})

test("applyTextEdit: complete rewrite (0% overlap)", () => {
  let words = [word("hello", 0.0, ts(0.0, 0.5)), word("world", 0.5, ts(0.5, 1.0))]
  let result = WordTimestamps.applyTextEdit(words, "goodbye moon")

  Assert.intEqual(Array.length(result), 1)
  Assert.stringEqual(getText(result, 0), "goodbye moon")
  Assert.floatEqual(getStart(result, 0), 0.0)
})

test("applyTextEdit: empty new text", () => {
  let words = [word("hello", 0.0, ts(0.0, 1.0))]
  let result = WordTimestamps.applyTextEdit(words, "")

  Assert.intEqual(Array.length(result), 0)
})

test("applyTextEdit: insertions with no gap merge into next match", () => {
  let words = [word("hello", 0.0, ts(0.0, 0.5)), word("world", 0.5, ts(0.5, 1.0))]
  let result = WordTimestamps.applyTextEdit(words, "hello beautiful world")

  // Inserted word merges with next matched word
  Assert.intEqual(Array.length(result), 2)
  Assert.stringEqual(getText(result, 0), "hello")
  Assert.stringEqual(getText(result, 1), "beautiful world")
  Assert.floatEqual(getStart(result, 0), 0.0)
  Assert.floatEqual(getStart(result, 1), 0.5)
})

test("applyTextEdit: start AND end insertions merge", () => {
  let words = [word("hello", 0.3, ts(0.3, 0.7))]
  let result = WordTimestamps.applyTextEdit(words, "oh hello there")

  Assert.intEqual(Array.length(result), 1)
  Assert.stringEqual(getText(result, 0), "oh hello there")
  Assert.floatEqual(getStart(result, 0), 0.3)
})

test("applyTextEdit: complex start merge + middle insert + end merge", () => {
  let words = [word("hello", 0.0, ts(0.0, 0.3)), word("world", 0.7, ts(0.7, 1.0))]
  let result = WordTimestamps.applyTextEdit(words, "oh hello beautiful world indeed")

  // "oh" merges with first match "hello"
  // "beautiful" merges with second match "world"
  // "indeed" merges with last match "world" (at end)
  Assert.intEqual(Array.length(result), 2)
  Assert.stringEqual(getText(result, 0), "oh hello")
  Assert.stringEqual(getText(result, 1), "beautiful world indeed")
  Assert.floatEqual(getStart(result, 0), 0.0)
  Assert.floatEqual(getStart(result, 1), 0.7)
})

test("applyTextEdit: single word unchanged", () => {
  let words = [word("hello", 0.0, ts(0.0, 1.0))]
  let result = WordTimestamps.applyTextEdit(words, "hello")

  Assert.intEqual(Array.length(result), 1)
  Assert.stringEqual(getText(result, 0), "hello")
  Assert.floatEqual(getStart(result, 0), 0.0)
})

// ============================================================================
// PUNCTUATION PRESERVATION TESTS
// ============================================================================

test("applyTextEdit: punctuation added to word should match and preserve timestamp", () => {
  let words = [word("Hello", 0.0, ts(0.0, 0.5)), word("world", 0.5, ts(0.5, 1.0))]
  // Add comma and exclamation - should still match words
  let result = WordTimestamps.applyTextEdit(words, "Hello, world!")

  Assert.intEqual(Array.length(result), 2)
  Assert.stringEqual(getText(result, 0), "Hello,")
  Assert.stringEqual(getText(result, 1), "world!")
  Assert.floatEqual(getStart(result, 0), 0.0)
  Assert.floatEqual(getStart(result, 1), 0.5)
})

test("applyTextEdit: insert word with punctuation", () => {
  let words = [word("Hello", 0.0, ts(0.0, 0.5)), word("world", 0.5, ts(0.5, 1.0))]
  let result = WordTimestamps.applyTextEdit(words, "Hello, beautiful world!")

  // Inserted word merges with next matched word
  Assert.intEqual(Array.length(result), 2)
  Assert.stringEqual(getText(result, 0), "Hello,")
  Assert.stringEqual(getText(result, 1), "beautiful world!")
  Assert.floatEqual(getStart(result, 0), 0.0)
  Assert.floatEqual(getStart(result, 1), 0.5)
})

test("applyTextEdit: case change should preserve timestamp", () => {
  let words = [word("hello", 0.0, ts(0.0, 0.5)), word("world", 0.5, ts(0.5, 1.0))]
  // Change case - should still match
  let result = WordTimestamps.applyTextEdit(words, "HELLO WORLD")

  Assert.intEqual(Array.length(result), 2)
  Assert.stringEqual(getText(result, 0), "HELLO")
  Assert.stringEqual(getText(result, 1), "WORLD")
  Assert.floatEqual(getStart(result, 0), 0.0)
  Assert.floatEqual(getStart(result, 1), 0.5)
})

test("applyTextEdit: replace word with two words merges into single chunk", () => {
  // User scenario: "Hello world" -> "Hello freaking world"
  // "freaking" replaces nothing (world still matches), so it merges with "world"
  let words = [word("Hello", 0.0, ts(0.0, 0.5)), word("world", 0.5, ts(0.5, 1.0))]
  let result = WordTimestamps.applyTextEdit(words, "Hello freaking world")

  Assert.intEqual(Array.length(result), 2)
  Assert.stringEqual(getText(result, 0), "Hello")
  Assert.stringEqual(getText(result, 1), "freaking world")
  // "freaking world" should be highlighted together with world's timestamp
  Assert.floatEqual(getStart(result, 0), 0.0)
  Assert.floatEqual(getStart(result, 1), 0.5)
})

test("applyTextEdit: replace first word with multiple words", () => {
  // "Hello world" -> "Oh hi Hello world" where "Hello" matches
  let words = [word("Hello", 0.0, ts(0.0, 0.5)), word("world", 0.5, ts(0.5, 1.0))]
  let result = WordTimestamps.applyTextEdit(words, "Oh hi Hello world")

  Assert.intEqual(Array.length(result), 2)
  Assert.stringEqual(getText(result, 0), "Oh hi Hello")
  Assert.stringEqual(getText(result, 1), "world")
  Assert.floatEqual(getStart(result, 0), 0.0)
  Assert.floatEqual(getStart(result, 1), 0.5)
})

test("applyTextEdit: replace last word with multiple words", () => {
  // "Hello world" -> "Hello world indeed friend"
  let words = [word("Hello", 0.0, ts(0.0, 0.5)), word("world", 0.5, ts(0.5, 1.0))]
  let result = WordTimestamps.applyTextEdit(words, "Hello world indeed friend")

  Assert.intEqual(Array.length(result), 2)
  Assert.stringEqual(getText(result, 0), "Hello")
  Assert.stringEqual(getText(result, 1), "world indeed friend")
  Assert.floatEqual(getStart(result, 0), 0.0)
  Assert.floatEqual(getStart(result, 1), 0.5)
})
